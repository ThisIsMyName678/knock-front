import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Radius, Shadow, FontFamily, FontSize, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

type Asset = {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'office' | 'parking' | 'storage';
  status: 'rented' | 'vacant' | 'maintenance';
  rent: number;
};

const TYPE_ICONS: Record<Asset['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  apartment: 'home-outline',
  office: 'office-building-outline',
  parking: 'car-outline',
  storage: 'archive-outline',
};
const TYPE_LABELS: Record<Asset['type'], string> = {
  apartment: 'דירה',
  office: 'משרד',
  parking: 'חניה',
  storage: 'מחסן',
};
const STATUS_PRESETS: Record<Asset['status'], React.ComponentProps<typeof Badge>['preset']> = {
  rented: 'success',
  vacant: 'warning',
  maintenance: 'error',
};
const STATUS_LABELS: Record<Asset['status'], string> = {
  rented: 'מושכר',
  vacant: 'פנוי',
  maintenance: 'תחזוקה',
};

const MOCK: Asset[] = [
  { id: 'a1', name: 'דירה 4B', address: 'הרצל 10, תל אביב', type: 'apartment', status: 'rented', rent: 7200 },
  { id: 'a2', name: 'משרד 201', address: 'ביאליק 3, ר״ג', type: 'office', status: 'vacant', rent: 12000 },
  { id: 'a3', name: 'חניה #18', address: 'הרצל 10, תל אביב', type: 'parking', status: 'rented', rent: 600 },
  { id: 'a4', name: 'מחסן 3', address: 'הנמל 2, חיפה', type: 'storage', status: 'maintenance', rent: 400 },
];

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = MOCK.filter(
    (a) => a.name.includes(search) || a.address.includes(search),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">נכסים</AppText>
        <Pressable onPress={() => router.push('/(app)/assets-screens/new')} style={styles.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.onSurfaceMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש נכס..."
            placeholderTextColor={Colors.onSurfaceMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="לא נמצאו נכסים"
          icon={<MaterialCommunityIcons name="home-outline" size={32} color={Colors.primary} />}
          actionLabel="נכס חדש"
          onAction={() => router.push('/(app)/assets-screens/new')}
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/(app)/assets-screens/${item.id}`)}>
              <View style={styles.assetRow}>
                <View style={[styles.assetIcon, { backgroundColor: Colors.primaryContainer }]}>
                  <MaterialCommunityIcons name={TYPE_ICONS[item.type]} size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.nameRow}>
                    <AppText variant="bodyMd" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                      {item.name}
                    </AppText>
                    <Badge label={STATUS_LABELS[item.status]} preset={STATUS_PRESETS[item.status]} />
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color={Colors.onSurfaceVariant} />
                    <AppText variant="bodySm" color="variant" numberOfLines={1} style={{ flex: 1 }}>
                      {item.address}
                    </AppText>
                  </View>
                  <View style={styles.metaRow}>
                    <AppText variant="bodySm" color="variant">{TYPE_LABELS[item.type]}</AppText>
                    <AppText variant="bodySm" color="primary" weight="semiBold">
                      ₪{item.rent.toLocaleString('he-IL')}/חודש
                    </AppText>
                  </View>
                </View>
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
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md,
  },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  searchBar: { padding: CONTENT_HORIZONTAL_PADDING, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  searchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceVariant, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.onBackground, paddingVertical: 0 },
  list: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  assetRow: { flexDirection: 'row-reverse', gap: Spacing.md, alignItems: 'flex-start' },
  assetIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, justifyContent: 'space-between' },
});
