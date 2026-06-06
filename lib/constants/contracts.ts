import type { ContractType, ContractStatus, ContractAccessLevel, MeterKind } from '@/lib/types/contract';

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  RENT: 'שכירות',
  PURCHASE: 'רכישה',
  SUPPLIER_WORK: 'הסכם עבודה עם ספק',
  OTHER: 'אחר',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: 'פעיל',
  EXPIRED: 'פג תוקף',
  DRAFT: 'טיוטה',
};

export const CONTRACT_ACCESS_LABELS: Record<ContractAccessLevel, string> = {
  OWNER_ONLY: 'פרטי (בעל הנכס בלבד)',
  TENANT_ONLY: 'שוכר בלבד (שוכר ובעל הנכס)',
  EMPLOYEE_ONLY: 'עובד בלבד (עובד ובעל הנכס)',
  PUBLIC: 'ציבורי',
};

export const METER_KIND_LABELS: Record<MeterKind, string> = {
  ELECTRIC: 'חשמל',
  WATER: 'מים',
  GAS: 'גז',
  OTHER: 'אחר',
};

export const METER_KIND_ICONS: Record<MeterKind, string> = {
  ELECTRIC: 'lightning-bolt',
  WATER: 'water',
  GAS: 'fire',
  OTHER: 'gauge',
};

export type ContractSortKey =
  | 'contractName'
  | 'contractType'
  | 'linkLabel'
  | 'counterpartyName'
  | 'agreementDate'
  | 'status';

export type SortDir = 'asc' | 'desc';
export type LinkScopeFilter = 'all' | 'PROPERTY' | 'PROJECT';
export type ContractTypeFilter = 'all' | ContractType;
