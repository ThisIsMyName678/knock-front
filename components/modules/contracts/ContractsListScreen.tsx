import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Share,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppHeader } from '@/components/ui/AppHeader';
import { RTL_ROW } from '@/constants/rtl';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import { CardSkeletonList, FadeInContent, useSkeletonGate } from '@/components/ui/skeleton';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  type ContractSortKey,
  type SortDir,
  type LinkScopeFilter,
  type ContractTypeFilter,
} from '@/lib/constants/contracts';
import { fetchContracts, type ContractListItem } from '@/lib/api/contracts';
import { listProjects } from '@/lib/api/projects';
import { listProperties } from '@/lib/api/properties';
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

function ddMmYyyyToIso(value: string): string | undefined {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ─── Filter options ────────────────────────────────────────────────────────────

const LINK_SCOPE_OPTIONS: { key: LinkScopeFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'PROPERTY', label: 'נכס' },
  { key: 'PROJECT', label: 'פרויקט' },
];

const TYPE_FILTER_OPTIONS: { key: ContractTypeFilter; label: string }[] = [
  { key: 'all', label: 'כל הסוגים' },
  { key: 'RENT', label: 'שכירות' },
  { key: 'PURCHASE', label: 'רכישה' },
  { key: 'SUPPLIER_WORK', label: 'הסכם ספק' },
  { key: 'OTHER', label: 'אחר' },
];

const SORT_OPTIONS: { key: ContractSortKey; label: string }[] = [
  { key: 'agreementDate', label: 'תאריך' },
  { key: 'contractName', label: 'שם חוזה' },
  { key: 'counterpartyName', label: 'צד שני' },
  { key: 'contractType', label: 'סוג' },
  { key: 'status', label: 'סטטוס' },
];

// ─── Status helpers ────────────────────────────────────────────────────────────

function statusPreset(s: ContractListItem['status']): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'ACTIVE') return 'success';
  if (s === 'EXPIRED') return 'neutral';
  return 'warning';
}

// ─── Contract card ─────────────────────────────────────────────────────────────

function ContractCard({ item, onPress }: { item: ContractListItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
    >
      {/* Row 1: name + status */}
      <View style={styles.cardRow1}>
        <Badge label={CONTRACT_STATUS_LABELS[item.status as keyof typeof CONTRACT_STATUS_LABELS]} preset={statusPreset(item.status)} />
        <AppText variant="bodyMd" weight="semiBold" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
          {item.contractName}
        </AppText>
      </View>

      {/* Row 2: type chip + link badge + date */}
      <View style={styles.cardRow2}>
        <AppText variant="caption" color="variant" numberOfLines={1}>
          {item.agreementDate ?? '—'}
        </AppText>

        <View style={styles.cardMeta}>
          <View style={styles.linkBadge}>
            <MaterialCommunityIcons
              name={item.linkKind === 'PROJECT' ? 'briefcase-outline' : 'home-outline'}
              size={11}
              color={Colors.primary}
            />
            <AppText variant="caption" numberOfLines={1} style={{ color: Colors.primary, maxWidth: 90 }}>
              {item.linkLabel}
            </AppText>
          </View>

          <View style={styles.typeChip}>
            <AppText variant="caption" numberOfLines={1} style={{ color: Colors.onSurfaceVariant }}>
              {CONTRACT_TYPE_LABELS[item.contractType as keyof typeof CONTRACT_TYPE_LABELS]}
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
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const showSkeleton = useSkeletonGate(loading);
  const [entityLinks, setEntityLinks] = useState<Array<{ id: string; kind: 'asset' | 'project'; name: string }>>([]);
  const [focusCount, setFocusCount] = useState(0);

  useFocusEffect(useCallback(() => { setFocusCount((n) => n + 1); }, []));

  useEffect(() => {
    if (focusCount === 0) return;
    let cancelled = false;
    setLoading(true);
    const filters: Parameters<typeof fetchContracts>[0] = {};
    if (linkScope !== 'all') filters.linkKind = linkScope;
    if (typeFilter !== 'all') filters.contractType = typeFilter as ContractListItem['contractType'];
    if (linkScope === 'PROJECT' && entityId) filters.projectId = entityId;
    if (linkScope === 'PROPERTY' && entityId) filters.propertyId = entityId;
    const isoDateFrom = ddMmYyyyToIso(agreementDateFrom);
    const isoDateTo = ddMmYyyyToIso(agreementDateTo);
    if (isoDateFrom) filters.dateFrom = isoDateFrom;
    if (isoDateTo) filters.dateTo = isoDateTo;
    fetchContracts(filters)
      .then((data) => { if (!cancelled) setContracts(data); })
      .catch(() => { if (!cancelled) setContracts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [focusCount, linkScope, typeFilter, entityId, agreementDateFrom, agreementDateTo]);

  useEffect(() => {
    Promise.all([listProjects(), listProperties()])
      .then(([projects, properties]) => {
        setEntityLinks([
          ...projects.map((p) => ({ id: p.id, kind: 'project' as const, name: p.name })),
          ...properties.map((p) => ({ id: p.id, kind: 'asset' as const, name: p.name })),
        ]);
      })
      .catch(() => {});
  }, []);

  // ── Fixed sort handler: no nested setState ──
  const handleSortKeyChange = useCallback((key: string) => {
    setSortKey(key as ContractSortKey);
  }, []);

  const handleSortDirToggle = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return contracts;
    const q = search.trim().toLowerCase();
    return contracts.filter((r) => {
      const hay = `${r.contractName} ${r.counterpartyName} ${r.linkLabel} ${CONTRACT_TYPE_LABELS[r.contractType as keyof typeof CONTRACT_TYPE_LABELS]}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contracts, search]);

  const sorted = useMemo(() => {
    const mult = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortKey) {
        case 'contractName': va = a.contractName; vb = b.contractName; break;
        case 'contractType':
          va = CONTRACT_TYPE_LABELS[a.contractType as keyof typeof CONTRACT_TYPE_LABELS] ?? '';
          vb = CONTRACT_TYPE_LABELS[b.contractType as keyof typeof CONTRACT_TYPE_LABELS] ?? '';
          break;
        case 'linkLabel': va = a.linkLabel; vb = b.linkLabel; break;
        case 'counterpartyName': va = a.counterpartyName; vb = b.counterpartyName; break;
        case 'agreementDate':
          va = a.agreementDate ? new Date(a.agreementDate).getTime() : 0;
          vb = b.agreementDate ? new Date(b.agreementDate).getTime() : 0;
          break;
        case 'status':
          va = CONTRACT_STATUS_LABELS[a.status as keyof typeof CONTRACT_STATUS_LABELS] ?? '';
          vb = CONTRACT_STATUS_LABELS[b.status as keyof typeof CONTRACT_STATUS_LABELS] ?? '';
          break;
      }
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult;
      return String(va).localeCompare(String(vb), 'he') * mult;
    });
  }, [filtered, sortKey, sortDir]);

  const entityOptionsForScope = useMemo(
    () =>
      entityLinks
        .filter((e) => {
          if (linkScope === 'all') return true;
          return e.kind === (linkScope === 'PROPERTY' ? 'asset' : 'project');
        })
        .map((e) => ({ key: e.id, label: e.name })),
    [linkScope, entityLinks],
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
        label: linkScope === 'PROPERTY' ? 'חיפוש נכס' : 'חיפוש פרויקט',
        placeholder: linkScope === 'PROPERTY' ? 'הקלד שם נכס או כתובת...' : 'הקלד שם פרויקט...',
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
      (r: ContractListItem) =>
        `"${r.contractName}","${CONTRACT_TYPE_LABELS[r.contractType as keyof typeof CONTRACT_TYPE_LABELS]}","${r.linkLabel}","${r.counterpartyName}","${r.agreementDate ?? ''}","${CONTRACT_STATUS_LABELS[r.status as keyof typeof CONTRACT_STATUS_LABELS]}"`,
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

      {showSkeleton ? (
        <CardSkeletonList count={6} variant="contract" style={{ flex: 1 }} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="אין חוזים"
          description="נסה לשנות חיפוש או סינון"
          icon={<MaterialCommunityIcons name="file-sign" size={32} color={Colors.primary} />}
          actionLabel="חוזה חדש"
          onAction={() => router.push('/(app)/contracts/new')}
          style={{ flex: 1 }}
        />
      ) : (
        <FadeInContent visible style={{ flex: 1 }}>
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
        </FadeInContent>
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
    borderRadius: Radius.xl,
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
