import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { PaymentCreateForm } from '@/components/modules/payments/PaymentCreateForm';
import { getPayment, paymentToDetail } from '@/lib/api/payments';
import type { PaymentDetailMock } from '@/lib/mocks/payments';
import { Colors, CONTENT_HORIZONTAL_PADDING, Spacing } from '@/constants/tokens';

export default function NewPaymentScreen() {
  const insets = useSafeAreaInsets();
  const { preloadLinkId, preloadLinkLabel, preloadLinkKind, preloadLinkAddress, preloadContractId, preloadContractName, duplicateFromId } =
    useLocalSearchParams<{
      preloadLinkId?: string;
      preloadLinkLabel?: string;
      preloadLinkKind?: string;
      preloadLinkAddress?: string;
      preloadContractId?: string;
      preloadContractName?: string;
      duplicateFromId?: string;
    }>();

  const [duplicateData, setDuplicateData] = useState<PaymentDetailMock | null>(null);
  const [loading, setLoading] = useState(Boolean(duplicateFromId));

  useEffect(() => {
    if (!duplicateFromId) return;
    let active = true;
    setLoading(true);
    getPayment(duplicateFromId)
      .then((payment) => {
        if (active) setDuplicateData(paymentToDetail(payment));
      })
      .catch(() => {
        if (active) setDuplicateData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [duplicateFromId]);

  const preloadedLink =
    preloadLinkId && preloadLinkLabel
      ? {
          id: preloadLinkId,
          name: preloadLinkLabel,
          address: preloadLinkAddress ?? '',
          kind: (preloadLinkKind ?? 'asset') as 'asset' | 'project',
        }
      : undefined;

  if (duplicateFromId && loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="יצירת תשלום" showBack />
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (duplicateFromId && !duplicateData) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="יצירת תשלום" showBack />
        <View style={styles.empty}>
          <AppText variant="bodyMd" color="variant" align="center">
            לא נמצא תשלום לשכפול
          </AppText>
        </View>
      </View>
    );
  }

  if (duplicateData) {
    return (
      <PaymentCreateForm
        initialData={{ ...duplicateData, id: '', displayName: `עותק של ${duplicateData.displayName}` }}
      />
    );
  }

  return (
    <PaymentCreateForm
      preloadedLink={preloadedLink}
      preloadedContractId={preloadContractId}
      preloadedContractName={preloadContractName}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.lg },
});
