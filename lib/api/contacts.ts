import { backendRequest } from '@/lib/backend';

export type ContactKindDto = 'ROLE_HOLDER' | 'TENANT_BUYER';
export type ContactLinkKindDto = 'PROJECT' | 'PROPERTY';

export type ContactPermissionModuleKey =
  | 'maintenance'
  | 'payments'
  | 'contracts'
  | 'documents'
  | 'tasks'
  | 'contacts'
  | 'assets'
  | 'projects';

export type ContactPermissionActionKey = 'view' | 'create' | 'edit' | 'delete';

export type ModulePermissionsDto = Record<ContactPermissionActionKey, boolean>;

export type ContactPermissionsDto = Record<ContactPermissionModuleKey, ModulePermissionsDto>;

export type ContactListItem = {
  id: string;
  contactKind: ContactKindDto;
  nickname: string | null;
  displayName: string;
  phone: string;
  email: string | null;
  linkKind: ContactLinkKindDto | null;
  linkId: string | null;
  linkLabel: string | null;
  hasUserInSystem: boolean;
};

export type ContactDetail = ContactListItem & {
  notes: string | null;
  inviteToken: string | null | undefined;
  permissions: ContactPermissionsDto;
  permissionsByAssetId?: Record<string, ContactPermissionsDto>;
};

export type ContactFilters = {
  search?: string;
  linkKind?: ContactLinkKindDto;
  linkId?: string;
  contactKind?: ContactKindDto;
  projectId?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
};

export type CreateContactInput = {
  contactKind: ContactKindDto;
  displayName: string;
  phone: string;
  linkKind: ContactLinkKindDto;
  linkId: string;
  nickname?: string;
  email?: string;
  notes?: string;
  hasUserInSystem?: boolean;
  permissions: ContactPermissionsDto;
};

export type UpdateContactInput = Partial<Omit<CreateContactInput, 'linkKind' | 'linkId'>>;

export type InviteContactResponse = {
  inviteUrl: string;
  token: string;
};

export function listContacts(filters: ContactFilters = {}): Promise<ContactListItem[]> {
  const query = new URLSearchParams();
  if (filters.search?.trim()) query.set('search', filters.search.trim());
  if (filters.linkKind) query.set('linkKind', filters.linkKind);
  if (filters.linkId) query.set('linkId', filters.linkId);
  if (filters.contactKind) query.set('contactKind', filters.contactKind);
  if (filters.projectId) query.set('projectId', filters.projectId);
  if (filters.propertyId) query.set('propertyId', filters.propertyId);
  if (filters.page != null) query.set('page', String(filters.page));
  if (filters.limit != null) query.set('limit', String(filters.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return backendRequest<ContactListItem[]>(`/contacts${suffix}`);
}

export function getContact(id: string): Promise<ContactDetail> {
  return backendRequest<ContactDetail>(`/contacts/${id}`);
}

export function createContact(dto: CreateContactInput): Promise<ContactDetail> {
  return backendRequest<ContactDetail>('/contacts', { method: 'POST', body: dto });
}

export function updateContact(id: string, dto: UpdateContactInput): Promise<ContactDetail> {
  return backendRequest<ContactDetail>(`/contacts/${id}`, { method: 'PATCH', body: dto });
}

export function archiveContact(id: string): Promise<void> {
  return backendRequest<void>(`/contacts/${id}`, { method: 'DELETE' });
}

export function inviteContact(id: string): Promise<InviteContactResponse> {
  return backendRequest<InviteContactResponse>(`/contacts/${id}/invite`, { method: 'POST' });
}

export function listPropertyContacts(propertyId: string): Promise<ContactListItem[]> {
  return backendRequest<ContactListItem[]>(`/properties/${propertyId}/contacts`);
}

export function listProjectContacts(projectId: string): Promise<ContactListItem[]> {
  return backendRequest<ContactListItem[]>(`/projects/${projectId}/contacts`);
}
