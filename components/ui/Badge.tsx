import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './Text';
import { Colors, Radius, Spacing } from '@/constants/tokens';

type Preset =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'info'
  | 'statusOpen'
  | 'statusInProgress'
  | 'statusClosed'
  | 'statusCancelled';

type Props = {
  label: string;
  preset?: Preset;
  outlined?: boolean;
  style?: ViewStyle;
};

type BadgeStyle = { bg: string; text: string; border: string };

const presets: Record<Preset, BadgeStyle> = {
  primary: { bg: Colors.accentMuted, text: Colors.accent, border: Colors.accent },
  success: { bg: Colors.successContainer, text: Colors.success, border: Colors.success },
  warning: { bg: Colors.warningContainer, text: Colors.warning, border: Colors.warning },
  error: { bg: Colors.errorContainer, text: Colors.error, border: Colors.error },
  neutral: { bg: Colors.surfaceVariant, text: Colors.onSurfaceVariant, border: Colors.outline },
  info: { bg: Colors.infoContainer, text: Colors.info, border: Colors.info },
  statusOpen: { bg: Colors.statusOpenBg, text: Colors.statusOpen, border: Colors.statusOpen },
  statusInProgress: { bg: Colors.statusInProgressBg, text: Colors.statusInProgress, border: Colors.statusInProgress },
  statusClosed: { bg: Colors.statusClosedBg, text: Colors.statusClosed, border: Colors.statusClosed },
  statusCancelled: { bg: Colors.statusCancelledBg, text: Colors.statusCancelled, border: Colors.statusCancelled },
};

export function Badge({ label, preset = 'neutral', outlined = false, style }: Props) {
  const p = presets[preset];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: outlined ? 'transparent' : p.bg, borderColor: p.border },
        style,
      ]}
    >
      <AppText
        variant="labelSm"
        weight="semiBold"
        style={{ color: p.text, fontFamily: undefined }}
        align="center"
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
