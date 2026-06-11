import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { DocumentUploadForm } from '@/components/modules/documents/DocumentUploadForm';
import { getDocument, documentToListRow } from '@/lib/api/documents';
import type { DocumentListRow } from '@/lib/mocks/documents';
import { Colors, Spacing, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentListRow | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getDocument(String(id ?? ''))
        .then((document) => {
          if (active) setDoc(documentToListRow(document));
        })
        .catch(() => {
          if (active) setDoc(null);
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
      <View style={styles.notFound}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!doc) {
    return (
      <View style={styles.notFound}>
        <AppText variant="bodyMd" align="center" color="variant">
          לא נמצא מסמך
        </AppText>
      </View>
    );
  }

  return <DocumentUploadForm initialData={doc} editId={doc.id} />;
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.xl,
  },
});
