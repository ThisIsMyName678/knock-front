import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function NewContactPickerScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">
          הוספת איש קשר
        </AppText>
        <View style={styles.iconBtn} />
      </View>
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <AppText variant="bodyMd" color="variant" style={{ textAlign: 'right', marginBottom: Spacing.lg }}>
          בחרו סוג איש קשר להמשך:
        </AppText>
        <Pressable onPress={() => router.push('/(app)/contacts/new-role')} style={styles.choice} accessibilityRole="button">
          <MaterialCommunityIcons name="badge-account-horizontal-outline" size={36} color={Colors.primary} />
          <AppText variant="headingSm" weight="bold" style={{ marginTop: Spacing.sm }}>
            הוספת בעל תפקיד
          </AppText>
          <AppText variant="bodySm" color="muted" align="center" style={{ marginTop: Spacing.xs }}>
            כינוי, פרטים והרשאות מפורטות לנכס או פרויקט
          </AppText>
        </Pressable>
        <Pressable onPress={() => router.push('/(app)/contacts/new-tenant')} style={styles.choice} accessibilityRole="button">
          <MaterialCommunityIcons name="home-account" size={36} color={Colors.primary} />
          <AppText variant="headingSm" weight="bold" style={{ marginTop: Spacing.sm }}>
            הוספת שוכר / רוכש
          </AppText>
          <AppText variant="bodySm" color="muted" align="center" style={{ marginTop: Spacing.xs }}>
            שוכר או רוכש עם הרשאות מותאמות (למשל קריאות תחזוקה)
          </AppText>
        </Pressable>
      </View>
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
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.lg, gap: Spacing.md },
  choice: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
});
