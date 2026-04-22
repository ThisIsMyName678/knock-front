import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  FontFamily,
  FontSize,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';

type Project = {
  id: string;
  name: string;
  address: string;
  assetCount: number;
  status: 'active' | 'inactive' | 'pending';
  imageColor: string;
};

const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'מגדלי הים', address: 'הרצל 10, תל אביב', assetCount: 12, status: 'active', imageColor: '#004a99' },
  { id: 'p2', name: 'גני הדר', address: 'ביאליק 3, ר״ג', assetCount: 7, status: 'active', imageColor: '#10b981' },
  { id: 'p3', name: 'בית ספיר', address: 'המלך ג׳ורג׳ 5, ירושלים', assetCount: 4, status: 'pending', imageColor: '#f59e0b' },
  { id: 'p4', name: 'פרויקט חוף', address: 'הנמל 2, חיפה', assetCount: 9, status: 'inactive', imageColor: '#6b7280' },
];

const STATUS_LABELS: Record<Project['status'], string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  pending: 'ממתין',
};

const STATUS_PRESETS: Record<Project['status'], React.ComponentProps<typeof Badge>['preset']> = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
};

type FilterKey = 'all' | Project['status'];
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'active', label: 'פעיל' },
  { key: 'pending', label: 'ממתין' },
  { key: 'inactive', label: 'לא פעיל' },
];

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card onPress={() => router.push(`/(app)/projects/${project.id}`)} style={styles.projectCard} noPadding>
      {/* Color strip */}
      <View style={[styles.cardStrip, { backgroundColor: project.imageColor }]}>
        <MaterialCommunityIcons name="city-variant-outline" size={36} color="rgba(255,255,255,0.6)" />
        <View style={styles.cardId}>
          <AppText variant="caption" color="onPrimary" style={{ opacity: 0.85 }}>
            PRJ-{project.id.toUpperCase()}
          </AppText>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <AppText variant="headingSm" weight="bold" color="primary" numberOfLines={1}>
              {project.name}
            </AppText>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={Colors.onSurfaceVariant} />
              <AppText variant="bodySm" color="variant" numberOfLines={1} style={{ flex: 1 }}>
                {project.address}
              </AppText>
            </View>
          </View>
          <Badge label={STATUS_LABELS[project.status]} preset={STATUS_PRESETS[project.status]} />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.assetChip}>
            <MaterialCommunityIcons name="home-outline" size={14} color={Colors.primary} />
            <AppText variant="bodySm" color="primary" weight="semiBold">
              {project.assetCount} נכסים
            </AppText>
          </View>
          <AppText variant="bodySm" color="primary" weight="semiBold">
            צפה בפרטים ←
          </AppText>
        </View>
      </View>
    </Card>
  );
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = MOCK_PROJECTS.filter((p) => {
    const matchSearch =
      p.name.includes(search) || p.address.includes(search);
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">
          פרויקטים
        </AppText>
        <Pressable
          onPress={() => router.push('/(app)/projects/new')}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="פרויקט חדש"
        >
          <MaterialCommunityIcons name="plus" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.onSurfaceMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש פרויקט..."
            placeholderTextColor={Colors.onSurfaceMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
          >
            <AppText
              variant="labelMd"
              weight={filter === f.key ? 'bold' : 'regular'}
              style={{ color: filter === f.key ? Colors.onPrimary : Colors.onSurfaceVariant }}
            >
              {f.label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="לא נמצאו פרויקטים"
          description="נסה לשנות את הסינון או החיפוש"
          icon={<MaterialCommunityIcons name="briefcase-outline" size={32} color={Colors.primary} />}
          actionLabel="פרויקט חדש"
          onAction={() => router.push('/(app)/projects/new')}
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + Spacing['2xl'] },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    ...Shadow.md,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    padding: CONTENT_HORIZONTAL_PADDING,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    paddingVertical: 0,
  },
  filtersScroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  list: {
    padding: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.base,
  },
  projectCard: { marginBottom: 0 },
  cardStrip: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardId: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  cardBody: { padding: Spacing.base },
  cardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  addressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  assetChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
});
