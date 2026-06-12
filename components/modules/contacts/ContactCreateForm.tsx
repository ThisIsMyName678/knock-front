import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  emptyPermissions,
  defaultTenantPermissions,
  checkEmailInSystem,
  type ContactListRow,
  type ContactPermissions,
  type ContactKind,
  CONTACT_KIND_LABELS,
} from '@/lib/mocks/contacts';
import { createContact, updateContact } from '@/lib/api/contacts';
import { toApiContactKind, toApiLinkKind } from '@/lib/adapters/contact-permissions';
import { listProjects, projectAddressLabel, type BackendProject } from '@/lib/api/projects';
import { listProperties, propertyAddressLabel, type BackendProperty } from '@/lib/api/properties';
import { BackendApiError } from '@/lib/backend';
import { ContactPermissionsEditor } from '@/components/modules/contacts/ContactPermissionsEditor';
import {
  Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

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
  loading,
  projects,
  propertiesByProject,
  orphanProperties,
}: {
  value: AssetSelection | null;
  onChange: (s: AssetSelection | null) => void;
  loading: boolean;
  projects: BackendProject[];
  propertiesByProject: Record<string, BackendProperty[]>;
  orphanProperties: BackendProperty[];
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

  if (loading) {
    return (
      <View style={styles.pickerLoading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

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
      {projects.map((p) => {
        const projectAssets = propertiesByProject[p.id] ?? [];
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
                    פרויקט · {projectAddressLabel(p)}
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
                sub={propertyAddressLabel(a)}
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
      {orphanProperties.map((a) => (
        <Row
          key={a.id}
          label={a.name}
          sub={propertyAddressLabel(a)}
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

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initialData;

  // Projects/properties for the asset picker (create flow only)
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [properties, setProperties] = useState<BackendProperty[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(!isEdit);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const [projectsRes, propertiesRes] = await Promise.all([listProjects(), listProperties()]);
        if (cancelled) return;
        setProjects(projectsRes);
        setProperties(propertiesRes);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof BackendApiError ? e.message : 'טעינת רשימת הנכסים והפרויקטים נכשלה.';
        Alert.alert('שגיאה', message);
      } finally {
        if (!cancelled) setAssetsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isEdit]);

  const propertiesByProject = useMemo(() => {
    const map: Record<string, BackendProperty[]> = {};
    for (const p of properties) {
      if (!p.projectId) continue;
      (map[p.projectId] ??= []).push(p);
    }
    return map;
  }, [properties]);

  const orphanProperties = useMemo(
    () => properties.filter((p) => !p.projectId),
    [properties],
  );

  const resolveLink = (): { linkKind: 'asset' | 'project'; linkId: string; linkLabel: string } | null => {
    if (!assetSelection) return null;
    if (assetSelection.kind === 'all') {
      // Use first project as primary link (no real "all" concept in the data model)
      const first = projects[0];
      if (!first) return null;
      return { linkKind: 'project', linkId: first.id, linkLabel: `כל הנכסים (${first.name})` };
    }
    if (assetSelection.kind === 'project') {
      const p = projects.find((x) => x.id === assetSelection.id);
      if (!p) return null;
      return { linkKind: 'project', linkId: p.id, linkLabel: p.name };
    }
    // asset
    const a = properties.find((x) => x.id === assetSelection.id);
    if (!a) return null;
    return { linkKind: 'asset', linkId: a.id, linkLabel: a.name };
  };

  const fieldErrors = useMemo(() => ({
    nickname: contactKind === 'role_holder' && !nickname.trim() ? 'שדה חובה' : '',
    displayName: !displayName.trim() ? 'שדה חובה' : '',
    phone: !phone.trim() ? 'שדה חובה' : '',
    assetSelection: !isEdit && !assetSelection ? 'יש לבחור נכס או פרויקט' : '',
  }), [contactKind, nickname, displayName, phone, assetSelection, isEdit]);

  const valid = useMemo(() => Object.values(fieldErrors).every((e) => !e), [fieldErrors]);

  const onSaveEdit = async () => {
    if (!initialData) return;
    setSaving(true);
    try {
      await updateContact(initialData.id, {
        contactKind: toApiContactKind(contactKind),
        nickname: nickname.trim() || undefined,
        displayName: displayName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        permissions,
      });
      router.back();
    } catch (e) {
      const message = e instanceof BackendApiError ? e.message : 'שמירת איש הקשר נכשלה.';
      Alert.alert('שגיאה', message);
    } finally {
      setSaving(false);
    }
  };

  const onSaveCreate = async () => {
    const link = resolveLink();
    if (!link) return;

    setSaving(true);
    try {
      const created = await createContact({
        contactKind: toApiContactKind(contactKind),
        nickname: nickname.trim() || undefined,
        displayName: displayName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        linkKind: toApiLinkKind(link.linkKind),
        linkId: link.linkId,
        permissions,
      });

      router.replace('/(app)/contacts');

      if (created.inviteToken) {
        Alert.alert('נשמר', 'איש הקשר נוצר ונשלחה הזמנה להתחבר למערכת.');
      }
    } catch (e) {
      const message = e instanceof BackendApiError ? e.message : 'שמירת איש הקשר נכשלה.';
      Alert.alert('שגיאה', message);
    } finally {
      setSaving(false);
    }
  };

  const onSave = () => {
    setSubmitted(true);
    if (!valid) return;
    if (isEdit) {
      onSaveEdit();
    } else {
      onSaveCreate();
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
                label="כינוי תפקיד"
                required
                placeholder="רואה חשבון / שותף / קבלן..."
                value={nickname}
                onChangeText={setNickname}
                error={submitted ? fieldErrors.nickname : ''}
                containerStyle={{ marginBottom: Spacing.md }}
              />
            )}
            <Input label="שם מלא" required placeholder="שם ושם משפחה" value={displayName} onChangeText={setDisplayName} error={submitted ? fieldErrors.displayName : ''} containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="טלפון" required placeholder="05X-XXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={submitted ? fieldErrors.phone : ''} containerStyle={{ marginBottom: Spacing.md }} />
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
          {isEdit ? (
            <View style={[styles.card, { marginTop: Spacing.md }]}>
              <AppText variant="labelMd" weight="semiBold" style={styles.sectionLabel}>שיוך נכס / פרויקט</AppText>
              <AppText variant="bodyMd" style={{ textAlign: 'right' }}>{initialData?.linkLabel}</AppText>
              <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.xs }}>
                שינוי השיוך אינו נתמך כאן.
              </AppText>
            </View>
          ) : (
            <View style={[styles.card, { marginTop: Spacing.md, borderColor: submitted && fieldErrors.assetSelection ? Colors.error : Colors.outlineVariant }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: Spacing.md }}>
                <AppText variant="labelMd" weight="semiBold" style={[styles.sectionLabel, { marginBottom: 0 }]}>שיוך נכס / פרויקט</AppText>
                <AppText variant="labelMd" weight="bold" style={{ color: Colors.error }}>*</AppText>
              </View>
              <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
                בחר פרויקט (לכל נכסיו), נכס בודד, או "כל הנכסים". לחץ על החץ להרחבת נכסי פרויקט.
              </AppText>
              <AssetPicker
                value={assetSelection}
                onChange={setAssetSelection}
                loading={assetsLoading}
                projects={projects}
                propertiesByProject={propertiesByProject}
                orphanProperties={orphanProperties}
              />
              {submitted && fieldErrors.assetSelection ? (
                <AppText variant="caption" color="error" style={{ textAlign: 'right', marginTop: Spacing.xs }}>{fieldErrors.assetSelection}</AppText>
              ) : null}
            </View>
          )}

          {/* ─── הרשאות ─── */}
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <ContactPermissionsEditor value={permissions} onChange={setPermissions} footerNote={projectNote} />
          </View>

          <Button
            label="שמור איש קשר"
            onPress={onSave}
            fullWidth
            size="lg"
            disabled={saving}
            style={{ marginTop: Spacing.md }}
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
    flexDirection: RTL_ROW,
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
    flexDirection: RTL_ROW,
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
  pickerLoading: { paddingVertical: Spacing.lg, alignItems: 'center' },
  pickRow: {
    flexDirection: RTL_ROW,
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
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 0,
  },
  pickRowInner: {
    flex: 1,
    flexDirection: RTL_ROW,
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
