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
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { searchEntityLinks, type EntityLinkOption, type LinkKind } from '@/lib/api/entity-links';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { PAYMENT_TYPE_LABELS } from '@/lib/mocks/payments';
import {
  TASK_KIND_LABELS,
  TASK_KIND_ICONS,
  TASK_PRIORITY_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_CATEGORY_ORDER,
  type TaskKind,
  type TaskPriority,
  type MaintenanceCategory,
} from '@/lib/mocks/tasks';
import {
  createTask,
  clientTaskTypeToBackend,
  clientPriorityToBackendUrgency,
  ddMmYyyyToIso,
} from '@/lib/api/tasks';
import { listPayments, type BackendPayment } from '@/lib/api/payments';
import {
  Colors,
  Spacing,
  Radius,
  FontFamily,
  FontSize,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

const TASK_KINDS = (Object.keys(TASK_KIND_LABELS) as TaskKind[])
  .filter((k) => k !== 'execution')
  .map((k) => ({ key: k, label: TASK_KIND_LABELS[k], icon: TASK_KIND_ICONS[k] }));

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

type StartPreset = 'open' | 'in_progress' | 'completed' | 'cancelled';

function formatTodayDdMmYyyy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


function iconName(icon: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  return icon as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function TaskCreateForm() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    preloadLinkId?: string;
    preloadLinkKind?: string;
    contextEntityId?: string;
  }>();

  const [title, setTitle] = useState('');
  const [taskKind, setTaskKind] = useState<TaskKind>('maintenance');
  const [maintenanceCategory, setMaintenanceCategory] = useState<MaintenanceCategory>('building');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startPreset, setStartPreset] = useState<StartPreset>('open');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [linkedPaymentId, setLinkedPaymentId] = useState<string | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<BackendPayment[]>([]);
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(formatTodayDdMmYyyy);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);
  const [cost, setCost] = useState('');
  const [handlingTime, setHandlingTime] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const [entities, setEntities] = useState<EntityLinkOption[]>([]);
  useEffect(() => {
    if (!linkQuery.trim()) { setEntities([]); return; }
    const t = setTimeout(() => {
      searchEntityLinks(linkQuery).then(setEntities).catch(() => setEntities([]));
    }, 250);
    return () => clearTimeout(t);
  }, [linkQuery]);
  useEffect(() => {
    if (!linkSelected) { setPaymentOptions([]); return; }
    setPaymentOptionsLoading(true);
    const params = linkSelected.kind === 'asset'
      ? { propertyId: linkSelected.id }
      : { projectId: linkSelected.id };
    listPayments(params)
      .then(setPaymentOptions)
      .catch(() => setPaymentOptions([]))
      .finally(() => setPaymentOptionsLoading(false));
  }, [linkSelected]);

  useEffect(() => {
    const rawId =
      typeof params.preloadLinkId === 'string'
        ? params.preloadLinkId
        : typeof params.contextEntityId === 'string'
          ? params.contextEntityId
          : undefined;
    if (!rawId) return;
    const kindParam = params.preloadLinkKind;
    const kind: LinkKind | undefined =
      kindParam === 'project' || kindParam === 'asset' ? kindParam : undefined;
    searchEntityLinks('').then((links) => {
      const opt = kind
        ? links.find((e) => e.id === rawId && e.kind === kind)
        : links.find((e) => e.id === rawId);
      if (opt) setLinkSelected(opt);
    }).catch(() => { });
  }, [params.preloadLinkId, params.preloadLinkKind, params.contextEntityId]);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors = useMemo(() => ({
    title: title.trim().length === 0 ? 'שדה חובה' : '',
    endDate: endDate.trim().length === 0 ? 'שדה חובה' : '',
    link: !linkSelected ? 'נא לבחור נכס או פרויקט' : '',
  }), [title, endDate, linkSelected]);

  const onSave = async () => {
    setSubmitted(true);
    setSaveError(null);
    if (Object.values(errors).some(Boolean)) return;

    const urgency = clientPriorityToBackendUrgency(priority);
    const statusMap: Record<StartPreset, 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
      open: 'OPEN',
      in_progress: 'IN_PROGRESS',
      completed: 'COMPLETED',
      cancelled: 'CANCELLED',
    };
    const status = statusMap[startPreset];

    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        taskType: clientTaskTypeToBackend(taskKind),
        urgency,
        status,
        propertyId: linkSelected!.kind === 'asset' ? linkSelected!.id : null,
        projectId: linkSelected!.kind === 'project' ? linkSelected!.id : null,
        startDate: startDate.trim() ? ddMmYyyyToIso(startDate) : null,
        dueDate: ddMmYyyyToIso(endDate),
        cost: cost.trim() || null,
        handlingTime: handlingTime.trim() ? parseInt(handlingTime.trim(), 10) : null,
        paymentId: linkedPaymentId ?? null,
      });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'שגיאה בשמירת המשימה');
    } finally {
      setSubmitting(false);
    }
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

            {taskKind === 'maintenance' && (
              <>
                <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
                  סוג קריאת תחזוקה
                </AppText>
                <View style={styles.kindGrid}>
                  {MAINTENANCE_CATEGORY_ORDER.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setMaintenanceCategory(cat)}
                      style={[styles.kindCard, maintenanceCategory === cat && styles.kindCardActive]}
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcons
                        name={iconName(MAINTENANCE_CATEGORY_ICONS[cat])}
                        size={20}
                        color={maintenanceCategory === cat ? Colors.onPrimary : Colors.primary}
                      />
                      <AppText
                        variant="labelSm"
                        weight={maintenanceCategory === cat ? 'bold' : 'regular'}
                        numberOfLines={2}
                        align="center"
                        style={{ color: maintenanceCategory === cat ? Colors.onPrimary : Colors.onSurfaceVariant }}
                      >
                        {MAINTENANCE_CATEGORY_LABELS[cat]}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

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
              סטטוס
            </AppText>
            <View style={styles.rowChips}>
              {(
                [
                  { key: 'open' as const, label: 'פתוח' },
                  { key: 'in_progress' as const, label: 'בטיפול' },
                  { key: 'completed' as const, label: 'הושלם' },
                  { key: 'cancelled' as const, label: 'בוטל' },
                ] as const
              ).map((o) => (
                <Pressable key={o.key} onPress={() => setStartPreset(o.key)} style={[styles.miniChip, startPreset === o.key && styles.miniChipActive]}>
                  <AppText variant="caption" weight={startPreset === o.key ? 'bold' : 'regular'} style={{ color: startPreset === o.key ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                    {o.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

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
                    ? paymentOptions.find((p) => p.id === linkedPaymentId)?.name ?? '—'
                    : 'בחרו תשלום'}
              </AppText>
            </Pressable>

            <View style={{ marginTop: Spacing.md }}>
              <AppText variant="labelSm" weight="semiBold" style={styles.dateLabel}>
                תאריך התחלה
              </AppText>
              <Pressable
                onPress={() => setDatePickerTarget('start')}
                style={styles.dateTrigger}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.onSurfaceVariant} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: startDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                  {startDate || 'בחר תאריך'}
                </AppText>
              </Pressable>
            </View>

            <View style={{ marginTop: Spacing.sm }}>
              <AppText variant="labelSm" weight="semiBold" style={styles.dateLabel}>
                תאריך יעד <AppText variant="labelSm" style={{ color: Colors.error }}>*</AppText>
              </AppText>
              <Pressable
                onPress={() => setDatePickerTarget('end')}
                style={[styles.dateTrigger, submitted && errors.endDate ? styles.dateTriggerError : null]}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.onSurfaceVariant} />
                <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right', color: endDate ? Colors.onBackground : Colors.onSurfaceMuted }}>
                  {endDate || 'בחר תאריך'}
                </AppText>
              </Pressable>
              {submitted && errors.endDate ? (
                <AppText variant="caption" style={{ color: Colors.error, textAlign: 'right', marginTop: 4 }}>{errors.endDate}</AppText>
              ) : null}
            </View>

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              עלות וזמן (אופציונלי)
            </AppText>
            <Input label='עלות (ש"ח)' value={cost} onChangeText={setCost} keyboardType="numeric" containerStyle={{ marginBottom: Spacing.sm }} />
            <Input label="זמן טיפול (שעות)" value={handlingTime} onChangeText={setHandlingTime} keyboardType="numeric" />

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

            {submitted && errors.link ? (
              <AppText variant="caption" style={{ color: Colors.error, textAlign: 'right', marginTop: Spacing.sm }}>
                {errors.link}
              </AppText>
            ) : null}
          </View>

          {saveError ? (
            <AppText variant="bodySm" style={{ color: Colors.error, textAlign: 'center', marginTop: Spacing.sm }}>
              {saveError}
            </AppText>
          ) : null}

          <Button
            label={submitting ? 'שומר...' : 'שמור משימה'}
            onPress={onSave}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.base }}
            disabled={submitting}
          />
        </ScrollView>

        <DatePickerModal
          visible={datePickerTarget !== null}
          value={datePickerTarget === 'start' ? startDate : endDate}
          onSelect={(d) => {
            if (datePickerTarget === 'start') setStartDate(d);
            else setEndDate(d);
          }}
          onClose={() => setDatePickerTarget(null)}
          title={datePickerTarget === 'start' ? 'תאריך התחלה' : 'תאריך סיום'}
        />

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
              ) : paymentOptionsLoading ? (
                <AppText variant="bodySm" color="variant">
                  טוען...
                </AppText>
              ) : paymentOptions.length === 0 ? (
                <AppText variant="bodySm" color="variant">
                  אין תשלומים לישות זו
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
                      {p.name}
                    </AppText>
                    <AppText variant="caption" color="variant">
                      {(PAYMENT_TYPE_LABELS as Record<string, string>)[p.paymentType.toLowerCase()] ?? p.paymentType} · {p.dueDate.split('-').reverse().join('/')}
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
  dateLabel: {
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
  dateTriggerError: {
    borderColor: Colors.error,
  },
});
