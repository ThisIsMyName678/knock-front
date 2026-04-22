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

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">פרטי משימה</AppText>
        <Pressable style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.onPrimary} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color={Colors.error} />
            <AppText variant="headingSm" weight="bold" style={{ flex: 1 }}>בדיקת מד מים — מגדלי הים</AppText>
          </View>
          <Badge label="דחוף" preset="error" style={{ marginTop: Spacing.sm, alignSelf: 'flex-end' }} />
        </Card>
        <Card>
          <AppText variant="labelMd" weight="semiBold" color="variant" style={{ marginBottom: Spacing.sm }}>פרטים</AppText>
          {[
            { label: 'תאריך יעד', value: '23/04/2026' },
            { label: 'פרויקט', value: 'מגדלי הים' },
            { label: 'נוצר ע״י', value: 'מנהל' },
            { label: 'סטטוס', value: 'פתוח' },
          ].map((row) => (
            <View key={row.label} style={styles.detailRow}>
              <AppText variant="bodyMd" color="variant">{row.label}</AppText>
              <AppText variant="bodyMd" weight="semiBold">{row.value}</AppText>
            </View>
          ))}
        </Card>
        <Button label="סמן כהושלם" onPress={() => router.back()} fullWidth variant="primary" size="lg" />
        <Button label="מחק משימה" onPress={() => router.back()} fullWidth variant="danger" size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
