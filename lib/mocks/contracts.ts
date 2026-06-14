/** Mock data + types for Contracts module UI (no backend). */

/** ערך כללי לשיוך ישות — משותף לכל מודולי המוק */
export type LinkKind = 'asset' | 'project';

/** ישות לשיוך (נכס / פרויקט) — השלמה אוטומטית */
export type EntityLinkOption = {
  id: string;
  kind: LinkKind;
  name: string;
  address: string;
};

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


export function filterEntitiesByQuery(query: string): EntityLinkOption[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return MOCK_ENTITY_LINKS.slice(0, 8);
  return MOCK_ENTITY_LINKS.filter((e) => entitySearchText(e).includes(q)).slice(0, 12);
}
