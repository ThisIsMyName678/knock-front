import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share, Alert } from 'react-native';
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
  getContractDetailMock,
} from '@/lib/mocks/contracts';
import { Colors, Spacing, Shadow, Radius, CONTENT_HORIZONTAL_PADDING, MIN_TOUCH } from '@/constants/tokens';

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
    Alert.alert('עריכה', 'מסך עריכה יתחבר ל-API בהמשך.', [{ text: 'אישור' }]);
  }, []);

  const onDelete = useCallback(() => {
    Alert.alert('מחיקת חוזה', 'האם למחוק את החוזה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => router.back() },
    ]);
  }, []);

  if (!detail) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            חוזה
          </AppText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <AppText variant="bodyMd" color="variant" align="center">
            לא נמצא חוזה
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const statusPreset = detail.status === 'active' ? 'success' : detail.status === 'expired' ? 'neutral' : 'warning';

  const rows: { label: string; value: string }[] = [
    { label: 'שם החוזה', value: detail.contractName },
    { label: 'סוג חוזה', value: CONTRACT_TYPE_LABELS[detail.contractType] },
    ...(detail.accessLevel
      ? [{ label: 'הרשאות גישה', value: CONTRACT_ACCESS_LABELS[detail.accessLevel] }]
      : []),
    { label: 'שיוך', value: `${detail.linkKind === 'project' ? 'פרויקט' : 'נכס'}: ${detail.linkLabel}` },
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          פרטי חוזה
        </AppText>
        <Pressable onPress={onEdit} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="עריכה">
          <MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
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

        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={onShare} accessibilityRole="button" accessibilityLabel="שיתוף">
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              שיתוף
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onDuplicate} accessibilityRole="button" accessibilityLabel="שכפול">
            <MaterialCommunityIcons name="content-copy" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              שכפול
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onEdit} accessibilityRole="button" accessibilityLabel="עריכה">
            <MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.primary} />
            <AppText variant="caption" color="primary" weight="semiBold">
              עריכה
            </AppText>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={onDelete} accessibilityRole="button" accessibilityLabel="מחיקה">
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

        <Button label="צפה בחוזה המלא" onPress={() => Alert.alert('בקרוב', 'צפייה במסמך PDF')} fullWidth variant="secondary" size="lg" />
        <Button label="חוזה חדש" onPress={() => router.push('/(app)/contracts/new')} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />
      </ScrollView>
    </View>
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
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  contractHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  iconBig: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row-reverse',
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
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
