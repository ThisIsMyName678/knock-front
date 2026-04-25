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
  /** Optional quick-preset buttons (e.g. "מתחילת החודש") */
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
  /** Only render this section when true */
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Title bar */}
          <View style={styles.titleBar}>
            <Pressable onPress={onReset} accessibilityRole="button" style={styles.resetBtn}>
              <AppText variant="labelSm" weight="semiBold" style={{ color: Colors.error }}>
                איפוס
              </AppText>
            </Pressable>
            <AppText variant="headingSm" weight="bold" style={{ flex: 1, textAlign: 'center' }}>
              סינון ומיון
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {sections.map((section, idx) => {
              if ((section.kind === 'conditionalChips' || section.kind === 'entitySearch') && !section.visible) return null;
              return (
                <View key={idx} style={styles.section}>
                  <SectionRenderer section={section} />
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
      <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>
        {section.label}
      </AppText>
      <View style={styles.chipsWrap}>
        {section.options.map((opt) => {
          const active = section.value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => section.onChange(opt.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
            >
              {opt.icon ? (
                <MaterialCommunityIcons
                  name={opt.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={15}
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
      <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>
        {section.label}
      </AppText>
      <View style={styles.chipsWrap}>
        <Pressable
          onPress={() => section.onChange(null)}
          style={[styles.chip, section.value === null && styles.chipActive]}
          accessibilityRole="button"
        >
          <AppText
            variant="labelSm"
            weight={section.value === null ? 'bold' : 'regular'}
            style={{ color: section.value === null ? Colors.onPrimary : Colors.onSurfaceVariant }}
          >
            הכל
          </AppText>
        </Pressable>
        {section.options.map((opt) => {
          const active = section.value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => section.onChange(opt.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
            >
              <AppText
                variant="labelSm"
                weight={active ? 'bold' : 'regular'}
                style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
              >
                {opt.label}
              </AppText>
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
      <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>
        {section.label}
      </AppText>

      {/* Quick presets */}
      {section.quickPresets && section.quickPresets.length > 0 ? (
        <View style={styles.presetRow}>
          {section.quickPresets.map((p) => {
            const active = section.from === p.from && section.to === p.to;
            return (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
              >
                <AppText
                  variant="labelSm"
                  weight={active ? 'bold' : 'regular'}
                  style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
                >
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
          {(section.from || section.to) ? (
            <Pressable
              onPress={() => { section.onFromChange(''); section.onToChange(''); }}
              style={styles.chip}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close-circle-outline" size={13} color={Colors.error} />
              <AppText variant="labelSm" style={{ color: Colors.error }}>ללא הגבלה</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Date fields with calendar icon */}
      <View style={styles.dateRow}>
        <Pressable style={[styles.dateField, { marginLeft: Spacing.sm }]} onPress={() => setPickerTarget('from')}>
          <AppText variant="caption" color="variant" style={{ marginBottom: 2, textAlign: 'right' }}>
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
            <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.primary} style={{ paddingHorizontal: 4 }} />
          </View>
        </Pressable>
        <Pressable style={styles.dateField} onPress={() => setPickerTarget('to')}>
          <AppText variant="caption" color="variant" style={{ marginBottom: 2, textAlign: 'right' }}>
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
            <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.primary} style={{ paddingHorizontal: 4 }} />
          </View>
        </Pressable>
      </View>

      {/* Calendar pickers */}
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

  const selectedOption = section.value ? section.options.find((o) => o.key === section.value) : null;

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return section.options.filter((o) => o.label.includes(q)).slice(0, 8);
  }, [query, section.options]);

  return (
    <>
      <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>
        {section.label}
      </AppText>

      {/* Selected entity chip */}
      {selectedOption ? (
        <Pressable
          onPress={() => { section.onChange(null); setQuery(''); }}
          style={styles.entitySelected}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close-circle" size={16} color={Colors.primary} />
          <AppText variant="labelSm" weight="semiBold" style={{ color: Colors.primary, flex: 1, textAlign: 'right' }}>
            {selectedOption.label}
          </AppText>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.primary} />
        </Pressable>
      ) : (
        <>
          <View style={styles.entityInputWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceMuted} style={{ paddingHorizontal: 4 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={section.placeholder ?? 'חיפוש...'}
              placeholderTextColor={Colors.onSurfaceMuted}
              style={styles.entityInput}
              textAlign="right"
            />
          </View>
          {query.trim().length > 0 && filtered.length === 0 && (
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.xs }}>
              לא נמצאו תוצאות
            </AppText>
          )}
          {filtered.length > 0 && (
            <View style={styles.entityList}>
              {filtered.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => { section.onChange(opt.key); setQuery(''); }}
                  style={styles.entityOption}
                  accessibilityRole="button"
                >
                  <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                    {opt.label}
                  </AppText>
                  <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </>
  );
}

function SortSectionView({ section }: { section: SortSection }) {
  return (
    <>
      <AppText variant="labelSm" weight="semiBold" style={styles.sectionLabel}>
        {section.label}
      </AppText>
      <View style={styles.sortRow}>
        <View style={[styles.chipsWrap, { flex: 1 }]}>
          {section.options.map((opt) => {
            const active = section.sortKey === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => section.onSortKeyChange(opt.key)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
              >
                <AppText
                  variant="labelSm"
                  weight={active ? 'bold' : 'regular'}
                  style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={section.onSortDirToggle}
          style={styles.dirBtn}
          accessibilityRole="button"
          accessibilityLabel={section.sortDir === 'asc' ? 'סדר עולה' : 'סדר יורד'}
        >
          <MaterialCommunityIcons
            name={section.sortDir === 'asc' ? 'sort-ascending' : 'sort-descending'}
            size={20}
            color={Colors.primary}
          />
          <AppText variant="caption" color="primary">
            {section.sortDir === 'asc' ? 'עולה' : 'יורד'}
          </AppText>
        </Pressable>
      </View>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '82%',
    ...Shadow.lg,
  },
  titleBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  resetBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
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
    gap: Spacing.xs,
  },
  section: {
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    textAlign: 'right',
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
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
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  dateInputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    overflow: 'hidden',
  },
  dateInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.onBackground,
    textAlign: 'right',
  },
  entityInputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    marginBottom: Spacing.xs,
  },
  entityInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onBackground,
    textAlign: 'right',
  },
  entitySelected: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.xs,
  },
  entityList: {
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  entityOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    gap: Spacing.sm,
  },
  sortRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dirBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
    minWidth: 52,
  },
});
