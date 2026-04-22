import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function NewDocumentScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">העלאת מסמך</AppText>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.uploadBox} onPress={() => {}} accessibilityRole="button">
          <MaterialCommunityIcons name="upload-outline" size={40} color={Colors.primary} />
          <AppText variant="headingSm" weight="bold" color="primary" align="center">בחר קובץ להעלאה</AppText>
          <AppText variant="bodySm" color="muted" align="center">PDF, JPG, PNG — עד 10MB</AppText>
        </Pressable>
        <View style={styles.card}>
          <Input label="שם המסמך" placeholder="לדוגמה: חוזה שכירות" containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="פרויקט קשור" placeholder="בחר פרויקט..." containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="הערות" placeholder="אופציונלי..." multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
        </View>
        <Button label="העלה מסמך" onPress={() => router.back()} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md },
  uploadBox: { borderWidth: 2, borderColor: Colors.outlineVariant, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceVariant },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
});
