import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share, Alert, Image } from 'react-native';
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
  getContractDetailMock,
  type ContractPaymentMock,
  type ContractMeterMock,
  type ContractFileMock,
} from '@/lib/mocks/contracts';
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

// ─── Payments Section ─────────────────────────────────────────────────────────

function PaymentsSection({ payments }: { payments: ContractPaymentMock[] }) {
  if (payments.length === 0) {
    return (
      <View style={sec.wrap}>
        <SectionHeader title="תשלומים" count={0} />
        <AppText variant="bodySm" color="muted">לא הוזנו תשלומים לחוזה זה</AppText>
      </View>
    );
  }

  const totalIn = payments.filter((p) => p.direction === 'IN').reduce((sum, p) => sum + parseFloat(p.amount.replace(/[₪,]/g, '') || '0'), 0);
  const totalOut = payments.filter((p) => p.direction === 'OUT').reduce((sum, p) => sum + parseFloat(p.amount.replace(/[₪,]/g, '') || '0'), 0);

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
                <AppText variant="bodyMd" weight="bold" style={{ color }}>{p.amount}</AppText>
                <AppText variant="caption" color="muted">{p.date}</AppText>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ─── Meters Section ───────────────────────────────────────────────────────────

function MetersSection({ meters }: { meters: ContractMeterMock[] }) {
  if (meters.length === 0) {
    return (
      <View style={sec.wrap}>
        <SectionHeader title="מונים" count={0} />
        <AppText variant="bodySm" color="muted">לא תועדו מונים לחוזה זה</AppText>
      </View>
    );
  }

  const kindColor: Record<ContractMeterMock['kind'], string> = {
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
                <AppText variant="bodyMd" weight="bold">{m.value}</AppText>
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

function FilesSection({ files }: { files: ContractFileMock[] }) {
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
            {f.type === 'image' && f.previewUri ? (
              <Image
                source={{ uri: f.previewUri }}
                style={sec.fileThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[sec.fileThumb, sec.filePdfThumb]}>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={36}
                  color={Colors.error}
                />
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
  fileInfo: {
    padding: Spacing.sm,
    gap: 2,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ContractDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = getContractDetailMock(id ?? '');

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
    Alert.alert('מחיקת חוזה', 'האם למחוק את החוזה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => router.back() },
    ]);
  }, []);

  if (!detail) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="חוזה" showBack />
        <View style={styles.emptyWrap}>
          <AppText variant="bodyMd" color="variant" align="center">
            לא נמצא חוזה
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
    { label: 'תאריך הסכם', value: detail.agreementDate },
    { label: 'תוקף', value: detail.endDate ?? '—' },
    { label: 'שכירות / סכום', value: detail.monthlyAmount ?? '—' },
    { label: 'ת.ז / ח.פ', value: detail.idNumber ?? '—' },
    { label: 'טלפון', value: detail.phone ?? '—' },
    { label: 'אימייל', value: detail.email ?? '—' },
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
        <PaymentsSection payments={detail.payments} />

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
