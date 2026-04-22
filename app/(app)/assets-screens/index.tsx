import React from 'react';
import { EntityListScreen } from '@/components/modules/assets/EntityListScreen';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';

export default function AssetsIndexScreen() {
  const plan = useSubscriptionPlan();
  // Enterprise users see projects as their primary asset view.
  // All other plans go straight to the assets list.
  return <EntityListScreen mode={plan === 'enterprise' ? 'projects' : 'assets'} />;
}
