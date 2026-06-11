import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ACCESS_LABELS,
  type DocumentListRow,
} from '@/lib/mocks/documents';
import { getDocument, deleteDocument, documentToListRow } from '@/lib/api/documents';
import { MOCK_TASKS_LIST } from '@/lib/mocks/tasks';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  FontFamily,
  FontSize,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

// ─── Mock PDF Preview ─────────────────────────────────────────────────────────

function PdfPreview({ name }: { name: string }) {
  const lines = [
    { width: '90%', height: 14 },
    { width: '75%', height: 10 },
    { width: '85%', height: 10 },
    { width: '60%', height: 10 },
    { width: '0%',  height: 12 }, // gap
    { width: '80%', height: 10 },
    { width: '88%', height: 10 },
    { width: '70%', height: 10 },
    { width: '65%', height: 10 },
    { width: '0%',  height: 12 },
    { width: '55%', height: 10 },
    { width: '82%', height: 10 },
    { width: '72%', height: 10 },
    { width: '40%', height: 10 },
    { width: '0%',  height: 16 },
    { width: '78%', height: 10 },
    { width: '91%', height: 10 },
    { width: '66%', height: 10 },
    { width: '50%', height: 10 },
  ] as const;

  return (
    <View style={preview.pdfPage}>
      {/* Page header */}
      <View style={preview.pdfHeader}>
        <MaterialCommunityIcons name="file-pdf-box" size={18} color={Colors.error} />
        <AppText variant="caption" style={{ flex: 1, textAlign: 'right', color: Colors.onSurfaceMuted }} numberOfLines={1}>
          {name}
        </AppText>
      </View>
      <View style={preview.pdfDivider} />

      {/* Mock title block */}
      <View style={[preview.pdfLine, { width: '60%', height: 16, alignSelf: 'center', marginBottom: 10, marginTop: 4, borderRadius: 3 }]} />
      <View style={[preview.pdfLine, { width: '40%', height: 10, alignSelf: 'center', marginBottom: 16, borderRadius: 3 }]} />

      {/* Mock text lines */}
      {lines.map((line, i) =>
        line.width === '0%' ? (
          <View key={i} style={{ height: line.height }} />
        ) : (
          <View
            key={i}
            style={[preview.pdfLine, { width: line.width as `${string}%`, height: line.height, marginBottom: 5, borderRadius: 2 }]}
          />
        ),
      )}

      {/* Page footer */}
      <View style={preview.pdfFooter}>
        <AppText variant="caption" color="muted">עמוד 1 מתוך 3</AppText>
      </View>
    </View>
  );
}

// ─── Mock Image Preview ───────────────────────────────────────────────────────

function ImagePreview({ name }: { name: string }) {
  return (
    <View style={preview.imageBox}>
      <View style={preview.imageInner}>
        <MaterialCommunityIcons name="image-outline" size={52} color="rgba(255,255,255,0.55)" />
        <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: Spacing.sm }} numberOfLines={2}>
          {name}
        </AppText>
      </View>
      {/* Simulated image grid overlay */}
      <View style={preview.imageGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[preview.imageCell, { opacity: 0.07 + (i % 3) * 0.04 }]} />
        ))}
      </View>
    </View>
  );
}

const preview = StyleSheet.create({
  // PDF
  pdfPage: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.sm,
  },
  pdfHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pdfDivider: {
    height: 1,
    backgroundColor: Colors.outlineLight,
    marginBottom: Spacing.md,
  },
  pdfLine: {
    backgroundColor: '#e8e8e8',
  },
  pdfFooter: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    paddingTop: Spacing.sm,
    alignItems: 'center',
  },

  // Image
  imageBox: {
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#4a6fa5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInner: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  imageGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 1,
  },
  imageCell: {
    width: '33.33%',
    height: '50%',
    backgroundColor: '#fff',
  },
});

// ─── Actions Dropdown Menu ────────────────────────────────────────────────────

type ActionItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color?: string;
  onPress: () => void;
};

function ActionsDropdown({
  visible,
  onClose,
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  actions: ActionItem[];
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={dropdown.overlay} />
      </TouchableWithoutFeedback>
      <View style={dropdown.sheet}>
        <View style={dropdown.handle} />
        <AppText variant="labelMd" weight="semiBold" color="muted" style={dropdown.title}>
          פעולות
        </AppText>
        {actions.map((action, i) => (
          <Pressable
            key={action.key}
            onPress={() => { onClose(); setTimeout(action.onPress, 150); }}
            style={({ pressed }) => [
              dropdown.row,
              i < actions.length - 1 && dropdown.rowBorder,
              pressed && { backgroundColor: Colors.surfaceVariant },
            ]}
            accessibilityRole="button"
          >
            <AppText
              variant="bodyMd"
              weight="semiBold"
              style={{ flex: 1, textAlign: 'right', color: action.color ?? Colors.onBackground }}
            >
              {action.label}
            </AppText>
            <MaterialCommunityIcons
              name={action.icon}
              size={20}
              color={action.color ?? Colors.onSurfaceVariant}
            />
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const dropdown = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing['2xl'],
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

function fileKindLabel(k: string) {
  if (k === 'pdf') return 'PDF';
  if (k === 'image') return 'תמונה';
  return 'אחר';
}

export default function DocumentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentListRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const taskTitle = doc?.linkedTaskId ? MOCK_TASKS_LIST.find((t) => t.id === doc.linkedTaskId)?.title : null;

  const onShare = useCallback(() => {
    Share.share({ message: doc?.displayName ?? '', title: 'שיתוף מסמך' }).catch(() => {});
  }, [doc]);

  const onDownload = useCallback(() => {
    Share.share({
      message: `הורדה (דמה)\n${doc?.displayName ?? ''}\nhttps://files.example.mock/${doc?.id ?? ''}`,
      title: doc?.displayName ?? '',
    }).catch(() => {});
  }, [doc]);

  const onDelete = useCallback(() => {
    if (!doc) return;
    Alert.alert('מחיקה', 'למחוק את המסמך?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          deleteDocument(doc.id)
            .then(() => router.back())
            .catch((error) => console.warn(error instanceof Error ? error.message : 'Failed to delete document'));
        },
      },
    ]);
  }, [doc]);

  const onDuplicate = useCallback(() => {
    Alert.alert('שכפול', 'ייווצר עותק של המסמך בהמשך.', [{ text: 'אישור' }]);
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="מסמך" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!doc) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="מסמך" showBack />
        <View style={{ flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING }}>
          <AppText variant="bodyMd" align="center" color="variant">
            לא נמצא מסמך
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} fullWidth style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const actions: ActionItem[] = [
    { key: 'edit',      label: 'עריכת פרטים',  icon: 'pencil-outline',      onPress: () => router.push(`/(app)/documents/edit/${doc.id}`) },
    { key: 'download',  label: 'הורדה',         icon: 'download-outline',    onPress: onDownload },
    { key: 'duplicate', label: 'שכפול',         icon: 'content-copy',        onPress: onDuplicate },
    { key: 'share',     label: 'שיתוף',         icon: 'share-variant-outline', onPress: onShare },
    { key: 'delete',    label: 'מחיקה',         icon: 'delete-outline',      color: Colors.error, onPress: onDelete },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="מסמך" showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Document info row ── */}
        <View style={styles.infoRow}>
          <View style={[styles.fileIconWrap, { backgroundColor: doc.fileKind === 'pdf' ? Colors.errorContainer : Colors.infoContainer }]}>
            <MaterialCommunityIcons
              name={doc.fileKind === 'pdf' ? 'file-pdf-box' : doc.fileKind === 'image' ? 'file-image-outline' : 'file-document-outline'}
              size={32}
              color={doc.fileKind === 'pdf' ? Colors.error : Colors.info}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMd" weight="bold" style={{ textAlign: 'right' }} numberOfLines={2}>
              {doc.displayName}
            </AppText>
            <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
              {doc.sizeLabel} · {fileKindLabel(doc.fileKind)}
            </AppText>
            <View style={{ flexDirection: RTL_ROW, gap: Spacing.xs, marginTop: 4 }}>
              <Badge label={DOCUMENT_TYPE_LABELS[doc.documentType]} preset="primary" />
              <Badge label={DOCUMENT_ACCESS_LABELS[doc.accessLevel]} preset="neutral" />
            </View>
          </View>

          {/* Single actions button */}
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.actionsBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="פעולות"
          >
            <MaterialCommunityIcons name="dots-vertical" size={22} color={Colors.onBackground} />
          </Pressable>
        </View>

        {/* ── Mock preview panel ── */}
        <View style={styles.previewSection}>
          <AppText variant="labelMd" weight="semiBold" color="muted" style={styles.previewLabel}>
            תצוגה מקדימה
          </AppText>
          {doc.fileKind === 'pdf' ? (
            <PdfPreview name={doc.displayName} />
          ) : (
            <ImagePreview name={doc.displayName} />
          )}
          <Pressable
            onPress={onDownload}
            style={({ pressed }) => [styles.openFullBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="open-in-new" size={15} color={Colors.primary} />
            <AppText variant="labelMd" color="primary" weight="semiBold">
              פתיחה מלאה
            </AppText>
          </Pressable>
        </View>

        {/* ── Details card ── */}
        <Card>
          {[
            { label: 'שיוך', value: `${doc.linkKind === 'asset' ? 'נכס' : 'פרויקט'}: ${doc.linkLabel}` },
            { label: 'תאריך העלאה', value: doc.uploadedAt },
            { label: 'הועלה על ידי', value: doc.uploadedBy },
          ].map((f, i, arr) => (
            <View key={f.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">{f.label}</AppText>
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                {f.value}
              </AppText>
            </View>
          ))}
          {taskTitle ? (
            <View style={[styles.row, styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">משימה מקושרת</AppText>
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                {taskTitle}
              </AppText>
            </View>
          ) : null}
        </Card>
      </ScrollView>

      {/* ── Actions dropdown ── */}
      <ActionsDropdown
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        actions={actions}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },

  // Info row
  infoRow: {
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
  },
  fileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },

  // Preview
  previewSection: {
    gap: Spacing.sm,
  },
  previewLabel: {
    textAlign: 'right',
  },
  openFullBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },

  // Details
  row: {
    flexDirection: RTL_ROW,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
