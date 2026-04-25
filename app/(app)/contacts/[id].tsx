import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Linking, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getContactDetailMock,
  CONTACT_KIND_LABELS,
  MODULE_LABELS,
  ALL_MODULE_KEYS,
  PERMISSION_ACTION_LABELS,
  type PermissionActionKey,
  inviteUrlForToken,
  removeContactFromSnapshot,
  telUrl,
  whatsappUrlFromPhone,
  assetsUnderProject,
} from '@/lib/mocks/contacts';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

async function openUrl(url: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      Alert.alert('לא ניתן לפתוח', url);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('שגיאה', 'לא ניתן לבצע את הפעולה');
  }
}

function summarizePermissions(contact: ReturnType<typeof getContactDetailMock>) {
  if (!contact) return [];
  const lines: string[] = [];
  for (const m of ALL_MODULE_KEYS) {
    const p = contact.permissions[m];
    const on = (['view', 'create', 'edit', 'delete'] as PermissionActionKey[]).filter((a) => p[a]);
    if (on.length) {
      lines.push(`${MODULE_LABELS[m]}: ${on.map((a) => PERMISSION_ACTION_LABELS[a]).join(', ')}`);
    }
  }
  return lines;
}

export default function ContactDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contact = useMemo(() => getContactDetailMock(String(id ?? '')), [id]);

  const permLines = useMemo(() => summarizePermissions(contact), [contact]);

  const projectAssets =
    contact?.linkKind === 'project' && contact.linkId ? assetsUnderProject(contact.linkId) : [];

  if (!contact) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="איש קשר" showBack />
        <View style={{ flex: 1, justifyContent: 'center', padding: CONTENT_HORIZONTAL_PADDING }}>
          <AppText variant="bodyMd" align="center" color="variant">
            לא נמצא איש קשר
          </AppText>
          <Button label="חזרה" onPress={() => router.back()} fullWidth style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  const onInvite = () => {
    if (!contact.inviteToken) return;
    const url = inviteUrlForToken(contact.inviteToken);
    Alert.alert('הזמנה לאפליקציה', url, [
      { text: 'סגור', style: 'cancel' },
      { text: 'שתף', onPress: () => Share.share({ message: url, title: 'הזמנת איש קשר' }).catch(() => {}) },
    ]);
  };

  const onDelete = () => {
    Alert.alert('מחיקה', 'להסיר את איש הקשר מהרשימה המקומית?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          removeContactFromSnapshot(contact.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="איש קשר" showBack />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText variant="displayMd" weight="bold" color="onPrimary">
              {contact.displayName[0]}
            </AppText>
          </View>
          <AppText variant="headingLg" weight="bold" align="center">
            {contact.displayName}
          </AppText>
          <Badge label={CONTACT_KIND_LABELS[contact.contactKind]} preset="primary" />
          {contact.contactKind === 'role_holder' && contact.nickname ? (
            <AppText variant="bodySm" color="muted" style={{ marginTop: Spacing.xs }}>
              כינוי: {contact.nickname}
            </AppText>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => openUrl(telUrl(contact.phone))} style={styles.actionBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="phone-outline" size={24} color={Colors.primary} />
            <AppText variant="labelMd" weight="semiBold" color="primary">
              טלפון
            </AppText>
          </Pressable>
          <Pressable onPress={() => openUrl(whatsappUrlFromPhone(contact.phone))} style={styles.actionBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
            <AppText variant="labelMd" weight="semiBold" color="primary">
              WhatsApp
            </AppText>
          </Pressable>
          <Pressable onPress={() => openUrl(`mailto:${contact.email}`)} style={styles.actionBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="email-outline" size={24} color={Colors.primary} />
            <AppText variant="labelMd" weight="semiBold" color="primary">
              אימייל
            </AppText>
          </Pressable>
        </View>

        <Card>
          {[
            { label: 'שיוך', value: `${contact.linkKind === 'asset' ? 'נכס' : 'פרויקט'}: ${contact.linkLabel}` },
            { label: 'טלפון', value: contact.phone },
            { label: 'אימייל', value: contact.email || '—' },
            { label: 'משתמש במערכת', value: contact.hasUserInSystem ? 'כן' : 'לא' },
          ].map((f, i, arr) => (
            <View key={f.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">
                {f.label}
              </AppText>
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
                {f.value}
              </AppText>
            </View>
          ))}
          {contact.notes ? (
            <View style={[styles.row, styles.rowBorder]}>
              <AppText variant="bodyMd" color="variant">
                הערות
              </AppText>
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                {contact.notes}
              </AppText>
            </View>
          ) : null}
        </Card>

        {projectAssets.length > 0 ? (
          <Card>
            <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.sm, textAlign: 'right' }}>
              נכסים בפרויקט (הרשאות מורחבות אוטומטית ב-mock)
            </AppText>
            {projectAssets.map((a) => (
              <AppText key={a.id} variant="bodySm" color="variant" style={{ textAlign: 'right', marginBottom: 4 }}>
                · {a.name}
              </AppText>
            ))}
          </Card>
        ) : null}

        <Card>
          <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.sm, textAlign: 'right' }}>
            הרשאות (סיכום)
          </AppText>
          {permLines.length === 0 ? (
            <AppText variant="bodySm" color="muted">
              אין הרשאות מופעלות
            </AppText>
          ) : (
            permLines.map((line, i) => (
              <AppText key={`perm-${i}`} variant="bodySm" style={{ textAlign: 'right', marginBottom: 6 }}>
                {line}
              </AppText>
            ))
          )}
          <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.sm }}>
            בעת הצטרפות עם לינק הזמנה יוגדרו אותן הרשאות (תצוגה בלבד).
          </AppText>
        </Card>

        <Button label="עריכת פרטים" onPress={() => router.push(`/(app)/contacts/edit/${contact.id}`)} fullWidth variant="secondary" size="lg" />

        {!contact.hasUserInSystem && contact.inviteToken ? (
          <Button label="הזמנה לאפליקציה (לינק)" onPress={onInvite} fullWidth variant="secondary" size="lg" />
        ) : null}

        <Button label="מחק מהרשימה" onPress={onDelete} fullWidth variant="danger" size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', gap: Spacing.sm },
  actionBtn: { alignItems: 'center', gap: 4, padding: Spacing.sm },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: Spacing.sm, gap: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
});
