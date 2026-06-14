import { listProjects, projectAddressLabel } from './projects';
import { listProperties, propertyAddressLabel } from './properties';

export type LinkKind = 'asset' | 'project';

export type EntityLinkOption = {
  id: string;
  kind: LinkKind;
  name: string;
  address: string;
};

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
