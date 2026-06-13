import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MOCK_PROJECTS } from '@/lib/mocks/assets';
import { MOCK_CONTRACTS_LIST, CONTRACT_TYPE_LABELS } from '@/lib/mocks/contracts';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/lib/mocks/documents';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { AppHeader } from '@/components/ui/AppHeader';
import { RecommendedDocChecklistPanel } from '@/components/modules/documents/RecommendedDocChecklistPanel';
import { createProperty, getProperty, propertyAddressLabel, updateProperty, type BackendOccupancyStatus, type BackendProperty, type BackendPropertyType, type CreatePropertyInput } from '@/lib/api/properties';
import { consumePreloadedProject } from '@/lib/navigation-state';

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

type FormOccupancyStatus = 'VACANT' | 'OCCUPIED' | 'UNDER_CONSTRUCTION';

type MeterType = 'electricity' | 'water' | 'gas' | 'other';

type MeterEntry = {
  id: string;
  name: string;
  meterType: MeterType | null;
  reading: string;
  photoUri: string | null;
};

type Step1Data = {
  kind: AssetKind | null;
  occupancyStatus: FormOccupancyStatus;
  address: string;
  addressSuggestion: AddressSuggestion | null;
  apartmentNumber: string;
  floorNumber: string;
  sizeSqm: string;
  linkedProjectId: string | null;
  linkedProjectName: string | null;
  projectSearch: string;
  airDirections: AirDirection[];
  amenities: Record<AmenityKey, boolean>;
  gardenSize: string;
  balconySize: string;
  parkingNumber: string;
  propertyCondition: PropertyCondition | null;
  buildingCommittee: string;
  propertyTax: string;
  assetValue: string;
  meters: MeterEntry[];
};

// ─── Step 2: Files ────────────────────────────────────────────────────────────

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

// ─── Step 3: Contract ─────────────────────────────────────────────────────────

type ContractChoice = 'link' | null;

type Step3Data = {
  choice: ContractChoice;
  linkedContractId: string | null;
  linkedContractName: string | null;
  contractSearch: string;
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
  { key: 'furnished', label: 'נכס מרוהט', icon: 'sofa-outline' },
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

const OCCUPANCY_STATUSES: { key: FormOccupancyStatus; label: string }[] = [
  { key: 'VACANT', label: 'פנוי' },
  { key: 'OCCUPIED', label: 'מושכר' },
  { key: 'UNDER_CONSTRUCTION', label: 'בבנייה' },
];

const METER_TYPES: { key: MeterType; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'electricity', label: 'חשמל', icon: 'lightning-bolt' },
  { key: 'water', label: 'מים', icon: 'water-outline' },
  { key: 'gas', label: 'גז', icon: 'fire' },
  { key: 'other', label: 'אחר', icon: 'gauge' },
];

const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  'contract', 'plan', 'report', 'payment', 'work_agreement',
  'asset_docs', 'meter_readings', 'formats', 'guarantees',
  'accounts', 'invoice_receipt', 'other',
];

function assetKindToBackendType(kind: AssetKind): BackendPropertyType {
  if (kind === 'apartment') return 'APARTMENT';
  if (kind === 'house') return 'PRIVATE_HOME';
  return 'COMMERCIAL';
}

function backendTypeToAssetKind(type: BackendPropertyType): AssetKind {
  if (type === 'APARTMENT') return 'apartment';
  if (type === 'HOUSE' || type === 'PRIVATE_HOME') return 'house';
  return 'commercial';
}

function occupancyStatusForForm(status: BackendOccupancyStatus | null): FormOccupancyStatus {
  if (status === 'OCCUPIED' || status === 'PARTIALLY_OCCUPIED') return 'OCCUPIED';
  if (status === 'UNDER_CONSTRUCTION') return 'UNDER_CONSTRUCTION';
  return 'VACANT';
}

function buildPropertyName(step1: Step1Data): string {
  const address = step1.address.trim();
  const apartment = step1.apartmentNumber.trim();

  if (apartment && address) {
    return `${address} דירה ${apartment}`;
  }

  return address || 'נכס חדש';
}

function uuidOrNull(value: string | null): string | null {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function metadataString(metadata: Record<string, unknown> | null, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : '';
}

function metadataArray<T extends string>(metadata: Record<string, unknown> | null, key: string): T[] {
  const value = metadata?.[key];
  return Array.isArray(value) ? value.filter((entry): entry is T => typeof entry === 'string') : [];
}

function metadataRecord<T extends Record<string, boolean>>(metadata: Record<string, unknown> | null, key: string, fallback: T): T {
  const value = metadata?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...fallback, ...(value as Partial<T>) } : fallback;
}

function addressSuggestionFromProperty(property: BackendProperty): AddressSuggestion | null {
  const addressJson = property.addressJson;
  if (!addressJson) return propertyAddressLabel(property) ? { label: propertyAddressLabel(property), street: propertyAddressLabel(property), city: '' } : null;

  const label = propertyAddressLabel(property);
  return {
    label,
    street: typeof addressJson.street === 'string' ? addressJson.street : label,
    city: typeof addressJson.city === 'string' ? addressJson.city : '',
  };
}

function step1FromProperty(property: BackendProperty): Step1Data {
  const defaultAmenities: Record<AmenityKey, boolean> = {
    garden: false,
    balcony: false,
    furnished: false,
    elevator: false,
    shelter: false,
    solarWater: false,
    parking: false,
  };
  const addressJson = property.addressJson;

  return {
    kind: backendTypeToAssetKind(property.propertyType),
    occupancyStatus: occupancyStatusForForm(property.occupancyStatus),
    address: propertyAddressLabel(property),
    addressSuggestion: addressSuggestionFromProperty(property),
    apartmentNumber: typeof addressJson?.apartmentNumber === 'string' ? addressJson.apartmentNumber : '',
    floorNumber: metadataString(property.metadata, 'floorNumber'),
    sizeSqm: metadataString(property.metadata, 'sizeSqm'),
    linkedProjectId: property.projectId,
    linkedProjectName: null,
    projectSearch: '',
    airDirections: metadataArray<AirDirection>(property.metadata, 'airDirections'),
    amenities: metadataRecord(property.metadata, 'amenities', defaultAmenities),
    gardenSize: metadataString(property.metadata, 'gardenSize'),
    balconySize: metadataString(property.metadata, 'balconySize'),
    parkingNumber: metadataString(property.metadata, 'parkingNumber'),
    propertyCondition: metadataString(property.metadata, 'propertyCondition') as PropertyCondition || null,
    buildingCommittee: metadataString(property.metadata, 'buildingCommittee'),
    propertyTax: metadataString(property.metadata, 'propertyTax'),
    assetValue: metadataString(property.metadata, 'assetValue'),
    meters: Array.isArray(property.metadata?.meters) ? (property.metadata.meters as MeterEntry[]) : [],
  };
}

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
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  suffix: { paddingHorizontal: Spacing.md, color: Colors.onSurfaceVariant },
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
  const street = strField(r, ['שם_רחוב', 'שם רחוב', 'תיאור_רחוב', 'STREET_NAME', 'street_name', 'שם_רחוב_רשמי']);
  const city = strField(r, ['שם_ישוב', 'שם ישוב', 'YISHUV_NAME', 'yishuv_name', 'שם_ישוב_רשמי', 'ישוב']);
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
        const json = await res.json();
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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
        <TextInput
          style={autoStyles.input}
          value={value}
          onChangeText={(t) => { onChange(t); }}
          placeholder="חפש כתובת..."
          placeholderTextColor={Colors.onSurfaceMuted}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} />}
        {!loading && value.length > 0 && (
          <Pressable onPress={() => { onChange(''); setSuggestions([]); setShowSuggestions(false); }} accessibilityRole="button" accessibilityLabel="נקה" hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
        <MaterialCommunityIcons name="map-search-outline" size={18} color={Colors.onSurfaceVariant} />
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
    textAlign: 'right',
    writingDirection: 'rtl',
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

// ─── Meter Entry Card ─────────────────────────────────────────────────────────

function MeterEntryCard({
  meter,
  onChange,
  onRemove,
}: {
  meter: MeterEntry;
  onChange: (updated: MeterEntry) => void;
  onRemove: () => void;
}) {
  const update = <K extends keyof MeterEntry>(key: K, val: MeterEntry[K]) =>
    onChange({ ...meter, [key]: val });

  return (
    <View style={meterStyles.card}>
      <View style={meterStyles.cardHeader}>
        <AppText variant="labelMd" weight="bold" color="primary">מונה</AppText>
        <Pressable onPress={onRemove} style={meterStyles.removeBtn} accessibilityRole="button" accessibilityLabel="הסר מונה" hitSlop={8}>
          <MaterialCommunityIcons name="close" size={16} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <FieldInput
        label="שם המונה"
        value={meter.name}
        onChangeText={(t) => update('name', t)}
        placeholder="לדוגמה: חשמל ראשי"
      />

      <View style={{ gap: Spacing.xs }}>
        <AppText variant="labelMd" weight="semiBold" style={meterStyles.fieldLabel}>סוג מונה</AppText>
        <View style={meterStyles.chipRow}>
          {METER_TYPES.map((mt) => {
            const active = meter.meterType === mt.key;
            return (
              <Pressable
                key={mt.key}
                onPress={() => update('meterType', mt.key)}
                style={[meterStyles.chip, active && meterStyles.chipActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <MaterialCommunityIcons name={mt.icon} size={14} color={active ? Colors.onPrimary : Colors.onSurfaceVariant} />
                <AppText variant="labelSm" style={{ color: active ? Colors.onPrimary : Colors.onSurfaceVariant }}>{mt.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FieldInput
        label="קריאת מונה"
        value={meter.reading}
        onChangeText={(t) => update('reading', t)}
        placeholder="לדוגמה: 12345"
        keyboardType="numeric"
      />

      <View style={{ gap: Spacing.xs }}>
        <AppText variant="labelMd" weight="semiBold" style={meterStyles.fieldLabel}>תמונת מונה</AppText>
        {meter.photoUri ? (
          <View style={meterStyles.photoSelected}>
            <MaterialCommunityIcons name="image-check-outline" size={18} color={Colors.success} />
            <AppText variant="bodySm" style={{ flex: 1, color: Colors.success }}>תמונה נבחרה</AppText>
            <Pressable onPress={() => update('photoUri', null)} accessibilityRole="button" accessibilityLabel="הסר תמונה" hitSlop={8}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={Colors.onSurfaceVariant} />
            </Pressable>
          </View>
        ) : (
          <View style={meterStyles.photoRow}>
            <Pressable onPress={() => update('photoUri', `camera-${meter.id}`)} style={({ pressed }) => [meterStyles.photoBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button">
              <MaterialCommunityIcons name="camera-outline" size={20} color={Colors.primary} />
              <AppText variant="labelMd" color="primary" weight="semiBold">מצלמה</AppText>
            </Pressable>
            <Pressable onPress={() => update('photoUri', `gallery-${meter.id}`)} style={({ pressed }) => [meterStyles.photoBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button">
              <MaterialCommunityIcons name="image-outline" size={20} color={Colors.primary} />
              <AppText variant="labelMd" color="primary" weight="semiBold">גלריה</AppText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.base,
    backgroundColor: Colors.surfaceVariant,
  },
  cardHeader: { flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'space-between' },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: Colors.outlineLight },
  fieldLabel: { textAlign: 'right', color: Colors.onBackground },
  chipRow: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  photoRow: { flexDirection: RTL_ROW, gap: Spacing.sm },
  photoBtn: {
    flex: 1, flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primaryContainer,
  },
  photoSelected: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.success, backgroundColor: Colors.successContainer,
  },
});

// ─── Project search inline autocomplete ───────────────────────────────────────

function ProjectSearchField({
  query,
  selectedId,
  selectedName,
  onQueryChange,
  onSelect,
  onClear,
}: {
  query: string;
  selectedId: string | null;
  selectedName: string | null;
  onQueryChange: (t: string) => void;
  onSelect: (id: string, name: string) => void;
  onClear: () => void;
}) {
  const filtered = query.trim().length > 0
    ? MOCK_PROJECTS.filter(
        (p) =>
          p.name.includes(query) ||
          p.address.includes(query),
      ).slice(0, 6)
    : [];

  if (selectedId && selectedName) {
    return (
      <View style={projSearchStyles.selectedRow}>
        <MaterialCommunityIcons name="briefcase-check-outline" size={20} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>{selectedName}</AppText>
          <AppText variant="caption" color="variant">
            {MOCK_PROJECTS.find((p) => p.id === selectedId)?.address ?? ''}
          </AppText>
        </View>
        <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="הסר שיוך" hitSlop={8}>
          <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.onSurfaceVariant} />
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={projSearchStyles.inputRow}>
        <TextInput
          style={projSearchStyles.input}
          value={query}
          onChangeText={onQueryChange}
          placeholder="חפש שם פרויקט..."
          placeholderTextColor={Colors.onSurfaceMuted}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => onQueryChange('')} accessibilityRole="button" accessibilityLabel="נקה" hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
          </Pressable>
        )}
        <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceVariant} />
      </View>
      {filtered.length > 0 && (
        <View style={projSearchStyles.dropdown}>
          {filtered.map((p, idx) => (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p.id, p.name)}
              style={({ pressed }) => [
                projSearchStyles.dropdownRow,
                idx < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
                pressed && { backgroundColor: Colors.primaryContainer },
              ]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="briefcase-outline" size={16} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>{p.name}</AppText>
                <AppText variant="caption" color="variant" numberOfLines={1}>{p.address}</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {query.trim().length > 1 && filtered.length === 0 && (
        <View style={projSearchStyles.noResults}>
          <AppText variant="caption" color="variant">לא נמצאו פרויקטים תואמים</AppText>
        </View>
      )}
    </View>
  );
}

const projSearchStyles = StyleSheet.create({
  inputRow: {
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
    textAlign: 'right',
    writingDirection: 'rtl',
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
  dropdownRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  selectedRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  noResults: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    borderRadius: Radius.md,
    marginTop: 4,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'flex-end',
  },
});

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ data, setData, errors, showErrors }: { data: Step1Data; setData: React.Dispatch<React.SetStateAction<Step1Data>>; errors?: { kind: string; address: string }; showErrors?: boolean }) {
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

  const addMeter = () => {
    update('meters', [
      ...data.meters,
      { id: String(Date.now()), name: '', meterType: null, reading: '', photoUri: null },
    ]);
  };

  const updateMeter = (id: string, updated: MeterEntry) => {
    update('meters', data.meters.map((m) => (m.id === id ? updated : m)));
  };

  const removeMeter = (id: string) => {
    update('meters', data.meters.filter((m) => m.id !== id));
  };

  return (
    <View style={{ gap: Spacing.base }}>
      {/* Asset kind */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <AppText variant="labelLg" weight="bold" style={s1.label}>סוג הנכס</AppText>
          <AppText variant="labelLg" weight="bold" style={{ color: Colors.error }}>*</AppText>
        </View>
        <View style={s1.kindRow}>
          {ASSET_KINDS.map((k) => (
            <Pressable
              key={k.key}
              onPress={() => update('kind', k.key)}
              style={({ pressed }) => [s1.kindCard, data.kind === k.key && s1.kindCardActive, pressed && { opacity: 0.85 }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: data.kind === k.key }}
            >
              <MaterialCommunityIcons name={k.icon} size={28} color={data.kind === k.key ? Colors.onPrimary : Colors.primary} />
              <AppText variant="labelMd" weight="semiBold" style={{ color: data.kind === k.key ? Colors.onPrimary : Colors.onBackground }}>
                {k.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        {showErrors && errors?.kind ? (
          <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 2 }}>{errors.kind}</AppText>
        ) : null}
      </View>

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

      {/* Apartment number */}
      <FieldInput
        label="מספר דירה"
        value={data.apartmentNumber}
        onChangeText={(t) => update('apartmentNumber', t)}
        placeholder="לדוגמה: 4B"
      />

      <FieldInput
        label="מספר קומה"
        value={data.floorNumber}
        onChangeText={(t) => update('floorNumber', t)}
        placeholder="לדוגמה: 3"
        keyboardType="number-pad"
      />

      <FieldInput
        label="גודל הנכס"
        value={data.sizeSqm}
        onChangeText={(t) => update('sizeSqm', t)}
        placeholder="לדוגמה: 90"
        keyboardType="decimal-pad"
        suffix="מ״ר"
      />

      {/* Occupancy status */}
      <View style={{ gap: Spacing.sm }}>
        <AppText variant="labelMd" weight="semiBold" style={s1.label}>סטטוס איכלוס</AppText>
        <View style={s1.chipRow}>
          {OCCUPANCY_STATUSES.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => update('occupancyStatus', o.key)}
              style={[s1.chip, data.occupancyStatus === o.key && s1.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: data.occupancyStatus === o.key }}
            >
              <AppText variant="labelMd" style={{ color: data.occupancyStatus === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {o.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Project link */}
      <View style={{ gap: Spacing.xs }}>
        <View style={[s1.labelRow]}>
          <AppText variant="caption" color="variant">אופציונלי</AppText>
          <AppText variant="labelMd" weight="semiBold" style={s1.label}>שיוך לפרויקט</AppText>
        </View>
        <ProjectSearchField
          query={data.projectSearch}
          selectedId={data.linkedProjectId}
          selectedName={data.linkedProjectName}
          onQueryChange={(t) => {
            update('projectSearch', t);
            update('linkedProjectId', null);
            update('linkedProjectName', null);
          }}
          onSelect={(id, name) => {
            update('linkedProjectId', id);
            update('linkedProjectName', name);
            update('projectSearch', '');
          }}
          onClear={() => {
            update('linkedProjectId', null);
            update('linkedProjectName', null);
            update('projectSearch', '');
          }}
        />
      </View>

      {/* Extended details */}
      <Expandable title="פרטים מורחבים" icon="tune-variant">
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
                <AppText variant="labelMd" style={{ color: data.airDirections.includes(d.key) ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {d.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: Spacing.sm }}>
          <AppText variant="labelMd" weight="semiBold" style={s1.label}>פרטים נוספים</AppText>
          {AMENITIES.map((a) => (
            <View key={a.key}>
              <Pressable
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
              {a.key === 'garden' && data.amenities.garden && (
                <View style={s1.subField}>
                  <FieldInput label="גודל גינה" value={data.gardenSize} onChangeText={(t) => update('gardenSize', t)} placeholder="לדוגמה: 30" keyboardType="numeric" suffix="מ״ר" />
                </View>
              )}
              {a.key === 'balcony' && data.amenities.balcony && (
                <View style={s1.subField}>
                  <FieldInput label="גודל מרפסת" value={data.balconySize} onChangeText={(t) => update('balconySize', t)} placeholder="לדוגמה: 12" keyboardType="numeric" suffix="מ״ר" />
                </View>
              )}
              {a.key === 'parking' && data.amenities.parking && (
                <View style={s1.subField}>
                  <FieldInput label="מספר חניה" value={data.parkingNumber} onChangeText={(t) => update('parkingNumber', t)} placeholder="לדוגמה: 15" />
                </View>
              )}
            </View>
          ))}
        </View>

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
                <AppText variant="labelMd" style={{ color: data.propertyCondition === c.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {c.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </Expandable>

      {/* Financial */}
      <Expandable title="פרטים פיננסים" icon="currency-ils">
        <FieldInput label="ועד בית (₪/חודש)" value={data.buildingCommittee} onChangeText={(t) => update('buildingCommittee', t)} placeholder="200" keyboardType="numeric" suffix="₪" />
        <FieldInput label="ארנונה (₪/שנה)" value={data.propertyTax} onChangeText={(t) => update('propertyTax', t)} placeholder="6000" keyboardType="numeric" suffix="₪" />
        <FieldInput label="שווי הנכס" value={data.assetValue} onChangeText={(t) => update('assetValue', t)} placeholder="1,500,000" keyboardType="numeric" suffix="₪" />
      </Expandable>

      {/* Meters */}
      <Expandable title="מונים" icon="gauge">
        <View style={{ gap: Spacing.md }}>
          {data.meters.length === 0 && (
            <AppText variant="bodySm" color="variant" style={{ textAlign: 'right' }}>
              לא נוספו מונים עדיין. לחץ על "הוסף מונה" כדי להתחיל.
            </AppText>
          )}
          {data.meters.map((meter) => (
            <MeterEntryCard
              key={meter.id}
              meter={meter}
              onChange={(updated) => updateMeter(meter.id, updated)}
              onRemove={() => removeMeter(meter.id)}
            />
          ))}
          <Pressable onPress={addMeter} style={({ pressed }) => [s1.addMeterBtn, pressed && { opacity: 0.8 }]} accessibilityRole="button">
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.primary} />
            <AppText variant="labelMd" color="primary" weight="semiBold">הוסף מונה</AppText>
          </Pressable>
        </View>
      </Expandable>
    </View>
  );
}

const s1 = StyleSheet.create({
  label: { textAlign: 'right', color: Colors.onBackground },
  labelRow: { flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'space-between' },
  kindRow: { flexDirection: RTL_ROW, gap: Spacing.md, marginTop: Spacing.sm },
  kindCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.outlineVariant, backgroundColor: Colors.surface, minHeight: 80,
  },
  kindCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipRow: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  switchRow: { flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  switchLeft: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm },
  subField: { marginTop: Spacing.sm, marginRight: 32, marginBottom: Spacing.xs },
  addMeterBtn: {
    flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.primary, borderStyle: 'dashed', backgroundColor: Colors.primaryContainer,
  },
});

// ─── Step 2: File Upload ───────────────────────────────────────────────────────

const SOURCE_OPTIONS: { key: FileSource; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'files', label: 'קבצים', icon: 'folder-outline' },
  { key: 'photos', label: 'תמונות', icon: 'image-outline' },
  { key: 'camera', label: 'מצלמה', icon: 'camera-outline' },
];

function Step2({ data, setData }: { data: Step2Data; setData: React.Dispatch<React.SetStateAction<Step2Data>> }) {
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
        הוסף קבצים ומסמכים לנכס. ניתן להוסיף מספר קבצים ולהמשיך לשלב הבא בסיום.
      </AppText>

      <RecommendedDocChecklistPanel />

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
          placeholder="לדוגמה: חוזה שכירות 2025"
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

// ─── Step 3: Contract ─────────────────────────────────────────────────────────

function Step3({
  data,
  setData,
  step1Address,
}: {
  data: Step3Data;
  setData: React.Dispatch<React.SetStateAction<Step3Data>>;
  step1Address: string;
}) {
  const update = <K extends keyof Step3Data>(key: K, val: Step3Data[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const filteredContracts = MOCK_CONTRACTS_LIST.filter((c) => {
    const q = data.contractSearch.trim().toLowerCase();
    if (!q) return true;
    return `${c.contractName} ${c.linkLabel} ${c.counterpartyName}`.toLowerCase().includes(q);
  });

  const handleCreateNew = () => {
    router.push({
      pathname: '/(app)/contracts/new',
      params: {
        preloadId: 'new-asset-draft',
        preloadName: step1Address,
        preloadAddress: step1Address,
        preloadKind: 'asset',
      },
    });
  };

  return (
    <View style={{ gap: Spacing.base }}>
      {/* Info banner */}
      <View style={s3.infoBanner}>
        <MaterialCommunityIcons name="information-outline" size={18} color={Colors.primary} />
        <AppText variant="bodySm" color="primary" style={{ flex: 1, textAlign: 'right' }}>
          שלב זה הוא אופציונלי. ניתן לדלג ולקשר חוזה לנכס בכל עת.
        </AppText>
      </View>

      {/* Choice cards */}
      <View style={s3.choiceRow}>
        {/* Link existing */}
        <Pressable
          onPress={() => update('choice', data.choice === 'link' ? null : 'link')}
          style={({ pressed }) => [s3.choiceCard, data.choice === 'link' && s3.choiceCardActive, pressed && { opacity: 0.85 }]}
          accessibilityRole="radio"
          accessibilityState={{ checked: data.choice === 'link' }}
        >
          <MaterialCommunityIcons
            name="link-variant"
            size={30}
            color={data.choice === 'link' ? Colors.onPrimary : Colors.primary}
          />
          <AppText
            variant="labelMd"
            weight="bold"
            align="center"
            style={{ color: data.choice === 'link' ? Colors.onPrimary : Colors.onBackground }}
          >
            קישור לחוזה קיים
          </AppText>
        </Pressable>

        {/* Create new */}
        <Pressable
          onPress={handleCreateNew}
          style={({ pressed }) => [s3.choiceCard, s3.choiceCardCreate, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="file-document-plus-outline" size={30} color={Colors.primary} />
          <AppText variant="labelMd" weight="bold" align="center" color="primary">
            יצירת חוזה חדש
          </AppText>
          <AppText variant="caption" color="variant" align="center">
            הנכס יוטען אוטומטית
          </AppText>
        </Pressable>
      </View>

      {/* Link existing — search expansion */}
      {data.choice === 'link' && (
        <View style={{ gap: Spacing.md }}>
          {/* Selected contract summary */}
          {data.linkedContractId ? (
            <View style={s3.selectedCard}>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
              <AppText variant="bodyMd" weight="bold" style={{ flex: 1, textAlign: 'right', color: Colors.success }}>
                {data.linkedContractName}
              </AppText>
              <Pressable
                onPress={() => setData((prev) => ({ ...prev, linkedContractId: null, linkedContractName: null, contractSearch: '' }))}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="בטל בחירה"
              >
                <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.onSurfaceVariant} />
              </Pressable>
            </View>
          ) : (
            <>
              {/* Search input */}
              <View style={s3.searchWrap}>
                <TextInput
                  style={s3.searchInput}
                  value={data.contractSearch}
                  onChangeText={(t) => update('contractSearch', t)}
                  placeholder="חפש שם חוזה, נכס, שוכר..."
                  placeholderTextColor={Colors.onSurfaceMuted}
                />
                {data.contractSearch.length > 0 && (
                  <Pressable onPress={() => update('contractSearch', '')} hitSlop={8} accessibilityRole="button">
                    <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
                  </Pressable>
                )}
                <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceVariant} />
              </View>

              {/* Results */}
              {filteredContracts.length === 0 ? (
                <AppText variant="bodySm" color="variant" style={{ textAlign: 'right' }}>לא נמצאו חוזים תואמים.</AppText>
              ) : (
                filteredContracts.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setData((prev) => ({ ...prev, linkedContractId: c.id, linkedContractName: c.contractName, contractSearch: '' }))}
                    style={({ pressed }) => [s3.contractRow, pressed && { backgroundColor: Colors.primaryContainer }]}
                    accessibilityRole="button"
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <AppText variant="bodyMd" weight="semiBold" numberOfLines={1}>{c.contractName}</AppText>
                      <AppText variant="caption" color="variant" numberOfLines={1}>
                        {c.counterpartyName} · {c.linkLabel}
                      </AppText>
                    </View>
                    <Badge label={CONTRACT_TYPE_LABELS[c.contractType]} preset="neutral" />
                  </Pressable>
                ))
              )}
            </>
          )}
        </View>
      )}

      {/* Create new hint */}
      <View style={s3.createHint}>
        <MaterialCommunityIcons name="arrow-left" size={14} color={Colors.onSurfaceVariant} />
        <AppText variant="caption" color="variant" style={{ flex: 1, textAlign: 'right' }}>
          לאחר שמירת החוזה החדש תחזור לכאן לסיום הוספת הנכס
        </AppText>
      </View>
    </View>
  );
}

const s3 = StyleSheet.create({
  infoBanner: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.primaryContainer,
    borderWidth: 1, borderColor: Colors.outlineLight,
  },
  choiceRow: { flexDirection: RTL_ROW, gap: Spacing.md },
  choiceCard: {
    flex: 1, alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xl, borderWidth: 2, borderColor: Colors.outlineVariant, backgroundColor: Colors.surface,
    minHeight: 110,
  },
  choiceCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  choiceCardCreate: { borderColor: Colors.primary, borderStyle: 'dashed', backgroundColor: Colors.primaryContainer },
  selectedCard: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.success, backgroundColor: Colors.successContainer,
  },
  searchWrap: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md,
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base,
    color: Colors.onBackground, paddingVertical: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  contractRow: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  createHint: {
    flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
});

// ─── Wizard ───────────────────────────────────────────────────────────────────

const STEP_TITLES = ['פרטי הנכס', 'הוספת קבצים', 'חוזה'];

export default function NewAssetScreen() {
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const isEditMode = !!editId;
  const [editProperty, setEditProperty] = useState<BackendProperty | null>(null);

  const [step, setStep] = useState(1);

  const [step1, setStep1] = useState<Step1Data>({
    kind: null,
    occupancyStatus: 'VACANT',
    address: '',
    addressSuggestion: null,
    apartmentNumber: '',
    floorNumber: '',
    sizeSqm: '',
    linkedProjectId: null,
    linkedProjectName: null,
    projectSearch: '',
    airDirections: [],
    amenities: { garden: false, balcony: false, furnished: false, elevator: false, shelter: false, solarWater: false, parking: false },
    gardenSize: '',
    balconySize: '',
    parkingNumber: '',
    propertyCondition: null,
    buildingCommittee: '',
    propertyTax: '',
    assetValue: '',
    meters: [],
  });

  useFocusEffect(
    useCallback(() => {
      if (isEditMode) return;
      const ctx = consumePreloadedProject();
      if (!ctx) return;
      setStep1((prev) => ({
        ...prev,
        linkedProjectId: ctx.projectId,
        linkedProjectName: ctx.projectName,
      }));
    }, [isEditMode]),
  );

  useEffect(() => {
    if (!editId) return;

    let cancelled = false;

    getProperty(editId)
      .then((property) => {
        if (cancelled) return;
        setEditProperty(property);
        setStep1(step1FromProperty(property));
      })
      .catch((error) => {
        if (cancelled) return;
        Alert.alert('טעינת הנכס נכשלה', error instanceof Error ? error.message : 'נסה שוב מאוחר יותר.');
      });

    return () => {
      cancelled = true;
    };
  }, [editId]);

  const [step2, setStep2] = useState<Step2Data>({
    files: [],
    pendingName: '',
    pendingCategory: 'other',
    pendingSource: null,
  });

  const [step3, setStep3] = useState<Step3Data>({
    choice: null,
    linkedContractId: null,
    linkedContractName: null,
    contractSearch: '',
  });

  const [step1Submitted, setStep1Submitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const step1Errors = useMemo(() => ({
    kind: !step1.kind ? 'יש לבחור סוג נכס' : '',
    address: step1.address.trim().length === 0 ? 'שדה חובה' : '',
  }), [step1.kind, step1.address]);

  const step1Valid = Object.values(step1Errors).every((e) => !e);

  /** שלבים 2–3 לא חוסמים המשך (קבצים וחוזה אופציונליים). */
  const canAdvance = step === 1 ? step1Valid : true;

  const handleNext = async () => {
    if (step === 1) {
      setStep1Submitted(true);
      if (!step1Valid) return;
    }
    if (step < 3) { setStep((s) => s + 1); return; }

    if (!step1.kind) return;

    setSaving(true);

    try {
      const payload: CreatePropertyInput = {
        name: buildPropertyName(step1),
        address: step1.address,
        addressJson: {
          label: step1.address,
          street: step1.addressSuggestion?.street,
          city: step1.addressSuggestion?.city,
          apartmentNumber: step1.apartmentNumber || undefined,
        },
        propertyType: assetKindToBackendType(step1.kind),
        occupancyStatus: step1.occupancyStatus,
        projectId: uuidOrNull(step1.linkedProjectId),
        metadata: {
          floorNumber: step1.floorNumber,
          sizeSqm: step1.sizeSqm,
          airDirections: step1.airDirections,
          amenities: step1.amenities,
          gardenSize: step1.gardenSize,
          balconySize: step1.balconySize,
          parkingNumber: step1.parkingNumber,
          propertyCondition: step1.propertyCondition,
          buildingCommittee: step1.buildingCommittee,
          propertyTax: step1.propertyTax,
          assetValue: step1.assetValue,
          meters: step1.meters,
          files: step2.files,
          linkedContractId: step3.linkedContractId,
        },
      };

      if (isEditMode && editId) {
        await updateProperty(editId, payload);
      } else {
        await createProperty(payload);
      }

      router.replace('/(app)/assets-screens');
    } catch (error) {
      Alert.alert(
        'שמירת הנכס נכשלה',
        error instanceof Error ? error.message : 'נסה שוב מאוחר יותר.',
      );
    } finally {
      setSaving(false);
    }
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
      <AppHeader title={isEditMode ? `עריכת ${editProperty?.name ?? 'נכס'}` : 'נכס חדש'} showBack onBack={handleBack} />

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
        {step === 1 && <Step1 data={step1} setData={setStep1} errors={step1Errors} showErrors={step1Submitted} />}
        {step === 2 && <Step2 data={step2} setData={setStep2} />}
        {step === 3 && <Step3 data={step3} setData={setStep3} step1Address={step1.address} />}
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
          onPress={() => void handleNext()}
          disabled={!canAdvance || saving}
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
    flexDirection: RTL_ROW, gap: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.outlineLight,
    ...Shadow.sm,
  },
  footerPrimary: { flex: 1 },
  footerSecondary: {
    flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary,
  },
});
