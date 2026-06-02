import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import { AppHeader } from '@/components/ui/AppHeader';
import { RTL_ROW } from '@/constants/rtl';
import { MOCK_ENTITY_LINKS } from '@/lib/mocks/contracts';
import {
  MOCK_TASKS_LIST,
  MOCK_ASSIGNEE_NAMES,
  filterTaskRows,
  sortTaskRows,
  getRecentTasksForUser,
  TASK_KIND_LABELS,
  TASK_KIND_ICONS,
  TASK_PRIORITY_LABELS,
  WORKFLOW_STATUS_LABELS,
  type TaskKind,
  type TaskKindFilter,
  type TaskPriorityFilter,
  type LinkScopeFilter,
  type TaskStatusTab,
  type TaskListRow,
  type WorkflowStatus,
  type TaskSortKey,
  type SortDir,
} from '@/lib/mocks/tasks';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  FontFamily,
  FontSize,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';

type ScopeFilter = 'all' | 'by_asset' | 'by_project';

const SCOPE_OPTIONS: { key: ScopeFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'by_asset', label: 'נכס' },
  { key: 'by_project', label: 'פרויקט' },
];

const TASK_KIND_OPTIONS: { key: TaskKindFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  ...((Object.keys(TASK_KIND_LABELS) as TaskKind[]).map((k) => ({ key: k as TaskKindFilter, label: TASK_KIND_LABELS[k] }))),
];

const PRIORITY_OPTIONS: { key: TaskPriorityFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'urgent', label: TASK_PRIORITY_LABELS.urgent },
  { key: 'high', label: TASK_PRIORITY_LABELS.high },
  { key: 'medium', label: TASK_PRIORITY_LABELS.medium },
  { key: 'low', label: TASK_PRIORITY_LABELS.low },
];

const STATUS_TABS: { key: TaskStatusTab; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'in_progress', label: 'בתהליך' },
  { key: 'open', label: 'פתוחות' },
  { key: 'completed', label: 'הושלמו' },
  { key: 'urgent', label: 'דחופות' },
];

const QUICK_STATUSES: WorkflowStatus[] = ['open', 'in_progress', 'completed', 'cancelled'];

function linkScopeFromScope(scope: ScopeFilter): LinkScopeFilter {
  if (scope === 'by_asset') return 'asset';
  if (scope === 'by_project') return 'project';
  return 'all';
}

function priorityPreset(p: TaskListRow['priority']): React.ComponentProps<typeof Badge>['preset'] {
  if (p === 'urgent') return 'error';
  if (p === 'high') return 'warning';
  if (p === 'medium') return 'warning';
  return 'neutral';
}

function statusPreset(s: TaskListRow['workflowStatus']): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'not_started') return 'neutral';
  if (s === 'open') return 'statusOpen';
  if (s === 'in_progress') return 'statusInProgress';
  if (s === 'completed') return 'statusClosed';
  return 'statusCancelled';
}

function iconName(kind: TaskKind): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  return TASK_KIND_ICONS[kind] as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

function paramStr(v: string | string[] | undefined): string {
  if (v === undefined) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

const WORKFLOW_PARAM_VALUES: WorkflowStatus[] = [
  'not_started',
  'open',
  'in_progress',
  'completed',
  'cancelled',
];

export function TasksListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    assignee?: string;
    workflowStatus?: string;
    statusTab?: string;
  }>();
  const [rows, setRows] = useState<TaskListRow[]>(() => [...MOCK_TASKS_LIST]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [taskKind, setTaskKind] = useState<TaskKindFilter>('all');
  const [priority, setPriority] = useState<TaskPriorityFilter>('all');
  const [statusTab, setStatusTab] = useState<TaskStatusTab>('all');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [workflowStatusExact, setWorkflowStatusExact] = useState<WorkflowStatus | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<TaskSortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [statusModalTaskId, setStatusModalTaskId] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const w = paramStr(params.workflowStatus);
    if (WORKFLOW_PARAM_VALUES.includes(w as WorkflowStatus)) {
      setWorkflowStatusExact(w as WorkflowStatus);
    } else {
      setWorkflowStatusExact(null);
    }
  }, [params.workflowStatus]);

  useEffect(() => {
    const a = paramStr(params.assignee);
    if (a) setAssignee(a);
  }, [params.assignee]);

  useEffect(() => {
    const st = paramStr(params.statusTab);
    if (st === 'all' || st === 'in_progress' || st === 'open' || st === 'completed' || st === 'urgent') {
      setStatusTab(st);
    }
  }, [params.statusTab]);

  const linkScope = linkScopeFromScope(scope);

  const filtered = useMemo(
    () =>
      filterTaskRows(rows, {
        search,
        taskKind,
        priority,
        statusTab,
        linkScope,
        entityId,
        assignee,
        dateFrom,
        dateTo,
        workflowStatusExact: workflowStatusExact ?? undefined,
      }),
    [rows, search, taskKind, priority, statusTab, linkScope, entityId, assignee, dateFrom, dateTo, workflowStatusExact],
  );

  const sorted = useMemo(() => sortTaskRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const recentMine = useMemo(() => getRecentTasksForUser(rows, 6), [rows]);

  const statusModalTask = statusModalTaskId ? rows.find((r) => r.id === statusModalTaskId) : null;

  const setWorkflowForTask = useCallback((id: string, workflowStatus: WorkflowStatus) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, workflowStatus } : r)));
    setStatusModalTaskId(null);
  }, []);

  const onSortPress = useCallback((key: TaskSortKey) => {
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

  const activeSecondaryCount = useMemo(() => {
    let count = 0;
    if (taskKind !== 'all') count++;
    if (priority !== 'all') count++;
    if (scope !== 'all') count++;
    if (assignee !== null) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [taskKind, priority, scope, assignee, dateFrom, dateTo]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        kind: 'chips',
        label: 'סוג משימה',
        options: TASK_KIND_OPTIONS.map((o) => ({
          key: String(o.key),
          label: o.label,
          icon: o.key !== 'all' ? String(iconName(o.key as TaskKind)) : undefined,
        })),
        value: taskKind,
        onChange: (k) => setTaskKind(k as TaskKindFilter),
      },
      {
        kind: 'chips',
        label: 'דחיפות',
        options: PRIORITY_OPTIONS.map((o) => ({ key: String(o.key), label: o.label })),
        value: priority,
        onChange: (k) => setPriority(k as TaskPriorityFilter),
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
        placeholder: scope === 'by_asset' ? 'הקלד שם נכס...' : 'הקלד שם פרויקט...',
        options: entitiesForScope.map((e) => ({ key: e.id, label: e.name })),
        value: entityId,
        onChange: setEntityId,
        visible: scope !== 'all',
      },
      {
        kind: 'conditionalChips',
        label: 'עובד / אחראי',
        options: MOCK_ASSIGNEE_NAMES.map((name) => ({ key: name, label: name })),
        value: assignee,
        onChange: setAssignee,
        visible: true,
      },
      {
        kind: 'dateRange',
        label: 'טווח תאריך יעד',
        from: dateFrom,
        to: dateTo,
        onFromChange: setDateFrom,
        onToChange: setDateTo,
      },
      {
        kind: 'sort',
        label: 'מיון',
        options: [
          { key: 'dueDate', label: 'תאריך יעד' },
          { key: 'title', label: 'כותרת' },
          { key: 'priority', label: 'דחיפות' },
        ],
        sortKey,
        sortDir,
        onSortKeyChange: (k) => {
          setSortKey(k as TaskSortKey);
          setSortDir('asc');
        },
        onSortDirToggle: () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')),
      },
    ],
    [taskKind, priority, scope, entityId, entitiesForScope, assignee, dateFrom, dateTo, sortKey, sortDir],
  );

  const resetSecondaryFilters = useCallback(() => {
    setTaskKind('all');
    setPriority('all');
    setScope('all');
    setEntityId(null);
    setAssignee(null);
    setDateFrom('');
    setDateTo('');
  }, []);

  const listHeader = (
    <>
      {recentMine.length > 0 && (
        <View style={styles.recentBlock}>
          <AppText variant="labelMd" weight="bold" style={styles.recentTitle}>
            משימות אחרונות המשויכות אליי
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {recentMine.map((t) => (
              <Pressable key={t.id} onPress={() => router.push(`/(app)/tasks/${t.id}`)} style={styles.recentCard}>
                <View style={styles.recentIconWrap}>
                  <MaterialCommunityIcons name={iconName(t.taskKind)} size={20} color={Colors.primary} />
                </View>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={2} style={{ textAlign: 'right', marginTop: 4 }}>
                  {t.title}
                </AppText>
                <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>
                  {t.dueDate}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="משימות"
        subtitle="כל הנכסים והפרויקטים · כל סוגי המשימות"
        showMenu
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label }))}
        activeTab={statusTab}
        onTabChange={(k) => setStatusTab(k as TaskStatusTab)}
        activeSecondaryCount={activeSecondaryCount}
        onFiltersPress={() => setFilterSheetOpen(true)}
      />

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onReset={resetSecondaryFilters}
        sections={filterSections}
      />

      {sorted.length > 0 && (
        <View style={styles.tableHeader}>
          <View style={styles.thKind} />
          <AppText variant="caption" weight="semiBold" style={[styles.thCell, { flex: 2 }]}>כותרת</AppText>
          <AppText variant="caption" weight="semiBold" style={styles.thCell}>נכס / פרויקט</AppText>
          <AppText variant="caption" weight="semiBold" style={styles.thDate}>יעד</AppText>
          <AppText variant="caption" weight="semiBold" style={styles.thStatus}>סטטוס</AppText>
          <View style={{ width: 36 }} />
        </View>
      )}

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing['2xl'],
          paddingTop: Spacing.xs,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        ListEmptyComponent={
          <EmptyState
            title="אין משימות"
            description="שנה סינון או חיפוש"
            icon={<MaterialCommunityIcons name="checkbox-outline" size={32} color={Colors.primary} />}
            actionLabel="משימה חדשה"
            onAction={() => router.push('/(app)/tasks/new')}
            style={{ paddingTop: Spacing.xl, paddingHorizontal: CONTENT_HORIZONTAL_PADDING }}
          />
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/(app)/tasks/${item.id}`)}
            style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            accessibilityRole="button"
          >
            {/* Kind icon */}
            <View style={styles.tdKind}>
              <MaterialCommunityIcons name={iconName(item.taskKind)} size={18} color={Colors.primary} />
            </View>

            {/* Title + priority */}
            <View style={[styles.tdCell, { flex: 2 }]}>
              <AppText variant="bodySm" weight="semiBold" numberOfLines={2} style={{ textAlign: 'right' }}>
                {item.title}
              </AppText>
              <Badge label={TASK_PRIORITY_LABELS[item.priority]} preset={priorityPreset(item.priority)} style={{ alignSelf: 'flex-end', marginTop: 2 }} />
            </View>

            {/* Link */}
            <View style={styles.tdCell}>
              <View style={styles.linkBadge}>
                <MaterialCommunityIcons
                  name={item.linkKind === 'project' ? 'briefcase-outline' : 'home-outline'}
                  size={11}
                  color={Colors.primary}
                />
                <AppText variant="caption" numberOfLines={2} style={{ color: Colors.primary, textAlign: 'right', flex: 1 }}>
                  {item.linkLabel}
                </AppText>
              </View>
              {item.assigneeName ? (
                <AppText variant="caption" color="muted" numberOfLines={1} style={{ textAlign: 'right', marginTop: 2 }}>
                  {item.assigneeName}
                </AppText>
              ) : null}
            </View>

            {/* Due date */}
            <View style={styles.tdDate}>
              <AppText variant="caption" color="variant" style={{ textAlign: 'center' }}>
                {item.dueDate}
              </AppText>
            </View>

            {/* Status */}
            <View style={styles.tdStatus}>
              <Badge label={WORKFLOW_STATUS_LABELS[item.workflowStatus]} preset={statusPreset(item.workflowStatus)} />
            </View>

            {/* Quick status change */}
            <Pressable
              onPress={() => setStatusModalTaskId(item.id)}
              style={styles.tdAction}
              accessibilityRole="button"
              accessibilityLabel="שינוי סטטוס מהיר"
              hitSlop={8}
            >
              <MaterialCommunityIcons name="swap-vertical" size={18} color={Colors.primary} />
            </Pressable>
          </Pressable>
        )}
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(app)/tasks/new')}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="משימה חדשה"
      >
        <MaterialCommunityIcons name="plus" size={26} color={Colors.onPrimary} />
      </Pressable>

      <Modal visible={!!statusModalTask} transparent animationType="fade" onRequestClose={() => setStatusModalTaskId(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStatusModalTaskId(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
              עדכון סטטוס
            </AppText>
            {statusModalTask && (
              <AppText variant="bodySm" color="variant" numberOfLines={2} style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
                {statusModalTask.title}
              </AppText>
            )}
            {QUICK_STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => statusModalTaskId && setWorkflowForTask(statusModalTaskId, s)}
                style={[styles.modalOption, statusModalTask?.workflowStatus === s && styles.modalOptionActive]}
              >
                <AppText variant="bodyMd" weight={statusModalTask?.workflowStatus === s ? 'bold' : 'regular'}>
                  {WORKFLOW_STATUS_LABELS[s]}
                </AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const COL_KIND = 32;
const COL_DATE = 72;
const COL_STATUS = 80;
const COL_ACTION = 36;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  recentBlock: {
    paddingVertical: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.background,
  },
  recentTitle: { textAlign: 'right', marginBottom: Spacing.sm },
  recentRow: { flexDirection: RTL_ROW, gap: Spacing.sm, paddingBottom: Spacing.xs },
  recentCard: {
    width: 160,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },

  // ── Table header ──
  tableHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  thKind: { width: COL_KIND },
  thCell: {
    flex: 1,
    textAlign: 'right',
    color: Colors.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  thDate: { width: COL_DATE, textAlign: 'center', color: Colors.onSurfaceVariant },
  thStatus: { width: COL_STATUS, textAlign: 'right', color: Colors.onSurfaceVariant, paddingHorizontal: 4 },

  // ── Table rows ──
  tableRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    minHeight: 56,
  },
  tableRowAlt: { backgroundColor: Colors.surfaceVariant },
  rowSeparator: { height: 1, backgroundColor: Colors.outlineLight },
  linkBadge: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-end',
  },

  // ── Cells ──
  tdKind: { width: COL_KIND, alignItems: 'center', justifyContent: 'center' },
  tdCell: { flex: 1, paddingHorizontal: 4, alignItems: 'flex-end' },
  tdDate: { width: COL_DATE, alignItems: 'center' },
  tdStatus: { width: COL_STATUS, alignItems: 'flex-end', paddingHorizontal: 4 },
  tdAction: { width: COL_ACTION, alignItems: 'center', justifyContent: 'center' },

  // ── Modals ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  modalOptionActive: { backgroundColor: Colors.primaryContainer },

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
