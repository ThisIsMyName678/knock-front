import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const MOCK = [
  { id: 'pay1', direction: 'inbound' as const, amount: 7200, category: 'שכירות', date: '01/04/2026', from: 'יוסי כהן' },
  { id: 'pay2', direction: 'outbound' as const, amount: 850, category: 'תחזוקה', date: '15/04/2026', from: 'חברת תחזוקה' },
  { id: 'pay3', direction: 'inbound' as const, amount: 12000, category: 'שכירות', date: '01/04/2026', from: 'מיכל לוי' },
  { id: 'pay4', direction: 'outbound' as const, amount: 420, category: 'ניהול', date: '20/04/2026', from: 'עמלת ניהול' },
];

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const total = MOCK.reduce((sum, p) => sum + (p.direction === 'inbound' ? p.amount : -p.amount), 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">תשלומים</AppText>
        <Pressable onPress={() => router.push('/(app)/payments/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>סה״כ נטו</AppText>
          <AppText variant="headingLg" weight="extraBold" color="onPrimary">₪{total.toLocaleString('he-IL')}</AppText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>הכנסות</AppText>
          <AppText variant="headingSm" weight="bold" style={{ color: Colors.success }}>
            +₪{MOCK.filter((p) => p.direction === 'inbound').reduce((s, p) => s + p.amount, 0).toLocaleString('he-IL')}
          </AppText>
        </View>
        <View style={styles.summaryItem}>
          <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>הוצאות</AppText>
          <AppText variant="headingSm" weight="bold" style={{ color: Colors.outbound }}>
            -₪{MOCK.filter((p) => p.direction === 'outbound').reduce((s, p) => s + p.amount, 0).toLocaleString('he-IL')}
          </AppText>
        </View>
      </View>

      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const inbound = item.direction === 'inbound';
          return (
            <Card onPress={() => router.push(`/(app)/payments/${item.id}`)}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: inbound ? Colors.inboundBg : Colors.outboundBg }]}>
                  <MaterialCommunityIcons name={inbound ? 'arrow-down' : 'arrow-up'} size={20} color={inbound ? Colors.inbound : Colors.outbound} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.nameRow}>
                    <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1 }}>{item.from}</AppText>
                    <AppText variant="bodyMd" weight="extraBold" style={{ color: inbound ? Colors.inbound : Colors.outbound }}>
                      {inbound ? '+' : '−'}₪{item.amount.toLocaleString('he-IL')}
                    </AppText>
                  </View>
                  <View style={styles.metaRow}>
                    <Badge label={item.category} preset="neutral" />
                    <AppText variant="bodySm" color="muted">{item.date}</AppText>
                  </View>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  summaryCard: { backgroundColor: Colors.primaryDark, padding: Spacing.base, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  summaryItem: { alignItems: 'flex-end', flex: 1 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  list: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  row: { flexDirection: 'row-reverse', gap: Spacing.md, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
});
