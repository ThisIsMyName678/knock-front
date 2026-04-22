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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTIONS: PermissionActionKey[] = ['view', 'create', 'edit', 'delete'];

type Props = {
  value: ContactPermissions;
  onChange: (next: ContactPermissions) => void;
  /** טקסט מתחת לכותרת (למשל הרחבה לנכסים בפרויקט) */
  footerNote?: string;
};

function clonePerms(p: ContactPermissions): ContactPermissions {
  return JSON.parse(JSON.stringify(p)) as ContactPermissions;
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
      {ALL_MODULE_KEYS.map((m) => {
        const expanded = open[m];
        return (
          <View key={m} style={styles.moduleBlock}>
            <Pressable onPress={() => toggleOpen(m)} style={styles.moduleHeader} accessibilityRole="button">
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={Colors.onSurfaceVariant} />
              <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }}>
                {MODULE_LABELS[m]}
              </AppText>
            </Pressable>
            {expanded ? (
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
  moduleBlock: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, overflow: 'hidden' },
  moduleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    gap: Spacing.sm,
  },
  actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', padding: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.surface },
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
