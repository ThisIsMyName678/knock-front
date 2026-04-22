import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

type Task = { id: string; title: string; due: string; priority: 'high' | 'medium' | 'low'; done: boolean; project: string };

const MOCK: Task[] = [
  { id: 't1', title: 'בדיקת מד מים — מגדלי הים', due: '23/04/2026', priority: 'high', done: false, project: 'מגדלי הים' },
  { id: 't2', title: 'חידוש חוזה — דירה 7A', due: '25/04/2026', priority: 'medium', done: false, project: 'גני הדר' },
  { id: 't3', title: 'ישיבת ועד בית', due: '30/04/2026', priority: 'low', done: false, project: 'הרצל 10' },
  { id: 't4', title: 'בדיקת מערכת גז', due: '15/04/2026', priority: 'high', done: true, project: 'בית ספיר' },
];

const PRIORITY_PRESETS: Record<Task['priority'], React.ComponentProps<typeof Badge>['preset']> = {
  high: 'error',
  medium: 'warning',
  low: 'neutral',
};
const PRIORITY_LABELS = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  const filtered = MOCK.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done,
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">משימות</AppText>
        <Pressable onPress={() => router.push('/(app)/tasks/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <View style={styles.filterBar}>
        {(['all', 'open', 'done'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            accessibilityRole="button"
          >
            <AppText variant="labelMd" weight={filter === f ? 'bold' : 'regular'} style={{ color: filter === f ? Colors.onPrimary : Colors.onSurfaceVariant }}>
              {f === 'all' ? 'הכל' : f === 'open' ? 'פתוחות' : 'הושלמו'}
            </AppText>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState title="אין משימות" icon={<MaterialCommunityIcons name="checkbox-outline" size={32} color={Colors.primary} />} actionLabel="משימה חדשה" onAction={() => router.push('/(app)/tasks/new')} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/(app)/tasks/${item.id}`)}>
              <View style={styles.taskRow}>
                <MaterialCommunityIcons
                  name={item.done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={22}
                  color={item.done ? Colors.success : Colors.onSurfaceMuted}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="bodyMd" weight="semiBold" numberOfLines={2} style={item.done ? { textDecorationLine: 'line-through', opacity: 0.5 } : {}}>
                    {item.title}
                  </AppText>
                  <View style={styles.metaRow}>
                    <AppText variant="bodySm" color="variant">{item.due}</AppText>
                    <AppText variant="bodySm" color="muted">·</AppText>
                    <AppText variant="bodySm" color="variant">{item.project}</AppText>
                  </View>
                </View>
                <Badge label={PRIORITY_LABELS[item.priority]} preset={PRIORITY_PRESETS[item.priority]} />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  filterBar: { flexDirection: 'row-reverse', padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surface },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  list: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  taskRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md },
  metaRow: { flexDirection: 'row-reverse', gap: Spacing.xs },
});
