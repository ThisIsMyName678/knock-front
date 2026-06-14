import type { ContactKind, ContactPermissions } from '@/lib/mocks/contacts';
import { emptyPermissions, type ContactListRow } from '@/lib/mocks/contacts';
import type { LinkKind } from '@/lib/mocks/contracts';
import type { ContactKindDto, ContactLinkKindDto, ContactListItem, ContactDetail } from '@/lib/api/contacts';

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

export function contactDetailToRow(detail: ContactDetail): ContactListRow {
  return {
    id: detail.id,
    contactKind: fromApiContactKind(detail.contactKind),
    nickname: detail.nickname ?? '',
    displayName: detail.displayName,
    phone: detail.phone,
    email: detail.email ?? '',
    notes: detail.notes ?? undefined,
    linkKind: detail.linkKind ? fromApiLinkKind(detail.linkKind) : 'asset',
    linkId: detail.linkId ?? '',
    linkLabel: detail.linkLabel ?? '',
    hasUserInSystem: detail.hasUserInSystem,
    inviteToken: detail.inviteToken ?? undefined,
    permissions: detail.permissions as ContactPermissions,
    permissionsByAssetId: detail.permissionsByAssetId as Record<string, ContactPermissions> | undefined,
  };
}
