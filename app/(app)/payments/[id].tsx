import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function PaymentDetailScreen() {
  const insets = useSafeAreaInsets();
  const fields = [{ label: 'סוג', value: 'הכנסה' }, { label: 'סכום', value: '₪7,200' }, { label: 'קטגוריה', value: 'שכירות' }, { label: 'תאריך', value: '01/04/2026' }, { label: 'מקור', value: 'יוסי כהן' }, { label: 'נכס', value: 'דירה 4B' }];
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">פרטי תשלום</AppText>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <View style={styles.amountCard}>
          <View style={[styles.amtIcon, { backgroundColor: Colors.inboundBg }]}>
            <MaterialCommunityIcons name="arrow-down" size={28} color={Colors.inbound} />
          </View>
          <AppText variant="displayMd" weight="extraBold" style={{ color: Colors.inbound }}>+₪7,200</AppText>
          <AppText variant="bodyMd" color="variant">הכנסה — שכירות</AppText>
        </View>
        <Card>
          {fields.map((f, i) => (
            <View key={f.label} style={[styles.row, i < fields.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">{f.label}</AppText>
              <AppText variant="bodyMd" weight="semiBold">{f.value}</AppText>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  amountCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  amtIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
