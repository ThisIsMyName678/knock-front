import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function ContactSupportScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">יצירת קשר</AppText>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="lifebuoy" size={36} color={Colors.primary} />
          <AppText variant="headingSm" weight="bold" align="center">אנחנו כאן לעזור</AppText>
          <AppText variant="bodyMd" color="variant" align="center">נענה בתוך 24 שעות בימי עסקים</AppText>
        </View>
        <View style={styles.card}>
          <Input label="נושא" placeholder="במה נוכל לעזור?" value={subject} onChangeText={setSubject} containerStyle={{ marginBottom: Spacing.md }} />
          <Input label="הודעה" placeholder="פרט את הנושא..." value={message} onChangeText={setMessage} multiline numberOfLines={6} style={{ height: 130, textAlignVertical: 'top' }} />
        </View>
        <Button label="שלח הודעה" onPress={() => router.back()} fullWidth size="lg" />
        <View style={styles.altContact}>
          <AppText variant="bodyMd" color="variant" align="center">או פנה ישירות:</AppText>
          <AppText variant="bodyMd" color="primary" weight="semiBold" align="center">support@knocknock.co.il</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
  altContact: { gap: Spacing.xs },
});
