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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, backendAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password || !displayName.trim()) {
      Alert.alert('חסרים פרטים', 'יש למלא את כל השדות כדי להירשם.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('סיסמה חלשה', 'הסיסמה חייבת להכיל לפחות 6 תווים.');
      return;
    }

    setLoading(true);

    try {
      const data = await signUp(email, password, displayName);
      
      if (data?.session) {
        // Logged in immediately
        // The AppLayout will handle the redirect to /(app) automatically
        // because the session state in AuthProvider will change.
      } else {
        // Email confirmation required
        Alert.alert(
          'נרשמת בהצלחה!',
          'שלחנו לך מייל אישור לכתובת ' + email + '. אנא אשר את המייל כדי להתחבר.',
          [{ text: 'הבנתי', onPress: () => router.replace('/(auth)/login') }]
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
              onChangeText={setDisplayName}
              autoCapitalize="words"
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="כתובת אימייל"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="סיסמה"
              placeholder="לפחות 6 תווים"
              value={password}
              onChangeText={setPassword}
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
                <Pressable>
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
    backgroundColor: Colors.primary,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
