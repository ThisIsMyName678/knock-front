import React, { useState, useMemo, useEffect } from 'react';
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
import { searchEntityLinks, type EntityLinkOption } from '@/lib/api/entity-links';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ACCESS_LABELS,
  DOCUMENT_UPLOAD_TYPE_ORDER,
  tasksForEntityLinkId,
  type DocumentType,
  type DocumentAccessLevel,
  type DocumentListRow,
  type DocumentFileKind,
} from '@/lib/mocks/documents';
import {
  createDocument,
  updateDocument,
  clientDocumentTypeToBackend,
  clientAccessLevelToBackend,
  clientLinkKindToBackend,
} from '@/lib/api/documents';
import { BackendApiError } from '@/lib/backend';
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

function formatTodayDdMmYyyy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

type PreloadedLink = { id: string; name: string; address: string; kind: 'asset' | 'project' };

export function DocumentUploadForm({ initialData, editId, preloadedLink }: { initialData?: DocumentListRow; editId?: string; preloadedLink?: PreloadedLink } = {}) {
  const insets = useSafeAreaInsets();
  const [fileName, setFileName] = useState(() => initialData?.displayName ?? '');
  const [documentType, setDocumentType] = useState<DocumentType>(() => initialData?.documentType ?? 'other');
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>(() => initialData?.accessLevel ?? 'owner_only');
  const [linkQuery, setLinkQuery] = useState(() => {
    if (preloadedLink) return `${preloadedLink.name}${preloadedLink.address ? ', ' + preloadedLink.address : ''}`;
    return initialData?.linkLabel ?? '';
  });
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(() => {
    if (preloadedLink) {
      return { id: preloadedLink.id, name: preloadedLink.name, address: preloadedLink.address, kind: preloadedLink.kind };
    }
    if (initialData) {
      return { id: initialData.linkId, name: initialData.linkLabel, address: '', kind: initialData.linkKind };
    }
    return null;
  });
  const [showSuggest, setShowSuggest] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [pickSourceOpen, setPickSourceOpen] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(() => initialData?.linkedTaskId ?? null);
  const [fileKind, setFileKind] = useState<DocumentFileKind>(() => initialData?.fileKind ?? 'other');

  const [entities, setEntities] = useState<EntityLinkOption[]>([]);
  useEffect(() => {
    if (!linkQuery.trim()) { setEntities([]); return; }
    const t = setTimeout(() => {
      searchEntityLinks(linkQuery).then(setEntities).catch(() => setEntities([]));
    }, 250);
    return () => clearTimeout(t);
  }, [linkQuery]);
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

  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const errors = useMemo(() => ({
    fileName: fileName.trim().length === 0 ? 'שדה חובה' : '',
    linkSelected: !linkSelected ? 'יש לבחור נכס או פרויקט' : '',
  }), [fileName, linkSelected]);

  const hasErrors = Object.values(errors).some(Boolean);

  const onSave = async () => {
    setSubmitted(true);
    if (hasErrors || !linkSelected) return;

    const linkScope = clientLinkKindToBackend(linkSelected.kind);
    const projectId = linkSelected.kind === 'project' ? linkSelected.id : null;
    const propertyId = linkSelected.kind === 'asset' ? linkSelected.id : null;

    setIsSaving(true);
    try {
      if (editId) {
        await updateDocument(editId, {
          displayName: fileName.trim(),
          documentType: clientDocumentTypeToBackend(documentType),
          accessLevel: clientAccessLevelToBackend(accessLevel),
          linkScope,
          projectId,
          propertyId,
          linkedTaskId: linkedTaskId ?? null,
        });
      } else {
        await createDocument({
          displayName: fileName.trim(),
          documentType: clientDocumentTypeToBackend(documentType),
          linkScope,
          projectId,
          propertyId,
          accessLevel: clientAccessLevelToBackend(accessLevel),
          linkedTaskId: linkedTaskId ?? null,
          fileType: fileKind,
        });
      }
    } catch (error) {
      setIsSaving(false);
      const message = error instanceof BackendApiError ? error.message : 'שמירת המסמך נכשלה';
      Alert.alert('שגיאה', message);
      return;
    }
    setIsSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title={editId ? 'עריכת מסמך' : (initialData ? 'עריכת מסמך' : 'העלאת מסמך')} showBack />

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => setPickSourceOpen(true)}
            style={({ pressed }) => [styles.pickTrigger, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="פעולות מהירות — בחירת מקור קובץ"
          >
            <View style={styles.pickTriggerIconWrap}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySm" weight="semiBold">
                פעולות מהירות
              </AppText>
              <AppText variant="caption" color="muted">
                בחר קובץ, תמונה או מצלמה
              </AppText>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={22} color={Colors.onSurfaceMuted} />
          </Pressable>

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
              שיוך נכס / פרויקט
            </AppText>
            <TextInput
              style={[styles.entityInput, submitted && errors.linkSelected ? { borderColor: Colors.error } : undefined]}
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
            {submitted && errors.linkSelected ? (
              <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: 2 }}>
                {errors.linkSelected}
              </AppText>
            ) : null}
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

          <Button label={editId ? 'שמור שינויים' : 'שמור והעלה'} onPress={onSave} loading={isSaving} disabled={isSaving} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />
        </ScrollView>

        <Modal visible={pickSourceOpen} transparent animationType="slide" onRequestClose={() => setPickSourceOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickSourceOpen(false)}>
            <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickSheetHandle} />
              <AppText variant="labelMd" weight="bold" style={styles.pickSheetTitle}>
                בחירת מקור
              </AppText>
              {(
                [
                  { kind: 'file' as const, icon: 'file-upload-outline' as const, label: 'קובץ מהמכשיר', hint: 'PDF או מסמך' },
                  { kind: 'image' as const, icon: 'image-outline' as const, label: 'תמונה מהגלריה', hint: 'בחירת תמונה' },
                  { kind: 'camera' as const, icon: 'camera-outline' as const, label: 'מצלמה', hint: 'צילום חדש' },
                ] as const
              ).map((opt, i) => (
                <Pressable
                  key={opt.kind}
                  onPress={() => {
                    pickMock(opt.kind);
                    setPickSourceOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.pickSheetRow,
                    i < 2 && styles.pickSheetRowBorder,
                    pressed && { backgroundColor: Colors.surfaceVariant },
                  ]}
                  accessibilityRole="button"
                >
                  <View style={styles.pickSheetIconCircle}>
                    <MaterialCommunityIcons name={opt.icon} size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMd" weight="semiBold">
                      {opt.label}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {opt.hint}
                    </AppText>
                  </View>
                  <MaterialCommunityIcons name="chevron-left" size={20} color={Colors.onSurfaceMuted} />
                </Pressable>
              ))}
              <Pressable
                onPress={() => setPickSourceOpen(false)}
                style={({ pressed }) => [styles.pickSheetCancel, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
              >
                <AppText variant="bodyMd" color="variant" align="center">
                  ביטול
                </AppText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

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
  pickTrigger: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  pickTriggerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  pickSheetTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  pickSheetRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pickSheetRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  pickSheetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickSheetCancel: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
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
