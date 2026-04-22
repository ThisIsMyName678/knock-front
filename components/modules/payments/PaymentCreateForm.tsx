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
import {
  PAYMENT_TYPE_LABELS,
  PAYMENT_ENTITY_OPTIONS,
  contractsForLink,
  maintenanceCallsForLink,
  filterEntitiesForPaymentQuery,
  type PaymentTypeKey,
  type PaymentModeKey,
} from '@/lib/mocks/payments';
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
  shafif: boolean;
  shafifDays: string;
};

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

export function PaymentCreateForm() {
  const insets = useSafeAreaInsets();

  const [paymentName, setPaymentName] = useState('');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkSelected, setLinkSelected] = useState<(typeof PAYMENT_ENTITY_OPTIONS)[0] | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [contractModal, setContractModal] = useState(false);
  const [recCountModal, setRecCountModal] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentTypeKey>('rent');
  const [maintenanceCallId, setMaintenanceCallId] = useState<string | null>(null);
  const [amountExVat, setAmountExVat] = useState('');
  const [amountIncVat, setAmountIncVat] = useState('');
  const [vatPct, setVatPct] = useState('18');
  const [vatSource, setVatSource] = useState<'ex' | 'inc'>('ex');
  const [means, setMeans] = useState('bank');
  const [dueDate, setDueDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentModeKey>('full');
  const [recCycle, setRecCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recCount, setRecCount] = useState('12');
  const [recEndDate, setRecEndDate] = useState('');
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
  const [payerKind, setPayerKind] = useState<'owner' | 'tenant' | 'employee' | 'buyer' | 'other'>('owner');
  const [employeeName, setEmployeeName] = useState('');
  const [reminderDay, setReminderDay] = useState('1');
  const [reminderUnit, setReminderUnit] = useState<'days' | 'months'>('days');
  const [docName, setDocName] = useState('');
  const [dateModal, setDateModal] = useState<{
    visible: boolean;
    target: 'due' | 'row' | 'recEnd' | 'guaranteeEnd' | null;
    rowId: string | null;
  }>({
    visible: false,
    target: null,
    rowId: null,
  });

  const entities = useMemo(() => filterEntitiesForPaymentQuery(linkQuery), [linkQuery]);
  const contracts = useMemo(
    () => contractsForLink(linkSelected?.id ?? null, linkSelected?.kind ?? null),
    [linkSelected],
  );
  const maintCalls = useMemo(() => maintenanceCallsForLink(linkSelected?.id ?? ''), [linkSelected]);

  const totalAmount = digitsToInt(amountIncVat) || digitsToInt(amountExVat);

  const recurringPreview = useMemo(() => {
    if (paymentMode !== 'recurring' || !recEndDate || totalAmount <= 0) return null;
    const n = Math.min(12, Math.max(1, parseInt(recCount, 10) || 1));
    return { events: n, planned: totalAmount * n };
  }, [paymentMode, recEndDate, recCount, totalAmount]);

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
        shafif: false,
        shafifDays: '30',
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
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
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

  const openDatePick = (target: 'due' | 'row' | 'recEnd' | 'guaranteeEnd', rowId?: string) => {
    setDateModal({ visible: true, target, rowId: rowId ?? null });
  };

  const applyPresetDate = (label: string) => {
    if (dateModal.target === 'due') setDueDate(label);
    if (dateModal.target === 'recEnd') setRecEndDate(label);
    if (dateModal.target === 'guaranteeEnd') setGuaranteeEnd(label);
    if (dateModal.target === 'row' && dateModal.rowId) {
      setInstRows((prev) => prev.map((r) => (r.id === dateModal.rowId ? { ...r, dueDate: label } : r)));
    }
    setDateModal({ visible: false, target: null, rowId: null });
  };

  const mockAttach = () => {
    Alert.alert('קובץ', 'במימוש אמיתי: בחירת קובץ / מצלמה.', [
      { text: 'אישור', onPress: () => setDocName((d) => d || 'מסמך_משויך.pdf') },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const valid = paymentName.trim().length > 0 && linkSelected !== null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            יצירת תשלום
          </AppText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input label="שם תשלום" value={paymentName} onChangeText={setPaymentName} containerStyle={{ marginBottom: Spacing.md }} />

          <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
            כיוון
          </AppText>
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

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            שיוך לנכס / פרויקט (חובה)
          </AppText>
          <TextInput
            style={styles.entityInput}
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
              <Pressable onPress={() => { setLinkSelected(null); setLinkQuery(''); setContractId(null); }}>
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

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
            שיוך לחוזה (לא חובה)
          </AppText>
          <Pressable onPress={() => setContractModal(true)} style={styles.dropdown}>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
            <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
              {contractId ? contracts.find((c) => c.id === contractId)?.label ?? '—' : 'בחר חוזה'}
            </AppText>
          </Pressable>

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            סוג תשלום
          </AppText>
          <View style={styles.typeGrid}>
            {ALL_PAYMENT_TYPES.map((t) => (
              <Pressable key={t} onPress={() => setPaymentType(t)} style={[styles.typeChip, paymentType === t && styles.typeChipActive]}>
                <AppText variant="caption" numberOfLines={2} align="center" weight={paymentType === t ? 'bold' : 'regular'} style={{ color: paymentType === t ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {PAYMENT_TYPE_LABELS[t]}
                </AppText>
              </Pressable>
            ))}
          </View>

          {paymentType === 'maintenance' && linkSelected && (
            <View style={{ marginTop: Spacing.md }}>
              <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
                שיוך לקריאת תחזוקה (לא חובה)
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: Spacing.sm }}>
                <Pressable onPress={() => setMaintenanceCallId(null)} style={[styles.miniChip, !maintenanceCallId && styles.miniChipActive]}>
                  <AppText variant="caption" style={{ color: !maintenanceCallId ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    ללא
                  </AppText>
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

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            סכומים ומע״מ
          </AppText>
          <AmountField
            label="סכום ללא מע״מ (₪)"
            value={amountExVat}
            onChangeValue={(d) => {
              setAmountExVat(d);
              setVatSource('ex');
              const ex = parseInt(d, 10) || 0;
              const pct = parsePct(vatPct);
              if (ex > 0) setAmountIncVat(String(Math.round(ex * (1 + pct / 100))));
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
              const pct = parsePct(vatPct);
              if (inc > 0) setAmountExVat(String(Math.round(inc / (1 + pct / 100))));
            }}
          />
          <Input
            label="אחוז מע״מ"
            value={vatPct}
            onChangeText={(t) => {
              setVatPct(t);
              if (vatSource === 'ex' && amountExVat) {
                const ex = digitsToInt(amountExVat);
                const pct = parsePct(t);
                if (ex > 0) setAmountIncVat(String(Math.round(ex * (1 + pct / 100))));
              } else if (vatSource === 'inc' && amountIncVat) {
                const inc = digitsToInt(amountIncVat);
                const pct = parsePct(t);
                if (inc > 0) setAmountExVat(String(Math.round(inc / (1 + pct / 100))));
              }
            }}
            keyboardType="decimal-pad"
            containerStyle={{ marginTop: Spacing.sm }}
          />

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            אמצעי תשלום
          </AppText>
          <View style={styles.typeGrid}>
            {MEANS_OPTIONS.map((m) => (
              <Pressable key={m.key} onPress={() => setMeans(m.key)} style={[styles.typeChip, means === m.key && styles.typeChipActive]}>
                <AppText variant="caption" weight={means === m.key ? 'bold' : 'regular'} style={{ color: means === m.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {m.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
            תאריך מועד ביצוע תשלום
          </AppText>
          <Pressable onPress={() => openDatePick('due')} style={styles.dropdown}>
            <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
            <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
              {dueDate || 'בחר תאריך'}
            </AppText>
          </Pressable>

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            אופן תשלום (דיפולט: מלא)
          </AppText>
          <View style={styles.typeGrid}>
            {MODES.map((m) => (
              <Pressable key={m.key} onPress={() => setPaymentMode(m.key)} style={[styles.typeChip, paymentMode === m.key && styles.typeChipActive]}>
                <AppText variant="caption" weight={paymentMode === m.key ? 'bold' : 'regular'} style={{ color: paymentMode === m.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {m.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          {paymentMode === 'recurring' && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>
                מחזוריות
              </AppText>
              <View style={styles.rowChips}>
                {(['weekly', 'monthly', 'yearly'] as const).map((c) => (
                  <Pressable key={c} onPress={() => setRecCycle(c)} style={[styles.miniChip, recCycle === c && styles.miniChipActive]}>
                    <AppText variant="caption" style={{ color: recCycle === c ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      {c === 'weekly' ? 'שבועי' : c === 'monthly' ? 'חודשי' : 'שנתי'}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                מספר חזרות (1–12)
              </AppText>
              <Pressable onPress={() => setRecCountModal(true)} style={[styles.dropdown, { marginTop: Spacing.xs }]}>
                <MaterialCommunityIcons name="chevron-down" size={22} color={Colors.primary} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                  {Math.min(12, Math.max(1, parseInt(recCount, 10) || 1))}
                </AppText>
              </Pressable>
              <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                תאריך סיום מחזוריות
              </AppText>
              <Pressable onPress={() => openDatePick('recEnd')} style={[styles.dropdown, { marginTop: Spacing.xs }]}>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                  {recEndDate || 'בחר תאריך בלוח שנה'}
                </AppText>
              </Pressable>
              {recurringPreview && (
                <AppText variant="bodySm" color="primary" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                  ייווצרו כ־{recurringPreview.events} תשלומים; סה״כ מתוכנן: ₪{formatIlsInteger(recurringPreview.planned)}
                </AppText>
              )}
            </View>
          )}

          {paymentMode === 'installments' && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>
                תשלומים מפוצלים
              </AppText>
              <AmountField label="סכום כולל" value={instTotal} onChangeValue={setInstTotal} />
              <Input label="מספר תשלומים" value={instCount} onChangeText={(t) => setInstCount(t.replace(/[^\d]/g, '').slice(0, 2))} keyboardType="number-pad" containerStyle={{ marginTop: Spacing.sm }} />
              <AppText variant="caption" color="variant" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                סה״כ מתוכנן מהשורות: ₪{formatIlsInteger(installmentsTotalPlanned)}
              </AppText>
              <AppText variant="caption" color="muted" style={{ marginTop: Spacing.xs, textAlign: 'right' }}>
                בתשלומים מפוצלים ניתן ליצור תזכורת נפרדת לכל שורה (תצוגה בלבד).
              </AppText>
              {instRows.map((row, idx) => (
                <View key={row.id} style={styles.instBlock}>
                  <AppText variant="labelMd" weight="bold">
                    תשלום {idx + 1}
                  </AppText>
                  <Input label="שם" value={row.title} onChangeText={(t) => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, title: t } : r)))} containerStyle={{ marginTop: Spacing.xs }} />
                  <Pressable onPress={() => openDatePick('row', row.id)} style={[styles.dropdown, { marginTop: Spacing.sm }]}>
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
                  <View style={styles.switchRow}>
                    <Switch value={row.shafif} onValueChange={(v) => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, shafif: v } : r)))} />
                    <AppText variant="bodySm">שוטף+</AppText>
                  </View>
                  {row.shafif && (
                    <Input label="ימים +" value={row.shafifDays} onChangeText={(t) => setInstRows((p) => p.map((r) => (r.id === row.id ? { ...r, shafifDays: t } : r)))} keyboardType="number-pad" />
                  )}
                  <AppText variant="labelSm" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                    אמצעי תשלום
                  </AppText>
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

          {paymentMode === 'shafif_plus' && (
            <View style={styles.card}>
              <Input label="ימים (שוטף+)" value={shafifDays} onChangeText={setShafifDays} keyboardType="number-pad" />
              <AppText variant="bodySm" color="primary" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                מועד מחושב: {shafifDuePreview || '—'}
              </AppText>
            </View>
          )}

          {paymentType === 'guarantees' && (
            <View style={styles.card}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>
                ערבויות / בטחונות
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: Spacing.sm }}>
                {GUARANTEE_TYPES.map((g) => (
                  <Pressable key={g} onPress={() => setGuaranteeType(g)} style={[styles.miniChip, guaranteeType === g && styles.miniChipActive]}>
                    <AppText variant="caption" numberOfLines={2} style={{ color: guaranteeType === g ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      {g}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.sm, textAlign: 'right' }}>
                תאריך סיום ביטחון
              </AppText>
              <Pressable onPress={() => openDatePick('guaranteeEnd')} style={[styles.dropdown, { marginTop: Spacing.xs }]}>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                  {guaranteeEnd || 'בחר תאריך'}
                </AppText>
              </Pressable>
            </View>
          )}

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
              <AppText variant="bodyMd" weight="semiBold">
                הצמדה למדד
              </AppText>
            </View>
            {indexEnabled && (
              <>
                <Input label="מדד בסיס (תאריך)" value={indexBase} onChangeText={setIndexBase} placeholder="DD/MM/YYYY" containerStyle={{ marginTop: Spacing.sm }} />
                <View style={styles.rowChips}>
                  <Pressable onPress={() => setIndexKind('cpi')} style={[styles.miniChip, indexKind === 'cpi' && styles.miniChipActive]}>
                    <AppText variant="caption" style={{ color: indexKind === 'cpi' ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      מדד המחירים לצרכן
                    </AppText>
                  </Pressable>
                  <Pressable onPress={() => setIndexKind('construction')} style={[styles.miniChip, indexKind === 'construction' && styles.miniChipActive]}>
                    <AppText variant="caption" style={{ color: indexKind === 'construction' ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                      תשומות בנייה
                    </AppText>
                  </Pressable>
                </View>
                <AmountField
                  label="סכום להצמדה"
                  value={indexAmount || amountIncVat || amountExVat}
                  onChangeValue={setIndexAmount}
                  containerStyle={{ marginTop: Spacing.sm }}
                />
                <Input label="תאריך הצמדה" value={indexAsOf} onChangeText={setIndexAsOf} placeholder={dueDate || 'DD/MM/YYYY'} containerStyle={{ marginTop: Spacing.sm }} />
                {indexSummary && (
                  <View style={styles.indexBox}>
                    <AppText variant="labelMd" weight="bold" style={{ marginBottom: Spacing.sm }}>
                      סיכום דרישת תשלום מעודכנת (mock)
                    </AppText>
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

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            שולם על ידי
          </AppText>
          <View style={styles.rowChips}>
            {(
              [
                ['owner', 'בעל הנכס'],
                ['tenant', 'שוכר'],
                ['employee', 'עובד'],
                ['buyer', 'רוכש'],
                ['other', 'אחר'],
              ] as const
            ).map(([k, lab]) => (
              <Pressable key={k} onPress={() => setPayerKind(k)} style={[styles.miniChip, payerKind === k && styles.miniChipActive]}>
                <AppText variant="caption" style={{ color: payerKind === k ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                  {lab}
                </AppText>
              </Pressable>
            ))}
          </View>
          {payerKind === 'employee' && (
            <Input label="שם עובד" value={employeeName} onChangeText={setEmployeeName} containerStyle={{ marginTop: Spacing.sm }} />
          )}

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            תזכורת
          </AppText>
          <View style={{ flexDirection: 'row-reverse', gap: Spacing.md }}>
            <Input label="יום (1–31)" value={reminderDay} onChangeText={(t) => setReminderDay(t.replace(/[^\d]/g, '').slice(0, 2))} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={styles.rowChips}>
                <Pressable onPress={() => setReminderUnit('days')} style={[styles.miniChip, reminderUnit === 'days' && styles.miniChipActive]}>
                  <AppText variant="caption" style={{ color: reminderUnit === 'days' ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    ימים
                  </AppText>
                </Pressable>
                <Pressable onPress={() => setReminderUnit('months')} style={[styles.miniChip, reminderUnit === 'months' && styles.miniChipActive]}>
                  <AppText variant="caption" style={{ color: reminderUnit === 'months' ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    חודשים
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>

          <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
            קובץ משויך
          </AppText>
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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button label="שמור תשלום" onPress={() => valid && router.back()} disabled={!valid} fullWidth size="lg" />
        </View>
      </View>

      <Modal visible={contractModal} transparent animationType="slide" onRequestClose={() => setContractModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setContractModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
              בחירת חוזה
            </AppText>
            <Pressable
              onPress={() => {
                setContractId(null);
                setContractModal(false);
              }}
              style={styles.sheetRow}
            >
              <AppText variant="bodyMd">ללא</AppText>
            </Pressable>
            {contracts.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setContractId(c.id);
                  setContractModal(false);
                }}
                style={styles.sheetRow}
              >
                <AppText variant="bodyMd">{c.label}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={recCountModal} transparent animationType="slide" onRequestClose={() => setRecCountModal(false)}>
        <Pressable style={styles.modalBg} onPress={() => setRecCountModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
              בחירת מספר חזרות
            </AppText>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  setRecCount(String(n));
                  setRecCountModal(false);
                }}
                style={styles.sheetRow}
              >
                <AppText variant="bodyMd">{n}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={dateModal.visible} transparent animationType="fade" onRequestClose={() => setDateModal({ visible: false, target: null, rowId: null })}>
        <Pressable style={styles.modalBg} onPress={() => setDateModal({ visible: false, target: null, rowId: null })}>
          <View style={styles.dateSheet}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md }}>
              בחירת תאריך
            </AppText>
            {['01/05/2026', '15/05/2026', '01/06/2026', '15/06/2026', '01/07/2026'].map((d) => (
              <Pressable key={d} onPress={() => applyPresetDate(d)} style={styles.sheetRow}>
                <AppText variant="bodyMd">{d}</AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    ...Shadow.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.sm, color: Colors.onBackground },
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: {
    width: '31%',
    minHeight: 44,
    padding: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  card: {
    marginTop: Spacing.lg,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  rowChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
  miniChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    maxWidth: 200,
  },
  miniChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  instBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  indexBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    gap: 4,
  },
  fileBtns: { flexDirection: 'row-reverse', gap: Spacing.md },
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
  sheetRow: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  dateSheet: {
    margin: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
});
