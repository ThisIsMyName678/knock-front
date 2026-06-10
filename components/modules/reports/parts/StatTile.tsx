import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Tone = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

const TONE_MAP: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: Colors.primary, bg: Colors.primaryContainer },
  success: { fg: Colors.success, bg: Colors.successContainer },
  error: { fg: Colors.error, bg: Colors.errorContainer },
  warning: { fg: Colors.warning, bg: Colors.warningContainer },
  info: { fg: Colors.info, bg: Colors.infoContainer },
  neutral: { fg: Colors.onSurfaceVariant, bg: Colors.surfaceVariant },
};

type Props = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  subValue?: string;
  tone?: Tone;
  style?: ViewStyle;
};

export function StatTile({ icon, label, value, subValue, tone = 'primary', style }: Props) {
  const colors = TONE_MAP[tone];
  return (
    <View style={[styles.tile, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.fg} />
      </View>
      <View style={styles.body}>
        <AppText variant="labelSm" color="variant" numberOfLines={1}>{label}</AppText>
        <AppText variant="headingMd" weight="bold" numberOfLines={1}>{value}</AppText>
        {subValue ? (
          <AppText variant="caption" color="muted" numberOfLines={1}>{subValue}</AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
