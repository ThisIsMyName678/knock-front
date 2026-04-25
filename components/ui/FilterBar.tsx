import React from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, FontFamily } from '@/constants/tokens';

type Tab = {
  key: string;
  label: string;
};

type Props = {
  search: string;
  onSearchChange: (text: string) => void;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  activeSecondaryCount?: number;
  onFiltersPress?: () => void;
};

export function FilterBar({
  search,
  onSearchChange,
  tabs,
  activeTab,
  onTabChange,
  activeSecondaryCount = 0,
  onFiltersPress,
}: Props) {
  const hasFiltersBtn = !!onFiltersPress;
  const filterActive = activeSecondaryCount > 0;

  return (
    <View style={styles.container}>
      {/* Search row */}
      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={19} color={Colors.onSurfaceMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש..."
          placeholderTextColor={Colors.onSurfaceMuted}
          value={search}
          onChangeText={onSearchChange}
          textAlign="right"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} hitSlop={8} accessibilityLabel="נקה חיפוש">
            <MaterialCommunityIcons name="close-circle" size={17} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {/* Tabs + filter button row */}
      {(tabs && tabs.length > 0) || hasFiltersBtn ? (
        <View style={styles.tabsRow}>
          {tabs && tabs.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
              style={{ flex: 1 }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => onTabChange?.(tab.key)}
                    style={[styles.tab, active && styles.tabActive]}
                    accessibilityRole="button"
                  >
                    <AppText
                      variant="labelSm"
                      weight={active ? 'bold' : 'regular'}
                      style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
                    >
                      {tab.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {hasFiltersBtn && (
            <Pressable
              onPress={onFiltersPress}
              style={[styles.filtersBtn, filterActive && styles.filtersBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="סינון נוסף"
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={16}
                color={filterActive ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <AppText
                variant="labelSm"
                weight={filterActive ? 'bold' : 'regular'}
                style={{ color: filterActive ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                סינון
              </AppText>
              {filterActive && (
                <View style={styles.badge}>
                  <AppText variant="labelSm" weight="bold" style={styles.badgeText}>
                    {activeSecondaryCount}
                  </AppText>
                </View>
              )}
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onBackground,
    padding: 0,
    textAlign: 'right',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tabsScroll: {
    flexDirection: 'row-reverse',
    gap: Spacing.xs,
    paddingHorizontal: 2,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filtersBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
  },
  filtersBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: Colors.onPrimary,
  },
});
