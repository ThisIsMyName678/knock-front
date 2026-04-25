import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import { MOCK_ENTITY_LINKS } from '@/lib/mocks/contracts';
import {
  MOCK_CONTACTS_LIST,
  filterContactRows,
  sortContactRows,
  roleDisplayLabel,
  setActiveContactRowsSnapshot,
  getActiveContactRowsSnapshot,
  consumePendingContacts,
  telUrl,
  whatsappUrlFromPhone,
  type ContactListRow,
  type ContactSortKey,
  type SortDir,
} from '@/lib/mocks/contacts';
import type { LinkKind } from '@/lib/mocks/contracts';
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
  { key: 'all', label: 'הכל' },
  { key: 'by_asset', label: 'נכס' },
  { key: 'by_project', label: 'פרויקט' },
];

const COLUMNS: { key: ContactSortKey; label: string; flex: number }[] = [
  { key: 'roleLabel', label: 'תפקיד', flex: 0.95 },
  { key: 'linkLabel', label: 'שיוך', flex: 0.85 },
  { key: 'displayName', label: 'שם', flex: 0.95 },
  { key: 'phone', label: 'טלפון', flex: 0.85 },
];

function linkScopeFromScope(scope: ScopeFilter): 'all' | LinkKind {
  if (scope === 'by_asset') return 'asset';
  if (scope === 'by_project') return 'project';
  return 'all';
}

async function openUrl(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      Alert.alert('לא ניתן לפתוח', url);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('שגיאה', 'לא ניתן לבצע את הפעולה');
  }
}

export function ContactsListScreen() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<ContactListRow[]>(() => [...MOCK_CONTACTS_LIST]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<ContactSortKey>('displayName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const linkScope = linkScopeFromScope(scope);

  useFocusEffect(
    useCallback(() => {
      setRows((prev) => {
        const pending = consumePendingContacts();
        const snap = getActiveContactRowsSnapshot();
        if (pending.length) {
          const base = snap ?? prev;
          return [...pending, ...base];
        }
        if (snap) return [...snap];
        return prev;
      });
    }, []),
  );

  useEffect(() => {
    setActiveContactRowsSnapshot(rows);
  }, [rows]);

  const filtered = useMemo(
    () => filterContactRows(rows, { search, linkScope, entityId }),
    [rows, search, linkScope, entityId],
  );

  const sorted = useMemo(() => sortContactRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const onHeaderPress = useCallback((key: ContactSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const entitiesForScope = useMemo(() => {
    if (scope === 'by_asset') return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'asset');
    if (scope === 'by_project') return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'project');
    return [];
  }, [scope]);

  const activeSecondaryCount = scope !== 'all' ? 1 : 0;

  const filterSections: FilterSection[] = useMemo(
    () => [
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
        options: entitiesForScope.map((e) => ({ key: e.id, label: `${e.name} — ${e.address}` })),
        value: entityId,
        onChange: setEntityId,
        visible: scope !== 'all',
      },
    ],
    [scope, entityId, entitiesForScope],
  );

  const resetSecondaryFilters = useCallback(() => {
    setScope('all');
    setEntityId(null);
  }, []);

  const listHeader = (
    <View style={styles.tableHeader}>
      {/* Sortable columns — flex:1 wrapper mirrors the data rowTap */}
      <View style={styles.thRow}>
        {COLUMNS.map((col) => {
          const active = sortKey === col.key;
          return (
            <Pressable
              key={col.key}
              onPress={() => onHeaderPress(col.key)}
              style={[styles.thCell, { flex: col.flex }]}
              accessibilityRole="button"
            >
              {active && (
                <MaterialCommunityIcons
                  name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={13}
                  color={Colors.primary}
                />
              )}
              <AppText variant="labelSm" weight="bold" color="primary" numberOfLines={1} style={{ textAlign: 'right' }}>
                {col.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {/* WA placeholder — matches waBtn width exactly */}
      <View style={styles.thWa}>
        <AppText variant="labelSm" weight="bold" color="primary" align="center">
          WA
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="אנשי קשר" showMenu />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        activeSecondaryCount={activeSecondaryCount}
        onFiltersPress={() => setFilterSheetOpen(true)}
      />

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onReset={resetSecondaryFilters}
        sections={filterSections}
      />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="אין אנשי קשר"
            description="שנה סינון או חיפוש"
            icon={<MaterialCommunityIcons name="account-group-outline" size={32} color={Colors.primary} />}
            actionLabel="הוסף איש קשר"
            onAction={() => router.push('/(app)/contacts/new')}
            style={{ paddingTop: Spacing.xl }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Pressable onPress={() => router.push(`/(app)/contacts/${item.id}`)} style={styles.rowTap} accessibilityRole="button">
              <View style={[styles.td, { flex: 0.95 }]}>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={2}>
                  {roleDisplayLabel(item)}
                </AppText>
              </View>
              <View style={[styles.td, { flex: 0.85 }]}>
                <AppText variant="caption" numberOfLines={2}>
                  {item.linkLabel}
                </AppText>
              </View>
              <View style={[styles.td, { flex: 0.95 }]}>
                <AppText variant="bodySm" numberOfLines={2}>
                  {item.displayName}
                </AppText>
              </View>
              <Pressable onPress={() => openUrl(telUrl(item.phone))} style={[styles.td, { flex: 0.85 }]} accessibilityRole="link" accessibilityLabel="חייג">
                <AppText variant="bodySm" color="primary" weight="semiBold" numberOfLines={1}>
                  {item.phone}
                </AppText>
              </Pressable>
            </Pressable>
            <Pressable onPress={() => openUrl(whatsappUrlFromPhone(item.phone))} style={styles.waBtn} accessibilityRole="button" accessibilityLabel="WhatsApp">
              <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
            </Pressable>
          </View>
        )}
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(app)/contacts/new')}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="הוסף איש קשר"
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
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  thRow: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  thCell: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: Spacing.sm,
    minHeight: MIN_TOUCH,
  },
  thWa: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.outlineVariant,
    minHeight: MIN_TOUCH,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  rowTap: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, paddingVertical: Spacing.sm },
  td: { paddingHorizontal: 4, justifyContent: 'center' },
  waBtn: { width: 48, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: Colors.outlineLight },
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
