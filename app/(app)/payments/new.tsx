import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PaymentCreateForm } from '@/components/modules/payments/PaymentCreateForm';

export default function NewPaymentScreen() {
  const { preloadLinkId, preloadLinkLabel, preloadLinkKind, preloadLinkAddress, preloadContractId, preloadContractName } =
    useLocalSearchParams<{
      preloadLinkId?: string;
      preloadLinkLabel?: string;
      preloadLinkKind?: string;
      preloadLinkAddress?: string;
      preloadContractId?: string;
      preloadContractName?: string;
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

  return (
    <PaymentCreateForm
      preloadedLink={preloadedLink}
      preloadedContractId={preloadContractId}
      preloadedContractName={preloadContractName}
    />
  );
}
