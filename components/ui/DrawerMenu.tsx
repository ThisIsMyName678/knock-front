import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, Shadow, FontFamily, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

type NavItem = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route?: string;
  onPress?: () => void;
  danger?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'דשבורד', icon: 'view-dashboard-outline', route: '/(app)/' },
  { label: 'פרויקטים', icon: 'briefcase-outline', route: '/(app)/projects' },
  { label: 'נכסים', icon: 'home-outline', route: '/(app)/assets-screens' },
  { label: 'משימות', icon: 'checkbox-marked-outline', route: '/(app)/tasks' },
  { label: 'חוזים', icon: 'file-sign', route: '/(app)/contracts' },
  { label: 'תשלומים', icon: 'cash-multiple', route: '/(app)/payments' },
  { label: 'מסמכים', icon: 'folder-outline', route: '/(app)/documents' },
  { label: 'אנשי קשר', icon: 'contacts-outline', route: '/(app)/contacts' },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'פרופיל', icon: 'account-edit-outline', route: '/(app)/settings' },
  { label: 'הגדרות חשבון', icon: 'cog-outline', route: '/(app)/settings' },
  { label: 'ייבוא נתונים', icon: 'database-import-outline', onPress: () => Alert.alert('ייבוא נתונים', 'פונקציית ייבוא נתונים בקרוב') },
];

const INFO_ITEMS: NavItem[] = [
  { label: 'מדיניות פרטיות', icon: 'shield-outline', route: '/(app)/settings/privacy' },
  { label: 'תקנון שימוש', icon: 'file-document-outline', route: '/(app)/settings/terms' },
  { label: 'יצירת קשר', icon: 'lifebuoy', route: '/(app)/settings/contact' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DrawerMenu({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const navigate = useCallback(
    (item: NavItem) => {
      onClose();
      if (item.onPress) {
        setTimeout(item.onPress, 300);
        return;
      }
      if (item.route) {
        setTimeout(() => router.push(item.route as any), 150);
      }
    },
    [onClose],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.panel, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account-circle" size={44} color={Colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSm" weight="bold" color="onPrimary">מנהל נכסים</AppText>
              <AppText variant="caption" color="onPrimary" style={{ opacity: 0.8 }}>manager@knocknock.co.il</AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="סגור תפריט">
              <MaterialCommunityIcons name="close" size={22} color={Colors.onPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Navigation */}
            <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>ניווט</AppText>
            <View style={styles.sectionCard}>
              {NAV_ITEMS.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item)}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: Colors.surfaceVariant }, i < NAV_ITEMS.length - 1 && styles.rowBorder]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={Colors.primary} />
                  <AppText variant="bodyMd" style={{ flex: 1, fontFamily: FontFamily.regular, textAlign: 'right' }}>{item.label}</AppText>
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </View>

            {/* Account */}
            <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>חשבון</AppText>
            <View style={styles.sectionCard}>
              {ACCOUNT_ITEMS.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item)}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: Colors.surfaceVariant }, i < ACCOUNT_ITEMS.length - 1 && styles.rowBorder]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={Colors.primary} />
                  <AppText variant="bodyMd" style={{ flex: 1, fontFamily: FontFamily.regular, textAlign: 'right' }}>{item.label}</AppText>
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </View>

            {/* Info */}
            <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>מידע</AppText>
            <View style={styles.sectionCard}>
              {INFO_ITEMS.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item)}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: Colors.surfaceVariant }, i < INFO_ITEMS.length - 1 && styles.rowBorder]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={Colors.primary} />
                  <AppText variant="bodyMd" style={{ flex: 1, fontFamily: FontFamily.regular, textAlign: 'right' }}>{item.label}</AppText>
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </View>

            {/* Logout */}
            <View style={[styles.sectionCard, { marginTop: Spacing.sm }]}>
              <Pressable
                onPress={() => { onClose(); Alert.alert('התנתקות', 'האם אתה בטוח?'); }}
                style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: Colors.surfaceVariant }]}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
                <AppText variant="bodyMd" style={{ flex: 1, fontFamily: FontFamily.regular, textAlign: 'right', color: Colors.error }}>התנתקות</AppText>
              </Pressable>
            </View>

            <AppText variant="caption" color="muted" style={{ textAlign: 'center', marginTop: Spacing.xl }}>
              גרסה 1.0.0 · Knock
            </AppText>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panel: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: Colors.background,
    ...Shadow.lg,
    flex: 1,
  },
  panelHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    textAlign: 'right',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    color: Colors.onSurfaceMuted,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
