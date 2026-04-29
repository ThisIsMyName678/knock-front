import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import {
  DEFAULT_AUTO_CONFIG,
  MOCK_SAVED_REPORTS,
  REPORT_TYPE_LABELS,
  makeInitialFilters,
  toDdMmYyyy,
  type AutoReportConfig,
  type ReportFilters,
  type ReportType,
  type SavedReport,
} from '@/lib/mocks/reports';
import { PAYMENT_ENTITY_OPTIONS } from '@/lib/mocks/payments';
import { ReportFiltersHeader } from './ReportFiltersHeader';
import { ReportActionsBar } from './ReportActionsBar';
import { EntityMultiSelectModal } from './EntityMultiSelectModal';
import { SavedReportsMenu } from './SavedReportsMenu';
import { SaveReportModal } from './SaveReportModal';
import { AutoReportModal } from './AutoReportModal';
import { MaintenanceReport } from './MaintenanceReport';
import { FinancialReport } from './FinancialReport';
import {
  Colors,
  Spacing,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

const TOTAL_ENTITIES = PAYMENT_ENTITY_OPTIONS.length;

export function ReportsScreen() {
  const insets = useSafeAreaInsets();

  const [filters, setFilters] = useState<ReportFilters>(makeInitialFilters);
  const [autoConfig, setAutoConfig] = useState<AutoReportConfig>(DEFAULT_AUTO_CONFIG);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(MOCK_SAVED_REPORTS);

  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);

  const handleClear = () => {
    setFilters({
      ...makeInitialFilters(),
      reportType: filters.reportType,
    });
  };

  const handleShare = () => {
    Alert.alert(
      'שיתוף הדוח',
      'הדוח יישלח כקובץ PDF דרך מערכת השיתוף של המכשיר.\n\n(תצוגה לעיצוב — אינטגרציה תושלם בהמשך)',
    );
  };

  const handleEmail = () => {
    Alert.alert(
      'שליחה במייל',
      'הדוח יישלח כקובץ PDF לכתובת המייל המוגדרת בפרופיל המשתמש.\n\n(תצוגה לעיצוב — אינטגרציה תושלם בהמשך)',
    );
  };

  const handleSavePressed = () => setSaveOpen(true);

  const handleSaveConfirm = (name: string) => {
    const newReport: SavedReport = {
      id: `sr_${Date.now()}`,
      name,
      savedAt: toDdMmYyyy(new Date()),
      filters: { ...filters },
      autoConfig: { ...autoConfig },
    };
    setSavedReports((prev) => [newReport, ...prev]);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleLoadSaved = (r: SavedReport) => {
    setFilters({ ...r.filters });
    setAutoConfig({ ...r.autoConfig });
  };

  const handleAutoSave = (config: AutoReportConfig) => {
    setAutoConfig(config);
  };

  const handleEntitiesConfirm = (ids: string[]) => {
    setFilters((f) => ({ ...f, entityIds: ids }));
  };

  const handleReportTypeChange = (t: ReportType) => {
    setFilters((f) => ({ ...f, reportType: t }));
  };

  const reportBody = useMemo(() => {
    if (filters.reportType === 'maintenance') {
      return <MaintenanceReport filters={filters} />;
    }
    return <FinancialReport filters={filters} />;
  }, [filters]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="דוחות" subtitle="הפקה, ניתוח ושליחה" showMenu />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters card */}
        <View style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <View style={styles.filtersHeaderIcon}>
              <MaterialCommunityIcons name="filter-variant" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMd" weight="bold">סינון הדוח</AppText>
              <AppText variant="caption" color="muted">
                בחר טווח תאריכים, סוג דוח, נכסים ופרויקטים
              </AppText>
            </View>
          </View>
          <ReportFiltersHeader
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            reportType={filters.reportType}
            entitiesCount={filters.entityIds.length}
            totalEntities={TOTAL_ENTITIES}
            savedCount={savedReports.length}
            onChangeDateFrom={(v) => setFilters((f) => ({ ...f, dateFrom: v }))}
            onChangeDateTo={(v) => setFilters((f) => ({ ...f, dateTo: v }))}
            onChangeReportType={handleReportTypeChange}
            onPressEntities={() => setEntitiesOpen(true)}
            onPressSavedReports={() => setSavedOpen(true)}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>
          <ReportActionsBar
            onClear={handleClear}
            onShare={handleShare}
            onEmail={handleEmail}
            onSave={handleSavePressed}
            onAuto={() => setAutoOpen(true)}
            autoActive={autoConfig.enabled}
          />
        </View>

        {/* Auto-active hint */}
        {autoConfig.enabled ? (
          <View style={styles.autoHint}>
            <MaterialCommunityIcons name="email-fast-outline" size={16} color={Colors.success} />
            <AppText variant="caption" weight="semiBold" style={{ color: Colors.success, flex: 1 }}>
              שליחה אוטומטית פעילה · {autoConfig.recipients.length} נמענים
            </AppText>
          </View>
        ) : null}

        {/* Report title */}
        <View style={styles.bodyTitleRow}>
          <AppText variant="headingSm" weight="bold">
            דו"ח {REPORT_TYPE_LABELS[filters.reportType]}
          </AppText>
          {filters.dateFrom || filters.dateTo ? (
            <AppText variant="caption" color="muted">
              {filters.dateFrom || '—'} עד {filters.dateTo || '—'}
            </AppText>
          ) : null}
        </View>

        {/* Body */}
        {reportBody}

        {/* PDF preview footer note */}
        <View style={styles.footerNote}>
          <MaterialCommunityIcons name="file-pdf-box" size={16} color={Colors.onSurfaceMuted} />
          <AppText variant="caption" color="muted" align="center">
            ניתן להפיק את הדוח כ-PDF עם עיצוב ייעודי דרך כפתורי השיתוף או המייל
          </AppText>
        </View>
      </ScrollView>

      <EntityMultiSelectModal
        visible={entitiesOpen}
        selectedIds={filters.entityIds}
        onClose={() => setEntitiesOpen(false)}
        onConfirm={handleEntitiesConfirm}
      />

      <SavedReportsMenu
        visible={savedOpen}
        reports={savedReports}
        onClose={() => setSavedOpen(false)}
        onSelect={handleLoadSaved}
        onDelete={handleDeleteSaved}
      />

      <SaveReportModal
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSaveConfirm}
        defaultName={`דו"ח ${REPORT_TYPE_LABELS[filters.reportType]} ${toDdMmYyyy(new Date())}`}
      />

      <AutoReportModal
        visible={autoOpen}
        config={autoConfig}
        onClose={() => setAutoOpen(false)}
        onSave={handleAutoSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  filtersCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  filtersHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filtersHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  autoHint: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.successContainer,
    borderRadius: 12,
  },
  bodyTitleRow: {
    flexDirection: RTL_ROW,
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  footerNote: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
});
