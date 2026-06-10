import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from './Text';
import { Colors, Spacing, Shadow, HEADER_HEIGHT, Radius } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = false, onBackPress, rightAction, style, transparent = false }: Props) {
  const insets = useSafeAreaInsets();
  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }, transparent ? styles.transparent : styles.solid, style]}>
      <View style={[styles.inner, { minHeight: HEADER_HEIGHT }]}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable onPress={handleBack} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel="חזרה" hitSlop={8}>
              <MaterialCommunityIcons name="arrow-right" size={22} color={transparent ? Colors.onPrimary : Colors.onBackground} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
        <View style={styles.center}>
          <AppText variant="headingMd" weight="bold" align="center" color={transparent ? 'onPrimary' : 'default'} numberOfLines={1}>{title}</AppText>
          {subtitle ? <AppText variant="bodySm" align="center" color={transparent ? 'onPrimary' : 'variant'} numberOfLines={1}>{subtitle}</AppText> : null}
        </View>
        <View style={styles.side}>{rightAction ?? <View style={styles.iconBtn} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 50, width: '100%' },
  solid: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, ...Shadow.sm },
  transparent: { backgroundColor: 'transparent' },
  inner: { flexDirection: RTL_ROW, alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  side: { width: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.surfaceVariant },
});
