import React from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

// דוגמא בלבד — נתוני דמה, ללא לוגיקה אמיתית
type DummyNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  unread: boolean;
};

const DUMMY_NOTIFICATIONS: DummyNotification[] = [
  { id: '1', title: 'תשלום התקבל', description: 'דניאל כהן שילם 3,500 ₪ עבור דירה 4', time: 'לפני 10 דק׳', icon: 'cash-check', unread: true },
  { id: '2', title: 'משימה חדשה הוקצתה לך', description: 'תיקון נזילה בנכס רחוב הרצל 12', time: 'לפני שעה', icon: 'checkbox-marked-outline', unread: true },
  { id: '3', title: 'חוזה עומד לפוג', description: 'חוזה השכירות של משפחת לוי יסתיים בעוד 14 יום', time: 'לפני 3 שעות', icon: 'file-sign', unread: true },
  { id: '4', title: 'מסמך הועלה', description: 'אישור ביטוח נוסף לנכס שדרות בן גוריון 8', time: 'אתמול', icon: 'folder-outline', unread: false },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="סגור התראות" />
        <View style={[styles.panel, { top: insets.top + 56 }]}>
          <View style={styles.panelHeader}>
            <AppText variant="headingSm" weight="bold">התראות</AppText>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="סגור">
              <MaterialCommunityIcons name="close" size={18} color={Colors.onBackground} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {DUMMY_NOTIFICATIONS.map((item, i) => (
              <View
                key={item.id}
                style={[styles.row, i < DUMMY_NOTIFICATIONS.length - 1 && styles.rowBorder]}
              >
                <View style={[styles.iconWrap, item.unread && styles.iconWrapUnread]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={item.unread ? Colors.accent : Colors.onSurfaceMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" weight={item.unread ? 'bold' : 'regular'}>{item.title}</AppText>
                  <AppText variant="bodySm" color="variant" numberOfLines={2} style={{ marginTop: 2 }}>{item.description}</AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>{item.time}</AppText>
                </View>
                {item.unread && <View style={styles.unreadDot} />}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, position: 'relative' },
  backdropFill: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    position: 'absolute',
    right: CONTENT_HORIZONTAL_PADDING,
    left: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  panelHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: Colors.accentMuted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
});
