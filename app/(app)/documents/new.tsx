import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DocumentUploadForm } from '@/components/modules/documents/DocumentUploadForm';

export default function NewDocumentScreen() {
  const { preloadLinkId, preloadLinkLabel, preloadLinkAddress, preloadLinkKind } = useLocalSearchParams<{
    preloadLinkId?: string;
    preloadLinkLabel?: string;
    preloadLinkAddress?: string;
    preloadLinkKind?: string;
  }>();

  const preloadedLink =
    preloadLinkId && preloadLinkLabel
      ? {
          id: preloadLinkId,
          name: preloadLinkLabel,
          address: preloadLinkAddress ?? '',
          kind: (preloadLinkKind ?? 'asset') as 'asset' | 'project',
        }
      : undefined;

  return <DocumentUploadForm preloadedLink={preloadedLink} />;
}
