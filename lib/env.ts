export function requirePublicEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and set a value.`,
    );
  }

  return trimmed;
}
