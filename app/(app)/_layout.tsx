import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function AppLayout() {
  const { initialized, session, backendUser, backendUserLoading } = useAuth();

  useEffect(() => {
    if (initialized && !session) {
      router.replace('/(auth)/login');
    }
  }, [initialized, session]);

  useEffect(() => {
    if (initialized && session && !backendUserLoading && !backendUser) {
      router.replace('/(auth)/login');
    }
  }, [initialized, session, backendUserLoading, backendUser]);

  if (!initialized || !session || backendUserLoading || !backendUser) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
