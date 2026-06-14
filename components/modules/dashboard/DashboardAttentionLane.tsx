import React from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Spacing, Radius, Shadow, FontFamily, FontSize } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import type { TasksDashboardPreset } from '@/lib/mocks/dashboard';

type Props = {
  payments7d: number;
  taskCounts: { newCount: number; inProgressCount: number; totalOpen: number };
  onPaymentsPress: () => void;
  onTasksPreset: (preset: TasksDashboardPreset) => void;
};

export function DashboardAttentionLane({ payments7d, taskCounts, onPaymentsPress, onTasksPreset }: Props) {
  const remainder = Math.max(taskCounts.totalOpen - taskCounts.newCount - taskCounts.inProgressCount, 0);
  return (
    <View style={styles.wrap}>
      <AppText style={styles.eyebrow}>דורש טיפול</AppText>
      <View style={styles.row}>
        <Pressable onPress={onPaymentsPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
          <View style={[styles.rail, { backgroundColor: Colors.warning }]} />
          <View style={styles.cardBody}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color={Colors.warning} />
            <AppText variant="labelMd" weight="bold">תשלומים (7 ימים)</AppText>
            <Text style={styles.cardValue} allowFontScaling={false}>
              {payments7d}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={() => onTasksPreset('total_open')} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
          <View style={[styles.rail, { backgroundColor: Colors.accent }]} />
          <View style={styles.cardBody}>
            <MaterialCommunityIcons name="format-list-checks" size={22} color={Colors.accent} />
            <AppText variant="labelMd" weight="bold">משימות פתוחות</AppText>
            <View style={styles.pipeline}>
              {taskCounts.newCount > 0 && <View style={[styles.seg, { flex: taskCounts.newCount, backgroundColor: Colors.statusOpen }]} />}
              {taskCounts.inProgressCount > 0 && <View style={[styles.seg, { flex: taskCounts.inProgressCount, backgroundColor: Colors.accent }]} />}
              <View style={[styles.seg, { flex: remainder || 1, backgroundColor: Colors.surfaceVariant }]} />
            </View>
            <AppText variant="caption" color="muted">חדשות {taskCounts.newCount} · בתהליך {taskCounts.inProgressCount} · סה״כ {taskCounts.totalOpen}</AppText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  eyebrow: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.onSurfaceMuted, textAlign: 'right', letterSpacing: 1, textTransform: 'uppercase' },
  row: { gap: Spacing.md },
  card: { flexDirection: RTL_ROW, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.outlineLight, overflow: 'hidden', ...Shadow.sm },
  rail: { width: 4, alignSelf: 'stretch' },
  cardBody: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg + 4,
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  cardValue: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * 1.35,
    color: Colors.onBackground,
    textAlign: 'right',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  pipeline: { flexDirection: RTL_ROW, height: 8, borderRadius: 4, overflow: 'hidden', width: '100%', backgroundColor: Colors.surfaceVariant },
  seg: { minWidth: 4 },
  pressed: { opacity: 0.92 },
});
