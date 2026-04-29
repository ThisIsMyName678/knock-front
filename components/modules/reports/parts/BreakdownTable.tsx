import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

export type BreakdownColumn = {
  key: string;
  label: string;
  /** width in flex units (default 1) */
  flex?: number;
  align?: 'right' | 'left' | 'center';
};

export type BreakdownRow = {
  id: string;
  label: string;
  /** Optional small icon next to row label */
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor?: string;
  /** Map column key -> string|number value to render */
  values: Record<string, string | number>;
};

type Props = {
  columns: BreakdownColumn[];
  rows: BreakdownRow[];
  emptyText?: string;
};

export function BreakdownTable({ columns, rows, emptyText = 'אין נתונים בטווח שנבחר' }: Props) {
  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodySm" color="muted" align="center">{emptyText}</AppText>
      </View>
    );
  }
  return (
    <View>
      {/* Header */}
      <View style={[styles.row, styles.headerRow]}>
        <View style={styles.labelCell}>
          <AppText variant="labelSm" weight="semiBold" color="variant">סיווג</AppText>
        </View>
        {columns.map((c) => (
          <View key={c.key} style={[styles.valueCell, { flex: c.flex ?? 1 }]}>
            <AppText
              variant="labelSm"
              weight="semiBold"
              color="variant"
              align={c.align ?? 'center'}
            >
              {c.label}
            </AppText>
          </View>
        ))}
      </View>

      {/* Rows */}
      {rows.map((r, idx) => (
        <View
          key={r.id}
          style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}
        >
          <View style={styles.labelCell}>
            <View style={styles.labelInner}>
              {r.icon ? (
                <MaterialCommunityIcons
                  name={r.icon}
                  size={16}
                  color={r.iconColor ?? Colors.onSurfaceVariant}
                />
              ) : null}
              <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>
                {r.label}
              </AppText>
            </View>
          </View>
          {columns.map((c) => (
            <View key={c.key} style={[styles.valueCell, { flex: c.flex ?? 1 }]}>
              <AppText variant="bodySm" align={c.align ?? 'center'} numberOfLines={1}>
                {String(r.values[c.key] ?? '—')}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  headerRow: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  labelCell: {
    flex: 1.6,
    paddingHorizontal: Spacing.xs,
  },
  labelInner: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  valueCell: {
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: Spacing.lg,
  },
});
