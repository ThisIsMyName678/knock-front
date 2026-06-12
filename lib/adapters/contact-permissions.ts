import type { ContactKind } from '@/lib/mocks/contacts';
import { emptyPermissions, type ContactListRow } from '@/lib/mocks/contacts';
import type { LinkKind } from '@/lib/mocks/contracts';
import type { ContactKindDto, ContactLinkKindDto, ContactListItem } from '@/lib/api/contacts';

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

export function contactItemToRow(item: ContactListItem): ContactListRow {
  return {
    id: item.id,
    contactKind: fromApiContactKind(item.contactKind),
    nickname: item.nickname ?? '',
    displayName: item.displayName,
    phone: item.phone,
    email: item.email ?? '',
    linkKind: item.linkKind ? fromApiLinkKind(item.linkKind) : 'asset',
    linkId: item.linkId ?? '',
    linkLabel: item.linkLabel ?? '',
    hasUserInSystem: item.hasUserInSystem,
    permissions: emptyPermissions(),
  };
}
