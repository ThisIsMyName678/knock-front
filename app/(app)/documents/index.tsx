import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const MOCK = [
  { id: 'd1', name: 'חוזה שכירות — דירה 4B.pdf', kind: 'pdf' as const, date: '01/01/2024', project: 'מגדלי הים' },
  { id: 'd2', name: 'תמונת נזק — מטבח.jpg', kind: 'image' as const, date: '10/03/2026', project: 'גני הדר' },
  { id: 'd3', name: 'דוח בדיקה שנתית.pdf', kind: 'pdf' as const, date: '15/12/2025', project: 'בית ספיר' },
];

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">מסמכים וקבצים</AppText>
        <Pressable onPress={() => router.push('/(app)/documents/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>
      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="אין מסמכים" icon={<MaterialCommunityIcons name="folder-outline" size={32} color={Colors.primary} />} actionLabel="העלה מסמך" onAction={() => router.push('/(app)/documents/new')} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/documents/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surfaceVariant }]}
            accessibilityRole="button"
          >
            <View style={[styles.docIcon, { backgroundColor: item.kind === 'pdf' ? Colors.errorContainer : Colors.infoContainer }]}>
              <MaterialCommunityIcons name={item.kind === 'pdf' ? 'file-pdf-box' : 'file-image-outline'} size={24} color={item.kind === 'pdf' ? Colors.error : Colors.info} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyMd" weight="semiBold" numberOfLines={2}>{item.name}</AppText>
              <AppText variant="bodySm" color="muted">{item.project} · {item.date}</AppText>
            </View>
            <MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: Spacing.xs },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  docIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
