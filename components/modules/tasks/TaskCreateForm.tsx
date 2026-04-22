import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Switch,
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
  const [assigneeHasUser, setAssigneeHasUser] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [linkedPaymentId, setLinkedPaymentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(formatTodayDdMmYyyy);
  const [endDate, setEndDate] = useState('');
  const [costNotes, setCostNotes] = useState('');
  const [timeNotes, setTimeNotes] = useState('');

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

  const onSave = () => {
    router.back();
  };

  const onCopyInvite = () => {
    const suffix = assigneeHasUser ? 'העובד רשום במערכת.' : 'שלחו לינק להזמנת משתמש חיצוני.';
    Alert.alert('לינק הזמנה (דמה)', `${MOCK_TASK_INVITE_URL}\n\n${suffix}`);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            משימה חדשה
          </AppText>
          <Pressable onPress={onCopyInvite} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="העתק לינק הזמנה">
            <MaterialCommunityIcons name="link-variant" size={22} color={Colors.onPrimary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Input label="כותרת המשימה" placeholder="תאר את המשימה..." value={title} onChangeText={setTitle} containerStyle={{ marginBottom: Spacing.md }} />

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
                  <MaterialCommunityIcons name={iconName(k.icon)} size={28} color={taskKind === k.key ? Colors.onPrimary : Colors.primary} />
                  <AppText variant="caption" weight={taskKind === k.key ? 'bold' : 'regular'} numberOfLines={2} align="center" style={{ color: taskKind === k.key ? Colors.onPrimary : Colors.onSurfaceVariant, marginTop: Spacing.xs }}>
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
            <View style={styles.switchRow}>
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                יש משתמש במערכת
              </AppText>
              <Switch value={assigneeHasUser} onValueChange={setAssigneeHasUser} />
            </View>
            {!assigneeHasUser ? (
              <AppText variant="caption" color="primary" style={{ textAlign: 'right', marginTop: Spacing.xs }}>
                ללא משתמש — ניתן להזמין את אותו אדם כשוכר או עובד בלינק מותאם (אייקון הקישור בשורת הכותרת).
              </AppText>
            ) : null}

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

            <Input label="תאריך התחלה" placeholder="DD/MM/YYYY" value={startDate} onChangeText={setStartDate} containerStyle={{ marginTop: Spacing.md }} />
            <Input label="תאריך סיום (אופציונלי)" placeholder="DD/MM/YYYY" value={endDate} onChangeText={setEndDate} containerStyle={{ marginTop: Spacing.sm }} />

            <Input label="תיעוד עלות (טקסט)" placeholder="למשל הערכת עלות..." value={costNotes} onChangeText={setCostNotes} containerStyle={{ marginTop: Spacing.md }} />
            <Input label="תיעוד זמן טיפול" placeholder="שעות / ימים..." value={timeNotes} onChangeText={setTimeNotes} containerStyle={{ marginTop: Spacing.sm }} />

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
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.sm, color: Colors.onBackground },
  kindGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between' },
  kindCard: {
    width: '48%',
    minHeight: 88,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  kindCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rowChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  suggestBox: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, marginTop: 4, overflow: 'hidden' },
  suggestRow: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, backgroundColor: Colors.surface },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  dropdown: {
    flexDirection: 'row-reverse',
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
