import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { PAYMENT_ENTITY_OPTIONS } from '@/lib/mocks/payments';
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  CONTENT_HORIZONTAL_PADDING,
  FontFamily,
  FontSize,
  MIN_TOUCH,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  visible: boolean;
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
};

export function EntityMultiSelectModal({
  visible,
  selectedIds,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [query, setQuery] = useState('');
  const [prevVisible, setPrevVisible] = useState(visible);

  // Sync state during render to avoid commit-phase double renders
  if (visible && !prevVisible) {
    setDraft(selectedIds);
    setQuery('');
    setPrevVisible(true);
  } else if (!visible && prevVisible) {
    setPrevVisible(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAYMENT_ENTITY_OPTIONS;
    return PAYMENT_ENTITY_OPTIONS.filter((e) =>
      `${e.name} ${e.address}`.toLowerCase().includes(q),
    );
  }, [query]);

  const allIds = PAYMENT_ENTITY_OPTIONS.map((e) => e.id);
  const allSelected = draft.length === allIds.length;

  const toggle = (id: string) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setDraft(allSelected ? [] : allIds);
  };

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={20} color={Colors.onSurface} />
            </Pressable>
            <AppText variant="bodyMd" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
              בחירת נכסים ופרויקטים
            </AppText>
            <View style={{ width: 36 }} />
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="חיפוש לפי שם או כתובת"
              placeholderTextColor={Colors.onSurfaceMuted}
              style={styles.searchInput}
              textAlign="right"
            />
          </View>

          {/* Select all */}
          <Pressable
            onPress={toggleAll}
            style={({ pressed }) => [styles.allRow, pressed && styles.rowPressed]}
            accessibilityRole="button"
          >
            <View style={[styles.checkbox, allSelected && styles.checkboxChecked]}>
              {allSelected ? (
                <MaterialCommunityIcons name="check" size={16} color={Colors.onPrimary} />
              ) : null}
            </View>
            <AppText variant="bodyMd" weight="bold" style={{ flex: 1 }}>
              {allSelected ? 'בטל את הכל' : 'בחר הכל'}
            </AppText>
            <AppText variant="caption" color="muted">
              {draft.length} / {allIds.length}
            </AppText>
          </Pressable>

          {/* List */}
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText variant="bodySm" color="muted" align="center">
                  לא נמצאו תוצאות
                </AppText>
              </View>
            ) : (
              filtered.map((e) => {
                const checked = draft.includes(e.id);
                const isProject = e.kind === 'project';
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => toggle(e.id)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? (
                        <MaterialCommunityIcons name="check" size={16} color={Colors.onPrimary} />
                      ) : null}
                    </View>
                    <View style={styles.entityIcon}>
                      <MaterialCommunityIcons
                        name={isProject ? 'office-building-outline' : 'home-outline'}
                        size={18}
                        color={isProject ? Colors.info : Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyMd" weight="semiBold" numberOfLines={1}>
                        {e.name}
                      </AppText>
                      <AppText variant="caption" color="muted" numberOfLines={1}>
                        {e.address}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.kindBadge,
                        { backgroundColor: isProject ? Colors.infoContainer : Colors.primaryContainer },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight="bold"
                        style={{ color: isProject ? Colors.info : Colors.primary }}
                      >
                        {isProject ? 'פרויקט' : 'נכס'}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="ghost"
              label="נקה"
              onPress={() => setDraft([])}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              label={`אישור (${draft.length})`}
              onPress={handleConfirm}
              size="md"
              style={{ flex: 2 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.outlineVariant,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    minHeight: MIN_TOUCH,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    paddingVertical: Spacing.sm,
  },
  allRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  rowPressed: { opacity: 0.7 },
  list: {
    flexGrow: 0,
    marginTop: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  entityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  emptyWrap: {
    paddingVertical: Spacing.xl,
  },
  footer: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    marginTop: Spacing.md,
  },
});
