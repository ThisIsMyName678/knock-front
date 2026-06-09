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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  TASK_KIND_LABELS,
  TASK_KIND_ICONS,
  TASK_PRIORITY_LABELS,
  WORKFLOW_STATUS_LABELS,
  lastMessages,
  MOCK_TASK_INVITE_URL,
  type TaskMessage,
  type WorkflowStatus,
  type TaskKind,
  type TaskListRow,
} from '@/lib/mocks/tasks';
import {
  getTask,
  backendTaskDetailToRow,
  updateTask,
  clientStatusToBackend,
  clientTaskTypeToBackend,
  clientPriorityToBackendUrgency,
  ddMmYyyyToIso,
} from '@/lib/api/tasks';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING, FontFamily, FontSize } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { Input } from '@/components/ui/Input';
import { AppHeader } from '@/components/ui/AppHeader';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

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
  const [task, setTask] = useState<TaskListRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  // Local display state (reflects saves from edit modal)
  const [localTitle, setLocalTitle] = useState('');
  const [localAssignee, setLocalAssignee] = useState('');
  const [localDueDate, setLocalDueDate] = useState('');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localPriority, setLocalPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [localTaskKind, setLocalTaskKind] = useState<TaskKind>('execution');
  const [localEndDate, setLocalEndDate] = useState('');
  const [localCostNotes, setLocalCostNotes] = useState('');
  const [localTimeNotes, setLocalTimeNotes] = useState('');

  // Edit modal draft state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editPriority, setEditPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [editTaskKind, setEditTaskKind] = useState<TaskKind>('execution');
  const [editEndDate, setEditEndDate] = useState('');
  const [editCostNotes, setEditCostNotes] = useState('');
  const [editTimeNotes, setEditTimeNotes] = useState('');
  const [editDatePickerTarget, setEditDatePickerTarget] = useState<'start' | 'due' | 'end' | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = () => {
    setEditTitle(localTitle);
    setEditAssignee(localAssignee);
    setEditDueDate(localDueDate);
    setEditStartDate(localStartDate);
    setEditPriority(localPriority);
    setEditTaskKind(localTaskKind);
    setEditEndDate(localEndDate);
    setEditCostNotes(localCostNotes);
    setEditTimeNotes(localTimeNotes);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditError(null);
    const newTitle = editTitle.trim() || localTitle;
    setEditSaving(true);
    try {
      await updateTask(String(id ?? ''), {
        title: newTitle,
        taskType: clientTaskTypeToBackend(editTaskKind),
        urgency: clientPriorityToBackendUrgency(editPriority),
        startDate: editStartDate.trim() ? ddMmYyyyToIso(editStartDate) : undefined,
        dueDate: editDueDate.trim() ? ddMmYyyyToIso(editDueDate) : null,
        cost: editCostNotes.trim() || null,
        handlingTime: editTimeNotes.trim() ? parseInt(editTimeNotes.trim(), 10) : null,
      });
      setLocalTitle(newTitle);
      setLocalAssignee(editAssignee.trim() || localAssignee);
      setLocalDueDate(editDueDate.trim() || localDueDate);
      setLocalStartDate(editStartDate.trim() || localStartDate);
      setLocalPriority(editPriority);
      setLocalTaskKind(editTaskKind);
      setLocalEndDate(editEndDate.trim());
      setLocalCostNotes(editCostNotes.trim());
      setLocalTimeNotes(editTimeNotes.trim());
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'שגיאה בשמירת המשימה');
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    getTask(String(id ?? ''))
      .then((res) => {
        if (!active) return;
        const row = backendTaskDetailToRow(res);
        setTask(row);
        setWorkflowStatus(row.workflowStatus);
        setMessages(row.messages);
        setLocalTitle(row.title);
        setLocalAssignee(row.assigneeName);
        setLocalDueDate(row.dueDate);
        setLocalStartDate(row.startDate);
        setLocalPriority(row.priority);
        setLocalTaskKind(row.taskKind);
        setLocalEndDate(row.endDate ?? '');
        setLocalCostNotes(row.costNotes ?? '');
        setLocalTimeNotes(row.timeNotes ?? '');
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setLoadError(err?.message ?? 'שגיאה בטעינת המשימה');
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const effectiveStatus = workflowStatus ?? task?.workflowStatus ?? 'open';
  const effectiveTaskKind = localTaskKind;
  const effectivePriority = localPriority;

  const lastFive = useMemo(() => lastMessages(messages, 5), [messages]);

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

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="משימה" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (loadError || !task) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="משימה" showBack />
        <View style={{ flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={36} color={Colors.error} style={{ alignSelf: 'center' }} />
          <AppText variant="bodyMd" align="center" color="error" style={{ marginTop: Spacing.sm }}>
            {loadError ?? 'לא נמצאה משימה'}
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} fullWidth style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const isMaintenance = effectiveTaskKind === 'maintenance';
  const chatTitle = isMaintenance ? 'עדכוני קריאת תחזוקה' : 'עדכונים והערות';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader
          title={isMaintenance ? 'קריאת תחזוקה' : 'פרטי משימה'}
          showBack
        />

        <View style={styles.taskHeaderActions}>
          <Pressable
            onPress={openEdit}
            style={({ pressed }) => [styles.taskHeaderBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="עריכת משימה"
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.primary} />
            <AppText variant="bodySm" weight="semiBold" color="primary">
              עריכה
            </AppText>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('מחיקת משימה', 'האם למחוק את המשימה? (במימוש מלא יימחק מהמערכת)', [
                { text: 'ביטול', style: 'cancel' },
                {
                  text: 'מחק',
                  style: 'destructive',
                  onPress: () => router.back(),
                },
              ])
            }
            style={({ pressed }) => [styles.taskHeaderBtn, styles.taskHeaderBtnDanger, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="מחיקת משימה"
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
            <AppText variant="bodySm" weight="semiBold" style={{ color: Colors.error }}>
              מחיקה
            </AppText>
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
              <MaterialCommunityIcons name={iconName(effectiveTaskKind)} size={28} color={Colors.primary} />
              <View style={{ flex: 1, gap: Spacing.sm }}>
                <AppText variant="caption" color="variant">
                  {TASK_KIND_LABELS[effectiveTaskKind]}
                </AppText>
                <AppText variant="headingSm" weight="bold">
                  {localTitle || task.title}
                </AppText>
                <View style={styles.badgeRow}>
                  <Badge label={TASK_PRIORITY_LABELS[effectivePriority]} preset={priorityPreset(effectivePriority)} />
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
              { label: 'אחראי', value: localAssignee || task.assigneeName },
              { label: 'נוצר על ידי', value: task.createdBy },
              { label: 'תאריך התחלה', value: localStartDate || task.startDate },
              { label: 'תאריך יעד', value: localDueDate || task.dueDate },
              ...((localEndDate || task.endDate) ? [{ label: 'תאריך סיום', value: localEndDate || task.endDate! }] : []),
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
            {!task.assigneeHasUser ? (
              <Pressable onPress={() => Alert.alert('לינק הזמנה (דמה)', MOCK_TASK_INVITE_URL)} style={styles.inviteRow}>
                <MaterialCommunityIcons name="account-plus-outline" size={22} color={Colors.primary} />
                <AppText variant="bodySm" color="primary" weight="semiBold" style={{ flex: 1, textAlign: 'right' }}>
                  שיוך בעל תפקיד למשימה (לינק מותאם)
                </AppText>
              </Pressable>
            ) : null}
            {(localCostNotes || localTimeNotes || task.costNotes || task.timeNotes) && (
              <>
                {(localCostNotes || task.costNotes) ? (
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <AppText variant="bodyMd" color="variant">
                      עלות
                    </AppText>
                    <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                      {localCostNotes || task.costNotes}
                    </AppText>
                  </View>
                ) : null}
                {(localTimeNotes || task.timeNotes) ? (
                  <View style={styles.detailRow}>
                    <AppText variant="bodyMd" color="variant">
                      זמן
                    </AppText>
                    <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                      {localTimeNotes || task.timeNotes}
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
                  disabled={statusSaving}
                  onPress={async () => {
                    const prev = workflowStatus;
                    setWorkflowStatus(s);
                    setStatusMenuOpen(false);
                    const backendStatus = clientStatusToBackend(s);
                    if (!backendStatus) return;
                    setStatusSaving(true);
                    try {
                      await updateTask(String(id ?? ''), { status: backendStatus });
                    } catch {
                      setWorkflowStatus(prev);
                      Alert.alert('שגיאה', 'לא ניתן לעדכן את הסטטוס. נסה שוב.');
                    } finally {
                      setStatusSaving(false);
                    }
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
              {messages.map((m) => (
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
              <View style={{ flexDirection: RTL_ROW, gap: Spacing.sm, marginTop: Spacing.md }}>
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

        {/* ─── Edit modal ─── */}
        <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.editBackdrop} onPress={() => setEditOpen(false)}>
              <Pressable style={[styles.editSheet, { paddingBottom: insets.bottom + Spacing.lg }]} onPress={(e) => e.stopPropagation()}>
                {/* Drag handle */}
                <View style={styles.dragHandle} />

                {/* Header */}
                <View style={styles.editModalHeader}>
                  <Pressable onPress={() => setEditOpen(false)} style={styles.iconBtnDark} accessibilityRole="button">
                    <MaterialCommunityIcons name="close" size={22} color={Colors.onBackground} />
                  </Pressable>
                  <AppText variant="headingSm" weight="bold" style={{ flex: 1, textAlign: 'right' }}>
                    עריכת משימה
                  </AppText>
                  <Pressable onPress={editSaving ? undefined : saveEdit} style={[styles.saveBtn, editSaving && { opacity: 0.6 }]} accessibilityRole="button">
                    <AppText variant="labelMd" weight="bold" style={{ color: Colors.onPrimary }}>{editSaving ? 'שומר...' : 'שמור'}</AppText>
                  </Pressable>
                </View>

                {editError ? (
                  <AppText variant="bodySm" style={{ color: Colors.error, textAlign: 'right', paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.sm }}>
                    {editError}
                  </AppText>
                ) : null}
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.editContent}>

                  {/* סוג משימה */}
                  <View style={styles.editSection}>
                    <AppText variant="labelMd" weight="semiBold" style={styles.editSectionTitle}>סוג משימה</AppText>
                    <View style={styles.editChipsWrap}>
                      {(Object.keys(TASK_KIND_LABELS) as TaskKind[]).map((k) => (
                        <Pressable
                          key={k}
                          onPress={() => setEditTaskKind(k)}
                          style={[styles.editChip, editTaskKind === k && styles.editChipActive]}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name={iconName(k)}
                            size={13}
                            color={editTaskKind === k ? Colors.onPrimary : Colors.primary}
                          />
                          <AppText variant="caption" weight={editTaskKind === k ? 'bold' : 'regular'} style={{ color: editTaskKind === k ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                            {TASK_KIND_LABELS[k]}
                          </AppText>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* עדיפות */}
                  <View style={styles.editSection}>
                    <AppText variant="labelMd" weight="semiBold" style={styles.editSectionTitle}>עדיפות</AppText>
                    <View style={styles.editChipsWrap}>
                      {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
                        <Pressable
                          key={p}
                          onPress={() => setEditPriority(p)}
                          style={[styles.editChip, editPriority === p && styles.editChipActive]}
                          accessibilityRole="button"
                        >
                          <AppText variant="caption" weight={editPriority === p ? 'bold' : 'regular'} style={{ color: editPriority === p ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                            {TASK_PRIORITY_LABELS[p]}
                          </AppText>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* כותרת */}
                  <View style={styles.editSection}>
                    <Input label="כותרת המשימה" value={editTitle} onChangeText={setEditTitle} />
                  </View>

                  {/* אחראי */}
                  <View style={styles.editSection}>
                    <Input label="אחראי / מבצע" value={editAssignee} onChangeText={setEditAssignee} />
                  </View>

                  {/* תאריכים */}
                  <View style={styles.editSection}>
                    <AppText variant="labelMd" weight="semiBold" style={styles.editSectionTitle}>תאריכים</AppText>

                    <AppText variant="labelSm" weight="semiBold" style={styles.dateFieldLabel}>תאריך התחלה</AppText>
                    <Pressable onPress={() => setEditDatePickerTarget('start')} style={styles.dateTrigger} accessibilityRole="button">
                      <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.onSurfaceVariant} />
                      <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: editStartDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                        {editStartDate || 'בחר תאריך'}
                      </AppText>
                    </Pressable>

                    <AppText variant="labelSm" weight="semiBold" style={[styles.dateFieldLabel, { marginTop: Spacing.sm }]}>תאריך יעד</AppText>
                    <Pressable onPress={() => setEditDatePickerTarget('due')} style={styles.dateTrigger} accessibilityRole="button">
                      <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.onSurfaceVariant} />
                      <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: editDueDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                        {editDueDate || 'בחר תאריך'}
                      </AppText>
                    </Pressable>

                    <AppText variant="labelSm" weight="semiBold" style={[styles.dateFieldLabel, { marginTop: Spacing.sm }]}>תאריך סיום בפועל</AppText>
                    <Pressable onPress={() => setEditDatePickerTarget('end')} style={styles.dateTrigger} accessibilityRole="button">
                      <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.onSurfaceVariant} />
                      <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: editEndDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                        {editEndDate || 'בחר תאריך'}
                      </AppText>
                    </Pressable>
                  </View>

                  {/* עלות וזמן */}
                  <View style={styles.editSection}>
                    <AppText variant="labelMd" weight="semiBold" style={styles.editSectionTitle}>עלות וזמן</AppText>
                    <Input label='עלות (ש"ח)' value={editCostNotes} onChangeText={setEditCostNotes} keyboardType="numeric" />
                    <View style={{ marginTop: Spacing.sm }}>
                      <Input label="זמן טיפול (שעות)" value={editTimeNotes} onChangeText={setEditTimeNotes} keyboardType="numeric" />
                    </View>
                  </View>

                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        <DatePickerModal
          visible={editDatePickerTarget !== null}
          value={editDatePickerTarget === 'start' ? editStartDate : editDatePickerTarget === 'due' ? editDueDate : editEndDate}
          onSelect={(d) => {
            if (editDatePickerTarget === 'start') setEditStartDate(d);
            else if (editDatePickerTarget === 'due') setEditDueDate(d);
            else setEditEndDate(d);
          }}
          onClose={() => setEditDatePickerTarget(null)}
          title={editDatePickerTarget === 'start' ? 'תאריך התחלה' : editDatePickerTarget === 'due' ? 'תאריך יעד' : 'תאריך סיום בפועל'}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  iconBtnDark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  taskHeaderActions: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  taskHeaderBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  taskHeaderBtnDanger: {
    borderColor: `${Colors.error}55`,
    backgroundColor: Colors.surface,
  },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  maintenanceBanner: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryDark,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  titleRow: { flexDirection: RTL_ROW, alignItems: 'flex-start', gap: Spacing.md },
  badgeRow: { flexDirection: RTL_ROW, gap: Spacing.sm, flexWrap: 'wrap' },
  detailRow: {
    flexDirection: RTL_ROW,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  inviteRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
  msgBubble: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  msgHeader: { flexDirection: RTL_ROW, justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
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
    flexDirection: RTL_ROW,
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
  composeActions: { flexDirection: RTL_ROW, gap: Spacing.lg, marginTop: Spacing.md, justifyContent: 'flex-end' },
  attachBtn: { flexDirection: RTL_ROW, alignItems: 'center', gap: 6 },
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
  editModalHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    gap: Spacing.sm,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  editChip: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  editChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  // Edit bottom sheet
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    width: '100%',
    ...Shadow.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  editContent: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: 0,
    paddingBottom: Spacing.xl,
  },
  editSection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  editSectionTitle: {
    textAlign: 'right',
    marginBottom: Spacing.sm,
    color: Colors.onSurfaceVariant,
  },
  editChipsWrap: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dateFieldLabel: {
    textAlign: 'right',
    marginBottom: Spacing.xs,
    color: Colors.onBackground,
  },
  dateTrigger: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
});
