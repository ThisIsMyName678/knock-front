/**
 * Mock tasks module — types, messages, filters (no backend).
 */

import type { LinkKind } from '@/lib/mocks/contracts';
import { MOCK_PAYMENTS_LIST } from '@/lib/mocks/payments';

export type TaskKind = 'maintenance' | 'execution' | 'collection_payment' | 'contract_renewal';

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  maintenance: 'תחזוקה',
  execution: 'ביצוע',
  collection_payment: 'גביה ותשלומים',
  contract_renewal: 'חידוש חוזה',
};

/** שמות אייקון MaterialCommunityIcons */
export const TASK_KIND_ICONS: Record<TaskKind, string> = {
  maintenance: 'hammer-wrench',
  execution: 'clipboard-check-outline',
  collection_payment: 'cash-multiple',
  contract_renewal: 'file-document-edit-outline',
};

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'דחוף',
  high: 'גבוה',
  medium: 'בינוני',
  low: 'נמוך',
};

export type WorkflowStatus = 'not_started' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  not_started: 'טרם התחיל',
  open: 'פתוח',
  in_progress: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל',
};

export type TaskMessage = {
  id: string;
  text: string;
  imageUri?: string;
  authorName: string;
  sentAt: string;
};

export type TaskListRow = {
  id: string;
  title: string;
  taskKind: TaskKind;
  priority: TaskPriority;
  workflowStatus: WorkflowStatus;
  linkKind: LinkKind;
  linkId: string;
  linkLabel: string;
  assigneeName: string;
  assigneeHasUser: boolean;
  createdBy: string;
  isMine: boolean;
  dueDate: string;
  startDate: string;
  endDate?: string;
  costNotes?: string;
  timeNotes?: string;
  linkedPaymentId?: string;
  messages: TaskMessage[];
};

function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

const MESSAGES_T1: TaskMessage[] = [
  { id: 'm1', text: 'נפתחה קריאה', authorName: 'דני מנהל', sentAt: '20/04/2026 09:00' },
  { id: 'm2', text: 'שלחתי תמונה של הנזק', authorName: 'יוסי דייר', sentAt: '20/04/2026 10:15', imageUri: 'https://picsum.photos/id/237/400/300' },
  { id: 'm3', text: 'אקבע טכנאי למחר', authorName: 'דני מנהל', sentAt: '20/04/2026 11:00' },
  { id: 'm4', text: 'הטכנאי בדרך', authorName: 'שרות חוץ', sentAt: '21/04/2026 08:30' },
  { id: 'm5', text: 'בוצעה בדיקה ראשונית', authorName: 'אינסטלטור דן', sentAt: '21/04/2026 14:20' },
  { id: 'm6', text: 'ממתינים לחלק חלופי', authorName: 'אינסטלטור דן', sentAt: '22/04/2026 09:00' },
  { id: 'm7', text: 'עדכון: החלק הגיע', authorName: 'אינסטלטור דן', sentAt: '22/04/2026 16:45' },
  { id: 'm8', text: 'סיימנו, נבדוק לחץ מים', authorName: 'אינסטלטור דן', sentAt: '23/04/2026 10:00' },
];

const BASE_TASKS: TaskListRow[] = [
  {
    id: 't1',
    title: 'נזילה בחדר רחצה — דירה 4B',
    taskKind: 'maintenance',
    priority: 'urgent',
    workflowStatus: 'in_progress',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    assigneeName: 'אינסטלטור דן',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '25/04/2026',
    startDate: '20/04/2026',
    costNotes: 'הערכה: ₪450',
    timeNotes: '2 שעות עבודה',
    linkedPaymentId: 'pay2',
    messages: MESSAGES_T1,
  },
  {
    id: 't2',
    title: 'חידוש חוזה שכירות — דירה 7A',
    taskKind: 'contract_renewal',
    priority: 'high',
    workflowStatus: 'open',
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    assigneeName: 'מיכל לוי',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '30/04/2026',
    startDate: '18/04/2026',
    messages: [{ id: 'x1', text: 'נדרש חתימה דיגיטלית', authorName: 'אני', sentAt: '18/04/2026 12:00' }],
  },
  {
    id: 't3',
    title: 'מעקב תשלום ארנונה — מגדלי הים',
    taskKind: 'collection_payment',
    priority: 'medium',
    workflowStatus: 'not_started',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    assigneeName: 'חשבות',
    assigneeHasUser: false,
    createdBy: 'אני',
    isMine: true,
    dueDate: '01/05/2026',
    startDate: '22/04/2026',
    linkedPaymentId: 'pay4',
    messages: [],
  },
  {
    id: 't4',
    title: 'בדיקת מערכת גז שנתית',
    taskKind: 'execution',
    priority: 'low',
    workflowStatus: 'completed',
    linkKind: 'asset',
    linkId: 'a4',
    linkLabel: 'בית פרטי',
    assigneeName: 'טכנאי גז',
    assigneeHasUser: true,
    createdBy: 'מנהל אחר',
    isMine: false,
    dueDate: '15/04/2026',
    startDate: '01/04/2026',
    costNotes: '₪200',
    messages: [{ id: 'g1', text: 'בוצע בהצלחה', authorName: 'טכנאי גז', sentAt: '15/04/2026 17:00' }],
  },
  {
    id: 't5',
    title: 'גביית שכירות אפריל',
    taskKind: 'collection_payment',
    priority: 'high',
    workflowStatus: 'in_progress',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    assigneeName: 'אני',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '05/05/2026',
    startDate: '22/04/2026',
    linkedPaymentId: 'pay1',
    messages: [],
  },
  {
    id: 't6',
    title: 'צביעת חדר משותף',
    taskKind: 'maintenance',
    priority: 'medium',
    workflowStatus: 'open',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    assigneeName: 'קבלן צבע',
    assigneeHasUser: false,
    createdBy: 'ועד בית',
    isMine: false,
    dueDate: '10/05/2026',
    startDate: '21/04/2026',
    messages: [
      { id: 'p1', text: 'נא לאשר גוון', authorName: 'ועד בית', sentAt: '21/04/2026 09:00' },
      { id: 'p2', text: 'מצורף דוגמה', authorName: 'קבלן צבע', sentAt: '21/04/2026 15:00', imageUri: 'https://picsum.photos/id/433/400/300' },
    ],
  },
  {
    id: 't7',
    title: 'החתמת חוזה משרד 201',
    taskKind: 'contract_renewal',
    priority: 'urgent',
    workflowStatus: 'cancelled',
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    assigneeName: 'מיכל לוי',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '12/04/2026',
    startDate: '01/04/2026',
    messages: [{ id: 'c1', text: 'בוטל לבקשת השוכר', authorName: 'אני', sentAt: '12/04/2026 11:00' }],
  },
  {
    id: 't8',
    title: 'התקנת מזגן במשרד',
    taskKind: 'execution',
    priority: 'medium',
    workflowStatus: 'in_progress',
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    assigneeName: 'אינסטלטור דן',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '28/04/2026',
    startDate: '23/04/2026',
    messages: [],
  },
  {
    id: 't9',
    title: 'מעקב ביטוח מבנה',
    taskKind: 'execution',
    priority: 'low',
    workflowStatus: 'not_started',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    assigneeName: 'סוכן ביטוח',
    assigneeHasUser: false,
    createdBy: 'אני',
    isMine: true,
    dueDate: '01/06/2026',
    startDate: '22/04/2026',
    messages: [],
  },
  {
    id: 't10',
    title: 'תיקון דלת כניסה',
    taskKind: 'maintenance',
    priority: 'high',
    workflowStatus: 'open',
    linkKind: 'asset',
    linkId: 'a5',
    linkLabel: 'חנות קרקע',
    assigneeName: 'נגר שירותים',
    assigneeHasUser: false,
    createdBy: 'אני',
    isMine: true,
    dueDate: '26/04/2026',
    startDate: '22/04/2026',
    messages: [{ id: 'd1', text: 'ממתינים לחלק', authorName: 'נגר שירותים', sentAt: '22/04/2026 18:00' }],
  },
  {
    id: 't11',
    title: 'סיכום רבעון גבייה',
    taskKind: 'collection_payment',
    priority: 'medium',
    workflowStatus: 'completed',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    assigneeName: 'חשבות',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '20/04/2026',
    startDate: '01/04/2026',
    messages: [],
  },
  {
    id: 't12',
    title: 'הדרכת דייר חדש',
    taskKind: 'execution',
    priority: 'low',
    workflowStatus: 'open',
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    assigneeName: 'אני',
    assigneeHasUser: true,
    createdBy: 'אני',
    isMine: true,
    dueDate: '29/04/2026',
    startDate: '22/04/2026',
    messages: [],
  },
];

export const MOCK_TASKS_LIST: TaskListRow[] = BASE_TASKS;

export const MOCK_ASSIGNEE_NAMES: string[] = Array.from(
  new Set(MOCK_TASKS_LIST.map((t) => t.assigneeName)),
).sort((a, b) => a.localeCompare(b, 'he'));

export type TaskStatusTab = 'all' | 'in_progress' | 'open' | 'completed' | 'urgent';

export type TaskKindFilter = 'all' | TaskKind;

export type TaskPriorityFilter = 'all' | TaskPriority;

export type LinkScopeFilter = 'all' | LinkKind;

export function filterTaskRows(
  rows: TaskListRow[],
  opts: {
    search: string;
    taskKind: TaskKindFilter;
    priority: TaskPriorityFilter;
    statusTab: TaskStatusTab;
    linkScope: LinkScopeFilter;
    entityId: string | null;
    assignee: string | null;
    dateFrom: string;
    dateTo: string;
  },
): TaskListRow[] {
  const q = opts.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (opts.taskKind !== 'all' && r.taskKind !== opts.taskKind) return false;
    if (opts.priority !== 'all' && r.priority !== opts.priority) return false;
    if (opts.linkScope !== 'all' && r.linkKind !== opts.linkScope) return false;
    if (opts.entityId && r.linkId !== opts.entityId) return false;
    if (opts.assignee && r.assigneeName !== opts.assignee) return false;

    if (opts.statusTab !== 'all') {
      if (opts.statusTab === 'in_progress' && r.workflowStatus !== 'in_progress') return false;
      if (opts.statusTab === 'open' && !(r.workflowStatus === 'open' || r.workflowStatus === 'not_started')) return false;
      if (opts.statusTab === 'completed' && r.workflowStatus !== 'completed') return false;
      if (opts.statusTab === 'urgent' && r.priority !== 'urgent') return false;
    }

    const t = parseDdMmYyyy(r.dueDate);
    if (opts.dateFrom.trim()) {
      const from = parseDdMmYyyy(opts.dateFrom);
      if (from && t && t < from) return false;
    }
    if (opts.dateTo.trim()) {
      const to = parseDdMmYyyy(opts.dateTo);
      if (to && t && t > to) return false;
    }

    if (!q) return true;
    const hay = `${r.title} ${r.linkLabel} ${r.assigneeName} ${TASK_KIND_LABELS[r.taskKind]}`.toLowerCase();
    return hay.includes(q);
  });
}

export function getRecentTasksForUser(rows: TaskListRow[], limit: number): TaskListRow[] {
  const mine = rows.filter((r) => r.isMine);
  return [...mine].sort((a, b) => parseDdMmYyyy(b.dueDate) - parseDdMmYyyy(a.dueDate)).slice(0, limit);
}

export function getTaskDetailMock(id: string): TaskListRow | null {
  return MOCK_TASKS_LIST.find((t) => t.id === id) ?? null;
}

export function paymentsForTaskLink(linkId: string) {
  return MOCK_PAYMENTS_LIST.filter((p) => p.linkId === linkId);
}

export function lastMessages(messages: TaskMessage[], n: number): TaskMessage[] {
  return messages.slice(-n).reverse();
}

export type TaskSortKey = 'dueDate' | 'title' | 'priority';
export type SortDir = 'asc' | 'desc';

const PRI_ORDER: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function sortTaskRows(rows: TaskListRow[], key: TaskSortKey, dir: SortDir): TaskListRow[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === 'dueDate') return mul * (parseDdMmYyyy(a.dueDate) - parseDdMmYyyy(b.dueDate));
    if (key === 'title') return mul * a.title.localeCompare(b.title, 'he');
    return mul * (PRI_ORDER[a.priority] - PRI_ORDER[b.priority]);
  });
}

/** לינק הזמנה דמה — להצגה בלבד */
export const MOCK_TASK_INVITE_URL = 'https://app.knock.example/invite/task-demo-token';
