import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function ProjectDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const stats = [
    { label: 'נכסים', value: '12', icon: 'home-outline' as const, color: Colors.primary, bg: Colors.primaryContainer },
    { label: 'חוזים פעילים', value: '9', icon: 'file-sign' as const, color: Colors.success, bg: Colors.successContainer },
    { label: 'תשלומים', value: '₪84K', icon: 'cash-multiple' as const, color: Colors.warning, bg: Colors.warningContainer },
    { label: 'קריאות שירות', value: '3', icon: 'hammer-wrench' as const, color: Colors.error, bg: Colors.errorContainer },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="חזרה">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="headingMd" weight="bold" color="onPrimary" numberOfLines={1}>
            מגדלי הים
          </AppText>
        </View>
        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="אפשרויות">
          <MaterialCommunityIcons name="dots-vertical" size={24} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <Card>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconBig}>
              <MaterialCommunityIcons name="city-variant-outline" size={32} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headingLg" weight="bold" color="primary">
                מגדלי הים
              </AppText>
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.onSurfaceVariant} />
                <AppText variant="bodySm" color="variant">
                  הרצל 10, תל אביב
                </AppText>
              </View>
            </View>
            <Badge label="פעיל" preset="success" />
          </View>
        </Card>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
              </View>
              <AppText variant="headingMd" weight="extraBold" style={{ color: s.color }}>
                {s.value}
              </AppText>
              <AppText variant="bodySm" color="variant">
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <AppText variant="headingSm" weight="bold" style={styles.sectionTitle}>
            ניהול
          </AppText>
          {[
            { label: 'נכסים', icon: 'home-outline', route: '/(app)/assets-screens' },
            { label: 'חוזים', icon: 'file-sign', route: '/(app)/contracts' },
            { label: 'תשלומים', icon: 'cash-multiple', route: '/(app)/payments' },
            { label: 'תחזוקה', icon: 'hammer-wrench', route: '/(app)/tasks' },
            { label: 'מסמכים', icon: 'folder-outline', route: '/(app)/documents' },
            { label: 'אנשי קשר', icon: 'account-group-outline', route: '/(app)/contacts' },
          ].map((link) => (
            <Pressable
              key={link.label}
              onPress={() => router.push(link.route as any)}
              style={({ pressed }) => [styles.linkRow, pressed && { backgroundColor: Colors.surfaceVariant }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name={link.icon as any} size={20} color={Colors.primary} />
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1 }}>
                {link.label}
              </AppText>
              <MaterialCommunityIcons name="chevron-left" size={20} color={Colors.onSurfaceMuted} />
            </Pressable>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  infoHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md },
  infoIconBig: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'flex-end',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  linkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
});
