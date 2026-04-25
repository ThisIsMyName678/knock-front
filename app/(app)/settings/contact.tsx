import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function ContactSupportScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="יצירת קשר" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
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
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
  altContact: { gap: Spacing.xs },
});
