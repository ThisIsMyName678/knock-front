import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { RTL_ROW } from '@/constants/rtl';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import type { LinkKind } from '@/lib/mocks/contracts';
import { MOCK_ENTITY_LINKS } from '@/lib/mocks/contracts';
import {
  MOCK_DOCUMENTS_LIST,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ACCESS_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  filterDocumentRows,
  sortDocumentRows,
  setActiveDocumentRowsSnapshot,
  getActiveDocumentRowsSnapshot,
  consumePendingDocuments,
  DOCUMENT_UPLOAD_TYPE_ORDER,
  type DocumentListRow,
  type DocumentCategoryFilter,
  type DocumentSortKey,
  type DocumentType,
  type DocumentAccessLevel,
  type SortDir,
} from '@/lib/mocks/documents';
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

const CATEGORY_OPTIONS: { key: DocumentCategoryFilter; label: string }[] = (
  Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategoryFilter[]
).map((key) => ({ key, label: DOCUMENT_CATEGORY_LABELS[key] }));

const SORT_COLUMNS: { key: DocumentSortKey; label: string; flex: number }[] = [
  { key: 'displayName', label: 'שם', flex: 1.15 },
  { key: 'documentType', label: 'סוג', flex: 0.72 },
  { key: 'linkLabel', label: 'שיוך', flex: 0.72 },
  { key: 'uploadedAt', label: 'תאריך', flex: 0.58 },
  { key: 'accessLevel', label: 'הרשאות', flex: 0.62 },
];

function linkScopeFromScope(scope: ScopeFilter): 'all' | LinkKind {
  if (scope === 'by_asset') return 'asset';
  if (scope === 'by_project') return 'project';
  return 'all';
}

function accessShort(level: DocumentAccessLevel): string {
  if (level === 'owner_only') return 'פרטי';
  if (level === 'tenant') return 'שוכר';
  if (level === 'employee') return 'עובד';
  return 'ציבורי';
}

function accessPreset(level: DocumentAccessLevel): React.ComponentProps<typeof Badge>['preset'] {
  if (level === 'owner_only') return 'neutral';
  if (level === 'tenant') return 'info';
  if (level === 'employee') return 'warning';
  return 'success';
}

function randomDocId() {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function DocumentsListScreen() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<DocumentListRow[]>(() => [...MOCK_DOCUMENTS_LIST]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategoryFilter>('all');
  const [sortKey, setSortKey] = useState<DocumentSortKey>('uploadedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [editRow, setEditRow] = useState<DocumentListRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<DocumentType>('other');
  const [editAccess, setEditAccess] = useState<DocumentAccessLevel>('owner_only');
  const [menuRow, setMenuRow] = useState<DocumentListRow | null>(null);

  const linkScope = linkScopeFromScope(scope);

  useFocusEffect(
    useCallback(() => {
      setRows((prev) => {
        const pending = consumePendingDocuments();
        const snap = getActiveDocumentRowsSnapshot();
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
    setActiveDocumentRowsSnapshot(rows);
  }, [rows]);

  const filtered = useMemo(
    () =>
      filterDocumentRows(rows, {
        search,
        linkScope,
        entityId,
        categoryFilter,
      }),
    [rows, search, linkScope, entityId, categoryFilter],
  );

  const sorted = useMemo(() => sortDocumentRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const onHeaderPress = useCallback((key: DocumentSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const exportData = useCallback(async () => {
    const header = 'שם,סוג,שיוך,תאריך,הרשאות\n';
    const lines = sorted.map((r) =>
      [`"${r.displayName}"`, DOCUMENT_TYPE_LABELS[r.documentType], `"${r.linkLabel}"`, r.uploadedAt, DOCUMENT_ACCESS_LABELS[r.accessLevel]].join(','),
    );
    try {
      await Share.share({ message: header + lines.join('\n'), title: 'ייצוא מסמכים' });
    } catch {
      /* ignore */
    }
  }, [sorted]);

  const entitiesForScope = useMemo(() => {
    if (scope === 'by_asset') return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'asset');
    if (scope === 'by_project') return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'project');
    return [];
  }, [scope]);

  const openEdit = useCallback((row: DocumentListRow) => {
    setEditRow(row);
    setEditName(row.displayName);
    setEditType(row.documentType);
    setEditAccess(row.accessLevel);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editRow) return;
    const name = editName.trim();
    if (!name) return;
    setRows((prev) =>
      prev.map((r) => (r.id === editRow.id ? { ...r, displayName: name, documentType: editType, accessLevel: editAccess } : r)),
    );
    setEditRow(null);
  }, [editRow, editName, editType, editAccess]);

  const duplicateRow = useCallback((row: DocumentListRow) => {
    const copy: DocumentListRow = {
      ...row,
      id: randomDocId(),
      displayName: `${row.displayName} (עותק)`,
    };
    setRows((prev) => [copy, ...prev]);
  }, []);

  const deleteRow = useCallback((row: DocumentListRow) => {
    Alert.alert('מחיקת מסמך', `למחוק את "${row.displayName}"?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => setRows((prev) => prev.filter((r) => r.id !== row.id)),
      },
    ]);
  }, []);

  const downloadMock = useCallback((row: DocumentListRow) => {
    Share.share({
      message: `הורדה (דמה)\n${row.displayName}\nhttps://files.example.mock/${row.id}`,
      title: row.displayName,
    }).catch(() => {});
  }, []);

  const shareRow = useCallback((row: DocumentListRow) => {
    Share.share({ message: row.displayName, title: 'שיתוף מסמך' }).catch(() => {});
  }, []);

  const activeSecondaryCount = useMemo(() => {
    let count = 0;
    if (scope !== 'all') count++;
    return count;
  }, [scope]);

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
        options: entitiesForScope.map((e) => ({ key: e.id, label: e.name })),
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
    <>
      <View style={styles.tableHeader}>
        {SORT_COLUMNS.map((col) => {
          const active = sortKey === col.key;
          return (
            <Pressable
              key={col.key}
              onPress={() => onHeaderPress(col.key)}
              style={[styles.thCell, { flex: col.flex }]}
              accessibilityRole="button"
            >
              <AppText variant="labelSm" weight="bold" color="primary" numberOfLines={2} align="right">
                {col.label}
              </AppText>
              {active && <MaterialCommunityIcons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={Colors.primary} />}
            </Pressable>
          );
        })}
        <View style={[styles.thCell, { width: 128, flex: undefined }]}>
          <AppText variant="labelSm" weight="bold" color="primary" align="right">
            פעולות
          </AppText>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="מסמכים וקבצים" showMenu />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        tabs={CATEGORY_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
        activeTab={categoryFilter}
        onTabChange={(k) => setCategoryFilter(k as DocumentCategoryFilter)}
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
            title="אין מסמכים"
            description="שנה סינון או חיפוש"
            icon={<MaterialCommunityIcons name="folder-outline" size={32} color={Colors.primary} />}
            actionLabel="העלה מסמך"
            onAction={() => router.push('/(app)/documents/new')}
            style={{ paddingTop: Spacing.xl }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Pressable
              onPress={() => router.push(`/(app)/documents/${item.id}`)}
              style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
            >
              <View style={[styles.td, { flex: 1.15 }]}>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={2}>
                  {item.displayName}
                </AppText>
              </View>
              <View style={[styles.td, { flex: 0.72 }]}>
                <AppText variant="caption" color="variant" numberOfLines={2}>
                  {DOCUMENT_TYPE_LABELS[item.documentType]}
                </AppText>
              </View>
              <View style={[styles.td, { flex: 0.72 }]}>
                <AppText variant="caption" numberOfLines={1}>
                  {item.linkLabel}
                </AppText>
              </View>
              <View style={[styles.td, { flex: 0.58 }]}>
                <AppText variant="caption" color="muted">
                  {item.uploadedAt}
                </AppText>
              </View>
              <View style={[styles.td, { flex: 0.62, alignItems: 'flex-end' }]}>
                <Badge label={accessShort(item.accessLevel)} preset={accessPreset(item.accessLevel)} />
              </View>
            </Pressable>
            <Pressable
              onPress={() => setMenuRow(item)}
              style={styles.menuBtn}
              accessibilityLabel="פעולות"
            >
              <MaterialCommunityIcons name="dots-vertical" size={22} color={Colors.onSurfaceVariant} />
            </Pressable>
          </View>
        )}
      />

      {/* ─── Action menu sheet ─── */}
      <Modal visible={!!menuRow} transparent animationType="slide" onRequestClose={() => setMenuRow(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenuRow(null)}>
          <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            {menuRow && (
              <AppText variant="labelMd" weight="bold" numberOfLines={1} style={styles.sheetTitle}>
                {menuRow.displayName}
              </AppText>
            )}
            {[
              { icon: 'download-outline' as const, label: 'הורדה', color: Colors.primary, onPress: () => { downloadMock(menuRow!); setMenuRow(null); } },
              { icon: 'share-variant-outline' as const, label: 'שיתוף', color: Colors.primary, onPress: () => { shareRow(menuRow!); setMenuRow(null); } },
              { icon: 'content-copy' as const, label: 'שכפול', color: Colors.onBackground, onPress: () => { duplicateRow(menuRow!); setMenuRow(null); } },
              { icon: 'pencil-outline' as const, label: 'עריכה', color: Colors.onBackground, onPress: () => { openEdit(menuRow!); setMenuRow(null); } },
              { icon: 'delete-outline' as const, label: 'מחיקה', color: Colors.error, onPress: () => { deleteRow(menuRow!); setMenuRow(null); } },
            ].map((action) => (
              <Pressable key={action.label} onPress={action.onPress} style={({ pressed }) => [styles.sheetAction, pressed && { opacity: 0.7 }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: action.color }}>
                  {action.label}
                </AppText>
              </Pressable>
            ))}
            <Pressable onPress={() => setMenuRow(null)} style={[styles.sheetAction, { marginTop: Spacing.sm, justifyContent: 'center' }]}>
              <AppText variant="bodyMd" color="variant" align="center">ביטול</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!editRow} transparent animationType="fade" onRequestClose={() => setEditRow(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditRow(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
              עריכת מסמך
            </AppText>
            <Input label="שם" value={editName} onChangeText={setEditName} containerStyle={{ marginBottom: Spacing.md }} />
            <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.sm, textAlign: 'right' }}>
              סוג מסמך
            </AppText>
            <View style={styles.typeGrid}>
              {DOCUMENT_UPLOAD_TYPE_ORDER.map((t) => (
                <Pressable key={t} onPress={() => setEditType(t)} style={[styles.typeChip, editType === t && styles.typeChipActive]}>
                  <AppText variant="caption" numberOfLines={2} weight={editType === t ? 'bold' : 'regular'} style={{ color: editType === t ? Colors.onPrimary : Colors.onSurfaceVariant, textAlign: 'center' }}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.sm, textAlign: 'right' }}>
              הרשאות
            </AppText>
            <View style={{ flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg }}>
              {(['owner_only', 'tenant', 'employee', 'public'] as DocumentAccessLevel[]).map((a) => (
                <Pressable key={a} onPress={() => setEditAccess(a)} style={[styles.typeChip, editAccess === a && styles.typeChipActive]}>
                  <AppText variant="caption" weight={editAccess === a ? 'bold' : 'regular'} style={{ color: editAccess === a ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    {DOCUMENT_ACCESS_LABELS[a]}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: RTL_ROW, gap: Spacing.sm }}>
              <Button label="ביטול" variant="secondary" onPress={() => setEditRow(null)} style={{ flex: 1 }} />
              <Button label="שמור" onPress={saveEdit} style={{ flex: 1 }} disabled={!editName.trim()} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(app)/documents/new')}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="העלה מסמך"
      >
        <MaterialCommunityIcons name="plus" size={26} color={Colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  tableHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  thCell: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
    minHeight: MIN_TOUCH,
  },
  tableRow: {
    flexDirection: RTL_ROW,
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  rowMain: { flexDirection: RTL_ROW, alignItems: 'center', flex: 1, paddingVertical: Spacing.sm, paddingLeft: Spacing.xs },
  td: { paddingHorizontal: 4, justifyContent: 'center' },
  menuBtn: {
    width: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.outlineLight,
  },
  actionSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Shadow.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    textAlign: 'right',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  sheetAction: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: Spacing.lg },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '85%',
  },
  typeChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: Spacing.xs,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
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
