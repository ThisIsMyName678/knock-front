/**
 * Mock data + types + aggregators for the Reports module (UI design preview only).
 *
 * Aggregations are pure functions over existing mocks (tasks + payments + entities).
 * No backend, no persistence — used to render report previews.
 */

import {
  MOCK_TASKS_LIST,
  MAINTENANCE_CATEGORY_ORDER,
  type TaskListRow,
  type MaintenanceCategory,
} from '@/lib/mocks/tasks';
import {
  MOCK_PAYMENTS_LIST,
  PAYMENT_ENTITY_OPTIONS,
  PAYMENT_TYPE_LABELS,
  type PaymentListRow,
  type PaymentTypeKey,
} from '@/lib/mocks/payments';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReportType = 'financial' | 'maintenance';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  financial: 'פיננסי',
  maintenance: 'תחזוקה',
};

export const REPORT_TYPE_ICONS: Record<ReportType, string> = {
  financial: 'cash-multiple',
  maintenance: 'hammer-wrench',
};

export type AutoReportFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly';

export const AUTO_FREQUENCY_LABELS: Record<AutoReportFrequency, string> = {
  daily: 'יומי',
  weekly: 'שבועי',
  biweekly: 'דו-שבועי',
  monthly: 'חודשי',
  quarterly: 'רבעוני',
};

export type AutoReportConfig = {
  enabled: boolean;
  frequency: AutoReportFrequency;
  recipients: string[];
  emailSubject: string;
  emailBody: string;
};

export const DEFAULT_AUTO_CONFIG: AutoReportConfig = {
  enabled: false,
  frequency: 'monthly',
  recipients: [],
  emailSubject: 'דו"ח אוטומטי ממערכת knock-knock',
  emailBody:
    'שלום,\n\nמצורף דו"ח אוטומטי שהופק עבורך ממערכת knock-knock.\n' +
    'הדו"ח כולל את הסינונים שהגדרת ומופק כקובץ PDF.\n\n' +
    'בברכה,\nצוות knock-knock',
};

export type ReportFilters = {
  dateFrom: string; // DD/MM/YYYY
  dateTo: string;   // DD/MM/YYYY
  reportType: ReportType;
  /** מזהי נכסים/פרויקטים שנבחרו. ריק = "כל הנכסים". */
  entityIds: string[];
};

export type SavedReport = {
  id: string;
  name: string;
  savedAt: string; // DD/MM/YYYY
  filters: ReportFilters;
  autoConfig: AutoReportConfig;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

export function toDdMmYyyy(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatCurrencyILS(value: number): string {
  try {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₪${value.toLocaleString('he-IL')}`;
  }
}

export function formatNumber(value: number): string {
  return value.toLocaleString('he-IL');
}

export function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

const HE_MONTHS_SHORT = [
  'ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳',
  'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳',
];

export function monthLabel(year: number, monthIdx: number): string {
  return `${HE_MONTHS_SHORT[monthIdx]} ${String(year).slice(2)}`;
}

/** רשימת חודשים (year, monthIdx) בטווח. אם הטווח ריק/לא תקין — מחזיר 6 חודשים אחרונים. */
export function monthsInRange(dateFrom: string, dateTo: string): { y: number; m: number; key: string; label: string }[] {
  const fromTs = dateFrom ? parseDdMmYyyy(dateFrom) : 0;
  const toTs = dateTo ? parseDdMmYyyy(dateTo) : 0;
  let from: Date;
  let to: Date;
  if (fromTs && toTs) {
    from = new Date(fromTs);
    to = new Date(toTs);
  } else {
    to = new Date();
    from = new Date(to.getFullYear(), to.getMonth() - 5, 1);
  }
  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }
  const result: { y: number; m: number; key: string; label: string }[] = [];
  let y = from.getFullYear();
  let m = from.getMonth();
  while (y < to.getFullYear() || (y === to.getFullYear() && m <= to.getMonth())) {
    result.push({ y, m, key: `${y}-${m}`, label: monthLabel(y, m) });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return result;
}

/** האם תאריך (DD/MM/YYYY) בטווח? אם הטווח ריק — תמיד true. */
function inDateRange(date: string, dateFrom: string, dateTo: string): boolean {
  const t = parseDdMmYyyy(date);
  if (!t) return true;
  if (dateFrom) {
    const f = parseDdMmYyyy(dateFrom);
    if (f && t < f) return false;
  }
  if (dateTo) {
    const to = parseDdMmYyyy(dateTo);
    if (to && t > to) return false;
  }
  return true;
}

/** האם הישות (asset/project) של השורה בתוך הסט הנבחר? entityIds ריק = הכל. */
function inEntitySet(linkId: string, entityIds: string[]): boolean {
  if (!entityIds.length) return true;
  return entityIds.includes(linkId);
}

// ─── Maintenance Report ──────────────────────────────────────────────────────

export type MaintenanceReportData = {
  totals: {
    projects: number;
    assets: number;
    totalCalls: number;
    totalCost: number;
  };
  byCategory: {
    category: MaintenanceCategory;
    opened: number;
    closed: number;
    stillOpen: number;
    avgCloseDays: number | null;
    totalCost: number;
  }[];
  byAsset: {
    entityId: string;
    entityName: string;
    entityKind: 'asset' | 'project';
    totalCalls: number;
    openCalls: number;
    closedCalls: number;
    totalCost: number;
    perCategory: Partial<Record<MaintenanceCategory, number>>;
  }[];
  monthly: {
    key: string;
    label: string;
    totalCalls: number;
    avgCallsPerAsset: number;
    topCategory: MaintenanceCategory | null;
  }[];
};

function getEntityName(linkId: string): string {
  return PAYMENT_ENTITY_OPTIONS.find((e) => e.id === linkId)?.name ?? linkId;
}

function getEntityKind(linkId: string): 'asset' | 'project' {
  return (PAYMENT_ENTITY_OPTIONS.find((e) => e.id === linkId)?.kind ?? 'asset') as
    | 'asset'
    | 'project';
}

function diffDays(startStr: string, endStr: string): number | null {
  const s = parseDdMmYyyy(startStr);
  const e = parseDdMmYyyy(endStr);
  if (!s || !e) return null;
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

export function buildMaintenanceReport(filters: ReportFilters): MaintenanceReportData {
  const allMaintenance = MOCK_TASKS_LIST.filter((t) => t.taskKind === 'maintenance');
  const inScope = allMaintenance.filter(
    (t) =>
      inEntitySet(t.linkId, filters.entityIds) &&
      inDateRange(t.startDate, filters.dateFrom, filters.dateTo),
  );

  const projectIds = new Set<string>();
  const assetIds = new Set<string>();
  let totalCost = 0;

  for (const t of inScope) {
    const kind = getEntityKind(t.linkId);
    if (kind === 'project') projectIds.add(t.linkId);
    if (kind === 'asset') assetIds.add(t.linkId);
    totalCost += t.cost ?? 0;
  }

  const byCategory = MAINTENANCE_CATEGORY_ORDER.map((cat) => {
    const rows = inScope.filter((t) => (t.maintenanceCategory ?? 'other') === cat);
    const closed = rows.filter((r) => r.workflowStatus === 'completed');
    const stillOpen = rows.filter(
      (r) => r.workflowStatus !== 'completed' && r.workflowStatus !== 'cancelled',
    );
    const closeDays = closed
      .map((r) => (r.endDate ? diffDays(r.startDate, r.endDate) : null))
      .filter((v): v is number => v !== null);
    const avg =
      closeDays.length > 0
        ? Math.round(closeDays.reduce((a, b) => a + b, 0) / closeDays.length)
        : null;
    const cost = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);
    return {
      category: cat,
      opened: rows.length,
      closed: closed.length,
      stillOpen: stillOpen.length,
      avgCloseDays: avg,
      totalCost: cost,
    };
  });

  const byAssetMap = new Map<string, MaintenanceReportData['byAsset'][number]>();
  for (const t of inScope) {
    const existing = byAssetMap.get(t.linkId) ?? {
      entityId: t.linkId,
      entityName: getEntityName(t.linkId),
      entityKind: getEntityKind(t.linkId),
      totalCalls: 0,
      openCalls: 0,
      closedCalls: 0,
      totalCost: 0,
      perCategory: {} as Partial<Record<MaintenanceCategory, number>>,
    };
    existing.totalCalls += 1;
    if (t.workflowStatus === 'completed') existing.closedCalls += 1;
    else if (t.workflowStatus !== 'cancelled') existing.openCalls += 1;
    existing.totalCost += t.cost ?? 0;
    const cat = t.maintenanceCategory ?? 'other';
    existing.perCategory[cat] = (existing.perCategory[cat] ?? 0) + 1;
    byAssetMap.set(t.linkId, existing);
  }
  const byAsset = Array.from(byAssetMap.values()).sort(
    (a, b) => b.totalCalls - a.totalCalls,
  );

  const months = monthsInRange(filters.dateFrom, filters.dateTo);
  const totalAssetsForAvg = Math.max(1, assetIds.size + projectIds.size);
  const monthly = months.map((mn) => {
    const inMonth = inScope.filter((t) => {
      const ts = parseDdMmYyyy(t.startDate);
      if (!ts) return false;
      const d = new Date(ts);
      return d.getFullYear() === mn.y && d.getMonth() === mn.m;
    });
    const counts: Partial<Record<MaintenanceCategory, number>> = {};
    for (const r of inMonth) {
      const c = r.maintenanceCategory ?? 'other';
      counts[c] = (counts[c] ?? 0) + 1;
    }
    let topCategory: MaintenanceCategory | null = null;
    let topVal = 0;
    for (const c of MAINTENANCE_CATEGORY_ORDER) {
      const v = counts[c] ?? 0;
      if (v > topVal) { topVal = v; topCategory = c; }
    }
    return {
      key: mn.key,
      label: mn.label,
      totalCalls: inMonth.length,
      avgCallsPerAsset: Math.round((inMonth.length / totalAssetsForAvg) * 10) / 10,
      topCategory,
    };
  });

  return {
    totals: {
      projects: projectIds.size,
      assets: assetIds.size,
      totalCalls: inScope.length,
      totalCost,
    },
    byCategory,
    byAsset,
    monthly,
  };
}

// ─── Financial Report ────────────────────────────────────────────────────────

export type FinancialReportData = {
  totals: {
    projects: number;
    assets: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    avgIncomePerAsset: number;
    avgBalancePerAsset: number;
  };
  topIncome: { entityId: string; entityName: string; amount: number }[];
  topExpense: { entityId: string; entityName: string; amount: number }[];
  expenseByCategory: { category: PaymentTypeKey; label: string; amount: number }[];
  incomeByCategory: { category: PaymentTypeKey; label: string; amount: number }[];
  late: PaymentListRow[];
  uncollected: PaymentListRow[];
  monthly: {
    key: string;
    label: string;
    income: number;
    expense: number;
    balance: number;
  }[];
};

export function buildFinancialReport(filters: ReportFilters): FinancialReportData {
  const inScope = MOCK_PAYMENTS_LIST.filter(
    (p) =>
      inEntitySet(p.linkId, filters.entityIds) &&
      inDateRange(p.dueDate, filters.dateFrom, filters.dateTo),
  );

  const projectIds = new Set<string>();
  const assetIds = new Set<string>();
  for (const p of inScope) {
    const kind = getEntityKind(p.linkId);
    if (kind === 'project') projectIds.add(p.linkId);
    else assetIds.add(p.linkId);
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const p of inScope) {
    if (p.direction === 'inbound') totalIncome += p.amount;
    else totalExpense += p.amount;
  }

  const perAssetIncome = new Map<string, number>();
  const perAssetExpense = new Map<string, number>();
  for (const p of inScope) {
    const map = p.direction === 'inbound' ? perAssetIncome : perAssetExpense;
    map.set(p.linkId, (map.get(p.linkId) ?? 0) + p.amount);
  }

  const topIncome = Array.from(perAssetIncome.entries())
    .map(([entityId, amount]) => ({
      entityId,
      entityName: getEntityName(entityId),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const topExpense = Array.from(perAssetExpense.entries())
    .map(([entityId, amount]) => ({
      entityId,
      entityName: getEntityName(entityId),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const expenseByMap = new Map<PaymentTypeKey, number>();
  const incomeByMap = new Map<PaymentTypeKey, number>();
  for (const p of inScope) {
    const map = p.direction === 'inbound' ? incomeByMap : expenseByMap;
    map.set(p.paymentType, (map.get(p.paymentType) ?? 0) + p.amount);
  }
  const expenseByCategory = Array.from(expenseByMap.entries())
    .map(([category, amount]) => ({
      category,
      label: PAYMENT_TYPE_LABELS[category],
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
  const incomeByCategory = Array.from(incomeByMap.entries())
    .map(([category, amount]) => ({
      category,
      label: PAYMENT_TYPE_LABELS[category],
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const today = new Date().getTime();
  const late = inScope.filter(
    (p) =>
      p.direction === 'inbound' &&
      p.statusBucket === 'received' &&
      parseDdMmYyyy(p.dueDate) < today &&
      // delayed > 7 days as a proxy
      today - parseDdMmYyyy(p.dueDate) > 7 * 24 * 60 * 60 * 1000,
  );
  const uncollected = inScope.filter(
    (p) => p.direction === 'inbound' && p.statusBucket === 'overdue',
  );

  const months = monthsInRange(filters.dateFrom, filters.dateTo);
  const monthly = months.map((mn) => {
    const inMonth = inScope.filter((p) => {
      const ts = parseDdMmYyyy(p.dueDate);
      if (!ts) return false;
      const d = new Date(ts);
      return d.getFullYear() === mn.y && d.getMonth() === mn.m;
    });
    let income = 0;
    let expense = 0;
    for (const p of inMonth) {
      if (p.direction === 'inbound') income += p.amount;
      else expense += p.amount;
    }
    return {
      key: mn.key,
      label: mn.label,
      income,
      expense,
      balance: income - expense,
    };
  });

  const totalAssets = Math.max(1, assetIds.size + projectIds.size);
  return {
    totals: {
      projects: projectIds.size,
      assets: assetIds.size,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      avgIncomePerAsset: Math.round(totalIncome / totalAssets),
      avgBalancePerAsset: Math.round((totalIncome - totalExpense) / totalAssets),
    },
    topIncome,
    topExpense,
    expenseByCategory,
    incomeByCategory,
    late,
    uncollected,
    monthly,
  };
}

// ─── Saved reports (seed) ────────────────────────────────────────────────────

export const MOCK_SAVED_REPORTS: SavedReport[] = [
  {
    id: 'sr1',
    name: 'דוח פיננסי חודשי — מגדלי הים',
    savedAt: '01/04/2026',
    filters: {
      dateFrom: '01/03/2026',
      dateTo: '31/03/2026',
      reportType: 'financial',
      entityIds: ['p1'],
    },
    autoConfig: {
      enabled: true,
      frequency: 'monthly',
      recipients: ['manager@knocknock.co.il', 'cfo@knocknock.co.il'],
      emailSubject: 'דו"ח פיננסי חודשי — מגדלי הים',
      emailBody:
        'שלום,\n\nמצורף הדו"ח החודשי עבור פרויקט מגדלי הים.\n\nבברכה,\nצוות knock-knock',
    },
  },
  {
    id: 'sr2',
    name: 'תחזוקה רבעונית — כל הנכסים',
    savedAt: '15/03/2026',
    filters: {
      dateFrom: '01/01/2026',
      dateTo: '31/03/2026',
      reportType: 'maintenance',
      entityIds: [],
    },
    autoConfig: {
      enabled: false,
      frequency: 'quarterly',
      recipients: ['manager@knocknock.co.il'],
      emailSubject: 'דו"ח תחזוקה רבעוני',
      emailBody: DEFAULT_AUTO_CONFIG.emailBody,
    },
  },
  {
    id: 'sr3',
    name: 'הוצאות תחזוקה — דירה 4B',
    savedAt: '20/02/2026',
    filters: {
      dateFrom: '',
      dateTo: '',
      reportType: 'maintenance',
      entityIds: ['a1'],
    },
    autoConfig: { ...DEFAULT_AUTO_CONFIG },
  },
];

// ─── Default initial filters ─────────────────────────────────────────────────

export function makeInitialFilters(): ReportFilters {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    dateFrom: toDdMmYyyy(sixMonthsAgo),
    dateTo: toDdMmYyyy(now),
    reportType: 'financial',
    entityIds: [],
  };
}

// ─── Re-export helpers used in the UI ────────────────────────────────────────

// PaymentListRow type re-export (so screens can import from one place)
export type { PaymentListRow, TaskListRow };
