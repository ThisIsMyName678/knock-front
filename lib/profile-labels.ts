import type { BackendCurrentUser } from './backend';
import type { User } from '@supabase/supabase-js';

export const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  ORG_OWNER: 'בעלים',
  ORG_ADMIN: 'מנהל',
  ORG_MEMBER: 'חבר צוות',
  BILLING_ADMIN: 'מנהל חיוב',
};

export function resolveOrganizationRoleLabel(role?: string | null): string {
  if (!role) {
    return '—';
  }

  return ORGANIZATION_ROLE_LABELS[role] ?? role;
}

export function resolveProfileDisplayName(
  backendUser: BackendCurrentUser | null,
  user: User | null,
): string {
  if (backendUser?.profile?.displayName?.trim()) {
    return backendUser.profile.displayName.trim();
  }

  const metadata = backendUser?.userMetadata ?? user?.user_metadata;
  const candidateKeys = ['full_name', 'name', 'display_name', 'given_name'];

  for (const key of candidateKeys) {
    const value = metadata?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const email = backendUser?.email ?? user?.email;
  return email?.split('@')[0] || 'משתמש';
}

export function resolveProfilePhone(
  backendUser: BackendCurrentUser | null,
  user: User | null,
): string {
  const metadataPhone = backendUser?.userMetadata?.phone ?? user?.user_metadata?.phone;
  if (typeof metadataPhone === 'string' && metadataPhone.trim()) {
    return metadataPhone.trim();
  }

  if (backendUser?.phone?.trim()) {
    return backendUser.phone.trim();
  }

  return '';
}

export function canEditOrganizationName(role?: string | null): boolean {
  return role === 'ORG_OWNER';
}
