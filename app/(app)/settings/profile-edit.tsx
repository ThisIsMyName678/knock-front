import React, { useState } from 'react';
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
    icon: 'format-textdirection-r-to-l',
  },
  {
    id: 'en',
    title: 'English',
    hint: 'Left-to-right interface',
    icon: 'format-textdirection-l-to-r',
  },
];

/** ערכי התחלה — תואמים למסך ההגדרות (תצוגה בלבד) */
const INITIAL = {
  fullName: 'ניר',
  email: 'manager@knocknock.co.il',
  phone: '050-1234567',
  role: 'מנהל נכסים',
  company: 'Knock Asset Management',
};

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(INITIAL.fullName);
  const [email, setEmail] = useState(INITIAL.email);
  const [phone, setPhone] = useState(INITIAL.phone);
  const [role, setRole] = useState(INITIAL.role);
  const [company, setCompany] = useState(INITIAL.company);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [uiLang, setUiLang] = useState<UiLang>('he');

  const onChangePhoto = () => {
    Alert.alert('תמונת פרופיל', 'בחירת תמונה מהמצלמה או מהגלריה תתווסף בהמשך.');
  };

  const onSave = () => {
    Alert.alert(
      'שמירת פרופיל',
      'הטופס מוצג לצורך עיצוב בלבד. שמירה לשרת תחובר בהמשך.',
    );
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
        onBack={() => router.replace('/(app)/')}
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
            <Pressable
              onPress={onChangePhoto}
              style={styles.cameraFab}
              accessibilityRole="button"
              accessibilityLabel="החלפת תמונת פרופיל"
            >
              <MaterialCommunityIcons name="camera" size={18} color={Colors.onPrimary} />
            </Pressable>
          </View>
          <Button
            label="החלף תמונה"
            variant="secondary"
            size="sm"
            onPress={onChangePhoto}
            icon={
              <MaterialCommunityIcons name="image-edit-outline" size={18} color={Colors.primary} />
            }
          />
          <AppText variant="caption" color="muted" style={styles.photoHint}>
            JPG או PNG, עד 5MB (יופעל עם חיבור לשרת)
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
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="טלפון"
            value={phone}
            onChangeText={setPhone}
            placeholder="050-0000000"
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <Input
            label="תפקיד"
            value={role}
            onChangeText={setRole}
            placeholder="למשל: מנהל נכסים"
          />
          <Input
            label="חברה / ארגון"
            value={company}
            onChangeText={setCompany}
            placeholder="שם הארגון"
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
          החלפת שפת המערכת המלאה (כולל תרגום מסכים) תתחבר לשכבת i18n בהמשך.
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
            iconRight={
              <MaterialCommunityIcons
                name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.onSurfaceVariant}
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
            iconRight={
              <MaterialCommunityIcons
                name={showNewPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.onSurfaceVariant}
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
            iconRight={
              <MaterialCommunityIcons
                name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.onSurfaceVariant}
              />
            }
            onIconRightPress={() => setShowConfirmPw((v) => !v)}
            containerStyle={styles.lastField}
            hint="השתמש בסיסמה חזקה שאינה בשימוש באתרים אחרים."
          />
        </View>

        <Button label="עדכן סיסמה" variant="secondary" fullWidth onPress={onUpdatePassword} />
        <Button label="שמור שינויים בפרופיל" onPress={onSave} fullWidth />
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
  cameraFab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
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

