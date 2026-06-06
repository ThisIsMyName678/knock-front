import { listProjects, projectAddressLabel } from './projects';
import { listProperties, propertyAddressLabel } from './properties';
import type { EntityLinkOption } from '@/lib/mocks/contracts';

export async function searchEntityLinks(query: string): Promise<EntityLinkOption[]> {
  const [projects, properties] = await Promise.all([
    listProjects({ search: query }),
    listProperties({ search: query }),
  ]);
  return [
    ...projects.map((p) => ({ id: p.id, kind: 'project' as const, name: p.name, address: projectAddressLabel(p) })),
    ...properties.map((p) => ({ id: p.id, kind: 'asset' as const, name: p.name, address: propertyAddressLabel(p) })),
  ];
}
