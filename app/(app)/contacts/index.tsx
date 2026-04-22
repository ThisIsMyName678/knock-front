import React from 'react';
import { View, FlatList, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const MOCK = [
  { id: 'ct1', name: 'יוסי כהן', role: 'דייר', phone: '050-1234567', project: 'מגדלי הים' },
  { id: 'ct2', name: 'מיכל לוי', role: 'מנהלת נכס', phone: '052-9876543', project: 'גני הדר' },
  { id: 'ct3', name: 'דוד גל', role: 'קבלן', phone: '054-1111222', project: 'בית ספיר' },
];

async function openUrl(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) { Alert.alert('לא ניתן לפתוח', url); return; }
    await Linking.openURL(url);
  } catch { Alert.alert('שגיאה', 'לא ניתן לבצע את הפעולה'); }
}

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">אנשי קשר</AppText>
        <Pressable onPress={() => router.push('/(app)/contacts/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>
      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="אין אנשי קשר" icon={<MaterialCommunityIcons name="account-group-outline" size={32} color={Colors.primary} />} actionLabel="הוסף איש קשר" onAction={() => router.push('/(app)/contacts/new')} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.top}>
              <View style={styles.avatar}>
                <AppText variant="headingSm" weight="bold" color="onPrimary">{item.name[0]}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <AppText variant="bodyMd" weight="bold" style={{ flex: 1 }}>{item.name}</AppText>
                  <Badge label={item.role} preset="primary" />
                </View>
                <AppText variant="bodySm" color="muted">{item.phone} · {item.project}</AppText>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => openUrl(`tel:${item.phone.replace(/[^\d+]/g, '')}`)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="חייג">
                <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.primary} />
                <AppText variant="labelMd" weight="semiBold" color="primary">טלפון</AppText>
              </Pressable>
              <Pressable onPress={() => openUrl(`whatsapp://send?phone=972${item.phone.replace(/[^\d]/g, '').slice(1)}`)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="WhatsApp">
                <MaterialCommunityIcons name="whatsapp" size={18} color={Colors.primary} />
                <AppText variant="labelMd" weight="semiBold" color="primary">WhatsApp</AppText>
              </Pressable>
              <Pressable onPress={() => router.push(`/(app)/contacts/${item.id}`)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="פרופיל">
                <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.onSurfaceMuted} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingVertical: Spacing.md, gap: Spacing.md },
  top: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  actions: { flexDirection: 'row-reverse', gap: Spacing.sm, alignItems: 'center' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceVariant },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 'auto' as any },
});
