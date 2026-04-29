import React from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import {
  REPORT_TYPE_ICONS,
  REPORT_TYPE_LABELS,
  type SavedReport,
} from '@/lib/mocks/reports';
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  visible: boolean;
  reports: SavedReport[];
  onClose: () => void;
  onSelect: (report: SavedReport) => void;
  onDelete?: (id: string) => void;
};

export function SavedReportsMenu({ visible, reports, onClose, onSelect, onDelete }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={20} color={Colors.onSurface} />
            </Pressable>
            <AppText variant="bodyMd" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
              דוחות שמורים
            </AppText>
            <View style={{ width: 36 }} />
          </View>

          {reports.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="bookmark-outline" size={28} color={Colors.primary} />
              </View>
              <AppText variant="bodyMd" weight="bold" align="center">
                אין דוחות שמורים
              </AppText>
              <AppText variant="bodySm" color="muted" align="center" style={{ maxWidth: 260 }}>
                הגדר סינונים ולחץ "שמור דוח" כדי לשמור את ההגדרות לטעינה מהירה בעתיד
              </AppText>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {reports.map((r, i) => {
                const icon = REPORT_TYPE_ICONS[r.filters.reportType] as React.ComponentProps<
                  typeof MaterialCommunityIcons
                >['name'];
                const tint =
                  r.filters.reportType === 'financial' ? Colors.success : Colors.warning;
                const entityCount = r.filters.entityIds.length;
                const entityText = entityCount === 0 ? 'כל הנכסים' : `${entityCount} נכסים`;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      onSelect(r);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      i < reports.length - 1 && styles.rowBorder,
                      pressed && { backgroundColor: Colors.surfaceVariant },
                    ]}
                    accessibilityRole="button"
                  >
                    <View style={[styles.iconWrap, { backgroundColor: `${tint}20` }]}>
                      <MaterialCommunityIcons name={icon} size={20} color={tint} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyMd" weight="bold" numberOfLines={1}>
                        {r.name}
                      </AppText>
                      <View style={styles.metaRow}>
                        <View
                          style={[styles.tag, { backgroundColor: `${tint}1A` }]}
                        >
                          <AppText variant="caption" weight="semiBold" style={{ color: tint }}>
                            {REPORT_TYPE_LABELS[r.filters.reportType]}
                          </AppText>
                        </View>
                        <AppText variant="caption" color="muted" numberOfLines={1}>
                          {entityText}
                        </AppText>
                        {r.autoConfig.enabled ? (
                          <View style={styles.autoTag}>
                            <MaterialCommunityIcons
                              name="email-fast-outline"
                              size={11}
                              color={Colors.primary}
                            />
                            <AppText variant="caption" weight="semiBold" color="primary">
                              אוטומטי
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                      <AppText variant="caption" color="muted">
                        נשמר ב-{r.savedAt}
                      </AppText>
                    </View>

                    {onDelete ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          onDelete(r.id);
                        }}
                        style={styles.deleteBtn}
                        accessibilityRole="button"
                        accessibilityLabel="מחק דוח שמור"
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={18}
                          color={Colors.error}
                        />
                      </Pressable>
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-left"
                        size={18}
                        color={Colors.onSurfaceMuted}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
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
  list: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  autoTag: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
