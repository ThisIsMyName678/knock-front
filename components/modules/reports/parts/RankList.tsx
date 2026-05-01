import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Tone = 'income' | 'expense';

type Props = {
  items: { entityId: string; entityName: string; amount: number }[];
  formatValue: (n: number) => string;
  tone: Tone;
  emptyText?: string;
};

export function RankList({ items, formatValue, tone, emptyText = 'אין נתונים בטווח שנבחר' }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodySm" color="muted" align="center">{emptyText}</AppText>
      </View>
    );
  }

  const valueColor = tone === 'income' ? Colors.success : Colors.error;
  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <View style={styles.list}>
      {items.map((item, idx) => {
        const pct = (item.amount / max) * 100;
        return (
          <View key={item.entityId} style={styles.row}>
            <View style={[styles.rank, { backgroundColor: Colors.primaryContainer }]}>
              <AppText variant="labelSm" weight="bold" color="primary">{idx + 1}</AppText>
            </View>
            <View style={styles.nameCol}>
              <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>
                {item.entityName}
              </AppText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${pct}%`, backgroundColor: valueColor },
                  ]}
                />
              </View>
            </View>
            <AppText
              variant="bodySm"
              weight="bold"
              style={{ color: valueColor, minWidth: 80, textAlign: 'left' }}
            >
              {formatValue(item.amount)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  row: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
    gap: 4,
  },
  barTrack: {
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  empty: {
    paddingVertical: Spacing.lg,
  },
});
