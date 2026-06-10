import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { DatePickerModal } from './DatePickerModal';
import { Colors, Spacing, Radius, Shadow, FontFamily, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

// ── Section types ────────────────────────────────────────────────────────────

export type ChipsSection = {
  kind: 'chips';
  label: string;
  options: { key: string; label: string; icon?: string }[];
  value: string;
  onChange: (key: string) => void;
};

export type ConditionalChipsSection = {
  kind: 'conditionalChips';
  label: string;
  options: { key: string; label: string }[];
  value: string | null;
  onChange: (key: string | null) => void;
  visible: boolean;
};

export type DateRangeQuickPreset = {
  label: string;
  from: string;
  to: string;
};

export type DateRangeSection = {
  kind: 'dateRange';
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  quickPresets?: DateRangeQuickPreset[];
};

export type SortSection = {
  kind: 'sort';
  label: string;
  options: { key: string; label: string }[];
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSortKeyChange: (key: string) => void;
  onSortDirToggle: () => void;
};

export type EntitySearchSection = {
  kind: 'entitySearch';
  label: string;
  placeholder?: string;
  options: { key: string; label: string }[];
  value: string | null;
  onChange: (key: string | null) => void;
  visible: boolean;
};

export type FilterSection =
  | ChipsSection
  | ConditionalChipsSection
  | DateRangeSection
  | SortSection
  | EntitySearchSection;

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  sections: FilterSection[];
};

// ── Component ────────────────────────────────────────────────────────────────

export function FilterSheet({ visible, onClose, onReset, sections }: Props) {
  const visibleSections = sections.filter((s) => {
    if (s.kind === 'conditionalChips' || s.kind === 'entitySearch') return s.visible;
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Title bar */}
          <View style={styles.titleBar}>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={18} color={Colors.onSurface} />
            </Pressable>
            <AppText variant="bodyMd" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
              סינון ומיון
            </AppText>
            <Pressable onPress={onReset} accessibilityRole="button" style={styles.resetBtn}>
              <AppText variant="labelSm" weight="semiBold" style={{ color: Colors.error }}>
                איפוס
              </AppText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {visibleSections.map((section, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.section}>
                  <SectionRenderer section={section} />
                </View>
              </React.Fragment>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionAccent} />
      <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabelText}>
        {label}
      </AppText>
    </View>
  );
}

// ── Section renderers ────────────────────────────────────────────────────────

function SectionRenderer({ section }: { section: FilterSection }) {
  switch (section.kind) {
    case 'chips':
      return <ChipsSectionView section={section} />;
    case 'conditionalChips':
      return <ConditionalChipsSectionView section={section} />;
    case 'dateRange':
      return <DateRangeSectionView section={section} />;
    case 'sort':
      return <SortSectionView section={section} />;
    case 'entitySearch':
      return <EntitySearchSectionView section={section} />;
  }
}

function ChipsSectionView({ section }: { section: ChipsSection }) {
  return (
    <>
      <SectionLabel label={section.label} />
      <View style={styles.chipsWrap}>
        {section.options.map((opt) => {
          const active = section.value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => section.onChange(opt.key)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              {opt.icon ? (
                <MaterialCommunityIcons
                  name={opt.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={14}
                  color={active ? Colors.onPrimary : Colors.primary}
                />
              ) : null}
              <AppText
                variant="labelSm"
                weight={active ? 'bold' : 'regular'}
                style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {opt.label}
              </AppText>
              {active && (
                <MaterialCommunityIcons name="check" size={13} color={Colors.onPrimary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function ConditionalChipsSectionView({ section }: { section: ConditionalChipsSection }) {
  return (
    <>
      <SectionLabel label={section.label} />
      <View style={styles.chipsWrap}>
        <Pressable
          onPress={() => section.onChange(null)}
          style={({ pressed }) => [styles.chip, section.value === null && styles.chipActive, pressed && { opacity: 0.85 }]}
          accessibilityRole="radio"
          accessibilityState={{ checked: section.value === null }}
        >
          <AppText
            variant="labelSm"
            weight={section.value === null ? 'bold' : 'regular'}
            style={{ color: section.value === null ? Colors.onPrimary : Colors.onSurfaceVariant }}
          >
            הכל
          </AppText>
          {section.value === null && (
            <MaterialCommunityIcons name="check" size={13} color={Colors.onPrimary} />
          )}
        </Pressable>
        {section.options.map((opt) => {
          const active = section.value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => section.onChange(opt.key)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <AppText
                variant="labelSm"
                weight={active ? 'bold' : 'regular'}
                style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {opt.label}
              </AppText>
              {active && (
                <MaterialCommunityIcons name="check" size={13} color={Colors.onPrimary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function DateRangeSectionView({ section }: { section: DateRangeSection }) {
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

  const applyPreset = (preset: DateRangeQuickPreset) => {
    section.onFromChange(preset.from);
    section.onToChange(preset.to);
  };

  return (
    <>
      <SectionLabel label={section.label} />

      {section.quickPresets && section.quickPresets.length > 0 && (
        <View style={styles.presetRow}>
          {section.quickPresets.map((p) => {
            const active = section.from === p.from && section.to === p.to;
            return (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p)}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                <AppText
                  variant="labelSm"
                  weight={active ? 'bold' : 'regular'}
                  style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
                >
                  {p.label}
                </AppText>
                {active && <MaterialCommunityIcons name="check" size={13} color={Colors.onPrimary} />}
              </Pressable>
            );
          })}
          {(section.from || section.to) ? (
            <Pressable
              onPress={() => { section.onFromChange(''); section.onToChange(''); }}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close-circle-outline" size={13} color={Colors.error} />
              <AppText variant="labelSm" style={{ color: Colors.error }}>ללא הגבלה</AppText>
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.dateRow}>
        <Pressable style={[styles.dateField, { marginLeft: Spacing.sm }]} onPress={() => setPickerTarget('from')}>
          <AppText variant="caption" color="variant" style={{ marginBottom: 4, textAlign: 'right' }}>
            מתאריך
          </AppText>
          <View style={styles.dateInputWrap}>
            <TextInput
              style={[styles.dateInput, { flex: 1 }]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={Colors.onSurfaceMuted}
              value={section.from}
              onChangeText={section.onFromChange}
              textAlign="right"
              onFocus={() => setPickerTarget('from')}
            />
            <MaterialCommunityIcons name="calendar-outline" size={17} color={Colors.primary} style={{ paddingHorizontal: 8 }} />
          </View>
        </Pressable>
        <Pressable style={styles.dateField} onPress={() => setPickerTarget('to')}>
          <AppText variant="caption" color="variant" style={{ marginBottom: 4, textAlign: 'right' }}>
            עד תאריך
          </AppText>
          <View style={styles.dateInputWrap}>
            <TextInput
              style={[styles.dateInput, { flex: 1 }]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={Colors.onSurfaceMuted}
              value={section.to}
              onChangeText={section.onToChange}
              textAlign="right"
              onFocus={() => setPickerTarget('to')}
            />
            <MaterialCommunityIcons name="calendar-outline" size={17} color={Colors.primary} style={{ paddingHorizontal: 8 }} />
          </View>
        </Pressable>
      </View>

      <DatePickerModal
        visible={pickerTarget === 'from'}
        value={section.from}
        onSelect={section.onFromChange}
        onClose={() => setPickerTarget(null)}
        title="בחר תאריך התחלה"
      />
      <DatePickerModal
        visible={pickerTarget === 'to'}
        value={section.to}
        onSelect={section.onToChange}
        onClose={() => setPickerTarget(null)}
        title="בחר תאריך סיום"
      />
    </>
  );
}

function EntitySearchSectionView({ section }: { section: EntitySearchSection }) {
  const [query, setQuery] = useState('');

  const selectedOption = section.value
    ? section.options.find((o) => o.key === section.value)
    : null;

  const displayList = useMemo(() => {
    const q = query.trim();
    if (!q) return section.options.slice(0, 6);
    return section.options.filter((o) => o.label.includes(q)).slice(0, 8);
  }, [query, section.options]);

  const handleSelect = (key: string) => {
    section.onChange(key);
    setQuery('');
  };

  const handleClear = () => {
    section.onChange(null);
    setQuery('');
  };

  return (
    <>
      <SectionLabel label={section.label} />

      {/* Selected entity */}
      {selectedOption ? (
        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [styles.entitySelected, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="הסר בחירה"
        >
          <MaterialCommunityIcons name="check-circle" size={18} color={Colors.primary} />
          <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right', color: Colors.primary }}>
            {selectedOption.label}
          </AppText>
          <MaterialCommunityIcons name="close-circle-outline" size={18} color={Colors.onSurfaceVariant} />
        </Pressable>
      ) : (
        <>
          {/* Search input */}
          <View style={styles.entityInputWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceMuted} style={{ paddingHorizontal: 6 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={section.placeholder ?? 'הקלד לחיפוש...'}
              placeholderTextColor={Colors.onSurfaceMuted}
              style={styles.entityInput}
              textAlign="right"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="נקה">
                <MaterialCommunityIcons name="close-circle" size={16} color={Colors.onSurfaceMuted} style={{ paddingHorizontal: 6 }} />
              </Pressable>
            )}
          </View>

          {/* Results list */}
          {displayList.length > 0 ? (
            <View style={styles.entityList}>
              {displayList.map((opt, idx) => (
                <Pressable
                  key={opt.key}
                  onPress={() => handleSelect(opt.key)}
                  style={({ pressed }) => [
                    styles.entityOption,
                    idx < displayList.length - 1 && styles.entityOptionBorder,
                    pressed && { backgroundColor: Colors.primaryContainer },
                  ]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                  <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                    {opt.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : query.trim().length > 0 ? (
            <View style={styles.noResults}>
              <MaterialCommunityIcons name="magnify-close" size={20} color={Colors.outlineVariant} />
              <AppText variant="caption" color="variant">
                לא נמצאו תוצאות עבור "{query}"
              </AppText>
            </View>
          ) : null}
        </>
      )}
    </>
  );
}

function SortSectionView({ section }: { section: SortSection }) {
  return (
    <>
      <View style={styles.sortHeader}>
        <Pressable
          onPress={section.onSortDirToggle}
          style={({ pressed }) => [styles.dirBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={section.sortDir === 'asc' ? 'סדר עולה' : 'סדר יורד'}
        >
          <MaterialCommunityIcons
            name={section.sortDir === 'asc' ? 'sort-ascending' : 'sort-descending'}
            size={18}
            color={Colors.primary}
          />
          <AppText variant="labelSm" color="primary" weight="semiBold">
            {section.sortDir === 'asc' ? 'עולה' : 'יורד'}
          </AppText>
        </Pressable>
        <SectionLabel label={section.label} />
      </View>
      <View style={styles.chipsWrap}>
        {section.options.map((opt) => {
          const active = section.sortKey === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => section.onSortKeyChange(opt.key)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <AppText
                variant="labelSm"
                weight={active ? 'bold' : 'regular'}
                style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {opt.label}
              </AppText>
              {active && (
                <MaterialCommunityIcons name="check" size={13} color={Colors.onPrimary} />
              )}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...Shadow.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  titleBar: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  resetBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorContainer ?? '#FEE2E2',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing['3xl'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineLight,
    marginTop: Spacing.md,
  },
  section: {
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },

  // Section label
  sectionLabelRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: Colors.accent },
  sectionLabelText: {
    textAlign: 'right',
    color: Colors.onBackground,
  },

  // Chips
  chipsWrap: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.onBackground, borderColor: Colors.onBackground },

  // Date
  presetRow: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  dateInputWrap: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  dateInput: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.onBackground,
    textAlign: 'right',
  },

  // Entity search
  entityInputWrap: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    marginBottom: Spacing.sm,
  },
  entityInput: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onBackground,
    textAlign: 'right',
  },
  entitySelected: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  entityList: {
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  entityOption: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  entityOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  noResults: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },

  // Sort
  sortHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dirBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.outlineLight,
    backgroundColor: Colors.surfaceVariant,
  },
});
