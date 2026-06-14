import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { ContactCreateForm } from '@/components/modules/contacts/ContactCreateForm';
import { getContact } from '@/lib/api/contacts';
import { contactDetailToRow } from '@/lib/adapters/contact-permissions';
import type { ContactListRow } from '@/lib/mocks/contacts';
import { Colors, CONTENT_HORIZONTAL_PADDING, Spacing } from '@/constants/tokens';

export default function ContactEditScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [initialData, setInitialData] = useState<ContactListRow | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getContact(String(id ?? ''))
        .then((detail) => {
          if (!active) return;
          setInitialData(contactDetailToRow(detail));
        })
        .catch((error) => {
          if (!active) return;
          console.warn(error instanceof Error ? error.message : 'Failed to load contact');
          setInitialData(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id]),
  );

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="עריכת איש קשר" showBack />
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!initialData) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="עריכת איש קשר" showBack />
        <View style={styles.empty}>
          <AppText variant="bodyMd" color="variant" align="center">
            לא נמצא איש קשר לעריכה
          </AppText>
        </View>
      </View>
    );
  }

  return <ContactCreateForm initialData={initialData} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.lg },
});
