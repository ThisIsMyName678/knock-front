import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING, MIN_TOUCH } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { useAuth } from '@/lib/auth';

type SettingItem = { label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route?: string };

const SECTIONS: { title: string; items: SettingItem[] }[] = [
  {
    title: 'חשבון',
    items: [
      { label: 'עריכת פרופיל', icon: 'account-edit-outline', route: '/(app)/settings/profile-edit' },
      { label: 'מסלולי מנוי', icon: 'crown-outline', route: '/(app)/subscription' },
    ],
  },
  {
    title: 'אפליקציה',
    items: [
      { label: 'הגדרות התראות', icon: 'bell-cog-outline', route: '/(app)/settings/notifications' },
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { backendUser, user, signOut } = useAuth();
  const userMetadata = backendUser?.userMetadata ?? user?.user_metadata;
  const displayName = resolveDisplayName(userMetadata, backendUser?.email ?? user?.email);
  const displayEmail = backendUser?.email ?? user?.email ?? 'לא הוגדר אימייל';
  const displayRole = backendUser?.role ?? 'משתמש';

  const onLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="פרופיל" showMenu />

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-circle" size={40} color={Colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSm" weight="bold">{displayName}</AppText>
          <AppText variant="bodySm" color="variant">{displayRole}</AppText>
          <AppText variant="caption" color="muted">{displayEmail}</AppText>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/settings/profile-edit')}
          style={styles.editBtn}
          accessibilityRole="button"
          accessibilityLabel="עריכת פרופיל"
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.onSurfaceVariant} />
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
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Shadow.sm,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.sm },
  sectionLabel: { textAlign: 'right', paddingTop: Spacing.md, paddingBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.outlineLight, overflow: 'hidden', ...Shadow.sm },
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

function resolveDisplayName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  const candidateKeys = ['full_name', 'name', 'display_name', 'given_name'];

  for (const key of candidateKeys) {
    const value = metadata?.[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return email?.split('@')[0] || 'משתמש';
}
