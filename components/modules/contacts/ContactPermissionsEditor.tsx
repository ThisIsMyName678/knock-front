import React, { useState } from 'react';
import { View, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import {
  ALL_MODULE_KEYS,
  MODULE_LABELS,
  PERMISSION_ACTION_LABELS,
  type ContactPermissions,
  type PermissionActionKey,
  type PermissionModuleKey,
} from '@/lib/mocks/contacts';
import { Colors, Spacing, Radius } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTIONS: PermissionActionKey[] = ['view', 'create', 'edit', 'delete'];

type Props = {
  value: ContactPermissions;
  onChange: (next: ContactPermissions) => void;
  footerNote?: string;
};

function clonePerms(p: ContactPermissions): ContactPermissions {
  return JSON.parse(JSON.stringify(p)) as ContactPermissions;
}

type BulkMode = 'all' | 'none' | 'view_only' | 'view_edit';

const BULK_OPTIONS: { key: BulkMode; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'all', label: 'הכל', icon: 'check-all' },
  { key: 'view_only', label: 'צפייה', icon: 'eye-outline' },
  { key: 'view_edit', label: 'צפייה+עריכה', icon: 'pencil-outline' },
  { key: 'none', label: 'נקה', icon: 'close-circle-outline' },
];

function applyBulk(perms: ContactPermissions, mode: BulkMode): ContactPermissions {
  const next = clonePerms(perms);
  for (const m of ALL_MODULE_KEYS) {
    if (mode === 'all') {
      next[m] = { view: true, create: true, edit: true, delete: true };
    } else if (mode === 'none') {
      next[m] = { view: false, create: false, edit: false, delete: false };
    } else if (mode === 'view_only') {
      next[m] = { view: true, create: false, edit: false, delete: false };
    } else if (mode === 'view_edit') {
      next[m] = { view: true, create: false, edit: true, delete: false };
    }
  }
  return next;
}

export function ContactPermissionsEditor({ value, onChange, footerNote }: Props) {
  const [open, setOpen] = useState<Record<PermissionModuleKey, boolean>>(() =>
    ALL_MODULE_KEYS.reduce((acc, k) => {
      acc[k] = false;
      return acc;
    }, {} as Record<PermissionModuleKey, boolean>),
  );

  const toggleOpen = (m: PermissionModuleKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [m]: !prev[m] }));
  };

  const setAction = (m: PermissionModuleKey, a: PermissionActionKey, enabled: boolean) => {
    const next = clonePerms(value);
    next[m] = { ...next[m], [a]: enabled };
    onChange(next);
  };

  // Summary badge per module (how many actions are on)
  const moduleSummary = (m: PermissionModuleKey): string => {
    const p = value[m];
    const on = ACTIONS.filter((a) => p[a]);
    if (on.length === 0) return 'ללא גישה';
    if (on.length === ACTIONS.length) return 'גישה מלאה';
    return on.map((a) => PERMISSION_ACTION_LABELS[a]).join(', ');
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="labelMd" weight="semiBold" style={styles.title}>
        הרשאות לפי מודול
      </AppText>
      {footerNote ? (
        <AppText variant="caption" color="variant" style={styles.note}>
          {footerNote}
        </AppText>
      ) : null}

      {/* ─── Bulk toggles ─── */}
      <View style={styles.bulkRow}>
        <AppText variant="caption" color="muted" style={styles.bulkLabel}>סמן הכל:</AppText>
        <View style={styles.bulkBtns}>
          {BULK_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => onChange(applyBulk(value, opt.key))}
              style={styles.bulkBtn}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <MaterialCommunityIcons name={opt.icon} size={14} color={Colors.primary} />
              <AppText variant="caption" weight="semiBold" style={{ color: Colors.primary }}>
                {opt.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ─── Per-module rows ─── */}
      {ALL_MODULE_KEYS.map((m) => {
        const expanded = open[m];
        const hasAny = ACTIONS.some((a) => value[m][a]);
        return (
          <View key={m} style={styles.moduleBlock}>
            <Pressable onPress={() => toggleOpen(m)} style={styles.moduleHeader} accessibilityRole="button">
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={Colors.onSurfaceVariant} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="semiBold" style={{ textAlign: 'right' }}>
                  {MODULE_LABELS[m]}
                </AppText>
                <AppText variant="caption" color={hasAny ? 'primary' : 'muted'} style={{ textAlign: 'right' }}>
                  {moduleSummary(m)}
                </AppText>
              </View>
              {/* Quick per-module action buttons when collapsed */}
              {!expanded && (
                <View style={styles.quickBtns}>
                  {ACTIONS.map((a) => (
                    <Pressable
                      key={a}
                      onPress={() => setAction(m, a, !value[m][a])}
                      style={[styles.quickBtn, value[m][a] && styles.quickBtnOn]}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: value[m][a] }}
                    >
                      <AppText variant="caption" style={{ color: value[m][a] ? Colors.onPrimary : Colors.onSurfaceMuted, fontSize: 10 }}>
                        {PERMISSION_ACTION_LABELS[a]}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              )}
            </Pressable>
            {expanded ? (
              <View style={styles.expandedBody}>
                {/* Bulk row for this module */}
                <View style={styles.moduleBulkRow}>
                  <AppText variant="caption" color="muted">בחר:</AppText>
                  <Pressable
                    onPress={() => {
                      const next = clonePerms(value);
                      const allOn = ACTIONS.every((a) => next[m][a]);
                      next[m] = { view: !allOn, create: !allOn, edit: !allOn, delete: !allOn };
                      onChange(next);
                    }}
                    style={styles.moduleBulkBtn}
                    accessibilityRole="button"
                  >
                    <AppText variant="caption" weight="semiBold" style={{ color: Colors.primary }}>הכל / נקה</AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const next = clonePerms(value);
                      next[m] = { view: true, create: false, edit: false, delete: false };
                      onChange(next);
                    }}
                    style={styles.moduleBulkBtn}
                    accessibilityRole="button"
                  >
                    <AppText variant="caption" weight="semiBold" style={{ color: Colors.primary }}>צפייה בלבד</AppText>
                  </Pressable>
                </View>
                <View style={styles.actionsGrid}>
                  {ACTIONS.map((a) => (
                    <Pressable
                      key={a}
                      onPress={() => setAction(m, a, !value[m][a])}
                      style={[styles.toggleCell, value[m][a] && styles.toggleCellOn]}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: value[m][a] }}
                    >
                      <AppText variant="caption" weight={value[m][a] ? 'bold' : 'regular'} style={{ color: value[m][a] ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                        {PERMISSION_ACTION_LABELS[a]}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  title: { textAlign: 'right', marginBottom: Spacing.xs },
  note: { textAlign: 'right', marginBottom: Spacing.sm },

  // Bulk row
  bulkRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  bulkLabel: { textAlign: 'right' },
  bulkBtns: { flexDirection: RTL_ROW, gap: Spacing.xs, flexWrap: 'wrap' },
  bulkBtn: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },

  // Module blocks
  moduleBlock: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, overflow: 'hidden' },
  moduleHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    gap: Spacing.sm,
  },
  expandedBody: { padding: Spacing.sm, backgroundColor: Colors.surface, gap: Spacing.sm },
  moduleBulkRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moduleBulkBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },

  // Quick inline buttons (in collapsed row)
  quickBtns: { flexDirection: RTL_ROW, gap: 3 },
  quickBtn: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    minWidth: 32,
    alignItems: 'center',
  },
  quickBtnOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  // Actions grid (expanded)
  actionsGrid: { flexDirection: RTL_ROW, flexWrap: 'wrap', gap: Spacing.xs },
  toggleCell: {
    minWidth: '22%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  toggleCellOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});
