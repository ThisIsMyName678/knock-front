import { backendRequest } from '@/lib/backend';
import type { ContractMeter, MeterKind } from './contracts';

export type CreateMeterInput = {
  kind: MeterKind;
  name: string;
  identifier: string;
  currentValue?: string | null;
};

export type UpdateMeterInput = Partial<CreateMeterInput>;

export function fetchMeters(contractId: string): Promise<ContractMeter[]> {
  return backendRequest<ContractMeter[]>(`/contracts/${contractId}/meters`);
}

export function createMeter(contractId: string, dto: CreateMeterInput): Promise<ContractMeter> {
  return backendRequest<ContractMeter>(`/contracts/${contractId}/meters`, {
    method: 'POST',
    body: dto,
  });
}

export function updateMeter(
  contractId: string,
  meterId: string,
  dto: UpdateMeterInput,
): Promise<ContractMeter> {
  return backendRequest<ContractMeter>(`/contracts/${contractId}/meters/${meterId}`, {
    method: 'PATCH',
    body: dto,
  });
}

export function deleteMeter(contractId: string, meterId: string): Promise<void> {
  return backendRequest<void>(`/contracts/${contractId}/meters/${meterId}`, {
    method: 'DELETE',
  });
}
