import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const NOTIF_ITEMS = [
  { key: 'payments', label: 'תשלומים', desc: 'כשמתקבל/יוצא תשלום' },
  { key: 'contracts', label: 'חוזים', desc: 'חידוש ופקיעת חוזים' },
  { key: 'tasks', label: 'משימות', desc: 'תזכורות לפני מועד יעד' },
  { key: 'maintenance', label: 'תחזוקה', desc: 'עדכון קריאות שירות' },
  { key: 'messages', label: 'הודעות', desc: 'הודעות חדשות מדיירים' },
];

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ payments: true, contracts: true, tasks: true, maintenance: false, messages: true });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">הגדרות התראות</AppText>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <View style={styles.card}>
          {NOTIF_ITEMS.map((item, i) => (
            <View key={item.key} style={[styles.row, i < NOTIF_ITEMS.length - 1 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="semiBold">{item.label}</AppText>
                <AppText variant="bodySm" color="muted">{item.desc}</AppText>
              </View>
              <Switch
                value={enabled[item.key] ?? false}
                onValueChange={(v) => setEnabled((prev) => ({ ...prev, [item.key]: v }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
                thumbColor={Colors.onPrimary}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md, paddingTop: Spacing.base },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
