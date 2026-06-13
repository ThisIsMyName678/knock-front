type NameSources = {
  profileDisplayName?: string | null;
  userMetadata?: Record<string, unknown>;
  email?: string | null;
};

const METADATA_NAME_KEYS = ['given_name', 'full_name', 'name', 'display_name'] as const;

/** First name for greetings — e.g. "ישראל ישראלי" → "ישראל" */
export function resolveFirstName(sources: NameSources): string {
  const { profileDisplayName, userMetadata, email } = sources;

  const givenName = userMetadata?.given_name;
  if (typeof givenName === 'string' && givenName.trim()) {
    return givenName.trim();
  }

  const candidates = [
    profileDisplayName,
    ...METADATA_NAME_KEYS.filter((key) => key !== 'given_name').map((key) => userMetadata?.[key]),
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim().split(/\s+/)[0] ?? value.trim();
    }
  }

  return email?.split('@')[0] || 'משתמש';
}
