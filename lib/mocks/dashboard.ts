/**
 * Dashboard aggregations, calendar/agenda mock data (no backend).
 */

import { MOCK_CONTACTS_LIST } from '@/lib/mocks/contacts';
import { MOCK_PAYMENTS_LIST, type PaymentListRow } from '@/lib/mocks/payments';
import { MOCK_TASKS_LIST, type TaskKind } from '@/lib/mocks/tasks';
import { assetOccupancyStats } from '@/lib/mocks/assets';

// ─── Date helpers (DD/MM/YYYY consistent with payments/tasks mocks) ───────────

export function parseDdMmYyyyToTime(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

export function formatDdMmYyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateKeyFromDdMmYyyy(s: string): string | null {
  const t = parseDdMmYyyyToTime(s);
  if (!t) return null;
  return toLocalDateKey(new Date(t));
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ─── User persona (mock) ─────────────────────────────────────────────────────

export type DashboardUserMode = 'worker' | 'owner';

/** החלף ל־worker כדי לראות סינון משימות לפי "שלי" בדשבורד */
export const DASHBOARD_USER_MODE: DashboardUserMode = 'owner';

// ─── Payments (7 days) ───────────────────────────────────────────────────────

function paymentCountsForDashboardWindow(rows: PaymentListRow[], anchor: Date): number {
  const start = startOfLocalDay(anchor).getTime();
  const end = addDays(startOfLocalDay(anchor), 7).getTime();
  return rows.filter((r) => {
    if (r.statusBucket === 'received') return false;
    if (r.statusBucket !== 'future' && r.statusBucket !== 'overdue') return false;
    const t = parseDdMmYyyyToTime(r.dueDate);
    if (!t) return false;
    return t >= start && t <= end;
  }).length;
}

export function countPaymentsDueNext7Days(
  rows: PaymentListRow[] = MOCK_PAYMENTS_LIST,
  anchor: Date = new Date(),
): number {
  return paymentCountsForDashboardWindow(rows, anchor);
}

/** פרמטרים ל־Expo Router — תשלומים עתידיים בשבוע הקרוב */
export function paymentsDashboardQueryParams(anchor: Date = new Date()): Record<string, string> {
  const from = startOfLocalDay(anchor);
  const to = addDays(from, 7);
  return {
    dateFrom: formatDdMmYyyy(from),
    dateTo: formatDdMmYyyy(to),
    statusTab: 'future',
  };
}

// ─── Tasks (open) ─────────────────────────────────────────────────────────────

/** פרסט ניווט למסך משימות מהדשבורד */
export type TasksDashboardPreset = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'total_open' | 'overdue';

export function tasksDashboardQueryParams(preset: TasksDashboardPreset): Record<string, string> {
  const base: Record<string, string> = {};
  if (DASHBOARD_USER_MODE === 'worker') {
    base.assignee = 'אני';
  }
  if (preset === 'open') {
    return { ...base, statusTab: 'open' };
  }
  if (preset === 'in_progress') {
    return { ...base, statusTab: 'in_progress' };
  }
  if (preset === 'completed') {
    return { ...base, statusTab: 'completed' };
  }
  if (preset === 'cancelled') {
    return { ...base, statusTab: 'all', workflowStatus: 'cancelled' };
  }
  if (preset === 'overdue') {
    return { ...base, statusTab: 'all', overdueOnly: 'true' };
  }
  return { ...base, statusTab: 'all' };
}

// ─── Assets cube ──────────────────────────────────────────────────────────────

export function assetsDashboardOccupancy() {
  return assetOccupancyStats();
}

export function contactsDashboardCount(): number {
  return MOCK_CONTACTS_LIST.length;
}

// ─── Calendar / agenda ───────────────────────────────────────────────────────

export type CalendarEventSource = 'payment' | 'contract' | 'task' | 'reminder' | 'manual' | 'google';

export type DashboardCalendarEvent = {
  id: string;
  source: CalendarEventSource;
  title: string;
  dateKey: string;
  timeLabel?: string;
  sortOrder: number;
  statusLabel: string;
  detail: string;
  href?: string;
  /** לאירועי משימה — לאייקון לפי סוג (כמו במסך משימות) */
  taskKind?: TaskKind;
};

export type UserReminderMock = {
  id: string;
  title: string;
  detail: string;
  dueDate: string;
  statusLabel: string;
};

/** תזכורות מערכת (mock) — גבייה, חידוש וכו׳ */
export const MOCK_USER_REMINDERS: UserReminderMock[] = [
  {
    id: 'ur1',
    title: 'תזכורת גבייה — דירה 7A',
    detail: 'מעקב אחר תשלום שיווק',
    dueDate: '24/04/2026',
    statusLabel: 'ממתין',
  },
  {
    id: 'ur2',
    title: 'חידוש חוזה צפוי',
    detail: 'משרד 201 — בדיקת תנאים',
    dueDate: '26/04/2026',
    statusLabel: 'לטיפול',
  },
  {
    id: 'ur3',
    title: 'ביקורת תחזוקה רבעונית',
    detail: 'מגדלי הים',
    dueDate: '28/04/2026',
    statusLabel: 'מתוכנן',
  },
];

export type GoogleCalendarEventMock = Pick<DashboardCalendarEvent, 'id' | 'title' | 'dateKey' | 'timeLabel' | 'detail' | 'statusLabel'>;

export const MOCK_GOOGLE_CALENDAR_EVENTS: GoogleCalendarEventMock[] = [
  {
    id: 'gcal1',
    title: 'ישיבת צוות (Google)',
    dateKey: '2026-04-23',
    timeLabel: '10:00',
    detail: 'Calendar — דמה',
    statusLabel: 'מוזמן',
  },
  {
    id: 'gcal2',
    title: 'שיחת וידאו עם ספק',
    dateKey: '2026-04-25',
    timeLabel: '14:30',
    detail: 'Google Calendar',
    statusLabel: 'מוזמן',
  },
];

function paymentStatusLabel(bucket: PaymentListRow['statusBucket']): string {
  if (bucket === 'future') return 'עתידי';
  if (bucket === 'overdue') return 'באיחור';
  return 'התקבל';
}

function eventsFromPayments(): DashboardCalendarEvent[] {
  return MOCK_PAYMENTS_LIST
    .filter((p) => p.statusBucket !== 'received') // Only show upcoming/overdue payments
    .map((p, i) => {
      const dk = dateKeyFromDdMmYyyy(p.dueDate);
      if (!dk) return null;
      return {
        id: `pay-ev-${p.id}`,
        source: 'payment' as const,
        title: p.displayName,
        dateKey: dk,
        sortOrder: i,
        statusLabel: paymentStatusLabel(p.statusBucket),
        detail: `${p.linkLabel} · ${p.direction === 'inbound' ? 'הכנסה' : 'הוצאה'} · ${p.progressLabel}`,
        href: `/(app)/payments/${p.id}`,
      };
    }).filter(Boolean) as DashboardCalendarEvent[];
}

function eventsFromContracts(): DashboardCalendarEvent[] {
  return [];
}

function eventsFromTasks(): DashboardCalendarEvent[] {
  return MOCK_TASKS_LIST.map((t, i) => {
    const dk = dateKeyFromDdMmYyyy(t.dueDate);
    if (!dk) return null;
    return {
      id: `task-ev-${t.id}`,
      source: 'task' as const,
      title: t.title,
      dateKey: dk,
      sortOrder: 200 + i,
      statusLabel:
        t.workflowStatus === 'completed'
          ? 'הושלם'
          : t.workflowStatus === 'cancelled'
            ? 'בוטל'
            : t.workflowStatus === 'in_progress'
              ? 'בטיפול'
              : t.workflowStatus === 'not_started'
                ? 'טרם התחיל'
                : 'פתוח',
      detail: t.linkLabel,
      href: `/(app)/tasks/${t.id}`,
      taskKind: t.taskKind,
    };
  }).filter(Boolean) as DashboardCalendarEvent[];
}

function eventsFromReminders(): DashboardCalendarEvent[] {
  return MOCK_USER_REMINDERS.map((r, i) => {
    const dk = dateKeyFromDdMmYyyy(r.dueDate);
    if (!dk) return null;
    return {
      id: `rem-ev-${r.id}`,
      source: 'reminder' as const,
      title: r.title,
      dateKey: dk,
      sortOrder: 300 + i,
      statusLabel: r.statusLabel,
      detail: r.detail,
    };
  }).filter(Boolean) as DashboardCalendarEvent[];
}

function eventsFromGoogle(include: boolean): DashboardCalendarEvent[] {
  if (!include) return [];
  return MOCK_GOOGLE_CALENDAR_EVENTS.map((g, i) => ({
    id: `goo-ev-${g.id}`,
    source: 'google' as const,
    title: g.title,
    dateKey: g.dateKey,
    timeLabel: g.timeLabel,
    sortOrder: 400 + i,
    statusLabel: g.statusLabel,
    detail: g.detail,
  }));
}

function mergeBaseEvents(includeGoogle: boolean): DashboardCalendarEvent[] {
  return [
    ...eventsFromPayments(),
    ...eventsFromContracts(),
    ...eventsFromTasks(),
    ...eventsFromReminders(),
    ...eventsFromGoogle(includeGoogle),
  ];
}

function inRange(dateKey: string, fromKey: string, toKey: string): boolean {
  return dateKey >= fromKey && dateKey <= toKey;
}

export type CalendarRangeOpts = {
  /** אירועי Google Calendar (mock) */
  includeGoogle?: boolean;
  /** אירועים ידניים מהדשבורד */
  manualEvents?: DashboardCalendarEvent[];
};

export function getCalendarEventsForRange(from: Date, to: Date, opts?: CalendarRangeOpts): DashboardCalendarEvent[] {
  const fromKey = toLocalDateKey(startOfLocalDay(from));
  const toKey = toLocalDateKey(startOfLocalDay(to));
  const manual = opts?.manualEvents ?? [];
  const merged = [...mergeBaseEvents(opts?.includeGoogle ?? false), ...manual];
  const filtered = merged.filter((e) => inRange(e.dateKey, fromKey, toKey));
  filtered.sort((a, b) => {
    const c = a.dateKey.localeCompare(b.dateKey);
    if (c !== 0) return c;
    const ta = a.timeLabel ?? '';
    const tb = b.timeLabel ?? '';
    if (ta !== tb) return ta.localeCompare(tb, 'he');
    return a.sortOrder - b.sortOrder;
  });
  return filtered;
}

export function getAgendaForDay(day: Date, opts?: CalendarRangeOpts): DashboardCalendarEvent[] {
  const key = toLocalDateKey(startOfLocalDay(day));
  return getCalendarEventsForRange(day, day, opts);
}
