import { backendRequest } from '@/lib/backend';
import type { ContractPayment, PaymentDirection } from './contracts';

export type CreatePaymentInput = {
  direction: PaymentDirection;
  categoryLabel: string;
  amount: string;
  date: string;
  notes?: string | null;
};

export function fetchPayments(contractId: string): Promise<ContractPayment[]> {
  return backendRequest<ContractPayment[]>(`/contracts/${contractId}/payments`);
}

export function createPayment(contractId: string, dto: CreatePaymentInput): Promise<ContractPayment> {
  return backendRequest<ContractPayment>(`/contracts/${contractId}/payments`, {
    method: 'POST',
    body: dto,
  });
}

export function deletePayment(contractId: string, paymentId: string): Promise<void> {
  return backendRequest<void>(`/contracts/${contractId}/payments/${paymentId}`, {
    method: 'DELETE',
  });
}
