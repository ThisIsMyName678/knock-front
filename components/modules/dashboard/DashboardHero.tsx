import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { DrawerMenu } from '@/components/ui/DrawerMenu';
import { NotificationsPanel } from '@/components/ui/NotificationsPanel';
import { Colors, Spacing, Radius, Shadow, FontFamily, FontSize, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { useNotificationsBadge } from '@/lib/notifications-badge';
import type { TasksDashboardPreset } from '@/lib/mocks/dashboard';
import type { BackendDashboardSummary } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth';
import { resolveFirstName } from '@/lib/user-display-name';

type Props = {
  payments7d: number;
  taskCounts: BackendDashboardSummary;
  assetsXY: { rented: number; total: number };
  dateLabel: string;
  onPaymentsPress: () => void;
  onTasksPreset: (preset: TasksDashboardPreset) => void;
  onAssetsPress: () => void;
};

export function DashboardHero(props: Props) {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { count: notificationsCount, markSeen } = useNotificationsBadge();
  const { backendUser, user } = useAuth();
  const firstName = resolveFirstName({
    profileDisplayName: backendUser?.profile?.displayName,
    userMetadata: backendUser?.userMetadata ?? user?.user_metadata,
    email: backendUser?.email ?? user?.email,
  });
  const occupancyPct = props.assetsXY.total > 0 ? Math.round((props.assetsXY.rented / props.assetsXY.total) * 100) : 0;

  return (
    <>
      <View style={[styles.hero, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <AppText style={styles.greeting}>שלום, {firstName} 👋</AppText>
            <AppText variant="bodyMd" color="variant" style={styles.dateLine}>{props.dateLabel}</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setNotificationsOpen(true)} style={styles.menuBtn} accessibilityRole="button" accessibilityLabel="התראות">
              <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.onBackground} />
              {notificationsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <AppText variant="caption" color="white" weight="bold" style={styles.notificationBadgeText}>
                    {notificationsCount}
                  </AppText>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.menuBtn} accessibilityRole="button" accessibilityLabel="תפריט ראשי">
              <MaterialCommunityIcons name="menu" size={22} color={Colors.onBackground} />
            </Pressable>
          </View>
        </View>
        <Pressable onPress={props.onPaymentsPress} style={({ pressed }) => [styles.primaryMetric, pressed && styles.pressed]} accessibilityRole="button">
          <AppText style={styles.metricEyebrow}>תשלומים בשבוע הקרוב</AppText>
          <View style={styles.metricValueWrap}>
            <Text style={styles.metricValue} allowFontScaling={false}>
              {props.payments7d}
            </Text>
          </View>
        </Pressable>
        <View style={styles.secondaryStrip}>
          <View style={styles.tasksStrip}>
            <AppText style={styles.stripLabel}>משימות</AppText>
            <View style={styles.tasksRow}>
              <Pressable onPress={() => props.onTasksPreset('open')} style={styles.taskCell} hitSlop={6}>
                <AppText style={styles.taskNum}>{props.taskCounts.openCount}</AppText>
                <AppText variant="caption" color="muted">פתוחות</AppText>
              </Pressable>
              <View style={styles.taskDivider} />
              <Pressable onPress={() => props.onTasksPreset('in_progress')} style={styles.taskCell} hitSlop={6}>
                <AppText style={styles.taskNum}>{props.taskCounts.inProgressCount}</AppText>
                <AppText variant="caption" color="muted">בטיפול</AppText>
              </Pressable>
              <View style={styles.taskDivider} />
              <Pressable onPress={() => props.onTasksPreset('total_open')} style={styles.taskCell} hitSlop={6}>
                <AppText style={styles.taskNum}>{props.taskCounts.total}</AppText>
                <AppText variant="caption" color="muted">סה״כ</AppText>
              </Pressable>
              <View style={styles.taskDivider} />
              <Pressable onPress={() => props.onTasksPreset('overdue')} style={styles.taskCell} hitSlop={6}>
                <AppText style={[styles.taskNum, styles.taskNumOverdue]}>{props.taskCounts.overdueCount}</AppText>
                <AppText variant="caption" color="muted">באיחור</AppText>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={props.onAssetsPress} style={({ pressed }) => [styles.miniCard, pressed && styles.pressed]} accessibilityRole="button">
            <MaterialCommunityIcons name="home-city-outline" size={18} color={Colors.success} />
            <AppText variant="labelSm" weight="semiBold">נכסים/נכסים מושכרים</AppText>
            <AppText style={styles.miniCardValue}>{props.assetsXY.rented}/{props.assetsXY.total}</AppText>
            <View style={styles.occupancyTrack}><View style={[styles.occupancyFill, { width: `${occupancyPct}%` }]} /></View>
          </Pressable>
        </View>
      </View>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <NotificationsPanel
        visible={notificationsOpen}
        newIndicatorCount={notificationsCount}
        onIndicatorSeen={() => void markSeen()}
        onClose={() => {
          setNotificationsOpen(false);
          void markSeen();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius['2xl'],
    borderBottomRightRadius: Radius['2xl'],
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    ...Shadow.md,
  },
  heroTop: { flexDirection: RTL_ROW, alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  heroCopy: { flex: 1, gap: 4 },
  greeting: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * 1.25,
    color: Colors.onBackground,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  dateLine: { textAlign: 'right' },
  headerActions: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm },
  menuBtn: { width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: { fontSize: 10, lineHeight: 12 },
  primaryMetric: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  metricEyebrow: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.onSurfaceMuted,
    textAlign: 'right',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  metricValueWrap: {
    minHeight: 72,
    justifyContent: 'center',
    overflow: 'visible',
  },
  metricValue: {
    fontFamily: FontFamily.extraBold,
    fontSize: 52,
    lineHeight: Platform.OS === 'ios' ? 62 : 68,
    color: Colors.onBackground,
    textAlign: 'right',
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : {}),
  },
  secondaryStrip: { flexDirection: RTL_ROW, gap: Spacing.sm, alignItems: 'stretch' },
  tasksStrip: { flex: 2.4, backgroundColor: Colors.background, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineLight, padding: Spacing.sm, gap: Spacing.sm },
  stripLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.onSurfaceVariant, textAlign: 'right' },
  tasksRow: { flexDirection: RTL_ROW, justifyContent: 'space-between', alignItems: 'center' },
  taskCell: { alignItems: 'center', flex: 1, gap: 2, paddingHorizontal: 0 },
  taskNum: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.onBackground },
  taskNumOverdue: { color: Colors.error },
  taskDivider: { width: 1, height: 32, backgroundColor: Colors.outlineLight },
  miniCard: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineLight, padding: Spacing.md, gap: 4, alignItems: 'flex-end' },
  miniCardValue: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.onBackground },
  occupancyTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: Colors.surfaceVariant, overflow: 'hidden', marginTop: 2 },
  occupancyFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  pressed: { opacity: 0.9 },
});
