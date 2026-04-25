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
        kind: 'conditionalChips',
        label: scope === 'by_asset' ? 'בחר נכס' : 'בחר פרויקט',
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
            <View style={styles.actionsCol}>
              <Pressable onPress={() => downloadMock(item)} style={styles.actionIcon} accessibilityLabel="הורדה">
                <MaterialCommunityIcons name="download-outline" size={20} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => shareRow(item)} style={styles.actionIcon} accessibilityLabel="שיתוף">
                <MaterialCommunityIcons name="share-variant-outline" size={20} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => duplicateRow(item)} style={styles.actionIcon} accessibilityLabel="שכפול">
                <MaterialCommunityIcons name="content-copy" size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
              <Pressable onPress={() => openEdit(item)} style={styles.actionIcon} accessibilityLabel="עריכה">
                <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
              <Pressable onPress={() => deleteRow(item)} style={styles.actionIcon} accessibilityLabel="מחיקה">
                <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        )}
      />

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
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg }}>
              {(['owner_only', 'tenant', 'employee', 'public'] as DocumentAccessLevel[]).map((a) => (
                <Pressable key={a} onPress={() => setEditAccess(a)} style={[styles.typeChip, editAccess === a && styles.typeChipActive]}>
                  <AppText variant="caption" weight={editAccess === a ? 'bold' : 'regular'} style={{ color: editAccess === a ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    {DOCUMENT_ACCESS_LABELS[a]}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: Spacing.sm }}>
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
  rowMain: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, paddingVertical: Spacing.sm, paddingLeft: Spacing.xs },
  td: { paddingHorizontal: 4, justifyContent: 'center' },
  actionsCol: {
    width: 128,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRightWidth: 1,
    borderRightColor: Colors.outlineLight,
  },
  actionIcon: { padding: Spacing.xs, minWidth: MIN_TOUCH * 0.75, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: Spacing.lg },
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
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
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
