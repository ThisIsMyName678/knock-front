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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setEmailError(null);
    
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

    if (hasError) return;

    setLoading(true);

    try {
      await resetPasswordForEmail(email);
      Alert.alert(
        'מייל נשלח',
        'שלחנו לך מייל עם קישור לאיפוס הסיסמה לכתובת ' + email + '. אנא בדוק את המייל שלך.',
        [
          { text: 'הבנתי', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'לא ניתן לשלוח מייל איפוס כרגע.';
      setEmailError(errorMessage);
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
              שכחתי סיסמה
            </AppText>
            <AppText variant="bodyMd" color="variant" align="right" style={{ marginBottom: Spacing.xl }}>
              הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.
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

            <Button
              label="שלח קישור לאיפוס"
              onPress={handleResetPassword}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />

            <View style={styles.footer}>
              <AppText variant="bodySm" color="variant">
                זכרת את הסיסמה?{' '}
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
  footer: {
    flexDirection: RTL_ROW,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
