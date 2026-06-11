import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AmountField } from '@/components/ui/AmountField';
import { AppHeader } from '@/components/ui/AppHeader';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import {
  PAYMENT_TYPE_LABELS,
  contractsForLink,
  maintenanceCallsForLink,
  type PaymentTypeKey,
  type PaymentModeKey,
  type PaymentDetailMock,
} from '@/lib/mocks/payments';
import { MOCK_CONTACTS_LIST } from '@/lib/mocks/contacts';
import { searchEntityLinks, type EntityLinkOption } from '@/lib/api/entity-links';
import { PAYER_TYPE_OPTIONS } from '@/lib/api/payments';
import { formatIlsInteger, parseAmountDigits } from '@/lib/format/currency';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  FontFamily,
  FontSize,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

// ─── Types & constants ────────────────────────────────────────────────────────

const ALL_PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_LABELS) as PaymentTypeKey[];

const MEANS_OPTIONS = [
  { key: 'check', label: 'שיק' },
  { key: 'bank', label: 'העברה בנקאית' },
  { key: 'cash', label: 'מזומן' },
  { key: 'credit', label: 'אשראי' },
  { key: 'other', label: 'אחר' },
] as const;

const MODES: { key: PaymentModeKey; label: string }[] = [
  { key: 'full', label: 'מלא' },
  { key: 'recurring', label: 'מחזורי' },
  { key: 'installments', label: 'תשלומים' },
  { key: 'shafif_plus', label: 'שוטף+' },
];

const GUARANTEE_TYPES = [
  'כתב שיפוי',
  'ערבות אישית / כתב ערבות',
  'ערבות בנקאית',
  'פקדון מזומן',
  'שטח חוב',
  "צ'ק ביטחון",
] as const;

type InstallmentRow = {
  id: string;
  title: string;
  dueDate: string;
  amountDigits: string;
  means: string;
  indexed: boolean;
};

type RecurringRow = {
  id: string;
  index: number;
  dueDate: string;
  means: string;
};

type Reminder = {
  id: string;
  offsetDays: number;
};

const REMINDER_PRESETS: { label: string; days: number }[] = [
  { label: 'ביום עצמו', days: 0 },
  { label: 'יום לפני', days: 1 },
  { label: '3 ימים לפני', days: 3 },
  { label: 'שבוע לפני', days: 7 },
  { label: 'חודש לפני', days: 30 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function parsePct(s: string): number {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 18;
}

function digitsToInt(d: string): number {
  const n = parseInt(parseAmountDigits(d), 10);
  return Number.isNaN(n) ? 0 : n;
}

function todayDdMmYyyy(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function reminderOffsetLabel(days: number): string {
  if (days === 0) return 'ביום עצמו';
  if (days === 1) return 'יום אחד לפני';
  if (days === 7) return 'שבוע לפני';
  if (days === 30) return 'חודש לפני';
  return `${days} ימים לפני`;
}

function addCycleToDate(dateStr: string, cycle: 'weekly' | 'monthly' | 'yearly', count: number): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[2]!), parseInt(parts[1]!) - 1, parseInt(parts[0]!));
  if (cycle === 'weekly') d.setDate(d.getDate() + count * 7);
  else if (cycle === 'monthly') d.setMonth(d.getMonth() + count);
  else d.setFullYear(d.getFullYear() + count);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

type PreloadedLink = { id: string; name: string; address: string; kind: 'asset' | 'project' };

export function PaymentCreateForm({
  initialData,
  preloadedLink,
  preloadedContractId,
  preloadedContractName,
}: {
  initialData?: PaymentDetailMock;
  preloadedLink?: PreloadedLink;
  preloadedContractId?: string;
  preloadedContractName?: string;
} = {}) {
  const insets = useSafeAreaInsets();

  const [paymentName, setPaymentName] = useState(() => initialData?.displayName ?? '');
  const [direction, setDirection] = useState<'in' | 'out'>(() => initialData?.direction === 'inbound' ? 'in' : 'out');
  const [linkQuery, setLinkQuery] = useState(() => {
    if (preloadedLink) return `${preloadedLink.name}${preloadedLink.address ? ', ' + preloadedLink.address : ''}`;
    return initialData?.linkLabel ?? '';
  });
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(() => {
    if (preloadedLink) {
      return { id: preloadedLink.id, name: preloadedLink.name, address: preloadedLink.address, kind: preloadedLink.kind };
    }
    if (initialData) {
      return { id: initialData.linkId, name: initialData.linkLabel, address: '', kind: initialData.linkKind };
    }
    return null;
  });
  const [showSuggest, setShowSuggest] = useState(false);

  // Modals
  const [contractModal, setContractModal] = useState(false);
  const [recCountModal, setRecCountModal] = useState(false);
  const [paymentTypeModal, setPaymentTypeModal] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'due' | 'row' | 'guaranteeEnd' | 'recRow' | null>(null);
  const [datePickerRowId, setDatePickerRowId] = useState<string | null>(null);
  const [recRows, setRecRows] = useState<RecurringRow[]>([]);

  const [contractId, setContractId] = useState<string | null>(() => preloadedContractId ?? null);
  const [paymentType, setPaymentType] = useState<PaymentTypeKey>(() => initialData?.paymentType ?? 'rent');
  const [maintenanceCallId, setMaintenanceCallId] = useState<string | null>(null);
  const [amountExVat, setAmountExVat] = useState(() => initialData?.amountNet ? String(initialData.amountNet) : '');
  const [amountIncVat, setAmountIncVat] = useState(() => initialData?.amountGross ? String(initialData.amountGross) : '');
  const [vatPct, setVatPct] = useState('18');
  const [vatSource, setVatSource] = useState<'ex' | 'inc'>('ex');
  const [means, setMeans] = useState(() => initialData?.means ?? 'bank');
  const [dueDate, setDueDate] = useState(() => initialData?.dueDate ?? todayDdMmYyyy());
  const [paymentMode, setPaymentMode] = useState<PaymentModeKey>(() => initialData?.mode ?? 'recurring');
  const [recCycle, setRecCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recCount, setRecCount] = useState('12');
  const [instTotal, setInstTotal] = useState('');
  const [instCount, setInstCount] = useState('3');
  const [instRows, setInstRows] = useState<InstallmentRow[]>([]);
  const [shafifDays, setShafifDays] = useState('45');
  const [guaranteeType, setGuaranteeType] = useState<string>(GUARANTEE_TYPES[0]!);
  const [guaranteeEnd, setGuaranteeEnd] = useState('');
  const [indexEnabled, setIndexEnabled] = useState(false);
  const [indexBase, setIndexBase] = useState('');
  const [indexKind, setIndexKind] = useState<'cpi' | 'construction'>('cpi');
  const [indexAmount, setIndexAmount] = useState('');
  const [indexAsOf, setIndexAsOf] = useState('');
  const [payerType, setPayerType] = useState<string | null>(null);
  const [payerContactId, setPayerContactId] = useState<string | null>(null);
  const [payerSearch, setPayerSearch] = useState('');
  const [notes, setNotes] = useState(() => initialData ? '' : '');
  const [reminders, setReminders] = useState<Reminder[]>([{ id: 'default', offsetDays: 1 }]);
  const [docName, setDocName] = useState('');

  // ── Derived ────────────────────────────────────────────────────────────────

  const [entities, setEntities] = useState<EntityLinkOption[]>([]);
  useEffect(() => {
    if (!linkQuery.trim()) { setEntities([]); return; }
    const t = setTimeout(() => {
      searchEntityLinks(linkQuery).then(setEntities).catch(() => setEntities([]));
    }, 250);
    return () => clearTimeout(t);
  }, [linkQuery]);
  const contracts = useMemo(
    () => contractsForLink(linkSelected?.id ?? null, linkSelected?.kind ?? null),
    [linkSelected],
  );
  const maintCalls = useMemo(() => maintenanceCallsForLink(linkSelected?.id ?? ''), [linkSelected]);

  // Contacts linked to the selected asset/project (for payer selection)
  const linkedContacts = useMemo(() => {
    if (!linkSelected) return [];
    return MOCK_CONTACTS_LIST.filter((c) => c.linkId === linkSelected.id);
  }, [linkSelected]);

  // Autocomplete suggestions for payer search
  const payerSuggestions = useMemo(() => {
    const q = payerSearch.trim();
    if (!q) return linkedContacts.slice(0, 8);
    return linkedContacts
      .filter((c) => c.displayName.includes(q) || (c.phone && c.phone.includes(q)))
      .slice(0, 8);
  }, [linkedContacts, payerSearch]);

  const totalAmount = digitsToInt(amountIncVat) || digitsToInt(amountExVat);

  const recurringPreview = useMemo(() => {
    if (paymentMode !== 'recurring' || totalAmount <= 0) return null;
    const n = Math.min(36, Math.max(1, parseInt(recCount, 10) || 1));
    return { events: n, planned: totalAmount * n };
  }, [paymentMode, recCount, totalAmount]);

  // Regenerate recurring rows when cycle/count/dueDate changes; preserve user edits by id
  const regenerateRecRows = useCallback(() => {
    const n = Math.min(36, Math.max(1, parseInt(recCount, 10) || 1));
    setRecRows((prev) => {
      const rows: RecurringRow[] = [];
      for (let i = 0; i < n; i++) {
        const autoDate = dueDate ? addCycleToDate(dueDate, recCycle, i) : '';
        const existing = prev[i];
        rows.push({
          id: existing?.id ?? randomId(),
          index: i,
          dueDate: existing?.dueDate ?? autoDate,
          means: existing?.means ?? 'bank',
        });
      }
      return rows;
    });
  }, [recCount, recCycle, dueDate]);

  useEffect(() => {
    if (paymentMode === 'recurring') regenerateRecRows();
    else setRecRows([]);
  }, [paymentMode, recCount, recCycle, dueDate, regenerateRecRows]);

  const regenerateInstallments = useCallback(() => {
    const total = digitsToInt(instTotal);
    const n = Math.max(1, Math.min(24, parseInt(instCount, 10) || 1));
    if (total <= 0) {
      setInstRows([]);
      return;
    }
    const base = Math.floor(total / n);
    const rem = total - base * n;
    const rows: InstallmentRow[] = [];
    for (let i = 0; i < n; i++) {
      const amt = base + (i < rem ? 1 : 0);
      rows.push({
        id: randomId(),
        title: `תשלום ${i + 1}`,
        dueDate: '',
        amountDigits: String(amt),
        means: 'bank',
        indexed: false,
      });
    }
    setInstRows(rows);
  }, [instTotal, instCount]);

  useEffect(() => {
    if (paymentMode === 'installments') regenerateInstallments();
  }, [paymentMode, instTotal, instCount, regenerateInstallments]);

  const installmentsTotalPlanned = useMemo(
    () => instRows.reduce((s, r) => s + digitsToInt(r.amountDigits), 0),
    [instRows],
  );

  const shafifDuePreview = useMemo(() => {
    if (paymentMode !== 'shafif_plus') return '';
    const d = parseInt(shafifDays, 10) || 0;
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
  }, [paymentMode, shafifDays]);

  const indexSummary = useMemo(() => {
    if (!indexEnabled) return null;
    const base = digitsToInt(indexAmount) || totalAmount;
    const basePts = 105.2;
    const curPts = 108.4;
    const pct = (((curPts - basePts) / basePts) * 100).toFixed(2);
    const adj = Math.round(base * (parseFloat(pct) / 100));
    return { basePts, curPts, pct, adj, final: base + adj };
  }, [indexEnabled, totalAmount, indexAmount]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // When rent type selected → auto-set recurring monthly 12
  const onPaymentTypeSelect = (t: PaymentTypeKey) => {
    setPaymentType(t);
    if (t === 'rent') {
      setPaymentMode('recurring');
      setRecCycle('monthly');
      setRecCount('12');
    }
    setPaymentTypeModal(false);
  };

  const openDatePicker = (target: 'due' | 'row' | 'guaranteeEnd', rowId?: string) => {
    setDatePickerTarget(target);
    setDatePickerRowId(rowId ?? null);
  };

  const applyDate = (dateStr: string) => {
    if (datePickerTarget === 'due') setDueDate(dateStr);
    if (datePickerTarget === 'guaranteeEnd') setGuaranteeEnd(dateStr);
    if (datePickerTarget === 'row' && datePickerRowId) {
      setInstRows((prev) => prev.map((r) => (r.id === datePickerRowId ? { ...r, dueDate: dateStr } : r)));
    }
    if (datePickerTarget === 'recRow' && datePickerRowId) {
      setRecRows((prev) => prev.map((r) => (r.id === datePickerRowId ? { ...r, dueDate: dateStr } : r)));
    }
    setDatePickerTarget(null);
    setDatePickerRowId(null);
  };

  const addReminder = (days: number) => {
    if (reminders.some((r) => r.offsetDays === days)) return; // no duplicates
    setReminders((prev) => [...prev, { id: randomId(), offsetDays: days }]);
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const mockAttach = () => {
    Alert.alert('קובץ', 'במימוש אמיתי: בחירת קובץ / מצלמה.', [
      { text: 'אישור', onPress: () => setDocName((d) => d || 'מסמך_משויך.pdf') },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => ({
    paymentName: paymentName.trim().length === 0 ? 'שדה חובה' : '',
    linkSelected: !linkSelected ? 'יש לבחור נכס או פרויקט' : '',
    amount: !amountExVat && !amountIncVat ? 'יש להזין סכום' : '',
  }), [paymentName, linkSelected, amountExVat, amountIncVat]);

  const hasErrors = Object.values(errors).some(Boolean);

  const handleSave = () => {
    setSubmitted(true);
    if (hasErrors) return;
    if (preloadedContractId) {
      router.replace('/(app)/contracts' as const);
    } else {
      router.back();
    }
  };

  // Current date picker value
  const currentDatePickerValue = datePickerTarget === 'due'
    ? dueDate
    : datePickerTarget === 'guaranteeEnd'
      ? guaranteeEnd
      : datePickerTarget === 'row' && datePickerRowId
        ? (instRows.find((r) => r.id === datePickerRowId)?.dueDate ?? '')
        : datePickerTarget === 'recRow' && datePickerRowId
          ? (recRows.find((r) => r.id === datePickerRowId)?.dueDate ?? '')
          : '';

  const datePickerTitle = datePickerTarget === 'due'
    ? 'תאריך מועד ביצוע'
    : datePickerTarget === 'guaranteeEnd'
      ? 'תאריך סיום ביטחון'
      : datePickerTarget === 'recRow'
        ? 'תאריך תשלום מחזורי'
        : 'תאריך תשלום';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title={initialData ? 'עריכת תשלום' : 'יצירת תשלום'} showBack />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {preloadedContractId && (
            <View style={styles.contractBanner}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color={Colors.primary} />
              <AppText variant="bodySm" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                מקושר לחוזה: {preloadedContractName || preloadedContractId}
              </AppText>
            </View>
          )}

          {/* ─── שם תשלום ─── */}
          <Input
            label="שם תשלום"
            required
            value={paymentName}
            onChangeText={setPaymentName}
            error={submitted ? errors.paymentName : ''}
            containerStyle={{ marginBottom: Spacing.md }}
          />

          {/* ─── כיוון ─── */}
          <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>כיוון</AppText>
          <View style={styles.directionRow}>
            {(['in', 'out'] as const).map((d) => (
              <Pressable
                key={d}
                onPress={() => setDirection(d)}
                style={[styles.dirBtn, direction === d && { borderColor: d === 'in' ? Colors.inbound : Colors.outbound, backgroundColor: d === 'in' ? Colors.inboundBg : Colors.outboundBg }]}
              >
                <MaterialCommunityIcons name={d === 'in' ? 'arrow-down' : 'arrow-up'} size={22} color={d === 'in' ? Colors.inbound : Colors.outbound} />
                <AppText variant="bodyMd" weight="bold" style={{ color: d === 'in' ? Colors.inbound : Colors.outbound }}>
                  {d === 'in' ? 'הכנסה' : 'הוצאה'}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* ─── שיוך לנכס ─── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>שיוך לנכס / פרויקט</AppText>
            <AppText variant="labelMd" weight="bold" style={{ color: Colors.error }}>*</AppText>
          </View>
          <TextInput
            style={[styles.entityInput, submitted && errors.linkSelected ? { borderColor: Colors.error } : undefined]}
            placeholder="חיפוש..."
            placeholderTextColor={Colors.onSurfaceMuted}
            value={linkQuery}
            onChangeText={(t) => {
              setLinkQuery(t);
              setShowSuggest(t.trim().length > 0);
              if (!t) setLinkSelected(null);
            }}
            textAlign="right"
          />
          {linkSelected && (
            <View style={styles.selectedPill}>
              <AppText variant="bodySm" style={{ flex: 1 }}>
                {linkSelected.name} — {linkSelected.address}
              </AppText>
              <Pressable onPress={() => { setLinkSelected(null); setLinkQuery(''); setContractId(null); setPayerContactId(null); }}>
                <MaterialCommunityIcons name="close-circle" size={20} color={Colors.onSurfaceMuted} />
              </Pressable>
            </View>
          )}
          {showSuggest && !linkSelected && entities.length > 0 && (
            <View style={styles.suggestBox}>
              {entities.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    setLinkSelected(e);
                    setLinkQuery(`${e.name}, ${e.address}`);
                    setShowSuggest(false);
                  }}
                  style={styles.suggestRow}
                >
                  <AppText variant="bodySm">{e.name}</AppText>
                </Pressable>
              ))}
            </View>
          )}
          {submitted && errors.linkSelected ? (
            <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 2 }}>{errors.linkSelected}</AppText>
          ) : null}

          {/* ─── שיוך לחוזה ─── */}
          {!preloadedContractId && (
            <>
              <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
                שיוך לחוזה (לא חובה)
              </AppText>
              <Pressable onPress={() => setContractModal(true)} style={styles.dropdown}>
                <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                  {contractId ? contracts.find((c) => c.id === contractId)?.label ?? '—' : 'בחר חוזה'}
                </AppText>
              </Pressable>
            </>
          )}

          {/* ─── סוג תשלום (dropdown) ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            סוג תשלום
          </AppText>
          <Pressable onPress={() => setPaymentTypeModal(true)} style={styles.dropdown}>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
            <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
              {PAYMENT_TYPE_LABELS[paymentType]}
            </AppText>
          </Pressable>
          {paymentType === 'rent' && (
            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="information-outline" size={14} color={Colors.primary} />
              <AppText variant="caption" color="primary">שכירות: הוגדר אוטומטית כמחזורי חודשי × 12</AppText>
            </View>
          )}

          {/* ─── שיוך קריאת תחזוקה ─── */}
          {paymentType === 'maintenance' && linkSelected && (
            <View style={{ marginTop: Spacing.md }}>
              <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>שיוך לקריאת תחזוקה (לא חובה)</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: RTL_ROW, gap: Spacing.sm }}>
                <Pressable onPress={() => setMaintenanceCallId(null)} style={[styles.miniChip, !maintenanceCallId && styles.miniChipActive]}>
                  <AppText variant="caption" style={{ color: !maintenanceCallId ? Colors.onPrimary : Colors.onSurfaceVariant }}>ללא</AppText>
                </Pressable>
                {maintCalls.map((m) => (
                  <Pressable key={m.id} onPress={() => setMaintenanceCallId(m.id)} style={[styles.miniChip, maintenanceCallId === m.id && styles.miniChipActive]}>
                    <AppText variant="caption" numberOfLines={1} style={{ color: maintenanceCallId === m.id ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      {m.title}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ─── סכומים ומע״מ ─── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>סכומים ומע״מ</AppText>
            <AppText variant="labelMd" weight="bold" style={{ color: Colors.error }}>*</AppText>
          </View>
          {submitted && errors.amount ? (
            <AppText variant="caption" color="error" style={{ textAlign: 'right', marginBottom: Spacing.xs }}>{errors.amount}</AppText>
          ) : null}
          <AmountField
            label="סכום ללא מע״מ (₪)"
            value={amountExVat}
            onChangeValue={(d) => {
              setAmountExVat(d);
              setVatSource('ex');
              const ex = parseInt(d, 10) || 0;
              if (ex > 0) setAmountIncVat(String(Math.round(ex * (1 + parsePct(vatPct) / 100))));
            }}
            containerStyle={{ marginBottom: Spacing.sm }}
          />
          <AmountField
            label="סכום כולל מע״מ (₪)"
            value={amountIncVat}
            onChangeValue={(d) => {
              setAmountIncVat(d);
              setVatSource('inc');
              const inc = parseInt(d, 10) || 0;
              if (inc > 0) setAmountExVat(String(Math.round(inc / (1 + parsePct(vatPct) / 100))));
            }}
          />
          <Input
            label="אחוז מע״מ"
            value={vatPct}
            onChangeText={(t) => {
              setVatPct(t);
              if (vatSource === 'ex' && amountExVat) {
                const ex = digitsToInt(amountExVat);
                if (ex > 0) setAmountIncVat(String(Math.round(ex * (1 + parsePct(t) / 100))));
              } else if (vatSource === 'inc' && amountIncVat) {
                const inc = digitsToInt(amountIncVat);
                if (inc > 0) setAmountExVat(String(Math.round(inc / (1 + parsePct(t) / 100))));
              }
            }}
            keyboardType="decimal-pad"
            containerStyle={{ marginTop: Spacing.sm }}
          />

          {/* ─── אמצעי תשלום ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>אמצעי תשלום</AppText>
          <View style={styles.rowChips}>
            {MEANS_OPTIONS.map((m) => (
              <Pressable key={m.key} onPress={() => setMeans(m.key)} style={[styles.miniChip, means === m.key && styles.miniChipActive]}>
                <AppText variant="caption" weight={means === m.key ? 'bold' : 'regular'} style={{ color: means === m.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {m.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* ─── תאריך מועד ביצוע ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.md }]}>תאריך מועד ביצוע תשלום</AppText>
          <Pressable onPress={() => openDatePicker('due')} style={styles.dropdown}>
            <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
            <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>{dueDate || 'בחר תאריך'}</AppText>
          </Pressable>

          {/* ─── אופן תשלום ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>אופן תשלום</AppText>
          <View style={styles.rowChips}>
            {MODES.map((m) => (
              <Pressable key={m.key} onPress={() => setPaymentMode(m.key)} style={[styles.miniChip, paymentMode === m.key && styles.miniChipActive]}>
                <AppText variant="caption" weight={paymentMode === m.key ? 'bold' : 'regular'} style={{ color: paymentMode === m.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {m.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* ─── מחזוריות ─── */}
          {paymentMode === 'recurring' && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>מחזוריות</AppText>
              <View style={styles.rowChips}>
                {(['weekly', 'monthly', 'yearly'] as const).map((c) => (
                  <Pressable key={c} onPress={() => setRecCycle(c)} style={[styles.miniChip, recCycle === c && styles.miniChipActive]}>
                    <AppText variant="caption" style={{ color: recCycle === c ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      {c === 'weekly' ? 'שבועי' : c === 'monthly' ? 'חודשי' : 'שנתי'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.md, textAlign: 'right' }}>מספר חזרות (1–36)</AppText>
              <Pressable onPress={() => setRecCountModal(true)} style={[styles.dropdown, { marginTop: Spacing.xs }]}>
                <MaterialCommunityIcons name="chevron-down" size={22} color={Colors.primary} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                  {Math.min(36, Math.max(1, parseInt(recCount, 10) || 1))}
                </AppText>
              </Pressable>
              {recurringPreview && (
                <AppText variant="bodySm" color="primary" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                  ייווצרו {recurringPreview.events} תשלומים; סה״כ מתוכנן: ₪{formatIlsInteger(recurringPreview.planned)}
                </AppText>
              )}

              {/* תשלומים עתידיים */}
              {recRows.length > 0 && (
                <View style={{ marginTop: Spacing.md }}>
                  <AppText variant="labelMd" weight="semiBold" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
                    תשלומים עתידיים
                  </AppText>
                  {recRows.map((row) => (
                    <View key={row.id} style={styles.recRowBlock}>
                      <View style={styles.recRowHeader}>
                        <AppText variant="labelSm" weight="bold" style={{ color: Colors.primary }}>
                          תשלום {row.index + 1}
                        </AppText>
                      </View>
                      <Pressable
                        onPress={() => {
                          setDatePickerTarget('recRow');
                          setDatePickerRowId(row.id);
                        }}
                        style={[styles.dropdown, { marginBottom: Spacing.xs }]}
                      >
                        <MaterialCommunityIcons name="calendar" size={18} color={Colors.primary} />
                        <AppText variant="bodySm" style={{ flex: 1, textAlign: 'right' }}>
                          {row.dueDate || 'בחר תאריך'}
                        </AppText>
                      </Pressable>
                      <View style={styles.rowChips}>
                        {MEANS_OPTIONS.map((m) => (
                          <Pressable
                            key={m.key}
                            onPress={() => setRecRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, means: m.key } : r)))}
                            style={[styles.miniChip, row.means === m.key && styles.miniChipActive]}
                          >
                            <AppText variant="caption" style={{ color: row.means === m.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                              {m.label}
                            </AppText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ─── תשלומים מפוצלים ─── */}
          {paymentMode === 'installments' && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>תשלומים מפוצלים</AppText>
              <AmountField label="סכום כולל" value={instTotal} onChangeValue={setInstTotal} />
              <Input label="מספר תשלומים" value={instCount} onChangeText={(t) => setInstCount(t.replace(/[^\d]/g, '').slice(0, 2))} keyboardType="number-pad" containerStyle={{ marginTop: Spacing.sm }} />
              <AppText variant="caption" color="variant" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                סה״כ מהשורות: ₪{formatIlsInteger(installmentsTotalPlanned)}
              </AppText>
              {instRows.map((row, idx) => (
                <View key={row.id} style={styles.instBlock}>
                  <AppText variant="labelMd" weight="bold">תשלום {idx + 1}</AppText>
                  <Input
                    label="שם"
                    value={row.title}
                    onChangeText={(t) => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, title: t } : r)))}
                    containerStyle={{ marginTop: Spacing.xs }}
                  />
                  <Pressable onPress={() => openDatePicker('row', row.id)} style={[styles.dropdown, { marginTop: Spacing.sm }]}>
                    <MaterialCommunityIcons name="calendar" size={18} color={Colors.primary} />
                    <AppText variant="bodySm" style={{ flex: 1, textAlign: 'right' }}>
                      {row.dueDate || 'תאריך תשלום'}
                    </AppText>
                  </Pressable>
                  <AmountField
                    label="סכום"
                    value={row.amountDigits}
                    onChangeValue={(d) => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, amountDigits: d } : r)))}
                    containerStyle={{ marginTop: Spacing.sm }}
                  />
                  <AppText variant="labelSm" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>אמצעי תשלום</AppText>
                  <View style={styles.rowChips}>
                    {MEANS_OPTIONS.map((m) => (
                      <Pressable
                        key={m.key}
                        onPress={() => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, means: m.key } : r)))}
                        style={[styles.miniChip, row.means === m.key && styles.miniChipActive]}
                      >
                        <AppText variant="caption" style={{ color: row.means === m.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                          {m.label}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.switchRow}>
                    <Switch
                      value={row.indexed}
                      onValueChange={(v) => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, indexed: v } : r)))}
                    />
                    <AppText variant="bodySm">הצמדה למדד</AppText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ─── שוטף+ ─── */}
          {paymentMode === 'shafif_plus' && (
            <View style={styles.card}>
              <Input label="ימים (שוטף+)" value={shafifDays} onChangeText={setShafifDays} keyboardType="number-pad" />
              <AppText variant="bodySm" color="primary" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                מועד מחושב: {shafifDuePreview || '—'}
              </AppText>
            </View>
          )}

          {/* ─── ערבויות ─── */}
          {paymentType === 'guarantees' && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>ערבויות / בטחונות</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: RTL_ROW, gap: Spacing.sm }}>
                {GUARANTEE_TYPES.map((g) => (
                  <Pressable key={g} onPress={() => setGuaranteeType(g)} style={[styles.miniChip, guaranteeType === g && styles.miniChipActive]}>
                    <AppText variant="caption" numberOfLines={2} style={{ color: guaranteeType === g ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      {g}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>תאריך סיום ביטחון</AppText>
              <Pressable onPress={() => openDatePicker('guaranteeEnd')} style={[styles.dropdown, { marginTop: Spacing.xs }]}>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>{guaranteeEnd || 'בחר תאריך'}</AppText>
              </Pressable>
            </View>
          )}

          {/* ─── הצמדה למדד ─── */}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Switch
                value={indexEnabled}
                onValueChange={(v) => {
                  setIndexEnabled(v);
                  if (v) setIndexAmount(amountIncVat || amountExVat || '');
                  else setIndexAmount('');
                }}
              />
              <AppText variant="bodyMd" weight="semiBold">הצמדה למדד</AppText>
            </View>
            {indexEnabled && (
              <>
                <Input label="מדד בסיס (תאריך)" value={indexBase} onChangeText={setIndexBase} placeholder="DD/MM/YYYY" containerStyle={{ marginTop: Spacing.sm }} />
                <View style={[styles.rowChips, { marginTop: Spacing.sm }]}>
                  <Pressable onPress={() => setIndexKind('cpi')} style={[styles.miniChip, indexKind === 'cpi' && styles.miniChipActive]}>
                    <AppText variant="caption" style={{ color: indexKind === 'cpi' ? Colors.onPrimary : Colors.onSurfaceVariant }}>מדד המחירים לצרכן</AppText>
                  </Pressable>
                  <Pressable onPress={() => setIndexKind('construction')} style={[styles.miniChip, indexKind === 'construction' && styles.miniChipActive]}>
                    <AppText variant="caption" style={{ color: indexKind === 'construction' ? Colors.onPrimary : Colors.onSurfaceVariant }}>תשומות בנייה</AppText>
                  </Pressable>
                </View>
                <AmountField label="סכום להצמדה" value={indexAmount || amountIncVat || amountExVat} onChangeValue={setIndexAmount} containerStyle={{ marginTop: Spacing.sm }} />
                <Input label="תאריך הצמדה" value={indexAsOf} onChangeText={setIndexAsOf} placeholder={dueDate || 'DD/MM/YYYY'} containerStyle={{ marginTop: Spacing.sm }} />
                {indexSummary && (
                  <View style={styles.indexBox}>
                    <AppText variant="labelMd" weight="bold" style={{ marginBottom: Spacing.sm }}>סיכום דרישת תשלום מעודכנת (mock)</AppText>
                    <AppText variant="bodySm">סכום מקור: ₪{formatIlsInteger(digitsToInt(indexAmount) || totalAmount)}</AppText>
                    <AppText variant="bodySm">מדד בסיס: {indexSummary.basePts} נק׳</AppText>
                    <AppText variant="bodySm">מדד להצמדה: {indexSummary.curPts} נק׳</AppText>
                    <AppText variant="bodySm">שינוי במדד: {indexSummary.pct}%</AppText>
                    <AppText variant="bodySm">סכום הצמדה: ₪{formatIlsInteger(indexSummary.adj)}</AppText>
                    <AppText variant="bodyMd" weight="bold" color="primary" style={{ marginTop: Spacing.xs }}>
                      סה״כ לתשלום סופי: ₪{formatIlsInteger(indexSummary.final)}
                    </AppText>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ─── שולם על ידי ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>שולם על ידי</AppText>

          {/* סוג המשלם */}
          <View style={styles.rowChips}>
            {PAYER_TYPE_OPTIONS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPayerType((prev) => (prev === p.key ? null : p.key))}
                style={[styles.miniChip, payerType === p.key && styles.miniChipActive]}
              >
                <AppText variant="caption" weight={payerType === p.key ? 'bold' : 'regular'} style={{ color: payerType === p.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {p.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* איש קשר משויך (autocomplete) */}
          {!linkSelected ? (
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.sm }}>
              בחר נכס / פרויקט כדי לראות אנשי קשר משויכים
            </AppText>
          ) : linkedContacts.length === 0 ? (
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.sm }}>
              אין אנשי קשר משויכים לנכס זה
            </AppText>
          ) : payerContactId ? (
            /* Selected contact chip */
            <Pressable
              onPress={() => { setPayerContactId(null); setPayerSearch(''); }}
              style={[styles.payerSelected, { marginTop: Spacing.sm }]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="semiBold" style={{ textAlign: 'right', color: Colors.primary }}>
                  {linkedContacts.find((c) => c.id === payerContactId)?.displayName}
                </AppText>
                {linkedContacts.find((c) => c.id === payerContactId)?.email ? (
                  <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                    {linkedContacts.find((c) => c.id === payerContactId)?.email}
                  </AppText>
                ) : null}
              </View>
              <MaterialCommunityIcons name="account-check" size={20} color={Colors.primary} />
            </Pressable>
          ) : (
            /* Autocomplete search */
            <>
              <View style={[styles.payerInputWrap, { marginTop: Spacing.sm }]}>
                <MaterialCommunityIcons name="magnify" size={18} color={Colors.onSurfaceMuted} />
                <TextInput
                  value={payerSearch}
                  onChangeText={setPayerSearch}
                  placeholder="חיפוש לפי שם..."
                  placeholderTextColor={Colors.onSurfaceMuted}
                  style={styles.payerInput}
                  textAlign="right"
                />
                {payerSearch.length > 0 && (
                  <Pressable onPress={() => setPayerSearch('')} hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={16} color={Colors.onSurfaceMuted} />
                  </Pressable>
                )}
              </View>
              {payerSuggestions.length > 0 && (
                <View style={styles.payerDropdown}>
                  {payerSuggestions.map((c, idx) => (
                    <Pressable
                      key={c.id}
                      onPress={() => { setPayerContactId(c.id); setPayerSearch(''); }}
                      style={[
                        styles.payerOption,
                        idx < payerSuggestions.length - 1 && styles.payerOptionBorder,
                      ]}
                      accessibilityRole="button"
                    >
                      <View style={styles.payerAvatar}>
                        <AppText variant="labelSm" weight="bold" color="onPrimary">
                          {c.displayName[0]}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMd" style={{ textAlign: 'right' }}>
                          {c.displayName}
                        </AppText>
                        {c.email ? (
                          <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                            {c.email}
                          </AppText>
                        ) : null}
                      </View>
                      <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
              {payerSearch.trim().length > 0 && payerSuggestions.length === 0 && (
                <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: 4 }}>
                  לא נמצאו תוצאות
                </AppText>
              )}
            </>
          )}

          {/* ─── תזכורות ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>תזכורות לפני מועד התשלום</AppText>
          {paymentMode === 'recurring' && (
            <View style={styles.hintRow}>
              <MaterialCommunityIcons name="information-outline" size={14} color={Colors.primary} />
              <AppText variant="caption" color="primary">
                בתשלום מחזורי — תזכורות יישלחו לפני כל תשלום עתידי מתוכנן
              </AppText>
            </View>
          )}

          {/* Active reminders list */}
          <View style={styles.reminderList}>
            {reminders.map((r) => (
              <View key={r.id} style={styles.reminderChip}>
                <Pressable
                  onPress={() => removeReminder(r.id)}
                  style={styles.reminderClose}
                  accessibilityLabel="הסר תזכורת"
                >
                  <MaterialCommunityIcons name="close" size={13} color={Colors.onSurfaceMuted} />
                </Pressable>
                <MaterialCommunityIcons name="bell-outline" size={15} color={Colors.primary} />
                <AppText variant="caption" weight="semiBold" style={{ color: Colors.primary }}>
                  {reminderOffsetLabel(r.offsetDays)}
                </AppText>
              </View>
            ))}
          </View>

          {/* Preset add buttons */}
          <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginBottom: 6 }}>הוסף תזכורת:</AppText>
          <View style={styles.rowChips}>
            {REMINDER_PRESETS.map((p) => {
              const exists = reminders.some((r) => r.offsetDays === p.days);
              return (
                <Pressable
                  key={p.days}
                  onPress={() => addReminder(p.days)}
                  disabled={exists}
                  style={[styles.miniChip, exists && { opacity: 0.4 }]}
                >
                  <MaterialCommunityIcons name="plus" size={12} color={Colors.primary} />
                  <AppText variant="caption" style={{ color: Colors.primary }}>{p.label}</AppText>
                </Pressable>
              );
            })}
          </View>

          {/* ─── קובץ משויך ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>קובץ משויך</AppText>
          <Input label="שם מסמך" value={docName} onChangeText={setDocName} containerStyle={{ marginBottom: Spacing.sm }} />
          <View style={styles.fileBtns}>
            <Pressable style={styles.fileBtn} onPress={mockAttach}>
              <MaterialCommunityIcons name="folder-outline" size={22} color={Colors.primary} />
              <AppText variant="caption">קובץ</AppText>
            </Pressable>
            <Pressable style={styles.fileBtn} onPress={mockAttach}>
              <MaterialCommunityIcons name="image-outline" size={22} color={Colors.primary} />
              <AppText variant="caption">תמונה</AppText>
            </Pressable>
            <Pressable style={styles.fileBtn} onPress={mockAttach}>
              <MaterialCommunityIcons name="camera-outline" size={22} color={Colors.primary} />
              <AppText variant="caption">מצלמה</AppText>
            </Pressable>
          </View>

          {/* ─── הערות ─── */}
          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>הערות</AppText>
          <Input
            label=""
            placeholder="הוסף הערה חופשית..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button label="שמור תשלום" onPress={handleSave} fullWidth size="lg" />
        </View>
      </View>

      {/* ─── Modals ─── */}

      {/* Contract picker */}
      <Modal visible={contractModal} transparent animationType="slide" onRequestClose={() => setContractModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setContractModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>בחירת חוזה</AppText>
            <Pressable onPress={() => { setContractId(null); setContractModal(false); }} style={styles.sheetRow}>
              <AppText variant="bodyMd">ללא</AppText>
            </Pressable>
            {contracts.map((c) => (
              <Pressable key={c.id} onPress={() => { setContractId(c.id); setContractModal(false); }} style={styles.sheetRow}>
                <AppText variant="bodyMd">{c.label}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rec count picker */}
      <Modal visible={recCountModal} transparent animationType="slide" onRequestClose={() => setRecCountModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setRecCountModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>מספר חזרות</AppText>
            <ScrollView style={{ maxHeight: 300 }}>
              {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
                <Pressable key={n} onPress={() => { setRecCount(String(n)); setRecCountModal(false); }} style={styles.sheetRow}>
                  <AppText variant="bodyMd">{n}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Payment type dropdown */}
      <Modal visible={paymentTypeModal} transparent animationType="slide" onRequestClose={() => setPaymentTypeModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setPaymentTypeModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>סוג תשלום</AppText>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {ALL_PAYMENT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => onPaymentTypeSelect(t)}
                  style={[styles.sheetRow, paymentType === t && styles.sheetRowActive]}
                >
                  {paymentType === t && (
                    <MaterialCommunityIcons name="check" size={18} color={Colors.primary} style={{ marginLeft: Spacing.sm }} />
                  )}
                  <AppText variant="bodyMd" weight={paymentType === t ? 'semiBold' : 'regular'} style={{ flex: 1, textAlign: 'right', color: paymentType === t ? Colors.primary : Colors.onBackground }}>
                    {PAYMENT_TYPE_LABELS[t]}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date picker */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        value={currentDatePickerValue}
        onSelect={applyDate}
        onClose={() => { setDatePickerTarget(null); setDatePickerRowId(null); }}
        title={datePickerTitle}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  contractBanner: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.sm, color: Colors.onBackground },
  hintRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  directionRow: { flexDirection: RTL_ROW, gap: Spacing.md },
  dirBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
  },
  entityInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    backgroundColor: Colors.surfaceVariant,
  },
  selectedPill: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  suggestBox: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, marginTop: 4, overflow: 'hidden' },
  suggestRow: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, backgroundColor: Colors.surface },
  dropdown: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
  payerSelected: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  payerInputWrap: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  payerInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onSurface,
    textAlign: 'right',
  },
  payerDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  payerOption: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  payerOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  payerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowChips: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  miniChip: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    maxWidth: 200,
  },
  miniChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  card: {
    marginTop: Spacing.lg,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  instBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  switchRow: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  indexBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    gap: 4,
  },
  // Reminders
  reminderList: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reminderChip: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reminderClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBtns: { flexDirection: RTL_ROW, gap: Spacing.md },
  fileBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  footer: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    ...Shadow.sm,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing['2xl'],
  },
  sheetRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  sheetRowActive: { backgroundColor: Colors.primaryContainer },
  recRowBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  recRowHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
});
