import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { ContractCreateWizard } from '@/components/modules/contracts/ContractCreateWizard';
import { getContractDetailMock } from '@/lib/mocks/contracts';
import { Colors, CONTENT_HORIZONTAL_PADDING, Spacing } from '@/constants/tokens';

export default function ContractEditScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const initialData = getContractDetailMock(id ?? '');

  if (!initialData) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="עריכת חוזה" showBack />
        <View style={styles.empty}>
          <AppText variant="bodyMd" color="variant" align="center">
            לא נמצא חוזה לעריכה
          </AppText>
        </View>
      </View>
    );
  }

  return <ContractCreateWizard initialData={initialData} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.lg },
});
