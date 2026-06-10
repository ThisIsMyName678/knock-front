import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBone } from './SkeletonBone';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  sections?: number;
};

export function DetailPageSkeleton({ sections = 3 }: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Title block */}
      <View style={styles.heroCard}>
        <View style={styles.titleRow}>
          <SkeletonBone width={36} height={36} borderRadius={Radius.md} />
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <SkeletonBone width="35%" height={12} style={{ alignSelf: 'flex-end' }} />
            <SkeletonBone width="82%" height={22} style={{ alignSelf: 'flex-end' }} />
            <View style={styles.badgeRow}>
              <SkeletonBone width={64} height={22} borderRadius={Radius.full} />
              <SkeletonBone width={72} height={22} borderRadius={Radius.full} />
            </View>
          </View>
        </View>
      </View>

      {/* Detail rows */}
      <View style={styles.card}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={[styles.detailRow, i < 3 && styles.detailRowBorder]}>
            <SkeletonBone width="38%" height={14} />
            <SkeletonBone width="48%" height={14} />
          </View>
        ))}
      </View>

      {/* Sections */}
      {Array.from({ length: sections }).map((_, si) => (
        <View key={si} style={styles.card}>
          <SkeletonBone width="32%" height={16} style={{ alignSelf: 'flex-end', marginBottom: Spacing.md }} />
          {Array.from({ length: 3 }).map((_, ri) => (
            <View key={ri} style={[styles.sectionRow, ri < 2 && styles.detailRowBorder]}>
              <SkeletonBone width={32} height={32} borderRadius={Radius.md} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBone width="70%" height={14} style={{ alignSelf: 'flex-end' }} />
                <SkeletonBone width="45%" height={12} style={{ alignSelf: 'flex-end' }} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  titleRow: {
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  badgeRow: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  detailRow: {
    flexDirection: RTL_ROW,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  sectionRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
