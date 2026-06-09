import { backendRequest } from '@/lib/backend';
import type { ProjectEntity } from '@/lib/mocks/assets';

export type BackendProject = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  addressJson: Record<string, unknown> | null;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  _count: { properties: number };
};

export type CreateProjectInput = {
  name: string;
  addressJson?: Record<string, unknown>;
  status?: BackendProject['status'];
};

export type ListProjectsParams = {
  search?: string;
};

export function listProjects(params: ListProjectsParams = {}): Promise<BackendProject[]> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return backendRequest<BackendProject[]>(`/projects${suffix}`);
}

export function projectAddressLabel(project: BackendProject): string {
  return addressJsonToLabel(project.addressJson);
}

export function getProject(id: string): Promise<BackendProject> {
  return backendRequest<BackendProject>(`/projects/${id}`);
}

export function createProject(input: CreateProjectInput): Promise<BackendProject> {
  return backendRequest<BackendProject>('/projects', {
    method: 'POST',
    body: input,
  });
}

export function projectToProjectEntity(project: BackendProject): ProjectEntity {
  return {
    id: project.id,
    kind: 'project',
    name: project.name,
    address: addressJsonToLabel(project.addressJson),
    assetCount: project._count.properties,
    rentedCount: (project._count as Record<string, number>).rentedProperties ?? 0,
    occupancy: 'vacant',
    role: { kind: 'owner' },
  };
}

function addressJsonToLabel(addressJson: Record<string, unknown> | null): string {
  if (!addressJson) return '';
  const label = addressJson.label;
  if (typeof label === 'string') return label;
  const street = typeof addressJson.street === 'string' ? addressJson.street : '';
  const city = typeof addressJson.city === 'string' ? addressJson.city : '';
  return [street, city].filter(Boolean).join(', ');
}
