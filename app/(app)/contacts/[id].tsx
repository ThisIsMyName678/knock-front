import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

async function openUrl(url: string) {
  try { const ok = await Linking.canOpenURL(url); if (!ok) { Alert.alert('לא ניתן', url); return; } await Linking.openURL(url); } catch { Alert.alert('שגיאה', 'לא ניתן לבצע'); }
}

export default function ContactDetailScreen() {
  const insets = useSafeAreaInsets();
  const contact = { name: 'יוסי כהן', role: 'דייר', phone: '050-1234567', email: 'yossi@example.com', project: 'מגדלי הים' };
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} /></Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">איש קשר</AppText>
        <Pressable style={styles.iconBtn} accessibilityRole="button"><MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.onPrimary} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><AppText variant="displayMd" weight="bold" color="onPrimary">{contact.name[0]}</AppText></View>
          <AppText variant="headingLg" weight="bold" align="center">{contact.name}</AppText>
          <Badge label={contact.role} preset="primary" />
        </View>
        <View style={styles.actionsRow}>
          <Pressable onPress={() => openUrl(`tel:${contact.phone.replace(/[^\d+]/g, '')}`)} style={styles.actionBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="phone-outline" size={24} color={Colors.primary} />
            <AppText variant="labelMd" weight="semiBold" color="primary">טלפון</AppText>
          </Pressable>
          <Pressable onPress={() => openUrl(`whatsapp://send?phone=972${contact.phone.replace(/[^\d]/g, '').slice(1)}`)} style={styles.actionBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="whatsapp" size={24} color={Colors.primary} />
            <AppText variant="labelMd" weight="semiBold" color="primary">WhatsApp</AppText>
          </Pressable>
          <Pressable onPress={() => openUrl(`mailto:${contact.email}`)} style={styles.actionBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="email-outline" size={24} color={Colors.primary} />
            <AppText variant="labelMd" weight="semiBold" color="primary">אימייל</AppText>
          </Pressable>
        </View>
        <Card>
          {[{ label: 'טלפון', value: contact.phone }, { label: 'אימייל', value: contact.email }, { label: 'פרויקט', value: contact.project }].map((f, i, arr) => (
            <View key={f.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">{f.label}</AppText>
              <AppText variant="bodyMd" weight="semiBold">{f.value}</AppText>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  profileCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionsRow: { flexDirection: 'row-reverse', gap: Spacing.md },
  actionBtn: { flex: 1, alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineVariant },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
