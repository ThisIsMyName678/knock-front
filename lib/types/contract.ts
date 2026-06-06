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
