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
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { RTL_ROW } from '@/constants/rtl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import { ListRowSkeletonList, FadeInContent, useSkeletonGate } from '@/components/ui/skeleton';
import type { LinkKind } from '@/lib/mocks/contracts';
import { MOCK_ENTITY_LINKS } from '@/lib/mocks/contracts';
import {
  MOCK_DOCUMENTS_LIST,
  DOCUMENT_TYPE_LABELS,
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

function fileIconName(kind: DocumentListRow['fileKind']): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (kind === 'pdf') return 'file-pdf-box';
  if (kind === 'image') return 'file-image-outline';
  return 'file-outline';
}

function fileIconColor(kind: DocumentListRow['fileKind']): string {
  if (kind === 'pdf') return '#e53935';
  if (kind === 'image') return Colors.info;
  return Colors.onSurfaceVariant;
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
  const [menuRow, setMenuRow] = useState<DocumentListRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListRow | null>(null);
  const [loading, setLoading] = useState(true);

  const linkScope = linkScopeFromScope(scope);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
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
      const id = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(id);
    }, []),
  );

  const showSkeleton = useSkeletonGate(loading);

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

  const entitiesForScope = useMemo(() => {
    if (scope === 'by_asset') return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'asset');
    if (scope === 'by_project') return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'project');
    return [];
  }, [scope]);

  const duplicateRow = useCallback((row: DocumentListRow) => {
    const copy: DocumentListRow = {
      ...row,
      id: randomDocId(),
      displayName: `${row.displayName} (עותק)`,
    };
    setRows((prev) => [copy, ...prev]);
  }, []);

  const deleteRow = useCallback((row: DocumentListRow) => {
    setTimeout(() => setDeleteTarget(row), 50);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

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

      {showSkeleton ? (
        <ListRowSkeletonList count={6} variant="document" showTableHeader={false} style={{ flex: 1 }} />
      ) : (
        <FadeInContent visible style={{ flex: 1 }}>
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
              paddingTop: Spacing.sm,
              paddingBottom: insets.bottom + 88,
              gap: Spacing.sm,
            }}
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
              <View style={styles.card}>
                <Pressable
                  onPress={() => router.push(`/(app)/documents/${item.id}`)}
                  style={({ pressed }) => [styles.cardBody, pressed && { opacity: 0.88 }]}
                  accessibilityRole="button"
                >
                  {/* Row 1: file icon + name + menu button */}
                  <View style={styles.cardRow}>
                    <TouchableOpacity
                      onPress={() => setTimeout(() => setMenuRow(item), 30)}
                      style={styles.menuBtn}
                      accessibilityLabel="פעולות"
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={22} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <AppText
                      variant="bodyMd"
                      weight="semiBold"
                      numberOfLines={2}
                      style={{ flex: 1, textAlign: 'right' }}
                    >
                      {item.displayName}
                    </AppText>
                    <View style={[styles.fileIconWrap, { backgroundColor: `${fileIconColor(item.fileKind)}18` }]}>
                      <MaterialCommunityIcons
                        name={fileIconName(item.fileKind)}
                        size={22}
                        color={fileIconColor(item.fileKind)}
                      />
                    </View>
                  </View>

                  {/* Row 2: type tag + date */}
                  <View style={[styles.cardRow, { marginTop: Spacing.sm }]}>
                    <View style={styles.metaGroup}>
                      <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.onSurfaceMuted} />
                      <AppText variant="caption" color="muted">{item.uploadedAt}</AppText>
                    </View>
                    <View style={styles.typeTag}>
                      <AppText variant="caption" color="variant" numberOfLines={1}>
                        {DOCUMENT_TYPE_LABELS[item.documentType]}
                      </AppText>
                    </View>
                  </View>

                  {/* Row 3: access badge + size + link */}
                  <View style={[styles.cardRow, { marginTop: Spacing.xs }]}>
                    <View style={styles.metaGroup}>
                      <Badge label={accessShort(item.accessLevel)} preset={accessPreset(item.accessLevel)} />
                      <AppText variant="caption" color="muted">{item.sizeLabel}</AppText>
                    </View>
                    <View style={styles.linkBadge}>
                      <MaterialCommunityIcons
                        name={item.linkKind === 'project' ? 'briefcase-outline' : 'home-outline'}
                        size={12}
                        color={Colors.primary}
                      />
                      <AppText variant="caption" numberOfLines={1} style={{ color: Colors.primary, maxWidth: 160 }}>
                        {item.linkLabel}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              </View>
            )}
          />
        </FadeInContent>
      )}

      {/* ─── Action menu sheet ─── */}
      <Modal visible={!!menuRow} transparent animationType="slide" onRequestClose={() => setMenuRow(null)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setMenuRow(null)} />
          <View style={styles.actionSheet}>
            <View style={styles.sheetHandle} />
            {menuRow && (
              <View style={styles.sheetTitleRow}>
                <View style={[styles.fileIconWrap, { backgroundColor: `${fileIconColor(menuRow.fileKind)}18` }]}>
                  <MaterialCommunityIcons
                    name={fileIconName(menuRow.fileKind)}
                    size={20}
                    color={fileIconColor(menuRow.fileKind)}
                  />
                </View>
                <AppText variant="labelMd" weight="bold" numberOfLines={2} style={styles.sheetTitle}>
                  {menuRow.displayName}
                </AppText>
              </View>
            )}
            {([
              { icon: 'open-in-new' as const, label: 'פתח', color: Colors.primary, onPress: () => { router.push(`/(app)/documents/${menuRow!.id}`); setMenuRow(null); } },
              { icon: 'pencil-outline' as const, label: 'עריכה', color: Colors.onBackground, onPress: () => { router.push(`/(app)/documents/edit/${menuRow!.id}`); setMenuRow(null); } },
              { icon: 'content-copy' as const, label: 'שכפול', color: Colors.onBackground, onPress: () => { duplicateRow(menuRow!); setMenuRow(null); } },
              { icon: 'delete-outline' as const, label: 'מחיקה', color: Colors.error, onPress: () => { deleteRow(menuRow!); setMenuRow(null); } },
            ] as const).map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.7}
                onPress={action.onPress}
                style={styles.sheetAction}
              >
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: action.color }}>
                  {action.label}
                </AppText>
                <MaterialCommunityIcons name="chevron-left" size={18} color={action.color} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity activeOpacity={0.7} onPress={() => setMenuRow(null)} style={styles.sheetCancel}>
              <AppText variant="bodyMd" color="variant" align="center">ביטול</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Edit modal ─── */}

      {/* ─── Delete confirmation modal ─── */}
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
              מחיקת מסמך
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

  // ── Card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    ...Shadow.sm,
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metaGroup: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  linkBadge: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    flexShrink: 1,
  },
  menuBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceVariant,
    flexShrink: 0,
  },

  // ── Action sheet ──
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
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
  sheetTitleRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  sheetTitle: {
    flex: 1,
    textAlign: 'right',
  },
  sheetAction: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    minHeight: MIN_TOUCH,
  },
  sheetCancel: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },

  // ── Edit sheet ──
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: Spacing.xl,
    ...Shadow.lg,
  },
  editHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  editCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  editSectionLabel: {
    textAlign: 'right',
    marginBottom: Spacing.sm,
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    color: Colors.onSurfaceVariant,
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
  typeGrid: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
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

  // ── Delete confirmation modal ──
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
});
