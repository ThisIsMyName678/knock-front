import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetailTabsScreen } from '@/components/modules/assets/DetailTabsScreen';

export default function ProjectDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetailTabsScreen mode="project" id={id ?? ''} />;
}
