import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function ContractDetailScreen() {
  const insets = useSafeAreaInsets();
  const fields = [
    { label: 'דייר', value: 'יוסי כהן' },
    { label: 'נכס', value: 'דירה 4B — הרצל 10' },
    { label: 'שכירות חודשית', value: '₪7,200' },
    { label: 'תחילת חוזה', value: '01/01/2024' },
    { label: 'סיום חוזה', value: '31/12/2025' },
    { label: 'פיקדון', value: '₪14,400' },
    { label: 'יום תשלום', value: '1 לחודש' },
  ];
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">פרטי חוזה</AppText>
        <Pressable style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.onPrimary} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.contractHeader}>
            <View style={styles.iconBig}><MaterialCommunityIcons name="file-sign" size={28} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSm" weight="bold">חוזה שכירות</AppText>
              <AppText variant="bodySm" color="variant">ID: CTR-0042</AppText>
            </View>
            <Badge label="פעיל" preset="success" />
          </View>
        </Card>
        <Card>
          {fields.map((f, i) => (
            <View key={f.label} style={[styles.row, i < fields.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">{f.label}</AppText>
              <AppText variant="bodyMd" weight="semiBold">{f.value}</AppText>
            </View>
          ))}
        </Card>
        <Button label="צפה בחוזה המלא" onPress={() => {}} fullWidth variant="secondary" size="lg" />
        <Button label="חדש חוזה" onPress={() => {}} fullWidth size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  contractHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  iconBig: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
