import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MOCK_ENTITY_LINKS, entitySearchText, type EntityLinkOption } from '@/lib/mocks/contracts';
import {
  emptyPermissions,
  expandPermissionsToProjectAssets,
  inviteUrlForToken,
  queueNewContact,
  type ContactListRow,
  type ContactPermissions,
} from '@/lib/mocks/contacts';
import { ContactPermissionsEditor } from '@/components/modules/contacts/ContactPermissionsEditor';
import { Colors, Spacing, Radius, Shadow, FontFamily, FontSize, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

function filterEntities(query: string): EntityLinkOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_ENTITY_LINKS;
  return MOCK_ENTITY_LINKS.filter((e) => entitySearchText(e).includes(q));
}

function randomId() {
  return `ct_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
}

export function ContactRoleCreateForm() {
  const insets = useSafeAreaInsets();
  const [nickname, setNickname] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [linkQuery, setLinkQuery] = useState('');
  const [linkSelected, setLinkSelected] = useState<EntityLinkOption | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [hasUserInSystem, setHasUserInSystem] = useState(false);
  const [permissions, setPermissions] = useState<ContactPermissions>(() => emptyPermissions());

  const entities = useMemo(() => filterEntities(linkQuery), [linkQuery]);

  const projectNote =
    linkSelected?.kind === 'project'
      ? 'שיוך לפרויקט: אותן הרשאות יחולו אוטומטית על כל הנכסים בפרויקט (ב־mock).'
      : undefined;

  const onSave = () => {
    if (!displayName.trim() || !phone.trim() || !linkSelected) {
      Alert.alert('חסר מידע', 'יש למלא שם, טלפון ושיוך נכס/פרויקט.');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('חסר מידע', 'יש למלא כינוי תפקיד (למשל: רואה חשבון).');
      return;
    }
    const inviteToken = hasUserInSystem ? undefined : `inv_${randomId()}`;
    const row: ContactListRow = {
      id: randomId(),
      contactKind: 'role_holder',
      nickname: nickname.trim(),
      displayName: displayName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim() || undefined,
      linkKind: linkSelected.kind,
      linkId: linkSelected.id,
      linkLabel: linkSelected.name,
      hasUserInSystem,
      inviteToken,
      permissions,
      permissionsByAssetId:
        linkSelected.kind === 'project' ? expandPermissionsToProjectAssets(linkSelected.id, permissions) : undefined,
    };
    queueNewContact(row);
    if (inviteToken) {
      Alert.alert('נשמר', `לינק הזמנה (דמה):\n${inviteUrlForToken(inviteToken)}`, [
        { text: 'סגור', onPress: () => router.back() },
        {
          text: 'שתף לינק',
          onPress: () => {
            Share.share({ message: inviteUrlForToken(inviteToken), title: 'הזמנת איש קשר' }).finally(() => router.back());
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  const valid = displayName.trim() && phone.trim() && linkSelected && nickname.trim();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
          </Pressable>
          <AppText variant="headingMd" weight="bold" color="onPrimary">
            הוספת בעל תפקיד
          </AppText>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Input label="כינוי תפקיד (חובה)" placeholder="רואה חשבון / שותף / מנהל פרויקט..." value={nickname} onChangeText={setNickname} containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="שם מלא (חובה)" placeholder="שם ושם משפחה" value={displayName} onChangeText={setDisplayName} containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="טלפון (חובה)" placeholder="05X-XXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="אימייל" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="הערות" placeholder="אופציונלי" value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={{ minHeight: 72, textAlignVertical: 'top' }} />

            <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              שיוך נכס / פרויקט (חובה)
            </AppText>
            <TextInput
              style={styles.entityInput}
              placeholder="חיפוש..."
              placeholderTextColor={Colors.onSurfaceMuted}
              value={linkQuery}
              onChangeText={(t) => {
                setLinkQuery(t);
                setShowSuggest(t.trim().length > 0);
                if (!t) setLinkSelected(null);
              }}
              textAlign="right"
            />
            {linkSelected && (
              <View style={styles.selectedPill}>
                <AppText variant="bodySm" style={{ flex: 1 }}>
                  {linkSelected.name} — {linkSelected.address}
                </AppText>
                <Pressable onPress={() => { setLinkSelected(null); setLinkQuery(''); }}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={Colors.onSurfaceMuted} />
                </Pressable>
              </View>
            )}
            {showSuggest && !linkSelected && entities.length > 0 && (
              <View style={styles.suggestBox}>
                {entities.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      setLinkSelected(e);
                      setLinkQuery(`${e.name}, ${e.address}`);
                      setShowSuggest(false);
                    }}
                    style={styles.suggestRow}
                  >
                    <AppText variant="bodySm">{e.name}</AppText>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.switchRow}>
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>
                יש משתמש במערכת
              </AppText>
              <Switch value={hasUserInSystem} onValueChange={setHasUserInSystem} />
            </View>
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.xs }}>
              אם אין משתמש — ייווצר לינק הזמנה (דמה) והרשאות יוגדרו בעת הצטרפות.
            </AppText>
          </View>

          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <ContactPermissionsEditor value={permissions} onChange={setPermissions} footerNote={projectNote} />
          </View>

          <Button label="שמור איש קשר" onPress={onSave} fullWidth size="lg" style={{ marginTop: Spacing.md }} disabled={!valid} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.sm,
    ...Shadow.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.sm },
  entityInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    backgroundColor: Colors.surfaceVariant,
  },
  selectedPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
  },
  suggestBox: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, marginTop: 4, overflow: 'hidden' },
  suggestRow: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.outlineLight, backgroundColor: Colors.surface },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
});
