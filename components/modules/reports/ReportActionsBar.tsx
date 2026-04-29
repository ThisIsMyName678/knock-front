import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info';

const TONE_MAP: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: Colors.primary, bg: Colors.primaryContainer },
  success: { fg: Colors.success, bg: Colors.successContainer },
  warning: { fg: Colors.warning, bg: Colors.warningContainer },
  error: { fg: Colors.error, bg: Colors.errorContainer },
  info: { fg: Colors.info, bg: Colors.infoContainer },
};

type ActionItem = {
  id: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  tone: Tone;
  onPress: () => void;
  /** show small dot when feature is "active" (e.g., auto-report enabled) */
  active?: boolean;
};

type Props = {
  onClear: () => void;
  onShare: () => void;
  onEmail: () => void;
  onSave: () => void;
  onAuto: () => void;
  autoActive?: boolean;
};

export function ReportActionsBar({
  onClear,
  onShare,
  onEmail,
  onSave,
  onAuto,
  autoActive = false,
}: Props) {
  const actions: ActionItem[] = [
    { id: 'clear', icon: 'broom', label: 'ניקוי', tone: 'error', onPress: onClear },
    { id: 'share', icon: 'share-variant-outline', label: 'שיתוף', tone: 'info', onPress: onShare },
    { id: 'email', icon: 'email-outline', label: 'מייל', tone: 'primary', onPress: onEmail },
    { id: 'save', icon: 'content-save-outline', label: 'שמור', tone: 'success', onPress: onSave },
    {
      id: 'auto',
      icon: 'clock-outline',
      label: 'אוטומטי',
      tone: 'warning',
      onPress: onAuto,
      active: autoActive,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {actions.map((a) => {
        const c = TONE_MAP[a.tone];
        return (
          <Pressable
            key={a.id}
            onPress={a.onPress}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>
              <MaterialCommunityIcons name={a.icon} size={20} color={c.fg} />
              {a.active ? <View style={styles.activeDot} /> : null}
            </View>
            <AppText variant="caption" weight="semiBold" align="center">
              {a.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: RTL_ROW,
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  action: {
    width: 72,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
  },
  actionPressed: { opacity: 0.7 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
