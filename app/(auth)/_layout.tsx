import { useEffect } from 'react';
import { Stack, router, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function AuthLayout() {
  const { session, backendUser } = useAuth();

  if (session && backendUser) {
    console.log('[AuthLayout] User authenticated and backend user ready, redirecting to app');
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
