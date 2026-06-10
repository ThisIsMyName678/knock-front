import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBone } from './SkeletonBone';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Variant = 'table' | 'payment' | 'document';

type Props = {
  variant?: Variant;
  style?: ViewStyle;
};

export function ListRowSkeleton({ variant = 'table', style }: Props) {
  if (variant === 'payment') {
    return (
      <View style={[styles.paymentCard, style]}>
        <View style={styles.paymentTop}>
          <SkeletonBone width={72} height={22} borderRadius={Radius.full} />
          <SkeletonBone width="55%" height={16} />
        </View>
        <View style={styles.paymentBottom}>
          <SkeletonBone width={80} height={12} />
          <SkeletonBone width={96} height={18} />
        </View>
      </View>
    );
  }

  if (variant === 'document') {
    return (
      <View style={[styles.docCard, style]}>
        <View style={styles.docRow}>
          <SkeletonBone width={40} height={40} borderRadius={Radius.md} />
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <SkeletonBone width="70%" height={15} style={{ alignSelf: 'flex-end' }} />
            <SkeletonBone width="45%" height={12} style={{ alignSelf: 'flex-end' }} />
          </View>
          <SkeletonBone width={28} height={28} borderRadius={Radius.md} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tableRow, style]}>
      <View style={styles.tableCells}>
        <SkeletonBone width="78%" height={14} style={{ alignSelf: 'flex-end' }} />
        <SkeletonBone width="65%" height={12} style={{ alignSelf: 'flex-end', marginTop: 6 }} />
        <SkeletonBone width="82%" height={14} style={{ alignSelf: 'flex-end', marginTop: 6 }} />
        <SkeletonBone width="58%" height={14} style={{ alignSelf: 'flex-end', marginTop: 6 }} />
      </View>
      <SkeletonBone width={40} height={40} borderRadius={Radius.md} />
    </View>
  );
}

type ListProps = {
  count?: number;
  variant?: Variant;
  showTableHeader?: boolean;
  style?: ViewStyle;
};

export function ListRowSkeletonList({
  count = 7,
  variant = 'table',
  showTableHeader = variant === 'table',
  style,
}: ListProps) {
  return (
    <View style={style}>
      {showTableHeader ? (
        <View style={styles.tableHeader}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBone key={i} width={`${18 + (i % 3) * 4}%` as `${number}%`} height={12} />
          ))}
        </View>
      ) : null}
      <View style={styles.listBody}>
        {Array.from({ length: count }).map((_, i) => (
          <ListRowSkeleton key={i} variant={variant} />
        ))}
      </View>
    </View>
  );
}

export function PaymentsSummarySkeleton() {
  return (
    <View style={styles.summaryCard}>
      <SkeletonBone width="55%" height={14} style={{ alignSelf: 'flex-end' }} />
      <SkeletonBone width="38%" height={12} style={{ alignSelf: 'flex-end', marginTop: Spacing.xs }} />
      <View style={styles.summaryRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.summaryItem}>
            <SkeletonBone width="70%" height={10} style={{ alignSelf: 'flex-end' }} />
            <SkeletonBone width="80%" height={18} style={{ alignSelf: 'flex-end', marginTop: 6 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function PaymentsListSkeleton() {
  return (
    <>
      <PaymentsSummarySkeleton />
      <ListRowSkeletonList count={6} variant="payment" showTableHeader={false} />
    </>
  );
}

const styles = StyleSheet.create({
  listBody: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  tableHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    gap: Spacing.sm,
  },
  tableRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    backgroundColor: Colors.surface,
  },
  tableCells: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  paymentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  paymentTop: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  paymentBottom: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
  },
  docRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryCard: {
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  summaryRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
});
