import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import {
  assetsDashboardOccupancy,
  contactsDashboardCount,
  countOpenTasksByStage,
  countPaymentsDueNext7Days,
  getAgendaForDay,
  getCalendarEventsForRange,
  paymentsDashboardQueryParams,
  tasksDashboardQueryParams,
  toLocalDateKey,
  type DashboardCalendarEvent,
  type TasksDashboardPreset,
} from '@/lib/mocks/dashboard';
import { TASK_KIND_ICONS, type TaskKind } from '@/lib/mocks/tasks';
import { DrawerMenu } from '@/components/ui/DrawerMenu';

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=en.israel%23holiday%40group.v.calendar.google.com';

// Hebrew day names for Sunday-first calendar (displayed RTL: right=Sun, left=Sat)
const HE_DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const mondayOffset = (dow + 6) % 7;
  x.setDate(x.getDate() - mondayOffset);
  return x;
}

/** Monthly calendar component */
function MonthCalendar({
  selectedDate,
  onSelectDate,
  hasDot,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  hasDot: (d: Date) => boolean;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Build 42-cell grid (6 weeks)
  const cells: (Date | null)[] = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDayWeekday + 1;
    cells.push(dayNum >= 1 && dayNum <= totalDays ? new Date(year, month, dayNum) : null);
  }

  const weeks: (Date | null)[][] = [];
  for (let w = 0; w < 6; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));
  // Drop trailing empty rows
  const activeWeeks = weeks.filter((wk) => wk.some((d) => d !== null));

  const monthLabel = viewMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <View style={calStyles.wrap}>
      {/* Month nav */}
      <View style={calStyles.nav}>
        <Pressable onPress={() => setViewMonth(new Date(year, month + 1, 1))} style={calStyles.navBtn} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
        </Pressable>
        <AppText variant="bodyMd" weight="bold" style={{ flex: 1, textAlign: 'center' }}>{monthLabel}</AppText>
        <Pressable onPress={() => setViewMonth(new Date(year, month - 1, 1))} style={calStyles.navBtn} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Day headers — RTL: Sunday on right */}
      <View style={calStyles.row}>
        {HE_DAY_NAMES.map((h, i) => (
          <View key={i} style={calStyles.dayHeaderCell}>
            <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>{h}</AppText>
          </View>
        ))}
      </View>

      {/* Weeks */}
      {activeWeeks.map((wk, wi) => (
        <View key={wi} style={calStyles.row}>
          {wk.map((day, di) => {
            if (!day) return <View key={di} style={calStyles.cell} />;
            const isSelected = sameLocalDay(day, selectedDate);
            const isToday = sameLocalDay(day, today);
            const dot = hasDot(day);
            return (
              <Pressable
                key={di}
                onPress={() => onSelectDate(day)}
                style={[calStyles.cell, isSelected && calStyles.cellSelected, isToday && !isSelected && calStyles.cellToday]}
                accessibilityRole="button"
              >
                <AppText
                  variant="bodySm"
                  weight={isToday ? 'bold' : 'regular'}
                  style={{ textAlign: 'center', color: isSelected ? Colors.onPrimary : isToday ? Colors.primary : Colors.onBackground }}
                >
                  {day.getDate()}
                </AppText>
                <View style={[calStyles.dot, dot && (isSelected ? calStyles.dotSelected : calStyles.dotOn)]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const calStyles = StyleSheet.create({
  wrap: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  nav: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row-reverse' },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 5, minHeight: 38 },
  cellSelected: { backgroundColor: Colors.primary, borderRadius: 6, margin: 1 },
  cellToday: { borderWidth: 1, borderColor: Colors.primary, borderRadius: 6, margin: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginTop: 2 },
  dotOn: { backgroundColor: Colors.primary },
  dotSelected: { backgroundColor: Colors.onPrimary },
});

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sourceIcon(source: DashboardCalendarEvent['source']): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  switch (source) {
    case 'payment':
      return 'cash';
    case 'contract':
      return 'file-sign';
    case 'task':
      return 'checkbox-marked-outline';
    case 'reminder':
      return 'bell-ring-outline';
    case 'manual':
      return 'calendar-edit';
    case 'google':
      return 'google';
    default:
      return 'calendar-blank';
  }
}

function agendaEventIcon(ev: DashboardCalendarEvent): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (ev.source === 'task' && ev.taskKind) {
    return TASK_KIND_ICONS[ev.taskKind as TaskKind] as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  }
  return sourceIcon(ev.source);
}

function sourceColor(source: DashboardCalendarEvent['source']): string {
  switch (source) {
    case 'payment':
      return Colors.warning;
    case 'contract':
      return Colors.primary;
    case 'task':
      return Colors.info;
    case 'reminder':
      return Colors.error;
    case 'manual':
      return Colors.success;
    case 'google':
      return '#4285F4';
    default:
      return Colors.onSurfaceMuted;
  }
}

const AGENDA_STATUS_OPTIONS: { key: string; label: string; preset: React.ComponentProps<typeof Badge>['preset'] }[] = [
  { key: 'חדש', label: 'חדש', preset: 'neutral' },
  { key: 'בטיפול', label: 'בטיפול', preset: 'statusInProgress' },
  { key: 'הושלם', label: 'הושלם', preset: 'statusClosed' },
  { key: 'נדחה', label: 'נדחה', preset: 'statusCancelled' },
];

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [googleSyncMock, setGoogleSyncMock] = useState(false);
  const [manualEvents, setManualEvents] = useState<DashboardCalendarEvent[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newReminder, setNewReminder] = useState<'0' | '15' | '30' | '60' | '120' | '1440'>('30');
  const [agendaStatusForId, setAgendaStatusForId] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusModalEventId, setStatusModalEventId] = useState<string | null>(null);

  const payments7d = useMemo(() => countPaymentsDueNext7Days(), []);
  const taskCounts = useMemo(() => countOpenTasksByStage(), []);
  const contactsN = useMemo(() => contactsDashboardCount(), []);
  const assetsXY = useMemo(() => assetsDashboardOccupancy(), []);

  const calendarOpts = useMemo(
    () => ({ includeGoogle: googleSyncMock, manualEvents }),
    [googleSyncMock, manualEvents],
  );

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const hasDot = useCallback(
    (day: Date) => getCalendarEventsForRange(day, day, calendarOpts).length > 0,
    [calendarOpts],
  );

  const agenda = useMemo(
    () => getAgendaForDay(selectedDate, calendarOpts),
    [selectedDate, calendarOpts],
  );

  const agendaTitle = useMemo(() => {
    const wd = selectedDate.toLocaleDateString('he-IL', { weekday: 'long' });
    const rest = selectedDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
    return `סדר יום ליום ${wd} · ${rest}`;
  }, [selectedDate]);

  const pushPaymentsPreset = useCallback(() => {
    router.push({ pathname: '/(app)/payments', params: paymentsDashboardQueryParams() });
  }, []);

  const pushTasksPreset = useCallback((preset: TasksDashboardPreset) => {
    router.push({ pathname: '/(app)/tasks', params: tasksDashboardQueryParams(preset) });
  }, []);

  const onSaveManualEvent = useCallback(() => {
    const title = newTitle.trim();
    if (!title) {
      Alert.alert('חסרה כותרת', 'הזן כותרת לאירוע.');
      return;
    }
    const dk = toLocalDateKey(selectedDate);
    const mins = newReminder === '0' ? undefined : parseInt(newReminder, 10);
    const id = `man-${Date.now()}`;
    setManualEvents((prev) => [
      ...prev,
      {
        id,
        source: 'manual',
        title,
        dateKey: dk,
        timeLabel: newTime.trim() || undefined,
        sortOrder: 900 + prev.length,
        statusLabel: 'חדש',
        detail: mins ? `תזכורת ${mins} דק׳ לפני` : 'ללא תזכורת',
        reminderMinutesBefore: mins,
      },
    ]);
    setNewTitle('');
    setNewTime('');
    setNewReminder('30');
    setCreateOpen(false);
  }, [newTitle, newTime, newReminder, selectedDate]);

  const statusModalEvent = statusModalEventId ? agenda.find((e) => e.id === statusModalEventId) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setDrawerOpen(true)}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="תפריט ראשי"
        >
          <MaterialCommunityIcons name="menu" size={26} color={Colors.onPrimary} />
        </Pressable>

        <View style={styles.headerRight}>
          <AppText variant="headingMd" weight="bold" color="onPrimary" style={{ textAlign: 'right' }}>
            שלום, מנהל 👋
          </AppText>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.85, textAlign: 'right' }}>
            דשבורד — {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/notifications')}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="התראות"
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.onPrimary} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
      >
        {/* סקשן א — קוביות */}
        <View style={styles.section}>
          <AppText variant="headingSm" weight="bold" style={styles.sectionTitle}>
            סקירה
          </AppText>
          <View style={styles.cubeGrid}>
            <Pressable
              onPress={() => router.push('/(app)/contacts')}
              style={({ pressed }) => [styles.cube, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="contacts-outline" size={26} color={Colors.primary} />
              <AppText variant="labelMd" weight="bold" align="right">
                ספר טלפונים
              </AppText>
              <AppText variant="displayMd" weight="extraBold" align="right" style={{ color: Colors.primary }}>
                {contactsN}
              </AppText>
              <AppText variant="caption" color="variant" align="right">
                אנשי קשר במערכת
              </AppText>
            </Pressable>

            <Pressable
              onPress={pushPaymentsPreset}
              style={({ pressed }) => [styles.cube, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="calendar-clock" size={26} color={Colors.warning} />
              <AppText variant="labelMd" weight="bold" align="right">
                תשלומים (7 ימים)
              </AppText>
              <AppText variant="displayMd" weight="extraBold" align="right" style={{ color: Colors.warning }}>
                {payments7d}
              </AppText>
              <AppText variant="caption" color="variant" align="right">
                עתידיים / באיחור (לא התקבלו)
              </AppText>
            </Pressable>

            <View style={styles.cube}>
              <MaterialCommunityIcons name="format-list-checks" size={26} color={Colors.info} />
              <AppText variant="labelMd" weight="bold" align="right">
                משימות פתוחות
              </AppText>
              <View style={styles.taskMiniRow}>
                <Pressable onPress={() => pushTasksPreset('new')} hitSlop={6} style={styles.taskMiniCell}>
                  <AppText variant="caption" color="variant">
                    חדשות
                  </AppText>
                  <AppText variant="headingSm" weight="bold">
                    {taskCounts.newCount}
                  </AppText>
                </Pressable>
                <Pressable onPress={() => pushTasksPreset('in_progress')} hitSlop={6} style={styles.taskMiniCell}>
                  <AppText variant="caption" color="variant">
                    בתהליך
                  </AppText>
                  <AppText variant="headingSm" weight="bold">
                    {taskCounts.inProgressCount}
                  </AppText>
                </Pressable>
                <Pressable onPress={() => pushTasksPreset('total_open')} hitSlop={6} style={styles.taskMiniCell}>
                  <AppText variant="caption" color="variant">
                    סה״כ
                  </AppText>
                  <AppText variant="headingSm" weight="bold">
                    {taskCounts.totalOpen}
                  </AppText>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(app)/assets-screens')}
              style={({ pressed }) => [styles.cube, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="home-city-outline" size={26} color={Colors.success} />
              <AppText variant="labelMd" weight="bold" align="right">
                נכסים
              </AppText>
              <AppText variant="displayMd" weight="extraBold" align="right" style={{ color: Colors.success }}>
                {assetsXY.rented}/{assetsXY.total}
              </AppText>
              <AppText variant="caption" color="variant" align="right">
                מושכרים / סה״כ (mock)
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* סקשן ב — יומן */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <AppText variant="headingSm" weight="bold">
              יומן אירועים
            </AppText>
            <View style={styles.syncRow}>
              <AppText variant="caption" color="variant">
                Google (דמה)
              </AppText>
              <Switch value={googleSyncMock} onValueChange={setGoogleSyncMock} />
            </View>
          </View>

          {googleSyncMock ? (
            <Card style={styles.googleCard}>
              <AppText variant="bodySm" align="right" style={{ marginBottom: Spacing.sm }}>
                מצב מסונכרן (mock): אירועי Google מוצגים בסדר היום ובסימון הימים.
              </AppText>
              <Pressable
                onPress={() => Linking.openURL(GOOGLE_CALENDAR_URL)}
                style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}
              >
                <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.primary} />
                <AppText variant="labelMd" weight="semiBold" color="primary">
                  פתח ב-Google Calendar
                </AppText>
              </Pressable>
            </Card>
          ) : null}

          {/* Monthly Calendar */}
          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            hasDot={hasDot}
          />

          <View style={styles.rowBetween}>
            <Pressable onPress={() => Alert.alert('סנכרון', 'כאן יופיעו הגדרות סנכרון יומן Google.')}>
              <AppText variant="bodySm" color="primary" weight="semiBold">
                סנכרון יומן גוגל
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setCreateOpen(true)}
              style={({ pressed }) => [styles.plusFab, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel="אירוע חדש"
            >
              <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
            </Pressable>
          </View>
        </View>

        {/* סקשן ג — סדר יום */}
        <View style={styles.section}>
          <AppText variant="headingSm" weight="bold" style={styles.sectionTitle}>
            {agendaTitle}
          </AppText>

          {agenda.length === 0 ? (
            <Card style={styles.emptyAgenda}>
              <AppText variant="bodyMd" color="variant" align="center">
                אין אירועים ביום זה
              </AppText>
            </Card>
          ) : (
            agenda.map((ev) => {
              const displayStatus = agendaStatusForId[ev.id] ?? ev.statusLabel;
              const tint = sourceColor(ev.source);
              return (
                <Card key={ev.id} style={styles.agendaCard}>
                  <View style={styles.agendaRow}>
                    <View style={[styles.agendaIcon, { backgroundColor: `${tint}22` }]}>
                      <MaterialCommunityIcons name={agendaEventIcon(ev)} size={20} color={tint} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyMd" weight="semiBold" numberOfLines={2} align="right">
                        {ev.title}
                      </AppText>
                      <AppText variant="bodySm" color="variant" numberOfLines={2} align="right">
                        {ev.timeLabel ? `${ev.timeLabel} · ` : ''}
                        {ev.detail}
                      </AppText>
                    </View>
                    <Badge label={displayStatus} preset="neutral" />
                  </View>
                  <View style={styles.agendaActions}>
                    <Pressable
                      onPress={() => setStatusModalEventId(ev.id)}
                      style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.85 }]}
                      hitSlop={6}
                    >
                      <AppText variant="labelSm" weight="semiBold" color="primary">
                        שינוי סטטוס
                      </AppText>
                    </Pressable>
                    {ev.href ? (
                      <Pressable
                        onPress={() => router.push(ev.href as Href)}
                        style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.85 }]}
                        hitSlop={6}
                      >
                        <AppText variant="labelSm" weight="semiBold" color="primary">
                          פרטים
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCreateOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" align="right" style={{ marginBottom: Spacing.md }}>
              אירוע חדש
            </AppText>
            <AppText variant="caption" color="variant" align="right" style={{ marginBottom: Spacing.xs }}>
              ליום הנבחר במערכת (שמירה מקומית בלבד)
            </AppText>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="כותרת"
              placeholderTextColor={Colors.onSurfaceMuted}
              style={styles.input}
              textAlign="right"
            />
            <TextInput
              value={newTime}
              onChangeText={setNewTime}
              placeholder="שעה (למשל 09:30)"
              placeholderTextColor={Colors.onSurfaceMuted}
              style={styles.input}
              textAlign="right"
            />
            <AppText variant="labelSm" weight="semiBold" align="right" style={{ marginTop: Spacing.sm }}>
              תזכורת לפני האירוע
            </AppText>
            <View style={styles.reminderChips}>
              {(
                [
                  { k: '0' as const, lab: 'ללא' },
                  { k: '15' as const, lab: '15 דק׳' },
                  { k: '30' as const, lab: '30 דק׳' },
                  { k: '60' as const, lab: 'שעה' },
                  { k: '120' as const, lab: 'שעתיים' },
                  { k: '1440' as const, lab: 'יום' },
                ] as const
              ).map((o) => (
                <Pressable
                  key={o.k}
                  onPress={() => setNewReminder(o.k)}
                  style={[styles.remChip, newReminder === o.k && styles.remChipOn]}
                >
                  <AppText variant="labelSm" weight={newReminder === o.k ? 'bold' : 'regular'}>
                    {o.lab}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCreateOpen(false)} style={styles.modalGhost}>
                <AppText variant="labelMd" weight="semiBold" color="variant">
                  ביטול
                </AppText>
              </Pressable>
              <Pressable onPress={onSaveManualEvent} style={styles.modalPrimary}>
                <AppText variant="labelMd" weight="bold" color="onPrimary">
                  שמירה
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!statusModalEvent} transparent animationType="fade" onRequestClose={() => setStatusModalEventId(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStatusModalEventId(null)}>
          <Pressable style={styles.statusSheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" align="right" style={{ marginBottom: Spacing.md }}>
              סטטוס באג׳נדה
            </AppText>
            {statusModalEvent ? (
              <AppText variant="bodySm" color="variant" align="right" style={{ marginBottom: Spacing.md }} numberOfLines={2}>
                {statusModalEvent.title}
              </AppText>
            ) : null}
            {AGENDA_STATUS_OPTIONS.map((o) => (
              <Pressable
                key={o.key}
                onPress={() => {
                  if (statusModalEventId) {
                    setAgendaStatusForId((prev) => ({ ...prev, [statusModalEventId]: o.label }));
                  }
                  setStatusModalEventId(null);
                }}
                style={({ pressed }) => [styles.statusOption, pressed && { opacity: 0.85 }]}
              >
                <Badge label={o.label} preset={o.preset} />
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
  headerRight: { flex: 1, gap: 2, paddingHorizontal: Spacing.sm },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  content: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.xl,
  },
  section: { gap: Spacing.md },
  sectionTitle: { textAlign: 'right' },
  cubeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cube: {
    width: '47%',
    minHeight: 132,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  taskMiniRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  taskMiniCell: { alignItems: 'center', minWidth: 44 },
  rowBetween: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  syncRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  googleCard: { padding: Spacing.md },
  linkBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-end',
  },
  weekRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  dayCell: {
    width: 48,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  dayCellSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  dot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotOn: { backgroundColor: Colors.primary },
  plusFab: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  emptyAgenda: { padding: Spacing.xl },
  agendaCard: { gap: Spacing.sm, marginBottom: Spacing.sm },
  agendaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  agendaIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaActions: {
    flexDirection: 'row-reverse',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    paddingTop: Spacing.sm,
  },
  smallBtn: { paddingVertical: Spacing.xs },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  statusSheet: {
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  reminderChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  remChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  remChipOn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalGhost: { padding: Spacing.md },
  modalPrimary: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  statusOption: {
    paddingVertical: Spacing.sm,
    alignItems: 'flex-end',
  },
});
