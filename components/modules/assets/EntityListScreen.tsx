import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
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
  MIN_TOUCH,
} from '@/constants/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityMode = 'projects' | 'assets';

export type OccupancyStatus = 'rented' | 'vacant' | 'construction';

export type UserRole =
  | { kind: 'owner' }
  | { kind: 'tenant' }
  | { kind: 'custom'; label: string };

export type ProjectEntity = {
  id: string;
  kind: 'project';
  name: string;
  address: string;
  assetCount: number;
  occupancy: OccupancyStatus;
  role: UserRole;
};

export type AssetEntity = {
  id: string;
  kind: 'asset';
  name: string;
  address: string;
  occupancy: OccupancyStatus;
  role: UserRole;
};

export type Entity = ProjectEntity | AssetEntity;

type FilterKey = 'all' | OccupancyStatus;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROJECTS: ProjectEntity[] = [
  { id: 'p1', kind: 'project', name: 'מגדלי הים', address: 'הרצל 10, תל אביב', assetCount: 12, occupancy: 'rented', role: { kind: 'owner' } },
  { id: 'p2', kind: 'project', name: 'גני הדר', address: 'ביאליק 3, ר״ג', assetCount: 7, occupancy: 'rented', role: { kind: 'custom', label: 'מנהל פרויקט' } },
  { id: 'p3', kind: 'project', name: 'בית ספיר', address: 'המלך ג׳ורג׳ 5, ירושלים', assetCount: 4, occupancy: 'vacant', role: { kind: 'owner' } },
  { id: 'p4', kind: 'project', name: 'פרויקט חוף', address: 'הנמל 2, חיפה', assetCount: 9, occupancy: 'construction', role: { kind: 'custom', label: 'מנהל אתר' } },
  { id: 'p5', kind: 'project', name: 'מתחם הפארק', address: 'רוטשילד 22, ת״א', assetCount: 3, occupancy: 'vacant', role: { kind: 'owner' } },
  { id: 'p6', kind: 'project', name: 'שיכון דרום', address: 'שד׳ ירושלים 5, באר שבע', assetCount: 18, occupancy: 'rented', role: { kind: 'tenant' } },
];

const MOCK_ASSETS: AssetEntity[] = [
  { id: 'a1', kind: 'asset', name: 'דירה 4B', address: 'הרצל 10, תל אביב', occupancy: 'rented', role: { kind: 'owner' } },
  { id: 'a2', kind: 'asset', name: 'דירה 7A', address: 'הרצל 10, תל אביב', occupancy: 'vacant', role: { kind: 'owner' } },
  { id: 'a3', kind: 'asset', name: 'בית פרטי', address: 'הנרי דנאה 3, נהריה', occupancy: 'rented', role: { kind: 'tenant' } },
  { id: 'a4', kind: 'asset', name: 'משרד 201', address: 'ביאליק 3, ר״ג', occupancy: 'vacant', role: { kind: 'custom', label: 'מנהל נכס' } },
  { id: 'a5', kind: 'asset', name: 'חנות קרקע', address: 'דיזנגוף 120, ת״א', occupancy: 'rented', role: { kind: 'owner' } },
  { id: 'a6', kind: 'asset', name: 'דירת גג', address: 'שינקין 4, ת״א', occupancy: 'construction', role: { kind: 'owner' } },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function occupancyLabel(o: OccupancyStatus): string {
  if (o === 'rented') return 'מושכר';
  if (o === 'vacant') return 'פנוי';
  return 'בבנייה';
}

function occupancyPreset(o: OccupancyStatus): React.ComponentProps<typeof Badge>['preset'] {
  if (o === 'rented') return 'success';
  if (o === 'vacant') return 'warning';
  return 'info';
}

function roleLabel(r: UserRole): string {
  if (r.kind === 'owner') return 'בעלים';
  if (r.kind === 'tenant') return 'שוכר';
  return r.label;
}

function rolePreset(r: UserRole): React.ComponentProps<typeof Badge>['preset'] {
  if (r.kind === 'owner') return 'primary';
  if (r.kind === 'tenant') return 'success';
  return 'neutral';
}

// ─── Entity Card (grid item) ───────────────────────────────────────────────────

function EntityCard({ entity, onPress }: { entity: Entity; onPress: () => void }) {
  const isProject = entity.kind === 'project';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel={entity.name}
    >
      {/* Color top strip */}
      <View style={[styles.cardStrip, { backgroundColor: isProject ? Colors.primary : Colors.primaryLight }]}>
        <MaterialCommunityIcons
          name={isProject ? 'city-variant-outline' : 'home-outline'}
          size={22}
          color="rgba(255,255,255,0.75)"
        />
      </View>

      <View style={styles.cardBody}>
        {/* Role badge */}
        <Badge label={roleLabel(entity.role)} preset={rolePreset(entity.role)} style={styles.roleBadge} />

        {/* Name */}
        <AppText variant="labelMd" weight="bold" numberOfLines={2} style={styles.cardName}>
          {entity.name}
        </AppText>

        {/* Address */}
        <View style={styles.cardAddressRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={11} color={Colors.onSurfaceVariant} />
          <AppText variant="caption" color="variant" numberOfLines={2} style={{ flex: 1 }}>
            {entity.address}
          </AppText>
        </View>

        {/* Project-only: asset count */}
        {isProject && (
          <View style={styles.cardMeta}>
            <MaterialCommunityIcons name="home-outline" size={11} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              {(entity as ProjectEntity).assetCount} נכסים
            </AppText>
          </View>
        )}

        {/* Occupancy status */}
        <Badge
          label={occupancyLabel(entity.occupancy)}
          preset={occupancyPreset(entity.occupancy)}
          style={styles.occupancyBadge}
        />
      </View>
    </Pressable>
  );
}

// ─── Create Choice Bottom Sheet ────────────────────────────────────────────────

function CreateChoiceSheet({
  visible,
  onClose,
  mode,
}: {
  visible: boolean;
  onClose: () => void;
  mode: EntityMode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <AppText variant="headingSm" weight="bold" style={styles.sheetTitle}>
            מה תרצה ליצור?
          </AppText>

          <View style={styles.sheetOptions}>
            <Pressable
              onPress={() => {
                onClose();
                router.push('/(app)/assets-screens/new');
              }}
              style={({ pressed }) => [styles.sheetOption, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: Colors.primaryContainer }]}>
                <MaterialCommunityIcons name="home-plus-outline" size={28} color={Colors.primary} />
              </View>
              <AppText variant="bodyMd" weight="bold" align="center">נכס חדש</AppText>
              <AppText variant="bodySm" color="variant" align="center">
                דירה, בית פרטי, מסחרי
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                router.push('/(app)/projects/new');
              }}
              style={({ pressed }) => [styles.sheetOption, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: Colors.primaryContainer }]}>
                <MaterialCommunityIcons name="briefcase-plus-outline" size={28} color={Colors.primary} />
              </View>
              <AppText variant="bodyMd" weight="bold" align="center">פרויקט חדש</AppText>
              <AppText variant="bodySm" color="variant" align="center">
                קבוצת נכסים
              </AppText>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.sheetCancel} accessibilityRole="button">
            <AppText variant="bodyMd" color="variant" align="center">ביטול</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main EntityListScreen ─────────────────────────────────────────────────────

type Props = {
  mode: EntityMode;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'rented', label: 'מושכרים' },
  { key: 'vacant', label: 'פנויים' },
  { key: 'construction', label: 'בבנייה' },
];

export function EntityListScreen({ mode }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sheetVisible, setSheetVisible] = useState(false);

  const rawData: Entity[] = mode === 'projects' ? MOCK_PROJECTS : MOCK_ASSETS;

  const filtered = rawData.filter((e) => {
    const matchSearch =
      e.name.includes(search) || e.address.includes(search);
    const matchFilter = filter === 'all' || e.occupancy === filter;
    return matchSearch && matchFilter;
  });

  const title = mode === 'projects' ? 'פרויקטים' : 'נכסים';
  const emptyIcon = mode === 'projects' ? 'briefcase-outline' : 'home-outline';

  const handleCardPress = useCallback(
    (entity: Entity) => {
      if (entity.kind === 'project') {
        router.push(`/(app)/projects/${entity.id}`);
      } else {
        router.push(`/(app)/assets-screens/${entity.id}`);
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Entity }) => (
      <EntityCard entity={item} onPress={() => handleCardPress(item)} />
    ),
    [handleCardPress],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="headingMd" weight="bold" color="onPrimary">{title}</AppText>
        <Pressable
          onPress={() => setSheetVisible(true)}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="הוסף חדש"
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
            placeholder={`חיפוש ${title.toLowerCase()}...`}
            placeholderTextColor={Colors.onSurfaceMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="נקה חיפוש">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={`לא נמצאו ${title}`}
          description="נסה לשנות את הסינון או החיפוש"
          icon={<MaterialCommunityIcons name={emptyIcon} size={32} color={Colors.primary} />}
          actionLabel={mode === 'projects' ? 'פרויקט חדש' : 'נכס חדש'}
          onAction={() => setSheetVisible(true)}
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + Spacing['2xl'] },
          ]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}

      {/* Create choice sheet */}
      <CreateChoiceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        mode={mode}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_GAP = Spacing.sm;

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
    flexGrow: 0,
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
    minHeight: 34,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  grid: {
    padding: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.base,
    gap: CARD_GAP,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardStrip: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  roleBadge: { alignSelf: 'flex-end' },
  cardName: {
    textAlign: 'right',
    color: Colors.onBackground,
    marginTop: 2,
  },
  cardAddressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 2,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  occupancyBadge: { alignSelf: 'flex-end', marginTop: 4 },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.md,
    gap: Spacing.base,
    ...Shadow.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  sheetOptions: {
    flexDirection: 'row-reverse',
    gap: Spacing.md,
  },
  sheetOption: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sheetOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  sheetCancel: {
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
  },
});
