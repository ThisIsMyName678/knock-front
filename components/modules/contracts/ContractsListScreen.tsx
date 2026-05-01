import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppHeader } from '@/components/ui/AppHeader';
import { RTL_ROW } from '@/constants/rtl';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import {
  MOCK_CONTRACTS_LIST,
  MOCK_ENTITY_LINKS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  filterContractRows,
  sortContractRows,
  type ContractSortKey,
  type SortDir,
  type LinkScopeFilter,
  type ContractTypeFilter,
  type ContractListRow,
} from '@/lib/mocks/contracts';
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

// ─── Filter options ────────────────────────────────────────────────────────────

const LINK_SCOPE_OPTIONS: { key: LinkScopeFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'asset', label: 'נכס' },
  { key: 'project', label: 'פרויקט' },
];

const TYPE_FILTER_OPTIONS: { key: ContractTypeFilter; label: string }[] = [
  { key: 'all', label: 'כל הסוגים' },
  { key: 'rent', label: 'שכירות' },
  { key: 'purchase', label: 'רכישה' },
  { key: 'supplier_work', label: 'הסכם ספק' },
  { key: 'other', label: 'אחר' },
];

const SORT_OPTIONS: { key: ContractSortKey; label: string }[] = [
  { key: 'agreementDate', label: 'תאריך' },
  { key: 'contractName', label: 'שם חוזה' },
  { key: 'counterpartyName', label: 'צד שני' },
  { key: 'contractType', label: 'סוג' },
  { key: 'status', label: 'סטטוס' },
];

// ─── Status helpers ────────────────────────────────────────────────────────────

function statusPreset(s: ContractListRow['status']): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'active') return 'success';
  if (s === 'expired') return 'neutral';
  return 'warning';
}

// ─── Contract card ─────────────────────────────────────────────────────────────

function ContractCard({ item, onPress }: { item: ContractListRow; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
    >
      {/* Row 1: name + status */}
      <View style={styles.cardRow1}>
        <Badge label={CONTRACT_STATUS_LABELS[item.status]} preset={statusPreset(item.status)} />
        <AppText variant="bodyMd" weight="semiBold" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
          {item.contractName}
        </AppText>
      </View>

      {/* Row 2: type chip + link badge + date */}
      <View style={styles.cardRow2}>
        <AppText variant="caption" color="variant" numberOfLines={1}>
          {item.agreementDate}
        </AppText>

        <View style={styles.cardMeta}>
          <View style={styles.linkBadge}>
            <MaterialCommunityIcons
              name={item.linkKind === 'project' ? 'briefcase-outline' : 'home-outline'}
              size={11}
              color={Colors.primary}
            />
            <AppText variant="caption" numberOfLines={1} style={{ color: Colors.primary, maxWidth: 90 }}>
              {item.linkLabel}
            </AppText>
          </View>

          <View style={styles.typeChip}>
            <AppText variant="caption" numberOfLines={1} style={{ color: Colors.onSurfaceVariant }}>
              {CONTRACT_TYPE_LABELS[item.contractType]}
            </AppText>
          </View>
        </View>
      </View>

      {/* Row 3: counterparty */}
      <View style={styles.cardRow3}>
        <MaterialCommunityIcons name="account-outline" size={14} color={Colors.onSurfaceVariant} />
        <AppText variant="caption" color="variant" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
          {item.counterpartyName}
        </AppText>
      </View>
    </Pressable>
  );
}

// ─── Disclaimer banner ─────────────────────────────────────────────────────────

function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <View style={styles.disclaimer}>
      <View style={styles.disclaimerContent}>
        <MaterialCommunityIcons name="information-outline" size={16} color={Colors.warning} style={{ marginTop: 1 }} />
        <AppText variant="caption" style={styles.disclaimerText}>
          ההסכם המחייב מבוסס אך ורק על החוזה החתום בין הצדדים. כל המידע והכלים המוצגים בפלטפורמה זו מהווים כלי עזר ניהוליים בלבד, ואינם מהווים הסכם משפטי.
        </AppText>
      </View>
      <Pressable onPress={() => setDismissed(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="סגור">
        <MaterialCommunityIcons name="close" size={16} color={Colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export function ContractsListScreen() {
  const insets = useSafeAreaInsets();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [linkScope, setLinkScope] = useState<LinkScopeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ContractTypeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<ContractSortKey>('agreementDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [agreementDateFrom, setAgreementDateFrom] = useState('');
  const [agreementDateTo, setAgreementDateTo] = useState('');

  // ── Fixed sort handler: no nested setState ──
  const handleSortKeyChange = useCallback((key: string) => {
    setSortKey(key as ContractSortKey);
  }, []);

  const handleSortDirToggle = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const filtered = useMemo(
    () =>
      filterContractRows(MOCK_CONTRACTS_LIST, {
        search,
        linkScope,
        typeFilter,
        entityId,
        dateFrom: agreementDateFrom,
        dateTo: agreementDateTo,
      }),
    [search, linkScope, typeFilter, entityId, agreementDateFrom, agreementDateTo],
  );

  const sorted = useMemo(() => sortContractRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const entityOptionsForScope = useMemo(
    () =>
      MOCK_ENTITY_LINKS.filter((e) => linkScope === 'all' || e.kind === linkScope).map((e) => ({
        key: e.id,
        label: e.name,
      })),
    [linkScope],
  );

  // ── Count: scope + entity (typeFilter is visible in tabs, not counted here) ──
  const activeSecondaryCount = useMemo(() => {
    let count = 0;
    if (linkScope !== 'all') count++;
    if (entityId !== null) count++;
    if (agreementDateFrom.trim() || agreementDateTo.trim()) count++;
    return count;
  }, [linkScope, entityId, agreementDateFrom, agreementDateTo]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        kind: 'chips',
        label: 'סוג שיוך',
        options: LINK_SCOPE_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
        value: linkScope,
        onChange: (k) => {
          setLinkScope(k as LinkScopeFilter);
          setEntityId(null);
        },
      },
      {
        kind: 'dateRange',
        label: 'תאריך הסכם (מ–עד)',
        from: agreementDateFrom,
        to: agreementDateTo,
        onFromChange: setAgreementDateFrom,
        onToChange: setAgreementDateTo,
      },
      {
        kind: 'entitySearch',
        label: linkScope === 'asset' ? 'חיפוש נכס' : 'חיפוש פרויקט',
        placeholder: linkScope === 'asset' ? 'הקלד שם נכס או כתובת...' : 'הקלד שם פרויקט...',
        options: entityOptionsForScope,
        value: entityId,
        onChange: setEntityId,
        visible: linkScope !== 'all',
      },
      {
        kind: 'sort',
        label: 'מיון לפי',
        options: SORT_OPTIONS,
        sortKey,
        sortDir,
        onSortKeyChange: handleSortKeyChange,
        onSortDirToggle: handleSortDirToggle,
      },
    ],
    [
      linkScope,
      entityId,
      entityOptionsForScope,
      agreementDateFrom,
      agreementDateTo,
      sortKey,
      sortDir,
      handleSortKeyChange,
      handleSortDirToggle,
    ],
  );

  const resetSecondaryFilters = useCallback(() => {
    setLinkScope('all');
    setEntityId(null);
    setAgreementDateFrom('');
    setAgreementDateTo('');
    setSortKey('agreementDate');
    setSortDir('desc');
  }, []);

  const exportCsv = useCallback(async () => {
    const header = 'שם,סוג,שיוך,צד שני,תאריך,סטטוס\n';
    const lines = sorted.map(
      (r) =>
        `"${r.contractName}","${CONTRACT_TYPE_LABELS[r.contractType]}","${r.linkLabel}","${r.counterpartyName}","${r.agreementDate}","${CONTRACT_STATUS_LABELS[r.status]}"`,
    );
    const body = header + lines.join('\n');
    try {
      await Share.share({ message: body, title: 'ייצוא חוזים' });
    } catch {
      /* ignore */
    }
  }, [sorted]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="חוזים" showMenu />

      {/* Legal disclaimer */}
      <DisclaimerBanner />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        tabs={TYPE_FILTER_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
        activeTab={typeFilter}
        onTabChange={(k) => setTypeFilter(k as ContractTypeFilter)}
        activeSecondaryCount={activeSecondaryCount}
        onFiltersPress={() => setFilterSheetOpen(true)}
      />

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onReset={resetSecondaryFilters}
        sections={filterSections}
      />

      {/* Summary bar */}
      {sorted.length > 0 && (
        <View style={styles.summaryBar}>
          <Pressable
            onPress={() => setFilterSheetOpen(true)}
            style={styles.sortBtn}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={sortDir === 'asc' ? 'sort-ascending' : 'sort-descending'}
              size={14}
              color={Colors.primary}
            />
            <AppText variant="caption" color="primary">
              {SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'מיון'}
            </AppText>
          </Pressable>
          <AppText variant="caption" color="variant">
            {sorted.length} חוזים
          </AppText>
        </View>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title="אין חוזים"
          description="נסה לשנות חיפוש או סינון"
          icon={<MaterialCommunityIcons name="file-sign" size={32} color={Colors.primary} />}
          actionLabel="חוזה חדש"
          onAction={() => router.push('/(app)/contracts/new')}
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <ContractCard
              item={item}
              onPress={() => router.push(`/(app)/contracts/${item.id}`)}
            />
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(app)/contracts/new')}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="הוסף חוזה"
      >
        <MaterialCommunityIcons name="plus" size={26} color={Colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // ── Disclaimer ──
  disclaimer: {
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.warningContainer ?? '#FFF8E1',
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '33',
  },
  disclaimerContent: {
    flex: 1,
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    textAlign: 'right',
    color: Colors.onBackground,
    lineHeight: 18,
  },

  // ── Summary bar ──
  summaryBar: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  sortBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardRow1: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardRow2: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  linkBadge: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  typeChip: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
  },
  cardRow3: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
  },

  // ── FAB ──
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
