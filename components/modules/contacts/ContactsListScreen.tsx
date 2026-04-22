import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
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

  const listHeader = (
    <>
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.onSurfaceMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש (שם, תפקיד, טלפון, שיוך)..."
            placeholderTextColor={Colors.onSurfaceMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          סינון שיוך
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
            >
              <AppText variant="labelMd" weight={scope === o.key ? 'bold' : 'regular'} style={{ color: scope === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
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
            {entitiesForScope.map((e) => (
              <Pressable key={e.id} onPress={() => setEntityId(e.id)} style={[styles.chip, entityId === e.id && styles.chipActive]}>
                <AppText variant="labelMd" weight={entityId === e.id ? 'bold' : 'regular'} numberOfLines={1} style={{ color: entityId === e.id ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {e.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.tableHeader}>
        {COLUMNS.map((col) => {
          const active = sortKey === col.key;
          return (
            <Pressable key={col.key} onPress={() => onHeaderPress(col.key)} style={[styles.thCell, { flex: col.flex }]} accessibilityRole="button">
              <AppText variant="labelSm" weight="bold" color="primary" numberOfLines={2} align="right">
                {col.label}
              </AppText>
              {active && <MaterialCommunityIcons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={Colors.primary} />}
            </Pressable>
          );
        })}
        <View style={[styles.thCell, { width: 44, flex: undefined }]}>
          <AppText variant="labelSm" weight="bold" color="primary" align="center">
            WA
          </AppText>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">
          אנשי קשר
        </AppText>
        <Pressable onPress={() => router.push('/(app)/contacts/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

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
});
