import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection, DateRangeQuickPreset } from '@/components/ui/FilterSheet';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  MOCK_PAYMENTS_LIST,
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
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';

type DirectionFilter = 'all' | 'inbound' | 'outbound';

const DIRECTION_OPTIONS: { key: DirectionFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'inbound', label: 'הכנסות' },
  { key: 'outbound', label: 'הוצאות' },
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

function pad2(n: number) { return String(n).padStart(2, '0'); }
function todayDdMmYyyy() {
  const d = new Date();
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function startOfMonthDdMmYyyy() {
  const d = new Date();
  return `01/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function startOfYearDdMmYyyy() {
  return `01/01/${new Date().getFullYear()}`;
}

const DATE_QUICK_PRESETS: DateRangeQuickPreset[] = [
  { label: 'מתחילת החודש', from: startOfMonthDdMmYyyy(), to: todayDdMmYyyy() },
  { label: 'מתחילת השנה', from: startOfYearDdMmYyyy(), to: todayDdMmYyyy() },
];

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
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [groupFilter, setGroupFilter] = useState<PaymentListGroupFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusBucket | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<PaymentSortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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

  const filtered = useMemo(() => {
    const base = filterPaymentRows(MOCK_PAYMENTS_LIST, {
      search,
      linkScope: 'all',
      entityId: null,
      groupFilter,
      statusTab,
      dateFrom,
      dateTo,
      excludeReceived: excludeReceived || undefined,
    });
    if (directionFilter === 'all') return base;
    return base.filter((r) => r.direction === directionFilter);
  }, [search, directionFilter, groupFilter, statusTab, dateFrom, dateTo, excludeReceived]);

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
    if (directionFilter === 'inbound') return 'הכנסות בלבד';
    if (directionFilter === 'outbound') return 'הוצאות בלבד';
    return 'כללי';
  }, [directionFilter]);

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

  const activeSecondaryCount = useMemo(() => {
    let count = 0;
    if (directionFilter !== 'all') count++;
    if (groupFilter !== 'all') count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [directionFilter, groupFilter, dateFrom, dateTo]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        kind: 'chips',
        label: 'כיוון תשלום',
        options: DIRECTION_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
        value: directionFilter,
        onChange: (k) => setDirectionFilter(k as DirectionFilter),
      },
      {
        kind: 'chips',
        label: 'סוג תשלום',
        options: GROUP_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
        value: groupFilter,
        onChange: (k) => setGroupFilter(k as PaymentListGroupFilter),
      },
      {
        kind: 'dateRange',
        label: 'טווח תאריכים (מועד ביצוע)',
        from: dateFrom,
        to: dateTo,
        onFromChange: setDateFrom,
        onToChange: setDateTo,
        quickPresets: DATE_QUICK_PRESETS,
      },
    ],
    [directionFilter, groupFilter, dateFrom, dateTo],
  );

  const resetSecondaryFilters = useCallback(() => {
    setDirectionFilter('all');
    setGroupFilter('all');
    setDateFrom('');
    setDateTo('');
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="תשלומים" showMenu />

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

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={statusTab}
        onTabChange={(k) => setStatusTab(k as StatusBucket | 'all')}
        activeSecondaryCount={activeSecondaryCount}
        onFiltersPress={() => setFilterSheetOpen(true)}
      />

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onReset={resetSecondaryFilters}
        sections={filterSections}
      />

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
          contentContainerStyle={{ paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.sm, paddingBottom: insets.bottom + Spacing['2xl'], gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const inbound = item.direction === 'inbound';
            const amtColor = inbound ? Colors.inbound : Colors.outbound;
            return (
              <View style={[styles.card, { borderRightColor: amtColor }]}>
                <Pressable
                  onPress={() => router.push(`/(app)/payments/${item.id}`)}
                  style={({ pressed }) => [styles.cardBody, pressed && { opacity: 0.88 }]}
                  accessibilityRole="button"
                >
                  {/* Row 1: name + amount */}
                  <View style={styles.cardRow}>
                    <AppText variant="bodySm" weight="semiBold" numberOfLines={2} style={{ flex: 1, textAlign: 'right' }}>
                      {item.displayName}
                    </AppText>
                    <View style={styles.amountCell}>
                      <MaterialCommunityIcons name="currency-ils" size={14} color={amtColor} />
                      <AppText variant="bodyMd" weight="bold" style={{ color: amtColor }}>
                        {inbound ? '+' : '−'}{formatIlsInteger(item.amount)}
                      </AppText>
                    </View>
                  </View>
                  {/* Row 2: type tag + mode + index + due date */}
                  <View style={[styles.cardRow, { marginTop: Spacing.xs }]}>
                    <View style={{ flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.xs }}>
                      <View style={styles.tag}>
                        <AppText variant="caption" color="variant" numberOfLines={1}>{PAYMENT_TYPE_LABELS[item.paymentType]}</AppText>
                      </View>
                      <View style={styles.tag}>
                        <AppText variant="caption" color="variant" numberOfLines={1}>{PAYMENT_MODE_LABELS[item.mode]}</AppText>
                      </View>
                      {item.indexed ? (
                        <View style={[styles.tag, styles.tagIndexed]}>
                          <AppText variant="caption" numberOfLines={1} style={{ color: Colors.primary }}>מוצמד</AppText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.dueDateWrap}>
                      <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.onSurfaceMuted} />
                      <AppText variant="caption" color="muted">{item.dueDate}</AppText>
                    </View>
                  </View>
                  {/* Row 3: link + progress */}
                  <View style={[styles.cardRow, { marginTop: Spacing.xs }]}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, flex: 1 }}>
                      <MaterialCommunityIcons name="home-outline" size={13} color={Colors.onSurfaceMuted} />
                      <AppText variant="caption" color="muted" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                        {item.linkLabel}
                      </AppText>
                    </View>
                    <AppText variant="caption" color="muted" numberOfLines={1}>
                      {formatDigitRunsInText(item.progressLabel)}
                    </AppText>
                  </View>
                </Pressable>
                {/* Quick actions — no share/download */}
                <View style={styles.cardActions}>
                  <Pressable onPress={() => onRowDuplicate(item)} style={styles.actionBtn} accessibilityLabel="שכפול">
                    <MaterialCommunityIcons name="content-copy" size={17} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => onRowEdit(item)} style={styles.actionBtn} accessibilityLabel="עריכה">
                    <MaterialCommunityIcons name="pencil-outline" size={17} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => onRowDelete(item)} style={styles.actionBtn} accessibilityLabel="מחיקה">
                    <MaterialCommunityIcons name="delete-outline" size={17} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(app)/payments/new')}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="הוסף תשלום"
      >
        <MaterialCommunityIcons name="plus" size={26} color={Colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
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

  // Card-based row layout
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    borderRightWidth: 4,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  amountCell: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  tagIndexed: {
    backgroundColor: Colors.primaryContainer,
  },
  dueDateWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  cardActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceVariant,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  fab: {
    position: 'absolute',
    left: CONTENT_HORIZONTAL_PADDING,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
});
