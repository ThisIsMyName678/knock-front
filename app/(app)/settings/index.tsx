import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { DrawerMenu } from '@/components/ui/DrawerMenu';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

type SettingItem = { label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route?: string; danger?: boolean };

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
      { label: 'שפה ואזור', icon: 'translate' },
    ],
  },
  {
    title: 'מידע',
    items: [
      { label: 'מדיניות פרטיות', icon: 'shield-outline', route: '/(app)/settings/privacy' },
      { label: 'תקנון שימוש', icon: 'file-document-outline', route: '/(app)/settings/terms' },
      { label: 'יצירת קשר', icon: 'lifebuoy', route: '/(app)/settings/contact' },
    ],
  },
  {
    title: '',
    items: [
      { label: 'התנתקות', icon: 'logout', danger: true },
    ],
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setDrawerOpen(true)} style={styles.menuBtn} accessibilityRole="button" accessibilityLabel="תפריט ראשי">
          <MaterialCommunityIcons name="menu" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary" style={{ flex: 1, textAlign: 'right' }}>הגדרות</AppText>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-circle" size={40} color={Colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSm" weight="bold" color="onPrimary">מנהל נכסים</AppText>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>manager@knocknock.co.il</AppText>
        </View>
        <Pressable style={styles.editBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
        {SECTIONS.map((section, si) => (
          <View key={si} style={{ gap: 0 }}>
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
                  <MaterialCommunityIcons name={item.icon} size={20} color={item.danger ? Colors.error : Colors.primary} />
                  <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, color: item.danger ? Colors.error : Colors.onBackground }}>
                    {item.label}
                  </AppText>
                  {!item.danger && <MaterialCommunityIcons name="chevron-left" size={18} color={Colors.onSurfaceMuted} />}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <AppText variant="caption" color="muted" align="center" style={{ marginTop: Spacing.base }}>
          גרסה 1.0.0 · Knock Asset Management
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  profileCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.xl },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.sm },
  sectionLabel: { textAlign: 'right', paddingTop: Spacing.md, paddingBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
