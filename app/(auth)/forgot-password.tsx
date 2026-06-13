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
import { PASSWORD_RESET_SUCCESS_MESSAGE } from '@/lib/auth-linking';
import { isValidEmail } from '@/lib/auth-validation';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('חסרים פרטים', 'יש להזין כתובת אימייל.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('אימייל לא תקין', 'יש להזין כתובת אימייל תקינה.');
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
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
              איפוס סיסמה
            </AppText>

            {submitted ? (
              <>
                <AppText variant="bodyMd" color="variant" align="right" style={styles.successText}>
                  {PASSWORD_RESET_SUCCESS_MESSAGE}
                </AppText>
                <Button
                  label="חזרה להתחברות"
                  onPress={() => router.replace('/(auth)/login')}
                  fullWidth
                  size="lg"
                  style={{ marginTop: Spacing.xl }}
                />
              </>
            ) : (
              <>
                <AppText variant="bodyMd" color="variant" align="right" style={{ marginBottom: Spacing.xl }}>
                  הזן את כתובת האימייל שלך ונשלח אליך קישור לאיפוס הסיסמה.
                </AppText>

                <Input
                  label="כתובת אימייל"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  containerStyle={{ marginBottom: Spacing.xl }}
                />

                <Button
                  label="שלח קישור לאיפוס סיסמה"
                  onPress={handleSubmit}
                  disabled={loading}
                  loading={loading}
                  fullWidth
                  size="lg"
                />

                <View style={styles.footer}>
                  <Link href="/(auth)/login" asChild>
                    <Pressable>
                      <AppText variant="bodySm" color="primary" weight="bold">
                        חזרה להתחברות
                      </AppText>
                    </Pressable>
                  </Link>
                </View>
              </>
            )}
          </View>
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
  successText: {
    marginTop: Spacing.md,
    lineHeight: 24,
  },
  footer: {
    flexDirection: RTL_ROW,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
