import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function DocumentDetailScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">מסמך</AppText>
        <Pressable style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.onPrimary} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <View style={styles.previewBox}>
          <MaterialCommunityIcons name="file-pdf-box" size={64} color={Colors.error} />
          <AppText variant="headingSm" weight="bold" align="center" numberOfLines={2}>חוזה שכירות — דירה 4B.pdf</AppText>
          <AppText variant="bodySm" color="muted" align="center">2.4 MB · PDF</AppText>
        </View>
        <Card>
          {[{ label: 'פרויקט', value: 'מגדלי הים' }, { label: 'הועלה ב', value: '01/01/2024' }, { label: 'הועלה ע״י', value: 'מנהל' }].map((f, i, arr) => (
            <View key={f.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">{f.label}</AppText>
              <AppText variant="bodyMd" weight="semiBold">{f.value}</AppText>
            </View>
          ))}
        </Card>
        <Button label="צפה במסמך" onPress={() => {}} fullWidth variant="secondary" size="lg" />
        <Button label="מחק מסמך" onPress={() => router.back()} fullWidth variant="danger" size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  previewBox: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
