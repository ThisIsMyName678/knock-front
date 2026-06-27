import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { listNotifications, type NotificationsCursor } from '@/lib/api/notifications';
import { feedEventToItem, type FeedItem, type FeedKind } from '@/lib/api/feed';
import { toLocalDateKey } from '@/lib/mocks/dashboard';

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

const PASSED_IDS_KEY = 'notifications.passedIds';
const PASSED_IDS_CAP = 200;

function getPassedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PASSED_IDS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function addPassedIds(ids: string[]) {
  if (ids.length === 0) return;
  try {
    const current = getPassedIds();
    ids.forEach((id) => current.add(id));
    const trimmed = Array.from(current).slice(-PASSED_IDS_CAP);
    localStorage.setItem(PASSED_IDS_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore — feature degrades gracefully without persistence
  }
}

function filterPassed(items: FeedItem[]): FeedItem[] {
  const passed = getPassedIds();
  return items.filter((item) => !passed.has(item.id));
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
  const [nextLoading, setNextLoading] = useState(false);
  const [cursor, setCursor] = useState<NotificationsCursor>(null);
  const [since, setSince] = useState<string | undefined>(undefined);
  const [readLocally, setReadLocally] = useState<Set<string>>(new Set());
  const [lastPageIds, setLastPageIds] = useState<string[]>([]);
  const [newItemsCount, setNewItemsCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    listNotifications({ date: toLocalDateKey(new Date()), limit: 5 })
      .then((res) => {
        if (cancelled) return;
        const mapped = filterPassed(res.items.map(feedEventToItem).filter((item): item is FeedItem => item !== null));
        setItems(mapped);
        setCursor(res.nextCursor);
        setSince(res.items[0]?.createdAt);
        setLastPageIds(mapped.map((item) => item.id));
        setReadLocally(new Set());
        setNewItemsCount(0);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible]);

  const toggleRead = (id: string) => {
    setReadLocally((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canGoNext = !!cursor && lastPageIds.length > 0 && lastPageIds.every((id) => readLocally.has(id));

  const handleNext = () => {
    if (!canGoNext || nextLoading) return;
    addPassedIds(lastPageIds);
    setNextLoading(true);
    listNotifications({ date: toLocalDateKey(new Date()), cursor, since, limit: 5 })
      .then((res) => {
        const mapped = filterPassed(res.items.map(feedEventToItem).filter((item): item is FeedItem => item !== null));
        setItems(mapped);
        setCursor(res.nextCursor);
        setLastPageIds(mapped.map((item) => item.id));
        setReadLocally(new Set());
        setNewItemsCount(res.newItemsCount);
      })
      .finally(() => setNextLoading(false));
  };

  const handleRefresh = () => {
    setLoading(true);
    listNotifications({ date: toLocalDateKey(new Date()), limit: 5 })
      .then((res) => {
        const mapped = filterPassed(res.items.map(feedEventToItem).filter((item): item is FeedItem => item !== null));
        setItems(mapped);
        setCursor(res.nextCursor);
        setSince(res.items[0]?.createdAt);
        setLastPageIds(mapped.map((item) => item.id));
        setReadLocally(new Set());
        setNewItemsCount(0);
      })
      .finally(() => setLoading(false));
  };

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
                const isRead = readLocally.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleRead(item.id)}
                    style={[styles.row, i < items.length - 1 && styles.rowBorder]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isRead }}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                      <MaterialCommunityIcons name={feedIcon(item.kind)} size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyMd" weight="regular" style={{ opacity: isRead ? 0.5 : 1 }}>{item.title}</AppText>
                      <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>{fmtDateTime(item.dateIso)}</AppText>
                    </View>
                    <MaterialCommunityIcons
                      name={isRead ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={26}
                      color={isRead ? Colors.success : Colors.onSurfaceMuted}
                    />
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {newItemsCount > 0 && (
            <View style={styles.banner}>
              <AppText variant="bodySm" color="primary">נוספו {newItemsCount} התראות חדשות</AppText>
              <Pressable onPress={handleRefresh} accessibilityRole="button" accessibilityLabel="רענן">
                <AppText variant="bodySm" weight="bold" color="primary">רענון</AppText>
              </Pressable>
            </View>
          )}

          {cursor && (
            <Pressable
              onPress={handleNext}
              disabled={!canGoNext || nextLoading}
              style={[styles.nextBtn, (!canGoNext || nextLoading) && styles.nextBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="הבא"
            >
              {nextLoading ? (
                <ActivityIndicator color={Colors.onAccent} size="small" />
              ) : (
                <AppText variant="bodyMd" weight="bold" style={{ color: canGoNext ? Colors.onAccent : Colors.onSurfaceMuted }}>הבא</AppText>
              )}
            </Pressable>
          )}
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
  banner: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accentMuted,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  nextBtn: {
    margin: Spacing.base,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
});
