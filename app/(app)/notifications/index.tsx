import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { AppHeader } from '@/components/ui/AppHeader';

type Notif = {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  route?: string;
};

const MOCK: Notif[] = [
  {
    id: 'n1',
    title: 'תשלום התקבל',
    body: 'יוסי כהן שלח ₪7,200 — מגדלי הים',
    sentAt: '22/04/2026 08:30',
    read: false,
    icon: 'cash-check',
    color: Colors.success,
    route: '/(app)/payments/pay1',
  },
  {
    id: 'n2',
    title: 'קריאת שירות חדשה',
    body: 'נפתחה קריאת תחזוקה — הרצל 10',
    sentAt: '21/04/2026 17:15',
    read: false,
    icon: 'hammer-wrench',
    color: Colors.warning,
    route: '/(app)/tasks/t1',
  },
  {
    id: 'n3',
    title: 'חוזה עומד לפוג',
    body: 'חוזה דירה 7A יפוג ב-31/05/2026',
    sentAt: '20/04/2026 11:00',
    read: true,
    icon: 'file-sign',
    color: Colors.primary,
    route: '/(app)/contracts/c1',
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const onPress = (item: Notif) => {
    if (item.route) router.push(item.route as any);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="התראות" showBack />

      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="אין התראות"
            icon={<MaterialCommunityIcons name="bell-outline" size={32} color={Colors.primary} />}
            style={{ flex: 1 }}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.outlineLight }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.notifRow, !item.read && styles.unread, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            {!item.read && <View style={styles.unreadDot} />}
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="bodyMd" weight={item.read ? 'regular' : 'bold'} style={{ textAlign: 'right' }}>
                {item.title}
              </AppText>
              <AppText variant="bodySm" color="variant" numberOfLines={2} style={{ textAlign: 'right' }}>
                {item.body}
              </AppText>
              <View style={styles.timeRow}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.onSurfaceMuted} />
                <AppText variant="caption" color="muted">{item.sentAt}</AppText>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={18} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: { flexGrow: 1 },
  notifRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  unread: { backgroundColor: Colors.accentMuted },
  unreadDot: {
    position: 'absolute',
    top: Spacing.base + 6,
    right: Spacing.xs,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: RTL_ROW, alignItems: 'center', gap: 4 },
});
