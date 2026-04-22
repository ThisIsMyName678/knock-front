import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function NewContactScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">איש קשר חדש</AppText>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Input label="שם מלא" placeholder="שם ושם משפחה" containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="תפקיד" placeholder="דייר / קבלן / מנהל..." containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="טלפון" placeholder="05X-XXXXXXX" keyboardType="phone-pad" containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="אימייל" placeholder="email@example.com" keyboardType="email-address" containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="פרויקט קשור" placeholder="בחר פרויקט..." />
        </View>
        <Button label="שמור איש קשר" onPress={() => router.back()} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
});
