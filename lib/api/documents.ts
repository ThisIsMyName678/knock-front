import { backendRequest } from '@/lib/backend';
import type { LinkKind } from '@/lib/mocks/contracts';
import type {
  DocumentListRow,
  DocumentType,
  DocumentAccessLevel,
  DocumentFileKind,
} from '@/lib/mocks/documents';

export type BackendDocumentTypeKey =
  | 'PLAN'
  | 'REPORT'
  | 'CONTRACT'
  | 'PAYMENT'
  | 'WORK_AGREEMENT'
  | 'ASSET_DOCS'
  | 'METER_READINGS'
  | 'FORMATS'
  | 'GUARANTEES'
  | 'ACCOUNTS'
  | 'INVOICE_RECEIPT'
  | 'OTHER';

export type BackendDocumentAccessLevel = 'OWNER_ONLY' | 'TENANT' | 'EMPLOYEE' | 'PUBLIC';

export type BackendDocumentLinkScope = 'PROJECT' | 'PROPERTY';

export type BackendDocumentCategoryFilter =
  | 'formats'
  | 'invoice_receipt'
  | 'contract'
  | 'work_agreement'
  | 'guarantees'
  | 'bills'
  | 'other';

export type BackendDocumentSortKey = 'displayName' | 'documentType' | 'uploadedAt' | 'accessLevel';

export type BackendDocument = {
  id: string;
  organizationId: string;
  displayName: string;
  documentType: BackendDocumentTypeKey;
  categoryFilter: BackendDocumentCategoryFilter;
  linkScope: BackendDocumentLinkScope;
  projectId: string | null;
  propertyId: string | null;
  linkLabel: string | null;
  accessLevel: BackendDocumentAccessLevel;
  linkedTaskId: string | null;
  fileType: string;
  storageKey: string | null;
  sizeLabel: string | null;
  uploadedByContactId: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ListDocumentsParams = {
  search?: string;
  projectId?: string;
  propertyId?: string;
  documentType?: BackendDocumentTypeKey;
  categoryFilter?: BackendDocumentCategoryFilter;
  sortBy?: BackendDocumentSortKey;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export function listDocuments(params: ListDocumentsParams = {}): Promise<BackendDocument[]> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.projectId) query.set('projectId', params.projectId);
  if (params.propertyId) query.set('propertyId', params.propertyId);
  if (params.documentType) query.set('documentType', params.documentType);
  if (params.categoryFilter) query.set('categoryFilter', params.categoryFilter);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return backendRequest<BackendDocument[]>(`/documents${suffix}`);
}

export function getDocument(id: string): Promise<BackendDocument> {
  return backendRequest<BackendDocument>(`/documents/${id}`);
}

export function deleteDocument(id: string): Promise<void> {
  return backendRequest<void>(`/documents/${id}`, { method: 'DELETE' });
}

export type CreateDocumentInput = {
  displayName: string;
  documentType: BackendDocumentTypeKey;
  linkScope: BackendDocumentLinkScope;
  projectId?: string | null;
  propertyId?: string | null;
  accessLevel?: BackendDocumentAccessLevel;
  linkedTaskId?: string | null;
  fileType: string;
  storageKey?: string | null;
  sizeLabel?: string | null;
  uploadedByContactId?: string | null;
};

export function createDocument(input: CreateDocumentInput): Promise<BackendDocument> {
  return backendRequest<BackendDocument>('/documents', { method: 'POST', body: input });
}

export type UpdateDocumentInput = {
  displayName?: string;
  documentType?: BackendDocumentTypeKey;
  linkScope?: BackendDocumentLinkScope;
  projectId?: string | null;
  propertyId?: string | null;
  accessLevel?: BackendDocumentAccessLevel;
  linkedTaskId?: string | null;
};

export function updateDocument(id: string, input: UpdateDocumentInput): Promise<BackendDocument> {
  return backendRequest<BackendDocument>(`/documents/${id}`, { method: 'PATCH', body: input });
}

const DOCUMENT_TYPE_TO_BACKEND: Record<DocumentType, BackendDocumentTypeKey> = {
  plan: 'PLAN',
  report: 'REPORT',
  contract: 'CONTRACT',
  payment: 'PAYMENT',
  work_agreement: 'WORK_AGREEMENT',
  asset_docs: 'ASSET_DOCS',
  meter_readings: 'METER_READINGS',
  formats: 'FORMATS',
  guarantees: 'GUARANTEES',
  accounts: 'ACCOUNTS',
  invoice_receipt: 'INVOICE_RECEIPT',
  other: 'OTHER',
};

export function clientDocumentTypeToBackend(type: DocumentType): BackendDocumentTypeKey {
  return DOCUMENT_TYPE_TO_BACKEND[type];
}

export function backendDocumentTypeToClient(type: BackendDocumentTypeKey): DocumentType {
  return type.toLowerCase() as DocumentType;
}

const ACCESS_LEVEL_TO_BACKEND: Record<DocumentAccessLevel, BackendDocumentAccessLevel> = {
  owner_only: 'OWNER_ONLY',
  tenant: 'TENANT',
  employee: 'EMPLOYEE',
  public: 'PUBLIC',
};

export function clientAccessLevelToBackend(level: DocumentAccessLevel): BackendDocumentAccessLevel {
  return ACCESS_LEVEL_TO_BACKEND[level];
}

export function backendAccessLevelToClient(level: BackendDocumentAccessLevel): DocumentAccessLevel {
  return level.toLowerCase() as DocumentAccessLevel;
}

export function clientLinkKindToBackend(kind: LinkKind): BackendDocumentLinkScope {
  return kind === 'project' ? 'PROJECT' : 'PROPERTY';
}

export function backendLinkScopeToClient(scope: BackendDocumentLinkScope): LinkKind {
  return scope === 'PROJECT' ? 'project' : 'asset';
}

function fileKindFromFileType(fileType: string): DocumentFileKind {
  if (fileType === 'pdf' || fileType === 'image' || fileType === 'other') return fileType;
  return 'other';
}

function isoDateToDdMmYyyy(iso: string): string {
  const datePart = iso.split('T')[0];
  const [y, m, d] = (datePart ?? '').split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function documentToListRow(doc: BackendDocument): DocumentListRow {
  return {
    id: doc.id,
    displayName: doc.displayName,
    documentType: backendDocumentTypeToClient(doc.documentType),
    linkKind: backendLinkScopeToClient(doc.linkScope),
    linkId: doc.projectId ?? doc.propertyId ?? '',
    linkLabel: doc.linkLabel ?? '',
    uploadedAt: isoDateToDdMmYyyy(doc.uploadedAt),
    accessLevel: backendAccessLevelToClient(doc.accessLevel),
    linkedTaskId: doc.linkedTaskId ?? undefined,
    fileKind: fileKindFromFileType(doc.fileType),
    sizeLabel: doc.sizeLabel ?? '',
    uploadedBy: '',
  };
}
