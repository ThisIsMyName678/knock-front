import { backendRequest } from '@/lib/backend';
import type { PaymentListRow, PaymentDetailMock, PaymentTypeKey, PaymentModeKey, StatusBucket } from '@/lib/mocks/payments';

export type ClientDirection = 'in' | 'out';
export type ClientPaymentMethodKey = 'check' | 'bank' | 'cash' | 'credit' | 'other';

export type BackendPaymentDirection = 'IN' | 'OUT';
export type BackendPaymentTypeKey =
  | 'RENT'
  | 'BILLS'
  | 'ARNONA'
  | 'METERS'
  | 'GUARANTEES'
  | 'MAINTENANCE'
  | 'INSURANCE'
  | 'MARKETING'
  | 'SUPPLIERS'
  | 'PLANNING'
  | 'SEVERANCE'
  | 'OTHER';
export type BackendPaymentMode = 'FULL' | 'RECURRING' | 'INSTALLMENTS' | 'SHAFIF_PLUS';
export type BackendRecurringCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type BackendPaymentLinkScope = 'PROJECT' | 'PROPERTY';
export type BackendPaymentMethod = 'CHECK' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT' | 'OTHER';
export type BackendPaymentStatus = 'PLANNED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type BackendPayment = {
  id: string;
  organizationId: string;
  name: string;
  direction: BackendPaymentDirection;
  paymentType: BackendPaymentTypeKey;
  mode: BackendPaymentMode;
  linkScope: BackendPaymentLinkScope;
  projectId: string | null;
  propertyId: string | null;
  contractId: string | null;
  linkLabel: string | null;
  amountNet: string;
  amountGross: string;
  vatPercent: string;
  paymentMethod: BackendPaymentMethod;
  dueDate: string;
  status: BackendPaymentStatus;
  statusBucket: StatusBucket;
  recurringGroupId: string | null;
  installmentIndex: number | null;
  installmentsTotal: number | null;
  shafifPlusDays: number | null;
  progressLabel: string;
  payerType: string | null;
  payerContactId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListPaymentsParams = {
  search?: string;
  projectId?: string;
  propertyId?: string;
  paymentType?: BackendPaymentTypeKey;
  direction?: BackendPaymentDirection;
  statusBucket?: StatusBucket;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export function listPayments(params: ListPaymentsParams = {}): Promise<BackendPayment[]> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.projectId) query.set('projectId', params.projectId);
  if (params.propertyId) query.set('propertyId', params.propertyId);
  if (params.paymentType) query.set('paymentType', params.paymentType);
  if (params.direction) query.set('direction', params.direction);
  if (params.statusBucket) query.set('statusBucket', params.statusBucket);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return backendRequest<BackendPayment[]>(`/payments${suffix}`);
}

export function getPayment(id: string): Promise<BackendPayment> {
  return backendRequest<BackendPayment>(`/payments/${id}`);
}

export function deletePayment(id: string): Promise<void> {
  return backendRequest<void>(`/payments/${id}`, { method: 'DELETE' });
}

export type CreatePaymentInput = {
  name: string;
  direction: BackendPaymentDirection;
  paymentType: BackendPaymentTypeKey;
  mode: BackendPaymentMode;
  linkScope: BackendPaymentLinkScope;
  projectId?: string | null;
  propertyId?: string | null;
  contractId?: string | null;
  amountNet: number;
  amountGross: number;
  vatPercent: number;
  paymentMethod: BackendPaymentMethod;
  dueDate: string;
  payerType?: string | null;
  payerContactId?: string | null;
  notes?: string | null;
  cycle?: BackendRecurringCycle;
  count?: number;
  installments?: {
    amount: number;
    dueDate: string;
    paymentMethod: BackendPaymentMethod;
    indexed: boolean;
  }[];
};

export function createPayment(input: CreatePaymentInput): Promise<BackendPayment | BackendPayment[]> {
  return backendRequest<BackendPayment | BackendPayment[]>('/payments', { method: 'POST', body: input });
}

const PAYMENT_METHOD_LABELS: Record<BackendPaymentMethod, string> = {
  CHECK: 'שיק',
  BANK_TRANSFER: 'העברה בנקאית',
  CASH: 'מזומן',
  CREDIT: 'אשראי',
  OTHER: 'אחר',
};

const PAYER_TYPE_LABELS: Record<string, string> = {
  OWNER: 'בעל הנכס',
  TENANT: 'שוכר',
  EMPLOYEE: 'עובד',
  BUYER: 'קונה',
  OTHER: 'אחר',
};

export const PAYER_TYPE_OPTIONS: { key: string; label: string }[] = Object.entries(PAYER_TYPE_LABELS).map(
  ([key, label]) => ({ key, label }),
);

const MEANS_TO_BACKEND: Record<ClientPaymentMethodKey, BackendPaymentMethod> = {
  check: 'CHECK',
  bank: 'BANK_TRANSFER',
  cash: 'CASH',
  credit: 'CREDIT',
  other: 'OTHER',
};

export function clientMeansToBackend(means: string): BackendPaymentMethod {
  return MEANS_TO_BACKEND[means as ClientPaymentMethodKey] ?? 'OTHER';
}

export function clientDirectionToBackend(direction: ClientDirection): BackendPaymentDirection {
  return direction === 'in' ? 'IN' : 'OUT';
}

export function clientPaymentTypeToBackend(type: PaymentTypeKey): BackendPaymentTypeKey {
  return type.toUpperCase() as BackendPaymentTypeKey;
}

export function clientPaymentModeToBackend(mode: PaymentModeKey): BackendPaymentMode {
  return mode.toUpperCase() as BackendPaymentMode;
}

export function clientCycleToBackend(cycle: 'weekly' | 'monthly' | 'yearly'): BackendRecurringCycle {
  return cycle.toUpperCase() as BackendRecurringCycle;
}

export function ddMmYyyyToIso(date: string): string | null {
  const parts = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!parts) return null;
  const [, dd, mm, yyyy] = parts;
  return `${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`;
}

function isoDateToDdMmYyyy(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function paymentToDetail(payment: BackendPayment): PaymentDetailMock {
  return {
    ...paymentToListRow(payment),
    payerLabel: payment.payerType ? PAYER_TYPE_LABELS[payment.payerType] : undefined,
    vatPercent: `${Number(payment.vatPercent)}%`,
    amountNet: Number(payment.amountNet),
    amountGross: Number(payment.amountGross),
    means: PAYMENT_METHOD_LABELS[payment.paymentMethod],
  };
}

export function paymentToListRow(payment: BackendPayment): PaymentListRow {
  return {
    id: payment.id,
    displayName: payment.name,
    paymentType: payment.paymentType.toLowerCase() as PaymentTypeKey,
    mode: payment.mode.toLowerCase() as PaymentModeKey,
    indexed: false,
    linkKind: payment.linkScope === 'PROJECT' ? 'project' : 'asset',
    linkId: payment.projectId ?? payment.propertyId ?? '',
    linkLabel: payment.linkLabel ?? '',
    dueDate: isoDateToDdMmYyyy(payment.dueDate),
    statusBucket: payment.statusBucket,
    amount: Number(payment.amountGross),
    direction: payment.direction === 'IN' ? 'inbound' : 'outbound',
    progressLabel: payment.progressLabel,
  };
}
