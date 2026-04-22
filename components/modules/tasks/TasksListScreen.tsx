import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
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
import { DrawerMenu } from '@/components/ui/DrawerMenu';

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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const listHeader = (
    <>
      <View style={styles.toolbar}>
        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          חיפוש חופשי
        </AppText>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.onSurfaceMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="כותרת, שיוך, עובד, סוג משימה..."
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
          סוג משימה
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {TASK_KIND_OPTIONS.map((o) => (
            <Pressable key={String(o.key)} onPress={() => setTaskKind(o.key)} style={[styles.chip, styles.chipWithIcon, taskKind === o.key && styles.chipActive]} accessibilityRole="button">
              {o.key !== 'all' ? (
                <MaterialCommunityIcons
                  name={iconName(o.key as TaskKind)}
                  size={18}
                  color={taskKind === o.key ? Colors.onPrimary : Colors.primary}
                />
              ) : null}
              <AppText variant="labelMd" weight={taskKind === o.key ? 'bold' : 'regular'} style={{ color: taskKind === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          דחיפות
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {PRIORITY_OPTIONS.map((o) => (
            <Pressable key={String(o.key)} onPress={() => setPriority(o.key)} style={[styles.chip, priority === o.key && styles.chipActive]} accessibilityRole="button">
              <AppText variant="labelMd" weight={priority === o.key ? 'bold' : 'regular'} style={{ color: priority === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          שיוך נכס / פרויקט
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
              accessibilityRole="button"
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

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          עובד / אחראי
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Pressable onPress={() => setAssignee(null)} style={[styles.chip, assignee === null && styles.chipActive]}>
            <AppText variant="labelMd" weight={assignee === null ? 'bold' : 'regular'} style={{ color: assignee === null ? Colors.onPrimary : Colors.onSurfaceVariant }}>
              הכל
            </AppText>
          </Pressable>
          {MOCK_ASSIGNEE_NAMES.map((name) => (
            <Pressable key={name} onPress={() => setAssignee(name)} style={[styles.chip, assignee === name && styles.chipActive]}>
              <AppText variant="labelMd" weight={assignee === name ? 'bold' : 'regular'} numberOfLines={1} style={{ color: assignee === name ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {name}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          טווח תאריך יעד
        </AppText>
        <View style={styles.dateRow}>
          <TextInput style={styles.dateInput} placeholder="מ־ DD/MM/YYYY" placeholderTextColor={Colors.onSurfaceMuted} value={dateFrom} onChangeText={setDateFrom} textAlign="right" />
          <TextInput style={styles.dateInput} placeholder="עד DD/MM/YYYY" placeholderTextColor={Colors.onSurfaceMuted} value={dateTo} onChangeText={setDateTo} textAlign="right" />
        </View>

        <AppText variant="labelSm" weight="semiBold" color="variant" style={styles.filterLabel}>
          תצוגה לפי סטטוס
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {STATUS_TABS.map((t) => (
            <Pressable key={t.key} onPress={() => setStatusTab(t.key)} style={[styles.chip, statusTab === t.key && styles.chipActive]}>
              <AppText variant="labelMd" weight={statusTab === t.key ? 'bold' : 'regular'} style={{ color: statusTab === t.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {t.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

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

      <View style={styles.sortBar}>
        <AppText variant="labelSm" weight="semiBold" color="variant">
          מיון:
        </AppText>
        {(['dueDate', 'title', 'priority'] as TaskSortKey[]).map((k) => {
          const labels: Record<TaskSortKey, string> = { dueDate: 'תאריך יעד', title: 'כותרת', priority: 'דחיפות' };
          const active = sortKey === k;
          return (
            <Pressable key={k} onPress={() => onSortPress(k)} style={[styles.sortChip, active && styles.sortChipActive]}>
              <AppText variant="caption" weight={active ? 'bold' : 'regular'} style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {labels[k]}
              </AppText>
              {active && <MaterialCommunityIcons name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'} size={12} color={Colors.onPrimary} />}
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="תפריט ראשי">
          <MaterialCommunityIcons name="menu" size={24} color={Colors.onPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <AppText variant="headingMd" weight="bold" color="onPrimary" style={{ textAlign: 'right' }}>
            משימות
          </AppText>
          <AppText variant="caption" color="onPrimary" style={{ opacity: 0.88, textAlign: 'right', marginTop: 2 }}>
            כל הנכסים והפרויקטים · כל סוגי המשימות
          </AppText>
        </View>
        <Pressable onPress={() => router.push('/(app)/tasks/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

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

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
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
  chipWithIcon: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.sm },
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
  dateRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    backgroundColor: Colors.surfaceVariant,
  },
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
  sortBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
  },
  sortChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
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
