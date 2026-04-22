// Re-export the AssetDetailsScreen we already built (connected to router)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AssetDetailsScreen } from '@/AssetDetailsScreen';
import { Colors, Spacing, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { AppText } from '@/components/ui/Text';

export default function AssetDetailRouteScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="חזרה">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="dots-vertical" size={24} color={Colors.onPrimary} />
        </Pressable>
      </View>
      <AssetDetailsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.sm, paddingTop: Spacing.xs,
    ...Shadow.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
