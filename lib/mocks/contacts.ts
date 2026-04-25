/**
 * Mock contacts module — types, permissions, phone helpers (no backend).
 */

import type { LinkKind } from '@/lib/mocks/contracts';
import type { EntityLinkOption } from '@/lib/mocks/contracts';
import { MOCK_ENTITY_LINKS } from '@/lib/mocks/contracts';

export type ContactKind = 'role_holder' | 'tenant_buyer';

export const CONTACT_KIND_LABELS: Record<ContactKind, string> = {
  role_holder: 'בעל תפקיד',
  tenant_buyer: 'שוכר / רוכש',
};

/** מפתחות מודולים להרשאות (mock) */
export type PermissionModuleKey =
  | 'maintenance'
  | 'payments'
  | 'contracts'
  | 'documents'
  | 'tasks'
  | 'contacts'
  | 'assets'
  | 'projects';

export type PermissionActionKey = 'view' | 'create' | 'edit' | 'delete';

export const PERMISSION_ACTION_LABELS: Record<PermissionActionKey, string> = {
  view: 'צפייה',
  create: 'הוספה',
  edit: 'עריכה',
  delete: 'מחיקה',
};

export const MODULE_LABELS: Record<PermissionModuleKey, string> = {
  maintenance: 'תחזוקה וקריאות',
  payments: 'תשלומים',
  contracts: 'חוזים',
  documents: 'מסמכים',
  tasks: 'משימות',
  contacts: 'אנשי קשר',
  assets: 'נכסים',
  projects: 'פרויקטים',
};

export const ALL_MODULE_KEYS: PermissionModuleKey[] = [
  'maintenance',
  'payments',
  'contracts',
  'documents',
  'tasks',
  'contacts',
  'assets',
  'projects',
];

export type ModulePermissions = Record<PermissionActionKey, boolean>;

export type ContactPermissions = Record<PermissionModuleKey, ModulePermissions>;

function emptyModulePermissions(): ModulePermissions {
  return { view: false, create: false, edit: false, delete: false };
}

export function emptyPermissions(): ContactPermissions {
  return ALL_MODULE_KEYS.reduce((acc, m) => {
    acc[m] = emptyModulePermissions();
    return acc;
  }, {} as ContactPermissions);
}

export function defaultTenantPermissions(): ContactPermissions {
  const p = emptyPermissions();
  p.maintenance = { view: true, create: true, edit: false, delete: false };
  p.documents = { view: true, create: false, edit: false, delete: false };
  p.tasks = { view: true, create: false, edit: false, delete: false };
  return p;
}

export function defaultRolePermissions(): ContactPermissions {
  const p = emptyPermissions();
  p.payments = { view: true, create: false, edit: false, delete: false };
  p.documents = { view: true, create: true, edit: true, delete: false };
  p.tasks = { view: true, create: true, edit: true, delete: false };
  return p;
}

/** נכסים השייכים לפרויקט (mock סטטי) */
const PROJECT_ASSET_IDS: Record<string, string[]> = {
  p1: ['a1', 'a2'],
  p2: ['a3'],
};

export function assetsUnderProject(projectId: string): EntityLinkOption[] {
  const ids = PROJECT_ASSET_IDS[projectId];
  if (!ids) return [];
  return MOCK_ENTITY_LINKS.filter((e) => e.kind === 'asset' && ids.includes(e.id));
}

/** מרחיב הרשאות פרויקט לכל נכסי הפרויקט (אותה מטריצה לכל נכס) */
export function expandPermissionsToProjectAssets(
  projectId: string,
  permissions: ContactPermissions,
): Record<string, ContactPermissions> {
  const out: Record<string, ContactPermissions> = {};
  const clone = JSON.parse(JSON.stringify(permissions)) as ContactPermissions;
  for (const a of assetsUnderProject(projectId)) {
    out[a.id] = JSON.parse(JSON.stringify(clone)) as ContactPermissions;
  }
  return out;
}

export type ContactListRow = {
  id: string;
  contactKind: ContactKind;
  nickname: string;
  displayName: string;
  phone: string;
  email: string;
  notes?: string;
  linkKind: LinkKind;
  linkId: string;
  linkLabel: string;
  hasUserInSystem: boolean;
  inviteToken?: string;
  permissions: ContactPermissions;
  /** מלא אוטומטית כש-linkKind === project (mock) */
  permissionsByAssetId?: Record<string, ContactPermissions>;
};

function perm(
  partial: Partial<Record<PermissionModuleKey, Partial<ModulePermissions>>>,
): ContactPermissions {
  const base = emptyPermissions();
  for (const m of ALL_MODULE_KEYS) {
    const pr = partial[m];
    if (pr) {
      base[m] = { ...base[m], ...pr };
    }
  }
  return base;
}

const BASE: ContactListRow[] = [
  {
    id: 'ct1',
    contactKind: 'tenant_buyer',
    nickname: '',
    displayName: 'יוסי כהן',
    phone: '050-1234567',
    email: 'yossi@example.com',
    notes: 'דייר ראשי',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    hasUserInSystem: true,
    inviteToken: 'inv_ct1',
    permissions: defaultTenantPermissions(),
  },
  {
    id: 'ct2',
    contactKind: 'role_holder',
    nickname: 'מנהלת נכס',
    displayName: 'מיכל לוי',
    phone: '052-9876543',
    email: 'michal@example.com',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    hasUserInSystem: true,
    permissions: perm({
      payments: { view: true, create: true, edit: true, delete: false },
      contracts: { view: true, create: false, edit: true, delete: false },
      documents: { view: true, create: true, edit: true, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      maintenance: { view: true, create: true, edit: true, delete: false },
    }),
    permissionsByAssetId: expandPermissionsToProjectAssets(
      'p1',
      perm({
        payments: { view: true, create: true, edit: true, delete: false },
        contracts: { view: true, create: false, edit: true, delete: false },
        documents: { view: true, create: true, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false },
        maintenance: { view: true, create: true, edit: true, delete: false },
      }),
    ),
  },
  {
    id: 'ct3',
    contactKind: 'role_holder',
    nickname: 'קבלן צבע',
    displayName: 'דוד גל',
    phone: '054-1111222',
    email: 'david@example.com',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    hasUserInSystem: false,
    inviteToken: 'inv_ct3',
    permissions: defaultRolePermissions(),
    permissionsByAssetId: expandPermissionsToProjectAssets('p2', defaultRolePermissions()),
  },
  {
    id: 'ct4',
    contactKind: 'role_holder',
    nickname: 'רואה חשבון',
    displayName: 'שרה אבני',
    phone: '053-2223344',
    email: 'sara@cpa.example.com',
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    hasUserInSystem: false,
    inviteToken: 'inv_ct4',
    permissions: perm({
      payments: { view: true, create: false, edit: false, delete: false },
      documents: { view: true, create: false, edit: false, delete: false },
    }),
  },
  {
    id: 'ct5',
    contactKind: 'tenant_buyer',
    nickname: '',
    displayName: 'רונית בן עמי',
    phone: '050-9988776',
    email: 'ronit@example.com',
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    hasUserInSystem: false,
    permissions: defaultTenantPermissions(),
  },
  {
    id: 'ct6',
    contactKind: 'role_holder',
    nickname: 'עובד תחזוקה',
    displayName: 'אינסטלטור דן',
    phone: '052-4445566',
    email: 'dan@fix.example.com',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    hasUserInSystem: true,
    permissions: perm({
      maintenance: { view: true, create: true, edit: true, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
    }),
  },
  {
    id: 'ct7',
    contactKind: 'role_holder',
    nickname: 'שותף',
    displayName: 'אבי כהן',
    phone: '054-0001111',
    email: 'avi@example.com',
    linkKind: 'asset',
    linkId: 'a4',
    linkLabel: 'בית פרטי',
    hasUserInSystem: false,
    inviteToken: 'inv_ct7',
    permissions: perm({
      projects: { view: true, create: false, edit: false, delete: false },
      assets: { view: true, create: false, edit: false, delete: false },
      payments: { view: true, create: false, edit: false, delete: false },
    }),
  },
  {
    id: 'ct8',
    contactKind: 'role_holder',
    nickname: 'מנהל פרויקט',
    displayName: 'נועה שרון',
    phone: '050-7654321',
    email: 'noa@pm.example.com',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    hasUserInSystem: true,
    permissions: perm({
      tasks: { view: true, create: true, edit: true, delete: true },
      contacts: { view: true, create: true, edit: true, delete: false },
      documents: { view: true, create: true, edit: true, delete: false },
    }),
    permissionsByAssetId: expandPermissionsToProjectAssets(
      'p1',
      perm({
        tasks: { view: true, create: true, edit: true, delete: true },
        contacts: { view: true, create: true, edit: true, delete: false },
        documents: { view: true, create: true, edit: true, delete: false },
      }),
    ),
  },
  {
    id: 'ct9',
    contactKind: 'tenant_buyer',
    nickname: '',
    displayName: 'לקוח דוגמה',
    phone: '052-1112233',
    email: 'buyer@example.com',
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    hasUserInSystem: false,
    permissions: perm({
      maintenance: { view: true, create: false, edit: false, delete: false },
      payments: { view: true, create: false, edit: false, delete: false },
    }),
  },
  {
    id: 'ct10',
    contactKind: 'role_holder',
    nickname: 'אבטחה',
    displayName: 'משה לוי',
    phone: '054-3332211',
    email: 'moshe@sec.example.com',
    linkKind: 'asset',
    linkId: 'a5',
    linkLabel: 'חנות קרקע',
    hasUserInSystem: false,
    inviteToken: 'inv_ct10',
    permissions: perm({ maintenance: { view: true, create: false, edit: false, delete: false }, tasks: { view: true, create: false, edit: false, delete: false } }),
  },
  {
    id: 'ct11',
    contactKind: 'role_holder',
    nickname: 'עורך דין',
    displayName: 'עו״ד רינה גולן',
    phone: '03-5551234',
    email: 'rina@law.example.com',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    hasUserInSystem: true,
    permissions: perm({ contracts: { view: true, create: false, edit: true, delete: false }, documents: { view: true, create: false, edit: false, delete: false } }),
    permissionsByAssetId: expandPermissionsToProjectAssets(
      'p2',
      perm({ contracts: { view: true, create: false, edit: true, delete: false }, documents: { view: true, create: false, edit: false, delete: false } }),
    ),
  },
  {
    id: 'ct12',
    contactKind: 'role_holder',
    nickname: 'מזכירות',
    displayName: 'טליה ברק',
    phone: '050-0000000',
    email: 'talia@office.example.com',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    hasUserInSystem: false,
    permissions: perm({ contacts: { view: true, create: true, edit: true, delete: false }, documents: { view: true, create: false, edit: false, delete: false } }),
  },
];

export const MOCK_CONTACTS_LIST: ContactListRow[] = BASE;

export type ContactSortKey = 'roleLabel' | 'linkLabel' | 'displayName' | 'phone';
export type SortDir = 'asc' | 'desc';

export function roleDisplayLabel(row: ContactListRow): string {
  if (row.contactKind === 'tenant_buyer') return CONTACT_KIND_LABELS.tenant_buyer;
  return row.nickname.trim() || 'בעל תפקיד';
}

export function filterContactRows(
  rows: ContactListRow[],
  opts: { search: string; linkScope: 'all' | LinkKind; entityId: string | null },
): ContactListRow[] {
  const q = opts.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (opts.linkScope !== 'all' && r.linkKind !== opts.linkScope) return false;
    if (opts.entityId && r.linkId !== opts.entityId) return false;
    if (!q) return true;
    const hay = `${r.displayName} ${r.nickname} ${r.phone} ${r.linkLabel} ${roleDisplayLabel(r)}`.toLowerCase();
    return hay.includes(q);
  });
}

export function sortContactRows(rows: ContactListRow[], key: ContactSortKey, dir: SortDir): ContactListRow[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === 'roleLabel') return mul * roleDisplayLabel(a).localeCompare(roleDisplayLabel(b), 'he');
    if (key === 'linkLabel') return mul * a.linkLabel.localeCompare(b.linkLabel, 'he');
    if (key === 'displayName') return mul * a.displayName.localeCompare(b.displayName, 'he');
    return mul * a.phone.localeCompare(b.phone, 'he', { numeric: true });
  });
}

let activeRowsSnapshot: ContactListRow[] | null = null;

export function setActiveContactRowsSnapshot(next: ContactListRow[]) {
  activeRowsSnapshot = next;
}

export function getActiveContactRowsSnapshot(): ContactListRow[] | null {
  return activeRowsSnapshot;
}

export function removeContactFromSnapshot(id: string) {
  const base = activeRowsSnapshot ?? [...MOCK_CONTACTS_LIST];
  activeRowsSnapshot = base.filter((r) => r.id !== id);
}

let pendingNewContacts: ContactListRow[] = [];

export function queueNewContact(row: ContactListRow) {
  pendingNewContacts.push(row);
}

export function consumePendingContacts(): ContactListRow[] {
  const out = pendingNewContacts;
  pendingNewContacts = [];
  return out;
}

/**
 * Mock email-based system lookup.
 * Returns true if the email matches a known system user.
 */
export function checkEmailInSystem(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e || !e.includes('@')) return false;
  return MOCK_CONTACTS_LIST.some((c) => c.hasUserInSystem && c.email.toLowerCase() === e);
}

export function getContactDetailMock(id: string): ContactListRow | null {
  const fromSnap = activeRowsSnapshot?.find((r) => r.id === id);
  if (fromSnap) return fromSnap;
  return MOCK_CONTACTS_LIST.find((r) => r.id === id) ?? null;
}

export const MOCK_CONTACT_INVITE_BASE = 'https://app.knock.example/invite/contact/';

export function inviteUrlForToken(token: string) {
  return `${MOCK_CONTACT_INVITE_BASE}${token}`;
}

/** ספרות בלבד לחיוג */
export function normalizePhoneForTel(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  const d = digits.replace(/^0/, '');
  return d ? `+972${d}` : digits;
}

export function telUrl(phone: string) {
  return `tel:${normalizePhoneForTel(phone)}`;
}

/** wa.me / whatsapp — ניסיון 972 ללא 0 מוביל */
export function whatsappUrlFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  let n = digits;
  if (n.startsWith('972')) return `https://wa.me/${n}`;
  if (n.startsWith('0')) n = `972${n.slice(1)}`;
  else if (!n.startsWith('972')) n = `972${n}`;
  return `https://wa.me/${n}`;
}
