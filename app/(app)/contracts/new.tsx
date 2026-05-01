import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ContractCreateWizard } from '@/components/modules/contracts/ContractCreateWizard';
import type { EntityLinkOption, LinkKind } from '@/lib/mocks/contracts';

export default function NewContractScreen() {
  const { preloadId, preloadName, preloadAddress, preloadKind } = useLocalSearchParams<{
    preloadId?: string;
    preloadName?: string;
    preloadAddress?: string;
    preloadKind?: string;
  }>();

  const preloadedLink: EntityLinkOption | undefined = preloadId
    ? {
        id: preloadId,
        name: preloadName ?? '',
        address: preloadAddress ?? '',
        kind: (preloadKind as LinkKind) ?? 'asset',
      }
    : undefined;

  return <ContractCreateWizard preloadedLink={preloadedLink} />;
}
