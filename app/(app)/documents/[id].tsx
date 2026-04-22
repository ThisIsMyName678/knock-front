import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getDocumentDetailMock,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ACCESS_LABELS,
  removeDocumentFromSnapshot,
} from '@/lib/mocks/documents';
import { MOCK_TASKS_LIST } from '@/lib/mocks/tasks';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

function fileKindLabel(k: string) {
  if (k === 'pdf') return 'PDF';
  if (k === 'image') return 'תמונה';
  return 'אחר';
}

export default function DocumentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = useMemo(() => getDocumentDetailMock(String(id ?? '')), [id]);

  const taskTitle = doc?.linkedTaskId ? MOCK_TASKS_LIST.find((t) => t.id === doc.linkedTaskId)?.title : null;

  if (!doc) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            מסמך
          </AppText>
          <View style={styles.iconBtn} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING }}>
          <AppText variant="bodyMd" align="center" color="variant">
            לא נמצא מסמך
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} fullWidth style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const onShare = () => {
    Share.share({ message: doc.displayName, title: 'שיתוף מסמך' }).catch(() => {});
  };

  const onDownload = () => {
    Share.share({
      message: `הורדה (דמה)\n${doc.displayName}\nhttps://files.example.mock/${doc.id}`,
      title: doc.displayName,
    }).catch(() => {});
  };

  const onDelete = () => {
    Alert.alert('מחיקה', 'להסיר את המסמך מהרשימה המקומית?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          removeDocumentFromSnapshot(doc.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          מסמך
        </AppText>
        <Pressable onPress={onShare} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="שיתוף">
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <View style={styles.previewBox}>
          <MaterialCommunityIcons
            name={doc.fileKind === 'pdf' ? 'file-pdf-box' : doc.fileKind === 'image' ? 'file-image-outline' : 'file-document-outline'}
            size={56}
            color={doc.fileKind === 'pdf' ? Colors.error : Colors.primary}
          />
          <AppText variant="headingSm" weight="bold" align="center" numberOfLines={3}>
            {doc.displayName}
          </AppText>
          <AppText variant="bodySm" color="muted" align="center">
            {doc.sizeLabel} · {fileKindLabel(doc.fileKind)}
          </AppText>
          <View style={{ marginTop: Spacing.sm, flexDirection: 'row-reverse', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge label={DOCUMENT_TYPE_LABELS[doc.documentType]} preset="primary" />
            <Badge label={DOCUMENT_ACCESS_LABELS[doc.accessLevel]} preset="neutral" />
          </View>
        </View>

        <Card>
          {[
            { label: 'שיוך', value: `${doc.linkKind === 'asset' ? 'נכס' : 'פרויקט'}: ${doc.linkLabel}` },
            { label: 'תאריך העלאה', value: doc.uploadedAt },
            { label: 'הועלה על ידי', value: doc.uploadedBy },
          ].map((f, i, arr) => (
            <View key={f.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">
                {f.label}
              </AppText>
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                {f.value}
              </AppText>
            </View>
          ))}
          {taskTitle ? (
            <View style={[styles.row, styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">
                משימה מקושרת
              </AppText>
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                {taskTitle}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Button label="הורדה (דמה)" onPress={onDownload} fullWidth variant="secondary" size="lg" />
        <Button label="שיתוף" onPress={onShare} fullWidth variant="secondary" size="lg" />
        <Button label="מחק מהרשימה" onPress={onDelete} fullWidth variant="danger" size="lg" />
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
  previewBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
