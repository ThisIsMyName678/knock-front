import { backendRequest } from '@/lib/backend';
import type { AssetEntity, OccupancyStatus } from '@/lib/mocks/assets';

export type BackendPropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'PRIVATE_HOME'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'WAREHOUSE'
  | 'LAND'
  | 'OTHER';

export type BackendOccupancyStatus =
  | 'VACANT'
  | 'OCCUPIED'
  | 'PARTIALLY_OCCUPIED'
  | 'UNDER_CONSTRUCTION'
  | 'SOLD'
  | 'OTHER';

export type BackendProperty = {
  id: string;
  organizationId: string;
  projectId: string | null;
  name: string;
  slug: string;
  addressJson: Record<string, unknown> | null;
  propertyType: BackendPropertyType;
  occupancyStatus: BackendOccupancyStatus | null;
  metadata: Record<string, unknown> | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
};

export type CreatePropertyInput = {
  name: string;
  address?: string;
  addressJson?: Record<string, unknown>;
  propertyType: BackendPropertyType;
  occupancyStatus?: BackendOccupancyStatus;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
};

export type ListPropertiesParams = {
  search?: string;
  occupancyStatus?: BackendOccupancyStatus;
  projectId?: string;
  unassigned?: boolean;
};

export function listProperties(params: ListPropertiesParams = {}): Promise<BackendProperty[]> {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.occupancyStatus) {
    query.set('occupancyStatus', params.occupancyStatus);
  }

  if (params.projectId) {
    query.set('projectId', params.projectId);
  }

  if (params.unassigned) {
    query.set('unassigned', 'true');
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const path = `/properties${suffix}`;

  if (__DEV__) {
    console.log('[listProperties] request', { path, params });
  }

  return backendRequest<BackendProperty[]>(path);
}

export function getProperty(id: string): Promise<BackendProperty> {
  return backendRequest<BackendProperty>(`/properties/${id}`);
}

export function createProperty(input: CreatePropertyInput): Promise<BackendProperty> {
  return backendRequest<BackendProperty>('/properties', {
    method: 'POST',
    body: input,
  });
}

export function updateProperty(id: string, input: Partial<CreatePropertyInput>): Promise<BackendProperty> {
  return backendRequest<BackendProperty>(`/properties/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function propertyToAssetEntity(property: BackendProperty): AssetEntity {
  const metadata = property.metadata ?? {};
  return {
    id: property.id,
    kind: 'asset',
    name: property.name,
    address: addressJsonToLabel(property.addressJson),
    occupancy: backendOccupancyToAsset(property.occupancyStatus),
    role: { kind: 'owner' },
    projectId: property.projectId,
    floorNumber: stringFromMetadata(metadata.floorNumber),
    sizeSqm: stringFromMetadata(metadata.sizeSqm),
  };
}

export function assetOccupancyToBackend(status: OccupancyStatus): BackendOccupancyStatus {
  if (status === 'rented') return 'OCCUPIED';
  if (status === 'construction') return 'UNDER_CONSTRUCTION';
  return 'VACANT';
}

function backendOccupancyToAsset(status: BackendOccupancyStatus | null): OccupancyStatus {
  if (status === 'OCCUPIED' || status === 'PARTIALLY_OCCUPIED') return 'rented';
  if (status === 'UNDER_CONSTRUCTION') return 'construction';
  return 'vacant';
}

export function propertyAddressLabel(property: BackendProperty): string {
  return addressJsonToLabel(property.addressJson);
}

function addressJsonToLabel(addressJson: Record<string, unknown> | null): string {
  if (!addressJson) return '';

  const label = addressJson.label;
  if (typeof label === 'string') return label;

  const street = typeof addressJson.street === 'string' ? addressJson.street : '';
  const city = typeof addressJson.city === 'string' ? addressJson.city : '';
  return [street, city].filter(Boolean).join(', ');
}

function stringFromMetadata(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
