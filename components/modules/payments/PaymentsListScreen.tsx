import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  TouchableOpacity,
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
import { Button } from '@/components/ui/Button';
import { RTL_ROW } from '@/constants/rtl';
import { PaymentsListSkeleton, FadeInContent, useSkeletonGate } from '@/components/ui/skeleton';
import {
  PAYMENT_ENTITY_OPTIONS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
  filterPaymentRows,
  sortPaymentRows,
  deletePaymentFromSession,
  getActivePaymentsList,
  type PaymentListGroupFilter,
  type PaymentListRow,
  type PaymentSortKey,
  type SortDir,
  type StatusBucket,
} from '@/lib/mocks/payments';
import type { LinkKind } from '@/lib/mocks/contracts';
import { formatDigitRunsInText, formatIlsInteger } from '@/lib/format/currency';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  CONTENT_HORIZONTAL_PADDING,
  MIN_TOUCH,
} from '@/constants/tokens';

type DirectionFilter = 'all' | 'inbound' | 'outbound';
type ScopeFilter = 'all' | 'by_asset' | 'by_project';

const SCOPE_OPTIONS: { key: ScopeFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'by_asset', label: 'נכס' },
  { key: 'by_project', label: 'פרויקט' },
];

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

function linkScopeFromScope(scope: ScopeFilter): 'all' | LinkKind {
  if (scope === 'by_asset') return 'asset';
  if (scope === 'by_project') return 'project';
  return 'all';
}

export function PaymentsListScreen() {
  const [payments, setPayments] = useState(() => getActivePaymentsList());
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    dateFrom?: string;
    dateTo?: string;
    statusTab?: string;
    excludeReceived?: string;
  }>();
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<PaymentListGroupFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusBucket | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<PaymentSortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentListRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoading(false));
    return () => cancelAnimationFrame(id);
  }, []);

  const showSkeleton = useSkeletonGate(loading);

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

  const entitiesForScope = useMemo(() => {
    if (scope === 'by_asset') return PAYMENT_ENTITY_OPTIONS.filter((e) => e.kind === 'asset');
    if (scope === 'by_project') return PAYMENT_ENTITY_OPTIONS.filter((e) => e.kind === 'project');
    return [];
  }, [scope]);

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
    const base = filterPaymentRows(payments, {
      search,
      linkScope,
      entityId,
      groupFilter,
      statusTab,
      dateFrom,
      dateTo,
      excludeReceived: excludeReceived || undefined,
    });
    if (directionFilter === 'all') return base;
    return base.filter((r) => r.direction === directionFilter);
  }, [payments, search, directionFilter, linkScope, entityId, groupFilter, statusTab, dateFrom, dateTo, excludeReceived]);

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
    router.push({ pathname: '/(app)/payments/new', params: { duplicateFromId: r.id } });
  }, []);

  const onRowEdit = useCallback((r: PaymentListRow) => {
    router.push(`/(app)/payments/edit/${r.id}`);
  }, []);

  const onRowDelete = useCallback((r: PaymentListRow) => {
    // דחייה קצרה — מונעת סגירה מיידית של ה-Modal באותה לחיצה (בעיקר ב-Web)
    setTimeout(() => setDeleteTarget(r), 50);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deletePaymentFromSession(deleteTarget.id);
    setPayments(getActivePaymentsList());
    setDeleteTarget(null);
  }, [deleteTarget]);

  const activeSecondaryCount = useMemo(() => {
    let count = 0;
    if (directionFilter !== 'all') count++;
    if (scope !== 'all') count++;
    if (groupFilter !== 'all') count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [directionFilter, scope, groupFilter, dateFrom, dateTo]);

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
        kind: 'chips',
        label: 'שיוך לפי',
        options: SCOPE_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
        value: scope,
        onChange: (k) => {
          setScope(k as ScopeFilter);
          setEntityId(null);
        },
      },
      {
        kind: 'entitySearch',
        label: scope === 'by_asset' ? 'חיפוש נכס' : 'חיפוש פרויקט',
        placeholder: scope === 'by_asset' ? 'הקלד שם נכס או כתובת...' : 'הקלד שם פרויקט...',
        options: entitiesForScope.map((e) => ({ key: e.id, label: e.name })),
        value: entityId,
        onChange: setEntityId,
        visible: scope !== 'all',
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
    [directionFilter, groupFilter, scope, entityId, entitiesForScope, dateFrom, dateTo],
  );

  const resetSecondaryFilters = useCallback(() => {
    setDirectionFilter('all');
    setScope('all');
    setEntityId(null);
    setGroupFilter('all');
    setDateFrom('');
    setDateTo('');
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="תשלומים" showMenu />

      {/* Economic snapshot */}
      {!showSkeleton ? (
      <View style={styles.summaryCard}>
        <AppText variant="labelSm" weight="bold" style={styles.summaryTitle}>
          תמונת מצב כלכלית (לפי סינון)
        </AppText>
        <AppText variant="caption" color="variant" style={{ textAlign: 'right', marginBottom: Spacing.xs }}>
          פילוח: {summaryScopeLabel}
        </AppText>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="muted">
              הכנסות
            </AppText>
            <AppText variant="headingSm" weight="bold" style={{ color: Colors.success }}>
              +₪{formatIlsInteger(totals.inSum)}
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="muted">
              הוצאות
            </AppText>
            <AppText variant="headingSm" weight="bold" style={{ color: Colors.outbound }}>
              −₪{formatIlsInteger(totals.outSum)}
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="caption" color="muted">
              יתרה
            </AppText>
            <AppText variant="headingSm" weight="extraBold">
              {totals.net >= 0 ? '+' : ''}₪{formatIlsInteger(Math.abs(totals.net))}
            </AppText>
          </View>
        </View>
      </View>
      ) : null}

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

      {showSkeleton ? (
        <PaymentsListSkeleton />
      ) : (
        <FadeInContent visible style={{ flex: 1 }}>
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
              contentContainerStyle={{ paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.sm, paddingBottom: insets.bottom + 88, gap: Spacing.sm }}
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
                    <View style={{ flex: 1, flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs }}>
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
                    <View style={{ flexDirection: RTL_ROW, alignItems: 'center', gap: 4, flex: 1 }}>
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
                {/* Quick actions — delete first in DOM so it sits away from the FAB on the left */}
                <View style={styles.cardActions} collapsable={false}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onRowDelete(item)}
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    accessibilityRole="button"
                    accessibilityLabel="מחיקה"
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
                    <AppText variant="caption" weight="semiBold" style={{ color: Colors.error }}>מחק</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onRowEdit(item)}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel="עריכה"
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.primary} />
                    <AppText variant="caption" weight="semiBold" color="primary">ערוך</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onRowDuplicate(item)}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel="שכפול"
                  >
                    <MaterialCommunityIcons name="content-copy" size={18} color={Colors.primary} />
                    <AppText variant="caption" weight="semiBold" color="primary">שכפל</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
            />
          )}
        </FadeInContent>
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

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.deleteBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDeleteTarget(null)} />
          <View style={styles.deleteSheet}>
            <View style={styles.deleteIconWrap}>
              <MaterialCommunityIcons name="delete-outline" size={28} color={Colors.error} />
            </View>
            <AppText variant="headingSm" weight="bold" align="center" style={{ marginBottom: Spacing.sm }}>
              מחיקת תשלום
            </AppText>
            <AppText variant="bodyMd" color="variant" align="center" style={{ marginBottom: Spacing.lg }}>
              {deleteTarget
                ? `האם למחוק את "${deleteTarget.displayName}"?\nלא ניתן לשחזר פעולה זו.`
                : ''}
            </AppText>
            <View style={styles.deleteActions}>
              <Button
                label="ביטול"
                variant="secondary"
                onPress={() => setDeleteTarget(null)}
                style={{ flex: 1 }}
              />
              <Button
                label="מחק"
                variant="danger"
                onPress={confirmDelete}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  summaryCard: {
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  summaryTitle: { textAlign: 'right' },
  summaryRow: { flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'flex-end', gap: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: Colors.outlineLight, marginHorizontal: Spacing.sm },

  // Card-based row layout
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    borderRightWidth: 4,
    ...Shadow.sm,
  },
  cardBody: {
    padding: Spacing.md,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  amountCell: {
    flexDirection: RTL_ROW,
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
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
  },
  cardActions: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    zIndex: 2,
    elevation: 3,
  },
  actionBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
  },
  actionBtnDanger: {
    borderColor: `${Colors.error}44`,
    backgroundColor: Colors.errorContainer ?? '#FEE2E2',
  },
  deleteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  deleteSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    maxWidth: 400,
    width: '100%',
    zIndex: 10,
    ...Shadow.lg,
  },
  deleteIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.errorContainer ?? '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  deleteActions: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
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
