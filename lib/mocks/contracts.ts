/** Mock data + types for Contracts module UI (no backend). */

/** ערך כללי לשיוך ישות — משותף לכל מודולי המוק */
export type LinkKind = 'asset' | 'project';

/** ערך שיוך ספציפי לחוזים — תואם לבקאנד */
export type ContractLinkKind = 'PROJECT' | 'PROPERTY';

export type ContractTypeKey = 'RENT' | 'PURCHASE' | 'SUPPLIER_WORK' | 'OTHER';

export const CONTRACT_TYPE_LABELS: Record<ContractTypeKey, string> = {
  RENT: 'שכירות',
  PURCHASE: 'רכישה',
  SUPPLIER_WORK: 'הסכם עבודה עם ספק',
  OTHER: 'אחר',
};

/** הרשאות גישה לחוזה / לקבצים בהעלאה (אותו מפתח לשני השימושים ב־UI) */
export type ContractAccessLevel = 'OWNER_ONLY' | 'TENANT_ONLY' | 'EMPLOYEE_ONLY' | 'PUBLIC';

export const CONTRACT_ACCESS_LABELS: Record<ContractAccessLevel, string> = {
  OWNER_ONLY: 'פרטי (בעל הנכס בלבד)',
  TENANT_ONLY: 'שוכר בלבד (שוכר ובעל הנכס)',
  EMPLOYEE_ONLY: 'עובד בלבד (עובד ובעל הנכס)',
  PUBLIC: 'ציבורי',
};

export type ContractStatusKey = 'ACTIVE' | 'EXPIRED' | 'DRAFT';

export const CONTRACT_STATUS_LABELS: Record<ContractStatusKey, string> = {
  ACTIVE: 'פעיל',
  EXPIRED: 'פג תוקף',
  DRAFT: 'טיוטה',
};

/** שורה ברשימת החוזים */
export type ContractListRow = {
  id: string;
  contractName: string;
  contractType: ContractTypeKey;
  linkKind: ContractLinkKind;
  linkId: string;
  linkLabel: string;
  counterpartyName: string;
  agreementDate: string;
  status: ContractStatusKey;
};

/** ישות לשיוך (נכס / פרויקט) — השלמה אוטומטית */
export type EntityLinkOption = {
  id: string;
  kind: LinkKind;
  name: string;
  address: string;
};

export function entitySearchText(e: EntityLinkOption): string {
  return `${e.name} ${e.address}`.toLowerCase();
}

export const MOCK_ENTITY_LINKS: EntityLinkOption[] = [
  { id: 'p1', kind: 'project', name: 'מגדלי הים', address: 'הרצל 10, תל אביב' },
  { id: 'p2', kind: 'project', name: 'גני הדר', address: 'ביאליק 3, רמת גן' },
  { id: 'a1', kind: 'asset', name: 'דירה 4B', address: 'הרצל 10, תל אביב' },
  { id: 'a2', kind: 'asset', name: 'דירה 7A', address: 'הרצל 10, תל אביב' },
  { id: 'a3', kind: 'asset', name: 'משרד 201', address: 'ביאליק 3, רמת גן' },
  { id: 'a4', kind: 'asset', name: 'בית פרטי', address: 'הנרי דנאה 3, נהריה' },
  { id: 'a5', kind: 'asset', name: 'חנות קרקע', address: 'דיזנגוף 120, תל אביב' },
];

const MOCK_CONTRACTS_LIST: ContractListRow[] = [
  {
    id: 'c1',
    contractName: 'חוזה שכירות — דירה 4B',
    contractType: 'RENT',
    linkKind: 'PROPERTY',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    counterpartyName: 'יוסי כהן',
    agreementDate: '01/01/2024',
    status: 'ACTIVE',
  },
  {
    id: 'c2',
    contractName: 'חוזה משרד 201',
    contractType: 'RENT',
    linkKind: 'PROPERTY',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    counterpartyName: 'מיכל לוי',
    agreementDate: '01/03/2024',
    status: 'ACTIVE',
  },
  {
    id: 'c3',
    contractName: 'רכישת מערכת מיזוג',
    contractType: 'PURCHASE',
    linkKind: 'PROJECT',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    counterpartyName: 'חברת קור בע"מ',
    agreementDate: '15/06/2025',
    status: 'DRAFT',
  },
  {
    id: 'c4',
    contractName: 'הסכם תחזוקה שוטפת',
    contractType: 'SUPPLIER_WORK',
    linkKind: 'PROJECT',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    counterpartyName: 'אינסטלציה דן',
    agreementDate: '01/01/2025',
    status: 'ACTIVE',
  },
  {
    id: 'c5',
    contractName: 'הסכם כללי — בית פרטי',
    contractType: 'OTHER',
    linkKind: 'PROPERTY',
    linkId: 'a4',
    linkLabel: 'בית פרטי',
    counterpartyName: 'דוד גל',
    agreementDate: '01/06/2023',
    status: 'EXPIRED',
  },
  {
    id: 'c6',
    contractName: 'שכירות חנות',
    contractType: 'RENT',
    linkKind: 'PROPERTY',
    linkId: 'a5',
    linkLabel: 'חנות קרקע',
    counterpartyName: 'שירותים לוגיסטיים בע"מ',
    agreementDate: '10/02/2024',
    status: 'ACTIVE',
  },
];

export type LinkScopeFilter = 'all' | 'PROPERTY' | 'PROJECT';

export type ContractTypeFilter = 'all' | ContractTypeKey;

function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

/** תאריך הסכם בפורמט DD/MM/YYYY בתוך טווח (מ–עד), ריקים מתעלמים */
function agreementDateInRange(agreementDate: string, from: string, to: string): boolean {
  const t = parseDdMmYyyy(agreementDate);
  if (!t) return true;
  if (from.trim()) {
    const f = parseDdMmYyyy(from);
    if (f && t < f) return false;
  }
  if (to.trim()) {
    const toT = parseDdMmYyyy(to);
    if (toT && t > toT) return false;
  }
  return true;
}

export function filterContractRows(
  rows: ContractListRow[],
  opts: {
    search: string;
    linkScope: LinkScopeFilter;
    typeFilter: ContractTypeFilter;
    entityId: string | null;
    /** תאריך הסכם מתוך—בפורמט DD/MM/YYYY */
    dateFrom?: string;
    /** תאריך הסכם עד—בפורמט DD/MM/YYYY */
    dateTo?: string;
  },
): ContractListRow[] {
  const q = opts.search.trim().toLowerCase();
  const from = opts.dateFrom ?? '';
  const to = opts.dateTo ?? '';
  return rows.filter((r) => {
    if (opts.linkScope === 'PROPERTY' && r.linkKind !== 'PROPERTY') return false;
    if (opts.linkScope === 'PROJECT' && r.linkKind !== 'PROJECT') return false;
    if (opts.typeFilter !== 'all' && r.contractType !== opts.typeFilter) return false;
    if (opts.entityId && r.linkId !== opts.entityId) return false;
    if (!agreementDateInRange(r.agreementDate, from, to)) return false;
    if (!q) return true;
    const hay = `${r.contractName} ${r.counterpartyName} ${r.linkLabel} ${CONTRACT_TYPE_LABELS[r.contractType]}`.toLowerCase();
    return hay.includes(q);
  });
}

export type ContractSortKey =
  | 'contractName'
  | 'contractType'
  | 'linkLabel'
  | 'counterpartyName'
  | 'agreementDate'
  | 'status';

export type SortDir = 'asc' | 'desc';

export function sortContractRows(
  rows: ContractListRow[],
  key: ContractSortKey,
  dir: SortDir,
): ContractListRow[] {
  const mult = dir === 'asc' ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    let va: string | number = '';
    let vb: string | number = '';
    switch (key) {
      case 'contractName':
        va = a.contractName;
        vb = b.contractName;
        break;
      case 'contractType':
        va = CONTRACT_TYPE_LABELS[a.contractType];
        vb = CONTRACT_TYPE_LABELS[b.contractType];
        break;
      case 'linkLabel':
        va = a.linkLabel;
        vb = b.linkLabel;
        break;
      case 'counterpartyName':
        va = a.counterpartyName;
        vb = b.counterpartyName;
        break;
      case 'agreementDate':
        va = parseDdMmYyyy(a.agreementDate);
        vb = parseDdMmYyyy(b.agreementDate);
        break;
      case 'status':
        va = CONTRACT_STATUS_LABELS[a.status];
        vb = CONTRACT_STATUS_LABELS[b.status];
        break;
      default:
        break;
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * mult;
    }
    return String(va).localeCompare(String(vb), 'he') * mult;
  });
  return copy;
}

/** פירוט חוזה למסך פרטים (mock לפי id) */
export type ContractPaymentMock = {
  id: string;
  direction: 'IN' | 'OUT';
  categoryLabel: string;
  amount: string;
  date: string;
  notes: string;
};

export type ContractMeterMock = {
  id: string;
  kind: 'ELECTRIC' | 'WATER' | 'GAS' | 'OTHER';
  name: string;
  identifier: string;
  value: string;
};

export type ContractFileMock = {
  id: string;
  category: string;
  displayName: string;
  type: 'image' | 'pdf';
  previewUri?: string;
};

export const METER_KIND_LABELS: Record<ContractMeterMock['kind'], string> = {
  ELECTRIC: 'חשמל',
  WATER: 'מים',
  GAS: 'גז',
  OTHER: 'אחר',
};

export const METER_KIND_ICONS: Record<ContractMeterMock['kind'], string> = {
  ELECTRIC: 'lightning-bolt',
  WATER: 'water',
  GAS: 'fire',
  OTHER: 'gauge',
};

export type ContractDetailMock = ContractListRow & {
  monthlyAmount?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  endDate?: string;
  accessLevel?: ContractAccessLevel;
  payments: ContractPaymentMock[];
  meters: ContractMeterMock[];
  files: ContractFileMock[];
};

function getContractDetailMock(id: string): ContractDetailMock | null {
  const row = MOCK_CONTRACTS_LIST.find((r) => r.id === id);
  if (!row) return null;

  const baseFiles: ContractFileMock[] = [
    {
      id: 'f1',
      category: 'צילום חוזה',
      displayName: 'חוזה חתום.pdf',
      type: 'pdf',
    },
  ];

  const extras: Partial<ContractDetailMock> =
    row.id === 'c1'
      ? {
          monthlyAmount: '₪7,200',
          idNumber: '123456782',
          phone: '050-1234567',
          email: 'yossi@example.com',
          contactName: 'יוסי כהן',
          endDate: '31/12/2025',
          accessLevel: 'TENANT_ONLY',
          payments: [
            { id: 'p1', direction: 'IN', categoryLabel: 'שכירות', amount: '₪7,200', date: '01/01/2025', notes: 'ינואר 2025' },
            { id: 'p2', direction: 'IN', categoryLabel: 'שכירות', amount: '₪7,200', date: '01/02/2025', notes: 'פברואר 2025' },
            { id: 'p3', direction: 'OUT', categoryLabel: 'תחזוקה', amount: '₪450', date: '15/01/2025', notes: 'תיקון מזגן' },
          ],
          meters: [
            { id: 'm1', kind: 'ELECTRIC', name: 'חשמל ראשי', identifier: '12345678', value: '1,234 קוט"ש' },
            { id: 'm2', kind: 'WATER', name: 'מים', identifier: '87654321', value: '98 מ"ק' },
          ],
          files: [
            ...baseFiles,
            { id: 'f2', category: 'תיעוד הנכס', displayName: 'תמונת כניסה.jpg', type: 'image', previewUri: 'https://picsum.photos/seed/apt1/200/160' },
            { id: 'f3', category: 'תיעוד הנכס', displayName: 'סלון.jpg', type: 'image', previewUri: 'https://picsum.photos/seed/apt2/200/160' },
            { id: 'f4', category: 'צילום תעודת זהות', displayName: 'תז שוכר.jpg', type: 'image', previewUri: 'https://picsum.photos/seed/id1/200/160' },
          ],
        }
      : row.id === 'c2'
        ? {
            monthlyAmount: '₪12,000',
            idNumber: '987654321',
            phone: '052-9876543',
            email: 'michal@example.com',
            contactName: 'מיכל לוי',
            endDate: '28/02/2026',
            accessLevel: 'OWNER_ONLY',
            payments: [
              { id: 'p1', direction: 'IN', categoryLabel: 'שכירות', amount: '₪12,000', date: '01/03/2025', notes: 'מרץ 2025' },
              { id: 'p2', direction: 'OUT', categoryLabel: 'ניהול', amount: '₪800', date: '01/03/2025', notes: 'דמי ניהול' },
            ],
            meters: [
              { id: 'm1', kind: 'ELECTRIC', name: 'חשמל', identifier: '22334455', value: '2,100 קוט"ש' },
            ],
            files: [
              ...baseFiles,
              { id: 'f2', category: 'תיעוד הנכס', displayName: 'כניסה למשרד.jpg', type: 'image', previewUri: 'https://picsum.photos/seed/office1/200/160' },
            ],
          }
        : {
            monthlyAmount: '—',
            idNumber: '—',
            phone: '—',
            email: '—',
            contactName: row.counterpartyName,
            endDate: '—',
            accessLevel: 'PUBLIC',
            payments: [],
            meters: [],
            files: baseFiles,
          };
  return { ...row, payments: [], meters: [], files: [], ...extras };
}

export function filterEntitiesByQuery(query: string): EntityLinkOption[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return MOCK_ENTITY_LINKS.slice(0, 8);
  return MOCK_ENTITY_LINKS.filter((e) => entitySearchText(e).includes(q)).slice(0, 12);
}
