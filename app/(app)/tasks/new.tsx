import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const PRIORITIES = [
  { key: 'high', label: 'דחוף', color: Colors.error },
  { key: 'medium', label: 'בינוני', color: Colors.warning },
  { key: 'low', label: 'נמוך', color: Colors.onSurfaceMuted },
];

export default function NewTaskScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState('');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">משימה חדשה</AppText>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Input label="כותרת המשימה" placeholder="תאר את המשימה..." value={title} onChangeText={setTitle} containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="תאריך יעד" placeholder="DD/MM/YYYY" value={due} onChangeText={setDue} containerStyle={{ marginBottom: Spacing.md }} />
          <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.sm }}>עדיפות</AppText>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Pressable key={p.key} onPress={() => setPriority(p.key)} style={[styles.priorityBtn, priority === p.key && { borderColor: p.color, backgroundColor: `${p.color}18` }]} accessibilityRole="button">
                <AppText variant="bodyMd" weight={priority === p.key ? 'bold' : 'regular'} style={{ color: priority === p.key ? p.color : Colors.onSurfaceVariant }}>{p.label}</AppText>
              </Pressable>
            ))}
          </View>
          <Input label="פרויקט קשור (אופציונלי)" placeholder="בחר פרויקט..." containerStyle={{ marginTop: Spacing.md }} />
        </View>
        <Button label="צור משימה" onPress={() => router.back()} fullWidth size="lg" style={{ marginTop: Spacing.base }} />
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
  priorityRow: { flexDirection: 'row-reverse', gap: Spacing.sm },
  priorityBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.outlineVariant },
});
