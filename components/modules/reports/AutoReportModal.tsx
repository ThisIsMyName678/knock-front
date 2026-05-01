import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  AUTO_FREQUENCY_LABELS,
  type AutoReportConfig,
  type AutoReportFrequency,
} from '@/lib/mocks/reports';
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  CONTENT_HORIZONTAL_PADDING,
  FontFamily,
  FontSize,
  MIN_TOUCH,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

const FREQUENCIES: AutoReportFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'];

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  visible: boolean;
  config: AutoReportConfig;
  onClose: () => void;
  onSave: (config: AutoReportConfig) => void;
};

export function AutoReportModal({ visible, config, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<AutoReportConfig>(config);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft(config);
      setEmailDraft('');
      setEmailError('');
    }
  }, [visible, config]);

  const addRecipient = () => {
    const v = emailDraft.trim();
    if (!v) return;
    if (!EMAIL_RX.test(v)) {
      setEmailError('כתובת מייל לא תקינה');
      return;
    }
    if (draft.recipients.includes(v)) {
      setEmailError('כתובת זו כבר נוספה');
      return;
    }
    setDraft({ ...draft, recipients: [...draft.recipients, v] });
    setEmailDraft('');
    setEmailError('');
  };

  const removeRecipient = (email: string) => {
    setDraft({ ...draft, recipients: draft.recipients.filter((r) => r !== email) });
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <MaterialCommunityIcons name="close" size={20} color={Colors.onSurface} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="bold" style={{ textAlign: 'center' }}>
                  הגדרות דוח אוטומטי
                </AppText>
                <AppText variant="caption" color="muted" align="center">
                  שליחה תקופתית של הדוח כקובץ PDF במייל
                </AppText>
              </View>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView
              style={{ maxHeight: 560 }}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Enable */}
              <View style={styles.toggleCard}>
                <View style={styles.toggleIconWrap}>
                  <MaterialCommunityIcons
                    name="email-fast-outline"
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" weight="bold">הפעלת שליחה אוטומטית</AppText>
                  <AppText variant="caption" color="muted">
                    {draft.enabled ? 'פעיל — הדוח יישלח אוטומטית' : 'כבוי — שליחה ידנית בלבד'}
                  </AppText>
                </View>
                <Switch
                  value={draft.enabled}
                  onValueChange={(v) => setDraft({ ...draft, enabled: v })}
                  trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              </View>

              {/* Frequency */}
              <View style={styles.section}>
                <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
                  תדירות שליחה
                </AppText>
                <View style={styles.pillsRow}>
                  {FREQUENCIES.map((f) => {
                    const active = draft.frequency === f;
                    return (
                      <Pressable
                        key={f}
                        onPress={() => setDraft({ ...draft, frequency: f })}
                        style={[styles.pill, active && styles.pillActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <AppText
                          variant="labelMd"
                          weight={active ? 'bold' : 'regular'}
                          style={{ color: active ? Colors.onPrimary : Colors.primary }}
                        >
                          {AUTO_FREQUENCY_LABELS[f]}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Recipients */}
              <View style={styles.section}>
                <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
                  רשימת תפוצה
                </AppText>
                <View style={styles.emailInputRow}>
                  <TextInput
                    value={emailDraft}
                    onChangeText={(t) => {
                      setEmailDraft(t);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="הוסף כתובת מייל"
                    placeholderTextColor={Colors.onSurfaceMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.emailInput}
                    textAlign="right"
                    onSubmitEditing={addRecipient}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={addRecipient}
                    style={styles.addBtn}
                    accessibilityRole="button"
                    accessibilityLabel="הוסף נמען"
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={Colors.onPrimary} />
                  </Pressable>
                </View>
                {emailError ? (
                  <AppText variant="caption" color="error" style={{ marginTop: 4 }}>
                    {emailError}
                  </AppText>
                ) : null}
                {draft.recipients.length > 0 ? (
                  <View style={styles.chipsWrap}>
                    {draft.recipients.map((email) => (
                      <View key={email} style={styles.chip}>
                        <Pressable onPress={() => removeRecipient(email)} hitSlop={6}>
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={16}
                            color={Colors.onSurfaceVariant}
                          />
                        </Pressable>
                        <AppText variant="caption" weight="semiBold" numberOfLines={1}>
                          {email}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : (
                  <AppText variant="caption" color="muted" style={{ marginTop: Spacing.xs }}>
                    טרם נוספו נמענים
                  </AppText>
                )}
              </View>

              {/* Email subject */}
              <View style={styles.section}>
                <Input
                  label="כותרת המייל"
                  value={draft.emailSubject}
                  onChangeText={(t) => setDraft({ ...draft, emailSubject: t })}
                  placeholder='לדוגמה: דו"ח חודשי — מגדלי הים'
                />
              </View>

              {/* Email body */}
              <View style={styles.section}>
                <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>
                  תוכן המייל
                </AppText>
                <TextInput
                  value={draft.emailBody}
                  onChangeText={(t) => setDraft({ ...draft, emailBody: t })}
                  placeholder="ההודעה שתישלח לנמענים יחד עם קובץ ה-PDF"
                  placeholderTextColor={Colors.onSurfaceMuted}
                  multiline
                  numberOfLines={6}
                  style={styles.textarea}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Button label="ביטול" onPress={onClose} variant="ghost" style={{ flex: 1 }} />
              <Button
                label="שמירה"
                onPress={handleSave}
                style={{ flex: 2 }}
                icon={<MaterialCommunityIcons name="check" size={18} color={Colors.onPrimary} />}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.outlineVariant,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    gap: Spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  toggleCard: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: Spacing.xs },
  sectionLabel: { textAlign: 'right' },
  pillsRow: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  emailInputRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emailInput: {
    flex: 1,
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
  },
  addBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  chip: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    maxWidth: '100%',
  },
  textarea: {
    minHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },
});
