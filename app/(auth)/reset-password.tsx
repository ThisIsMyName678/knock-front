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

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { session, passwordRecoveryPending, updatePassword, initialized } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canReset = initialized && !!session && passwordRecoveryPending;

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('חסרים פרטים', 'יש למלא את שני שדות הסיסמה.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('סיסמה חלשה', 'הסיסמה חייבת להכיל לפחות 6 תווים.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('סיסמאות לא תואמות', 'יש לוודא ששתי הסיסמאות זהות.');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      Alert.alert('הסיסמה עודכנה', 'ניתן כעת להתחבר עם הסיסמה החדשה.', [
        {
          text: 'המשך',
          onPress: () => router.replace('/(app)'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'עדכון הסיסמה נכשל',
        error instanceof Error ? error.message : 'לא ניתן לעדכן את הסיסמה כרגע.',
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
              סיסמה חדשה
            </AppText>

            {!canReset ? (
              <>
                <AppText variant="bodyMd" color="variant" align="right" style={styles.messageText}>
                  {initialized
                    ? 'הקישור לאיפוס הסיסמה אינו תקף או שפג תוקפו. בקש קישור חדש ממסך ההתחברות.'
                    : 'טוען...'}
                </AppText>
                {initialized ? (
                  <View style={styles.footer}>
                    <Link href="/(auth)/forgot-password" asChild>
                      <Pressable>
                        <AppText variant="bodySm" color="primary" weight="bold">
                          בקש קישור חדש
                        </AppText>
                      </Pressable>
                    </Link>
                    <AppText variant="bodySm" color="variant">
                      {' · '}
                    </AppText>
                    <Link href="/(auth)/login" asChild>
                      <Pressable>
                        <AppText variant="bodySm" color="primary" weight="bold">
                          חזרה להתחברות
                        </AppText>
                      </Pressable>
                    </Link>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <AppText variant="bodyMd" color="variant" align="right" style={{ marginBottom: Spacing.xl }}>
                  הזן סיסמה חדשה לחשבון שלך.
                </AppText>

                <Input
                  label="סיסמה חדשה"
                  placeholder="לפחות 6 תווים"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
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
                  placeholder="הזן שוב את הסיסמה"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  textContentType="newPassword"
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
                  label="עדכון סיסמה"
                  onPress={handleSubmit}
                  disabled={loading}
                  loading={loading}
                  fullWidth
                  size="lg"
                />
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
  messageText: {
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
