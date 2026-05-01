import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { StatTile } from './parts/StatTile';
import { SectionCard } from './parts/SectionCard';
import { BreakdownTable } from './parts/BreakdownTable';
import { MonthlyTrendList } from './parts/MonthlyTrendList';
import {
  buildMaintenanceReport,
  formatCurrencyILS,
  formatNumber,
  type ReportFilters,
} from '@/lib/mocks/reports';
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  type MaintenanceCategory,
} from '@/lib/mocks/tasks';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  filters: ReportFilters;
};

const CATEGORY_TINTS: Record<MaintenanceCategory, string> = {
  building: Colors.warning,
  electrical: '#7c3aed',
  plumbing: Colors.info,
  gas: Colors.error,
  other: Colors.onSurfaceVariant,
};

export function MaintenanceReport({ filters }: Props) {
  const data = useMemo(() => buildMaintenanceReport(filters), [filters]);

  const categoryRows = data.byCategory.map((c) => ({
    id: c.category,
    label: MAINTENANCE_CATEGORY_LABELS[c.category],
    icon: MAINTENANCE_CATEGORY_ICONS[c.category] as React.ComponentProps<
      typeof MaterialCommunityIcons
    >['name'],
    iconColor: CATEGORY_TINTS[c.category],
    values: {
      opened: c.opened,
      closed: c.closed,
      stillOpen: c.stillOpen,
      avgDays: c.avgCloseDays !== null ? `${c.avgCloseDays} ימ׳` : '—',
      cost: formatCurrencyILS(c.totalCost),
    },
  }));

  const assetRows = data.byAsset.map((a) => ({
    id: a.entityId,
    label: a.entityName,
    icon: (a.entityKind === 'project'
      ? 'office-building-outline'
      : 'home-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
    iconColor: a.entityKind === 'project' ? Colors.info : Colors.primary,
    values: {
      total: a.totalCalls,
      open: a.openCalls,
      closed: a.closedCalls,
      cost: formatCurrencyILS(a.totalCost),
    },
  }));

  const monthlyItems = data.monthly.map((m) => ({
    key: m.key,
    label: m.label,
    primary: { label: 'קריאות', value: formatNumber(m.totalCalls) },
    secondary: {
      label: 'ממ׳/נכס',
      value: m.avgCallsPerAsset.toLocaleString('he-IL'),
    },
    tertiary: m.topCategory
      ? { label: 'דומיננטי', value: MAINTENANCE_CATEGORY_LABELS[m.topCategory] }
      : { label: 'דומיננטי', value: '—' },
    delta: null,
  }));

  return (
    <View style={styles.root}>
      {/* Stat grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatTile
            icon="office-building-outline"
            tone="info"
            label="פרויקטים בדוח"
            value={formatNumber(data.totals.projects)}
          />
          <StatTile
            icon="home-outline"
            tone="primary"
            label="נכסים בדוח"
            value={formatNumber(data.totals.assets)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatTile
            icon="hammer-wrench"
            tone="warning"
            label='סה"כ קריאות'
            value={formatNumber(data.totals.totalCalls)}
          />
          <StatTile
            icon="cash-multiple"
            tone="error"
            label='סה"כ עלות'
            value={formatCurrencyILS(data.totals.totalCost)}
          />
        </View>
      </View>

      {/* Categories breakdown */}
      <SectionCard
        title="פילוח לפי קטגוריה"
        subtitle="נפתחו, נסגרו, פתוחות, זמן טיפול ועלות"
        icon="format-list-bulleted-type"
        iconColor={Colors.primary}
      >
        <BreakdownTable
          columns={[
            { key: 'opened', label: 'נפתחו' },
            { key: 'closed', label: 'נסגרו' },
            { key: 'stillOpen', label: 'פתוחות' },
            { key: 'avgDays', label: 'זמן ממ׳', flex: 1.1 },
            { key: 'cost', label: 'עלות', flex: 1.4 },
          ]}
          rows={categoryRows}
        />
      </SectionCard>

      {/* Per asset */}
      <SectionCard
        title="פילוח לפי נכס"
        subtitle="כמות קריאות, פתוחות, נסגרו, עלות מצטברת"
        icon="home-search-outline"
        iconColor={Colors.info}
      >
        <BreakdownTable
          columns={[
            { key: 'total', label: 'קריאות' },
            { key: 'open', label: 'פתוחות' },
            { key: 'closed', label: 'נסגרו' },
            { key: 'cost', label: 'עלות', flex: 1.4 },
          ]}
          rows={assetRows}
          emptyText="אין נכסים בטווח שנבחר"
        />
      </SectionCard>

      {/* Per asset by category — chips view */}
      {data.byAsset.length > 0 ? (
        <SectionCard
          title="קריאות לפי נכס וקטגוריה"
          subtitle="פילוח קצר של סוגי הקריאות בכל נכס"
          icon="view-list-outline"
          iconColor={Colors.warning}
        >
          <View style={styles.chipsList}>
            {data.byAsset.map((a, idx) => (
              <View
                key={a.entityId}
                style={[styles.chipsRow, idx < data.byAsset.length - 1 && styles.chipsRowBorder]}
              >
                <View style={styles.chipsHeader}>
                  <MaterialCommunityIcons
                    name={
                      (a.entityKind === 'project'
                        ? 'office-building-outline'
                        : 'home-outline') as React.ComponentProps<
                        typeof MaterialCommunityIcons
                      >['name']
                    }
                    size={16}
                    color={a.entityKind === 'project' ? Colors.info : Colors.primary}
                  />
                  <AppText variant="bodySm" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                    {a.entityName}
                  </AppText>
                  <AppText variant="caption" color="muted">
                    {a.totalCalls} סה״כ
                  </AppText>
                </View>
                <View style={styles.chipsBag}>
                  {Object.entries(a.perCategory).map(([cat, count]) => {
                    const c = cat as MaintenanceCategory;
                    return (
                      <View
                        key={cat}
                        style={[styles.catChip, { backgroundColor: `${CATEGORY_TINTS[c]}1A` }]}
                      >
                        <MaterialCommunityIcons
                          name={
                            MAINTENANCE_CATEGORY_ICONS[c] as React.ComponentProps<
                              typeof MaterialCommunityIcons
                            >['name']
                          }
                          size={12}
                          color={CATEGORY_TINTS[c]}
                        />
                        <AppText
                          variant="caption"
                          weight="semiBold"
                          style={{ color: CATEGORY_TINTS[c] }}
                        >
                          {MAINTENANCE_CATEGORY_LABELS[c]} · {count}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {/* Monthly trends */}
      <SectionCard
        title="טרנדים חודשיים"
        subtitle="כמות קריאות, ממוצע לנכס, קטגוריה דומיננטית"
        icon="chart-timeline-variant"
        iconColor={Colors.success}
      >
        <MonthlyTrendList items={monthlyItems} />
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.md,
  },
  statsGrid: { gap: Spacing.sm },
  statsRow: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
  },
  chipsList: {},
  chipsRow: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  chipsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  chipsHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chipsBag: {
    flexDirection: RTL_ROW,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  catChip: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
});
