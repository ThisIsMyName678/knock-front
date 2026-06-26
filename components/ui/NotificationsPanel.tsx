import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { listNotifications } from '@/lib/api/notifications';
import { feedEventToItem, type FeedItem, type FeedKind } from '@/lib/api/feed';

function feedColor(kind: FeedKind): string {
  if (kind === 'task') return Colors.feedMaintenance;
  if (kind === 'payment') return Colors.feedPayments;
  if (kind === 'message') return Colors.feedMessages;
  if (kind === 'document') return Colors.feedDocuments;
  return Colors.feedContracts;
}

function feedIcon(kind: FeedKind): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (kind === 'task') return 'hammer-wrench';
  if (kind === 'payment') return 'cash-check';
  if (kind === 'message') return 'message-outline';
  if (kind === 'document') return 'file-outline';
  return 'file-sign';
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    listNotifications({ limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items.map(feedEventToItem).filter((item): item is FeedItem => item !== null));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible]);

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
            {loading && items.length === 0 ? (
              <View style={styles.statusWrap}>
                <ActivityIndicator color={Colors.accent} />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.statusWrap}>
                <AppText variant="bodyMd" color="muted">אין התראות</AppText>
              </View>
            ) : (
              items.map((item, i) => {
                const color = feedColor(item.kind);
                return (
                  <View
                    key={item.id}
                    style={[styles.row, i < items.length - 1 && styles.rowBorder]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                      <MaterialCommunityIcons name={feedIcon(item.kind)} size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyMd" weight="regular">{item.title}</AppText>
                      <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>{fmtDateTime(item.dateIso)}</AppText>
                    </View>
                  </View>
                );
              })
            )}
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
  statusWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
