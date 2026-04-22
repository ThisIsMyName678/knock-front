import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

type Notif = { id: string; title: string; body: string; time: string; read: boolean; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string };

const MOCK: Notif[] = [
  { id: 'n1', title: 'תשלום התקבל', body: 'יוסי כהן שלח ₪7,200 — מגדלי הים', time: 'לפני שעה', read: false, icon: 'cash-check', color: Colors.success },
  { id: 'n2', title: 'קריאת שירות חדשה', body: 'נפתחה קריאת תחזוקה — הרצל 10', time: 'לפני 3 ש׳', read: false, icon: 'hammer-wrench', color: Colors.warning },
  { id: 'n3', title: 'חוזה עומד לפוג', body: 'חוזה דירה 7A יפוג ב-31/05/2024', time: 'אתמול', read: true, icon: 'file-sign', color: Colors.primary },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">התראות</AppText>
        <Pressable style={styles.iconBtn} accessibilityRole="button"><AppText variant="bodySm" color="onPrimary" weight="semiBold">נקה הכל</AppText></Pressable>
      </View>
      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="אין התראות" icon={<MaterialCommunityIcons name="bell-outline" size={32} color={Colors.primary} />} style={{ flex: 1 }} />}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.notifRow, !item.read && styles.unread, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            {!item.read && <View style={styles.unreadDot} />}
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMd" weight={item.read ? 'regular' : 'bold'}>{item.title}</AppText>
              <AppText variant="bodySm" color="variant" numberOfLines={2}>{item.body}</AppText>
              <AppText variant="caption" color="muted">{item.time}</AppText>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list: {},
  notifRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, position: 'relative' },
  unread: { backgroundColor: '#f0f5ff' },
  unreadDot: { position: 'absolute', top: Spacing.base + 6, right: Spacing.xs, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
