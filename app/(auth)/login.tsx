import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import { useAuth } from '@/lib/auth';
import {
  hasFieldErrors,
  isEmailConfirmationRequired,
  isValidEmail,
  RESEND_CONFIRMATION_SUCCESS_MESSAGE,
  validateLoginFields,
  type LoginFieldErrors,
} from '@/lib/auth-validation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithPassword, resendConfirmationEmail, backendAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: !trimmedEmail
          ? 'יש להזין כתובת אימייל.'
          : 'יש להזין כתובת אימייל תקינה.',
      }));
      return;
    }

    setResending(true);

    try {
      await resendConfirmationEmail(trimmedEmail);
      Alert.alert('בקשה נשלחה', RESEND_CONFIRMATION_SUCCESS_MESSAGE);
    } catch (error) {
      Alert.alert(
        'שגיאה',
        error instanceof Error ? error.message : 'לא ניתן לשלוח מייל אישור כרגע.',
      );
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async () => {
    const errors = validateLoginFields(email, password);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await signInWithPassword(email, password);
    } catch (error) {
      if (isEmailConfirmationRequired(error)) {
        Alert.alert(
          'אישור אימייל נדרש',
          error instanceof Error ? error.message : 'יש לאשר את כתובת האימייל לפני ההתחברות.',
          [
            { text: 'ביטול', style: 'cancel' },
            {
              text: resending ? 'שולח...' : 'שלח שוב מייל אישור',
              onPress: () => {
                void handleResendConfirmation();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'התחברות נכשלה',
          error instanceof Error ? error.message : 'לא ניתן להתחבר כרגע.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.brandStrip}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="home-city-outline" size={32} color={Colors.accent} />
        </View>
        <AppText variant="displayMd" weight="extraBold" align="center">
          Knock
        </AppText>
        <AppText variant="bodyMd" color="variant" align="center">
          ניהול נכסים ארגוני
        </AppText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cardWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.cardScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <AppText variant="headingLg" weight="bold" align="right" style={{ marginBottom: Spacing.xs }}>
              התחברות
            </AppText>
            <AppText variant="bodyMd" color="variant" align="right" style={{ marginBottom: Spacing.xl }}>
              ברוך הבא! אנא הזן את פרטיך.
            </AppText>

            {backendAuthError ? (
              <AppText variant="bodySm" align="right" style={styles.errorText}>
                {backendAuthError}
              </AppText>
            ) : null}

            <Input
              label="כתובת אימייל"
              placeholder="you@example.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              error={fieldErrors.email}
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="סיסמה"
              placeholder="הזן סיסמה"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry={!showPassword}
              textContentType="password"
              error={fieldErrors.password}
              iconRight={
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.onSurfaceVariant}
                />
              }
              onIconRightPress={() => setShowPassword((v) => !v)}
              containerStyle={{ marginBottom: Spacing.sm }}
            />

            <Pressable
              style={styles.forgotRow}
              onPress={() => router.push('/(auth)/forgot-password')}
              accessibilityRole="button"
              disabled={loading || resending}
            >
              <AppText variant="bodySm" color="primary" weight="semiBold">
                שכחת סיסמה?
              </AppText>
            </Pressable>

            <Button
              label="התחברות"
              onPress={handleLogin}
              disabled={loading || resending}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color="muted" align="center" style={{ paddingHorizontal: Spacing.sm }}>
                או
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <Button
              label="המשך עם Google"
              onPress={() => {}}
              variant="secondary"
              fullWidth
              size="lg"
              disabled={loading || resending}
              icon={<MaterialCommunityIcons name="google" size={20} color={Colors.primary} />}
            />

            <View style={styles.footer}>
              <AppText variant="bodySm" color="variant">
                אין לך חשבון?{' '}
              </AppText>
              <Link href="/(auth)/register" asChild>
                <Pressable disabled={loading || resending}>
                  <AppText variant="bodySm" color="primary" weight="bold">
                    הירשם כאן
                  </AppText>
                </Pressable>
              </Link>
            </View>
          </View>

          <AppText variant="bodySm" color="variant" align="center" style={styles.terms}>
            בהתחברות אתה מסכים ל
            <AppText variant="bodySm" color="primary" weight="semiBold">
              תנאי השימוש
            </AppText>
            {' '}ול{' '}
            <AppText variant="bodySm" color="primary" weight="semiBold">
              מדיניות הפרטיות
            </AppText>
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  brandStrip: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardWrapper: { flex: 1 },
  cardScroll: {
    flexGrow: 1,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  forgotRow: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: RTL_ROW,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  dividerRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineLight,
  },
  terms: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
});
