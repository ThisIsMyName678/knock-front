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

export default function PaymentEditScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [initialData, setInitialData] = useState<PaymentDetailMock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPayment(id ?? '')
      .then((payment) => {
        if (active) setInitialData(paymentToDetail(payment));
      })
      .catch(() => {
        if (active) setInitialData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="עריכת תשלום" showBack />
        <View style={styles.empty}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!initialData) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="עריכת תשלום" showBack />
        <View style={styles.empty}>
          <AppText variant="bodyMd" color="variant" align="center">
            לא נמצא תשלום לעריכה
          </AppText>
        </View>
      </View>
    );
  }

  return <PaymentCreateForm initialData={initialData} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.lg },
});
