import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MOCK_ASSETS, MOCK_PROJECTS } from '@/lib/mocks/assets';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
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
import { AppHeader } from '@/components/ui/AppHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetKind = 'apartment' | 'house' | 'commercial';

type AmenityKey =
  | 'garden'
  | 'balcony'
  | 'furnished'
  | 'elevator'
  | 'shelter'
  | 'solarWater'
  | 'parking';

type AirDirection = 'north' | 'south' | 'east' | 'west';

type PropertyCondition = 'new' | 'renovated' | 'good' | 'requires_renovation';

type Step1Data = {
  kind: AssetKind | null;
  address: string;
  addressSuggestion: AddressSuggestion | null;
  apartmentNumber: string;
  // Extended details
  airDirections: AirDirection[];
  amenities: Record<AmenityKey, boolean>;
  propertyCondition: PropertyCondition | null;
  // Financial
  buildingCommittee: string;
  propertyTax: string;
  assetValue: string;
  // Utilities
  electricityCompany: string;
  waterProvider: string;
  municipality: string;
};

type Step2Data = {
  tenantName: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
};

type Step3Data = {
  uploadedFiles: string[];
};

type AddressSuggestion = {
  label: string;
  street: string;
  city: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_KINDS: { key: AssetKind; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'apartment', label: 'דירה', icon: 'office-building-outline' },
  { key: 'house', label: 'בית פרטי', icon: 'home-outline' },
  { key: 'commercial', label: 'מסחרי', icon: 'store-outline' },
];

const AIR_DIRECTIONS: { key: AirDirection; label: string }[] = [
  { key: 'north', label: 'צפון' },
  { key: 'south', label: 'דרום' },
  { key: 'east', label: 'מזרח' },
  { key: 'west', label: 'מערב' },
];

const AMENITIES: { key: AmenityKey; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'garden', label: 'גינה', icon: 'flower-outline' },
  { key: 'balcony', label: 'מרפסת', icon: 'door-sliding-open' },
  { key: 'furnished', label: 'הוספת רהיטים / מרוהטת', icon: 'sofa-outline' },
  { key: 'elevator', label: 'מעלית', icon: 'elevator-passenger-outline' },
  { key: 'shelter', label: 'ממ"ד', icon: 'shield-home-outline' },
  { key: 'solarWater', label: 'דוד שמש', icon: 'white-balance-sunny' },
  { key: 'parking', label: 'חניה', icon: 'parking' },
];

const PROPERTY_CONDITIONS: { key: PropertyCondition; label: string }[] = [
  { key: 'new', label: 'חדש מקבלן' },
  { key: 'renovated', label: 'משופץ' },
  { key: 'good', label: 'מצב טוב' },
  { key: 'requires_renovation', label: 'דורש שיפוץ' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

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
                <AppText variant="labelSm" weight="bold" style={{ color: isActive ? Colors.onPrimary : Colors.onSurfaceMuted }}>
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
    flexDirection: 'row-reverse',
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

// ─── Input field wrapper ──────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  suffix?: string;
  required?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <AppText variant="labelMd" weight="semiBold" style={fieldStyles.label}>
        {label}
        {required && <AppText variant="labelMd" color="error"> *</AppText>}
      </AppText>
      <View style={fieldStyles.row}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.onSurfaceMuted}
          keyboardType={keyboardType}
          textAlign="right"
        />
        {suffix && <AppText variant="bodyMd" color="variant" style={fieldStyles.suffix}>{suffix}</AppText>}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: { textAlign: 'right', color: Colors.onBackground },
  row: {
    flexDirection: 'row-reverse',
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

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ title, icon }: { title: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) {
  return (
    <View style={sectionStyles.row}>
      {icon && <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} />}
      <AppText variant="labelLg" weight="bold" color="primary">{title}</AppText>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl, marginBottom: Spacing.sm },
});

// ─── Expandable section ───────────────────────────────────────────────────────

function Expandable({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={expandStyles.wrap}>
      <Pressable onPress={() => setOpen((v) => !v)} style={expandStyles.header} accessibilityRole="button">
        <View style={expandStyles.titleRow}>
          <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} />
          <AppText variant="labelLg" weight="bold" color="primary">{title}</AppText>
        </View>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.primary} />
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.primaryContainer,
  },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  body: { padding: Spacing.md, gap: Spacing.base, backgroundColor: Colors.surface },
});

/** רשימת כתובות — data.gov.il CKAN datastore (resource_id מהמוצר). */
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

/** ממיר רשומת מאגר לשורת השלמה — תומך בשמות שדות נפוצים בעברית/אנגלית. */
function parseGovIlAddressRecord(r: Record<string, unknown>): AddressSuggestion | null {
  const street = strField(r, [
    'שם_רחוב',
    'שם רחוב',
    'תיאור_רחוב',
    'STREET_NAME',
    'street_name',
    'שם_רחוב_רשמי',
  ]);
  const city = strField(r, [
    'שם_ישוב',
    'שם ישוב',
    'YISHUV_NAME',
    'yishuv_name',
    'שם_ישוב_רשמי',
    'ישוב',
  ]);
  const house = strField(r, ['מספר_בית', 'מספר בית', 'HOUSE_NUMBER', 'house_number', 'מבנה']);

  const single = strField(r, ['כתובת', 'address', 'Address', 'FULL_ADDRESS', 'full_address']);

  if (street && city) {
    const streetPart = house ? `${street} ${house}` : street;
    const label = `${streetPart}, ${city}`;
    return { label, street: streetPart, city };
  }
  if (single) {
    return { label: single, street: single, city: city || '' };
  }
  if (street) {
    return { label: city ? `${street}, ${city}` : street, street, city: city || '' };
  }
  return null;
}

// ─── Address Autocomplete ─────────────────────────────────────────────────────

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
    if (value.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }

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
          onChangeText={(t) => { onChange(t); }}
          placeholder="חפש כתובת..."
          placeholderTextColor={Colors.onSurfaceMuted}
          textAlign="right"
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />}
        {!loading && value.length > 0 && (
          <Pressable onPress={() => { onChange(''); setSuggestions([]); setShowSuggestions(false); }} accessibilityRole="button" accessibilityLabel="נקה" hitSlop={8}>
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
              style={({ pressed }) => [autoStyles.suggestion, pressed && { backgroundColor: Colors.primaryContainer }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.primary} />
              <AppText variant="bodyMd" style={{ flex: 1 }}>{s.label}</AppText>
            </Pressable>
          ))}
          {/* Manual fallback */}
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  manualFallback: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primaryContainer,
  },
});

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ data, setData }: { data: Step1Data; setData: React.Dispatch<React.SetStateAction<Step1Data>> }) {
  const update = useCallback(<K extends keyof Step1Data>(key: K, val: Step1Data[K]) => {
    setData((prev) => ({ ...prev, [key]: val }));
  }, [setData]);

  const toggleAmenity = (key: AmenityKey) => {
    update('amenities', { ...data.amenities, [key]: !data.amenities[key] });
  };

  const toggleDirection = (dir: AirDirection) => {
    const dirs = data.airDirections.includes(dir)
      ? data.airDirections.filter((d) => d !== dir)
      : [...data.airDirections, dir];
    update('airDirections', dirs);
  };

  return (
    <View style={{ gap: Spacing.base }}>
      {/* Asset kind */}
      <View>
        <AppText variant="labelLg" weight="bold" style={s1.label}>סוג הנכס *</AppText>
        <View style={s1.kindRow}>
          {ASSET_KINDS.map((k) => (
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
              <MaterialCommunityIcons name={k.icon} size={28} color={data.kind === k.key ? Colors.onPrimary : Colors.primary} />
              <AppText
                variant="labelMd"
                weight="semiBold"
                style={{ color: data.kind === k.key ? Colors.onPrimary : Colors.onBackground }}
              >
                {k.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Address */}
      <View style={{ gap: Spacing.xs }}>
        <AppText variant="labelMd" weight="semiBold" style={s1.label}>כתובת *</AppText>
        <AddressAutocomplete
          value={data.address}
          onChange={(t) => update('address', t)}
          onSelect={(s) => update('addressSuggestion', s)}
        />
      </View>

      {/* Apartment number */}
      <FieldInput
        label="מספר דירה"
        value={data.apartmentNumber}
        onChangeText={(t) => update('apartmentNumber', t)}
        placeholder="לדוגמה: 4B"
        keyboardType="default"
      />

      {/* Extended details — expandable */}
      <Expandable title="פרטים מורחבים" icon="tune-variant">
        {/* Air directions */}
        <View style={{ gap: Spacing.sm }}>
          <AppText variant="labelMd" weight="semiBold" style={s1.label}>כיווני אוויר</AppText>
          <View style={s1.chipRow}>
            {AIR_DIRECTIONS.map((d) => (
              <Pressable
                key={d.key}
                onPress={() => toggleDirection(d.key)}
                style={[s1.chip, data.airDirections.includes(d.key) && s1.chipActive]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: data.airDirections.includes(d.key) }}
              >
                <AppText
                  variant="labelMd"
                  style={{ color: data.airDirections.includes(d.key) ? Colors.onPrimary : Colors.onSurfaceVariant }}
                >
                  {d.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amenities toggles */}
        <View style={{ gap: Spacing.sm }}>
          <AppText variant="labelMd" weight="semiBold" style={s1.label}>פרטים נוספים</AppText>
          {AMENITIES.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => toggleAmenity(a.key)}
              style={s1.switchRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!data.amenities[a.key] }}
            >
              <View style={s1.switchLeft}>
                <MaterialCommunityIcons name={a.icon} size={20} color={data.amenities[a.key] ? Colors.primary : Colors.onSurfaceVariant} />
                <AppText variant="bodyMd">{a.label}</AppText>
              </View>
              <Switch
                value={!!data.amenities[a.key]}
                onValueChange={() => toggleAmenity(a.key)}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryLight }}
                thumbColor={data.amenities[a.key] ? Colors.primary : Colors.onSurfaceMuted}
              />
            </Pressable>
          ))}
        </View>

        {/* Property condition */}
        <View style={{ gap: Spacing.sm }}>
          <AppText variant="labelMd" weight="semiBold" style={s1.label}>מצב הנכס</AppText>
          <View style={s1.chipRow}>
            {PROPERTY_CONDITIONS.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => update('propertyCondition', c.key)}
                style={[s1.chip, data.propertyCondition === c.key && s1.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: data.propertyCondition === c.key }}
              >
                <AppText
                  variant="labelMd"
                  style={{ color: data.propertyCondition === c.key ? Colors.onPrimary : Colors.onSurfaceVariant }}
                >
                  {c.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </Expandable>

      {/* Financial details — expandable */}
      <Expandable title="פרטים פיננסים" icon="currency-ils">
        <FieldInput
          label="ועד בית (₪/חודש)"
          value={data.buildingCommittee}
          onChangeText={(t) => update('buildingCommittee', t)}
          placeholder="200"
          keyboardType="numeric"
          suffix="₪"
        />
        <FieldInput
          label="ארנונה (₪/שנה)"
          value={data.propertyTax}
          onChangeText={(t) => update('propertyTax', t)}
          placeholder="6000"
          keyboardType="numeric"
          suffix="₪"
        />
        <FieldInput
          label="שווי הנכס"
          value={data.assetValue}
          onChangeText={(t) => update('assetValue', t)}
          placeholder="1,500,000"
          keyboardType="numeric"
          suffix="₪"
        />
      </Expandable>

      {/* Utilities — expandable */}
      <Expandable title="מונים / חוזים מול רשויות" icon="gauge">
        <FieldInput
          label="חברת חשמל"
          value={data.electricityCompany}
          onChangeText={(t) => update('electricityCompany', t)}
          placeholder="חברת חשמל / ספק פרטי"
        />
        <FieldInput
          label="ספק מים"
          value={data.waterProvider}
          onChangeText={(t) => update('waterProvider', t)}
          placeholder="תאגיד מים"
        />
        <FieldInput
          label="עירייה"
          value={data.municipality}
          onChangeText={(t) => update('municipality', t)}
          placeholder="שם העירייה"
        />
      </Expandable>
    </View>
  );
}

const s1 = StyleSheet.create({
  label: { textAlign: 'right', color: Colors.onBackground },
  kindRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  kindCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    minHeight: 80,
  },
  kindCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  switchLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
});

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ data, setData }: { data: Step2Data; setData: React.Dispatch<React.SetStateAction<Step2Data>> }) {
  const update = <K extends keyof Step2Data>(key: K, val: Step2Data[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  return (
    <View style={{ gap: Spacing.base }}>
      <AppText variant="bodyMd" color="variant" style={{ textAlign: 'right' }}>
        מלא את פרטי החוזה הראשון (ניתן לדלג ולהוסיף מאוחר יותר).
      </AppText>
      <FieldInput label="שם הדייר" value={data.tenantName} onChangeText={(t) => update('tenantName', t)} placeholder="שם מלא" />
      <FieldInput label="טלפון" value={data.tenantPhone} onChangeText={(t) => update('tenantPhone', t)} placeholder="050-0000000" keyboardType="phone-pad" />
      <FieldInput label="תאריך תחילת חוזה" value={data.startDate} onChangeText={(t) => update('startDate', t)} placeholder="01/01/2025" />
      <FieldInput label="תאריך סיום חוזה" value={data.endDate} onChangeText={(t) => update('endDate', t)} placeholder="31/12/2026" />
      <FieldInput label="שכירות חודשית" value={data.monthlyRent} onChangeText={(t) => update('monthlyRent', t)} placeholder="6500" keyboardType="numeric" suffix="₪" />
    </View>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ data, setData }: { data: Step3Data; setData: React.Dispatch<React.SetStateAction<Step3Data>> }) {
  const DOC_TYPES = ['חוזה שכירות', 'תמונות הנכס', 'אישור עירייה', 'ביטוח דירה'];
  return (
    <View style={{ gap: Spacing.base }}>
      <AppText variant="bodyMd" color="variant" style={{ textAlign: 'right' }}>
        העלה מסמכים רלוונטיים לנכס (אפשרי גם מאוחר יותר).
      </AppText>
      {DOC_TYPES.map((type) => (
        <Pressable
          key={type}
          onPress={() => {
            setData((prev) => ({
              ...prev,
              uploadedFiles: prev.uploadedFiles.includes(type)
                ? prev.uploadedFiles.filter((f) => f !== type)
                : [...prev.uploadedFiles, type],
            }));
          }}
          style={({ pressed }) => [
            s3.docCard,
            data.uploadedFiles.includes(type) && s3.docCardActive,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: data.uploadedFiles.includes(type) }}
        >
          <MaterialCommunityIcons
            name={data.uploadedFiles.includes(type) ? 'file-check-outline' : 'file-upload-outline'}
            size={24}
            color={data.uploadedFiles.includes(type) ? Colors.success : Colors.primary}
          />
          <AppText
            variant="bodyMd"
            weight={data.uploadedFiles.includes(type) ? 'bold' : 'regular'}
            style={{ flex: 1, textAlign: 'right', color: data.uploadedFiles.includes(type) ? Colors.success : Colors.onBackground }}
          >
            {type}
          </AppText>
          {data.uploadedFiles.includes(type) && (
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const s3 = StyleSheet.create({
  docCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    borderStyle: 'dashed',
  },
  docCardActive: { borderColor: Colors.success, backgroundColor: Colors.successContainer, borderStyle: 'solid' },
});

// ─── Wizard ───────────────────────────────────────────────────────────────────

const STEP_TITLES = ['פרטי הנכס', 'פרטי חוזה', 'מסמכים'];

export default function NewAssetScreen() {
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const editEntity = editId
    ? (MOCK_ASSETS.find((a) => a.id === editId) ?? MOCK_PROJECTS.find((p) => p.id === editId) ?? null)
    : null;
  const isEditMode = !!editEntity;

  const [step, setStep] = useState(1);

  const [step1, setStep1] = useState<Step1Data>(() => ({
    kind: null,
    address: editEntity?.address ?? '',
    addressSuggestion: editEntity ? { label: editEntity.address, street: editEntity.address, city: '' } : null,
    apartmentNumber: '',
    airDirections: [],
    amenities: {
      garden: false, balcony: false, furnished: false,
      elevator: false, shelter: false, solarWater: false, parking: false,
    },
    propertyCondition: null,
    buildingCommittee: '',
    propertyTax: '',
    assetValue: '',
    electricityCompany: '',
    waterProvider: '',
    municipality: '',
  }));

  const [step2, setStep2] = useState<Step2Data>({
    tenantName: '', tenantPhone: '', startDate: '', endDate: '', monthlyRent: '',
  });

  const [step3, setStep3] = useState<Step3Data>({ uploadedFiles: [] });

  const canAdvance = step === 1 ? !!step1.kind && step1.address.trim().length > 0 : true;

  const handleNext = () => {
    if (step < 3) { setStep((s) => s + 1); return; }
    // Final step — go back to assets list
    router.back();
  };

  const handleBack = () => {
    if (step > 1) { setStep((s) => s - 1); return; }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader title={isEditMode ? `עריכת ${editEntity?.name ?? 'נכס'}` : 'נכס חדש'} showBack onBack={handleBack} />

      {/* Step indicator */}
      <View style={wizardStyles.indicatorWrap}>
        <StepIndicator step={step} total={3} />
        <AppText variant="bodyMd" weight="semiBold" color="primary" align="center" style={{ marginTop: -Spacing.sm, marginBottom: Spacing.sm }}>
          שלב {step} מתוך 3 — {STEP_TITLES[step - 1]}
        </AppText>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[wizardStyles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && <Step1 data={step1} setData={setStep1} />}
        {step === 2 && <Step2 data={step2} setData={setStep2} />}
        {step === 3 && <Step3 data={step3} setData={setStep3} />}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[wizardStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step > 1 && (
          <Pressable onPress={handleBack} style={wizardStyles.footerSecondary} accessibilityRole="button">
            <AppText variant="bodyMd" weight="semiBold" color="primary">הקודם</AppText>
          </Pressable>
        )}
        <Button
          label={step === 3 ? 'סיום' : 'הבא'}
          onPress={handleNext}
          disabled={!canAdvance}
          style={wizardStyles.footerPrimary}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const wizardStyles = StyleSheet.create({
  indicatorWrap: { backgroundColor: Colors.surface, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },

  content: { paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.xl },

  footer: {
    flexDirection: 'row-reverse',
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
