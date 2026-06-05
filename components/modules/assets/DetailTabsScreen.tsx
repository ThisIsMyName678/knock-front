import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Linking,
  Share,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { RTL_ROW } from '@/constants/rtl';
import { EntityListScreen } from './EntityListScreen';
import { AddAssetToProjectActions } from './AddAssetToProjectActions';
import { MOCK_PROJECTS } from '@/lib/mocks/assets';
import { FilterSheet } from '@/components/ui/FilterSheet';
import type { FilterSection } from '@/components/ui/FilterSheet';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import {
  MOCK_TASKS_LIST,
  TASK_KIND_LABELS,
  TASK_KIND_ICONS,
  WORKFLOW_STATUS_LABELS,
  type TaskListRow,
  type WorkflowStatus,
  type TaskKind,
  type TaskPriority,
  TASK_PRIORITY_LABELS,
} from '@/lib/mocks/tasks';
import { assetsForProject } from '@/lib/mocks/assets';
import { MOCK_PAYMENTS_LIST, PAYMENT_TYPE_LABELS } from '@/lib/mocks/payments';
import { RecommendedDocChecklistPanel } from '@/components/modules/documents/RecommendedDocChecklistPanel';
import { getProperty, propertyAddressLabel, type BackendProperty } from '@/lib/api/properties';
import { getProject, type BackendProject } from '@/lib/api/projects';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DetailMode = 'asset' | 'project';

type TabKey = 'feed' | 'main' | 'tasks' | 'documents' | 'payments' | 'contacts';

type FeedKind = 'task' | 'payment' | 'message' | 'contract';

type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  dateIso: string;
  targetId?: string;
};

type ContractInfo = {
  id: string;
  contractId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  active: boolean;
};

// TaskItem is no longer used — TasksTab uses TaskListRow from lib/mocks/tasks

type DocItem = {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  kind: 'pdf' | 'image';
};

type ContactItem = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
};

// ─── Mock data generators ─────────────────────────────────────────────────────

const TARGET_IDS: Record<FeedKind, string[]> = {
  task: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
  payment: ['pay1', 'pay2', 'pay3', 'pay4', 'pay5'],
  message: [],
  contract: ['c1', 'c2'],
};

function feedRoute(kind: FeedKind, targetId?: string): string | null {
  if (!targetId) return null;
  if (kind === 'task') return `/(app)/tasks/${targetId}`;
  if (kind === 'payment') return `/(app)/payments/${targetId}`;
  if (kind === 'contract') return `/(app)/contracts/${targetId}`;
  return null;
}

function makeFeed(): FeedItem[] {
  const now = Date.now();
  const kinds: FeedKind[] = ['task', 'payment', 'message', 'contract'];
  const rows = Array.from({ length: 30 }, (_, i) => {
    const kind = kinds[i % 4]!;
    const ids = TARGET_IDS[kind];
    const targetId = ids.length ? ids[i % ids.length] : undefined;
    return {
      id: `f${i}`,
      kind,
      title:
        kind === 'task' ? 'בדיקת מד מים בוצעה'
        : kind === 'payment' ? 'תשלום שכירות התקבל'
        : kind === 'message' ? 'הודעה מהדייר'
        : 'חוזה עודכן',
      dateIso: new Date(now - i * 1000 * 60 * 60 * 5).toISOString(),
      targetId,
    };
  });
  return rows.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
}

const MOCK_CONTRACTS: ContractInfo[] = [
  {
    id: 'ctr1',
    contractId: 'c1',
    tenantName: 'יוסי כהן',
    startDate: '01/01/2024',
    endDate: '31/12/2025',
    monthlyRent: 7200,
    active: true,
  },
  {
    id: 'ctr2',
    contractId: 'c2',
    tenantName: 'דנה לוי',
    startDate: '01/01/2022',
    endDate: '31/12/2023',
    monthlyRent: 6500,
    active: false,
  },
];

// MOCK_TASKS replaced by MOCK_TASKS_LIST imported from lib/mocks/tasks

const MOCK_DOCS: DocItem[] = [
  { id: 'doc1', name: 'חוזה שכירות 2024.pdf', category: 'חוזה', uploadDate: '01/01/2024', kind: 'pdf' },
  { id: 'doc2', name: 'תמונת נזק.jpg', category: 'נזקים', uploadDate: '10/03/2026', kind: 'image' },
  { id: 'doc3', name: 'אישור עירייה.pdf', category: 'רשויות', uploadDate: '15/12/2023', kind: 'pdf' },
];

const MOCK_CONTACTS: ContactItem[] = [
  { id: 'ct1', name: 'יוסי כהן', role: 'דייר', phone: '050-1234567', email: 'yossi.cohen@example.com' },
  { id: 'ct2', name: 'מיכל לוי', role: 'מנהל נכס', phone: '052-9876543', email: 'michal.property@example.com' },
  { id: 'ct3', name: 'שירות חרום', role: 'בעל תפקיד', phone: '054-1111222', email: 'emergency.service@example.com' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, '0'); }

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtIls(n: number) {
  try {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₪${Math.round(n).toLocaleString('he-IL')}`;
  }
}

function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  return new Date(parseInt(m[3]!, 10), parseInt(m[2]!, 10) - 1, parseInt(m[1]!, 10)).getTime();
}

function inDateRange(dateStr: string, from: string, to: string): boolean {
  const t = parseDdMmYyyy(dateStr);
  if (!t) return true;
  if (from) { const f = parseDdMmYyyy(from); if (f && t < f) return false; }
  if (to) { const toT = parseDdMmYyyy(to); if (toT && t > toT) return false; }
  return true;
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <AppText
      variant="bodyMd"
      color="muted"
      style={{ paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.lg, textAlign: 'right' }}
    >
      {text}
    </AppText>
  );
}

function feedColor(kind: FeedKind): string {
  if (kind === 'task') return Colors.feedMaintenance;
  if (kind === 'payment') return Colors.feedPayments;
  if (kind === 'message') return Colors.feedMessages;
  return Colors.feedContracts;
}

function feedIcon(kind: FeedKind): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (kind === 'task') return 'hammer-wrench';
  if (kind === 'payment') return 'cash-check';
  if (kind === 'message') return 'message-outline';
  return 'file-sign';
}

function taskStatusPreset(s: WorkflowStatus): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'open' || s === 'not_started') return 'statusOpen';
  if (s === 'in_progress') return 'statusInProgress';
  if (s === 'completed') return 'statusClosed';
  return 'neutral';
}

async function openUrl(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) { Alert.alert('לא ניתן לפתוח', url); return; }
    await Linking.openURL(url);
  } catch { Alert.alert('שגיאה', 'לא ניתן לבצע את הפעולה'); }
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: 'feed', label: 'פיד' },
  { key: 'main', label: 'נכסים/חוזה' },
  { key: 'tasks', label: 'משימות' },
  { key: 'documents', label: 'מסמכים' },
  { key: 'payments', label: 'תשלומים' },
  { key: 'contacts', label: 'אנשי קשר' },
];

function TabSearchField({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  activeFilterCount = 0,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  onFilterPress?: () => void;
  activeFilterCount?: number;
}) {
  const filterActive = activeFilterCount > 0;
  return (
    <View style={tabSearchStyles.wrap}>
      <View style={tabSearchStyles.outerRow}>
        <View style={[tabSearchStyles.row, { flex: 1 }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceMuted} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.onSurfaceMuted}
            style={tabSearchStyles.input}
            returnKeyType="search"
          />
          {value.length > 0 ? (
            <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="נקה">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
            </Pressable>
          ) : null}
        </View>
        {onFilterPress && (
          <Pressable
            onPress={onFilterPress}
            style={[tabSearchStyles.filterBtn, filterActive && tabSearchStyles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityLabel="סינון"
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={18}
              color={filterActive ? Colors.onPrimary : Colors.onSurfaceVariant}
            />
            {filterActive && (
              <View style={tabSearchStyles.filterBadge}>
                <AppText variant="labelSm" weight="bold" style={{ color: Colors.onPrimary, fontSize: 10 }}>
                  {activeFilterCount}
                </AppText>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const tabSearchStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  outerRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.onBackground,
    paddingVertical: 0,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: TabKey; label: string }[];
  active: TabKey;
  onSelect: (k: TabKey) => void;
}) {
  return (
    <View style={tabStyles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabStyles.row}
      >
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onSelect(t.key)}
              style={[tabStyles.tab, isActive && tabStyles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <AppText
                variant="labelMd"
                weight={isActive ? 'bold' : 'regular'}
                style={{ color: isActive ? Colors.primary : Colors.onSurfaceVariant }}
                align="center"
              >
                {t.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  row: {
    flexDirection: RTL_ROW,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 0,
  },
  tab: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
});

// ─── Filter Row (generic) ─────────────────────────────────────────────────────

function FilterRow<T extends string>({
  options,
  active,
  onSelect,
  contentContainerStyle,
}: {
  options: { key: T; label: string }[];
  active: T;
  onSelect: (k: T) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[filterStyles.row, contentContainerStyle]}
      style={filterStyles.scroll}
    >
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onSelect(o.key)}
          style={[filterStyles.chip, active === o.key && filterStyles.chipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: active === o.key }}
        >
          <AppText
            variant="labelSm"
            weight={active === o.key ? 'bold' : 'regular'}
            style={{ color: active === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}
          >
            {o.label}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const filterStyles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    flexGrow: 0,
  },
  row: {
    flexDirection: RTL_ROW,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    minHeight: 30,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  /** פיד: צמידת כפתורי סינון לימין (התחלה ב־RTL) */
  feedChipsAlign: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
});

// ─── Tab FAB (+ button) ───────────────────────────────────────────────────────

function TabFab({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [fabStyle.btn, pressed && { transform: [{ scale: 0.96 }] }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialCommunityIcons name="plus" size={24} color={Colors.onPrimary} />
    </Pressable>
  );
}

const fabStyle = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: CONTENT_HORIZONTAL_PADDING,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
});

// ─── Tab: Feed ────────────────────────────────────────────────────────────────

function FeedTab() {
  const items = useMemo(() => makeFeed(), []);
  const filterOptions = [
    { key: 'all' as const, label: 'הכל' },
    { key: 'task' as const, label: 'משימות' },
    { key: 'payment' as const, label: 'תשלומים' },
    { key: 'message' as const, label: 'הודעות' },
    { key: 'contract' as const, label: 'חוזים' },
  ];
  const [filter, setFilter] = useState<'all' | FeedKind>('all');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const byKind = filter === 'all' ? items : items.filter((i) => i.kind === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byKind;
    return byKind.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, filter, search]);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField value={search} onChangeText={setSearch} placeholder="חיפוש בפיד..." />
      <FilterRow
        options={filterOptions}
        active={filter}
        onSelect={setFilter}
        contentContainerStyle={filterStyles.feedChipsAlign}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={listStyles.content}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={<InlineEmpty text="אין פעילות להצגה" />}
        renderItem={({ item }) => {
          const color = feedColor(item.kind);
          const route = feedRoute(item.kind, item.targetId);
          const Inner = (
            <View style={listStyles.feedCard}>
              <View style={listStyles.feedCardInner}>
                <View style={[listStyles.feedIconWrap, { backgroundColor: `${color}18` }]}>
                  <MaterialCommunityIcons name={feedIcon(item.kind)} size={16} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" weight="semiBold" numberOfLines={1} style={{ textAlign: 'right' }}>{item.title}</AppText>
                  <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>{fmtDateTime(item.dateIso)}</AppText>
                </View>
                {route ? <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} /> : null}
              </View>
            </View>
          );
          return (
            <View style={listStyles.feedRow}>
              <View style={listStyles.feedLeft}>
                <View style={[listStyles.feedDot, { backgroundColor: color }]} />
                <View style={[listStyles.feedLine, { backgroundColor: color }]} />
              </View>
              {route ? (
                <Pressable
                  style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.82 }]}
                  onPress={() => router.push(route as any)}
                  accessibilityRole="button"
                >
                  {Inner}
                </Pressable>
              ) : (
                <View style={{ flex: 1 }}>{Inner}</View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── Tab: Main (asset = contracts / project = assets list) ────────────────────

function ProjectMainAssetsTab({ entityId, projectName }: { entityId: string; projectName: string }) {
  const [refreshNonce, setRefreshNonce] = useState(0);
  return (
    <View style={{ flex: 1 }}>
      <EntityListScreen
        mode="assets"
        embedded
        scopedProjectId={entityId}
        scopedProjectName={projectName}
        refreshNonce={refreshNonce}
      />
      <AddAssetToProjectActions
        projectId={entityId}
        projectName={projectName}
        onAssetsChanged={() => setRefreshNonce((n) => n + 1)}
        variant="fab"
      />
    </View>
  );
}

function MainTab({ mode, entityId, projectName }: { mode: DetailMode; entityId: string; projectName?: string }) {
  if (mode === 'project') {
    return <ProjectMainAssetsTab entityId={entityId} projectName={projectName ?? ''} />;
  }

  // Asset mode: contract details
  const filterOptions = [
    { key: 'all' as const, label: 'הכל' },
    { key: 'active' as const, label: 'פעיל' },
    { key: 'inactive' as const, label: 'לא פעיל' },
  ];
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const filtered = MOCK_CONTRACTS.filter(
    (c) => filter === 'all' || (filter === 'active' ? c.active : !c.active),
  );

  return (
    <View style={{ flex: 1 }}>
      <FilterRow options={filterOptions} active={filter} onSelect={setFilter} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={listStyles.content}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <EmptyState title="אין חוזים" icon={<MaterialCommunityIcons name="file-sign" size={28} color={Colors.primary} />} />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={listStyles.contractHeader}>
              <View style={listStyles.contractIcon}>
                <MaterialCommunityIcons name="file-sign" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={listStyles.row}>
                  <AppText variant="bodyMd" weight="bold" style={{ flex: 1 }}>{item.tenantName}</AppText>
                  <Badge label={item.active ? 'פעיל' : 'לא פעיל / לא בתוקף'} preset={item.active ? 'success' : 'neutral'} />
                </View>
                <AppText variant="bodySm" color="variant">{item.startDate} – {item.endDate}</AppText>
              </View>
            </View>
            <View style={listStyles.divider} />
            <View style={listStyles.contractRow}>
              <AppText variant="bodySm" color="variant">שכירות חודשית</AppText>
              <AppText variant="bodyMd" weight="bold" color="primary">{fmtIls(item.monthlyRent)}</AppText>
            </View>
            <Pressable
              onPress={() => router.push(`/(app)/contracts/${item.contractId}`)}
              style={({ pressed }) => [listStyles.contractLink, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
            >
              <AppText variant="bodySm" color="primary" weight="semiBold">צפה בחוזה במודול חוזים</AppText>
              <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.primary} />
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}

// ─── Tab: Tasks (Maintenance) ─────────────────────────────────────────────────

type TaskStatusFilter = 'all' | 'open' | 'in_progress' | 'completed';

function TasksTab({ entityId, mode }: { entityId: string; mode: DetailMode }) {
  const statusOptions: { key: TaskStatusFilter; label: string }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'open', label: 'פתוח' },
    { key: 'in_progress', label: 'בטיפול' },
    { key: 'completed', label: 'הושלם' },
  ];
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [kindFilter, setKindFilter] = useState<TaskKind | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (kindFilter !== 'all') n++;
    if (priorityFilter !== 'all') n++;
    if (dateFrom) n++;
    if (dateTo) n++;
    return n;
  }, [kindFilter, priorityFilter, dateFrom, dateTo]);

  const taskKindOptions = useMemo(() => [
    { key: 'all', label: 'הכל' },
    ...Object.entries(TASK_KIND_LABELS).map(([k, v]) => ({ key: k, label: v })),
  ], []);

  const priorityOptions = useMemo(() => [
    { key: 'all', label: 'הכל' },
    ...Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => ({ key: k, label: v })),
  ], []);

  const projectAssetIds = useMemo(
    () => new Set(assetsForProject(entityId).map((a) => a.id)),
    [entityId],
  );

  const filterSections: FilterSection[] = useMemo(() => [
    {
      kind: 'chips',
      label: 'סוג משימה',
      options: taskKindOptions,
      value: kindFilter,
      onChange: (k) => setKindFilter(k as TaskKind | 'all'),
    },
    {
      kind: 'chips',
      label: 'דחיפות',
      options: priorityOptions,
      value: priorityFilter,
      onChange: (k) => setPriorityFilter(k as TaskPriority | 'all'),
    },
    {
      kind: 'dateRange',
      label: 'טווח תאריך יעד',
      from: dateFrom,
      to: dateTo,
      onFromChange: setDateFrom,
      onToChange: setDateTo,
    },
  ], [kindFilter, priorityFilter, dateFrom, dateTo, taskKindOptions, priorityOptions]);

  const filtered = useMemo(() => {
    return MOCK_TASKS_LIST.filter((t) => {
      const matchesScope =
        mode === 'asset'
          ? t.linkId === entityId
          : t.linkId === entityId || (t.linkKind === 'asset' && projectAssetIds.has(t.linkId));
      if (!matchesScope) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'open' && !(t.workflowStatus === 'open' || t.workflowStatus === 'not_started')) return false;
        if (statusFilter === 'in_progress' && t.workflowStatus !== 'in_progress') return false;
        if (statusFilter === 'completed' && !(t.workflowStatus === 'completed' || t.workflowStatus === 'cancelled')) return false;
      }
      if (kindFilter !== 'all' && t.taskKind !== kindFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (!inDateRange(t.dueDate, dateFrom, dateTo)) return false;
      const q = search.trim().toLowerCase();
      if (q && !(t.title.toLowerCase().includes(q) || TASK_KIND_LABELS[t.taskKind].toLowerCase().includes(q) || t.dueDate.includes(q))) return false;
      return true;
    });
  }, [mode, entityId, projectAssetIds, statusFilter, kindFilter, priorityFilter, dateFrom, dateTo, search]);

  const resetFilters = useCallback(() => {
    setKindFilter('all');
    setPriorityFilter('all');
    setDateFrom('');
    setDateTo('');
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="חיפוש לפי כותרת, קטגוריה..."
        onFilterPress={() => setSheetOpen(true)}
        activeFilterCount={activeFilterCount}
      />
      <FilterRow options={statusOptions} active={statusFilter} onSelect={setStatusFilter} />
      <FilterSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onReset={resetFilters} sections={filterSections} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={[listStyles.content, { paddingBottom: 80 }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <EmptyState title="אין משימות" icon={<MaterialCommunityIcons name="hammer-wrench" size={28} color={Colors.primary} />} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/tasks/${item.id}`)}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={`פתח משימה: ${item.title}`}
          >
            <Card>
              <View style={listStyles.row}>
                <View style={listStyles.taskIconWrap}>
                  <MaterialCommunityIcons
                    name={TASK_KIND_ICONS[item.taskKind] as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1, gap: Spacing.xs }}>
                  <AppText variant="bodyMd" weight="bold" numberOfLines={2}>{item.title}</AppText>
                  <View style={listStyles.rowGap}>
                    <MaterialCommunityIcons name="tag-outline" size={13} color={Colors.onSurfaceVariant} />
                    <AppText variant="bodySm" color="variant">{TASK_KIND_LABELS[item.taskKind]}</AppText>
                    <AppText variant="bodySm" color="muted">·</AppText>
                    <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.onSurfaceMuted} />
                    <AppText variant="bodySm" color="muted">{item.dueDate}</AppText>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: Spacing.xs }}>
                  <Badge label={WORKFLOW_STATUS_LABELS[item.workflowStatus]} preset={taskStatusPreset(item.workflowStatus)} />
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <TabFab
        onPress={() =>
          router.push({
            pathname: '/(app)/tasks/new',
            params: {
              preloadLinkId: entityId,
              preloadLinkKind: mode === 'project' ? 'project' : 'asset',
            },
          })
        }
        accessibilityLabel="משימה חדשה"
      />
    </View>
  );
}

// ─── Tab: Documents ───────────────────────────────────────────────────────────

function DocumentsTab({ entityId }: { entityId: string }) {
  const catOptions = [
    { key: 'all', label: 'הכל' },
    { key: 'חוזה', label: 'חוזים' },
    { key: 'נזקים', label: 'נזקים' },
    { key: 'רשויות', label: 'רשויות' },
  ];
  const typeOptions = [
    { key: 'all', label: 'הכל' },
    { key: 'pdf', label: 'PDF' },
    { key: 'image', label: 'תמונה' },
  ];

  const [catFilter, setCatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuDoc, setMenuDoc] = useState<(typeof MOCK_DOCS)[0] | null>(null);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (typeFilter !== 'all') n++;
    if (dateFrom) n++;
    if (dateTo) n++;
    return n;
  }, [typeFilter, dateFrom, dateTo]);

  const filterSections: FilterSection[] = useMemo(() => [
    {
      kind: 'chips',
      label: 'סוג קובץ',
      options: typeOptions,
      value: typeFilter,
      onChange: setTypeFilter,
    },
    {
      kind: 'dateRange',
      label: 'תאריך העלאה',
      from: dateFrom,
      to: dateTo,
      onFromChange: setDateFrom,
      onToChange: setDateTo,
    },
  ], [typeFilter, dateFrom, dateTo]);

  const resetFilters = useCallback(() => {
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  }, []);

  const filtered = useMemo(() => {
    return MOCK_DOCS.filter((d) => {
      if (catFilter !== 'all' && d.category !== catFilter) return false;
      if (typeFilter !== 'all' && d.kind !== typeFilter) return false;
      if (!inDateRange(d.uploadDate, dateFrom, dateTo)) return false;
      const q = search.trim().toLowerCase();
      if (q && !(d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [catFilter, typeFilter, dateFrom, dateTo, search]);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="חיפוש מסמכים..."
        onFilterPress={() => setSheetOpen(true)}
        activeFilterCount={activeFilterCount}
      />
      <FilterRow options={catOptions} active={catFilter} onSelect={setCatFilter} />
      <FilterSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onReset={resetFilters} sections={filterSections} />
      <ScrollView contentContainerStyle={[listStyles.content, { paddingBottom: 80 }]} showsVerticalScrollIndicator={false}>
        <RecommendedDocChecklistPanel />

        {/* Document list */}
        {filtered.length === 0 && <InlineEmpty text="אין מסמכים להצגה" />}
        {filtered.map((doc, i) => (
          <Pressable
            key={doc.id}
            onPress={() => router.push(`/(app)/documents/${doc.id}`)}
            style={({ pressed }) => [listStyles.docRow, i > 0 && { marginTop: Spacing.md }, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={`פתח מסמך: ${doc.name}`}
          >
            <View style={[listStyles.docIcon, { backgroundColor: doc.kind === 'pdf' ? Colors.errorContainer : Colors.infoContainer }]}>
              <MaterialCommunityIcons
                name={doc.kind === 'pdf' ? 'file-pdf-box' : 'file-image-outline'}
                size={22}
                color={doc.kind === 'pdf' ? Colors.error : Colors.info}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMd" weight="semiBold" numberOfLines={2}>{doc.name}</AppText>
              <AppText variant="bodySm" color="muted">{doc.category} · {doc.uploadDate}</AppText>
            </View>
            <Pressable
              onPress={() => setMenuDoc(doc)}
              style={listStyles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="פעולות"
            >
              <MaterialCommunityIcons name="dots-vertical" size={22} color={Colors.onSurfaceVariant} />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
      <TabFab
        onPress={() =>
          router.push({
            pathname: '/(app)/documents/new',
            params: { contextEntityId: entityId },
          })
        }
        accessibilityLabel="העלאת מסמך חדש"
      />

      <Modal visible={!!menuDoc} transparent animationType="slide" onRequestClose={() => setMenuDoc(null)}>
        <Pressable style={listStyles.menuBackdrop} onPress={() => setMenuDoc(null)}>
          <Pressable style={listStyles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <View style={listStyles.menuHandle} />
            {menuDoc && (
              <AppText variant="labelMd" weight="bold" numberOfLines={1} style={listStyles.menuTitle}>
                {menuDoc.name}
              </AppText>
            )}
            {[
              {
                icon: 'eye-outline' as const,
                label: 'צפייה',
                color: Colors.primary,
                onPress: () => {
                  const d = menuDoc;
                  setMenuDoc(null);
                  if (d) router.push(`/(app)/documents/${d.id}`);
                },
              },
              {
                icon: 'share-variant-outline' as const,
                label: 'שיתוף',
                color: Colors.onBackground,
                onPress: () => {
                  if (menuDoc) Share.share({ title: menuDoc.name, message: `${menuDoc.name}\nקטגוריה: ${menuDoc.category}\nתאריך: ${menuDoc.uploadDate}` });
                  setMenuDoc(null);
                },
              },
              {
                icon: 'pencil-outline' as const,
                label: 'עריכה',
                color: Colors.onBackground,
                onPress: () => { if (menuDoc) router.push(`/(app)/documents/edit/${menuDoc.id}`); setMenuDoc(null); },
              },
            ].map((action) => (
              <Pressable key={action.label} onPress={action.onPress} style={({ pressed }) => [listStyles.menuAction, pressed && { opacity: 0.7 }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: action.color }}>
                  {action.label}
                </AppText>
              </Pressable>
            ))}
            <Pressable onPress={() => setMenuDoc(null)} style={[listStyles.menuAction, { marginTop: Spacing.sm, justifyContent: 'center', borderBottomWidth: 0 }]}>
              <AppText variant="bodyMd" color="variant" align="center">ביטול</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Tab: Payments ────────────────────────────────────────────────────────────

function PaymentsTab({ entityId, mode }: { entityId: string; mode: DetailMode }) {
  const dirOptions = [
    { key: 'all' as const, label: 'הכל' },
    { key: 'inbound' as const, label: 'הכנסות' },
    { key: 'outbound' as const, label: 'הוצאות' },
  ];
  const [dirFilter, setDirFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (dateFrom) n++;
    if (dateTo) n++;
    return n;
  }, [dateFrom, dateTo]);

  const filterSections: FilterSection[] = useMemo(() => [
    {
      kind: 'dateRange',
      label: 'טווח תאריך תשלום',
      from: dateFrom,
      to: dateTo,
      onFromChange: setDateFrom,
      onToChange: setDateTo,
    },
  ], [dateFrom, dateTo]);

  const resetFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
  }, []);

  const projectAssetIds = useMemo(
    () => new Set(assetsForProject(entityId).map((a) => a.id)),
    [entityId],
  );

  const inScope = useMemo(
    () =>
      MOCK_PAYMENTS_LIST.filter((p) => {
        if (mode === 'asset') {
          return p.linkKind === 'asset' && p.linkId === entityId;
        }
        return (
          (p.linkKind === 'project' && p.linkId === entityId) ||
          (p.linkKind === 'asset' && projectAssetIds.has(p.linkId))
        );
      }),
    [mode, entityId, projectAssetIds],
  );

  const filtered = useMemo(() => {
    return inScope.filter((p) => {
      if (dirFilter !== 'all' && p.direction !== dirFilter) return false;
      if (!inDateRange(p.dueDate, dateFrom, dateTo)) return false;
      const q = search.trim().toLowerCase();
      if (
        q &&
        !(
          p.displayName.toLowerCase().includes(q) ||
          p.linkLabel.toLowerCase().includes(q) ||
          PAYMENT_TYPE_LABELS[p.paymentType].toLowerCase().includes(q) ||
          p.dueDate.includes(q) ||
          String(p.amount).includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [inScope, dirFilter, dateFrom, dateTo, search]);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="חיפוש תשלומים..."
        onFilterPress={() => setSheetOpen(true)}
        activeFilterCount={activeFilterCount}
      />
      <FilterRow options={dirOptions} active={dirFilter} onSelect={setDirFilter} />
      <FilterSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onReset={resetFilters} sections={filterSections} />
      <View style={[listStyles.content, { paddingBottom: 80 }]}>
        {filtered.length === 0 && <InlineEmpty text="אין תשלומים להצגה" />}
        {filtered.map((p) => {
          const inbound = p.direction === 'inbound';
          const color = inbound ? Colors.inbound : Colors.outbound;
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/(app)/payments/${p.id}`)}
              style={({ pressed }) => [listStyles.paymentCardRow, pressed && { backgroundColor: Colors.surfaceVariant }]}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: RTL_ROW, alignItems: 'flex-start', gap: Spacing.sm }}>
                <View style={[listStyles.colDir, { marginTop: 2 }]}>
                  <MaterialCommunityIcons name={inbound ? 'arrow-down' : 'arrow-up'} size={18} color={color} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="bodyMd" weight="semiBold" style={{ textAlign: 'right' }} numberOfLines={2}>
                    {p.displayName}
                  </AppText>
                  <AppText variant="caption" color="variant" style={{ textAlign: 'right' }} numberOfLines={1}>
                    {p.linkLabel}
                  </AppText>
                  <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                    {p.dueDate} · {PAYMENT_TYPE_LABELS[p.paymentType]}
                  </AppText>
                </View>
                <AppText variant="bodyMd" weight="bold" style={{ color, textAlign: 'left', minWidth: 88 }}>
                  {inbound ? '+' : '−'}{fmtIls(p.amount).replace('₪', '')} ₪
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
      <TabFab
        onPress={() =>
          router.push({
            pathname: '/(app)/payments/new',
            params: { contextEntityId: entityId },
          })
        }
        accessibilityLabel="הוספת תשלום"
      />
    </View>
  );
}

// ─── Tab: Contacts ────────────────────────────────────────────────────────────

function ContactsTab({ entityId }: { entityId: string }) {
  const roleOptions = useMemo((): { key: string; label: string }[] => {
    const roles = Array.from(new Set(MOCK_CONTACTS.map((c) => c.role))).sort((a, b) => a.localeCompare(b, 'he'));
    return [{ key: 'all', label: 'הכל' }, ...roles.map((r) => ({ key: r, label: r }))];
  }, []);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const filteredContacts = useMemo(() => {
    const byRole = roleFilter === 'all' ? MOCK_CONTACTS : MOCK_CONTACTS.filter((c) => c.role === roleFilter);
    const q = search.trim().toLowerCase();
    if (!q) return byRole;
    return byRole.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q) || c.role.toLowerCase().includes(q),
    );
  }, [roleFilter, search]);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField value={search} onChangeText={setSearch} placeholder="חיפוש אנשי קשר..." />
      <FilterRow options={roleOptions} active={roleFilter} onSelect={setRoleFilter} />
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={[listStyles.content, { paddingBottom: 80 }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <EmptyState title="אין אנשי קשר" icon={<MaterialCommunityIcons name="account-group-outline" size={28} color={Colors.primary} />} />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={listStyles.contactTop}>
              <View style={listStyles.avatar}>
                <AppText variant="headingSm" weight="bold" color="onPrimary">{item.name[0]}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="bold">{item.name}</AppText>
                <Badge label={item.role} preset="primary" style={{ alignSelf: 'flex-end', marginTop: 4 }} />
              </View>
              <Pressable
                onPress={() => router.push(`/(app)/contacts/edit/${item.id}`)}
                style={listStyles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="ערוך"
              >
                <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={listStyles.contactActions}>
              <Pressable
                onPress={() => openUrl(`tel:${item.phone.replace(/[^\d+]/g, '')}`)}
                style={({ pressed }) => [listStyles.contactBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="חייג"
              >
                <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.primary} />
                <AppText variant="labelMd" weight="semiBold" color="primary">{item.phone}</AppText>
              </Pressable>
              <View style={{ flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.xs }}>
                <Pressable
                  onPress={() => openUrl(`whatsapp://send?phone=972${item.phone.replace(/[^\d]/g, '').slice(1)}`)}
                  style={({ pressed }) => [listStyles.iconBtn, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel="WhatsApp"
                >
                  <MaterialCommunityIcons name="whatsapp" size={22} color={Colors.success} />
                </Pressable>
                {item.email ? (
                  <Pressable
                    onPress={() => openUrl(`mailto:${item.email}`)}
                    style={({ pressed }) => [listStyles.iconBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="שליחת מייל"
                  >
                    <MaterialCommunityIcons name="email-outline" size={22} color={Colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Card>
        )}
      />
      <TabFab
        onPress={() =>
          router.push({
            pathname: '/(app)/contacts/new-role',
            params: { contextEntityId: entityId },
          })
        }
        accessibilityLabel="הוספת בעל תפקיד"
      />
    </View>
  );
}

// ─── Shared list styles ───────────────────────────────────────────────────────

const listStyles = StyleSheet.create({
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: 0, paddingTop: Spacing.base },
  row: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md },
  rowGap: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.xs },
  taskIconWrap: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: Colors.outlineLight, marginVertical: Spacing.sm },

  // Feed
  feedRow: { flexDirection: RTL_ROW, gap: Spacing.md, minHeight: 64 },
  feedLeft: { width: 16, alignItems: 'center' },
  feedDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  feedLine: { flex: 1, width: 2, borderRadius: 1, marginTop: 4, opacity: 0.4 },
  feedCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  feedCardInner: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md },
  feedIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Contract
  contractHeader: { flexDirection: RTL_ROW, alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  contractIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  contractRow: { flexDirection: RTL_ROW, justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  contractLink: { flexDirection: RTL_ROW, alignItems: 'center', gap: 4, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineLight },

  // Doc
  docRow: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.md },
  docIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  iconActions: { flexDirection: RTL_ROW, alignItems: 'center', gap: 4 },
  iconBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    ...Shadow.lg,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  menuTitle: {
    textAlign: 'right',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  menuAction: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },

  // Payments (כרטיסים ברשימה)
  paymentCardRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Payments table (legacy columns — עדיין בשימוש חלקי)
  tableRow: { flexDirection: RTL_ROW, alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  tableHeader: { backgroundColor: Colors.surfaceVariant, borderRadius: Radius.sm, marginBottom: 2 },
  tableRowBody: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  colDir: { width: 32, alignItems: 'center' },
  colDate: { width: 80, textAlign: 'right' as const },
  colCat: { flex: 1, textAlign: 'right' as const },
  colAmt: { width: 96, textAlign: 'left' as const },

  // Contacts
  contactTop: { flexDirection: RTL_ROW, alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  contactActions: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm },
  contactBtn: { flex: 1, flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceVariant },
});

// ─── Main DetailTabsScreen ─────────────────────────────────────────────────────

type Props = {
  mode: DetailMode;
  id: string;
  name?: string;
  address?: string;
};

export function DetailTabsScreen({
  mode,
  id,
  name = mode === 'project' ? 'מגדלי הים' : 'דירה 4B',
  address = 'הרצל 10, תל אביב',
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [property, setProperty] = useState<BackendProperty | null>(null);
  const [project, setProject] = useState<BackendProject | null>(null);

  useEffect(() => {
    if (mode !== 'asset' || !id) return;
    let cancelled = false;
    getProperty(id)
      .then((row) => { if (!cancelled) setProperty(row); })
      .catch((error) => { console.warn(error instanceof Error ? error.message : 'Failed to load property'); });
    return () => { cancelled = true; };
  }, [mode, id]);

  useEffect(() => {
    if (mode !== 'project' || !id) return;
    let cancelled = false;
    getProject(id)
      .then((row) => { if (!cancelled) setProject(row); })
      .catch((error) => { console.warn(error instanceof Error ? error.message : 'Failed to load project'); });
    return () => { cancelled = true; };
  }, [mode, id]);

  const mainTabLabel = mode === 'project' ? 'נכסים' : 'חוזה';
  const headerTitle = (mode === 'project' ? project?.name : property?.name) ?? name;
  const headerAddress = property ? propertyAddressLabel(property) : address;

  const tabsWithLabels = TABS.map((t) =>
    t.key === 'main' ? { ...t, label: mainTabLabel } : t,
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedTab />;
      case 'main':
        return <MainTab mode={mode} entityId={id} projectName={project?.name} />;
      case 'tasks':
        return <TasksTab entityId={id} mode={mode} />;
      case 'documents':
        return <DocumentsTab entityId={id} />;
      case 'payments':
        return <PaymentsTab entityId={id} mode={mode} />;
      case 'contacts':
        return <ContactsTab entityId={id} />;
      default:
        return null;
    }
  };

  return (
    <View style={[screenStyles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title={headerTitle}
        subtitleNode={
          <View style={screenStyles.headerAddress}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.75)" />
            <AppText variant="caption" color="onPrimary" numberOfLines={1} style={{ opacity: 0.85, textAlign: 'right' }}>
              {headerAddress}
            </AppText>
          </View>
        }
        showBack
      />

      {/* Edit entity action row */}
      <Pressable
        onPress={() => router.push({ pathname: '/(app)/assets-screens/new', params: { editId: id } })}
        style={screenStyles.editEntityRow}
        accessibilityRole="button"
        accessibilityLabel={`עריכת פרטי ${mode === 'project' ? 'פרויקט' : 'נכס'}`}
      >
        <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.primary} />
        <AppText variant="labelMd" color="primary" weight="semiBold">
          עריכת פרטי {mode === 'project' ? 'פרויקט' : 'נכס'}
        </AppText>
      </Pressable>

      {/* Tabs */}
      <TabBar tabs={tabsWithLabels} active={activeTab} onSelect={setActiveTab} />

      {/* Content area scrolls independently */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + Spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  headerAddress: { flexDirection: RTL_ROW, alignItems: 'center', gap: 4 },
  editEntityRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
});
