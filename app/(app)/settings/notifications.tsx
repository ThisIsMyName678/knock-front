import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { MOCK_ENTITY_LINKS } from '@/lib/mocks/contracts';
import {
  Colors,
  Spacing,
  Radius,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Multi-select: push and/or in_app can both be true */
type NotifChannels = { push: boolean; in_app: boolean };

type NotifTypeKey = 'payments' | 'contracts' | 'tasks' | 'maintenance' | 'messages';

type NotifTypeSetting = {
  enabled: boolean;
  channels: NotifChannels;
};

type EntityNotifSetting = {
  enabled: boolean;
  channels: NotifChannels;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTIF_TYPES: {
  key: NotifTypeKey;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { key: 'payments',    label: 'תשלומים',    desc: 'תשלומים צפויים ושהתקבלו',     icon: 'cash-multiple' },
  { key: 'contracts',   label: 'חוזים',      desc: 'חידוש ופקיעת חוזים',           icon: 'file-sign' },
  { key: 'tasks',       label: 'משימות',     desc: 'תזכורות לפני מועד יעד',        icon: 'checkbox-marked-circle-outline' },
  { key: 'maintenance', label: 'תחזוקה',     desc: 'עדכון קריאות שירות',           icon: 'hammer-wrench' },
  { key: 'messages',    label: 'הודעות',     desc: 'הודעות חדשות מדיירים ואנשי קשר', icon: 'message-outline' },
];

const CHANNEL_OPTIONS: {
  key: keyof NotifChannels;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { key: 'push',   label: 'נייד',   icon: 'cellphone' },
  { key: 'in_app', label: 'מערכת', icon: 'bell-outline' },
];

const DEFAULT_CHANNELS: NotifChannels = { push: true, in_app: false };

const PROJECTS = MOCK_ENTITY_LINKS.filter((e) => e.kind === 'project');
const ASSETS   = MOCK_ENTITY_LINKS.filter((e) => e.kind === 'asset');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function channelLabel(ch: NotifChannels): string {
  if (ch.push && ch.in_app) return 'נייד + מערכת';
  if (ch.push) return 'נייד בלבד';
  if (ch.in_app) return 'מערכת בלבד';
  return 'ללא';
}

// ─── ChannelChips — multi-select ──────────────────────────────────────────────

function ChannelChips({
  value,
  onChange,
  disabled,
}: {
  value: NotifChannels;
  onChange: (c: NotifChannels) => void;
  disabled?: boolean;
}) {
  const toggle = (key: keyof NotifChannels) => {
    if (disabled) return;
    const next = { ...value, [key]: !value[key] };
    // Prevent deselecting both
    if (!next.push && !next.in_app) return;
    onChange(next);
  };

  return (
    <View style={[styles.channelRow, disabled && { opacity: 0.4 }]}>
      {CHANNEL_OPTIONS.map((opt) => {
        const active = value[opt.key];
        return (
          <Pressable
            key={opt.key}
            onPress={() => toggle(opt.key)}
            style={[styles.channelChip, active && styles.channelChipActive]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <MaterialCommunityIcons
              name={active ? 'check' : opt.icon}
              size={12}
              color={active ? Colors.onPrimary : Colors.onSurfaceMuted}
            />
            <AppText
              variant="caption"
              weight={active ? 'bold' : 'regular'}
              style={{ color: active ? Colors.onPrimary : Colors.onSurfaceMuted }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── SelectAllRow ─────────────────────────────────────────────────────────────

function SelectAllRow({
  allEnabled,
  onToggle,
  count,
}: {
  allEnabled: boolean;
  onToggle: (enable: boolean) => void;
  count: number;
}) {
  return (
    <Pressable
      onPress={() => onToggle(!allEnabled)}
      style={styles.selectAllRow}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name={allEnabled ? 'checkbox-multiple-marked-outline' : 'checkbox-multiple-blank-outline'}
        size={16}
        color={Colors.primary}
      />
      <AppText variant="labelMd" color="primary" weight="semiBold">
        {allEnabled ? 'בטל הכל' : 'בחר הכל'} ({count})
      </AppText>
    </Pressable>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
      {label}
    </AppText>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();

  // Global default channels (multi-select)
  const [globalChannels, setGlobalChannels] = useState<NotifChannels>(DEFAULT_CHANNELS);

  // Per-type settings
  const [typeSettings, setTypeSettings] = useState<Record<NotifTypeKey, NotifTypeSetting>>({
    payments:    { enabled: true,  channels: { push: true,  in_app: false } },
    contracts:   { enabled: true,  channels: { push: true,  in_app: false } },
    tasks:       { enabled: true,  channels: { push: true,  in_app: false } },
    maintenance: { enabled: false, channels: { push: true,  in_app: false } },
    messages:    { enabled: true,  channels: { push: false, in_app: true  } },
  });

  // Per-entity settings
  const [entitySettings, setEntitySettings] = useState<Record<string, EntityNotifSetting>>(() => {
    const init: Record<string, EntityNotifSetting> = {};
    for (const e of MOCK_ENTITY_LINKS) {
      init[e.id] = { enabled: true, channels: { push: true, in_app: false } };
    }
    return init;
  });

  const [entitySectionOpen, setEntitySectionOpen] = useState(true);

  // ── Setters ──────────────────────────────────────────────────────────────────

  const setTypeProp = (key: NotifTypeKey, patch: Partial<NotifTypeSetting>) =>
    setTypeSettings((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const setEntityProp = (id: string, patch: Partial<EntityNotifSetting>) =>
    setEntitySettings((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // Apply global channels to all enabled types/entities
  const applyGlobalChannel = (key: keyof NotifChannels) => {
    const next = { ...globalChannels, [key]: !globalChannels[key] };
    if (!next.push && !next.in_app) return;
    setGlobalChannels(next);
    setTypeSettings((prev) => {
      const out = { ...prev } as Record<NotifTypeKey, NotifTypeSetting>;
      for (const k of Object.keys(out) as NotifTypeKey[]) {
        out[k] = { ...out[k], channels: next };
      }
      return out;
    });
    setEntitySettings((prev) => {
      const out = { ...prev };
      for (const id of Object.keys(out)) {
        out[id] = { ...out[id], channels: next };
      }
      return out;
    });
  };

  // ── Select-all for types ──────────────────────────────────────────────────────

  const allTypesEnabled = useMemo(
    () => NOTIF_TYPES.every((t) => typeSettings[t.key].enabled),
    [typeSettings],
  );

  const toggleAllTypes = (enable: boolean) =>
    setTypeSettings((prev) => {
      const out = { ...prev } as Record<NotifTypeKey, NotifTypeSetting>;
      for (const k of Object.keys(out) as NotifTypeKey[]) {
        out[k] = { ...out[k], enabled: enable };
      }
      return out;
    });

  // ── Select-all for projects ───────────────────────────────────────────────────

  const allProjectsEnabled = useMemo(
    () => PROJECTS.every((p) => entitySettings[p.id]?.enabled),
    [entitySettings],
  );

  const toggleAllProjects = (enable: boolean) =>
    setEntitySettings((prev) => {
      const out = { ...prev };
      for (const p of PROJECTS) out[p.id] = { ...out[p.id], enabled: enable };
      return out;
    });

  // ── Select-all for assets ─────────────────────────────────────────────────────

  const allAssetsEnabled = useMemo(
    () => ASSETS.every((a) => entitySettings[a.id]?.enabled),
    [entitySettings],
  );

  const toggleAllAssets = (enable: boolean) =>
    setEntitySettings((prev) => {
      const out = { ...prev };
      for (const a of ASSETS) out[a.id] = { ...out[a.id], enabled: enable };
      return out;
    });

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="הגדרות התראות" showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Global channel (multi-select) ─── */}
        <SectionTitle label="ערוץ קבלת התראות" />
        <View style={styles.card}>
          <AppText variant="bodyMd" weight="semiBold" style={styles.rowLabel}>קבל התראות באמצעות</AppText>
          <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginBottom: Spacing.sm }}>
            ניתן לבחור ערוץ אחד או שניהם. בחירה זו תחול כברירת מחדל. ניתן לשנות בנפרד לכל סוג.
          </AppText>

          <View style={styles.globalChannelBtns}>
            {CHANNEL_OPTIONS.map((opt) => {
              const active = globalChannels[opt.key];
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => applyGlobalChannel(opt.key)}
                  style={[styles.globalChannelBtn, active && styles.globalChannelBtnActive]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={26}
                    color={active ? Colors.primary : Colors.onSurfaceMuted}
                  />
                  <AppText
                    variant="bodyMd"
                    weight={active ? 'bold' : 'regular'}
                    style={{ color: active ? Colors.primary : Colors.onBackground }}
                  >
                    {opt.key === 'push' ? 'התראות לנייד (Push)' : 'התראות במערכת'}
                  </AppText>
                  <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>
                    {opt.key === 'push' ? 'גם כשהאפליקציה סגורה' : 'רק בתוך האפליקציה'}
                  </AppText>
                  <MaterialCommunityIcons
                    name={active ? 'check-circle' : 'circle-outline'}
                    size={18}
                    color={active ? Colors.primary : Colors.outlineVariant}
                    style={styles.checkIcon}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Active summary */}
          <AppText variant="caption" color="primary" style={styles.channelSummary}>
            פעיל כעת: {channelLabel(globalChannels)}
          </AppText>
        </View>

        {/* ─── Per-type notifications ─── */}
        <SectionTitle label="סוגי התראות" />
        <SelectAllRow
          allEnabled={allTypesEnabled}
          onToggle={toggleAllTypes}
          count={NOTIF_TYPES.length}
        />
        <View style={styles.card}>
          {NOTIF_TYPES.map((item, i) => {
            const setting = typeSettings[item.key];
            return (
              <View key={item.key} style={[styles.typeRow, i < NOTIF_TYPES.length - 1 && styles.rowBorder]}>
                <View style={styles.typeLeft}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={setting.enabled ? Colors.primary : Colors.onSurfaceMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.typeTopRow}>
                    <Switch
                      value={setting.enabled}
                      onValueChange={(v) => setTypeProp(item.key, { enabled: v })}
                      trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
                      thumbColor={Colors.onPrimary}
                    />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyMd" weight="semiBold" style={{ textAlign: 'right' }}>
                        {item.label}
                      </AppText>
                      <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                        {item.desc}
                      </AppText>
                    </View>
                  </View>
                  {setting.enabled && (
                    <View style={styles.typeChannelRow}>
                      <AppText variant="caption" color="muted">ערוץ:</AppText>
                      <ChannelChips
                        value={setting.channels}
                        onChange={(c) => setTypeProp(item.key, { channels: c })}
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Per-entity notifications ─── */}
        <Pressable
          onPress={() => setEntitySectionOpen((o) => !o)}
          style={styles.entitySectionHeader}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={entitySectionOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.onSurfaceVariant}
          />
          <AppText variant="labelSm" weight="semiBold" color="muted" style={{ flex: 1, textAlign: 'right' }}>
            התראות לפי נכסים ופרויקטים
          </AppText>
        </Pressable>

        {entitySectionOpen && (
          <>
            {/* Projects */}
            <View style={styles.entityGroupHeader}>
              <AppText variant="caption" color="muted" style={{ flex: 1, textAlign: 'right' }}>
                פרויקטים
              </AppText>
              <SelectAllRow
                allEnabled={allProjectsEnabled}
                onToggle={toggleAllProjects}
                count={PROJECTS.length}
              />
            </View>
            <View style={styles.card}>
              {PROJECTS.map((p, i) => {
                const s = entitySettings[p.id];
                if (!s) return null;
                return (
                  <View key={p.id} style={[styles.entityRow, i < PROJECTS.length - 1 && styles.rowBorder]}>
                    <View style={styles.entityLeft}>
                      <MaterialCommunityIcons name="briefcase-outline" size={18} color={s.enabled ? Colors.primary : Colors.onSurfaceMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.entityTopRow}>
                        <Switch
                          value={s.enabled}
                          onValueChange={(v) => setEntityProp(p.id, { enabled: v })}
                          trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
                          thumbColor={Colors.onPrimary}
                        />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMd" weight="semiBold" style={{ textAlign: 'right' }}>
                            {p.name}
                          </AppText>
                          <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                            {p.address}
                          </AppText>
                        </View>
                      </View>
                      {s.enabled && (
                        <View style={styles.typeChannelRow}>
                          <AppText variant="caption" color="muted">ערוץ:</AppText>
                          <ChannelChips
                            value={s.channels}
                            onChange={(c) => setEntityProp(p.id, { channels: c })}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Assets */}
            <View style={styles.entityGroupHeader}>
              <AppText variant="caption" color="muted" style={{ flex: 1, textAlign: 'right' }}>
                נכסים
              </AppText>
              <SelectAllRow
                allEnabled={allAssetsEnabled}
                onToggle={toggleAllAssets}
                count={ASSETS.length}
              />
            </View>
            <View style={styles.card}>
              {ASSETS.map((a, i) => {
                const s = entitySettings[a.id];
                if (!s) return null;
                return (
                  <View key={a.id} style={[styles.entityRow, i < ASSETS.length - 1 && styles.rowBorder]}>
                    <View style={styles.entityLeft}>
                      <MaterialCommunityIcons name="home-outline" size={18} color={s.enabled ? Colors.primary : Colors.onSurfaceMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.entityTopRow}>
                        <Switch
                          value={s.enabled}
                          onValueChange={(v) => setEntityProp(a.id, { enabled: v })}
                          trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
                          thumbColor={Colors.onPrimary}
                        />
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMd" weight="semiBold" style={{ textAlign: 'right' }}>
                            {a.name}
                          </AppText>
                          <AppText variant="caption" color="muted" style={{ textAlign: 'right' }}>
                            {a.address}
                          </AppText>
                        </View>
                      </View>
                      {s.enabled && (
                        <View style={styles.typeChannelRow}>
                          <AppText variant="caption" color="muted">ערוץ:</AppText>
                          <ChannelChips
                            value={s.channels}
                            onChange={(c) => setEntityProp(a.id, { channels: c })}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <AppText variant="caption" color="muted" style={{ textAlign: 'right', marginTop: Spacing.sm }}>
          שינויים נשמרים מקומית (demo). בגרסה מלאה ישמרו בשרת.
        </AppText>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.sm, gap: Spacing.xs },
  sectionLabel: {
    textAlign: 'right',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },

  rowLabel: { textAlign: 'right', marginBottom: Spacing.xs },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },

  // Global channel
  globalChannelBtns: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
  },
  globalChannelBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  globalChannelBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  checkIcon: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  channelSummary: {
    textAlign: 'right',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
  },

  // Select all row
  selectAllRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 4,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },

  // Per-type row
  typeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  typeLeft: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  typeTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeChannelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingRight: 0,
  },

  // Channel chips
  channelRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  channelChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  channelChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Entity section
  entitySectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  entityGroupHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },

  // Per-entity row
  entityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  entityLeft: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  entityTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
