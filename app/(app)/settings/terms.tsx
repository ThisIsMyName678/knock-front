import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="תקנון שימוש" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        {['קבלת התנאים', 'שימוש מותר', 'שימוש אסור', 'אחריות', 'סיום שימוש', 'שינויים בתקנון'].map((title) => (
          <View key={title} style={styles.section}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.sm }}>{title}</AppText>
            <AppText variant="bodyMd" color="variant" style={{ lineHeight: 24 }}>
              תנאי השימוש בנוגע ל{title} יופיעו כאן. בשימוש באפליקציה, המשתמש מסכים לתנאים אלה במלואם.
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
