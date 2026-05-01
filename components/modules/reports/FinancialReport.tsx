import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { StatTile } from './parts/StatTile';
import { SectionCard } from './parts/SectionCard';
import { BreakdownTable } from './parts/BreakdownTable';
import { RankList } from './parts/RankList';
import { MonthlyTrendList } from './parts/MonthlyTrendList';
import {
  buildFinancialReport,
  formatCurrencyILS,
  formatNumber,
  pctDelta,
  type ReportFilters,
} from '@/lib/mocks/reports';
import {
  PAYMENT_TYPE_LABELS,
  type PaymentListRow,
} from '@/lib/mocks/payments';
import { Colors, Radius, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  filters: ReportFilters;
};

export function FinancialReport({ filters }: Props) {
  const data = useMemo(() => buildFinancialReport(filters), [filters]);

  const expenseRows = data.expenseByCategory.map((c) => ({
    id: c.category,
    label: c.label,
    icon: 'tag-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
    iconColor: Colors.error,
    values: {
      amount: formatCurrencyILS(c.amount),
      pct:
        data.totals.totalExpense > 0
          ? `${Math.round((c.amount / data.totals.totalExpense) * 100)}%`
          : '—',
    },
  }));

  const incomeRows = data.incomeByCategory.map((c) => ({
    id: c.category,
    label: c.label,
    icon: 'tag-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
    iconColor: Colors.success,
    values: {
      amount: formatCurrencyILS(c.amount),
      pct:
        data.totals.totalIncome > 0
          ? `${Math.round((c.amount / data.totals.totalIncome) * 100)}%`
          : '—',
    },
  }));

  const monthlyItems = data.monthly.map((m, idx) => {
    const prev = idx > 0 ? data.monthly[idx - 1] : null;
    return {
      key: m.key,
      label: m.label,
      primary: { label: 'הכנסות', value: formatCurrencyILS(m.income) },
      secondary: { label: 'הוצאות', value: formatCurrencyILS(m.expense) },
      tertiary: { label: 'Balance', value: formatCurrencyILS(m.balance) },
      delta: prev ? pctDelta(m.balance, prev.balance) : null,
      positiveIsGood: true,
    };
  });

  const balancePositive = data.totals.balance >= 0;

  return (
    <View style={styles.root}>
      {/* Top row */}
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
            icon="arrow-down-bold-circle-outline"
            tone="success"
            label='סה"כ הכנסות'
            value={formatCurrencyILS(data.totals.totalIncome)}
          />
          <StatTile
            icon="arrow-up-bold-circle-outline"
            tone="error"
            label='סה"כ הוצאות'
            value={formatCurrencyILS(data.totals.totalExpense)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatTile
            icon={balancePositive ? 'trending-up' : 'trending-down'}
            tone={balancePositive ? 'success' : 'error'}
            label="Balance"
            value={formatCurrencyILS(data.totals.balance)}
          />
          <StatTile
            icon="chart-line"
            tone="neutral"
            label="ממ׳ balance לנכס"
            value={formatCurrencyILS(data.totals.avgBalancePerAsset)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatTile
            icon="cash-plus"
            tone="success"
            label="ממ׳ הכנסות לנכס"
            value={formatCurrencyILS(data.totals.avgIncomePerAsset)}
          />
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Top 10 income */}
      <SectionCard
        title="10 הנכסים בעלי ההכנסות הגבוהות"
        subtitle="מסודר מההכנסה הגבוהה לנמוכה"
        icon="trophy-outline"
        iconColor={Colors.success}
      >
        <RankList items={data.topIncome} formatValue={formatCurrencyILS} tone="income" />
      </SectionCard>

      {/* Top 10 expense */}
      <SectionCard
        title="10 הנכסים בעלי ההוצאות הגבוהות"
        subtitle="מסודר מההוצאה הגבוהה לנמוכה"
        icon="alert-circle-outline"
        iconColor={Colors.error}
      >
        <RankList items={data.topExpense} formatValue={formatCurrencyILS} tone="expense" />
      </SectionCard>

      {/* Expense by category */}
      <SectionCard
        title="פילוח הוצאות לפי קטגוריה"
        icon="format-list-bulleted-type"
        iconColor={Colors.error}
      >
        <BreakdownTable
          columns={[
            { key: 'amount', label: 'סכום', flex: 1.6 },
            { key: 'pct', label: 'אחוז', flex: 0.8 },
          ]}
          rows={expenseRows}
        />
      </SectionCard>

      {/* Income by category */}
      <SectionCard
        title="פילוח הכנסות לפי קטגוריה"
        icon="format-list-bulleted-type"
        iconColor={Colors.success}
      >
        <BreakdownTable
          columns={[
            { key: 'amount', label: 'סכום', flex: 1.6 },
            { key: 'pct', label: 'אחוז', flex: 0.8 },
          ]}
          rows={incomeRows}
        />
      </SectionCard>

      {/* Late / uncollected */}
      <SectionCard
        title="גביה — איחורים ולא נגבו"
        subtitle="תשלומים נכנסים שלא נגבו במועד"
        icon="clock-alert-outline"
        iconColor={Colors.warning}
      >
        <View style={styles.alertGroup}>
          <AlertGroup
            title="נגבו באיחור"
            tint={Colors.warning}
            tintBg={Colors.warningContainer}
            payments={data.late}
            emptyText="אין תשלומים שנגבו באיחור"
          />
          <AlertGroup
            title="לא נגבו"
            tint={Colors.error}
            tintBg={Colors.errorContainer}
            payments={data.uncollected}
            emptyText="אין תשלומים שלא נגבו"
          />
        </View>
      </SectionCard>

      {/* Monthly trends */}
      <SectionCard
        title="טרנדים חודשיים"
        subtitle="הכנסות, הוצאות, balance ושינוי % מהחודש הקודם"
        icon="chart-timeline-variant"
        iconColor={Colors.primary}
      >
        <MonthlyTrendList items={monthlyItems} />
      </SectionCard>
    </View>
  );
}

function AlertGroup({
  title,
  tint,
  tintBg,
  payments,
  emptyText,
}: {
  title: string;
  tint: string;
  tintBg: string;
  payments: PaymentListRow[];
  emptyText: string;
}) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertBadge, { backgroundColor: tintBg }]}>
          <AppText variant="caption" weight="bold" style={{ color: tint }}>
            {payments.length}
          </AppText>
        </View>
        <AppText variant="bodySm" weight="bold">{title}</AppText>
      </View>
      {payments.length === 0 ? (
        <AppText variant="caption" color="muted" style={{ marginTop: Spacing.xs }}>
          {emptyText}
        </AppText>
      ) : (
        <View style={styles.paymentList}>
          {payments.slice(0, 5).map((p) => (
            <View key={p.id} style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>
                  {p.displayName}
                </AppText>
                <AppText variant="caption" color="muted">
                  {p.linkLabel} · {PAYMENT_TYPE_LABELS[p.paymentType]} · {p.dueDate}
                </AppText>
              </View>
              <AppText variant="bodySm" weight="bold" style={{ color: tint }}>
                {formatCurrencyILS(p.amount)}
              </AppText>
            </View>
          ))}
          {payments.length > 5 ? (
            <AppText variant="caption" color="muted" align="center">
              +{payments.length - 5} נוספים
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.md },
  statsGrid: { gap: Spacing.sm },
  statsRow: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
  },
  alertGroup: { gap: Spacing.md },
  alertCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  alertHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  paymentRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
});
