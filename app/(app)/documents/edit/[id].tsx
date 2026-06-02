import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { DocumentUploadForm } from '@/components/modules/documents/DocumentUploadForm';
import { getDocumentDetailMock } from '@/lib/mocks/documents';
import { Colors, Spacing, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = useMemo(() => getDocumentDetailMock(String(id ?? '')), [id]);

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
