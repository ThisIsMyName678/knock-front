import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from './Text';
import { DrawerMenu } from './DrawerMenu';
import { Colors, Spacing, CONTENT_HORIZONTAL_PADDING, Shadow, Radius } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  title: string;
  subtitle?: string;
  subtitleNode?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
};

export function AppHeader({ title, subtitle, subtitleNode, showBack, onBack, showMenu }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const canGoBack = router.canGoBack();
  const showBackBtn = showBack === true || (showBack !== false && canGoBack);
  const handleBack = onBack ?? (() => router.back());

  return (
    <>
      <View style={styles.header}>
        <View style={styles.side}>
          {showMenu ? (
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="תפריט ראשי">
              <MaterialCommunityIcons name="menu" size={22} color={Colors.onBackground} />
            </Pressable>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        <View style={styles.titleContainer}>
          <AppText variant="headingMd" weight="bold" style={styles.title} numberOfLines={1}>{title}</AppText>
          {subtitleNode ?? (subtitle ? (
            <AppText variant="caption" color="variant" style={styles.subtitle} numberOfLines={1}>{subtitle}</AppText>
          ) : null)}
        </View>
        <View style={styles.side}>
          {showBackBtn ? (
            <Pressable onPress={handleBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="חזרה">
              <MaterialCommunityIcons name="arrow-right" size={22} color={Colors.onBackground} />
            </Pressable>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
      {showMenu && <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    ...Shadow.sm,
  },
  side: { width: 40, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.sm },
  title: { textAlign: 'center', color: Colors.onBackground },
  subtitle: { textAlign: 'center', marginTop: 2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center',
  },
  placeholder: { width: 40, height: 40 },
});
