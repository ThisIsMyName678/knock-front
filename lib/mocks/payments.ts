/** Mock data + types for Payments module (no backend). */

import type { LinkKind } from '@/lib/mocks/contracts';

export type PaymentDirection = 'inbound' | 'outbound';

/** סוג תשלום מלא (רשימת האיפיון). */
export type PaymentTypeKey =
  | 'rent'
  | 'bills'
  | 'arnona'
  | 'meters'
  | 'guarantees'
  | 'maintenance'
  | 'insurance'
  | 'marketing'
  | 'suppliers'
  | 'planning'
  | 'severance'
  | 'other';

export const PAYMENT_TYPE_LABELS: Record<PaymentTypeKey, string> = {
  rent: 'שכירות',
  bills: 'חשבונות',
  arnona: 'ארנונה',
  meters: 'מונים',
  guarantees: 'ערבויות ובטחונות',
  maintenance: 'תחזוקה',
  insurance: 'ביטוח',
  marketing: 'פרסום ושיווק',
  suppliers: 'ספקים',
  planning: 'תכנון וייעוץ',
  severance: 'פיצויים',
  other: 'אחר',
};

/** קיבוץ לסינון ראש הדף */
export type PaymentListGroupFilter = 'all' | 'rent' | 'bills' | 'maintenance' | 'guarantees';

export function paymentMatchesGroupFilter(
  type: PaymentTypeKey,
  filter: PaymentListGroupFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'rent') return type === 'rent';
  if (filter === 'bills') return type === 'bills' || type === 'arnona' || type === 'meters';
  if (filter === 'maintenance') return type === 'maintenance';
  if (filter === 'guarantees') return type === 'guarantees';
  return true;
}

export type PaymentModeKey = 'full' | 'recurring' | 'installments' | 'shafif_plus';

export const PAYMENT_MODE_LABELS: Record<PaymentModeKey, string> = {
  full: 'מלא',
  recurring: 'מחזורי',
  installments: 'תשלומים',
  shafif_plus: 'שוטף+',
};

export type StatusBucket = 'future' | 'received' | 'overdue';

export type PaymentListRow = {
  id: string;
  displayName: string;
  paymentType: PaymentTypeKey;
  mode: PaymentModeKey;
  indexed: boolean;
  linkKind: LinkKind;
  linkId: string;
  linkLabel: string;
  dueDate: string;
  statusBucket: StatusBucket;
  amount: number;
  direction: PaymentDirection;
  progressLabel: string;
};

export type MaintenanceCallMock = {
  id: string;
  linkId: string;
  title: string;
  date: string;
};

export type ContractForPaymentMock = {
  id: string;
  label: string;
  linkAssetId: string | null;
  linkProjectId: string | null;
};

/** ישויות לשיוך (העתקת מזהים תואמים ל-contracts mock). */
export const PAYMENT_ENTITY_OPTIONS: { id: string; kind: LinkKind; name: string; address: string }[] = [
  { id: 'p1', kind: 'project', name: 'מגדלי הים', address: 'הרצל 10, תל אביב' },
  { id: 'p2', kind: 'project', name: 'גני הדר', address: 'ביאליק 3, רמת גן' },
  { id: 'a1', kind: 'asset', name: 'דירה 4B', address: 'הרצל 10, תל אביב' },
  { id: 'a2', kind: 'asset', name: 'דירה 7A', address: 'הרצל 10, תל אביב' },
  { id: 'a3', kind: 'asset', name: 'משרד 201', address: 'ביאליק 3, רמת גן' },
  { id: 'a4', kind: 'asset', name: 'בית פרטי', address: 'הנרי דנאה 3, נהריה' },
];

export const MOCK_MAINTENANCE_CALLS: MaintenanceCallMock[] = [
  { id: 'm1', linkId: 'a1', title: 'נזילה בחדר רחצה', date: '02/04/2026' },
  { id: 'm2', linkId: 'a1', title: 'בדיקת לוח חשמל', date: '28/03/2026' },
  { id: 'm3', linkId: 'a3', title: 'צביעת משרד', date: '10/04/2026' },
  { id: 'm4', linkId: 'p1', title: 'ניקיון חדר משותף', date: '05/04/2026' },
];

export const MOCK_CONTRACTS_FOR_PAYMENT: ContractForPaymentMock[] = [
  { id: 'c1', label: 'חוזה שכירות — דירה 4B', linkAssetId: 'a1', linkProjectId: null },
  { id: 'c2', label: 'חוזה משרד 201', linkAssetId: 'a3', linkProjectId: null },
  { id: 'c3', label: 'הסכם תחזוקה — מגדלי הים', linkAssetId: null, linkProjectId: 'p1' },
];

export function contractsForLink(linkId: string | null, linkKind: LinkKind | null): ContractForPaymentMock[] {
  if (!linkId || !linkKind) return MOCK_CONTRACTS_FOR_PAYMENT;
  return MOCK_CONTRACTS_FOR_PAYMENT.filter((c) =>
    linkKind === 'asset' ? c.linkAssetId === linkId : c.linkProjectId === linkId,
  );
}

export function maintenanceCallsForLink(linkId: string | null): MaintenanceCallMock[] {
  if (!linkId) return [];
  return MOCK_MAINTENANCE_CALLS.filter((m) => m.linkId === linkId);
}

export const MOCK_PAYMENTS_LIST: PaymentListRow[] = [
  {
    id: 'pay1',
    displayName: 'שכירות אפריל',
    paymentType: 'rent',
    mode: 'full',
    indexed: false,
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    dueDate: '01/05/2026',
    statusBucket: 'future',
    amount: 7200,
    direction: 'inbound',
    progressLabel: '1 מתוך 12',
  },
  {
    id: 'pay2',
    displayName: 'תשלום תחזוקה — נזילה',
    paymentType: 'maintenance',
    mode: 'full',
    indexed: false,
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    dueDate: '15/04/2026',
    statusBucket: 'received',
    amount: 850,
    direction: 'outbound',
    progressLabel: '—',
  },
  {
    id: 'pay3',
    displayName: 'חשמל חודשי',
    paymentType: 'bills',
    mode: 'recurring',
    indexed: true,
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    dueDate: '10/03/2026',
    statusBucket: 'overdue',
    amount: 420,
    direction: 'outbound',
    progressLabel: '3,000 מתוך 10,000',
  },
  {
    id: 'pay4',
    displayName: 'ארנונה רבעון',
    paymentType: 'arnona',
    mode: 'installments',
    indexed: false,
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    dueDate: '01/04/2026',
    statusBucket: 'received',
    amount: 12000,
    direction: 'outbound',
    progressLabel: '2 מתוך 4',
  },
  {
    id: 'pay5',
    displayName: 'ביטוח מבנה',
    paymentType: 'insurance',
    mode: 'full',
    indexed: false,
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    dueDate: '20/06/2026',
    statusBucket: 'future',
    amount: 5400,
    direction: 'outbound',
    progressLabel: '—',
  },
  {
    id: 'pay6',
    displayName: 'ערבות בנקאית',
    paymentType: 'guarantees',
    mode: 'full',
    indexed: false,
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    dueDate: '01/01/2025',
    statusBucket: 'received',
    amount: 24000,
    direction: 'inbound',
    progressLabel: '—',
  },
  {
    id: 'pay7',
    displayName: 'שיווק דירה',
    paymentType: 'marketing',
    mode: 'shafif_plus',
    indexed: false,
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    dueDate: '25/04/2026',
    statusBucket: 'future',
    amount: 3000,
    direction: 'outbound',
    progressLabel: 'שוטף+ 45 יום',
  },
  {
    id: 'pay8',
    displayName: 'פיצוי עובד',
    paymentType: 'severance',
    mode: 'full',
    indexed: false,
    linkKind: 'asset',
    linkId: 'a4',
    linkLabel: 'בית פרטי',
    dueDate: '12/02/2026',
    statusBucket: 'overdue',
    amount: 18000,
    direction: 'outbound',
    progressLabel: '—',
  },
];

const deletedPaymentIds = new Set<string>();

/** מחיקה מקומית לתצוגה (ללא backend) — נשמרת במהלך הסשן. */
export function deletePaymentFromSession(id: string): void {
  deletedPaymentIds.add(id);
}

export function getActivePaymentsList(): PaymentListRow[] {
  return MOCK_PAYMENTS_LIST.filter((p) => !deletedPaymentIds.has(p.id));
}

export type PaymentSortKey =
  | 'displayName'
  | 'paymentType'
  | 'mode'
  | 'indexed'
  | 'linkLabel'
  | 'dueDate'
  | 'progressLabel'
  | 'amount';

export type SortDir = 'asc' | 'desc';

function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

export function filterPaymentRows(
  rows: PaymentListRow[],
  opts: {
    search: string;
    linkScope: 'all' | LinkKind;
    entityId: string | null;
    groupFilter: PaymentListGroupFilter;
    statusTab: StatusBucket | 'all';
    dateFrom: string;
    dateTo: string;
    /** כשמוגדר (למשל מהדשבורד), מסתיר תשלומים בסטטוס התקבל */
    excludeReceived?: boolean;
  },
): PaymentListRow[] {
  const q = opts.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (opts.linkScope !== 'all' && r.linkKind !== opts.linkScope) return false;
    if (opts.entityId && r.linkId !== opts.entityId) return false;
    if (!paymentMatchesGroupFilter(r.paymentType, opts.groupFilter)) return false;
    if (opts.excludeReceived && r.statusBucket === 'received') return false;
    if (opts.statusTab !== 'all' && r.statusBucket !== opts.statusTab) return false;
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
    const hay = `${r.displayName} ${PAYMENT_TYPE_LABELS[r.paymentType]} ${r.linkLabel} ${PAYMENT_MODE_LABELS[r.mode]}`.toLowerCase();
    return hay.includes(q);
  });
}

export function sortPaymentRows(rows: PaymentListRow[], key: PaymentSortKey, dir: SortDir): PaymentListRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    let va: string | number = 0;
    let vb: string | number = 0;
    switch (key) {
      case 'displayName':
        va = a.displayName;
        vb = b.displayName;
        break;
      case 'paymentType':
        va = PAYMENT_TYPE_LABELS[a.paymentType];
        vb = PAYMENT_TYPE_LABELS[b.paymentType];
        break;
      case 'mode':
        va = PAYMENT_MODE_LABELS[a.mode];
        vb = PAYMENT_MODE_LABELS[b.mode];
        break;
      case 'indexed':
        va = a.indexed ? 1 : 0;
        vb = b.indexed ? 1 : 0;
        break;
      case 'linkLabel':
        va = a.linkLabel;
        vb = b.linkLabel;
        break;
      case 'dueDate':
        va = parseDdMmYyyy(a.dueDate);
        vb = parseDdMmYyyy(b.dueDate);
        break;
      case 'progressLabel':
        va = a.progressLabel;
        vb = b.progressLabel;
        break;
      case 'amount':
        va = a.amount;
        vb = b.amount;
        break;
      default:
        break;
    }
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult;
    return String(va).localeCompare(String(vb), 'he') * mult;
  });
  return copy;
}

export type PaymentDetailMock = PaymentListRow & {
  payerLabel?: string;
  vatPercent?: string;
  amountNet?: number;
  amountGross?: number;
  means?: string;
  paymentMethodKey?: string;
  contractLabel?: string;
};

export function getPaymentDetailMock(id: string): PaymentDetailMock | null {
  const row = MOCK_PAYMENTS_LIST.find((p) => p.id === id);
  if (!row) return null;
  return {
    ...row,
    payerLabel: 'יוסי כהן',
    vatPercent: '18%',
    amountNet: row.direction === 'inbound' ? row.amount : Math.round(row.amount / 1.18),
    amountGross: row.amount,
    means: 'העברה בנקאית',
    contractLabel: row.paymentType === 'rent' ? 'חוזה שכירות — דירה 4B' : undefined,
  };
}

export function filterEntitiesForPaymentQuery(query: string): typeof PAYMENT_ENTITY_OPTIONS {
  const q = query.trim().toLowerCase();
  if (!q) return PAYMENT_ENTITY_OPTIONS;
  return PAYMENT_ENTITY_OPTIONS.filter((e) => `${e.name} ${e.address}`.toLowerCase().includes(q));
}
