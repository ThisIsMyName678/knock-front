import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_ACCESS_LABELS,
  METER_KIND_LABELS,
  METER_KIND_ICONS,
} from '@/lib/mocks/contracts';
import { fetchContractById, archiveContract } from '@/lib/api/contracts';
import type { ContractDetail, ContractPayment, ContractMeter, ContractFile, MeterKind } from '@/lib/api/contracts';
import { fetchPayments, createPayment, deletePayment } from '@/lib/api/contract-payments';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING, MIN_TOUCH, FontSize, FontFamily } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { AppHeader } from '@/components/ui/AppHeader';

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={sh.wrap}>
      <View style={sh.accent} />
      <AppText variant="labelLg" weight="bold">{title}</AppText>
      {count !== undefined && (
        <View style={sh.badge}>
          <AppText variant="caption" weight="bold" style={{ color: Colors.onPrimary, fontSize: 11 }}>
            {count}
          </AppText>
        </View>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  wrap: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  accent: { width: 4, height: 18, borderRadius: 2, backgroundColor: Colors.primary },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function fmtDecimal(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return `₪${num.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ─── Payments Section ─────────────────────────────────────────────────────────

function PaymentsSection({
  payments,
  onAdd,
  onDelete,
}: {
  payments: ContractPayment[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  if (payments.length === 0) {
    return (
      <View style={sec.wrap}>
        <SectionHeader title="תשלומים" count={0} />
        <AppText variant="bodySm" color="muted">לא הוזנו תשלומים לחוזה זה</AppText>
        <Pressable onPress={onAdd} style={sec.addBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="plus" size={16} color={Colors.primary} />
          <AppText variant="bodySm" weight="semiBold" color="primary">הוסף תשלום</AppText>
        </Pressable>
      </View>
    );
  }

  const totalIn = payments.filter((p) => p.direction === 'IN').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalOut = payments.filter((p) => p.direction === 'OUT').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <View style={sec.wrap}>
      <SectionHeader title="תשלומים" count={payments.length} />

      {/* Summary strip */}
      <View style={sec.summaryRow}>
        <View style={[sec.summaryBox, { backgroundColor: Colors.successContainer }]}>
          <MaterialCommunityIcons name="arrow-down" size={14} color={Colors.success} />
          <AppText variant="bodySm" weight="bold" style={{ color: Colors.success }}>
            ₪{totalIn.toLocaleString('he-IL')}
          </AppText>
          <AppText variant="caption" color="muted">הכנסות</AppText>
        </View>
        <View style={[sec.summaryBox, { backgroundColor: Colors.errorContainer }]}>
          <MaterialCommunityIcons name="arrow-up" size={14} color={Colors.error} />
          <AppText variant="bodySm" weight="bold" style={{ color: Colors.error }}>
            ₪{totalOut.toLocaleString('he-IL')}
          </AppText>
          <AppText variant="caption" color="muted">הוצאות</AppText>
        </View>
      </View>

      <Card>
        {payments.map((p, i) => {
          const inbound = p.direction === 'IN';
          const color = inbound ? Colors.success : Colors.error;
          return (
            <View key={p.id} style={[sec.payRow, i < payments.length - 1 && sec.rowBorder]}>
              <View style={[sec.dirIcon, { backgroundColor: inbound ? Colors.successContainer : Colors.errorContainer }]}>
                <MaterialCommunityIcons name={inbound ? 'arrow-down' : 'arrow-up'} size={14} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="semiBold">{p.categoryLabel}</AppText>
                {p.notes ? <AppText variant="bodySm" color="muted">{p.notes}</AppText> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <AppText variant="bodyMd" weight="bold" style={{ color }}>{fmtDecimal(p.amount)}</AppText>
                <AppText variant="caption" color="muted">{p.date}</AppText>
              </View>
              <Pressable
                onPress={() => onDelete(p.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="מחק תשלום"
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Pressable onPress={onAdd} style={sec.addBtn} accessibilityRole="button">
        <MaterialCommunityIcons name="plus" size={16} color={Colors.primary} />
        <AppText variant="bodySm" weight="semiBold" color="primary">הוסף תשלום</AppText>
      </Pressable>
    </View>
  );
}

// ─── Meters Section ───────────────────────────────────────────────────────────

function MetersSection({ meters }: { meters: ContractMeter[] }) {
  if (meters.length === 0) {
    return (
      <View style={sec.wrap}>
        <SectionHeader title="מונים" count={0} />
        <AppText variant="bodySm" color="muted">לא תועדו מונים לחוזה זה</AppText>
      </View>
    );
  }

  const kindColor: Record<MeterKind, string> = {
    ELECTRIC: Colors.warning ?? '#F59E0B',
    WATER: Colors.info ?? '#3B82F6',
    GAS: Colors.error,
    OTHER: Colors.onSurfaceVariant,
  };

  return (
    <View style={sec.wrap}>
      <SectionHeader title="מונים" count={meters.length} />
      <View style={sec.metersGrid}>
        {meters.map((m) => {
          const color = kindColor[m.kind];
          return (
            <Card key={m.id} style={sec.meterCard}>
              <View style={[sec.meterIconWrap, { backgroundColor: `${color}18` }]}>
                <MaterialCommunityIcons
                  name={METER_KIND_ICONS[m.kind] as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={22}
                  color={color}
                />
              </View>
              <AppText variant="labelMd" weight="bold" style={{ textAlign: 'center' }}>{m.name}</AppText>
              <AppText variant="bodySm" color="muted" style={{ textAlign: 'center' }}>{METER_KIND_LABELS[m.kind]}</AppText>
              <View style={sec.meterValueRow}>
                <AppText variant="bodyMd" weight="bold">{m.currentValue ?? '—'}</AppText>
              </View>
              <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>מזהה: {m.identifier}</AppText>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

// ─── Files Section ────────────────────────────────────────────────────────────

function FilesSection({ files }: { files: ContractFile[] }) {
  if (files.length === 0) {
    return (
      <View style={sec.wrap}>
        <SectionHeader title="קבצים ותמונות" count={0} />
        <AppText variant="bodySm" color="muted">לא הועלו קבצים לחוזה זה</AppText>
      </View>
    );
  }

  return (
    <View style={sec.wrap}>
      <SectionHeader title="קבצים ותמונות" count={files.length} />
      <View style={sec.filesGrid}>
        {files.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => Alert.alert('בקרוב', `פתיחת ${f.displayName}`)}
            style={({ pressed }) => [sec.fileCard, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={`פתח ${f.displayName}`}
          >
            {f.fileType === 'image' ? (
              <View style={[sec.fileThumb, sec.fileImgThumb]}>
                <MaterialCommunityIcons name="image-outline" size={36} color={Colors.primary} />
              </View>
            ) : (
              <View style={[sec.fileThumb, sec.filePdfThumb]}>
                <MaterialCommunityIcons name="file-pdf-box" size={36} color={Colors.error} />
              </View>
            )}
            <View style={sec.fileInfo}>
              <AppText variant="caption" weight="semiBold" numberOfLines={2} style={{ textAlign: 'right' }}>
                {f.displayName}
              </AppText>
              <AppText variant="caption" color="muted" numberOfLines={1} style={{ textAlign: 'right' }}>
                {f.category}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Shared section styles ────────────────────────────────────────────────────

const sec = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  summaryRow: { flexDirection: RTL_ROW, gap: Spacing.sm, marginBottom: Spacing.xs },
  summaryBox: {
    flex: 1,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  payRow: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  dirIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metersGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  meterCard: {
    width: '47%',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  meterIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  meterValueRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  addBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  filesGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  fileCard: {
    width: '47%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  fileThumb: {
    width: '100%',
    height: 100,
  },
  filePdfThumb: {
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileImgThumb: {
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    padding: Spacing.sm,
    gap: 2,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ContractDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payments, setPayments] = useState<ContractPayment[]>([]);
  const [addPaymentVisible, setAddPaymentVisible] = useState(false);
  const [payDirection, setPayDirection] = useState<'IN' | 'OUT'>('IN');
  const [payCategory, setPayCategory] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySaving, setPaySaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchContractById(id)
      .then(setDetail)
      .catch(() => setError('שגיאה בטעינת פרטי החוזה'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (detail) setPayments(detail.payments);
  }, [detail]);

  const refreshPayments = useCallback(async () => {
    if (!id) return;
    try {
      const updated = await fetchPayments(id);
      setPayments(updated);
    } catch {
      /* silent */
    }
  }, [id]);

  const openAddPayment = useCallback(() => {
    setPayDirection('IN');
    setPayCategory('');
    setPayAmount('');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNotes('');
    setAddPaymentVisible(true);
  }, []);

  const handleAddPayment = useCallback(async () => {
    if (!id || !payCategory.trim() || !payAmount.trim() || !payDate.trim()) return;
    setPaySaving(true);
    try {
      await createPayment(id, {
        direction: payDirection,
        categoryLabel: payCategory.trim(),
        amount: payAmount.trim(),
        date: payDate.trim(),
        notes: payNotes.trim() || null,
      });
      setAddPaymentVisible(false);
      await refreshPayments();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן להוסיף תשלום');
    } finally {
      setPaySaving(false);
    }
  }, [id, payDirection, payCategory, payAmount, payDate, payNotes, refreshPayments]);

  const handleDeletePayment = useCallback((paymentId: string) => {
    if (!id) return;
    Alert.alert('מחיקת תשלום', 'האם למחוק את התשלום?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePayment(id, paymentId);
            await refreshPayments();
          } catch {
            Alert.alert('שגיאה', 'לא ניתן למחוק את התשלום');
          }
        },
      },
    ]);
  }, [id, refreshPayments]);

  const onShare = useCallback(async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `${detail.contractName}\n${CONTRACT_TYPE_LABELS[detail.contractType]}\n${detail.linkLabel}\n${detail.counterpartyName}`,
        title: detail.contractName,
      });
    } catch {
      /* ignore */
    }
  }, [detail]);

  const onDuplicate = useCallback(() => {
    Alert.alert('שכפול חוזה', 'במימוש אמיתי ייווצר עותק טיוטה. כעת רק תצוגה.', [{ text: 'אישור' }]);
  }, []);

  const onEdit = useCallback(() => {
    if (detail) router.push(`/(app)/contracts/edit/${detail.id}`);
  }, [detail]);

  const onDelete = useCallback(() => {
    Alert.alert(
      'ארכוב חוזה',
      'החוזה יסומן כפג תוקף והנתונים יישמרו. להמשיך?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'ארכב',
          style: 'destructive',
          onPress: async () => {
            try {
              await archiveContract(id ?? '');
              router.back();
            } catch {
              Alert.alert('שגיאה', 'לא ניתן לארכב את החוזה');
            }
          },
        },
      ],
    );
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="פרטי חוזה" showBack />
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="חוזה" showBack />
        <View style={styles.emptyWrap}>
          <AppText variant="bodyMd" color="variant" align="center">
            {error ?? 'לא נמצא חוזה'}
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const statusPreset = detail.status === 'ACTIVE' ? 'success' : detail.status === 'EXPIRED' ? 'neutral' : 'warning';

  const detailRows: { label: string; value: string }[] = [
    { label: 'שם החוזה', value: detail.contractName },
    { label: 'סוג חוזה', value: CONTRACT_TYPE_LABELS[detail.contractType] },
    ...(detail.accessLevel
      ? [{ label: 'הרשאות גישה', value: CONTRACT_ACCESS_LABELS[detail.accessLevel] }]
      : []),
    { label: 'שיוך', value: `${detail.linkKind === 'PROJECT' ? 'פרויקט' : 'נכס'}: ${detail.linkLabel}` },
    { label: 'שם השוכר / רוכש / נותן שירות', value: detail.counterpartyName },
    { label: 'תאריך הסכם', value: detail.agreementDate ?? '—' },
    { label: 'תוקף', value: detail.endDate ?? '—' },
    { label: 'שכירות / סכום', value: detail.monthlyAmount ?? '—' },
    { label: 'טלפון', value: detail.counterpartyPhone ?? '—' },
    { label: 'אימייל', value: detail.counterpartyEmail ?? '—' },
    { label: 'איש קשר', value: detail.contactName ?? '—' },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="פרטי חוזה" showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <Card>
          <View style={styles.contractHeader}>
            <View style={styles.iconBig}>
              <MaterialCommunityIcons name="file-sign" size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="headingSm" weight="bold" numberOfLines={2}>
                {detail.contractName}
              </AppText>
              <AppText variant="bodySm" color="variant">
                מזהה: {detail.id}
              </AppText>
            </View>
            <Badge label={CONTRACT_STATUS_LABELS[detail.status]} preset={statusPreset} />
          </View>
        </Card>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={onShare} accessibilityRole="button" accessibilityLabel="שיתוף">
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">שיתוף</AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onDuplicate} accessibilityRole="button" accessibilityLabel="שכפול">
            <MaterialCommunityIcons name="content-copy" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">שכפול</AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onEdit} accessibilityRole="button" accessibilityLabel="עריכה">
            <MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">עריכה</AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onDelete} accessibilityRole="button" accessibilityLabel="מחיקה">
            <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.error} />
            <AppText variant="caption" style={{ color: Colors.error }} weight="semiBold">מחיקה</AppText>
          </Pressable>
        </View>

        {/* ─── Contract Details ─── */}
        <View style={sec.wrap}>
          <SectionHeader title="פרטי החוזה" />
          <Card>
            {detailRows.map((f, i) => (
              <View key={f.label} style={[styles.row, i < detailRows.length - 1 && styles.rowBorder]}>
                <AppText variant="bodyMd" color="variant">{f.label}</AppText>
                <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'left' }} numberOfLines={3}>
                  {f.value}
                </AppText>
              </View>
            ))}
          </Card>
        </View>

        {/* ─── Payments ─── */}
        <PaymentsSection payments={payments} onAdd={openAddPayment} onDelete={handleDeletePayment} />

        {/* ─── Meters ─── */}
        <MetersSection meters={detail.meters} />

        {/* ─── Files / Images ─── */}
        <FilesSection files={detail.files} />

        <Button
          label="צפה בחוזה המלא"
          onPress={() => Alert.alert('בקרוב', 'צפייה במסמך PDF')}
          fullWidth
          variant="secondary"
          size="lg"
        />
        <Button
          label="חוזה חדש"
          onPress={() => router.push('/(app)/contracts/new')}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.sm }}
        />
      </ScrollView>

      {/* ─── Add Payment Modal ─── */}
      <Modal
        visible={addPaymentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddPaymentVisible(false)}
      >
        <Pressable style={modal.backdrop} onPress={() => setAddPaymentVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={modal.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={modal.handle} />
              <AppText variant="labelLg" weight="bold" style={{ marginBottom: Spacing.md }}>הוספת תשלום</AppText>

              <View style={modal.dirRow}>
                {(['IN', 'OUT'] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setPayDirection(d)}
                    style={[
                      modal.dirBtn,
                      payDirection === d && {
                        borderColor: d === 'IN' ? Colors.success : Colors.error,
                        backgroundColor: d === 'IN' ? Colors.successContainer : Colors.errorContainer,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name={d === 'IN' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={payDirection === d ? (d === 'IN' ? Colors.success : Colors.error) : Colors.onSurfaceVariant}
                    />
                    <AppText
                      variant="bodySm"
                      weight="semiBold"
                      style={{ color: payDirection === d ? (d === 'IN' ? Colors.success : Colors.error) : Colors.onSurfaceVariant }}
                    >
                      {d === 'IN' ? 'הכנסה' : 'הוצאה'}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <Input label="קטגוריה" value={payCategory} onChangeText={setPayCategory} containerStyle={{ marginTop: Spacing.md }} />
              <Input label="סכום" value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" containerStyle={{ marginTop: Spacing.md }} />
              <Input label="תאריך (YYYY-MM-DD)" value={payDate} onChangeText={setPayDate} containerStyle={{ marginTop: Spacing.md }} />
              <Input label="הערות (אופציונלי)" value={payNotes} onChangeText={setPayNotes} containerStyle={{ marginTop: Spacing.md }} />

              <View style={modal.actions}>
                <Button label="ביטול" variant="secondary" onPress={() => setAddPaymentVisible(false)} style={{ flex: 1 }} />
                <Button
                  label={paySaving ? 'שומר...' : 'הוסף'}
                  onPress={handleAddPayment}
                  disabled={paySaving || !payCategory.trim() || !payAmount.trim() || !payDate.trim()}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.lg },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  contractHeader: { flexDirection: RTL_ROW, alignItems: 'center', gap: Spacing.md },
  iconBig: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: RTL_ROW,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    minHeight: MIN_TOUCH,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  row: { flexDirection: RTL_ROW, justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing['2xl'],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  dirRow: { flexDirection: RTL_ROW, gap: Spacing.sm },
  dirBtn: {
    flex: 1,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  actions: { flexDirection: RTL_ROW, gap: Spacing.sm, marginTop: Spacing.lg },
});
