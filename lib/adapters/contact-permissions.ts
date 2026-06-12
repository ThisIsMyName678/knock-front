import type { ContactKind } from '@/lib/mocks/contacts';
import type { LinkKind } from '@/lib/mocks/contracts';
import type { ContactKindDto, ContactLinkKindDto } from '@/lib/api/contacts';

export function toApiContactKind(kind: ContactKind): ContactKindDto {
  return kind === 'role_holder' ? 'ROLE_HOLDER' : 'TENANT_BUYER';
}

export function fromApiContactKind(kind: ContactKindDto): ContactKind {
  return kind === 'ROLE_HOLDER' ? 'role_holder' : 'tenant_buyer';
}

export function toApiLinkKind(kind: LinkKind): ContactLinkKindDto {
  return kind === 'asset' ? 'PROPERTY' : 'PROJECT';
}

export function fromApiLinkKind(kind: ContactLinkKindDto): LinkKind {
  return kind === 'PROPERTY' ? 'asset' : 'project';
}
