import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MOCK_ENTITY_LINKS, entitySearchText, type EntityLinkOption } from '@/lib/mocks/contracts';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ACCESS_LABELS,
  DOCUMENT_UPLOAD_TYPE_ORDER,
  queueNewDocument,
  tasksForEntityLinkId,
  type DocumentType,
  type DocumentAccessLevel,
  type DocumentListRow,
  type DocumentFileKind,
} from '@/lib/mocks/documents';
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

function filterEntities(query: string): EntityLinkOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_ENTITY_LINKS;
  return MOCK_ENTITY_LINKS.filter((e) => entitySearchText(e).includes(q));
}

function formatTodayDdMmYyyy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function randomDocId() {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function DocumentUploadForm({ initialData }: { initialData?: DocumentListRow } = {}) {
  const insets = useSafeAreaInsets();
  const [fileName, setFileName] = useState(() => initialData?.displayName ?? '');
  const [documentType, setDocumentType] = useState<DocumentType>(() => initialData?.documentType ?? 'other');
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>(() => initialData?.accessLevel ?? 'owner_only');
  const [linkQuery, setLinkQuery] = useState(() => initialData?.linkLabel ?? '');
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(() =>
    initialData ? (MOCK_ENTITY_LINKS.find((e) => e.id === initialData.linkId) ?? null) : null,
  );
  const [showSuggest, setShowSuggest] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(() => initialData?.linkedTaskId ?? null);
  const [fileKind, setFileKind] = useState<DocumentFileKind>(() => initialData?.fileKind ?? 'other');

  const entities = useMemo(() => filterEntities(linkQuery), [linkQuery]);
  const taskOptions = useMemo(() => (linkSelected ? tasksForEntityLinkId(linkSelected.id) : []), [linkSelected]);

  const pickMock = (kind: 'file' | 'image' | 'camera') => {
    const suggested =
      kind === 'image' || kind === 'camera'
        ? `תמונה_${formatTodayDdMmYyyy().replace(/\//g, '-')}.jpg`
        : `מסמך_${formatTodayDdMmYyyy().replace(/\//g, '-')}.pdf`;
    Alert.alert(
      kind === 'camera' ? 'מצלמה' : kind === 'image' ? 'בחירת תמונה' : 'בחירת קובץ',
      'בגרסת mock אין גישה אמיתית לקבצים. יוצע שם לדוגמה.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'השתמש בשם לדוגמה',
          onPress: () => {
            setFileName((prev) => prev || suggested);
            setFileKind(kind === 'file' ? 'pdf' : 'image');
          },
        },
      ],
    );
  };

  const buildRow = (): DocumentListRow => {
    const usePlaceholder = !linkSelected;
    return {
      id: randomDocId(),
      displayName: fileName.trim(),
      documentType,
      linkKind: linkSelected?.kind ?? 'asset',
      linkId: linkSelected?.id ?? '',
      linkLabel: usePlaceholder ? 'ללא שיוך' : linkSelected!.name,
      uploadedAt: formatTodayDdMmYyyy(),
      accessLevel,
      linkedTaskId: linkedTaskId ?? undefined,
      fileKind,
      sizeLabel: '—',
      uploadedBy: 'אני',
    };
  };

  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => ({
    fileName: fileName.trim().length === 0 ? 'שדה חובה' : '',
  }), [fileName]);

  const onSave = () => {
    setSubmitted(true);
    if (errors.fileName) return;
    queueNewDocument(buildRow());
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title={initialData ? 'עריכת מסמך' : 'העלאת מסמך'} showBack />

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.pickRow}>
            <Pressable onPress={() => pickMock('file')} style={styles.pickBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="file-upload-outline" size={26} color={Colors.primary} />
              <AppText variant="caption" weight="semiBold" align="center">
                קובץ
              </AppText>
            </Pressable>
            <Pressable onPress={() => pickMock('image')} style={styles.pickBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="image-outline" size={26} color={Colors.primary} />
              <AppText variant="caption" weight="semiBold" align="center">
                תמונה
              </AppText>
            </Pressable>
            <Pressable onPress={() => pickMock('camera')} style={styles.pickBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="camera-outline" size={26} color={Colors.primary} />
              <AppText variant="caption" weight="semiBold" align="center">
                מצלמה
              </AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Input label="שם הקובץ" required placeholder="לדוגמה: חוזה שכירות" value={fileName} onChangeText={setFileName} error={submitted ? errors.fileName : ''} containerStyle={{ marginBottom: Spacing.md }} />

            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
              סוג מסמך
            </AppText>
            <View style={styles.typeGrid}>
              {DOCUMENT_UPLOAD_TYPE_ORDER.map((t) => (
                <Pressable key={t} onPress={() => setDocumentType(t)} style={[styles.typeChip, documentType === t && styles.typeChipActive]}>
                  <AppText variant="caption" numberOfLines={2} weight={documentType === t ? 'bold' : 'regular'} style={{ color: documentType === t ? Colors.onPrimary : Colors.onSurfaceVariant, textAlign: 'center' }}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              שיוך נכס / פרויקט (לא חובה)
            </AppText>
            <TextInput
              style={styles.entityInput}
              placeholder="חיפוש..."
              placeholderTextColor={Colors.onSurfaceMuted}
              value={linkQuery}
              onChangeText={(t) => {
                setLinkQuery(t);
                setShowSuggest(t.trim().length > 0);
                if (!t) {
                  setLinkSelected(null);
                  setLinkedTaskId(null);
                }
              }}
              textAlign="right"
            />
            {linkSelected && (
              <View style={styles.selectedPill}>
                <AppText variant="bodySm" style={{ flex: 1 }}>
                  {linkSelected.name} — {linkSelected.address}
                </AppText>
                <Pressable
                  onPress={() => {
                    setLinkSelected(null);
                    setLinkQuery('');
                    setLinkedTaskId(null);
                  }}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={Colors.onSurfaceMuted} />
                </Pressable>
              </View>
            )}
            {showSuggest && !linkSelected && entities.length > 0 && (
              <View style={styles.suggestBox}>
                {entities.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      setLinkSelected(e);
                      setLinkQuery(`${e.name}, ${e.address}`);
                      setShowSuggest(false);
                      setLinkedTaskId(null);
                    }}
                    style={styles.suggestRow}
                  >
                    <AppText variant="bodySm">{e.name}</AppText>
                  </Pressable>
                ))}
              </View>
            )}

            {linkSelected ? (
              <View style={{ marginTop: Spacing.md }}>
                <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
                  שיוך למשימה (לא חובה)
                </AppText>
                <Pressable onPress={() => setTaskModal(true)} style={styles.dropdown}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
                  <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
                    {linkedTaskId ? taskOptions.find((t) => t.id === linkedTaskId)?.title ?? '—' : 'בחר משימה'}
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              הרשאות גישה
            </AppText>
            <View style={styles.accessRow}>
              {(['owner_only', 'tenant', 'employee', 'public'] as DocumentAccessLevel[]).map((a) => (
                <Pressable key={a} onPress={() => setAccessLevel(a)} style={[styles.accessChip, accessLevel === a && styles.accessChipActive]}>
                  <AppText variant="caption" numberOfLines={2} weight={accessLevel === a ? 'bold' : 'regular'} style={{ color: accessLevel === a ? Colors.onPrimary : Colors.onSurfaceVariant, textAlign: 'center' }}>
                    {DOCUMENT_ACCESS_LABELS[a]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <Button label="שמור והעלה" onPress={onSave} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />
        </ScrollView>

        <Modal visible={taskModal} transparent animationType="slide" onRequestClose={() => setTaskModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTaskModal(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
                בחירת משימה
              </AppText>
              {taskOptions.length === 0 ? (
                <AppText variant="bodySm" color="variant" style={{ textAlign: 'right', marginBottom: Spacing.md }}>
                  אין משימות לישות זו ב-mock
                </AppText>
              ) : (
                taskOptions.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      setLinkedTaskId(t.id);
                      setTaskModal(false);
                    }}
                    style={styles.taskRow}
                  >
                    <AppText variant="bodyMd" weight="semiBold" numberOfLines={2} style={{ textAlign: 'right' }}>
                      {t.title}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {t.dueDate}
                    </AppText>
                  </Pressable>
                ))
              )}
              <Button label="ללא שיוך משימה" variant="secondary" onPress={() => { setLinkedTaskId(null); setTaskModal(false); }} fullWidth style={{ marginTop: Spacing.md }} />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  pickRow: { flexDirection: RTL_ROW, gap: Spacing.md, marginBottom: Spacing.md },
  pickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.sm, color: Colors.onBackground },
  typeGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs },
  typeChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    width: '31%',
    minHeight: 44,
    justifyContent: 'center',
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  entityInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    backgroundColor: Colors.surfaceVariant,
  },
  selectedPill: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  suggestBox: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, marginTop: 4, overflow: 'hidden' },
  suggestRow: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, backgroundColor: Colors.surface },
  dropdown: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
  accessRow: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  accessChip: {
    flexBasis: '48%',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  accessChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
    maxHeight: '70%',
  },
  taskRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    alignItems: 'flex-end',
    gap: 4,
  },
});
