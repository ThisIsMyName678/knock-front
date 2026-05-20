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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithPassword, resendConfirmationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleLogin = async () => {
    console.log('[Login] Button clicked');
    setEmailError(null);
    setPasswordError(null);
    
    let hasError = false;

    if (!email.trim()) {
      setEmailError('יש להזין אימייל');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('פורמט האימייל אינו תקין');
        hasError = true;
      }
    }

    if (!password) {
      setPasswordError('יש להזין סיסמה');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      console.log('[Login] Starting signInWithPassword for:', email);
      await signInWithPassword(email, password);
      console.log('[Login] signInWithPassword completed successfully');
    } catch (error) {
      console.error('[Login] Error during login:', error);
      
      if (error instanceof Error && error.message.includes('לאשר את כתובת האימייל')) {
        Alert.alert(
          'אישור אימייל נדרש',
          error.message,
          [
            { text: 'ביטול', style: 'cancel' },
            { 
              text: 'שלח שוב מייל אישור', 
              onPress: async () => {
                setResending(true);
                try {
                  await resendConfirmationEmail(email);
                  Alert.alert('נשלח!', 'מייל אישור חדש נשלח לכתובת שלך.');
                } catch (e) {
                  Alert.alert('שגיאה', 'לא ניתן לשלוח מייל אישור כרגע.');
                } finally {
                  setResending(false);
                }
              }
            }
          ]
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'לא ניתן להתחבר כרגע.';
        if (errorMessage.includes('סיסמה')) {
          setPasswordError(errorMessage);
        } else {
          setEmailError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top brand strip */}
      <View style={styles.brandStrip}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="home-city-outline" size={32} color={Colors.onPrimary} />
        </View>
        <AppText variant="displayMd" weight="extraBold" color="onPrimary" align="center">
          Knock
        </AppText>
        <AppText variant="bodyMd" color="onPrimary" align="center" style={{ opacity: 0.8 }}>
          ניהול נכסים ארגוני
        </AppText>
      </View>

      {/* Card */}
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

            <Input
              label="כתובת אימייל"
              placeholder="you@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(null);
              }}
              error={emailError || undefined}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="סיסמה"
              placeholder="הזן סיסמה"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
              }}
              error={passwordError || undefined}
              secureTextEntry={!showPassword}
              textContentType="password"
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
              onPress={() => {}}
              accessibilityRole="button"
            >
              <AppText variant="bodySm" color="primary" weight="semiBold">
                שכחת סיסמה?
              </AppText>
            </Pressable>

            <Button
              label="התחברות"
              onPress={handleLogin}
              disabled={loading || resending}
              loading={loading || resending}
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
              icon={<MaterialCommunityIcons name="google" size={20} color={Colors.primary} />}
            />

            <View style={styles.footer}>
              <AppText variant="bodySm" color="variant">
                אין לך חשבון?{' '}
              </AppText>
              <Link href="/(auth)/register" asChild>
                <Pressable>
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
    backgroundColor: Colors.primary,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
