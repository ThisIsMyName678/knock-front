import { useEffect } from 'react';
import { router } from 'expo-router';

export default function NewContactRoleScreen() {
  useEffect(() => {
    router.replace('/(app)/contacts/new');
  }, []);
  return null;
}
