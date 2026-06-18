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
  validateRegisterFields,
  type RegisterFieldErrors,
} from '@/lib/auth-validation';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, backendAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const handleRegister = async () => {
    const errors = validateRegisterFields(displayName, email, phone, password, confirmPassword);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const data = await signUp(email, password, displayName, phone);

      if (data?.session) {
        // Logged in immediately — AppLayout redirects when session is ready.
      } else {
        Alert.alert(
          'נרשמת בהצלחה!',
          'שלחנו לך מייל אישור לכתובת ' + email.trim() + '. אנא אשר את המייל כדי להתחבר.',
          [{ text: 'הבנתי', onPress: () => router.replace('/(auth)/login') }],
        );
      }
    } catch (error) {
      Alert.alert(
        'הרשמה נכשלה',
        error instanceof Error ? error.message : 'לא ניתן להירשם כרגע.',
      );
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
              הרשמה
            </AppText>
            <AppText variant="bodyMd" color="variant" align="right" style={{ marginBottom: Spacing.xl }}>
              צור חשבון חדש ב-Knock
            </AppText>

            {backendAuthError ? (
              <AppText variant="bodySm" align="right" style={styles.errorText}>
                {backendAuthError}
              </AppText>
            ) : null}

            <Input
              label="שם מלא"
              placeholder="ישראל ישראלי"
              value={displayName}
              onChangeText={(value) => {
                setDisplayName(value);
                if (fieldErrors.displayName) {
                  setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
                }
              }}
              autoCapitalize="words"
              error={fieldErrors.displayName}
              containerStyle={{ marginBottom: Spacing.md }}
            />

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
              label="טלפון"
              placeholder="05XXXXXXXX"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              maxLength={10}
              error={fieldErrors.phone}
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="סיסמה"
              placeholder="לפחות 6 תווים"
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
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="אימות סיסמה"
              placeholder="הקלד שוב את הסיסמה"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              secureTextEntry={!showConfirmPassword}
              textContentType="password"
              error={fieldErrors.confirmPassword}
              iconRight={
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.onSurfaceVariant}
                />
              }
              onIconRightPress={() => setShowConfirmPassword((v) => !v)}
              containerStyle={{ marginBottom: Spacing.xl }}
            />

            <Button
              label="הרשמה"
              onPress={handleRegister}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
            />

            <View style={styles.footer}>
              <AppText variant="bodySm" color="variant">
                כבר יש לך חשבון?{' '}
              </AppText>
              <Link href="/(auth)/login" asChild>
                <Pressable disabled={loading}>
                  <AppText variant="bodySm" color="primary" weight="bold">
                    התחבר כאן
                  </AppText>
                </Pressable>
              </Link>
            </View>
          </View>

          <AppText variant="bodySm" color="variant" align="center" style={styles.terms}>
            בהרשמה אתה מסכים ל
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
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
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
  terms: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
});
