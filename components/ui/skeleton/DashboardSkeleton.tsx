import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBone } from './SkeletonBone';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

export function DashboardSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <SkeletonBone width="55%" height={28} borderRadius={Radius.md} style={{ alignSelf: 'flex-end' }} />
            <SkeletonBone width="42%" height={14} style={{ alignSelf: 'flex-end' }} />
          </View>
          <SkeletonBone width={44} height={44} borderRadius={Radius.lg} />
        </View>
        <View style={styles.primaryMetric}>
          <SkeletonBone width="48%" height={12} style={{ alignSelf: 'flex-end' }} />
          <SkeletonBone width={80} height={52} borderRadius={Radius.lg} style={{ alignSelf: 'flex-end', marginTop: Spacing.sm }} />
          <SkeletonBone width="62%" height={12} style={{ alignSelf: 'flex-end', marginTop: Spacing.xs }} />
        </View>
        <View style={styles.secondaryStrip}>
          <View style={styles.tasksStrip}>
            <SkeletonBone width="55%" height={12} style={{ alignSelf: 'flex-end' }} />
            <View style={styles.tasksRow}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.taskCell}>
                  <SkeletonBone width={28} height={22} borderRadius={Radius.sm} />
                  <SkeletonBone width={36} height={10} style={{ marginTop: 4 }} />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.miniCard}>
            <SkeletonBone width={24} height={24} borderRadius={Radius.sm} />
            <SkeletonBone width={48} height={12} style={{ marginTop: 4 }} />
            <SkeletonBone width={40} height={16} style={{ marginTop: 4 }} />
          </View>
          <SkeletonBone width={72} height={88} borderRadius={Radius.lg} />
        </View>
      </View>

      {/* Attention lane */}
      <View style={styles.section}>
        <SkeletonBone width={88} height={10} style={{ alignSelf: 'flex-end' }} />
        {[1, 2].map((i) => (
          <View key={i} style={styles.attentionCard}>
            <SkeletonBone width={4} height={72} borderRadius={0} style={styles.rail} />
            <View style={styles.attentionBody}>
              <SkeletonBone width={24} height={24} borderRadius={Radius.sm} />
              <SkeletonBone width="50%" height={14} style={{ alignSelf: 'flex-end' }} />
              <SkeletonBone width={48} height={28} style={{ alignSelf: 'flex-end' }} />
            </View>
          </View>
        ))}
      </View>

      {/* Workspace */}
      <View style={styles.workspace}>
        <View style={styles.rowBetween}>
          <SkeletonBone width={120} height={18} />
          <SkeletonBone width={72} height={24} borderRadius={Radius.full} />
        </View>
        <View style={styles.calendar}>
          <View style={styles.rowBetween}>
            <SkeletonBone width={28} height={28} borderRadius={Radius.md} />
            <SkeletonBone width={140} height={16} />
            <SkeletonBone width={28} height={28} borderRadius={Radius.md} />
          </View>
          <View style={styles.calGrid}>
            {Array.from({ length: 35 }).map((_, i) => (
              <SkeletonBone key={i} width={28} height={28} borderRadius={Radius.md} style={styles.calCell} />
            ))}
          </View>
        </View>
        <View style={styles.agenda}>
          <SkeletonBone width="75%" height={14} style={{ alignSelf: 'flex-end', marginBottom: Spacing.md }} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.agendaRow}>
              <SkeletonBone width={10} height={10} borderRadius={Radius.full} />
              <SkeletonBone width={36} height={12} />
              <View style={styles.agendaCard}>
                <SkeletonBone width="65%" height={14} style={{ alignSelf: 'flex-end' }} />
                <SkeletonBone width="88%" height={12} style={{ alignSelf: 'flex-end', marginTop: Spacing.xs }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  hero: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius['2xl'],
    borderBottomRightRadius: Radius['2xl'],
    marginHorizontal: -CONTENT_HORIZONTAL_PADDING,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
    ...Shadow.md,
  },
  heroTop: { flexDirection: RTL_ROW, alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  primaryMetric: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  secondaryStrip: { flexDirection: RTL_ROW, gap: Spacing.sm },
  tasksStrip: {
    flex: 1.4,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tasksRow: { flexDirection: RTL_ROW, justifyContent: 'space-between' },
  taskCell: { alignItems: 'center', flex: 1 },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
    alignItems: 'flex-end',
  },
  section: { gap: Spacing.md },
  attentionCard: {
    flexDirection: RTL_ROW,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    overflow: 'hidden',
    minHeight: 96,
    ...Shadow.sm,
  },
  rail: { alignSelf: 'stretch' },
  attentionBody: { flex: 1, padding: Spacing.lg, gap: Spacing.sm, alignItems: 'flex-end' },
  workspace: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadow.sm,
  },
  rowBetween: { flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'space-between' },
  calendar: { gap: Spacing.md },
  calGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' },
  calCell: { marginBottom: 2 },
  agenda: { gap: Spacing.md },
  agendaRow: { flexDirection: RTL_ROW, alignItems: 'flex-start', gap: Spacing.sm },
  agendaCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    padding: Spacing.md,
  },
});
