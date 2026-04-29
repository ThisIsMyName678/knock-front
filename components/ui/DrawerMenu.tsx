import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, Shadow, FontFamily, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

// ─── Mock user data (matches Dashboard) ───────────────────────────────────────

const MOCK_USER = {
  name: 'ניר',
  role: 'מנהל נכסים',
  email: 'manager@knocknock.co.il',
};

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route?: string;
  onPress?: () => void;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'דשבורד', icon: 'view-dashboard-outline', route: '/(app)/' },
  { label: 'נכסים', icon: 'home-outline', route: '/(app)/assets-screens' },
  { label: 'משימות', icon: 'checkbox-marked-outline', route: '/(app)/tasks' },
  { label: 'חוזים', icon: 'file-sign', route: '/(app)/contracts' },
  { label: 'תשלומים', icon: 'cash-multiple', route: '/(app)/payments' },
  { label: 'מסמכים', icon: 'folder-outline', route: '/(app)/documents' },
  { label: 'אנשי קשר', icon: 'contacts-outline', route: '/(app)/contacts' },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { label: 'פרופיל והגדרות', icon: 'account-edit-outline', route: '/(app)/settings' },
  { label: 'מסלולי מנוי', icon: 'crown-outline', route: '/(app)/subscription' },
  { label: 'ייבוא נתונים', icon: 'database-import-outline', onPress: () => Alert.alert('ייבוא נתונים', 'פונקציית ייבוא נתונים בקרוב') },
  { label: 'עזרה ותמיכה', icon: 'lifebuoy', route: '/(app)/settings/help' },
];

const INFO_LINKS = [
  { label: 'מדיניות פרטיות', route: '/(app)/settings/privacy' },
  { label: 'תקנון שימוש', route: '/(app)/settings/terms' },
  { label: 'יצירת קשר', route: '/(app)/settings/contact' },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DrawerMenu({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [accountOpen, setAccountOpen] = useState(false);

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

  const panelWidth = Math.min(340, Dimensions.get('window').width * 0.82);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="סגור תפריט" />
        <View
          style={[
            styles.panel,
            {
              width: panelWidth,
              paddingTop: insets.top,
            },
          ]}
        >
          {/* ── Header ── */}
          <View style={styles.panelHeader}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account-circle" size={44} color={Colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSm" weight="bold" color="onPrimary">{MOCK_USER.name}</AppText>
              <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.85 }}>{MOCK_USER.role}</AppText>
              <AppText variant="caption" color="onPrimary" style={{ opacity: 0.65 }}>{MOCK_USER.email}</AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="סגור תפריט">
              <MaterialCommunityIcons name="close" size={22} color={Colors.onPrimary} />
            </Pressable>
          </View>

          {/* ── Scrollable body ── */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

            {/* Navigation */}
            <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>ניווט</AppText>
            <View style={styles.sectionCard}>
              {NAV_ITEMS.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && { backgroundColor: Colors.surfaceVariant },
                    i < NAV_ITEMS.length - 1 && styles.rowBorder,
                  ]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={Colors.primary} />
                  <AppText variant="bodyMd" style={styles.rowLabel}>{item.label}</AppText>
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </View>

            {/* Account — collapsible */}
            <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>חשבון</AppText>
            <View style={styles.sectionCard}>
              {/* Toggle row */}
              <Pressable
                onPress={() => setAccountOpen((v) => !v)}
                style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: Colors.surfaceVariant }]}
                accessibilityRole="button"
                accessibilityState={{ expanded: accountOpen }}
              >
                <MaterialCommunityIcons name="account-cog-outline" size={20} color={Colors.primary} />
                <AppText variant="bodyMd" style={styles.rowLabel}>ניהול חשבון</AppText>
                <MaterialCommunityIcons
                  name={accountOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.onSurfaceMuted}
                />
              </Pressable>

              {/* Expanded items */}
              {accountOpen && (
                <View style={styles.dropdownBody}>
                  {ACCOUNT_ITEMS.map((item, i) => (
                    <Pressable
                      key={item.label}
                      onPress={() => navigate(item)}
                      style={({ pressed }) => [
                        styles.dropdownRow,
                        pressed && { backgroundColor: Colors.surfaceVariant },
                        i < ACCOUNT_ITEMS.length - 1 && styles.rowBorder,
                      ]}
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcons name={item.icon} size={18} color={Colors.primary} style={{ opacity: 0.85 }} />
                      <AppText variant="bodyMd" style={styles.rowLabel}>{item.label}</AppText>
                      <MaterialCommunityIcons name="chevron-left" size={14} color={Colors.onSurfaceMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

          </ScrollView>

          {/* ── Footer: info text links + version ── */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={styles.footerLinks}>
              {INFO_LINKS.map((link, i) => (
                <React.Fragment key={link.label}>
                  {i > 0 && <AppText variant="caption" color="muted">·</AppText>}
                  <Pressable
                    onPress={() => { onClose(); setTimeout(() => router.push(link.route as any), 150); }}
                    accessibilityRole="link"
                  >
                    <AppText variant="caption" style={styles.footerLink}>{link.label}</AppText>
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
            <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>
              גרסה 1.0.0 · Knock
            </AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.background,
    ...Shadow.lg,
    maxWidth: '100%',
    flexDirection: 'column',
  },
  panelHeader: {
    flexDirection: RTL_ROW,
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
  scrollContent: {
    paddingBottom: Spacing.md,
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
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.regular,
    textAlign: 'right',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  dropdownBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    backgroundColor: Colors.surfaceVariant,
  },
  dropdownRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    paddingRight: Spacing.base + Spacing.lg,
  },
  footer: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    gap: Spacing.xs,
    backgroundColor: Colors.background,
  },
  footerLinks: {
    flexDirection: RTL_ROW,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  footerLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
