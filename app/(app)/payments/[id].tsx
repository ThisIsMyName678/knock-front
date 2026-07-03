import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  PAYMENT_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
  type PaymentDetailMock,
} from '@/lib/mocks/payments';
import { getPayment, deletePayment, paymentToDetail } from '@/lib/api/payments';
import { formatDigitRunsInText, formatIlsInteger } from '@/lib/format/currency';
import { Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING, MIN_TOUCH } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { AppHeader } from '@/components/ui/AppHeader';

export default function PaymentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<PaymentDetailMock | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getPayment(id ?? '')
        .then((payment) => {
          if (active) setDetail(paymentToDetail(payment));
        })
        .catch(() => {
          if (active) setDetail(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id]),
  );

  const onDownload = useCallback(() => {
    Alert.alert('הורדה', 'במימוש אמיתי יורד קובץ / מסמך. כעת תצוגה בלבד.', [{ text: 'אישור' }]);
  }, []);

  const onShare = useCallback(async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `${detail.displayName}\n${PAYMENT_TYPE_LABELS[detail.paymentType]}\n₪${formatIlsInteger(detail.amount)}`,
        title: detail.displayName,
      });
    } catch {
      /* ignore */
    }
  }, [detail]);

  const onDuplicate = useCallback(() => {
    if (!detail) return;
    router.push(`/(app)/payments/new?duplicateFromId=${detail.id}`);
  }, [detail]);

  const onEdit = useCallback(() => {
    if (detail) router.push(`/(app)/payments/edit/${detail.id}`);
  }, [detail]);

  const onDelete = useCallback(() => {
    setDeleteDialogVisible(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deletePayment(id);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      setDeleting(false);
      Alert.alert('שגיאה', error instanceof Error ? error.message : 'מחיקת התשלום נכשלה, נסה שוב.');
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="תשלום" showBack />
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="תשלום" showBack />
        <View style={styles.empty}>
          <AppText variant="bodyMd" color="variant">
            לא נמצא תשלום
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const inbound = detail.direction === 'inbound';
  const amtColor = inbound ? Colors.inbound : Colors.outbound;

  const rows = [
    { label: 'שם תשלום', value: detail.displayName },
    { label: 'סוג תשלום', value: PAYMENT_TYPE_LABELS[detail.paymentType] },
    { label: 'אופן תשלום', value: PAYMENT_MODE_LABELS[detail.mode] },
    { label: 'הצמדה למדד', value: detail.indexed ? 'כן' : 'לא' },
    { label: 'שיוך', value: `${detail.linkKind === 'project' ? 'פרויקט' : 'נכס'}: ${detail.linkLabel}` },
    { label: 'מועד ביצוע', value: detail.dueDate },
    { label: 'נותר / התקדמות', value: formatDigitRunsInText(detail.progressLabel) },
    { label: 'אמצעי תשלום', value: detail.means ?? '—' },
    { label: 'שולם על ידי', value: detail.payerLabel ?? '—' },
    ...(detail.contractLabel ? [{ label: 'חוזה', value: detail.contractLabel }] : []),
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="פרטי תשלום" showBack />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <View style={styles.amountCard}>
          <View style={[styles.amtIcon, { backgroundColor: inbound ? Colors.inboundBg : Colors.outboundBg }]}>
            <MaterialCommunityIcons name={inbound ? 'arrow-down' : 'arrow-up'} size={28} color={amtColor} />
          </View>
          <AppText variant="displayMd" weight="extraBold" style={{ color: amtColor }}>
            {inbound ? '+' : '−'}₪{formatIlsInteger(detail.amount)}
          </AppText>
          <AppText variant="bodyMd" color="variant" align="center">
            {inbound ? 'הכנסה' : 'הוצאה'} — {PAYMENT_TYPE_LABELS[detail.paymentType]}
          </AppText>
          <Badge
            label={detail.status === 'cancelled' ? 'בוטל' : detail.statusBucket === 'future' ? 'עתידי' : detail.statusBucket === 'received' ? 'התקבל' : 'באיחור'}
            preset={detail.status === 'cancelled' ? 'statusCancelled' : detail.statusBucket === 'overdue' ? 'error' : detail.statusBucket === 'received' ? 'success' : 'info'}
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={onDownload} accessibilityRole="button" accessibilityLabel="הורדה">
            <MaterialCommunityIcons name="download-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              הורדה
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onShare} accessibilityRole="button">
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              שיתוף
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onDuplicate}>
            <MaterialCommunityIcons name="content-copy" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              שכפול
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onEdit}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              עריכה
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onDelete}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.error} />
            <AppText variant="caption" style={{ color: Colors.error }} weight="semiBold">
              מחיקה
            </AppText>
          </Pressable>
        </View>

        <Card>
          {rows.map((f, i) => (
            <View key={f.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">
                {f.label}
              </AppText>
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'left' }} numberOfLines={3}>
                {f.value}
              </AppText>
            </View>
          ))}
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="מחיקת תשלום"
        message={`האם למחוק את "${detail.displayName}"?\nלא ניתן לשחזר פעולה זו.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
        loading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amtIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  quickRow: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between' },
  quickBtn: {
    width: '18%',
    minWidth: 56,
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
