import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ContactCreateForm } from '@/components/modules/contacts/ContactCreateForm';

export default function NewContactScreen() {
  const { preloadLinkId, preloadLinkKind } = useLocalSearchParams<{
    preloadLinkId?: string;
    preloadLinkKind?: 'asset' | 'project';
  }>();

  return <ContactCreateForm preloadLinkId={preloadLinkId} preloadLinkKind={preloadLinkKind} />;
}
