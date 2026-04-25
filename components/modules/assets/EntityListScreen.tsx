import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
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

import type { AssetEntity, Entity, OccupancyStatus, ProjectEntity, UserRole } from '@/lib/mocks/assets';
import {
  MOCK_ASSETS,
  MOCK_PROJECTS,
  assetsForProject,
  assetsStandaloneForEnterpriseList,
} from '@/lib/mocks/assets';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { AppHeader } from '@/components/ui/AppHeader';
import { FilterBar } from '@/components/ui/FilterBar';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityMode = 'projects' | 'assets';

export type { AssetEntity, Entity, OccupancyStatus, ProjectEntity, UserRole } from '@/lib/mocks/assets';

type FilterKey = 'all' | OccupancyStatus;

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

        {/* Project-only: asset count + occupancy X/Y */}
        {isProject && (() => {
          const projectAssets = assetsForProject(entity.id);
          const total = projectAssets.length;
          const rented = projectAssets.filter((a) => a.occupancy === 'rented').length;
          return (
            <>
              <View style={styles.cardMeta}>
                <MaterialCommunityIcons name="home-outline" size={11} color={Colors.primary} />
                <AppText variant="caption" color="primary" weight="semiBold">
                  {total} נכסים
                </AppText>
              </View>
              <View style={[styles.cardMeta, { marginTop: 2 }]}>
                <MaterialCommunityIcons name="home-account" size={11} color={Colors.success} />
                <AppText variant="caption" weight="semiBold" style={{ color: Colors.success }}>
                  {rented}/{total} מושכרים
                </AppText>
              </View>
            </>
          );
        })()}

        {/* Asset-only: Occupancy status badge */}
        {!isProject && (
          <Badge
            label={occupancyLabel(entity.occupancy)}
            preset={occupancyPreset(entity.occupancy)}
            style={styles.occupancyBadge}
          />
        )}
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
  /** מסך מוטמע (טאב פרויקט) — ללא כותרת ירוקה רחבה */
  embedded?: boolean;
  /** הצגת נכסים השייכים לפרויקט זה בלבד */
  scopedProjectId?: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'rented', label: 'מושכרים' },
  { key: 'vacant', label: 'פנויים' },
  { key: 'construction', label: 'בבנייה' },
];

export function EntityListScreen({ mode, embedded = false, scopedProjectId }: Props) {
  const insets = useSafeAreaInsets();
  const plan = useSubscriptionPlan();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sheetVisible, setSheetVisible] = useState(false);

  const rawData: Entity[] = useMemo(() => {
    if (scopedProjectId) {
      return assetsForProject(scopedProjectId);
    }
    if (mode === 'projects') {
      const orphans = plan === 'enterprise' ? assetsStandaloneForEnterpriseList() : [];
      return [...MOCK_PROJECTS, ...orphans];
    }
    return MOCK_ASSETS;
  }, [mode, scopedProjectId, plan]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawData.filter((e) => {
      const hay = `${e.name} ${e.address}`.toLowerCase();
      const matchSearch = !q || hay.includes(q);
      const matchFilter = filter === 'all' || e.occupancy === filter;
      return matchSearch && matchFilter;
    });
  }, [rawData, search, filter]);

  const title =
    mode === 'projects' && plan === 'enterprise' && !scopedProjectId
      ? 'פרויקטים ונכסים'
      : mode === 'projects'
        ? 'פרויקטים'
        : 'נכסים';
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

  const showOrphansHint =
    plan === 'enterprise' && mode === 'projects' && !scopedProjectId && !embedded && assetsStandaloneForEnterpriseList().length > 0;

  const body = (
    <>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        tabs={FILTERS.map((f) => ({ key: f.key, label: f.label }))}
        activeTab={filter}
        onTabChange={(k) => setFilter(k as FilterKey)}
      />

      {showOrphansHint ? (
        <View style={styles.hintBanner}>
          <MaterialCommunityIcons name="information-outline" size={18} color={Colors.primary} />
          <AppText variant="bodySm" color="primary" style={{ flex: 1, textAlign: 'right' }}>
            נכסים ללא שיוך פרויקט מוצגים כאן יחד עם הפרויקטים
          </AppText>
        </View>
      ) : null}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={scopedProjectId ? 'אין נכסים בפרויקט זה' : `לא נמצאו ${title}`}
          description="נסה לשנות את הסינון או החיפוש"
          icon={<MaterialCommunityIcons name={emptyIcon} size={32} color={Colors.primary} />}
          actionLabel={
            embedded
              ? 'נכס חדש'
              : mode === 'projects'
                ? 'פרויקט חדש'
                : 'נכס חדש'
          }
          onAction={
            embedded
              ? () => router.push('/(app)/assets-screens/new')
              : () => setSheetVisible(true)
          }
          style={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: embedded ? Spacing['2xl'] : insets.bottom + Spacing['2xl'] },
          ]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      )}

      {!embedded ? (
        <CreateChoiceSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          mode={mode}
        />
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <View style={styles.embeddedWrap}>
        {scopedProjectId ? (
          <AppText variant="labelMd" weight="bold" color="variant" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
            נכסים בפרויקט
          </AppText>
        ) : null}
        {body}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title={title} showMenu />

      {body}

      {/* FAB */}
      <Pressable
        onPress={() => setSheetVisible(true)}
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        accessibilityRole="button"
        accessibilityLabel="הוסף חדש"
      >
        <MaterialCommunityIcons name="plus" size={26} color={Colors.onPrimary} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_GAP = Spacing.sm;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  embeddedWrap: { flex: 1, backgroundColor: Colors.background },
  hintBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
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
  fab: {
    position: 'absolute',
    left: CONTENT_HORIZONTAL_PADDING,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
});
