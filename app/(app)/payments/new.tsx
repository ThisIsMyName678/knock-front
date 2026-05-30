import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PaymentCreateForm } from '@/components/modules/payments/PaymentCreateForm';
import { getPaymentDetailMock } from '@/lib/mocks/payments';

export default function NewPaymentScreen() {
  const { preloadLinkId, preloadLinkLabel, preloadLinkKind, preloadLinkAddress, preloadContractId, preloadContractName, duplicateFromId } =
    useLocalSearchParams<{
      preloadLinkId?: string;
      preloadLinkLabel?: string;
      preloadLinkKind?: string;
      preloadLinkAddress?: string;
      preloadContractId?: string;
      preloadContractName?: string;
      duplicateFromId?: string;
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

  // Duplicate: load source payment data and pass as initialData (without id — treated as new)
  const duplicateData = duplicateFromId ? getPaymentDetailMock(duplicateFromId) : undefined;

  if (duplicateData) {
    const { id: _id, ...rest } = duplicateData;
    void _id;
    return (
      <PaymentCreateForm
        initialData={{ ...rest, id: '', displayName: `עותק של ${rest.displayName}` } as typeof duplicateData}
      />
    );
  }

  return (
    <PaymentCreateForm
      preloadedLink={preloadedLink}
      preloadedContractId={preloadContractId}
      preloadedContractName={preloadContractName}
    />
  );
}
