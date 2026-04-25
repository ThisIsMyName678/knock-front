import React, { useState, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_ACCESS_LABELS,
  MOCK_ENTITY_LINKS,
  filterEntitiesByQuery,
  type ContractTypeKey,
  type ContractListRow,
  type ContractDetailMock,
  type EntityLinkOption,
  type ContractAccessLevel,
} from '@/lib/mocks/contracts';
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

const STEPS = ['פרטי חוזה', 'תשלומים', 'תיעוד מונים', 'העלאת קבצים'] as const;

const CONTRACT_TYPES: ContractTypeKey[] = ['rent', 'purchase', 'supplier_work', 'other'];

const PAYMENT_TYPES = [
  { key: 'rent', label: 'שכירות', icon: 'home-outline' as const },
  { key: 'maintenance', label: 'תחזוקה', icon: 'hammer-wrench' as const },
  { key: 'management', label: 'ניהול', icon: 'office-building-outline' as const },
  { key: 'other', label: 'אחר', icon: 'dots-horizontal' as const },
];

const METER_KINDS = [
  { key: 'electric', label: 'חשמל' },
  { key: 'water', label: 'מים' },
  { key: 'gas', label: 'גז' },
  { key: 'other', label: 'אחר' },
] as const;

type MeterKind = (typeof METER_KINDS)[number]['key'];

type MeterRow = { id: string; kind: MeterKind; name: string; identifier: string; value: string };

const FILE_CATEGORIES = [
  'צילום חוזה',
  'צילום מסמכים',
  'צילום תעודת זהות',
  'תיעוד הנכס',
  'תוכניות והדמיות',
  'אחר',
] as const;

type FileCategory = (typeof FILE_CATEGORIES)[number];

const ACCESS_LEVEL_ORDER: ContractAccessLevel[] = ['owner_only', 'tenant_only', 'employee_only', 'public'];

type PaymentDraft = {
  id: string;
  direction: 'in' | 'out';
  categoryKey: string;
  amount: string;
  date: string;
  notes: string;
};

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

export function ContractCreateWizard({ initialData }: { initialData?: ContractListRow | ContractDetailMock } = {}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  // Step 1
  const [contractName, setContractName] = useState(() => initialData?.contractName ?? '');
  const [contractType, setContractType] = useState<ContractTypeKey | ''>(() => initialData?.contractType ?? '');
  const [linkQuery, setLinkQuery] = useState(() => initialData?.linkLabel ?? '');
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(() =>
    initialData ? (MOCK_ENTITY_LINKS.find((e) => e.id === initialData.linkId) ?? null) : null,
  );
  const [showEntitySuggest, setShowEntitySuggest] = useState(false);
  const [counterpartyName, setCounterpartyName] = useState(() => initialData?.counterpartyName ?? '');
  const [serviceType, setServiceType] = useState('');
  const [idNumber, setIdNumber] = useState(() => (initialData as ContractDetailMock | undefined)?.idNumber ?? '');
  const [phone, setPhone] = useState(() => (initialData as ContractDetailMock | undefined)?.phone ?? '');
  const [email, setEmail] = useState(() => (initialData as ContractDetailMock | undefined)?.email ?? '');
  const [contactName, setContactName] = useState(() => (initialData as ContractDetailMock | undefined)?.contactName ?? '');
  const [agreementDate, setAgreementDate] = useState(() => initialData?.agreementDate ?? '');
  const [expiryDate, setExpiryDate] = useState(() => (initialData as ContractDetailMock | undefined)?.endDate ?? '');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderUnit, setReminderUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [reminderAmount, setReminderAmount] = useState('30');
  const [contractAccess, setContractAccess] = useState<ContractAccessLevel>('owner_only');

  // Step 2
  const [payments, setPayments] = useState<PaymentDraft[]>([]);
  const [payDirection, setPayDirection] = useState<'in' | 'out'>('in');
  const [payCategory, setPayCategory] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paymentLoopModal, setPaymentLoopModal] = useState(false);

  // Step 3
  const [meters, setMeters] = useState<MeterRow[]>([]);

  // Step 4
  const [fileCategory, setFileCategory] = useState<FileCategory>('צילום חוזה');
  const [fileName, setFileName] = useState('');
  const [defaultFileVisibility, setDefaultFileVisibility] = useState<ContractAccessLevel>('owner_only');
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [categoryModal, setCategoryModal] = useState(false);

  const entitySuggestions = useMemo(() => filterEntitiesByQuery(linkQuery), [linkQuery]);

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

  const step1Valid =
    contractName.trim().length > 0 &&
    contractType !== '' &&
    linkSelected !== null &&
    counterpartyName.trim().length > 0 &&
    (contractType !== 'supplier_work' || serviceType.trim().length > 0);

  const appendPayment = useCallback(() => {
    if (!payCategory || !payAmount.trim()) return;
    setPayments((prev) => [
      ...prev,
      {
        id: randomId(),
        direction: payDirection,
        categoryKey: payCategory,
        amount: payAmount,
        date: payDate || '—',
        notes: payNotes,
      },
    ]);
    setPayCategory('');
    setPayAmount('');
    setPayDate('');
    setPayNotes('');
  }, [payDirection, payCategory, payAmount, payDate, payNotes]);

  const openFinishPaymentStep = () => {
    if (!payCategory && !payAmount.trim() && payments.length === 0) {
      setStep(2);
      return;
    }
    if (payCategory && payAmount.trim()) {
      appendPayment();
    }
    setPaymentLoopModal(true);
  };

  const addMeter = () => {
    setMeters((prev) => [
      ...prev,
      {
        id: randomId(),
        kind: 'electric',
        name: '',
        identifier: '',
        value: '',
      },
    ]);
  };

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

  const goNext = () => {
    if (step === 0 && !step1Valid) return;
    if (step === 0) {
      setDefaultFileVisibility(contractAccess);
    }
    if (step === 1) {
      openFinishPaymentStep();
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else router.back();
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
              <Input label="שם החוזה" placeholder="לדוגמה: חוזה שכירות 2026" value={contractName} onChangeText={setContractName} containerStyle={{ marginBottom: Spacing.md }} />

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

              <AppText variant="labelMd" weight="semiBold" style={[styles.blockLabel, { marginTop: Spacing.lg }]}>
                סוג חוזה
              </AppText>
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
                      {CONTRACT_TYPE_LABELS[t]}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <AppText variant="labelMd" weight="semiBold" style={[styles.blockLabel, { marginTop: Spacing.base }]}>
                שיוך לנכס / פרויקט (חובה)
              </AppText>
              <View style={styles.entityBox}>
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

              <Input
                label="שם השוכר / רוכש / נותן שירות"
                value={counterpartyName}
                onChangeText={setCounterpartyName}
                containerStyle={{ marginTop: Spacing.md }}
              />
              {contractType === 'supplier_work' && (
                <Input label="סוג השירות" placeholder="לדוגמה: ניקיון" value={serviceType} onChangeText={setServiceType} containerStyle={{ marginTop: Spacing.md }} />
              )}

              <Input label="ת.ז / ח.פ" value={idNumber} onChangeText={setIdNumber} containerStyle={{ marginTop: Spacing.md }} />
              <Input label="מספר טלפון" value={phone} onChangeText={setPhone} keyboardType="phone-pad" containerStyle={{ marginTop: Spacing.md }} />
              <Input label="אימייל" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" containerStyle={{ marginTop: Spacing.md }} />
              <Input label="שם איש קשר" value={contactName} onChangeText={setContactName} containerStyle={{ marginTop: Spacing.md }} />

              <Input label="תאריך הסכם" placeholder="DD/MM/YYYY" value={agreementDate} onChangeText={onAgreementDateChange} containerStyle={{ marginTop: Spacing.md }} />
              <Input label="תאריך תוקף" placeholder="ברירת מחדל: שנה קדימה" value={expiryDate} onChangeText={setExpiryDate} containerStyle={{ marginTop: Spacing.md }} />

              <View style={styles.reminderRow}>
                <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: Colors.outlineVariant, true: Colors.primaryLight }} thumbColor={reminderEnabled ? Colors.primary : Colors.onSurfaceMuted} />
                <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }}>
                  יצירת תזכורת
                </AppText>
              </View>
              {reminderEnabled && (
                <View style={styles.reminderFields}>
                  <View style={styles.unitRow}>
                    {(['days', 'weeks', 'months'] as const).map((u) => (
                      <Pressable key={u} onPress={() => setReminderUnit(u)} style={[styles.unitChip, reminderUnit === u && styles.unitChipActive]}>
                        <AppText variant="labelSm" weight={reminderUnit === u ? 'bold' : 'regular'} style={{ color: reminderUnit === u ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                          {u === 'days' ? 'ימים' : u === 'weeks' ? 'שבועות' : 'חודשים'}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                  <Input label="מספר" value={reminderAmount} onChangeText={setReminderAmount} keyboardType="numeric" containerStyle={{ marginTop: Spacing.sm }} />
                </View>
              )}
            </View>
          )}

          {step === 1 && (
            <View style={styles.card}>
              {payments.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <AppText variant="labelMd" weight="bold" style={{ marginBottom: Spacing.sm }}>
                    תשלומים שנוספו ({payments.length})
                  </AppText>
                  {payments.map((p) => (
                    <View key={p.id} style={styles.paymentChip}>
                      <AppText variant="bodySm" style={{ flex: 1 }}>
                        {p.direction === 'in' ? 'הכנסה' : 'הוצאה'} · {p.amount} ₪ · {p.date}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}

              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md }}>
                תשלום בחוזה
              </AppText>
              <View style={styles.directionRow}>
                {(['in', 'out'] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setPayDirection(d)}
                    style={[
                      styles.dirBtn,
                      payDirection === d && {
                        borderColor: d === 'in' ? Colors.inbound : Colors.outbound,
                        backgroundColor: d === 'in' ? Colors.inboundBg : Colors.outboundBg,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name={d === 'in' ? 'arrow-down' : 'arrow-up'} size={22} color={d === 'in' ? Colors.inbound : Colors.outbound} />
                    <AppText variant="bodyMd" weight="bold" style={{ color: d === 'in' ? Colors.inbound : Colors.outbound }}>
                      {d === 'in' ? 'הכנסה' : 'הוצאה'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.base, marginBottom: Spacing.sm }}>
                קטגוריה
              </AppText>
              <View style={styles.typeGrid}>
                {PAYMENT_TYPES.map((t) => (
                  <Pressable key={t.key} onPress={() => setPayCategory(t.key)} style={[styles.typeCard, payCategory === t.key && styles.typeCardActive]}>
                    <MaterialCommunityIcons name={t.icon} size={20} color={payCategory === t.key ? Colors.primary : Colors.onSurfaceVariant} />
                    <AppText variant="caption" color={payCategory === t.key ? 'primary' : 'variant'} weight={payCategory === t.key ? 'bold' : 'regular'} align="center">
                      {t.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <Input label="סכום (₪)" value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" containerStyle={{ marginTop: Spacing.md }} />
              <Input label="תאריך" placeholder="DD/MM/YYYY" value={payDate} onChangeText={setPayDate} containerStyle={{ marginTop: Spacing.md }} />
              <Input label="הערות" value={payNotes} onChangeText={setPayNotes} multiline numberOfLines={3} style={{ height: 72, textAlignVertical: 'top' }} containerStyle={{ marginTop: Spacing.md }} />
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
            label={
              step === STEPS.length - 1
                ? 'סיום'
                : step === 1
                  ? 'סיום תשלומים'
                  : 'הבא'
            }
            onPress={goNext}
            disabled={step === 0 && !step1Valid}
            fullWidth
            size="lg"
          />
        </View>
      </View>

      <Modal visible={paymentLoopModal} transparent animationType="fade" onRequestClose={() => setPaymentLoopModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText variant="headingSm" weight="bold" align="center" style={{ marginBottom: Spacing.md }}>
              האם להוסיף תשלום נוסף או להמשיך?
            </AppText>
            <Button
              label="הוספת תשלום נוסף"
              onPress={() => {
                setPaymentLoopModal(false);
              }}
              fullWidth
              style={{ marginBottom: Spacing.sm }}
            />
            <Button
              label="המשך לשלב הבא"
              variant="secondary"
              onPress={() => {
                setPaymentLoopModal(false);
                setStep(2);
              }}
              fullWidth
            />
          </View>
        </View>
      </Modal>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  stepRow: {
    flexDirection: 'row-reverse',
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
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  reminderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  reminderFields: { marginTop: Spacing.md },
  unitRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
  unitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  unitChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  directionRow: { flexDirection: 'row-reverse', gap: Spacing.md },
  dirBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
  },
  paymentChip: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.xs,
  },
  meterBlock: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  meterHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  kindRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.xs },
  kindChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  kindChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addMeterBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
  },
  visGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
  fileSourceRow: { flexDirection: 'row-reverse', gap: Spacing.md, marginTop: Spacing.sm },
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
    flexDirection: 'row-reverse',
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
