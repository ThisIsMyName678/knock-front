import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetailTabsScreen } from '@/components/modules/assets/DetailTabsScreen';

export default function AssetDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetailTabsScreen mode="asset" id={id ?? ''} />;
}
