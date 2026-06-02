import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { isAuthDisabled } from '@/lib/auth-config';

export default function AuthLayout() {
  useEffect(() => {
    if (isAuthDisabled()) {
      router.replace('/(app)');
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
