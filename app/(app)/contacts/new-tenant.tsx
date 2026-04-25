import { useEffect } from 'react';
import { router } from 'expo-router';

export default function NewContactTenantScreen() {
  useEffect(() => {
    router.replace('/(app)/contacts/new');
  }, []);
  return null;
}
