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
  type ContractTypeKey,
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

const LINK_SCOPE_OPTIONS: { key: LinkScopeFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'asset', label: 'נכס' },
  { key: 'project', label: 'פרויקט' },
];

const TYPE_FILTER_OPTIONS: { key: ContractTypeFilter; label: string }[] = [
  { key: 'all', label: 'כל הסוגים' },
  { key: 'rent', label: 'שכירות' },
  { key: 'purchase', label: 'רכישה' },
  { key: 'supplier_work', label: 'הסכם עבודה עם ספק' },
  { key: 'other', label: 'אחר' },
];

const COLUMNS: { key: ContractSortKey; label: string; flex?: number }[] = [
  { key: 'contractName', label: 'שם החוזה', flex: 1.2 },
  { key: 'contractType', label: 'סוג', flex: 0.9 },
  { key: 'linkLabel', label: 'שיוך', flex: 0.85 },
  { key: 'counterpartyName', label: 'צד שני', flex: 0.9 },
  { key: 'agreementDate', label: 'תאריך הסכם', flex: 0.75 },
  { key: 'status', label: 'סטטוס', flex: 0.65 },
];

function statusPreset(s: ContractListRow['status']): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'active') return 'success';
  if (s === 'expired') return 'neutral';
  return 'warning';
}

export function ContractsListScreen() {
  const insets = useSafeAreaInsets();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [linkScope, setLinkScope] = useState<LinkScopeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ContractTypeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<ContractSortKey>('agreementDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const onHeaderPress = useCallback((key: ContractSortKey) => {
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
      filterContractRows(MOCK_CONTRACTS_LIST, {
        search,
        linkScope,
        typeFilter,
        entityId,
      }),
    [search, linkScope, typeFilter, entityId],
  );

  const sorted = useMemo(() => sortContractRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const entityOptionsForScope = useMemo(
    () =>
      MOCK_ENTITY_LINKS.filter((e) => e.kind === linkScope).map((e) => ({ key: e.id, label: e.name })),
    [linkScope],
  );

  const activeSecondaryCount = useMemo(() => {
    let count = 0;
    if (linkScope !== 'all') count++;
    return count;
  }, [linkScope]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        kind: 'chips',
        label: 'שיוך לפי',
        options: LINK_SCOPE_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
        value: linkScope,
        onChange: (k) => {
          setLinkScope(k as LinkScopeFilter);
          setEntityId(null);
        },
      },
      {
        kind: 'conditionalChips',
        label: linkScope === 'asset' ? 'בחר נכס' : 'בחר פרויקט',
        options: entityOptionsForScope,
        value: entityId,
        onChange: setEntityId,
        visible: linkScope !== 'all',
      },
    ],
    [linkScope, entityId, entityOptionsForScope],
  );

  const resetSecondaryFilters = useCallback(() => {
    setLinkScope('all');
    setEntityId(null);
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

      {/* Table header */}
      <View style={styles.tableHeader}>
        {COLUMNS.map((col) => {
          const active = sortKey === col.key;
          return (
            <Pressable
              key={col.key}
              onPress={() => onHeaderPress(col.key)}
              style={[styles.thCell, col.flex ? { flex: col.flex } : { flex: 1 }]}
              accessibilityRole="button"
              accessibilityLabel={`מיון לפי ${col.label}`}
            >
              <AppText variant="labelSm" weight="bold" color="primary" numberOfLines={2} align="right">
                {col.label}
              </AppText>
              {active && (
                <MaterialCommunityIcons
                  name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={Colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>

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
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/contracts/${item.id}`)}
              style={({ pressed }) => [styles.tableRow, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
            >
              <View style={[styles.tdCell, { flex: 1.2 }]}>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={2}>
                  {item.contractName}
                </AppText>
              </View>
              <View style={[styles.tdCell, { flex: 0.9 }]}>
                <AppText variant="bodySm" color="variant" numberOfLines={2}>
                  {CONTRACT_TYPE_LABELS[item.contractType]}
                </AppText>
              </View>
              <View style={[styles.tdCell, { flex: 0.85 }]}>
                <View style={styles.linkBadge}>
                  <MaterialCommunityIcons
                    name={item.linkKind === 'project' ? 'briefcase-outline' : 'home-outline'}
                    size={12}
                    color={Colors.primary}
                  />
                  <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                    {item.linkLabel}
                  </AppText>
                </View>
              </View>
              <View style={[styles.tdCell, { flex: 0.9 }]}>
                <AppText variant="bodySm" numberOfLines={2}>
                  {item.counterpartyName}
                </AppText>
              </View>
              <View style={[styles.tdCell, { flex: 0.75 }]}>
                <AppText variant="bodySm" color="muted" numberOfLines={1}>
                  {item.agreementDate}
                </AppText>
              </View>
              <View style={[styles.tdCell, { flex: 0.65, alignItems: 'flex-end' }]}>
                <Badge label={CONTRACT_STATUS_LABELS[item.status]} preset={statusPreset(item.status)} />
              </View>
            </Pressable>
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
    paddingHorizontal: 4,
    minHeight: MIN_TOUCH,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  linkBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
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
