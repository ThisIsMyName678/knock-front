import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_PAYMENTS_LIST, PAYMENT_TYPE_LABELS } from '@/lib/mocks/payments';
import {
  getTaskDetailMock,
  TASK_KIND_LABELS,
  TASK_KIND_ICONS,
  TASK_PRIORITY_LABELS,
  WORKFLOW_STATUS_LABELS,
  lastMessages,
  MOCK_TASK_INVITE_URL,
  type TaskMessage,
  type WorkflowStatus,
  type TaskKind,
} from '@/lib/mocks/tasks';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING, FontFamily, FontSize } from '@/constants/tokens';

const STATUS_OPTIONS: WorkflowStatus[] = ['not_started', 'open', 'in_progress', 'completed', 'cancelled'];

function iconName(kind: TaskKind): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  return TASK_KIND_ICONS[kind] as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

function priorityPreset(p: 'urgent' | 'high' | 'medium' | 'low'): React.ComponentProps<typeof Badge>['preset'] {
  if (p === 'urgent') return 'error';
  if (p === 'high') return 'warning';
  if (p === 'medium') return 'warning';
  return 'neutral';
}

function statusPreset(s: WorkflowStatus): React.ComponentProps<typeof Badge>['preset'] {
  if (s === 'not_started') return 'neutral';
  if (s === 'open') return 'statusOpen';
  if (s === 'in_progress') return 'statusInProgress';
  if (s === 'completed') return 'statusClosed';
  return 'statusCancelled';
}

export default function TaskDetailRoute() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const base = useMemo(() => getTaskDetailMock(String(id ?? '')), [id]);

  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(base?.workflowStatus ?? null);
  const [messages, setMessages] = useState<TaskMessage[]>(() => base?.messages ?? []);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  useEffect(() => {
    const t = getTaskDetailMock(String(id ?? ''));
    if (t) {
      setWorkflowStatus(t.workflowStatus);
      setMessages([...t.messages]);
    }
  }, [id]);

  const task = base;
  const effectiveStatus = workflowStatus ?? task?.workflowStatus ?? 'open';

  const lastFive = useMemo(() => lastMessages(messages, 5), [messages]);

  const linkedPayment = task?.linkedPaymentId ? MOCK_PAYMENTS_LIST.find((p) => p.id === task.linkedPaymentId) : null;

  const sendMessage = useCallback(() => {
    const text = composeText.trim();
    if (!text) {
      setComposeOpen(false);
      return;
    }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const sentAt = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setMessages((prev) => [...prev, { id: `local_${Date.now()}`, text, authorName: 'אני', sentAt }]);
    setComposeText('');
    setComposeOpen(false);
  }, [composeText]);

  if (!task) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            משימה
          </AppText>
          <View style={styles.iconBtn} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING }}>
          <AppText variant="bodyMd" align="center" color="variant">
            לא נמצאה משימה
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} fullWidth style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const isMaintenance = task.taskKind === 'maintenance';
  const chatTitle = isMaintenance ? 'עדכוני קריאת תחזוקה' : 'עדכונים והערות';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
            {isMaintenance ? 'קריאת תחזוקה' : 'פרטי משימה'}
          </AppText>
          <Pressable
            onPress={() => Alert.alert('לינק הזמנה (דמה)', MOCK_TASK_INVITE_URL)}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="לינק הזמנה"
          >
            <MaterialCommunityIcons name="link-variant" size={22} color={Colors.onPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
          {isMaintenance && (
            <View style={styles.maintenanceBanner}>
              <MaterialCommunityIcons name="hammer-wrench" size={20} color={Colors.onPrimary} />
              <AppText variant="labelMd" weight="bold" color="onPrimary" style={{ flex: 1, textAlign: 'right' }}>
                קריאת תחזוקה פעילה
              </AppText>
            </View>
          )}

          <Card>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name={iconName(task.taskKind)} size={28} color={Colors.primary} />
              <View style={{ flex: 1, gap: Spacing.sm }}>
                <AppText variant="caption" color="variant">
                  {TASK_KIND_LABELS[task.taskKind]}
                </AppText>
                <AppText variant="headingSm" weight="bold">
                  {task.title}
                </AppText>
                <View style={styles.badgeRow}>
                  <Badge label={TASK_PRIORITY_LABELS[task.priority]} preset={priorityPreset(task.priority)} />
                  <Pressable onPress={() => setStatusMenuOpen(true)} accessibilityRole="button">
                    <Badge label={WORKFLOW_STATUS_LABELS[effectiveStatus]} preset={statusPreset(effectiveStatus)} />
                  </Pressable>
                </View>
                <AppText variant="caption" color="primary" style={{ textAlign: 'right' }}>
                  לחץ על תג הסטטוס לשינוי
                </AppText>
              </View>
            </View>
          </Card>

          <Card>
            <AppText variant="labelMd" weight="semiBold" color="variant" style={{ marginBottom: Spacing.sm }}>
              פרטים
            </AppText>
            {[
              { label: 'שיוך', value: `${task.linkKind === 'asset' ? 'נכס' : 'פרויקט'}: ${task.linkLabel}` },
              { label: 'אחראי', value: task.assigneeName },
              { label: 'נוצר על ידי', value: task.createdBy },
              { label: 'תאריך התחלה', value: task.startDate },
              { label: 'תאריך יעד', value: task.dueDate },
              ...(task.endDate ? [{ label: 'תאריך סיום', value: task.endDate }] : []),
            ].map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <AppText variant="bodyMd" color="variant">
                  {row.label}
                </AppText>
                <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }}>
                  {row.value}
                </AppText>
              </View>
            ))}
            {linkedPayment && (
              <View style={styles.detailRow}>
                <AppText variant="bodyMd" color="variant">
                  תשלום מקושר
                </AppText>
                <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                  {linkedPayment.displayName} ({PAYMENT_TYPE_LABELS[linkedPayment.paymentType]})
                </AppText>
              </View>
            )}
            {(task.costNotes || task.timeNotes) && (
              <>
                {task.costNotes ? (
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <AppText variant="bodyMd" color="variant">
                      עלות
                    </AppText>
                    <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                      {task.costNotes}
                    </AppText>
                  </View>
                ) : null}
                {task.timeNotes ? (
                  <View style={styles.detailRow}>
                    <AppText variant="bodyMd" color="variant">
                      זמן
                    </AppText>
                    <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                      {task.timeNotes}
                    </AppText>
                  </View>
                ) : null}
              </>
            )}
          </Card>

          <Card>
            <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
              {chatTitle}
            </AppText>
            {messages.length === 0 ? (
              <AppText variant="bodySm" color="variant" style={{ textAlign: 'right' }}>
                אין הודעות עדיין
              </AppText>
            ) : (
              <>
                {lastFive.map((m) => (
                  <View key={m.id} style={styles.msgBubble}>
                    <View style={styles.msgHeader}>
                      <AppText variant="caption" color="muted">
                        {m.sentAt}
                      </AppText>
                      <AppText variant="labelSm" weight="semiBold">
                        {m.authorName}
                      </AppText>
                    </View>
                    <AppText variant="bodySm" style={{ textAlign: 'right', marginTop: 4 }}>
                      {m.text}
                    </AppText>
                    {m.imageUri ? (
                      <Pressable onPress={() => setImagePreviewUri(m.imageUri!)} style={{ marginTop: Spacing.sm }} accessibilityRole="button">
                        <Image source={{ uri: m.imageUri }} style={styles.msgThumb} resizeMode="cover" />
                        <AppText variant="caption" color="primary" style={{ marginTop: 4, textAlign: 'right' }}>
                          הקש להגדלה
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                {messages.length > 5 && (
                  <Pressable onPress={() => setShowAllMessages(true)} style={styles.seeAll}>
                    <AppText variant="labelMd" weight="bold" color="primary">
                      צפה בכל ההודעות ({messages.length})
                    </AppText>
                  </Pressable>
                )}
              </>
            )}
            <Button label="שלח הודעה" onPress={() => setComposeOpen(true)} fullWidth style={{ marginTop: Spacing.md }} />
          </Card>
        </ScrollView>

        <Modal visible={statusMenuOpen} transparent animationType="fade" onRequestClose={() => setStatusMenuOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setStatusMenuOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
                סטטוס משימה
              </AppText>
              {STATUS_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setWorkflowStatus(s);
                    setStatusMenuOpen(false);
                  }}
                  style={[styles.modalOption, effectiveStatus === s && styles.modalOptionActive]}
                >
                  <AppText variant="bodyMd" weight={effectiveStatus === s ? 'bold' : 'regular'}>
                    {WORKFLOW_STATUS_LABELS[s]}
                  </AppText>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showAllMessages} animationType="slide" onRequestClose={() => setShowAllMessages(false)}>
          <View style={[styles.fullModal, { paddingTop: insets.top }]}>
            <View style={styles.fullModalHeader}>
              <Pressable onPress={() => setShowAllMessages(false)} style={styles.iconBtnDark} accessibilityRole="button">
                <MaterialCommunityIcons name="close" size={24} color={Colors.onBackground} />
              </Pressable>
              <AppText variant="headingSm" weight="bold" style={{ flex: 1, textAlign: 'right' }}>
                כל ההודעות
              </AppText>
            </View>
            <ScrollView contentContainerStyle={{ padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md }}>
              {[...messages].reverse().map((m) => (
                <View key={m.id} style={styles.msgBubble}>
                  <View style={styles.msgHeader}>
                    <AppText variant="caption" color="muted">
                      {m.sentAt}
                    </AppText>
                    <AppText variant="labelSm" weight="semiBold">
                      {m.authorName}
                    </AppText>
                  </View>
                  <AppText variant="bodySm" style={{ textAlign: 'right', marginTop: 4 }}>
                    {m.text}
                  </AppText>
                  {m.imageUri ? (
                    <Pressable onPress={() => setImagePreviewUri(m.imageUri!)}>
                      <Image source={{ uri: m.imageUri }} style={styles.msgThumb} resizeMode="cover" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>

        <Modal visible={composeOpen} transparent animationType="fade" onRequestClose={() => setComposeOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setComposeOpen(false)}>
            <Pressable style={styles.composeSheet} onPress={(e) => e.stopPropagation()}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
                שליחת הודעה
              </AppText>
              <TextInput
                style={styles.composeInput}
                placeholder="כתוב הודעה..."
                placeholderTextColor={Colors.onSurfaceMuted}
                value={composeText}
                onChangeText={setComposeText}
                multiline
                textAlign="right"
              />
              <View style={styles.composeActions}>
                <Pressable
                  onPress={() => Alert.alert('צירוף קובץ', 'בגרסה זו אין העלאה אמיתית — זה placeholder לעיצוב.')}
                  style={styles.attachBtn}
                >
                  <MaterialCommunityIcons name="image-plus-outline" size={22} color={Colors.primary} />
                  <AppText variant="caption" color="primary">
                    צרף תמונה
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => Alert.alert('צירוף וידאו', 'בגרסה זו אין העלאה אמיתית — זה placeholder לעיצוב.')}
                  style={styles.attachBtn}
                >
                  <MaterialCommunityIcons name="video-plus-outline" size={22} color={Colors.primary} />
                  <AppText variant="caption" color="primary">
                    צרף סרטון
                  </AppText>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row-reverse', gap: Spacing.sm, marginTop: Spacing.md }}>
                <Button label="ביטול" variant="secondary" onPress={() => setComposeOpen(false)} style={{ flex: 1 }} />
                <Button label="שלח" onPress={sendMessage} style={{ flex: 1 }} />
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={!!imagePreviewUri} transparent animationType="fade" onRequestClose={() => setImagePreviewUri(null)}>
          <Pressable style={styles.imageModal} onPress={() => setImagePreviewUri(null)}>
            {imagePreviewUri ? <Image source={{ uri: imagePreviewUri }} style={styles.fullImage} resizeMode="contain" /> : null}
            <Pressable style={[styles.closeFab, { top: insets.top + Spacing.sm }]} onPress={() => setImagePreviewUri(null)}>
              <MaterialCommunityIcons name="close" size={28} color={Colors.onPrimary} />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingView>
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
  iconBtnDark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  maintenanceBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryDark,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.md },
  badgeRow: { flexDirection: 'row-reverse', gap: Spacing.sm, flexWrap: 'wrap' },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  msgBubble: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  msgHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  msgThumb: { width: '100%', height: 140, borderRadius: Radius.sm },
  seeAll: { paddingVertical: Spacing.sm, alignItems: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: Spacing.lg },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  modalOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  modalOptionActive: { backgroundColor: Colors.primaryContainer },
  fullModal: { flex: 1, backgroundColor: Colors.background },
  fullModalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  composeSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  composeInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    textAlignVertical: 'top',
  },
  composeActions: { flexDirection: 'row-reverse', gap: Spacing.lg, marginTop: Spacing.md, justifyContent: 'flex-end' },
  attachBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  imageModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  fullImage: { width: '100%', height: '80%' },
  closeFab: {
    position: 'absolute',
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
