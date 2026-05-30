export function isAuthDisabled(): boolean {
  return process.env.EXPO_PUBLIC_SKIP_AUTH?.trim() === 'true';
}
