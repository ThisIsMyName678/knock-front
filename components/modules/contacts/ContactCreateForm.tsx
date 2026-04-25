import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MOCK_ENTITY_LINKS, type EntityLinkOption } from '@/lib/mocks/contracts';
import {
  emptyPermissions,
  defaultTenantPermissions,
  expandPermissionsToProjectAssets,
  assetsUnderProject,
  inviteUrlForToken,
  queueNewContact,
  checkEmailInSystem,
  type ContactListRow,
  type ContactPermissions,
  type ContactKind,
  CONTACT_KIND_LABELS,
} from '@/lib/mocks/contacts';
import { ContactPermissionsEditor } from '@/components/modules/contacts/ContactPermissionsEditor';
import {
  Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomId() {
  return `ct_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
}

const PROJECTS = MOCK_ENTITY_LINKS.filter((e) => e.kind === 'project');
const STANDALONE_ASSETS = MOCK_ENTITY_LINKS.filter((e) => e.kind === 'asset');

// Assets grouped under projects
const PROJECT_ASSET_MAP: Record<string, EntityLinkOption[]> = {};
for (const p of PROJECTS) {
  PROJECT_ASSET_MAP[p.id] = assetsUnderProject(p.id);
}
// Assets not under any project
const assetsInProjects = new Set(Object.values(PROJECT_ASSET_MAP).flat().map((a) => a.id));
const ORPHAN_ASSETS = STANDALONE_ASSETS.filter((a) => !assetsInProjects.has(a.id));

// ─── Asset Picker ─────────────────────────────────────────────────────────────

type AssetSelection =
  | { kind: 'all' }
  | { kind: 'project'; id: string }
  | { kind: 'asset'; id: string };

function selectionKey(s: AssetSelection): string {
  return s.kind === 'all' ? 'all' : `${s.kind}:${s.id}`;
}

function AssetPicker({
  value,
  onChange,
}: {
  value: AssetSelection | null;
  onChange: (s: AssetSelection | null) => void;
}) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleProject = (pid: string) =>
    setExpandedProjects((p) => ({ ...p, [pid]: !p[pid] }));

  const select = (s: AssetSelection) => {
    const key = selectionKey(s);
    onChange(value && selectionKey(value) === key ? null : s);
  };

  const isActive = (s: AssetSelection) => value ? selectionKey(value) === selectionKey(s) : false;

  const Row = ({
    label,
    sub,
    icon,
    active,
    onPress,
    indent,
  }: {
    label: string;
    sub?: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    active: boolean;
    onPress: () => void;
    indent?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.pickRow, indent && styles.pickRowIndent, active && styles.pickRowActive]}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name={active ? 'check-circle' : 'circle-outline'}
        size={20}
        color={active ? Colors.primary : Colors.onSurfaceMuted}
      />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMd" weight={active ? 'semiBold' : 'regular'} style={{ textAlign: 'right', color: active ? Colors.primary : Colors.onBackground }}>
          {label}
        </AppText>
        {sub ? (
          <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>{sub}</AppText>
        ) : null}
      </View>
      <MaterialCommunityIcons name={icon} size={18} color={active ? Colors.primary : Colors.onSurfaceMuted} />
    </Pressable>
  );

  return (
    <View style={styles.pickerWrap}>
      {/* כל הנכסים */}
      <Row
        label="כל הנכסים והפרויקטים"
        icon="home-group"
        active={isActive({ kind: 'all' })}
        onPress={() => select({ kind: 'all' })}
      />

      {/* Projects + their assets */}
      {PROJECTS.map((p) => {
        const projectAssets = PROJECT_ASSET_MAP[p.id] ?? [];
        const expanded = !!expandedProjects[p.id];
        const projectActive = isActive({ kind: 'project', id: p.id });
        return (
          <View key={p.id}>
            <View style={styles.pickProjectRow}>
              <Pressable
                onPress={() => select({ kind: 'project', id: p.id })}
                style={[styles.pickRowInner, projectActive && styles.pickRowActive]}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={projectActive ? 'check-circle' : 'circle-outline'}
                  size={20}
                  color={projectActive ? Colors.primary : Colors.onSurfaceMuted}
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" weight={projectActive ? 'semiBold' : 'regular'} style={{ textAlign: 'right', color: projectActive ? Colors.primary : Colors.onBackground }}>
                    {p.name}
                  </AppText>
                  <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                    פרויקט · {p.address}
                  </AppText>
                </View>
                <MaterialCommunityIcons name="briefcase-outline" size={18} color={projectActive ? Colors.primary : Colors.onSurfaceMuted} />
              </Pressable>
              {projectAssets.length > 0 && (
                <Pressable onPress={() => toggleProject(p.id)} style={styles.expandBtn} accessibilityRole="button" accessibilityLabel={expanded ? 'כווץ' : 'הרחב'}>
                  <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.onSurfaceMuted} />
                </Pressable>
              )}
            </View>
            {expanded && projectAssets.map((a) => (
              <Row
                key={a.id}
                label={a.name}
                sub={a.address}
                icon="home-outline"
                active={isActive({ kind: 'asset', id: a.id })}
                onPress={() => select({ kind: 'asset', id: a.id })}
                indent
              />
            ))}
          </View>
        );
      })}

      {/* Standalone assets */}
      {ORPHAN_ASSETS.map((a) => (
        <Row
          key={a.id}
          label={a.name}
          sub={a.address}
          icon="home-outline"
          active={isActive({ kind: 'asset', id: a.id })}
          onPress={() => select({ kind: 'asset', id: a.id })}
        />
      ))}
    </View>
  );
}

// ─── Email Verification Badge ─────────────────────────────────────────────────

function EmailStatusBadge({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'found' | 'not_found'>('idle');

  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('idle');
      return;
    }
    // Debounce
    const t = setTimeout(() => {
      setStatus(checkEmailInSystem(trimmed) ? 'found' : 'not_found');
    }, 400);
    return () => clearTimeout(t);
  }, [email]);

  if (status === 'idle') return null;

  return (
    <View style={[styles.emailBadge, status === 'found' ? styles.emailBadgeFound : styles.emailBadgeNotFound]}>
      <MaterialCommunityIcons
        name={status === 'found' ? 'check-circle-outline' : 'account-plus-outline'}
        size={14}
        color={status === 'found' ? Colors.success : Colors.warning}
      />
      <AppText variant="caption" style={{ color: status === 'found' ? Colors.success : Colors.warning }}>
        {status === 'found' ? 'משתמש קיים במערכת' : 'לא נמצא — יישלח לינק הזמנה'}
      </AppText>
    </View>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function ContactCreateForm({ initialData }: { initialData?: ContactListRow } = {}) {
  const insets = useSafeAreaInsets();

  // Contact kind
  const [contactKind, setContactKind] = useState<ContactKind>(() => initialData?.contactKind ?? 'role_holder');

  // Basic fields
  const [nickname, setNickname] = useState(() => initialData?.nickname ?? '');
  const [displayName, setDisplayName] = useState(() => initialData?.displayName ?? '');
  const [phone, setPhone] = useState(() => initialData?.phone ?? '');
  const [email, setEmail] = useState(() => initialData?.email ?? '');
  const [notes, setNotes] = useState(() => initialData?.notes ?? '');

  // Asset selection
  const [assetSelection, setAssetSelection] = useState<AssetSelection | null>(() => {
    if (!initialData) return null;
    if (initialData.linkKind === 'project') return { kind: 'project', id: initialData.linkId };
    if (initialData.linkKind === 'asset') return { kind: 'asset', id: initialData.linkId };
    return null;
  });

  // Permissions
  const defaultPerms = useCallback(
    (kind: ContactKind): ContactPermissions =>
      kind === 'tenant_buyer' ? defaultTenantPermissions() : emptyPermissions(),
    [],
  );
  const [permissions, setPermissions] = useState<ContactPermissions>(() =>
    initialData?.permissions ?? defaultPerms(initialData?.contactKind ?? 'role_holder'),
  );

  // When kind changes, reset permissions to the sensible default
  const onKindChange = (k: ContactKind) => {
    setContactKind(k);
    setPermissions(defaultPerms(k));
    if (k === 'tenant_buyer') setNickname('');
  };

  const emailStatus = email.trim().includes('@')
    ? checkEmailInSystem(email.trim())
    : null;
  const hasUserInSystem = emailStatus === true;

  const resolveLink = (): { linkKind: 'asset' | 'project'; linkId: string; linkLabel: string; permsByAsset?: Record<string, ContactPermissions> } | null => {
    if (!assetSelection) return null;
    if (assetSelection.kind === 'all') {
      // Use first project as primary link (mock: no real "all" concept in data model)
      const first = PROJECTS[0];
      if (!first) return null;
      return { linkKind: 'project', linkId: first.id, linkLabel: `כל הנכסים (${first.name})`, permsByAsset: expandPermissionsToProjectAssets(first.id, permissions) };
    }
    if (assetSelection.kind === 'project') {
      const p = PROJECTS.find((x) => x.id === assetSelection.id);
      if (!p) return null;
      return { linkKind: 'project', linkId: p.id, linkLabel: p.name, permsByAsset: expandPermissionsToProjectAssets(p.id, permissions) };
    }
    // asset
    const a = STANDALONE_ASSETS.find((x) => x.id === assetSelection.id);
    if (!a) return null;
    return { linkKind: 'asset', linkId: a.id, linkLabel: a.name };
  };

  const valid = useMemo(() => {
    if (!displayName.trim() || !phone.trim() || !assetSelection) return false;
    if (contactKind === 'role_holder' && !nickname.trim()) return false;
    return true;
  }, [displayName, phone, assetSelection, contactKind, nickname]);

  const onSave = () => {
    if (!valid) {
      const missing = !displayName.trim() ? 'שם' : !phone.trim() ? 'טלפון' : !assetSelection ? 'שיוך נכס/פרויקט' : contactKind === 'role_holder' && !nickname.trim() ? 'כינוי תפקיד' : '';
      Alert.alert('חסר מידע', `יש למלא: ${missing}.`);
      return;
    }
    const link = resolveLink();
    if (!link) return;

    const inviteToken = hasUserInSystem ? undefined : `inv_${randomId()}`;
    const row: ContactListRow = {
      id: randomId(),
      contactKind,
      nickname: nickname.trim(),
      displayName: displayName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim() || undefined,
      linkKind: link.linkKind,
      linkId: link.linkId,
      linkLabel: link.linkLabel,
      hasUserInSystem,
      inviteToken,
      permissions,
      permissionsByAssetId: link.permsByAsset,
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

  const projectNote = assetSelection?.kind === 'project'
    ? `שיוך לפרויקט: אותן הרשאות יחולו על כל הנכסים בפרויקט.`
    : assetSelection?.kind === 'all'
      ? 'שיוך לכל הנכסים: ההרשאות יחולו על כל הנכסים המשויכים.'
      : undefined;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title={initialData ? 'עריכת איש קשר' : 'איש קשר חדש'} showBack />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── סוג איש קשר ─── */}
          <View style={styles.card}>
            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>סוג איש קשר</AppText>
            <View style={styles.kindToggle}>
              {(['role_holder', 'tenant_buyer'] as ContactKind[]).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => onKindChange(k)}
                  style={[styles.kindBtn, contactKind === k && styles.kindBtnActive]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name={k === 'role_holder' ? 'badge-account-horizontal-outline' : 'home-account'}
                    size={20}
                    color={contactKind === k ? Colors.primary : Colors.onSurfaceMuted}
                  />
                  <AppText variant="bodyMd" weight={contactKind === k ? 'semiBold' : 'regular'} style={{ color: contactKind === k ? Colors.primary : Colors.onBackground }}>
                    {CONTACT_KIND_LABELS[k]}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ─── פרטים אישיים ─── */}
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>פרטי איש קשר</AppText>
            {contactKind === 'role_holder' && (
              <Input
                label="כינוי תפקיד (חובה)"
                placeholder="רואה חשבון / שותף / קבלן..."
                value={nickname}
                onChangeText={setNickname}
                containerStyle={{ marginBottom: Spacing.md }}
              />
            )}
            <Input label="שם מלא (חובה)" placeholder="שם ושם משפחה" value={displayName} onChangeText={setDisplayName} containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="טלפון (חובה)" placeholder="05X-XXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" containerStyle={{ marginBottom: Spacing.md }} />
            <Input
              label="אימייל"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              containerStyle={{ marginBottom: Spacing.xs }}
            />
            <EmailStatusBadge email={email} />
            <Input label="הערות" placeholder="אופציונלי" value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={{ minHeight: 72, textAlignVertical: 'top', marginTop: Spacing.sm }} />
          </View>

          {/* ─── שיוך נכס / פרויקט ─── */}
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>שיוך נכס / פרויקט (חובה)</AppText>
            <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
              בחר פרויקט (לכל נכסיו), נכס בודד, או "כל הנכסים". לחץ על החץ להרחבת נכסי פרויקט.
            </AppText>
            <AssetPicker value={assetSelection} onChange={setAssetSelection} />
          </View>

          {/* ─── הרשאות ─── */}
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <ContactPermissionsEditor value={permissions} onChange={setPermissions} footerNote={projectNote} />
          </View>

          <Button
            label="שמור איש קשר"
            onPress={onSave}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.md }}
            disabled={!valid}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base, gap: 0 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionLabel: { textAlign: 'right', marginBottom: Spacing.md },

  // Kind toggle
  kindToggle: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
  },
  kindBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  kindBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },

  // Email badge
  emailBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-end',
  },
  emailBadgeFound: { backgroundColor: '#d1fae5' },
  emailBadgeNotFound: { backgroundColor: '#fef3c7' },

  // Asset picker
  pickerWrap: { gap: Spacing.xs },
  pickRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  pickRowIndent: { marginRight: Spacing.xl, borderStyle: 'dashed' },
  pickRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer },
  pickProjectRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 0,
  },
  pickRowInner: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    marginRight: 0,
  },
  expandBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
