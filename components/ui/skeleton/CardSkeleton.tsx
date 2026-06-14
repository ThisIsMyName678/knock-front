import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBone } from './SkeletonBone';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

type Variant = 'list' | 'grid' | 'contract';

type Props = {
  variant?: Variant;
  style?: ViewStyle;
};

export function CardSkeleton({ variant = 'list', style }: Props) {
  if (variant === 'grid') {
    return (
      <View style={[styles.gridCard, style]}>
        <SkeletonBone height={52} borderRadius={0} style={styles.gridStrip} />
        <View style={styles.gridBody}>
          <SkeletonBone width={56} height={18} borderRadius={Radius.full} />
          <SkeletonBone width="88%" height={16} style={{ marginTop: Spacing.sm }} />
          <SkeletonBone width="72%" height={12} style={{ marginTop: Spacing.xs }} />
          <SkeletonBone width="60%" height={12} style={{ marginTop: 4 }} />
          <View style={{ flex: 1 }} />
          <SkeletonBone width={64} height={22} borderRadius={Radius.full} />
        </View>
      </View>
    );
  }

  if (variant === 'contract') {
    return (
      <View style={[styles.listCard, style]}>
        <View style={styles.rowBetween}>
          <SkeletonBone width={56} height={22} borderRadius={Radius.full} />
          <SkeletonBone width="62%" height={16} />
        </View>
        <View style={[styles.rowBetween, { marginTop: Spacing.sm }]}>
          <SkeletonBone width={72} height={12} />
          <View style={styles.metaRow}>
            <SkeletonBone width={68} height={20} borderRadius={Radius.full} />
            <SkeletonBone width={52} height={20} borderRadius={Radius.full} />
          </View>
        </View>
        <SkeletonBone width="48%" height={12} style={{ marginTop: Spacing.sm, alignSelf: 'flex-end' }} />
      </View>
    );
  }

  return (
    <View style={[styles.listCard, style]}>
      <View style={styles.listRow}>
        <SkeletonBone width={56} height={22} borderRadius={Radius.full} />
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <SkeletonBone width="78%" height={16} style={{ alignSelf: 'flex-end' }} />
          <SkeletonBone width="52%" height={12} style={{ alignSelf: 'flex-end' }} />
        </View>
      </View>
      <View style={[styles.listRow, { marginTop: Spacing.sm }]}>
        <SkeletonBone width={40} height={12} />
        <SkeletonBone width={88} height={12} />
        <SkeletonBone width={64} height={12} />
      </View>
    </View>
  );
}

type ListProps = {
  count?: number;
  variant?: Variant;
  style?: ViewStyle;
};

export function CardSkeletonList({ count = 5, variant = 'list', style }: ListProps) {
  return (
    <View style={[styles.listWrap, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} variant={variant} />
      ))}
    </View>
  );
}

export function GridCardSkeletonList({ rows = 3, columns = 3, style }: { rows?: number; columns?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.gridWrap, style]}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: columns }).map((__, col) => (
            <View key={col} style={styles.gridCell}>
              <CardSkeleton variant="grid" />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    overflow: 'hidden',
    minHeight: 168,
    ...Shadow.sm,
  },
  gridStrip: {
    width: '100%',
  },
  gridBody: {
    padding: Spacing.sm,
    flex: 1,
    gap: 2,
  },
  listRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.xs,
  },
  gridWrap: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: Spacing.sm,
  },
  gridCell: {
    flex: 1,
  },
});
