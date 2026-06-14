import React from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, FontFamily, Shadow } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Tab = { key: string; label: string };

type Props = {
  search: string;
  onSearchChange: (text: string) => void;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  activeSecondaryCount?: number;
  onFiltersPress?: () => void;
};

export function FilterBar({ search, onSearchChange, tabs, activeTab, onTabChange, activeSecondaryCount = 0, onFiltersPress }: Props) {
  const hasFiltersBtn = !!onFiltersPress;
  const filterActive = activeSecondaryCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש..."
          placeholderTextColor={Colors.onSurfaceMuted}
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} hitSlop={8} accessibilityLabel="נקה חיפוש">
            <MaterialCommunityIcons name="close-circle" size={17} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
        <MaterialCommunityIcons name="magnify" size={19} color={Colors.onSurfaceMuted} />
      </View>
      {((tabs && tabs.length > 0) || hasFiltersBtn) && (
        <View style={styles.tabsRow}>
          {tabs && tabs.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll} style={{ flex: 1 }}>
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => onTabChange?.(tab.key)}
                    style={[styles.tab, active && styles.tabActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <AppText variant="labelSm" weight={active ? 'bold' : 'regular'} color={active ? 'onPrimary' : 'variant'}>
                      {tab.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {hasFiltersBtn && (
            <Pressable onPress={onFiltersPress} style={[styles.filtersBtn, filterActive && styles.filtersBtnActive]} accessibilityRole="button" accessibilityLabel="סינון נוסף">
              <MaterialCommunityIcons name="tune-variant" size={16} color={filterActive ? Colors.accent : Colors.onSurfaceVariant} />
              <AppText variant="labelSm" weight={filterActive ? 'bold' : 'regular'} style={{ color: filterActive ? Colors.accent : Colors.onSurfaceVariant }}>סינון</AppText>
              {filterActive && (
                <View style={styles.badge}>
                  <AppText variant="labelSm" weight="bold" style={styles.badgeText}>{activeSecondaryCount}</AppText>
                </View>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  searchRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: 14, color: Colors.onBackground, padding: 0, textAlign: 'right', writingDirection: 'rtl' },
  tabsRow: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm },
  tabsScroll: { flexDirection: RTL_ROW, gap: Spacing.xs, paddingHorizontal: 2 },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineLight, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.onBackground, borderColor: Colors.onBackground },
  filtersBtn: { flexDirection: RTL_ROW, alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineLight, backgroundColor: Colors.surface },
  filtersBtnActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
  badge: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, color: Colors.onAccent },
});
