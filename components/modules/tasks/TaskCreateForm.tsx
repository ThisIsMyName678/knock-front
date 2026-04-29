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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { MOCK_ENTITY_LINKS, entitySearchText, type EntityLinkOption } from '@/lib/mocks/contracts';
import { PAYMENT_TYPE_LABELS } from '@/lib/mocks/payments';
import {
  TASK_KIND_LABELS,
  TASK_KIND_ICONS,
  TASK_PRIORITY_LABELS,
  MOCK_TASK_INVITE_URL,
  paymentsForTaskLink,
  type TaskKind,
  type TaskPriority,
  type WorkflowStatus,
} from '@/lib/mocks/tasks';
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

const TASK_KINDS = (Object.keys(TASK_KIND_LABELS) as TaskKind[]).map((k) => ({ key: k, label: TASK_KIND_LABELS[k], icon: TASK_KIND_ICONS[k] }));

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

type StartPreset = 'open' | 'in_progress' | 'urgent_flow';

function formatTodayDdMmYyyy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function filterEntitiesForTaskQuery(query: string): EntityLinkOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_ENTITY_LINKS;
  return MOCK_ENTITY_LINKS.filter((e) => entitySearchText(e).includes(q));
}

function iconName(icon: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  return icon as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function TaskCreateForm() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [taskKind, setTaskKind] = useState<TaskKind>('maintenance');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startPreset, setStartPreset] = useState<StartPreset>('open');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [linkedPaymentId, setLinkedPaymentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(formatTodayDdMmYyyy);
  const [endDate, setEndDate] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const entities = useMemo(() => filterEntitiesForTaskQuery(linkQuery), [linkQuery]);
  const paymentOptions = useMemo(() => paymentsForTaskLink(linkSelected?.id ?? ''), [linkSelected]);

  const workflowFromPreset = (): WorkflowStatus => {
    if (startPreset === 'in_progress') return 'in_progress';
    return 'open';
  };

  const effectivePriority = (): TaskPriority => {
    if (startPreset === 'urgent_flow') return 'urgent';
    return priority;
  };

  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => ({
    title: title.trim().length === 0 ? 'שדה חובה' : '',
    startDate: startDate.trim().length === 0 ? 'שדה חובה' : '',
  }), [title, startDate]);

  const onSave = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    router.back();
  };

  const onCopyInvite = () => {
    Alert.alert('לינק הזמנה (דמה)', `${MOCK_TASK_INVITE_URL}\n\nשלחו לינק לשיוך בעל תפקיד למשימה.`);
  };

  const mockAttach = () => {
    Alert.alert('צירוף קובץ', 'במימוש אמיתי: בחירת קובץ / מצלמה.', [
      { text: 'אישור', onPress: () => setAttachmentName((a) => a || 'קובץ_משויך.pdf') },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="משימה חדשה" showBack />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Input label="כותרת המשימה" required placeholder="תאר את המשימה..." value={title} onChangeText={setTitle} error={submitted ? errors.title : ''} containerStyle={{ marginBottom: Spacing.md }} />

            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
              סוג משימה
            </AppText>
            <View style={styles.kindGrid}>
              {TASK_KINDS.map((k) => (
                <Pressable
                  key={k.key}
                  onPress={() => setTaskKind(k.key)}
                  style={[styles.kindCard, taskKind === k.key && styles.kindCardActive]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={iconName(k.icon)} size={22} color={taskKind === k.key ? Colors.onPrimary : Colors.primary} />
                  <AppText variant="labelSm" weight={taskKind === k.key ? 'bold' : 'regular'} numberOfLines={2} align="center" style={{ color: taskKind === k.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    {k.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              רמת דחיפות
            </AppText>
            <View style={styles.rowChips}>
              {PRIORITIES.map((p) => (
                <Pressable key={p} onPress={() => setPriority(p)} style={[styles.miniChip, priority === p && styles.miniChipActive]}>
                  <AppText variant="caption" weight={priority === p ? 'bold' : 'regular'} style={{ color: priority === p ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    {TASK_PRIORITY_LABELS[p]}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              סטטוס התחלה
            </AppText>
            <View style={styles.rowChips}>
              {(
                [
                  { key: 'open' as const, label: 'פתוח' },
                  { key: 'in_progress' as const, label: 'בטיפול' },
                  { key: 'urgent_flow' as const, label: 'דחוף' },
                ] as const
              ).map((o) => (
                <Pressable key={o.key} onPress={() => setStartPreset(o.key)} style={[styles.miniChip, startPreset === o.key && styles.miniChipActive]}>
                  <AppText variant="caption" weight={startPreset === o.key ? 'bold' : 'regular'} style={{ color: startPreset === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    {o.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.xs }}>
              דחוף: נשמר כעדיפות דחוף + סטטוס פתוח (תצוגה בלבד)
            </AppText>

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              שיוך נכס / פרויקט
            </AppText>
            <TextInput
              style={styles.entityInput}
              placeholder="חיפוש..."
              placeholderTextColor={Colors.onSurfaceMuted}
              value={linkQuery}
              onChangeText={(t) => {
                setLinkQuery(t);
                setShowSuggest(t.trim().length > 0);
                if (!t) setLinkSelected(null);
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
                    setLinkedPaymentId(null);
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
                    }}
                    style={styles.suggestRow}
                  >
                    <AppText variant="bodySm">{e.name}</AppText>
                  </Pressable>
                ))}
              </View>
            )}

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              אחראי / עובד
            </AppText>
            <Input label="שם" placeholder="שם אחראי..." value={assigneeName} onChangeText={setAssigneeName} />
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.xs }}>
              לשיוך בעל תפקיד — לחצו על אייקון הקישור בכותרת לשליחת לינק.
            </AppText>

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
              קישור לתשלום (אופציונלי)
            </AppText>
            <Pressable onPress={() => setPaymentModal(true)} style={styles.dropdown} accessibilityRole="button">
              <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.onSurfaceVariant} />
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                {!linkSelected
                  ? 'בחרו שיוך נכס/פרויקט תחילה'
                  : linkedPaymentId
                    ? paymentOptions.find((p) => p.id === linkedPaymentId)?.displayName ?? '—'
                    : 'בחרו תשלום'}
              </AppText>
            </Pressable>

            <Input label="תאריך התחלה" required placeholder="DD/MM/YYYY" value={startDate} onChangeText={setStartDate} error={submitted ? errors.startDate : ''} containerStyle={{ marginTop: Spacing.md }} />
            <Input label="תאריך סיום (אופציונלי)" placeholder="DD/MM/YYYY" value={endDate} onChangeText={setEndDate} containerStyle={{ marginTop: Spacing.sm }} />

            {/* ─── צרף קובץ ─── */}
            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              קבצים מצורפים
            </AppText>
            {attachmentName ? (
              <View style={styles.attachPill}>
                <Pressable onPress={() => setAttachmentName('')} accessibilityRole="button">
                  <MaterialCommunityIcons name="close-circle" size={18} color={Colors.onSurfaceMuted} />
                </Pressable>
                <MaterialCommunityIcons name="file-outline" size={18} color={Colors.primary} />
                <AppText variant="bodySm" style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {attachmentName}
                </AppText>
              </View>
            ) : null}
            <View style={styles.fileBtns}>
              <Pressable style={styles.fileBtn} onPress={mockAttach} accessibilityRole="button">
                <MaterialCommunityIcons name="folder-outline" size={22} color={Colors.primary} />
                <AppText variant="caption">קובץ</AppText>
              </Pressable>
              <Pressable style={styles.fileBtn} onPress={mockAttach} accessibilityRole="button">
                <MaterialCommunityIcons name="image-outline" size={22} color={Colors.primary} />
                <AppText variant="caption">תמונה</AppText>
              </Pressable>
              <Pressable style={styles.fileBtn} onPress={mockAttach} accessibilityRole="button">
                <MaterialCommunityIcons name="camera-outline" size={22} color={Colors.primary} />
                <AppText variant="caption">מצלמה</AppText>
              </Pressable>
            </View>

            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.md }}>
              סטטוס שמור: {workflowFromPreset()} · עדיפות: {effectivePriority()} (תצוגה בלבד, ללא שמירה לשרת)
            </AppText>
          </View>

          <Button label="שמור משימה" onPress={onSave} fullWidth size="lg" style={{ marginTop: Spacing.base }} />
        </ScrollView>

        <Modal visible={paymentModal} transparent animationType="slide" onRequestClose={() => setPaymentModal(false)}>
          <Pressable style={styles.payModalBackdrop} onPress={() => setPaymentModal(false)}>
            <Pressable style={styles.payModalSheet} onPress={(e) => e.stopPropagation()}>
              <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md, textAlign: 'right' }}>
                בחירת תשלום
              </AppText>
              {!linkSelected ? (
                <AppText variant="bodySm" color="variant">
                  בחרו ישות קודם
                </AppText>
              ) : paymentOptions.length === 0 ? (
                <AppText variant="bodySm" color="variant">
                  אין תשלומים לישות זו ב-mock
                </AppText>
              ) : (
                paymentOptions.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setLinkedPaymentId(p.id);
                      setPaymentModal(false);
                    }}
                    style={styles.payRow}
                  >
                    <AppText variant="bodyMd" weight="semiBold">
                      {p.displayName}
                    </AppText>
                    <AppText variant="caption" color="variant">
                      {PAYMENT_TYPE_LABELS[p.paymentType]} · {p.dueDate}
                    </AppText>
                  </Pressable>
                ))
              )}
              <Button label="סגור" variant="secondary" onPress={() => setPaymentModal(false)} fullWidth style={{ marginTop: Spacing.md }} />
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.sm, color: Colors.onBackground },
  kindGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs },
  kindCard: {
    width: '31%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
    gap: 4,
  },
  kindCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rowChips: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.sm },
  miniChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  miniChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
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
  attachPill: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  fileBtns: { flexDirection: RTL_ROW, gap: Spacing.md },
  fileBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
    gap: 4,
  },
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
  payModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  payModalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
    maxHeight: '70%',
  },
  payRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    alignItems: 'flex-end',
    gap: 4,
  },
});
