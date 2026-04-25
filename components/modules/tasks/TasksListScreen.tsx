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
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import { AppHeader } from '@/components/ui/AppHeader';
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
        kind: 'conditionalChips',
        label: scope === 'by_asset' ? 'בחר נכס' : 'בחר פרויקט',
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

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing['2xl'],
          paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
          paddingTop: Spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            title="אין משימות"
            description="שנה סינון או חיפוש"
            icon={<MaterialCommunityIcons name="checkbox-outline" size={32} color={Colors.primary} />}
            actionLabel="משימה חדשה"
            onAction={() => router.push('/(app)/tasks/new')}
            style={{ paddingTop: Spacing.xl }}
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardInner}>
              <Pressable onPress={() => router.push(`/(app)/tasks/${item.id}`)} style={styles.cardMain} accessibilityRole="button">
                <View style={styles.taskRow}>
                  <View style={styles.listKindIcon}>
                    <MaterialCommunityIcons name={iconName(item.taskKind)} size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <AppText variant="bodyMd" weight="semiBold" numberOfLines={2}>
                      {item.title}
                    </AppText>
                    <View style={styles.metaRow}>
                      <AppText variant="bodySm" color="variant">
                        {item.linkLabel}
                      </AppText>
                      <AppText variant="bodySm" color="muted">
                        ·
                      </AppText>
                      <AppText variant="bodySm" color="variant" numberOfLines={1}>
                        {item.assigneeName}
                      </AppText>
                    </View>
                    <AppText variant="caption" color="muted">
                      יעד: {item.dueDate}
                    </AppText>
                    <View style={styles.badgeRow}>
                      <Badge label={TASK_PRIORITY_LABELS[item.priority]} preset={priorityPreset(item.priority)} />
                      <Badge label={WORKFLOW_STATUS_LABELS[item.workflowStatus]} preset={statusPreset(item.workflowStatus)} />
                    </View>
                  </View>
                </View>
              </Pressable>
              <Pressable onPress={() => setStatusModalTaskId(item.id)} style={styles.statusBtn} accessibilityRole="button" accessibilityLabel="שינוי סטטוס מהיר">
                <MaterialCommunityIcons name="swap-vertical" size={22} color={Colors.primary} />
              </Pressable>
            </View>
          </Card>
        )}
      />

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  recentBlock: {
    paddingVertical: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.background,
  },
  recentTitle: { textAlign: 'right', marginBottom: Spacing.sm },
  recentRow: { flexDirection: 'row-reverse', gap: Spacing.sm, paddingBottom: Spacing.xs },
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
  listKindIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.info}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInner: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  cardMain: { flex: 1, padding: Spacing.base },
  taskRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md },
  metaRow: { flexDirection: 'row-reverse', gap: Spacing.xs, flexWrap: 'wrap' },
  badgeRow: { flexDirection: 'row-reverse', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs },
  statusBtn: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.outlineLight,
  },
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
});
