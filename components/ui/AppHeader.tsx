import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from './Text';
import { DrawerMenu } from './DrawerMenu';
import { Colors, Spacing, CONTENT_HORIZONTAL_PADDING, Shadow } from '@/constants/tokens';

type Props = {
  title: string;
  subtitle?: string;
  /** Custom subtitle node — replaces the plain text subtitle when provided */
  subtitleNode?: React.ReactNode;
  /** Show back button — auto-detected via router.canGoBack() when omitted */
  showBack?: boolean;
  onBack?: () => void;
  /** Show hamburger menu (also manages the DrawerMenu internally) */
  showMenu?: boolean;
};

/**
 * Unified app header — consistent across all screens.
 *
 * RTL layout (flexDirection: row-reverse):
 *   RIGHT : hamburger menu (when showMenu)
 *   CENTER: title + optional subtitle
 *   LEFT  : back arrow (when showBack or router.canGoBack())
 */
export function AppHeader({ title, subtitle, subtitleNode, showBack, onBack, showMenu }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canGoBack = router.canGoBack();
  const showBackBtn = showBack === true || (showBack !== false && canGoBack);

  const handleBack = onBack ?? (() => router.back());

  return (
    <>
      <View style={styles.header}>
        {/* RIGHT (first in row-reverse) — hamburger or placeholder */}
        <View style={styles.side}>
          {showMenu ? (
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="תפריט ראשי"
            >
              <MaterialCommunityIcons name="menu" size={24} color={Colors.onPrimary} />
            </Pressable>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* CENTER — title + subtitle */}
        <View style={styles.titleContainer}>
          <AppText
            variant="headingMd"
            weight="bold"
            color="onPrimary"
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {subtitleNode ?? (subtitle ? (
            <AppText variant="caption" color="onPrimary" style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null)}
        </View>

        {/* LEFT (last in row-reverse) — back arrow or placeholder */}
        <View style={styles.side}>
          {showBackBtn ? (
            <Pressable
              onPress={handleBack}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="חזרה"
            >
              <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
            </Pressable>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>

      {showMenu && (
        <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    ...Shadow.md,
  },
  side: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});
