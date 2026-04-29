import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING, MIN_TOUCH } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type SettingItem = { label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route?: string };

const SECTIONS: { title: string; items: SettingItem[] }[] = [
  {
    title: 'חשבון',
    items: [
      { label: 'עריכת פרופיל', icon: 'account-edit-outline' },
      { label: 'שינוי סיסמה', icon: 'lock-reset' },
      { label: 'מסלולי מנוי', icon: 'crown-outline', route: '/(app)/subscription' },
    ],
  },
  {
    title: 'אפליקציה',
    items: [
      { label: 'הגדרות התראות', icon: 'bell-cog-outline', route: '/(app)/settings/notifications' },
      { label: 'דוחות', icon: 'file-chart-outline', route: '/(app)/reports' },
      { label: 'שפה ואזור', icon: 'translate' },
    ],
  },
  {
    title: 'מידע',
    items: [
      { label: 'עזרה ותמיכה', icon: 'lifebuoy', route: '/(app)/settings/help' },
      { label: 'מדיניות פרטיות', icon: 'shield-outline', route: '/(app)/settings/privacy' },
      { label: 'תקנון שימוש', icon: 'file-document-outline', route: '/(app)/settings/terms' },
      { label: 'יצירת קשר', icon: 'email-outline', route: '/(app)/settings/contact' },
    ],
  },
];

const MOCK_USER = { name: 'ניר', role: 'מנהל נכסים', email: 'manager@knocknock.co.il' };

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const onLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'התנתק', style: 'destructive', onPress: () => router.replace('/(auth)/login') },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="פרופיל" showMenu />

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-circle" size={40} color={Colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSm" weight="bold" color="onPrimary">{MOCK_USER.name}</AppText>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.85 }}>{MOCK_USER.role}</AppText>
          <AppText variant="caption" color="onPrimary" style={{ opacity: 0.65 }}>{MOCK_USER.email}</AppText>
        </View>
        <Pressable style={styles.editBtn} accessibilityRole="button" accessibilityLabel="עריכת פרופיל">
          <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section, si) => (
          <View key={si}>
            {section.title ? (
              <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
                {section.title}
              </AppText>
            ) : null}
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => { if (item.route) router.push(item.route as any); }}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surfaceVariant }, i < section.items.length - 1 && styles.rowBorder]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={Colors.primary} />
                  <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1 }}>
                    {item.label}
                  </AppText>
                  <MaterialCommunityIcons name="chevron-left" size={18} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.82 }]}
          accessibilityRole="button"
          accessibilityLabel="התנתקות"
        >
          <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
          <AppText variant="bodyMd" weight="bold" style={{ color: Colors.error }}>
            התנתקות
          </AppText>
        </Pressable>

        <AppText variant="caption" color="muted" align="center" style={{ marginTop: Spacing.sm }}>
          גרסה 1.0.0 · Knock Asset Management
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  profileCard: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.lg,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.sm },
  sectionLabel: { textAlign: 'right', paddingTop: Spacing.md, paddingBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  row: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  logoutBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TOUCH,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: Colors.errorContainer,
    paddingVertical: Spacing.md,
  },
});
