import { backendRequest } from '@/lib/backend';

export type ContractType = 'RENT' | 'PURCHASE' | 'SUPPLIER_WORK' | 'OTHER';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'DRAFT';
export type ContractLinkKind = 'PROJECT' | 'PROPERTY';
export type ContractAccessLevel = 'OWNER_ONLY' | 'TENANT_ONLY' | 'EMPLOYEE_ONLY' | 'PUBLIC';
export type MeterKind = 'ELECTRIC' | 'WATER' | 'GAS' | 'OTHER';
export type PaymentDirection = 'IN' | 'OUT';

export type ContractListItem = {
  id: string;
  contractName: string;
  contractType: ContractType;
  linkKind: ContractLinkKind;
  linkId: string;
  linkLabel: string;
  counterpartyName: string;
  agreementDate: string | null;
  endDate: string | null;
  status: ContractStatus;
  monthlyAmount: string | null;
};

export type ContractPayment = {
  id: string;
  direction: PaymentDirection;
  categoryLabel: string;
  amount: string;
  date: string;
  notes: string | null;
};

export type ContractMeter = {
  id: string;
  kind: MeterKind;
  name: string;
  identifier: string;
  currentValue: string | null;
};

export type ContractFile = {
  id: string;
  category: string;
  displayName: string;
  fileType: 'image' | 'pdf';
  storageKey: string;
  accessLevel: ContractAccessLevel;
};

export type ContractDetail = ContractListItem & {
  counterpartyId: string | null;
  counterpartyPhone: string | null;
  counterpartyEmail: string | null;
  serviceType: string | null;
  contactName: string | null;
  accessLevel: ContractAccessLevel;
  notes: string | null;
  payments: ContractPayment[];
  meters: ContractMeter[];
  files: ContractFile[];
};

export type ContractFilters = {
  search?: string;
  linkKind?: ContractLinkKind;
  contractType?: ContractType;
  status?: ContractStatus;
  projectId?: string;
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type CreateContractInput = {
  contractName: string;
  contractType: ContractType;
  linkKind: ContractLinkKind;
  projectId?: string | null;
  propertyId?: string | null;
  counterpartyName: string;
  counterpartyId?: string | null;
  counterpartyPhone?: string | null;
  counterpartyEmail?: string | null;
  serviceType?: string | null;
  contactName?: string | null;
  monthlyAmount?: string | null;
  agreementDate?: string | null;
  endDate?: string | null;
  accessLevel?: ContractAccessLevel;
  notes?: string | null;
};

export type UpdateContractInput = Partial<CreateContractInput>;

export function fetchContracts(filters: ContractFilters = {}): Promise<ContractListItem[]> {
  const query = new URLSearchParams();
  if (filters.search?.trim()) query.set('search', filters.search.trim());
  if (filters.linkKind) query.set('linkKind', filters.linkKind);
  if (filters.contractType) query.set('contractType', filters.contractType);
  if (filters.status) query.set('status', filters.status);
  if (filters.projectId) query.set('projectId', filters.projectId);
  if (filters.propertyId) query.set('propertyId', filters.propertyId);
  if (filters.dateFrom) query.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) query.set('dateTo', filters.dateTo);
  if (filters.page != null) query.set('page', String(filters.page));
  if (filters.limit != null) query.set('limit', String(filters.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return backendRequest<ContractListItem[]>(`/contracts${suffix}`);
}

export function fetchContractById(id: string): Promise<ContractDetail> {
  return backendRequest<ContractDetail>(`/contracts/${id}`);
}

export function createContract(dto: CreateContractInput): Promise<ContractDetail> {
  return backendRequest<ContractDetail>('/contracts', { method: 'POST', body: dto });
}

export function updateContract(id: string, dto: UpdateContractInput): Promise<ContractDetail> {
  return backendRequest<ContractDetail>(`/contracts/${id}`, { method: 'PATCH', body: dto });
}

export function archiveContract(id: string): Promise<void> {
  return backendRequest<void>(`/contracts/${id}`, { method: 'DELETE' });
}
