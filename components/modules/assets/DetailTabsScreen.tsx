import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
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
import { EntityListScreen } from './EntityListScreen';

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

type TaskItem = {
  id: string;
  date: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
};

type DocItem = {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  kind: 'pdf' | 'image';
};

type PaymentItem = {
  id: string;
  direction: 'inbound' | 'outbound';
  date: string;
  category: string;
  amount: number;
};

type ContactItem = {
  id: string;
  name: string;
  role: string;
  phone: string;
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

const MOCK_TASKS: TaskItem[] = [
  { id: 't1', date: '10/04/2026', category: 'אינסטלציה', description: 'נזילה בחדר רחצה', status: 'open' },
  { id: 't2', date: '05/04/2026', category: 'חשמל', description: 'בדיקת לוח חשמל', status: 'in_progress' },
  { id: 't3', date: '01/03/2026', category: 'כללי', description: 'צביעת חדר שינה', status: 'closed' },
];

const MOCK_DOCS: DocItem[] = [
  { id: 'd1', name: 'חוזה שכירות 2024.pdf', category: 'חוזה', uploadDate: '01/01/2024', kind: 'pdf' },
  { id: 'd2', name: 'תמונת נזק.jpg', category: 'נזקים', uploadDate: '10/03/2026', kind: 'image' },
  { id: 'd3', name: 'אישור עירייה.pdf', category: 'רשויות', uploadDate: '15/12/2023', kind: 'pdf' },
];

const MOCK_PAYMENTS: PaymentItem[] = [
  { id: 'p1', direction: 'inbound', date: '01/04/2026', category: 'שכירות', amount: 7200 },
  { id: 'p2', direction: 'outbound', date: '15/04/2026', category: 'תחזוקה', amount: 850 },
  { id: 'p3', direction: 'inbound', date: '01/03/2026', category: 'שכירות', amount: 7200 },
];

const MOCK_CONTACTS: ContactItem[] = [
  { id: 'c1', name: 'יוסי כהן', role: 'דייר', phone: '050-1234567' },
  { id: 'c2', name: 'מיכל לוי', role: 'מנהל נכס', phone: '052-9876543' },
  { id: 'c3', name: 'שירות חרום', role: 'בעל תפקיד', phone: '054-1111222' },
];

// Recommended document checklist
const DOC_CHECKLIST = [
  'צילום מונה חשמל',
  'צילום מונה מים',
  'אישור עירייה (ארנונה)',
  'חוזה שכירות חתום',
  'פרוטוקול מסירה',
  'ביטוח דירה',
  'אישור ועד בית',
  'אישור חברת חשמל',
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

function taskStatusPreset(s: TaskItem['status']): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'open') return 'statusOpen';
  if (s === 'in_progress') return 'statusInProgress';
  return 'statusClosed';
}

function taskStatusLabel(s: TaskItem['status']): string {
  if (s === 'open') return 'פתוח';
  if (s === 'in_progress') return 'בטיפול';
  return 'סגור';
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
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={tabSearchStyles.wrap}>
      <View style={tabSearchStyles.row}>
        <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.onSurfaceMuted}
          style={tabSearchStyles.input}
          textAlign="right"
          returnKeyType="search"
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="נקה">
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const tabSearchStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.onBackground,
    paddingVertical: 0,
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
    flexDirection: 'row-reverse',
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
}: {
  options: { key: T; label: string }[];
  active: T;
  onSelect: (k: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={filterStyles.row}
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
    flexDirection: 'row-reverse',
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
      <FilterRow options={filterOptions} active={filter} onSelect={setFilter} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={listStyles.content}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
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

function MainTab({ mode, entityId }: { mode: DetailMode; entityId: string }) {
  if (mode === 'project') {
    return (
      <View style={{ flex: 1 }}>
        <EntityListScreen mode="assets" embedded scopedProjectId={entityId} />
      </View>
    );
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

function TasksTab({ entityId }: { entityId: string }) {
  const filterOptions = [
    { key: 'all' as const, label: 'הכל' },
    { key: 'open' as const, label: 'פתוח' },
    { key: 'in_progress' as const, label: 'בטיפול' },
    { key: 'closed' as const, label: 'סגור' },
  ];
  const [filter, setFilter] = useState<'all' | TaskItem['status']>('all');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const byStatus = MOCK_TASKS.filter((t) => filter === 'all' || t.status === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.date.includes(q),
    );
  }, [filter, search]);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField value={search} onChangeText={setSearch} placeholder="חיפוש לפי תיאור, קטגוריה או תאריך..." />
      <FilterRow options={filterOptions} active={filter} onSelect={setFilter} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={[listStyles.content, { paddingBottom: 80 }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <EmptyState title="אין קריאות שירות" icon={<MaterialCommunityIcons name="hammer-wrench" size={28} color={Colors.primary} />} />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={listStyles.row}>
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <AppText variant="bodyMd" weight="bold">{item.description}</AppText>
                <View style={listStyles.rowGap}>
                  <MaterialCommunityIcons name="tag-outline" size={13} color={Colors.onSurfaceVariant} />
                  <AppText variant="bodySm" color="variant">{item.category}</AppText>
                  <AppText variant="bodySm" color="muted">·</AppText>
                  <AppText variant="bodySm" color="muted">{item.date}</AppText>
                </View>
              </View>
              <Badge label={taskStatusLabel(item.status)} preset={taskStatusPreset(item.status)} />
            </View>
          </Card>
        )}
      />
      <TabFab
        onPress={() =>
          router.push({
            pathname: '/(app)/tasks/new',
            params: { contextEntityId: entityId },
          })
        }
        accessibilityLabel="קריאת שירות חדשה"
      />
    </View>
  );
}

// ─── Tab: Documents ───────────────────────────────────────────────────────────

function DocumentsTab({ entityId }: { entityId: string }) {
  const filterOptions = [
    { key: 'all' as const, label: 'הכל' },
    { key: 'חוזה' as const, label: 'חוזים' },
    { key: 'נזקים' as const, label: 'נזקים' },
    { key: 'רשויות' as const, label: 'רשויות' },
  ];
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [showChecklist, setShowChecklist] = useState(false);

  const filtered = useMemo(() => {
    const byCat = filter === 'all' ? MOCK_DOCS : MOCK_DOCS.filter((d) => d.category === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter((d) => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
  }, [filter, search]);

  const toggleDoc = (name: string) =>
    setCheckedDocs((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField value={search} onChangeText={setSearch} placeholder="חיפוש מסמכים..." />
      <FilterRow options={filterOptions} active={filter} onSelect={setFilter} />
      <ScrollView contentContainerStyle={[listStyles.content, { paddingBottom: 80 }]} showsVerticalScrollIndicator={false}>
        {/* Recommended checklist toggle */}
        <Pressable
          onPress={() => setShowChecklist((v) => !v)}
          style={listStyles.checklistHeader}
          accessibilityRole="button"
        >
          <AppText variant="labelMd" weight="bold" color="primary">
            רשימת מסמכים מומלצים
          </AppText>
          <MaterialCommunityIcons
            name={showChecklist ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.primary}
          />
        </Pressable>

        {showChecklist && (
          <View style={listStyles.checklistBody}>
            {DOC_CHECKLIST.map((name) => (
              <Pressable
                key={name}
                onPress={() => toggleDoc(name)}
                style={listStyles.checklistRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!checkedDocs[name] }}
              >
                <MaterialCommunityIcons
                  name={checkedDocs[name] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={checkedDocs[name] ? Colors.success : Colors.outlineVariant}
                />
                <AppText
                  variant="bodyMd"
                  style={{ flex: 1, textDecorationLine: checkedDocs[name] ? 'line-through' : 'none', opacity: checkedDocs[name] ? 0.5 : 1 }}
                >
                  {name}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}

        {/* Document list */}
        {filtered.map((doc, i) => (
          <View key={doc.id} style={[listStyles.docRow, i > 0 && { marginTop: Spacing.md }]}>
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
            <View style={listStyles.iconActions}>
              <Pressable
                onPress={() => Alert.alert('בקרוב', 'צפייה במסמך')}
                style={listStyles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="צפה"
              >
                <MaterialCommunityIcons name="eye-outline" size={20} color={Colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('בקרוב', 'עריכת מסמך')}
                style={listStyles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="ערוך"
              >
                <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.onBackground} />
              </Pressable>
            </View>
          </View>
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
    </View>
  );
}

// ─── Tab: Payments ────────────────────────────────────────────────────────────

function PaymentsTab({ entityId }: { entityId: string }) {
  const filterOptions = [
    { key: 'all' as const, label: 'הכל' },
    { key: 'inbound' as const, label: 'הכנסות' },
    { key: 'outbound' as const, label: 'הוצאות' },
  ];
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const byDir = MOCK_PAYMENTS.filter((p) => filter === 'all' || p.direction === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byDir;
    return byDir.filter(
      (p) =>
        p.category.toLowerCase().includes(q) ||
        p.date.includes(q) ||
        String(p.amount).includes(q),
    );
  }, [filter, search]);

  return (
    <View style={{ flex: 1 }}>
      <TabSearchField value={search} onChangeText={setSearch} placeholder="חיפוש תשלומים..." />
      <FilterRow options={filterOptions} active={filter} onSelect={setFilter} />
      <View style={[listStyles.content, { paddingBottom: 80 }]}>
        {/* Table header */}
        <View style={[listStyles.tableRow, listStyles.tableHeader]}>
          <AppText variant="labelSm" weight="semiBold" style={listStyles.colDir}>כיוון</AppText>
          <AppText variant="labelSm" weight="semiBold" style={listStyles.colDate}>תאריך</AppText>
          <AppText variant="labelSm" weight="semiBold" style={listStyles.colCat}>קטגוריה</AppText>
          <AppText variant="labelSm" weight="semiBold" style={listStyles.colAmt}>סכום</AppText>
        </View>
        {filtered.map((p) => {
          const inbound = p.direction === 'inbound';
          const color = inbound ? Colors.inbound : Colors.outbound;
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/(app)/payments/${p.id}`)}
              style={({ pressed }) => [listStyles.tableRow, listStyles.tableRowBody, pressed && { backgroundColor: Colors.surfaceVariant }]}
              accessibilityRole="button"
            >
              <View style={listStyles.colDir}>
                <MaterialCommunityIcons name={inbound ? 'arrow-down' : 'arrow-up'} size={16} color={color} />
              </View>
              <AppText variant="bodySm" style={listStyles.colDate}>{p.date}</AppText>
              <AppText variant="bodySm" style={listStyles.colCat} numberOfLines={1}>{p.category}</AppText>
              <AppText variant="bodySm" weight="bold" style={[listStyles.colAmt, { color }]}>
                {inbound ? '+' : '−'}{fmtIls(p.amount).replace('₪', '')} ₪
              </AppText>
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
                onPress={() => Alert.alert('בקרוב', 'עריכת איש קשר')}
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
              <Pressable
                onPress={() => openUrl(`whatsapp://send?phone=972${item.phone.replace(/[^\d]/g, '').slice(1)}`)}
                style={({ pressed }) => [listStyles.iconBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="WhatsApp"
              >
                <MaterialCommunityIcons name="whatsapp" size={22} color={Colors.success} />
              </Pressable>
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
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  rowGap: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs },
  divider: { height: 1, backgroundColor: Colors.outlineLight, marginVertical: Spacing.sm },

  // Feed
  feedRow: { flexDirection: 'row-reverse', gap: Spacing.md, minHeight: 64 },
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
  feedCardInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  feedIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Contract
  contractHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  contractIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  contractRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  contractLink: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineLight },

  // Doc
  docRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.md },
  docIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  iconActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  iconBtn: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },

  // Checklist
  checklistHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  checklistBody: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  checklistRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },

  // Payments table
  tableRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  tableHeader: { backgroundColor: Colors.surfaceVariant, borderRadius: Radius.sm, marginBottom: 2 },
  tableRowBody: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  colDir: { width: 32, alignItems: 'center' },
  colDate: { width: 80, textAlign: 'right' as const },
  colCat: { flex: 1, textAlign: 'right' as const },
  colAmt: { width: 96, textAlign: 'left' as const },

  // Contacts
  contactTop: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  contactActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  contactBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceVariant },
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

  const mainTabLabel = mode === 'project' ? 'נכסים' : 'חוזה';

  const tabsWithLabels = TABS.map((t) =>
    t.key === 'main' ? { ...t, label: mainTabLabel } : t,
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedTab />;
      case 'main':
        return <MainTab mode={mode} entityId={id} />;
      case 'tasks':
        return <TasksTab entityId={id} />;
      case 'documents':
        return <DocumentsTab entityId={id} />;
      case 'payments':
        return <PaymentsTab entityId={id} />;
      case 'contacts':
        return <ContactsTab entityId={id} />;
      default:
        return null;
    }
  };

  return (
    <View style={[screenStyles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={screenStyles.header}>
        <Pressable
          onPress={() => router.back()}
          style={screenStyles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>

        <View style={screenStyles.headerCenter}>
          <AppText variant="headingMd" weight="bold" color="onPrimary" numberOfLines={1} style={{ textAlign: 'right', width: '100%' }}>
            {name}
          </AppText>
          <View style={[screenStyles.headerAddress, { alignSelf: 'flex-start' }]}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.75)" />
            <AppText variant="caption" color="onPrimary" numberOfLines={1} style={{ opacity: 0.85, textAlign: 'right' }}>
              {address}
            </AppText>
          </View>
        </View>

        <Pressable style={screenStyles.iconBtn} accessibilityRole="button" accessibilityLabel="אפשרויות">
          <MaterialCommunityIcons name="dots-vertical" size={24} color={Colors.onPrimary} />
        </Pressable>
      </View>

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
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'flex-start', gap: 2 },
  headerAddress: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
});
