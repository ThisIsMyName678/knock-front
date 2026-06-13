import { useAuth } from '@/lib/auth';

/**
 * True when fonts are loaded and auth/bootstrap work has finished:
 * - session restore complete (`initialized`)
 * - first backend sync attempt finished when a session exists
 */
export function useAppReady(fontsLoaded: boolean): boolean {
  const { initialized, session, backendUserLoading, backendBootstrapComplete } = useAuth();

  if (!fontsLoaded || !initialized || !backendBootstrapComplete) {
    return false;
  }

  if (session && backendUserLoading) {
    return false;
  }

  return true;
}
