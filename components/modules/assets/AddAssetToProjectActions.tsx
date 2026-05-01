import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  MIN_TOUCH,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import type { AssetEntity } from '@/lib/mocks/assets';
import { getUnassignedAssets, linkAssetToProject } from '@/lib/mocks/assets';

type Props = {
  projectId: string;
  projectName: string;
  /** לאחר שיוך נכס מרשימה (לרענון רשימת נכסים באב) */
  onAssetsChanged?: () => void;
  /** FAB במסך פרויקט / כפתורים בשורה באשף */
  variant?: 'fab' | 'inline';
};

export function AddAssetToProjectActions({
  projectId,
  projectName,
  onAssetsChanged,
  variant = 'fab',
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closePick = useCallback(() => setPickOpen(false), []);

  const handlePickExisting = useCallback(() => {
    closeMenu();
    setPickOpen(true);
  }, [closeMenu]);

  const handleNewAsset = useCallback(() => {
    closeMenu();
    router.push({
      pathname: '/(app)/assets-screens/new',
      params: {
        preloadedProjectId: projectId,
        preloadedProjectName: projectName,
      },
    });
  }, [closeMenu, projectId, projectName]);

  const handleLinkAsset = useCallback(
    (asset: AssetEntity) => {
      linkAssetToProject(asset.id, projectId);
      closePick();
      onAssetsChanged?.();
    },
    [projectId, closePick, onAssetsChanged],
  );

  const unassigned = getUnassignedAssets();

  const trigger =
    variant === 'fab' ? (
      <Pressable
        onPress={openMenu}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + Spacing.lg },
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="הוספת נכס לפרויקט"
      >
        <MaterialCommunityIcons name="plus" size={28} color={Colors.onPrimary} />
      </Pressable>
    ) : (
      <View style={styles.inlineRow}>
        <Pressable
          onPress={openMenu}
          style={({ pressed }) => [styles.inlineBtn, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={Colors.primary} />
          <AppText variant="bodyMd" weight="semiBold" color="primary">
            הוסף נכס
          </AppText>
        </Pressable>
      </View>
    );

  return (
    <>
      {trigger}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <AppText variant="headingSm" weight="bold" style={styles.sheetTitle}>
              הוספת נכס
            </AppText>
            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={handlePickExisting}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color={Colors.primary} />
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                בחירה מנכסים קיימים
              </AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={handleNewAsset}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="home-plus-outline" size={22} color={Colors.primary} />
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                יצירת נכס חדש
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={pickOpen} transparent animationType="slide" onRequestClose={closePick}>
        <Pressable style={styles.overlay} onPress={closePick}>
          <Pressable
            style={[styles.pickerSheet, { maxHeight: winH * 0.55, paddingBottom: insets.bottom + Spacing.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <AppText variant="headingSm" weight="bold" style={styles.sheetTitle}>
              נכסים ללא שיוך לפרויקט
            </AppText>
            <FlatList
              data={unassigned}
              keyExtractor={(a) => a.id}
              contentContainerStyle={{ paddingTop: Spacing.sm }}
              ListEmptyComponent={
                <AppText variant="bodyMd" color="variant" style={{ textAlign: 'center', paddingVertical: Spacing.xl }}>
                  אין נכסים פנויים לשיוך
                </AppText>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.pickRow, pressed && { opacity: 0.85 }]}
                  onPress={() => handleLinkAsset(item)}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="home-outline" size={20} color={Colors.primaryLight} />
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <AppText variant="bodyMd" weight="semiBold">
                      {item.name}
                    </AppText>
                    <AppText variant="caption" color="variant" numberOfLines={2}>
                      {item.address}
                    </AppText>
                  </View>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    end: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
    zIndex: 20,
  },
  inlineRow: {
    flexDirection: RTL_ROW,
  },
  inlineBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    minHeight: MIN_TOUCH,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    textAlign: 'right',
    marginBottom: Spacing.md,
  },
  sheetRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  sheetRowPressed: {
    backgroundColor: Colors.surfaceVariant,
  },
  pickRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
});
