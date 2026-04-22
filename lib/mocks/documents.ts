/**
 * Mock documents module — types, filters, sort (no backend).
 */

import type { LinkKind } from '@/lib/mocks/contracts';
import { MOCK_TASKS_LIST } from '@/lib/mocks/tasks';

export type DocumentAccessLevel = 'owner_only' | 'tenant' | 'employee' | 'public';

export const DOCUMENT_ACCESS_LABELS: Record<DocumentAccessLevel, string> = {
  owner_only: 'פרטי',
  tenant: 'שוכר + בעלים',
  employee: 'עובד + בעלים',
  public: 'ציבורי',
};

/** סוג מסמך (כולל הרחבות למסך העלאה ולרשימה) */
export type DocumentType =
  | 'plan'
  | 'report'
  | 'contract'
  | 'payment'
  | 'work_agreement'
  | 'asset_docs'
  | 'meter_readings'
  | 'formats'
  | 'guarantees'
  | 'accounts'
  | 'invoice_receipt'
  | 'other';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  plan: 'תכנית',
  report: 'דו"ח',
  contract: 'חוזה',
  payment: 'תשלום',
  work_agreement: 'הסכם עבודה',
  asset_docs: 'תיעוד הנכס',
  meter_readings: 'קריאות מונה',
  formats: 'פורמטים',
  guarantees: 'ערבויות ובטחונות',
  accounts: 'חשבונות',
  invoice_receipt: 'חשבונית/קבלה',
  other: 'אחר',
};

/** קטגוריית סינון בראש הרשימה */
export type DocumentCategoryFilter =
  | 'all'
  | 'formats'
  | 'invoice_receipt'
  | 'contract'
  | 'work_agreement'
  | 'guarantees'
  | 'bills'
  | 'other';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryFilter, string> = {
  all: 'הכל',
  formats: 'פורמטים',
  invoice_receipt: 'חשבונית/קבלה',
  contract: 'חוזה',
  work_agreement: 'הסכם עבודה',
  guarantees: 'ערבויות ובטחונות',
  bills: 'חשבונות',
  other: 'אחר',
};

export function categoryOfDocumentType(t: DocumentType): Exclude<DocumentCategoryFilter, 'all'> {
  if (t === 'formats') return 'formats';
  if (t === 'invoice_receipt' || t === 'payment') return 'invoice_receipt';
  if (t === 'contract') return 'contract';
  if (t === 'work_agreement') return 'work_agreement';
  if (t === 'guarantees') return 'guarantees';
  if (t === 'accounts') return 'bills';
  return 'other';
}

export function documentMatchesCategoryFilter(row: DocumentListRow, filter: DocumentCategoryFilter): boolean {
  if (filter === 'all') return true;
  return categoryOfDocumentType(row.documentType) === filter;
}

export type DocumentFileKind = 'pdf' | 'image' | 'other';

export type DocumentListRow = {
  id: string;
  displayName: string;
  documentType: DocumentType;
  linkKind: LinkKind;
  linkId: string;
  linkLabel: string;
  uploadedAt: string;
  accessLevel: DocumentAccessLevel;
  linkedTaskId?: string;
  fileKind: DocumentFileKind;
  sizeLabel: string;
  uploadedBy: string;
};

const ROWS: DocumentListRow[] = [
  {
    id: 'doc1',
    displayName: 'חוזה שכירות — דירה 4B.pdf',
    documentType: 'contract',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    uploadedAt: '02/01/2026',
    accessLevel: 'tenant',
    linkedTaskId: 't2',
    fileKind: 'pdf',
    sizeLabel: '1.2 MB',
    uploadedBy: 'מיכל לוי',
  },
  {
    id: 'doc2',
    displayName: 'תמונת נזילה — מטבח.jpg',
    documentType: 'asset_docs',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    uploadedAt: '20/04/2026',
    accessLevel: 'owner_only',
    linkedTaskId: 't1',
    fileKind: 'image',
    sizeLabel: '890 KB',
    uploadedBy: 'יוסי דייר',
  },
  {
    id: 'doc3',
    displayName: 'קבלה — תשלום ארנונה.pdf',
    documentType: 'invoice_receipt',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    uploadedAt: '15/03/2026',
    accessLevel: 'public',
    fileKind: 'pdf',
    sizeLabel: '210 KB',
    uploadedBy: 'חשבות',
  },
  {
    id: 'doc4',
    displayName: 'הסכם עבודה — צביעה.pdf',
    documentType: 'work_agreement',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    uploadedAt: '18/02/2026',
    accessLevel: 'employee',
    linkedTaskId: 't6',
    fileKind: 'pdf',
    sizeLabel: '640 KB',
    uploadedBy: 'דני מנהל',
  },
  {
    id: 'doc5',
    displayName: 'ערבות בנקאית — סריקה.pdf',
    documentType: 'guarantees',
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    uploadedAt: '10/01/2026',
    accessLevel: 'owner_only',
    fileKind: 'pdf',
    sizeLabel: '1.0 MB',
    uploadedBy: 'מיכל לוי',
  },
  {
    id: 'doc6',
    displayName: 'חשבון חשמל — מרץ.pdf',
    documentType: 'accounts',
    linkKind: 'asset',
    linkId: 'a2',
    linkLabel: 'דירה 7A',
    uploadedAt: '05/04/2026',
    accessLevel: 'tenant',
    fileKind: 'pdf',
    sizeLabel: '180 KB',
    uploadedBy: 'שוכר',
  },
  {
    id: 'doc7',
    displayName: 'תכנית אדריכלית — קומה 3.dwg',
    documentType: 'plan',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    uploadedAt: '22/11/2025',
    accessLevel: 'employee',
    fileKind: 'other',
    sizeLabel: '4.5 MB',
    uploadedBy: 'משרד תכנון',
  },
  {
    id: 'doc8',
    displayName: 'דוח בדיקת גז שנתית.pdf',
    documentType: 'report',
    linkKind: 'asset',
    linkId: 'a4',
    linkLabel: 'בית פרטי',
    uploadedAt: '12/12/2025',
    accessLevel: 'public',
    linkedTaskId: 't4',
    fileKind: 'pdf',
    sizeLabel: '320 KB',
    uploadedBy: 'טכנאי גז',
  },
  {
    id: 'doc9',
    displayName: 'קריאת מונה — מים.jpg',
    documentType: 'meter_readings',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    uploadedAt: '01/04/2026',
    accessLevel: 'owner_only',
    fileKind: 'image',
    sizeLabel: '120 KB',
    uploadedBy: 'אני',
  },
  {
    id: 'doc10',
    displayName: 'טופס הצהרת דייר.docx',
    documentType: 'formats',
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    uploadedAt: '08/03/2026',
    accessLevel: 'tenant',
    fileKind: 'other',
    sizeLabel: '45 KB',
    uploadedBy: 'מיכל לוי',
  },
  {
    id: 'doc11',
    displayName: 'סיכום תשלום שכירות.pdf',
    documentType: 'payment',
    linkKind: 'asset',
    linkId: 'a1',
    linkLabel: 'דירה 4B',
    uploadedAt: '03/05/2026',
    accessLevel: 'owner_only',
    linkedTaskId: 't5',
    fileKind: 'pdf',
    sizeLabel: '95 KB',
    uploadedBy: 'חשבות',
  },
  {
    id: 'doc12',
    displayName: 'פרוטוקול ועד בית.pdf',
    documentType: 'other',
    linkKind: 'project',
    linkId: 'p2',
    linkLabel: 'גני הדר',
    uploadedAt: '28/02/2026',
    accessLevel: 'public',
    fileKind: 'pdf',
    sizeLabel: '400 KB',
    uploadedBy: 'ועד בית',
  },
  {
    id: 'doc13',
    displayName: 'ביטוח מבנה — פוליסה.pdf',
    documentType: 'contract',
    linkKind: 'project',
    linkId: 'p1',
    linkLabel: 'מגדלי הים',
    uploadedAt: '01/01/2026',
    accessLevel: 'employee',
    linkedTaskId: 't9',
    fileKind: 'pdf',
    sizeLabel: '2.1 MB',
    uploadedBy: 'סוכן ביטוח',
  },
  {
    id: 'doc14',
    displayName: 'חוזה שכירות משרד 201.pdf',
    documentType: 'contract',
    linkKind: 'asset',
    linkId: 'a3',
    linkLabel: 'משרד 201',
    uploadedAt: '14/01/2026',
    accessLevel: 'tenant',
    linkedTaskId: 't8',
    fileKind: 'pdf',
    sizeLabel: '980 KB',
    uploadedBy: 'מיכל לוי',
  },
  {
    id: 'doc15',
    displayName: 'חשבון ספק — דלתות.pdf',
    documentType: 'accounts',
    linkKind: 'asset',
    linkId: 'a5',
    linkLabel: 'חנות קרקע',
    uploadedAt: '19/04/2026',
    accessLevel: 'owner_only',
    linkedTaskId: 't10',
    fileKind: 'pdf',
    sizeLabel: '150 KB',
    uploadedBy: 'נגר שירותים',
  },
  {
    id: 'doc16',
    displayName: 'טופס בקשה לתיקון — ריק.pdf',
    documentType: 'formats',
    linkKind: 'asset',
    linkId: 'a5',
    linkLabel: 'חנות קרקע',
    uploadedAt: '21/04/2026',
    accessLevel: 'public',
    fileKind: 'pdf',
    sizeLabel: '88 KB',
    uploadedBy: 'אני',
  },
];

export const MOCK_DOCUMENTS_LIST: DocumentListRow[] = ROWS;

export type DocumentSortKey = 'displayName' | 'documentType' | 'linkLabel' | 'uploadedAt' | 'accessLevel';
export type SortDir = 'asc' | 'desc';

function parseDdMmYyyy(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10) - 1;
  const y = parseInt(m[3]!, 10);
  return new Date(y, mo, d).getTime();
}

const ACCESS_ORDER: Record<DocumentAccessLevel, number> = {
  owner_only: 0,
  tenant: 1,
  employee: 2,
  public: 3,
};

export function sortDocumentRows(rows: DocumentListRow[], key: DocumentSortKey, dir: SortDir): DocumentListRow[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === 'displayName') return mul * a.displayName.localeCompare(b.displayName, 'he');
    if (key === 'documentType') return mul * a.documentType.localeCompare(b.documentType);
    if (key === 'linkLabel') return mul * a.linkLabel.localeCompare(b.linkLabel, 'he');
    if (key === 'uploadedAt') return mul * (parseDdMmYyyy(a.uploadedAt) - parseDdMmYyyy(b.uploadedAt));
    return mul * (ACCESS_ORDER[a.accessLevel] - ACCESS_ORDER[b.accessLevel]);
  });
}

export function filterDocumentRows(
  rows: DocumentListRow[],
  opts: {
    search: string;
    linkScope: 'all' | LinkKind;
    entityId: string | null;
    categoryFilter: DocumentCategoryFilter;
  },
): DocumentListRow[] {
  const q = opts.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (!documentMatchesCategoryFilter(r, opts.categoryFilter)) return false;
    if (opts.linkScope !== 'all' && r.linkKind !== opts.linkScope) return false;
    if (opts.entityId && r.linkId !== opts.entityId) return false;
    if (!q) return true;
    const hay = `${r.displayName} ${r.linkLabel} ${DOCUMENT_TYPE_LABELS[r.documentType]}`.toLowerCase();
    return hay.includes(q);
  });
}

/**
 * עותק אחרון של הרשימה מהמסך הראשי — מאפשר פתיחת פרטים אחרי ניווט גם כשהרשימה נפרמת מהעץ.
 * מתעדכן מ־DocumentsListScreen בכל שינוי state.
 */
let activeRowsSnapshot: DocumentListRow[] | null = null;

export function setActiveDocumentRowsSnapshot(next: DocumentListRow[]) {
  activeRowsSnapshot = next;
}

export function getActiveDocumentRowsSnapshot(): DocumentListRow[] | null {
  return activeRowsSnapshot;
}

export function removeDocumentFromSnapshot(id: string) {
  const base = activeRowsSnapshot ?? [...MOCK_DOCUMENTS_LIST];
  activeRowsSnapshot = base.filter((r) => r.id !== id);
}

let pendingNewDocuments: DocumentListRow[] = [];

export function queueNewDocument(row: DocumentListRow) {
  pendingNewDocuments.push(row);
}

export function consumePendingDocuments(): DocumentListRow[] {
  const out = pendingNewDocuments;
  pendingNewDocuments = [];
  return out;
}

export function getDocumentDetailMock(id: string): DocumentListRow | null {
  const fromSnapshot = activeRowsSnapshot?.find((r) => r.id === id);
  if (fromSnapshot) return fromSnapshot;
  return MOCK_DOCUMENTS_LIST.find((d) => d.id === id) ?? null;
}

export function tasksForEntityLinkId(linkId: string) {
  return MOCK_TASKS_LIST.filter((t) => t.linkId === linkId);
}

/** סוגי מסמך לבחירה במסך העלאה (כל האפשרויות) */
export const DOCUMENT_UPLOAD_TYPE_ORDER: DocumentType[] = [
  'plan',
  'report',
  'contract',
  'payment',
  'work_agreement',
  'asset_docs',
  'meter_readings',
  'formats',
  'guarantees',
  'accounts',
  'invoice_receipt',
  'other',
];
