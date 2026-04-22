import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const MOCK = [
  { id: 'c1', tenant: 'יוסי כהן', asset: 'דירה 4B', start: '01/01/2024', end: '31/12/2025', rent: 7200, status: 'active' as const },
  { id: 'c2', tenant: 'מיכל לוי', asset: 'משרד 201', start: '01/03/2024', end: '28/02/2026', rent: 12000, status: 'active' as const },
  { id: 'c3', tenant: 'דוד גל', asset: 'דירה 7A', start: '01/06/2023', end: '31/05/2024', rent: 5800, status: 'expired' as const },
];

export default function ContractsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">חוזים</AppText>
        <Pressable onPress={() => router.push('/(app)/contracts/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>
      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="אין חוזים" icon={<MaterialCommunityIcons name="file-sign" size={32} color={Colors.primary} />} actionLabel="חוזה חדש" onAction={() => router.push('/(app)/contracts/new')} />}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/contracts/${item.id}`)}>
            <View style={styles.row}>
              <View style={styles.iconWrap}><MaterialCommunityIcons name="file-sign" size={22} color={Colors.primary} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.nameRow}>
                  <AppText variant="bodyMd" weight="bold" style={{ flex: 1 }} numberOfLines={1}>{item.tenant}</AppText>
                  <Badge label={item.status === 'active' ? 'פעיל' : 'פג תוקף'} preset={item.status === 'active' ? 'success' : 'neutral'} />
                </View>
                <AppText variant="bodySm" color="variant">{item.asset}</AppText>
                <View style={styles.metaRow}>
                  <AppText variant="bodySm" color="muted">{item.start} – {item.end}</AppText>
                  <AppText variant="bodySm" color="primary" weight="semiBold">₪{item.rent.toLocaleString('he-IL')}/חודש</AppText>
                </View>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  list: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  row: { flexDirection: 'row-reverse', gap: Spacing.md, alignItems: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
});
