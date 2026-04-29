/** Mock data + types for Contracts module UI (no backend). */

export type LinkKind = 'asset' | 'project';

export type ContractTypeKey = 'rent' | 'purchase' | 'supplier_work' | 'other';

export const CONTRACT_TYPE_LABELS: Record<ContractTypeKey, string> = {
  rent: 'שכירות',
  purchase: 'רכישה',
  supplier_work: 'הסכם עבודה עם ספק',
  other: 'אחר',
};

/** הרשאות גישה לחוזה / לקבצים בהעלאה (אותו מפתח לשני השימושים ב־UI) */
export type ContractAccessLevel = 'owner_only' | 'tenant_only' | 'employee_only' | 'public';

export const CONTRACT_ACCESS_LABELS: Record<ContractAccessLevel, string> = {
  owner_only: 'פרטי (בעל הנכס בלבד)',
  tenant_only: 'שוכר בלבד (שוכר ובעל הנכס)',
  employee_only: 'עובד בלבד (עובד ובעל הנכס)',
  public: 'ציבורי',
};

export type ContractStatusKey = 'active' | 'expired' | 'draft';

export const CONTRACT_STATUS_LABELS: Record<ContractStatusKey, string> = {
  active: 'פעיל',
  expired: 'פג תוקף',
  draft: 'טיוטה',
};

/** שורה ברשימת החוזים */
export type ContractListRow = {
  id: string;
  contractName: string;
  contractType: ContractTypeKey;
  linkKind: LinkKind;
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

export const MOCK_CONTRACTS_LIST: ContractListRow[] = [
  {
    id: 'c1',
    contractName: 'חוזה שכירות — דירה 4B',
    contractType: 'rent',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    counterpartyName: 'יוסי כהן',
    agreementDate: '01/01/2024',
    status: 'active',
  },
  {
    id: 'c2',
    contractName: 'חוזה משרד 201',
    contractType: 'rent',
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    counterpartyName: 'מיכל לוי',
    agreementDate: '01/03/2024',
    status: 'active',
  },
  {
    id: 'c3',
    contractName: 'רכישת מערכת מיזוג',
    contractType: 'purchase',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    counterpartyName: 'חברת קור בע"מ',
    agreementDate: '15/06/2025',
    status: 'draft',
  },
  {
    id: 'c4',
    contractName: 'הסכם תחזוקה שוטפת',
    contractType: 'supplier_work',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    counterpartyName: 'אינסטלציה דן',
    agreementDate: '01/01/2025',
    status: 'active',
  },
  {
    id: 'c5',
    contractName: 'הסכם כללי — בית פרטי',
    contractType: 'other',
    linkKind: 'asset',
    linkId: 'a4',
    linkLabel: 'בית פרטי',
    counterpartyName: 'דוד גל',
    agreementDate: '01/06/2023',
    status: 'expired',
  },
  {
    id: 'c6',
    contractName: 'שכירות חנות',
    contractType: 'rent',
    linkKind: 'asset',
    linkId: 'a5',
    linkLabel: 'חנות קרקע',
    counterpartyName: 'שירותים לוגיסטיים בע"מ',
    agreementDate: '10/02/2024',
    status: 'active',
  },
];

export type LinkScopeFilter = 'all' | 'asset' | 'project';

export type ContractTypeFilter = 'all' | ContractTypeKey;

function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

export function filterContractRows(
  rows: ContractListRow[],
  opts: {
    search: string;
    linkScope: LinkScopeFilter;
    typeFilter: ContractTypeFilter;
    entityId: string | null;
  },
): ContractListRow[] {
  const q = opts.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (opts.linkScope === 'asset' && r.linkKind !== 'asset') return false;
    if (opts.linkScope === 'project' && r.linkKind !== 'project') return false;
    if (opts.typeFilter !== 'all' && r.contractType !== opts.typeFilter) return false;
    if (opts.entityId && r.linkId !== opts.entityId) return false;
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
  direction: 'in' | 'out';
  categoryLabel: string;
  amount: string;
  date: string;
  notes: string;
};

export type ContractMeterMock = {
  id: string;
  kind: 'electric' | 'water' | 'gas' | 'other';
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
  electric: 'חשמל',
  water: 'מים',
  gas: 'גז',
  other: 'אחר',
};

export const METER_KIND_ICONS: Record<ContractMeterMock['kind'], string> = {
  electric: 'lightning-bolt',
  water: 'water',
  gas: 'fire',
  other: 'gauge',
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

export function getContractDetailMock(id: string): ContractDetailMock | null {
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
          accessLevel: 'tenant_only',
          payments: [
            { id: 'p1', direction: 'in', categoryLabel: 'שכירות', amount: '₪7,200', date: '01/01/2025', notes: 'ינואר 2025' },
            { id: 'p2', direction: 'in', categoryLabel: 'שכירות', amount: '₪7,200', date: '01/02/2025', notes: 'פברואר 2025' },
            { id: 'p3', direction: 'out', categoryLabel: 'תחזוקה', amount: '₪450', date: '15/01/2025', notes: 'תיקון מזגן' },
          ],
          meters: [
            { id: 'm1', kind: 'electric', name: 'חשמל ראשי', identifier: '12345678', value: '1,234 קוט"ש' },
            { id: 'm2', kind: 'water', name: 'מים', identifier: '87654321', value: '98 מ"ק' },
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
            accessLevel: 'owner_only',
            payments: [
              { id: 'p1', direction: 'in', categoryLabel: 'שכירות', amount: '₪12,000', date: '01/03/2025', notes: 'מרץ 2025' },
              { id: 'p2', direction: 'out', categoryLabel: 'ניהול', amount: '₪800', date: '01/03/2025', notes: 'דמי ניהול' },
            ],
            meters: [
              { id: 'm1', kind: 'electric', name: 'חשמל', identifier: '22334455', value: '2,100 קוט"ש' },
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
            accessLevel: 'public',
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
