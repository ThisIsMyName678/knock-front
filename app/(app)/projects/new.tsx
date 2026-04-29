import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/lib/mocks/documents';
import { Badge } from '@/components/ui/Badge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
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
import { RTL_ROW } from '@/constants/rtl';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectKind = 'residential' | 'mixed' | 'commercial' | 'offices' | 'other';

type AddressSuggestion = {
  label: string;
  street: string;
  city: string;
};

type Step1Data = {
  kind: ProjectKind | null;
  name: string;
  address: string;
  addressSuggestion: AddressSuggestion | null;
  description: string;
  floors: string;
  units: string;
  builtYear: string;
  projectValue: string;
  managementFee: string;
};

type FileSource = 'files' | 'photos' | 'camera';

type FileEntry = {
  id: string;
  displayName: string;
  category: DocumentType;
  source: FileSource;
};

type Step2Data = {
  files: FileEntry[];
  pendingName: string;
  pendingCategory: DocumentType;
  pendingSource: FileSource | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_KINDS: {
  key: ProjectKind;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { key: 'residential', label: 'בניין מגורים', icon: 'home-city-outline' },
  { key: 'mixed', label: 'בניין מעורב', icon: 'office-building-outline' },
  { key: 'commercial', label: 'מבנה מסחרי', icon: 'store-outline' },
  { key: 'offices', label: 'מבנה משרדים', icon: 'briefcase-outline' },
  { key: 'other', label: 'אחר', icon: 'dots-horizontal-circle-outline' },
];

const SOURCE_OPTIONS: { key: FileSource; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'files', label: 'קבצים', icon: 'folder-outline' },
  { key: 'photos', label: 'תמונות', icon: 'image-outline' },
  { key: 'camera', label: 'מצלמה', icon: 'camera-outline' },
];

const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  'contract', 'plan', 'report', 'payment', 'work_agreement',
  'asset_docs', 'meter_readings', 'formats', 'guarantees',
  'accounts', 'invoice_receipt', 'other',
];

const STEP_TITLES = ['פרטי הפרויקט', 'הוספת קבצים'];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <View style={indicatorStyles.row}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i + 1 === step;
        const isDone = i + 1 < step;
        return (
          <React.Fragment key={i}>
            <View
              style={[
                indicatorStyles.dot,
                isActive && indicatorStyles.dotActive,
                isDone && indicatorStyles.dotDone,
              ]}
            >
              {isDone ? (
                <MaterialCommunityIcons name="check" size={12} color={Colors.onPrimary} />
              ) : (
                <AppText
                  variant="labelSm"
                  weight="bold"
                  style={{ color: isActive ? Colors.onPrimary : Colors.onSurfaceMuted }}
                >
                  {i + 1}
                </AppText>
              )}
            </View>
            {i < total - 1 && (
              <View style={[indicatorStyles.line, (isDone || isActive) && indicatorStyles.lineActive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: Spacing.base,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  line: { height: 2, width: 32, backgroundColor: Colors.outlineLight },
  lineActive: { backgroundColor: Colors.primary },
});

// ─── FieldInput ───────────────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  required,
  multiline,
  numberOfLines,
  inputStyle,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  suffix?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  inputStyle?: object;
  error?: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <AppText variant="labelMd" weight="semiBold" style={fieldStyles.label}>
        {label}
        {required && <AppText variant="labelMd" color="error"> *</AppText>}
      </AppText>
      <View style={[fieldStyles.row, multiline && { alignItems: 'flex-start' }, error ? { borderColor: Colors.error } : undefined]}>
        <TextInput
          style={[fieldStyles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.onSurfaceMuted}
          keyboardType={keyboardType}
          textAlign="right"
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {suffix && (
          <AppText variant="bodyMd" color="variant" style={fieldStyles.suffix}>
            {suffix}
          </AppText>
        )}
      </View>
      {error ? (
        <AppText variant="caption" color="error" style={{ textAlign: 'right' }}>{error}</AppText>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: { textAlign: 'right', color: Colors.onBackground },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
  },
  suffix: { paddingHorizontal: Spacing.md, color: Colors.onSurfaceVariant },
});

// ─── Expandable ───────────────────────────────────────────────────────────────

function Expandable({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={expandStyles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={expandStyles.header}
        accessibilityRole="button"
      >
        <View style={expandStyles.titleRow}>
          <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} />
          <AppText variant="labelLg" weight="bold" color="primary">
            {title}
          </AppText>
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </Pressable>
      {open && <View style={expandStyles.body}>{children}</View>}
    </View>
  );
}

const expandStyles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.base,
  },
  header: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.primaryContainer,
  },
  titleRow: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm },
  body: { padding: Spacing.md, gap: Spacing.base, backgroundColor: Colors.surface },
});

// ─── Address Autocomplete ─────────────────────────────────────────────────────

const ADDRESS_DATASTORE_URL =
  'https://data.gov.il/api/3/action/datastore_search?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b';

function strField(r: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v == null) continue;
    const s = typeof v === 'string' ? v.trim() : String(v).trim();
    if (s) return s;
  }
  return '';
}

function parseGovIlAddressRecord(r: Record<string, unknown>): AddressSuggestion | null {
  const street = strField(r, [
    'שם_רחוב', 'שם רחוב', 'תיאור_רחוב', 'STREET_NAME', 'street_name', 'שם_רחוב_רשמי',
  ]);
  const city = strField(r, [
    'שם_ישוב', 'שם ישוב', 'YISHUV_NAME', 'yishuv_name', 'שם_ישוב_רשמי', 'ישוב',
  ]);
  const house = strField(r, ['מספר_בית', 'מספר בית', 'HOUSE_NUMBER', 'house_number', 'מבנה']);
  const single = strField(r, ['כתובת', 'address', 'Address', 'FULL_ADDRESS', 'full_address']);

  if (street && city) {
    const streetPart = house ? `${street} ${house}` : street;
    return { label: `${streetPart}, ${city}`, street: streetPart, city };
  }
  if (single) return { label: single, street: single, city: city || '' };
  if (street) return { label: city ? `${street}, ${city}` : street, street, city: city || '' };
  return null;
}

function AddressAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `${ADDRESS_DATASTORE_URL}&q=${encodeURIComponent(value)}&limit=12`;
        const res = await fetch(url);
        const json = (await res.json()) as {
          success?: boolean;
          result?: { records?: Record<string, unknown>[] };
        };
        if (!res.ok || json?.success === false) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        const records = json?.result?.records ?? [];
        const seen = new Set<string>();
        const mapped: AddressSuggestion[] = [];
        for (const raw of records) {
          const parsed = parseGovIlAddressRecord(raw);
          if (!parsed || seen.has(parsed.label)) continue;
          seen.add(parsed.label);
          mapped.push(parsed);
          if (mapped.length >= 8) break;
        }
        setSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [value]);

  const handleSelect = (s: AddressSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(s.label);
    onSelect(s);
  };

  return (
    <View>
      <View style={autoStyles.inputWrap}>
        <MaterialCommunityIcons name="map-search-outline" size={18} color={Colors.onSurfaceVariant} />
        <TextInput
          style={autoStyles.input}
          value={value}
          onChangeText={(t) => onChange(t)}
          placeholder="חפש כתובת..."
          placeholderTextColor={Colors.onSurfaceMuted}
          textAlign="right"
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />}
        {!loading && value.length > 0 && (
          <Pressable
            onPress={() => { onChange(''); setSuggestions([]); setShowSuggestions(false); }}
            accessibilityRole="button"
            accessibilityLabel="נקה"
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={autoStyles.dropdown}>
          {suggestions.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => handleSelect(s)}
              style={({ pressed }) => [
                autoStyles.suggestion,
                pressed && { backgroundColor: Colors.primaryContainer },
              ]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.primary} />
              <AppText variant="bodyMd" style={{ flex: 1 }}>{s.label}</AppText>
            </Pressable>
          ))}
          <Pressable
            onPress={() => { setShowSuggestions(false); setSuggestions([]); }}
            style={autoStyles.manualFallback}
            accessibilityRole="button"
          >
            <AppText variant="labelMd" color="primary" weight="semiBold">הכנסה ידנית</AppText>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const autoStyles = StyleSheet.create({
  inputWrap: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    paddingVertical: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    marginTop: 4,
    ...Shadow.md,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  manualFallback: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primaryContainer,
  },
});

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  data,
  setData,
  errors,
  showErrors,
}: {
  data: Step1Data;
  setData: React.Dispatch<React.SetStateAction<Step1Data>>;
  errors?: { kind: string; name: string; address: string };
  showErrors?: boolean;
}) {
  const update = useCallback(
    <K extends keyof Step1Data>(key: K, val: Step1Data[K]) =>
      setData((prev) => ({ ...prev, [key]: val })),
    [setData],
  );

  return (
    <View style={{ gap: Spacing.base }}>
      {/* Project kind */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <AppText variant="labelLg" weight="bold" style={s1.label}>סוג הפרויקט</AppText>
          <AppText variant="labelLg" weight="bold" style={{ color: Colors.error }}>*</AppText>
        </View>
        <View style={s1.kindGrid}>
          {PROJECT_KINDS.map((k) => (
            <Pressable
              key={k.key}
              onPress={() => update('kind', k.key)}
              style={({ pressed }) => [
                s1.kindCard,
                data.kind === k.key && s1.kindCardActive,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: data.kind === k.key }}
            >
              <MaterialCommunityIcons
                name={k.icon}
                size={26}
                color={data.kind === k.key ? Colors.onPrimary : Colors.primary}
              />
              <AppText
                variant="labelSm"
                weight="semiBold"
                align="center"
                style={{ color: data.kind === k.key ? Colors.onPrimary : Colors.onBackground }}
              >
                {k.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        {showErrors && errors?.kind ? (
          <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 2 }}>{errors.kind}</AppText>
        ) : null}
      </View>

      {/* Name */}
      <FieldInput
        label="שם הפרויקט"
        value={data.name}
        onChangeText={(t) => update('name', t)}
        placeholder="לדוגמה: מגדלי הים"
        required
        error={showErrors ? errors?.name : ''}
      />

      {/* Address */}
      <View style={{ gap: Spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <AppText variant="labelMd" weight="semiBold" style={s1.label}>כתובת</AppText>
          <AppText variant="labelMd" weight="bold" style={{ color: Colors.error }}>*</AppText>
        </View>
        <AddressAutocomplete
          value={data.address}
          onChange={(t) => update('address', t)}
          onSelect={(s) => update('addressSuggestion', s)}
        />
        {showErrors && errors?.address ? (
          <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 2 }}>{errors.address}</AppText>
        ) : null}
      </View>

      {/* Description */}
      <FieldInput
        label="תיאור (אופציונלי)"
        value={data.description}
        onChangeText={(t) => update('description', t)}
        placeholder="תיאור קצר של הפרויקט..."
        multiline
        numberOfLines={3}
        inputStyle={{ height: 80, paddingTop: Spacing.sm }}
      />

      {/* Building info */}
      <Expandable title="פרטי בניין" icon="office-building-cog-outline">
        <FieldInput
          label="מספר קומות"
          value={data.floors}
          onChangeText={(t) => update('floors', t)}
          placeholder="לדוגמה: 8"
          keyboardType="numeric"
        />
        <FieldInput
          label="מספר יחידות דיור"
          value={data.units}
          onChangeText={(t) => update('units', t)}
          placeholder="לדוגמה: 40"
          keyboardType="numeric"
        />
        <FieldInput
          label="שנת בנייה"
          value={data.builtYear}
          onChangeText={(t) => update('builtYear', t)}
          placeholder="לדוגמה: 2010"
          keyboardType="numeric"
        />
      </Expandable>

      {/* Financial */}
      <Expandable title="פרטים פיננסיים" icon="currency-ils">
        <FieldInput
          label="שווי הפרויקט"
          value={data.projectValue}
          onChangeText={(t) => update('projectValue', t)}
          placeholder="10,000,000"
          keyboardType="numeric"
          suffix="₪"
        />
        <FieldInput
          label="דמי ניהול חודשיים"
          value={data.managementFee}
          onChangeText={(t) => update('managementFee', t)}
          placeholder="5,000"
          keyboardType="numeric"
          suffix="₪"
        />
      </Expandable>
    </View>
  );
}

const s1 = StyleSheet.create({
  label: { textAlign: 'right', color: Colors.onBackground, marginBottom: Spacing.sm },
  kindGrid: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  kindCard: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    minHeight: 76,
  },
  kindCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  data,
  setData,
}: {
  data: Step2Data;
  setData: React.Dispatch<React.SetStateAction<Step2Data>>;
}) {
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const update = <K extends keyof Step2Data>(key: K, val: Step2Data[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const canAdd = data.pendingSource !== null;

  const commitFile = () => {
    if (!data.pendingSource) return;
    const name = data.pendingName.trim() || `קובץ ${data.files.length + 1}`;
    setData((prev) => ({
      ...prev,
      files: [
        ...prev.files,
        { id: String(Date.now()), displayName: name, category: prev.pendingCategory, source: prev.pendingSource! },
      ],
      pendingName: '',
      pendingSource: null,
    }));
  };

  const removeFile = (id: string) => {
    update('files', data.files.filter((f) => f.id !== id));
  };

  return (
    <View style={{ gap: Spacing.lg }}>
      <AppText variant="bodyMd" color="variant" style={{ textAlign: 'right' }}>
        הוסף קבצים ומסמכים לפרויקט. ניתן להוסיף מספר קבצים ולהמשיך לסיום בכל עת.
      </AppText>

      {/* ── Add-file form card ── */}
      <View style={s2.formCard}>
        <View style={s2.formCardHeader}>
          <MaterialCommunityIcons name="file-plus-outline" size={18} color={Colors.primary} />
          <AppText variant="labelLg" weight="bold" color="primary">הוספת קובץ</AppText>
        </View>

        {/* File name */}
        <FieldInput
          label="שם קובץ"
          value={data.pendingName}
          onChangeText={(t) => update('pendingName', t)}
          placeholder="לדוגמה: היתר בנייה 2025"
        />

        {/* Category */}
        <View style={{ gap: Spacing.xs }}>
          <AppText variant="labelMd" weight="semiBold" style={s2.label}>קטגוריה</AppText>
          <Pressable onPress={() => setCategorySheetOpen(true)} style={s2.dropdownRow} accessibilityRole="button">
            <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
            <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
              {DOCUMENT_TYPE_LABELS[data.pendingCategory]}
            </AppText>
          </Pressable>
        </View>

        {/* Source selection */}
        <View style={{ gap: Spacing.xs }}>
          <AppText variant="labelMd" weight="semiBold" style={s2.label}>מקור הקובץ</AppText>
          <View style={s2.sourceRow}>
            {SOURCE_OPTIONS.map((src) => {
              const active = data.pendingSource === src.key;
              return (
                <Pressable
                  key={src.key}
                  onPress={() => update('pendingSource', active ? null : src.key)}
                  style={({ pressed }) => [s2.sourceBtn, active && s2.sourceBtnActive, pressed && { opacity: 0.8 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                >
                  <MaterialCommunityIcons name={src.icon} size={24} color={active ? Colors.onPrimary : Colors.primary} />
                  <AppText variant="caption" align="center" weight="semiBold" style={{ color: active ? Colors.onPrimary : Colors.primary }}>
                    {src.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Add button */}
        <Pressable
          onPress={commitFile}
          disabled={!canAdd}
          style={({ pressed }) => [s2.addBtn, !canAdd && s2.addBtnDisabled, pressed && canAdd && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={canAdd ? Colors.onPrimary : Colors.onSurfaceMuted} />
          <AppText variant="labelMd" weight="bold" style={{ color: canAdd ? Colors.onPrimary : Colors.onSurfaceMuted }}>
            הוסף קובץ לרשימה
          </AppText>
        </Pressable>
      </View>

      {/* ── Added files list ── */}
      {data.files.length > 0 ? (
        <View style={{ gap: Spacing.sm }}>
          <View style={s2.listHeader}>
            <Badge label={String(data.files.length)} preset="primary" />
            <AppText variant="labelMd" weight="bold" style={{ textAlign: 'right' }}>
              קבצים שנוספו
            </AppText>
          </View>
          {data.files.map((f) => (
            <View key={f.id} style={s2.fileRow}>
              <View style={s2.fileIconWrap}>
                <MaterialCommunityIcons
                  name={f.source === 'camera' ? 'camera-outline' : f.source === 'photos' ? 'image-outline' : 'folder-outline'}
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>{f.displayName}</AppText>
                <AppText variant="caption" color="variant">{DOCUMENT_TYPE_LABELS[f.category]}</AppText>
              </View>
              <Pressable onPress={() => removeFile(f.id)} style={s2.removeBtn} accessibilityRole="button" accessibilityLabel="הסר קובץ" hitSlop={8}>
                <MaterialCommunityIcons name="close" size={14} color={Colors.onSurfaceVariant} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={s2.emptyHint}>
          <MaterialCommunityIcons name="folder-open-outline" size={32} color={Colors.outlineVariant} />
          <AppText variant="bodySm" color="variant" align="center">
            עדיין לא נוספו קבצים.{'\n'}מלא את הפרטים למעלה והוסף קובץ ראשון.
          </AppText>
        </View>
      )}

      {/* Category bottom sheet */}
      <Modal visible={categorySheetOpen} transparent animationType="slide" onRequestClose={() => setCategorySheetOpen(false)}>
        <Pressable style={s2.sheetOverlay} onPress={() => setCategorySheetOpen(false)}>
          <Pressable style={s2.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s2.sheetHandle} />
            <AppText variant="headingSm" weight="bold" style={{ textAlign: 'right', marginBottom: Spacing.md }}>
              בחר קטגוריה
            </AppText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DOCUMENT_TYPE_ORDER.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { update('pendingCategory', t); setCategorySheetOpen(false); }}
                  style={({ pressed }) => [s2.sheetRow, data.pendingCategory === t && s2.sheetRowActive, pressed && { opacity: 0.85 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: data.pendingCategory === t }}
                >
                  {data.pendingCategory === t && (
                    <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />
                  )}
                  <AppText
                    variant="bodyMd"
                    weight={data.pendingCategory === t ? 'bold' : 'regular'}
                    style={{ flex: 1, textAlign: 'right', color: data.pendingCategory === t ? Colors.primary : Colors.onBackground }}
                  >
                    {DOCUMENT_TYPE_LABELS[t]}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s2 = StyleSheet.create({
  label: { textAlign: 'right', color: Colors.onBackground },

  // Form card
  formCard: {
    borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.xl,
    overflow: 'hidden', backgroundColor: Colors.surface,
    gap: Spacing.base, padding: Spacing.md,
  },
  formCardHeader: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight,
  },

  // Category dropdown
  dropdownRow: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md,
    padding: Spacing.md, backgroundColor: Colors.surfaceVariant,
  },

  // Source selector
  sourceRow: { flexDirection: RTL_ROW, gap: Spacing.sm },
  sourceBtn: {
    flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  sourceBtnActive: { backgroundColor: Colors.primary },

  // Add button
  addBtn: {
    flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },
  addBtnDisabled: { backgroundColor: Colors.surfaceVariant },

  // File list
  listHeader: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end' },
  fileRow: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  fileIconWrap: {
    width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
  },
  removeBtn: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm, backgroundColor: Colors.outlineLight,
  },

  // Empty state
  emptyHint: {
    alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl,
    borderWidth: 1, borderColor: Colors.outlineLight, borderRadius: Radius.xl,
    borderStyle: 'dashed', backgroundColor: Colors.surfaceVariant,
  },

  // Category sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing['2xl'], paddingTop: Spacing.md,
    maxHeight: '70%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginBottom: Spacing.md },
  sheetRow: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight,
  },
  sheetRowActive: { backgroundColor: Colors.primaryContainer },

});

// ─── Wizard ───────────────────────────────────────────────────────────────────

export default function NewProjectScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);

  const [step1, setStep1] = useState<Step1Data>({
    kind: null,
    name: '',
    address: '',
    addressSuggestion: null,
    description: '',
    floors: '',
    units: '',
    builtYear: '',
    projectValue: '',
    managementFee: '',
  });

  const [step2, setStep2] = useState<Step2Data>({
    files: [],
    pendingName: '',
    pendingCategory: 'other',
    pendingSource: null,
  });

  const [step1Submitted, setStep1Submitted] = useState(false);

  const step1Errors = useMemo(() => ({
    kind: step1.kind === null ? 'יש לבחור סוג פרויקט' : '',
    name: step1.name.trim().length === 0 ? 'שדה חובה' : '',
    address: step1.address.trim().length === 0 ? 'שדה חובה' : '',
  }), [step1.kind, step1.name, step1.address]);

  const step1Valid = Object.values(step1Errors).every((e) => !e);

  const handleNext = () => {
    if (step === 1) {
      setStep1Submitted(true);
      if (!step1Valid) return;
      setStep((s) => s + 1);
      return;
    }
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    router.back();
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader title="פרויקט חדש" showBack onBack={handleBack} />

      {/* Step indicator */}
      <View style={wizardStyles.indicatorWrap}>
        <StepIndicator step={step} total={2} />
        <AppText
          variant="bodyMd"
          weight="semiBold"
          color="primary"
          align="center"
          style={{ marginTop: -Spacing.sm, marginBottom: Spacing.sm }}
        >
          שלב {step} מתוך 2 — {STEP_TITLES[step - 1]}
        </AppText>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[wizardStyles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && <Step1 data={step1} setData={setStep1} errors={step1Errors} showErrors={step1Submitted} />}
        {step === 2 && <Step2 data={step2} setData={setStep2} />}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[wizardStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step > 1 && (
          <Pressable
            onPress={handleBack}
            style={wizardStyles.footerSecondary}
            accessibilityRole="button"
          >
            <AppText variant="bodyMd" weight="semiBold" color="primary">
              הקודם
            </AppText>
          </Pressable>
        )}
        <Button
          label={step === 2 ? 'סיום' : 'הבא'}
          onPress={handleNext}
          style={wizardStyles.footerPrimary}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const wizardStyles = StyleSheet.create({
  indicatorWrap: {
    backgroundColor: Colors.surface,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.xl,
  },
  footer: {
    flexDirection: RTL_ROW,
    gap: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    ...Shadow.sm,
  },
  footerPrimary: { flex: 1 },
  footerSecondary: {
    flex: 1,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
});
