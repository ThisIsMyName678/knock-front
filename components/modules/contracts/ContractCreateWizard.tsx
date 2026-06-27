import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { Badge } from '@/components/ui/Badge';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_ACCESS_LABELS,
} from '@/lib/constants/contracts';
import { searchEntityLinks, type EntityLinkOption } from '@/lib/api/entity-links';
import { MOCK_PAYMENTS_LIST, PAYMENT_TYPE_LABELS } from '@/lib/mocks/payments';
import { createContract, updateContract } from '@/lib/api/contracts';
import type { ContractType, ContractAccessLevel, ContractDetail, CreateContractInput } from '@/lib/api/contracts';
import { createPayment } from '@/lib/api/payments';
import {
  getDraftContractPayments,
  removeDraftContractPayment,
  clearDraftContractPayments,
  type DraftContractPayment,
} from '@/lib/navigation-state';
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

const STEPS = ['פרטי חוזה', 'תיעוד תשלום', 'תיעוד מונים', 'העלאת קבצים'] as const;

const CONTRACT_TYPES: ContractType[] = ['RENT', 'PURCHASE', 'SUPPLIER_WORK', 'OTHER'];

const METER_KINDS = [
  { key: 'ELECTRIC', label: 'חשמל' },
  { key: 'WATER', label: 'מים' },
  { key: 'GAS', label: 'גז' },
  { key: 'OTHER', label: 'אחר' },
] as const;

type MeterKind = (typeof METER_KINDS)[number]['key'];

type MeterRow = {
  id: string;
  kind: MeterKind;
  name: string;
  identifier: string;
  value: string;
  photoUri: string | null;
};

const FILE_CATEGORIES = [
  'צילום חוזה',
  'צילום מסמכים',
  'צילום תעודת זהות',
  'תיעוד הנכס',
  'תוכניות והדמיות',
  'אחר',
] as const;

type FileCategory = (typeof FILE_CATEGORIES)[number];

const ACCESS_LEVEL_ORDER: ContractAccessLevel[] = ['OWNER_ONLY', 'TENANT_ONLY', 'EMPLOYEE_ONLY', 'PUBLIC'];

type FileDraft = {
  id: string;
  category: FileCategory;
  displayName: string;
  mockSource: string;
  visibility: ContractAccessLevel;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function addOneYearDdMmYyyy(s: string): string {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const d = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10);
  const y = parseInt(m[3]!, 10) + 1;
  return `${pad2(d)}/${pad2(mo)}/${y}`;
}

function randomId() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isoToDdMmYyyy(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function ddMmYyyyToIso(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${pad2(parseInt(m[2]!, 10))}-${pad2(parseInt(m[1]!, 10))}`;
}

export function ContractCreateWizard({
  initialData,
  contractId,
  preloadedLink,
}: {
  initialData?: ContractDetail;
  contractId?: string;
  preloadedLink?: EntityLinkOption;
} = {}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  // Step 1
  const [contractName, setContractName] = useState(() => initialData?.contractName ?? '');
  const [contractType, setContractType] = useState<ContractType | ''>(() => initialData?.contractType ?? '');
  const [linkQuery, setLinkQuery] = useState(() => {
    if (preloadedLink) return `${preloadedLink.name}, ${preloadedLink.address}`;
    return initialData?.linkLabel ?? '';
  });
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(() => {
    if (preloadedLink) return preloadedLink;
    if (initialData) {
      return {
        id: initialData.linkId,
        kind: initialData.linkKind === 'PROJECT' ? 'project' : 'asset',
        name: initialData.linkLabel,
        address: '',
      };
    }
    return null;
  });
  const [showEntitySuggest, setShowEntitySuggest] = useState(false);
  const [counterpartyName, setCounterpartyName] = useState(() => initialData?.counterpartyName ?? '');
  const [serviceType, setServiceType] = useState(() => initialData?.serviceType ?? '');
  const [idNumber, setIdNumber] = useState(() => initialData?.counterpartyId ?? '');
  const [phone, setPhone] = useState(() => initialData?.counterpartyPhone ?? '');
  const [email, setEmail] = useState(() => initialData?.counterpartyEmail ?? '');
  const [contactName, setContactName] = useState(() => initialData?.contactName ?? '');
  const [agreementDate, setAgreementDate] = useState(() => isoToDdMmYyyy(initialData?.agreementDate));
  const [expiryDate, setExpiryDate] = useState(() => isoToDdMmYyyy(initialData?.endDate));
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderUnit, setReminderUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [reminderAmount, setReminderAmount] = useState('30');
  const [contractAccess, setContractAccess] = useState<ContractAccessLevel>(() => initialData?.accessLevel ?? 'OWNER_ONLY');
  const [datePickerTarget, setDatePickerTarget] = useState<'agreement' | 'expiry' | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Step 1 – תיעוד תשלום
  const [linkedPaymentId, setLinkedPaymentId] = useState<string | null>(null);
  // תשלומים חדשים שתועדו בתור מקומי כל עוד אין UUID אמיתי לחוזה (מצב יצירה)
  const [draftPayments, setDraftPayments] = useState<DraftContractPayment[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!contractId) setDraftPayments(getDraftContractPayments());
    }, [contractId])
  );

  useEffect(() => {
    return () => clearDraftContractPayments();
  }, []);

  // Step 2 – מונים
  const [meters, setMeters] = useState<MeterRow[]>([]);

  // Step 3
  const [fileCategory, setFileCategory] = useState<FileCategory>('צילום חוזה');
  const [fileName, setFileName] = useState('');
  const [defaultFileVisibility, setDefaultFileVisibility] = useState<ContractAccessLevel>('OWNER_ONLY');
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [categoryModal, setCategoryModal] = useState(false);

  const [entitySuggestions, setEntitySuggestions] = useState<EntityLinkOption[]>([]);

  useEffect(() => {
    if (linkSelected) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await searchEntityLinks(linkQuery);
        if (!cancelled) setEntitySuggestions(results);
      } catch {
        // ignore search errors
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [linkQuery, linkSelected]);

  const onAgreementDateChange = useCallback(
    (t: string) => {
      setAgreementDate(t);
      if (!expiryDate.trim()) {
        const next = addOneYearDdMmYyyy(t);
        if (next) setExpiryDate(next);
      }
    },
    [expiryDate],
  );

  const [step1Submitted, setStep1Submitted] = useState(false);

  const step1Errors = useMemo(() => ({
    contractName: contractName.trim().length === 0 ? 'שדה חובה' : '',
    contractType: contractType === '' ? 'יש לבחור סוג חוזה' : '',
    linkSelected: !linkSelected ? 'יש לבחור נכס או פרויקט' : '',
    counterpartyName: counterpartyName.trim().length === 0 ? 'שדה חובה' : '',
    serviceType: contractType === 'SUPPLIER_WORK' && serviceType.trim().length === 0 ? 'שדה חובה' : '',
    agreementDate: agreementDate.trim().length === 0 ? 'שדה חובה' : '',
  }), [contractName, contractType, linkSelected, counterpartyName, serviceType, agreementDate]);

  const step1Valid = Object.values(step1Errors).every((e) => !e);

  const addMeter = () => {
    setMeters((prev) => [
      ...prev,
      {
        id: randomId(),
        kind: 'ELECTRIC',
        name: '',
        identifier: '',
        value: '',
        photoUri: null,
      },
    ]);
  };

  const setMeterPhotoUri = useCallback((meterId: string, uri: string | null) => {
    setMeters((prev) => prev.map((x) => (x.id === meterId ? { ...x, photoUri: uri } : x)));
  }, []);

  const pickMeterPhotoMock = useCallback((meterId: string) => {
    Alert.alert('תמונת מונה', 'במימוש אמיתי: בחירה מהמצלמה או מהגלריה.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הוסף תמונת דוגמה',
        onPress: () =>
          setMeterPhotoUri(meterId, `https://picsum.photos/seed/meter-${meterId}/400/240`),
      },
    ]);
  }, [setMeterPhotoUri]);

  const mockPickFile = (source: string) => {
    Alert.alert('בחירת קובץ (תצוגה)', `במימוש אמיתי ייפתח ${source}. לעת עתה נוסף קובץ לדוגמה.`, [
      {
        text: 'הוסף לרשימה',
        onPress: () => {
          const name = fileName.trim() || `קובץ_${files.length + 1}`;
          setFiles((prev) => [
            ...prev,
            {
              id: randomId(),
              category: fileCategory,
              displayName: name,
              mockSource: source,
              visibility: defaultFileVisibility,
            },
          ]);
          setFileName('');
        },
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const goNext = async () => {
    if (step === 0) {
      setStep1Submitted(true);
      if (!step1Valid) return;
      setDefaultFileVisibility(contractAccess);
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // שלב אחרון — שליחה לשרת
    if (!linkSelected || contractType === '') return;
    const linkKind = linkSelected.kind === 'project' ? 'PROJECT' as const : 'PROPERTY' as const;
    const dto: CreateContractInput = {
      contractName: contractName.trim(),
      contractType,
      linkKind,
      projectId: linkKind === 'PROJECT' ? linkSelected.id : null,
      propertyId: linkKind === 'PROPERTY' ? linkSelected.id : null,
      counterpartyName: counterpartyName.trim(),
      counterpartyId: idNumber.trim() || null,
      counterpartyPhone: phone.trim() || null,
      counterpartyEmail: email.trim() || null,
      serviceType: contractType === 'SUPPLIER_WORK' ? serviceType.trim() || null : null,
      contactName: contactName.trim() || null,
      agreementDate: ddMmYyyyToIso(agreementDate),
      endDate: ddMmYyyyToIso(expiryDate) || null,
      accessLevel: contractAccess,
      notes: null,
    };

    setSubmitting(true);
    setServerError(null);
    try {
      const result = contractId
        ? await updateContract(contractId, dto)
        : await createContract(dto);

      if (!contractId && draftPayments.length > 0) {
        let failedCount = 0;
        for (const draft of draftPayments) {
          try {
            await createPayment({ ...draft.input, contractId: result.id });
          } catch {
            failedCount += 1;
          }
        }
        clearDraftContractPayments();
        if (failedCount > 0) {
          Alert.alert('שגיאה', `החוזה נשמר, אך ${failedCount} מתוך ${draftPayments.length} תשלומים לא נשמרו. ניתן להוסיפם דרך מסך החוזה.`);
        }
      }

      if (contractId) {
        router.replace(`/(app)/contracts/${result.id}`);
      } else {
        router.back();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בשמירת החוזה';
      setServerError(msg);
      Alert.alert('שגיאה', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title={initialData ? 'עריכת חוזה' : 'חוזה חדש'} showBack onBack={goBack} />

        <View style={styles.stepRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step ? (
                  <MaterialCommunityIcons name="check" size={14} color={Colors.onPrimary} />
                ) : (
                  <AppText variant="labelSm" weight="bold" color={i === step ? 'onPrimary' : 'muted'}>
                    {i + 1}
                  </AppText>
                )}
              </View>
              <AppText variant="caption" color={i <= step ? 'primary' : 'muted'} align="center" numberOfLines={2}>
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View style={styles.card}>
              <Input label="שם החוזה" required placeholder="לדוגמה: חוזה שכירות 2026" value={contractName} onChangeText={setContractName} error={step1Submitted ? step1Errors.contractName : ''} containerStyle={{ marginBottom: Spacing.md }} />

              <AppText variant="labelMd" weight="semiBold" style={styles.blockLabel}>
                הרשאות גישה לחוזה
              </AppText>
              <View style={styles.visGrid}>
                {ACCESS_LEVEL_ORDER.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => setContractAccess(k)}
                    style={[styles.visChip, contractAccess === k && styles.visChipActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: contractAccess === k }}
                  >
                    <AppText
                      variant="caption"
                      weight={contractAccess === k ? 'bold' : 'regular'}
                      style={{ color: contractAccess === k ? Colors.onPrimary : Colors.onSurfaceVariant }}
                      numberOfLines={4}
                      align="center"
                    >
                      {CONTRACT_ACCESS_LABELS[k]}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
                <AppText variant="labelMd" weight="semiBold" style={styles.blockLabel}>סוג חוזה</AppText>
                <AppText variant="labelMd" weight="bold" style={{ color: Colors.error }}>*</AppText>
              </View>
              {step1Submitted && step1Errors.contractType ? (
                <AppText variant="caption" color="error" style={{ textAlign: 'right', marginBottom: Spacing.xs }}>{step1Errors.contractType}</AppText>
              ) : null}
              <View style={styles.typeGrid}>
                {CONTRACT_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setContractType(t)}
                    style={[styles.typeCard, contractType === t && styles.typeCardActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: contractType === t }}
                  >
                    <AppText variant="bodySm" weight={contractType === t ? 'bold' : 'regular'} color={contractType === t ? 'primary' : 'variant'} align="center">
                      {CONTRACT_TYPE_LABELS[t as keyof typeof CONTRACT_TYPE_LABELS]}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: Spacing.base, marginBottom: Spacing.sm }}>
                <AppText variant="labelMd" weight="semiBold" style={styles.blockLabel}>שיוך לנכס / פרויקט</AppText>
                <AppText variant="labelMd" weight="bold" style={{ color: Colors.error }}>*</AppText>
              </View>
              <View style={[styles.entityBox, step1Submitted && step1Errors.linkSelected ? { borderColor: Colors.error, borderWidth: 1.5, borderRadius: Radius.md } : undefined]}>
                <TextInput
                  style={styles.entityInput}
                  placeholder="חיפוש נכס או פרויקט..."
                  placeholderTextColor={Colors.onSurfaceMuted}
                  value={linkQuery}
                  onChangeText={(t) => {
                    setLinkQuery(t);
                    setShowEntitySuggest(t.trim().length > 0);
                    if (!t) setLinkSelected(null);
                  }}
                  onFocus={() => setShowEntitySuggest(linkQuery.trim().length > 0)}
                  textAlign="right"
                />
                {linkSelected && (
                  <View style={styles.selectedEntity}>
                    <Badge label={linkSelected.kind === 'project' ? 'פרויקט' : 'נכס'} preset="primary" />
                    <AppText variant="bodySm" weight="semiBold" style={{ flex: 1 }}>
                      {linkSelected.name} — {linkSelected.address}
                    </AppText>
                    <Pressable onPress={() => { setLinkSelected(null); setLinkQuery(''); }} hitSlop={8}>
                      <MaterialCommunityIcons name="close-circle" size={20} color={Colors.onSurfaceMuted} />
                    </Pressable>
                  </View>
                )}
                {showEntitySuggest && !linkSelected && entitySuggestions.length > 0 && (
                  <View style={styles.suggestBox}>
                    {entitySuggestions.map((e) => (
                      <Pressable
                        key={e.id}
                        onPress={() => {
                          setLinkSelected(e);
                          setLinkQuery(`${e.name}, ${e.address}`);
                          setShowEntitySuggest(false);
                        }}
                        style={styles.suggestRow}
                      >
                        <MaterialCommunityIcons name={e.kind === 'project' ? 'briefcase-outline' : 'home-outline'} size={16} color={Colors.primary} />
                        <AppText variant="bodySm" style={{ flex: 1 }}>
                          {e.name}, {e.address}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              {step1Submitted && step1Errors.linkSelected ? (
                <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 2 }}>{step1Errors.linkSelected}</AppText>
              ) : null}

              <Input
                label="שם השוכר / רוכש / נותן שירות"
                required
                value={counterpartyName}
                onChangeText={setCounterpartyName}
                error={step1Submitted ? step1Errors.counterpartyName : ''}
                containerStyle={{ marginTop: Spacing.md }}
              />
              {contractType === 'SUPPLIER_WORK' && (
                <Input label="סוג השירות" required placeholder="לדוגמה: ניקיון" value={serviceType} onChangeText={setServiceType} error={step1Submitted ? step1Errors.serviceType : ''} containerStyle={{ marginTop: Spacing.md }} />
              )}

              <Input label="ת.ז / ח.פ" value={idNumber} onChangeText={setIdNumber} containerStyle={{ marginTop: Spacing.md }} />
              <Input label="מספר טלפון" value={phone} onChangeText={setPhone} keyboardType="phone-pad" containerStyle={{ marginTop: Spacing.md }} />
              <Input label="אימייל" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" containerStyle={{ marginTop: Spacing.md }} />
              <Input label="שם איש קשר" value={contactName} onChangeText={setContactName} containerStyle={{ marginTop: Spacing.md }} />

              <View style={{ marginTop: Spacing.md }}>
                <View style={styles.dateFieldLabelRow}>
                  <AppText variant="labelMd" weight="semiBold" style={styles.dateFieldLabel}>
                    תאריך הסכם
                  </AppText>
                  <AppText variant="labelMd" weight="bold" style={styles.dateAsterisk}> *</AppText>
                </View>
                <Pressable
                  onPress={() => setDatePickerTarget('agreement')}
                  style={[
                    styles.dateField,
                    step1Submitted && step1Errors.agreementDate ? styles.dateFieldError : undefined,
                  ]}
                >
                  <MaterialCommunityIcons name="calendar-outline" size={18} color={agreementDate ? Colors.onBackground : Colors.onSurfaceMuted} />
                  <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: agreementDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                    {agreementDate || 'בחר תאריך'}
                  </AppText>
                </Pressable>
                {step1Submitted && step1Errors.agreementDate ? (
                  <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 4 }}>
                    {step1Errors.agreementDate}
                  </AppText>
                ) : null}
              </View>

              <View style={{ marginTop: Spacing.md }}>
                <AppText variant="labelMd" weight="semiBold" style={[styles.dateFieldLabel, { marginBottom: Spacing.xs }]}>
                  תאריך תוקף
                </AppText>
                <Pressable
                  onPress={() => setDatePickerTarget('expiry')}
                  style={styles.dateField}
                >
                  <MaterialCommunityIcons name="calendar-outline" size={18} color={expiryDate ? Colors.onBackground : Colors.onSurfaceMuted} />
                  <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: expiryDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                    {expiryDate || 'ברירת מחדל: שנה קדימה'}
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.reminderRow}>
                <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: Colors.outlineVariant, true: Colors.primaryLight }} thumbColor={reminderEnabled ? Colors.primary : Colors.onSurfaceMuted} />
                <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }}>
                  יצירת תזכורת
                </AppText>
              </View>
              {reminderEnabled && (
                <View style={styles.reminderFields}>
                  <Pressable
                    onPress={() => { setReminderUnit('days'); setReminderAmount('0'); }}
                    style={[styles.unitChip, reminderUnit === 'days' && reminderAmount === '0' && styles.unitChipActive, { marginBottom: Spacing.sm }]}
                  >
                    <AppText variant="labelSm" weight={reminderUnit === 'days' && reminderAmount === '0' ? 'bold' : 'regular'} style={{ color: reminderUnit === 'days' && reminderAmount === '0' ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      ביום עצמו
                    </AppText>
                  </Pressable>
                  <View style={styles.unitRow}>
                    {(['days', 'weeks', 'months'] as const).map((u) => (
                      <Pressable key={u} onPress={() => { setReminderUnit(u); if (reminderAmount === '0') setReminderAmount('1'); }} style={[styles.unitChip, reminderUnit === u && reminderAmount !== '0' && styles.unitChipActive]}>
                        <AppText variant="labelSm" weight={reminderUnit === u && reminderAmount !== '0' ? 'bold' : 'regular'} style={{ color: reminderUnit === u && reminderAmount !== '0' ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                          {u === 'days' ? 'ימים' : u === 'weeks' ? 'שבועות' : 'חודשים'}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                  {!(reminderUnit === 'days' && reminderAmount === '0') && (
                    <Input label="מספר" value={reminderAmount} onChangeText={setReminderAmount} keyboardType="numeric" containerStyle={{ marginTop: Spacing.sm }} />
                  )}
                </View>
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md }}>
                תיעוד תשלום
              </AppText>
              <AppText variant="bodyMd" color="variant" style={{ textAlign: 'right', marginBottom: Spacing.base }}>
                קישור לתשלום קיים עבור נכס זה, או יצירת תשלום חדש.
              </AppText>

              {(() => {
                const entityPayments = linkSelected
                  ? MOCK_PAYMENTS_LIST.filter((p) => p.linkId === linkSelected.id)
                  : [];
                return (
                  <>
                    {entityPayments.length > 0 ? (
                      <View style={{ marginBottom: Spacing.base }}>
                        <AppText variant="labelMd" weight="semiBold" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
                          תשלומים קיימים לנכס
                        </AppText>
                        {entityPayments.map((p) => {
                          const isSelected = linkedPaymentId === p.id;
                          return (
                            <Pressable
                              key={p.id}
                              onPress={() => setLinkedPaymentId(isSelected ? null : p.id)}
                              style={[
                                styles.paymentLinkRow,
                                isSelected && styles.paymentLinkRowActive,
                              ]}
                            >
                              <View style={{ flex: 1, gap: 2 }}>
                                <AppText variant="bodyMd" weight={isSelected ? 'bold' : 'regular'}>
                                  {p.displayName}
                                </AppText>
                                <AppText variant="caption" color="variant">
                                  {PAYMENT_TYPE_LABELS[p.paymentType]} · {p.amount.toLocaleString('he-IL')} ₪ · {p.dueDate}
                                </AppText>
                              </View>
                              <MaterialCommunityIcons
                                name={isSelected ? 'check-circle' : 'circle-outline'}
                                size={22}
                                color={isSelected ? Colors.primary : Colors.outlineVariant}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.emptyPayments}>
                        <MaterialCommunityIcons name="cash-remove" size={32} color={Colors.outlineVariant} />
                        <AppText variant="bodySm" color="variant" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
                          {linkSelected ? 'אין תשלומים קיימים עבור נכס זה' : 'יש לשייך נכס בשלב הראשון כדי לראות תשלומים'}
                        </AppText>
                      </View>
                    )}

                    <View style={styles.orDivider}>
                      <View style={styles.orLine} />
                      <AppText variant="caption" color="variant" style={{ marginHorizontal: Spacing.sm }}>
                        או
                      </AppText>
                      <View style={styles.orLine} />
                    </View>

                    <Pressable
                      style={styles.newPaymentBtn}
                      onPress={() => {
                        router.push({
                          pathname: '/(app)/payments/new',
                          params: {
                            // אם החוזה כבר קיים בשרת (מצב עריכה) יש UUID אמיתי ואפשר ליצור תשלום ישירות.
                            // במצב יצירה החוזה עדיין לא נשמר — מתעדים את התשלום בתור עד שהחוזה ייווצר.
                            ...(contractId
                              ? { preloadContractId: contractId }
                              : { draftForContract: '1' }),
                            preloadContractName: contractName || 'חוזה חדש',
                            preloadLinkId: linkSelected?.id ?? '',
                            preloadLinkLabel: linkSelected?.name ?? '',
                            preloadLinkKind: linkSelected?.kind ?? '',
                            preloadLinkAddress: linkSelected?.address ?? '',
                          },
                        });
                      }}
                    >
                      <MaterialCommunityIcons name="plus-circle-outline" size={22} color={Colors.primary} />
                      <AppText variant="bodyMd" weight="semiBold" color="primary">
                        יצירת תשלום חדש
                      </AppText>
                    </Pressable>

                    {draftPayments.length > 0 && (
                      <View style={{ marginTop: Spacing.base }}>
                        <AppText variant="labelMd" weight="semiBold" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
                          תשלומים שיתועדו עם החוזה
                        </AppText>
                        {draftPayments.map((d) => (
                          <View key={d.id} style={[styles.paymentLinkRow, { justifyContent: 'space-between' }]}>
                            <AppText variant="bodySm" style={{ flex: 1, textAlign: 'right' }}>
                              {d.summaryLabel}
                            </AppText>
                            <Pressable
                              onPress={() => {
                                removeDraftContractPayment(d.id);
                                setDraftPayments(getDraftContractPayments());
                              }}
                            >
                              <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.error} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md }}>
                תיעוד מונים (לא חובה)
              </AppText>
              {meters.map((m, idx) => (
                <View key={m.id} style={styles.meterBlock}>
                  <View style={styles.meterHeader}>
                    <AppText variant="labelMd" weight="bold">
                      מונה {idx + 1}
                    </AppText>
                    <Pressable onPress={() => setMeters((prev) => prev.filter((x) => x.id !== m.id))}>
                      <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.error} />
                    </Pressable>
                  </View>
                  <View style={styles.kindRow}>
                    {METER_KINDS.map((k) => (
                      <Pressable key={k.key} onPress={() => setMeters((prev) => prev.map((x) => (x.id === m.id ? { ...x, kind: k.key } : x)))} style={[styles.kindChip, m.kind === k.key && styles.kindChipActive]}>
                        <AppText variant="caption" weight={m.kind === k.key ? 'bold' : 'regular'} style={{ color: m.kind === k.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                          {k.label}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                  <Input label="שם מונה" value={m.name} onChangeText={(t) => setMeters((prev) => prev.map((x) => (x.id === m.id ? { ...x, name: t } : x)))} containerStyle={{ marginTop: Spacing.sm }} />
                  <Input label="מספר מזהה" value={m.identifier} onChangeText={(t) => setMeters((prev) => prev.map((x) => (x.id === m.id ? { ...x, identifier: t } : x)))} containerStyle={{ marginTop: Spacing.sm }} />
                  <Input label="ערך" value={m.value} onChangeText={(t) => setMeters((prev) => prev.map((x) => (x.id === m.id ? { ...x, value: t } : x)))} containerStyle={{ marginTop: Spacing.sm }} />

                  <AppText variant="labelMd" weight="semiBold" style={{ textAlign: 'right', marginTop: Spacing.md }}>
                    תמונת מונה
                  </AppText>
                  {m.photoUri ? (
                    <View style={styles.meterPhotoPreview}>
                      <Image source={{ uri: m.photoUri }} style={styles.meterPhotoImage} resizeMode="cover" />
                      <Pressable
                        onPress={() => setMeterPhotoUri(m.id, null)}
                        style={({ pressed }) => [styles.meterPhotoRemove, pressed && { opacity: 0.85 }]}
                        accessibilityRole="button"
                        accessibilityLabel="הסר תמונה"
                      >
                        <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.error} />
                        <AppText variant="bodySm" color="error" weight="semiBold">
                          הסר תמונה
                        </AppText>
                      </Pressable>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => pickMeterPhotoMock(m.id)}
                    style={({ pressed }) => [styles.meterPhotoAddBtn, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel="צירוף תמונה למונה"
                  >
                    <MaterialCommunityIcons name="camera-plus-outline" size={22} color={Colors.primary} />
                    <AppText variant="bodyMd" weight="semiBold" color="primary">
                      {m.photoUri ? 'החלפת תמונה' : 'צירוף תמונה'}
                    </AppText>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addMeter} style={styles.addMeterBtn} accessibilityRole="button">
                <MaterialCommunityIcons name="plus" size={22} color={Colors.primary} />
                <AppText variant="bodyMd" weight="semiBold" color="primary">
                  הוספת מונה
                </AppText>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md }}>
                העלאת קבצים
              </AppText>

              <AppText variant="labelMd" weight="semiBold" style={styles.blockLabel}>
                הרשאות גישה לקבצים חדשים
              </AppText>
              <AppText variant="caption" color="variant" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
                ברירת מחדל מסונכנת להרשאות החוזה; ניתן לשנות לפני כל העלאה.
              </AppText>
              <View style={styles.visGrid}>
                {ACCESS_LEVEL_ORDER.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => setDefaultFileVisibility(k)}
                    style={[styles.visChip, defaultFileVisibility === k && styles.visChipActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: defaultFileVisibility === k }}
                  >
                    <AppText
                      variant="caption"
                      weight={defaultFileVisibility === k ? 'bold' : 'regular'}
                      style={{ color: defaultFileVisibility === k ? Colors.onPrimary : Colors.onSurfaceVariant }}
                      numberOfLines={4}
                      align="center"
                    >
                      {CONTRACT_ACCESS_LABELS[k]}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText variant="labelMd" weight="semiBold" style={[styles.blockLabel, { marginTop: Spacing.base }]}>
                קטגוריה
              </AppText>
              <Pressable onPress={() => setCategoryModal(true)} style={styles.dropdownFake}>
                <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                  {fileCategory}
                </AppText>
              </Pressable>

              <Input label="שם הקובץ" value={fileName} onChangeText={setFileName} placeholder="שם לתצוגה" containerStyle={{ marginTop: Spacing.md }} />

              <AppText variant="labelMd" weight="semiBold" style={[styles.blockLabel, { marginTop: Spacing.base }]}>
                מקור
              </AppText>
              <View style={styles.fileSourceRow}>
                <Pressable style={styles.fileSourceBtn} onPress={() => mockPickFile('קבצים')}>
                  <MaterialCommunityIcons name="folder-outline" size={22} color={Colors.primary} />
                  <AppText variant="caption" align="center">
                    קבצים
                  </AppText>
                </Pressable>
                <Pressable style={styles.fileSourceBtn} onPress={() => mockPickFile('תמונות')}>
                  <MaterialCommunityIcons name="image-outline" size={22} color={Colors.primary} />
                  <AppText variant="caption" align="center">
                    תמונות
                  </AppText>
                </Pressable>
                <Pressable style={styles.fileSourceBtn} onPress={() => mockPickFile('מצלמה')}>
                  <MaterialCommunityIcons name="camera-outline" size={22} color={Colors.primary} />
                  <AppText variant="caption" align="center">
                    מצלמה
                  </AppText>
                </Pressable>
              </View>

              {files.length > 0 && (
                <View style={{ marginTop: Spacing.lg }}>
                  <AppText variant="labelMd" weight="bold" style={{ marginBottom: Spacing.sm }}>
                    קבצים ברשימה
                  </AppText>
                  {files.map((f) => (
                    <View key={f.id} style={styles.fileRow}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <AppText variant="bodySm" weight="semiBold">
                          {f.displayName}
                        </AppText>
                        <AppText variant="caption" color="variant">
                          {f.category} · {f.mockSource}
                        </AppText>
                      </View>
                      <Badge label={CONTRACT_ACCESS_LABELS[f.visibility]} preset="neutral" />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button
            label={step === STEPS.length - 1 ? (contractId ? 'שמור שינויים' : 'סיום') : 'הבא'}
            onPress={goNext}
            disabled={submitting}
            fullWidth
            size="lg"
          />
        </View>
      </View>

      <Modal visible={categoryModal} transparent animationType="slide" onRequestClose={() => setCategoryModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
              בחירת קטגוריה
            </AppText>
            {FILE_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  setFileCategory(c);
                  setCategoryModal(false);
                }}
                style={styles.sheetRow}
              >
                <AppText variant="bodyMd">{c}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <DatePickerModal
        visible={datePickerTarget !== null}
        value={datePickerTarget === 'agreement' ? agreementDate : expiryDate}
        title={datePickerTarget === 'agreement' ? 'תאריך הסכם' : 'תאריך תוקף'}
        onSelect={(dateStr) => {
          if (datePickerTarget === 'agreement') {
            onAgreementDateChange(dateStr);
          } else {
            setExpiryDate(dateStr);
          }
          setDatePickerTarget(null);
        }}
        onClose={() => setDatePickerTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  stepRow: {
    flexDirection: RTL_ROW,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    gap: 4,
  },
  stepItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  blockLabel: { textAlign: 'right', marginBottom: Spacing.sm, color: Colors.onBackground },
  typeGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  typeCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer },
  entityBox: { marginTop: Spacing.xs },
  entityInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    backgroundColor: Colors.surfaceVariant,
  },
  selectedEntity: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
  },
  suggestBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  suggestRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  reminderRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  reminderFields: { marginTop: Spacing.md },
  unitRow: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  unitChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  paymentLinkRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  paymentLinkRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight ?? Colors.surface,
  },
  emptyPayments: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.base,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  newPaymentBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  meterBlock: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  meterHeader: { flexDirection: RTL_ROW, justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  kindRow: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs },
  kindChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  kindChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addMeterBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
  },
  meterPhotoPreview: { gap: Spacing.xs, marginTop: Spacing.xs },
  meterPhotoImage: {
    width: '100%',
    height: 140,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
  },
  meterPhotoRemove: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  meterPhotoAddBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  dateFieldLabelRow: { flexDirection: RTL_ROW, alignItems: 'center', marginBottom: Spacing.xs },
  dateFieldLabel: { textAlign: 'right' },
  dateAsterisk: { color: Colors.error },
  dateField: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: MIN_TOUCH,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  dateFieldError: {
    borderColor: Colors.error,
  },
  visGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  visChip: {
    width: '48%',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    minHeight: 48,
    justifyContent: 'center',
  },
  visChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dropdownFake: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
  fileSourceRow: { flexDirection: RTL_ROW, gap: Spacing.md, marginTop: Spacing.sm },
  fileSourceBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  fileRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  footer: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    ...Shadow.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: CONTENT_HORIZONTAL_PADDING,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  sheet: {
    marginTop: 'auto',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing['2xl'],
  },
  sheetRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
});
