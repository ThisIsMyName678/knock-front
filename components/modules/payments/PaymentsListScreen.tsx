import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { LinkKind } from '@/lib/mocks/contracts';
import {
  MOCK_PAYMENTS_LIST,
  PAYMENT_ENTITY_OPTIONS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
  filterPaymentRows,
  sortPaymentRows,
  type PaymentListGroupFilter,
  type PaymentListRow,
  type PaymentSortKey,
  type SortDir,
  type StatusBucket,
} from '@/lib/mocks/payments';
import { formatDigitRunsInText, formatIlsInteger } from '@/lib/format/currency';
import { DrawerMenu } from '@/components/ui/DrawerMenu';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  FontFamily,
  FontSize,
  CONTENT_HORIZONTAL_PADDING,
  MIN_TOUCH,
} from '@/constants/tokens';

type ScopeFilter = 'all' | 'by_asset' | 'by_project';

const SCOPE_OPTIONS: { key: ScopeFilter; label: string }[] = [
  { key: 'all', label: 'כללי' },
  { key: 'by_asset', label: 'לפי נכס' },
  { key: 'by_project', label: 'לפי פרויקט' },
];

const GROUP_OPTIONS: { key: PaymentListGroupFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'rent', label: 'שכירות' },
  { key: 'bills', label: 'חשבונות' },
  { key: 'maintenance', label: 'תחזוקה' },
  { key: 'guarantees', label: 'ערבויות/בטחונות' },
];

const STATUS_TABS: { key: StatusBucket | 'all'; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'future', label: 'תשלומים עתידיים' },
  { key: 'received', label: 'תשלומים שהתקבלו' },
  { key: 'overdue', label: 'תשלומים באיחור' },
];

const COLUMNS: { key: PaymentSortKey; label: string; flex?: number }[] = [
  { key: 'displayName', label: 'שם התשלום', flex: 1.1 },
  { key: 'paymentType', label: 'סוג תשלום', flex: 0.75 },
  { key: 'mode', label: 'אופן תשלום', flex: 0.65 },
  { key: 'indexed', label: 'הצמדה למדד', flex: 0.45 },
  { key: 'linkLabel', label: 'שיוך', flex: 0.75 },
  { key: 'dueDate', label: 'מועד ביצוע', flex: 0.65 },
  { key: 'progressLabel', label: 'נותר', flex: 0.85 },
  { key: 'amount', label: 'סכום', flex: 0.7 },
];

function linkScopeFromScope(scope: ScopeFilter): 'all' | LinkKind {
  if (scope === 'by_asset') return 'asset';
  if (scope === 'by_project') return 'project';
  return 'all';
}

function paramStr(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

export function PaymentsListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    dateFrom?: string;
    dateTo?: string;
    statusTab?: string;
    excludeReceived?: string;
  }>();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<PaymentListGroupFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusBucket | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<PaymentSortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const df = paramStr(params.dateFrom);
    const dt = paramStr(params.dateTo);
    const st = paramStr(params.statusTab);
    if (df) setDateFrom(df);
    if (dt) setDateTo(dt);
    if (st === 'all' || st === 'future' || st === 'received' || st === 'overdue') {
      setStatusTab(st);
    }
  }, [params.dateFrom, params.dateTo, params.statusTab]);

  const excludeReceived = paramStr(params.excludeReceived) === '1';

  const linkScope = linkScopeFromScope(scope);

  const onHeaderPress = useCallback((key: PaymentSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const filtered = useMemo(
    () =>
      filterPaymentRows(MOCK_PAYMENTS_LIST, {
        search,
        linkScope,
        entityId,
        groupFilter,
        statusTab,
        dateFrom,
        dateTo,
        excludeReceived: excludeReceived || undefined,
      }),
    [search, linkScope, entityId, groupFilter, statusTab, dateFrom, dateTo, excludeReceived],
  );

  const sorted = useMemo(() => sortPaymentRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const totals = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const p of sorted) {
      if (p.direction === 'inbound') inSum += p.amount;
      else outSum += p.amount;
    }
    return { inSum, outSum, net: inSum - outSum };
  }, [sorted]);

  const summaryScopeLabel = useMemo(() => {
    if (scope === 'all') return 'כללי';
    if (!entityId) return scope === 'by_asset' ? 'לפי נכס — כל הישויות' : 'לפי פרויקט — כל הישויות';
    const e = PAYMENT_ENTITY_OPTIONS.find((x) => x.id === entityId);
    if (!e) return '';
    return `${e.kind === 'asset' ? 'נכס' : 'פרויקט'}: ${e.name}`;
  }, [scope, entityId]);

  const exportData = useCallback(async () => {
    const header = 'שם,סוג,אופן,מדד,שיוך,מועד,נותר,סכום,כיוון\n';
    const lines = sorted.map((r) =>
      [
        `"${r.displayName}"`,
        PAYMENT_TYPE_LABELS[r.paymentType],
        PAYMENT_MODE_LABELS[r.mode],
        r.indexed ? 'כן' : 'לא',
        `"${r.linkLabel}"`,
        r.dueDate,
        `"${formatDigitRunsInText(r.progressLabel)}"`,
        formatIlsInteger(r.amount),
        r.direction === 'inbound' ? 'הכנסה' : 'הוצאה',
      ].join(','),
    );
    try {
      await Share.share({ message: header + lines.join('\n'), title: 'ייצוא תשלומים' });
    } catch {
      /* ignore */
    }
  }, [sorted]);

  const onRowDownload = useCallback((r: PaymentListRow) => {
    Alert.alert('הורדה', `במימוש אמיתי יורד מסמך עבור "${r.displayName}".`, [{ text: 'אישור' }]);
  }, []);

  const onRowShare = useCallback(async (r: PaymentListRow) => {
    try {
      await Share.share({
        message: `${r.displayName}\n${PAYMENT_TYPE_LABELS[r.paymentType]}\nמועד: ${r.dueDate}\n${r.direction === 'inbound' ? 'הכנסה' : 'הוצאה'}: ₪${formatIlsInteger(r.amount)}`,
        title: r.displayName,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const onRowDuplicate = useCallback((r: PaymentListRow) => {
    Alert.alert('שכפול', `ייווצר עותק טיוטה של "${r.displayName}" בהמשך.`, [{ text: 'אישור' }]);
  }, []);

  const onRowEdit = useCallback((r: PaymentListRow) => {
    Alert.alert('עריכה', `מסך עריכה לתשלום "${r.displayName}" יתחבר ל-API בהמשך.`, [{ text: 'אישור' }]);
  }, []);

  const onRowDelete = useCallback((r: PaymentListRow) => {
    Alert.alert('מחיקה', `למחוק את "${r.displayName}"?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => {} },
    ]);
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="תפריט ראשי">
          <MaterialCommunityIcons name="menu" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary" style={{ flex: 1, textAlign: 'right' }}>
          תשלומים
        </AppText>
        <View style={styles.headerActions}>
          <Pressable onPress={exportData} style={styles.headerIconBtn} accessibilityRole="button" accessibilityLabel="יצוא">
            <MaterialCommunityIcons name="tray-arrow-up" size={22} color={Colors.onPrimary} />
          </Pressable>
          <Pressable onPress={() => router.push('/(app)/payments/new')} style={styles.addBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Economic snapshot */}
      <View style={styles.summaryCard}>
        <AppText variant="labelSm" weight="bold" color="onPrimary" style={styles.summaryTitle}>
          תמונת מצב כלכלית (לפי סינון)
        </AppText>
        <AppText variant="caption" color="onPrimary" style={{ textAlign: 'right', opacity: 0.88, marginBottom: Spacing.xs }}>
          פילוח: {summaryScopeLabel}
        </AppText>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="onPrimary" style={{ opacity: 0.85 }}>
              הכנסות
            </AppText>
            <AppText variant="headingSm" weight="bold" style={{ color: Colors.success }}>
              +₪{formatIlsInteger(totals.inSum)}
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="onPrimary" style={{ opacity: 0.85 }}>
              הוצאות
            </AppText>
            <AppText variant="headingSm" weight="bold" style={{ color: Colors.outbound }}>
              −₪{formatIlsInteger(totals.outSum)}
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="onPrimary" style={{ opacity: 0.85 }}>
              יתרה
            </AppText>
            <AppText variant="headingSm" weight="extraBold" color="onPrimary">
              {totals.net >= 0 ? '+' : ''}₪{formatIlsInteger(Math.abs(totals.net))}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.toolbar}>
        <AppText variant="labelMd" weight="bold" style={styles.toolbarSectionTitle}>
          בראש הדף
        </AppText>
        <AppText variant="caption" color="variant" style={styles.toolbarSectionSub}>
          חיפוש · סינון נכס/פרויקט · סוג תשלום · סטטוס · טווח תאריכים · ייצוא מהכותרת · מיון מעמודות
        </AppText>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.onSurfaceMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש חופשי..."
            placeholderTextColor={Colors.onSurfaceMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="נקה חיפוש">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          סינון לפי נכס / פרויקט
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {SCOPE_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                setScope(o.key);
                setEntityId(null);
              }}
              style={[styles.chip, scope === o.key && styles.chipActive]}
              accessibilityRole="button"
            >
              <AppText
                variant="labelMd"
                weight={scope === o.key ? 'bold' : 'regular'}
                style={{ color: scope === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {(scope === 'by_asset' || scope === 'by_project') && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Pressable onPress={() => setEntityId(null)} style={[styles.chip, entityId === null && styles.chipActive]}>
              <AppText variant="labelMd" weight={entityId === null ? 'bold' : 'regular'} style={{ color: entityId === null ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                כל הישויות
              </AppText>
            </Pressable>
            {PAYMENT_ENTITY_OPTIONS.filter((e) => e.kind === (scope === 'by_asset' ? 'asset' : 'project')).map((e) => (
              <Pressable key={e.id} onPress={() => setEntityId(e.id)} style={[styles.chip, entityId === e.id && styles.chipActive]}>
                <AppText variant="labelMd" weight={entityId === e.id ? 'bold' : 'regular'} numberOfLines={1} style={{ color: entityId === e.id ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {e.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          סוג תשלום
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {GROUP_OPTIONS.map((o) => (
            <Pressable key={o.key} onPress={() => setGroupFilter(o.key)} style={[styles.chip, groupFilter === o.key && styles.chipActive]}>
              <AppText variant="labelMd" weight={groupFilter === o.key ? 'bold' : 'regular'} style={{ color: groupFilter === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          סטטוס (עתידיים / התקבלו / באיחור)
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {STATUS_TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setStatusTab(t.key)} style={[styles.chip, statusTab === t.key && styles.chipActive]}>
              <AppText variant="labelMd" weight={statusTab === t.key ? 'bold' : 'regular'} style={{ color: statusTab === t.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {t.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          טווח תאריכים (מועד ביצוע)
        </AppText>
        <View style={styles.dateRow}>
          <TextInput style={styles.dateInput} placeholder="מ־ DD/MM/YYYY" placeholderTextColor={Colors.onSurfaceMuted} value={dateFrom} onChangeText={setDateFrom} textAlign="right" />
          <TextInput style={styles.dateInput} placeholder="עד DD/MM/YYYY" placeholderTextColor={Colors.onSurfaceMuted} value={dateTo} onChangeText={setDateTo} textAlign="right" />
        </View>
      </View>

      <AppText variant="caption" color="variant" style={styles.sortHint}>
        לחיצה על כותרת עמודה משנה את סדר המיון (עולה / יורד)
      </AppText>

      <View style={styles.tableHeader}>
        {COLUMNS.map((col) => {
          const active = sortKey === col.key;
          return (
            <Pressable
              key={col.key}
              onPress={() => onHeaderPress(col.key)}
              style={[styles.thCell, col.flex ? { flex: col.flex } : { flex: 1 }]}
              accessibilityRole="button"
            >
              <AppText variant="labelSm" weight="bold" color="primary" numberOfLines={2} align="right">
                {col.label}
              </AppText>
              {active && (
                <MaterialCommunityIcons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={Colors.primary} />
              )}
            </Pressable>
          );
        })}
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          title="אין תשלומים"
          description="שנה סינון או טווח תאריכים"
          icon={<MaterialCommunityIcons name="cash-multiple" size={32} color={Colors.primary} />}
          actionLabel="תשלום חדש"
          onAction={() => router.push('/(app)/payments/new')}
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const inbound = item.direction === 'inbound';
            const amtColor = inbound ? Colors.inbound : Colors.outbound;
            return (
              <View style={styles.tableRowWrap}>
                <Pressable
                  onPress={() => router.push(`/(app)/payments/${item.id}`)}
                  style={({ pressed }) => [styles.tableRow, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                >
                  <View style={[styles.td, { flex: 1.1 }]}>
                    <AppText variant="bodySm" weight="semiBold" numberOfLines={2}>
                      {item.displayName}
                    </AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.75 }]}>
                    <AppText variant="caption" color="variant" numberOfLines={2}>
                      {PAYMENT_TYPE_LABELS[item.paymentType]}
                    </AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.65 }]}>
                    <AppText variant="caption" numberOfLines={1}>
                      {PAYMENT_MODE_LABELS[item.mode]}
                    </AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.45 }]}>
                    <AppText variant="caption">{item.indexed ? 'כן' : 'לא'}</AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.75 }]}>
                    <AppText variant="caption" numberOfLines={1}>
                      {item.linkLabel}
                    </AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.65 }]}>
                    <AppText variant="caption" color="muted">
                      {item.dueDate}
                    </AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.85 }]}>
                    <AppText variant="caption" numberOfLines={2}>
                      {formatDigitRunsInText(item.progressLabel)}
                    </AppText>
                  </View>
                  <View style={[styles.td, { flex: 0.7, alignItems: 'flex-end' }]}>
                    <View style={styles.amountCell}>
                      <MaterialCommunityIcons name="currency-ils" size={14} color={amtColor} />
                      <AppText variant="bodySm" weight="bold" style={{ color: amtColor }}>
                        {inbound ? '+' : '−'}{formatIlsInteger(item.amount)}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.rowQuickActions}>
                  <Pressable onPress={() => onRowDownload(item)} style={styles.rowQuickBtn} accessibilityLabel="הורדה">
                    <MaterialCommunityIcons name="download-outline" size={18} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => onRowShare(item)} style={styles.rowQuickBtn} accessibilityLabel="שיתוף">
                    <MaterialCommunityIcons name="share-variant-outline" size={18} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => onRowDuplicate(item)} style={styles.rowQuickBtn} accessibilityLabel="שכפול">
                    <MaterialCommunityIcons name="content-copy" size={18} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => onRowEdit(item)} style={styles.rowQuickBtn} accessibilityLabel="עריכה">
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => onRowDelete(item)} style={styles.rowQuickBtn} accessibilityLabel="מחיקה">
                    <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    ...Shadow.md,
  },
  headerActions: { flexDirection: 'row-reverse', gap: Spacing.sm },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  summaryTitle: { textAlign: 'right', opacity: 0.95 },
  summaryRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'flex-end', gap: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: Spacing.sm },
  toolbar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    paddingBottom: Spacing.sm,
  },
  toolbarSectionTitle: {
    textAlign: 'right',
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.md,
    color: Colors.onBackground,
  },
  toolbarSectionSub: {
    textAlign: 'right',
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginBottom: Spacing.sm,
  },
  filterLabel: { textAlign: 'right', marginRight: CONTENT_HORIZONTAL_PADDING, marginTop: Spacing.xs },
  sortHint: {
    textAlign: 'right',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.xs,
    paddingBottom: 2,
    backgroundColor: Colors.surface,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    minHeight: 34,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    paddingVertical: 0,
  },
  dateRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    backgroundColor: Colors.surfaceVariant,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  thCell: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
    minHeight: MIN_TOUCH,
  },
  tableRowWrap: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  rowQuickActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  rowQuickBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  amountCell: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  td: { paddingHorizontal: 2, justifyContent: 'center' },
});
