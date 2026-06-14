import { useEffect } from 'react';
import { Stack, router, Redirect } from 'expo-router';
import { isAuthDisabled } from '@/lib/auth-config';
import { useAuth } from '@/lib/auth';

export default function AuthLayout() {
  const { session, backendUser, passwordRecoveryPending } = useAuth();

  useEffect(() => {
    if (isAuthDisabled()) {
      router.replace('/(app)');
    }
  }, []);

  if (session && backendUser && !passwordRecoveryPending) {
    console.log('[AuthLayout] User authenticated and backend user ready, redirecting to app');
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
