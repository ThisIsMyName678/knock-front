import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  FontFamily,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  bg: string;
};

function KpiCard({ label, value, sub, icon, color, bg }: KpiCardProps) {
  return (
    <View style={[styles.kpiCard]}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <AppText variant="displayMd" weight="extraBold" align="right" style={{ color }}>
        {value}
      </AppText>
      <AppText variant="bodyMd" weight="semiBold" align="right" color="default">
        {label}
      </AppText>
      {sub ? (
        <AppText variant="bodySm" color="variant" align="right">
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

type QuickLinkProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
};

function QuickLink({ label, icon, onPress }: QuickLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <View style={styles.quickLinkIcon}>
        <MaterialCommunityIcons name={icon} size={24} color={Colors.primary} />
      </View>
      <AppText variant="labelMd" weight="semiBold" align="center" numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

type ActivityItem = {
  id: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  title: string;
  time: string;
  badge?: { label: string; preset: React.ComponentProps<typeof Badge>['preset'] };
};

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: 'cash-check', color: Colors.success, title: 'תשלום התקבל — מגדלי הים', time: 'לפני 2 ש׳', badge: { label: '₪7,200', preset: 'success' } },
  { id: '2', icon: 'hammer-wrench', color: Colors.warning, title: 'קריאת שירות נפתחה — הרצל 10', time: 'לפני 5 ש׳', badge: { label: 'פתוח', preset: 'statusOpen' } },
  { id: '3', icon: 'file-sign', color: Colors.primary, title: 'חוזה חתום — דירה 4B', time: 'אתמול' },
  { id: '4', icon: 'account-plus', color: Colors.info, title: 'איש קשר חדש נוסף', time: 'לפני יומיים' },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            שלום, מנהל 👋
          </AppText>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>
            סקירת יום — {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/notifications')}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="התראות"
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.onPrimary} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        {/* KPI Row */}
        <View style={styles.section}>
          <AppText variant="headingSm" weight="bold" style={styles.sectionTitle}>
            סקירה כללית
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -CONTENT_HORIZONTAL_PADDING }}>
            <View style={styles.kpiRow}>
              <KpiCard label="פרויקטים" value="12" sub="+2 החודש" icon="briefcase" color={Colors.primary} bg={Colors.primaryContainer} />
              <KpiCard label="נכסים" value="47" sub="3 פנויים" icon="home-city" color={Colors.success} bg={Colors.successContainer} />
              <KpiCard label="תשלומים" value="₪84K" sub="חודש שוטף" icon="cash-multiple" color={Colors.warning} bg={Colors.warningContainer} />
              <KpiCard label="משימות פתוחות" value="8" icon="checkbox-outline" color={Colors.error} bg={Colors.errorContainer} />
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <AppText variant="headingSm" weight="bold" style={styles.sectionTitle}>
            פעולות מהירות
          </AppText>
          <View style={styles.quickLinksGrid}>
            <QuickLink label="פרויקט חדש" icon="briefcase-plus-outline" onPress={() => router.push('/(app)/projects/new')} />
            <QuickLink label="נכס חדש" icon="home-plus-outline" onPress={() => router.push('/(app)/assets-screens/new')} />
            <QuickLink label="חוזה חדש" icon="file-sign" onPress={() => router.push('/(app)/contracts/new')} />
            <QuickLink label="תשלום חדש" icon="cash-plus" onPress={() => router.push('/(app)/payments/new')} />
            <QuickLink label="משימה חדשה" icon="clipboard-plus-outline" onPress={() => router.push('/(app)/tasks/new')} />
            <QuickLink label="מסמך חדש" icon="file-upload-outline" onPress={() => router.push('/(app)/documents/new')} />
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="headingSm" weight="bold">
              פעילות אחרונה
            </AppText>
            <Pressable onPress={() => {}} accessibilityRole="button">
              <AppText variant="bodySm" color="primary" weight="semiBold">
                הצג הכל
              </AppText>
            </Pressable>
          </View>

          <Card style={styles.activityCard}>
            {MOCK_ACTIVITY.map((item, i) => (
              <View key={item.id}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: `${item.color}18` }]}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <AppText variant="bodyMd" weight="semiBold" numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="bodySm" color="muted">
                      {item.time}
                    </AppText>
                  </View>
                  {item.badge ? (
                    <Badge label={item.badge.label} preset={item.badge.preset} />
                  ) : null}
                </View>
                {i < MOCK_ACTIVITY.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="headingSm" weight="bold">
              משימות קרובות
            </AppText>
            <Pressable onPress={() => router.push('/(app)/tasks')} accessibilityRole="button">
              <AppText variant="bodySm" color="primary" weight="semiBold">
                הצג הכל
              </AppText>
            </Pressable>
          </View>

          {[
            { id: 't1', title: 'בדיקת מד מים — מגדלי הים', due: 'מחר', priority: 'high' },
            { id: 't2', title: 'חידוש חוזה — דירה 7A', due: 'בעוד 3 ימים', priority: 'medium' },
            { id: 't3', title: 'ישיבת ועד בית — הרצל 10', due: 'בעוד שבוע', priority: 'low' },
          ].map((task) => (
            <Card
              key={task.id}
              onPress={() => router.push(`/(app)/tasks/${task.id}`)}
              style={styles.taskCard}
            >
              <View style={styles.taskRow}>
                <MaterialCommunityIcons
                  name="checkbox-blank-circle-outline"
                  size={20}
                  color={
                    task.priority === 'high'
                      ? Colors.error
                      : task.priority === 'medium'
                        ? Colors.warning
                        : Colors.onSurfaceMuted
                  }
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" weight="semiBold" numberOfLines={1}>
                    {task.title}
                  </AppText>
                  <AppText variant="bodySm" color="variant">
                    {task.due}
                  </AppText>
                </View>
                <MaterialCommunityIcons name="chevron-left" size={20} color={Colors.onSurfaceMuted} />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
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
  headerRight: { gap: 2 },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  content: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.xl,
  },
  section: { gap: Spacing.md },
  sectionTitle: { textAlign: 'right' },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  kpiCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickLinksGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickLink: {
    width: '30%',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexGrow: 1,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: { gap: 0, padding: 0, overflow: 'hidden' },
  activityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: Colors.outlineLight, marginHorizontal: Spacing.md },
  taskCard: { marginBottom: 0 },
  taskRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
