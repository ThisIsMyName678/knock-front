import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="מדיניות פרטיות" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        {['איסוף מידע', 'שימוש במידע', 'אבטחת מידע', 'זכויות המשתמש', 'עוגיות', 'יצירת קשר'].map((title) => (
          <View key={title} style={styles.section}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>{title}</AppText>
            <AppText variant="bodyMd" color="variant" style={{ lineHeight: 24 }}>
              טקסט מדיניות הפרטיות בנוגע ל{title} יופיע כאן. המשמעות היא שהמידע שנאסף ישמש אך ורק למטרות המפורטות ולא יועבר לצד שלישי ללא הסכמה.
            </AppText>
          </View>
        ))}
        <AppText variant="bodySm" color="muted" align="center">עדכון אחרון: 01/01/2025</AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.xl },
  section: {},
});
