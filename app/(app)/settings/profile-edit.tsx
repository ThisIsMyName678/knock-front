import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Colors,
  Spacing,
  Radius,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { useAuth } from '@/lib/auth';
import { BackendApiError, updateBackendProfile } from '@/lib/backend';
import { supabase } from '@/lib/supabase';
import {
  canEditOrganizationName,
  resolveOrganizationRoleLabel,
  resolveProfileDisplayName,
  resolveProfilePhone,
} from '@/lib/profile-labels';

type UiLang = 'he' | 'en';

const LANG_OPTIONS: {
  id: UiLang;
  title: string;
  hint: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  {
    id: 'he',
    title: 'עברית',
    hint: 'ממשק מימין לשמאל',
    icon: 'format-align-right' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
  },
  {
    id: 'en',
    title: 'English',
    hint: 'Left-to-right interface',
    icon: 'format-align-left' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
  },
];

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { backendUser, user, refreshBackendUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [uiLang, setUiLang] = useState<UiLang>('he');

  const canEditCompany = canEditOrganizationName(backendUser?.organizationRole);

  useEffect(() => {
    if (!backendUser || hydrated) {
      return;
    }

    setFullName(resolveProfileDisplayName(backendUser, user));
    setEmail(backendUser.email ?? user?.email ?? '');
    setPhone(resolveProfilePhone(backendUser, user));
    setRole(resolveOrganizationRoleLabel(backendUser.organizationRole));
    setCompany(backendUser.organization?.name ?? '');
    setUiLang(backendUser.profile?.settings?.language === 'EN' ? 'en' : 'he');
    setHydrated(true);
  }, [backendUser, user, hydrated]);

  const onSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('חסרים פרטים', 'יש להזין שם מלא.');
      return;
    }

    setSaving(true);

    try {
      await updateBackendProfile({
        displayName: fullName.trim(),
        organizationName: canEditCompany ? company.trim() : undefined,
        language: uiLang === 'en' ? 'EN' : 'HE',
      });

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      });

      if (metadataError) {
        throw metadataError;
      }

      await refreshBackendUser();
      setHydrated(false);
      Alert.alert('נשמר', 'הפרופיל עודכן בהצלחה.');
    } catch (error) {
      const message =
        error instanceof BackendApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'לא ניתן לשמור את הפרופיל כרגע.';

      Alert.alert('שגיאה', message);
    } finally {
      setSaving(false);
    }
  };

  const onUpdatePassword = () => {
    Alert.alert(
      'שינוי סיסמה',
      'עדכון הסיסמה במערכת יתחבר לשרת בהמשך. כרגע זה מסך תצוגה בלבד.',
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="עריכת פרופיל"
        subtitle="פרטים אישיים, תמונה, שפה וסיסמה"
        showBack
        onBack={() => router.replace('/(app)/settings')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
          תמונת פרופיל
        </AppText>
        <View style={styles.photoCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={48} color={Colors.primary} />
            </View>
          </View>
          <Button
            label="החלף תמונה"
            variant="secondary"
            size="sm"
            disabled
            icon={
              <MaterialCommunityIcons name="image-edit-outline" size={18} color={Colors.onSurfaceMuted} />
            }
          />
          <AppText variant="caption" color="muted" style={styles.photoHint}>
            העלאת תמונת פרופיל תהיה זמינה בגרסה הבאה
          </AppText>
        </View>

        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
          פרטים אישיים
        </AppText>
        <View style={styles.fieldsCard}>
          <Input
            label="שם מלא"
            value={fullName}
            onChangeText={setFullName}
            placeholder="הקלד שם מלא"
            autoComplete="name"
          />
          <Input
            label="אימייל"
            value={email}
            editable={false}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            hint="לא ניתן לשנות את כתובת האימייל"
          />
          <Input
            label="טלפון"
            value={phone}
            onChangeText={setPhone}
            placeholder="050-0000000"
            keyboardType="phone-pad"
            autoComplete="tel"
            hint="נשמר בפרופיל האישי שלך"
          />
          <Input
            label="תפקיד בארגון"
            value={role}
            editable={false}
            placeholder="—"
            hint="תפקיד המערכת בארגון — לא ניתן לעריכה"
          />
          <Input
            label="חברה / ארגון"
            value={company}
            onChangeText={setCompany}
            editable={canEditCompany}
            placeholder="שם הארגון"
            hint={
              canEditCompany
                ? undefined
                : 'רק בעל הארגון יכול לערוך את שם החברה'
            }
          />
        </View>

        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
          שפה וממשק
        </AppText>
        <View style={styles.langCard}>
          {LANG_OPTIONS.map((opt, i) => {
            const selected = uiLang === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setUiLang(opt.id)}
                style={({ pressed }) => [
                  styles.langRow,
                  pressed && { backgroundColor: Colors.surfaceVariant },
                  i < LANG_OPTIONS.length - 1 && styles.langRowBorder,
                  selected && styles.langRowSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`שפת ממשק: ${opt.title}`}
              >
                <MaterialCommunityIcons name={opt.icon} size={22} color={Colors.primary} />
                <View style={styles.langTextCol}>
                  <AppText variant="bodyMd" weight="semiBold" style={styles.langTitle}>
                    {opt.title}
                  </AppText>
                  <AppText variant="caption" color="muted">
                    {opt.hint}
                  </AppText>
                </View>
                <MaterialCommunityIcons
                  name={selected ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={selected ? Colors.primary : Colors.onSurfaceMuted}
                />
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" color="muted" style={styles.langFootnote}>
          שפת הממשק נשמרת בהגדרות החשבון. תרגום מלא של המסכים יתווסף בהמשך.
        </AppText>

        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
          שינוי סיסמה
        </AppText>
        <View style={styles.fieldsCard}>
          <Input
            label="סיסמה נוכחית"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="הזן סיסמה נוכחית"
            secureTextEntry={!showCurrentPw}
            textContentType="password"
            autoComplete="password"
            editable={false}
            iconRight={
              <MaterialCommunityIcons
                name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.onSurfaceMuted}
              />
            }
            onIconRightPress={() => setShowCurrentPw((v) => !v)}
          />
          <Input
            label="סיסמה חדשה"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="לפחות 8 תווים"
            secureTextEntry={!showNewPw}
            textContentType="newPassword"
            autoComplete="password-new"
            editable={false}
            iconRight={
              <MaterialCommunityIcons
                name={showNewPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.onSurfaceMuted}
              />
            }
            onIconRightPress={() => setShowNewPw((v) => !v)}
          />
          <Input
            label="אימות סיסמה חדשה"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="הזן שוב את הסיסמה החדשה"
            secureTextEntry={!showConfirmPw}
            textContentType="newPassword"
            autoComplete="password-new"
            editable={false}
            iconRight={
              <MaterialCommunityIcons
                name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.onSurfaceMuted}
              />
            }
            onIconRightPress={() => setShowConfirmPw((v) => !v)}
            containerStyle={styles.lastField}
            hint="שינוי סיסמה יתווסף בגרסה הבאה"
          />
        </View>

        <Button label="עדכן סיסמה" variant="secondary" fullWidth disabled onPress={onUpdatePassword} />
        <Button
          label="שמור שינויים בפרופיל"
          onPress={onSave}
          fullWidth
          loading={saving}
          disabled={saving || !hydrated}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.sm,
  },
  sectionLabel: {
    textAlign: 'right',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  photoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.xs },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.outlineLight,
  },
  photoHint: { textAlign: 'center' },
  fieldsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  langCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  langRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  langRowSelected: {
    backgroundColor: Colors.primaryContainer,
  },
  langTextCol: { flex: 1, alignItems: 'flex-end' },
  langTitle: { textAlign: 'right' },
  langFootnote: { textAlign: 'right', paddingHorizontal: 4 },
  lastField: { marginBottom: 0 },
});
