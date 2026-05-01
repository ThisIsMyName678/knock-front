import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

export type TrendItem = {
  key: string;
  label: string;
  primary: { label: string; value: string };
  secondary?: { label: string; value: string };
  tertiary?: { label: string; value: string };
  /** % change vs previous month (null hides the chip) */
  delta?: number | null;
  /** Color tint for delta indicator (defaults: green for positive, red for negative) */
  positiveIsGood?: boolean;
};

type Props = {
  items: TrendItem[];
  emptyText?: string;
};

export function MonthlyTrendList({ items, emptyText = 'אין נתונים בטווח שנבחר' }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodySm" color="muted" align="center">{emptyText}</AppText>
      </View>
    );
  }
  return (
    <View style={styles.list}>
      {items.map((it, idx) => {
        const positiveIsGood = it.positiveIsGood ?? true;
        const showDelta = typeof it.delta === 'number' && Number.isFinite(it.delta);
        const isPositive = (it.delta ?? 0) >= 0;
        const goodDirection = isPositive === positiveIsGood;
        const deltaColor = goodDirection ? Colors.success : Colors.error;
        const deltaBg = goodDirection ? Colors.successContainer : Colors.errorContainer;
        return (
          <View
            key={it.key}
            style={[styles.row, idx < items.length - 1 && styles.rowBorder]}
          >
            <View style={styles.labelCol}>
              <AppText variant="bodySm" weight="semiBold">{it.label}</AppText>
              {showDelta ? (
                <View style={[styles.deltaPill, { backgroundColor: deltaBg }]}>
                  <MaterialCommunityIcons
                    name={isPositive ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={deltaColor}
                  />
                  <AppText variant="caption" weight="bold" style={{ color: deltaColor }}>
                    {Math.abs(Math.round(it.delta!))}%
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.metricCol}>
              <AppText variant="caption" color="muted">{it.primary.label}</AppText>
              <AppText variant="bodySm" weight="bold">{it.primary.value}</AppText>
            </View>
            {it.secondary ? (
              <View style={styles.metricCol}>
                <AppText variant="caption" color="muted">{it.secondary.label}</AppText>
                <AppText variant="bodySm" weight="semiBold">{it.secondary.value}</AppText>
              </View>
            ) : null}
            {it.tertiary ? (
              <View style={styles.metricCol}>
                <AppText variant="caption" color="muted">{it.tertiary.label}</AppText>
                <AppText variant="bodySm" weight="semiBold">{it.tertiary.value}</AppText>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  labelCol: {
    minWidth: 76,
    gap: 4,
  },
  metricCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  deltaPill: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  empty: {
    paddingVertical: Spacing.lg,
  },
});
