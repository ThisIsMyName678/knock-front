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
import { router } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '@/constants/tokens';
import { useAuth } from '@/lib/auth';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setPasswordError(null);
    setConfirmPasswordError(null);
    
    let hasError = false;

    if (!password) {
      setPasswordError('יש להזין סיסמה');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('הסיסמה חייבת להכיל לפחות 6 תווים');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('יש להזין אימות סיסמה');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('הסיסמאות לא תואמות');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      await updatePassword(password);
      Alert.alert(
        'הסיסמה עודכנה',
        'הסיסמה שלך עודכנה בהצלחה. מעביר למסך התחברות...',
      );
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'לא ניתן לעדכן את הסיסמה כרגע.';
      setPasswordError(errorMessage);
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
              איפוס סיסמה
            </AppText>
            <AppText variant="bodyMd" color="variant" align="right" style={{ marginBottom: Spacing.xl }}>
              הזן סיסמה חדשה לחשבון שלך.
            </AppText>

            <Input
              label="סיסמה חדשה"
              placeholder="לפחות 6 תווים"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
              }}
              error={passwordError || undefined}
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
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError(null);
              }}
              error={confirmPasswordError || undefined}
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
              label="עדכן סיסמה"
              onPress={handleResetPassword}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
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
});
