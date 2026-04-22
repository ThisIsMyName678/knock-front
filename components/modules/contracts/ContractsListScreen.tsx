import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
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
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">
          חוזים
        </AppText>
        <View style={styles.headerActions}>
          <Pressable onPress={exportCsv} style={styles.headerIconBtn} accessibilityRole="button" accessibilityLabel="יצוא">
            <MaterialCommunityIcons name="tray-arrow-up" size={22} color={Colors.onPrimary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/contracts/new')}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel="חוזה חדש"
          >
            <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.toolbar}>
        <AppText variant="labelMd" weight="bold" style={styles.toolbarTitle}>
          חיפוש וסינון
        </AppText>
        <AppText variant="caption" color="variant" style={styles.toolbarSubtitle}>
          חיפוש חופשי · סינון לפי נכס או פרויקט · סוג חוזה · ייצוא · מיון עמודות
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
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="נקה">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          סינון לפי נכס / פרויקט
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {LINK_SCOPE_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                setLinkScope(o.key);
                setEntityId(null);
              }}
              style={[styles.chip, linkScope === o.key && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: linkScope === o.key }}
            >
              <AppText
                variant="labelMd"
                weight={linkScope === o.key ? 'bold' : 'regular'}
                style={{ color: linkScope === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {(linkScope === 'asset' || linkScope === 'project') && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Pressable
              onPress={() => setEntityId(null)}
              style={[styles.chip, entityId === null && styles.chipActive]}
              accessibilityRole="button"
            >
              <AppText variant="labelMd" weight={entityId === null ? 'bold' : 'regular'} style={{ color: entityId === null ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                כל הישויות
              </AppText>
            </Pressable>
            {MOCK_ENTITY_LINKS.filter((e) => e.kind === linkScope).map((e) => (
              <Pressable
                key={e.id}
                onPress={() => setEntityId(e.id)}
                style={[styles.chip, entityId === e.id && styles.chipActive]}
                accessibilityRole="button"
              >
                <AppText
                  variant="labelMd"
                  weight={entityId === e.id ? 'bold' : 'regular'}
                  style={{ color: entityId === e.id ? Colors.onPrimary : Colors.onSurfaceVariant }}
                  numberOfLines={1}
                >
                  {e.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          סוג חוזה
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {TYPE_FILTER_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => setTypeFilter(o.key)}
              style={[styles.chip, typeFilter === o.key && styles.chipActive]}
              accessibilityRole="button"
            >
              <AppText
                variant="labelMd"
                weight={typeFilter === o.key ? 'bold' : 'regular'}
                style={{ color: typeFilter === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <AppText variant="caption" color="variant" style={styles.sortHint}>
        לחיצה על כותרת עמודה משנה את סדר המיון (עולה / יורד)
      </AppText>

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
  headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
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
  toolbar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    paddingBottom: Spacing.sm,
  },
  toolbarTitle: {
    textAlign: 'right',
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.md,
    marginBottom: 2,
    color: Colors.onBackground,
  },
  toolbarSubtitle: {
    textAlign: 'right',
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginBottom: Spacing.sm,
  },
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
  filterLabel: { textAlign: 'right', marginRight: CONTENT_HORIZONTAL_PADDING, marginTop: Spacing.xs },
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
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortHint: {
    textAlign: 'right',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.xs,
    paddingBottom: 2,
    backgroundColor: Colors.surface,
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
});
