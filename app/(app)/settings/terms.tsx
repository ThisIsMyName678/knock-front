import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Spacing, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">תקנון שימוש</AppText>
        <View style={styles.iconBtn} />
      </View>
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
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.xl },
  section: {},
});
