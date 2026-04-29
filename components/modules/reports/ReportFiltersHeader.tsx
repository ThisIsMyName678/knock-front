import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import {
  REPORT_TYPE_ICONS,
  REPORT_TYPE_LABELS,
  type ReportType,
} from '@/lib/mocks/reports';
import {
  Colors,
  Radius,
  Spacing,
  MIN_TOUCH,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

const REPORT_TYPES: ReportType[] = ['financial', 'maintenance'];

type Props = {
  dateFrom: string;
  dateTo: string;
  reportType: ReportType;
  entitiesCount: number;
  totalEntities: number;
  savedCount: number;
  onChangeDateFrom: (v: string) => void;
  onChangeDateTo: (v: string) => void;
  onChangeReportType: (v: ReportType) => void;
  onPressEntities: () => void;
  onPressSavedReports: () => void;
};

export function ReportFiltersHeader({
  dateFrom,
  dateTo,
  reportType,
  entitiesCount,
  totalEntities,
  savedCount,
  onChangeDateFrom,
  onChangeDateTo,
  onChangeReportType,
  onPressEntities,
  onPressSavedReports,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState<null | 'from' | 'to'>(null);

  const allEntities = entitiesCount === 0;
  const entityLabel = allEntities ? 'כל הנכסים' : `${entitiesCount} נכסים נבחרו`;

  return (
    <View style={styles.container}>
      {/* Date Range Row */}
      <View style={styles.dateRow}>
        <Pressable
          onPress={() => setPickerOpen('from')}
          style={styles.dateField}
          accessibilityRole="button"
          accessibilityLabel="בחר תאריך התחלה"
        >
          <View style={styles.dateIconWrap}>
            <MaterialCommunityIcons name="calendar-start" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="muted">מתאריך</AppText>
            <AppText
              variant="bodySm"
              weight="semiBold"
              numberOfLines={1}
              style={{ color: dateFrom ? Colors.onSurface : Colors.onSurfaceMuted }}
            >
              {dateFrom || 'בחר תאריך'}
            </AppText>
          </View>
        </Pressable>

        <View style={styles.dateSeparator}>
          <MaterialCommunityIcons name="arrow-left" size={16} color={Colors.onSurfaceMuted} />
        </View>

        <Pressable
          onPress={() => setPickerOpen('to')}
          style={styles.dateField}
          accessibilityRole="button"
          accessibilityLabel="בחר תאריך סיום"
        >
          <View style={styles.dateIconWrap}>
            <MaterialCommunityIcons name="calendar-end" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="muted">עד תאריך</AppText>
            <AppText
              variant="bodySm"
              weight="semiBold"
              numberOfLines={1}
              style={{ color: dateTo ? Colors.onSurface : Colors.onSurfaceMuted }}
            >
              {dateTo || 'בחר תאריך'}
            </AppText>
          </View>
        </Pressable>
      </View>

      {/* Report Type pills */}
      <View style={styles.segmentRow}>
        {REPORT_TYPES.map((t) => {
          const active = reportType === t;
          const icon = REPORT_TYPE_ICONS[t] as React.ComponentProps<
            typeof MaterialCommunityIcons
          >['name'];
          return (
            <Pressable
              key={t}
              onPress={() => onChangeReportType(t)}
              style={[styles.segment, active && styles.segmentActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <MaterialCommunityIcons
                name={icon}
                size={18}
                color={active ? Colors.onPrimary : Colors.primary}
              />
              <AppText
                variant="bodySm"
                weight="bold"
                style={{ color: active ? Colors.onPrimary : Colors.primary }}
              >
                {REPORT_TYPE_LABELS[t]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Entity + Saved triggers */}
      <View style={styles.triggerRow}>
        <Pressable
          onPress={onPressEntities}
          style={styles.triggerPill}
          accessibilityRole="button"
        >
          <View style={[styles.triggerIcon, { backgroundColor: Colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="home-search-outline"
              size={16}
              color={Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="muted">נכסים ופרויקטים</AppText>
            <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>
              {entityLabel}
            </AppText>
          </View>
          {!allEntities ? (
            <View style={styles.counterBadge}>
              <AppText variant="caption" weight="bold" color="onPrimary">
                {entitiesCount}/{totalEntities}
              </AppText>
            </View>
          ) : null}
          <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.onSurfaceMuted} />
        </Pressable>

        <Pressable
          onPress={onPressSavedReports}
          style={styles.savedPill}
          accessibilityRole="button"
          accessibilityLabel="דוחות שמורים"
        >
          <MaterialCommunityIcons name="bookmark-outline" size={18} color={Colors.primary} />
          {savedCount > 0 ? (
            <View style={styles.savedBadge}>
              <AppText variant="caption" weight="bold" color="onPrimary">
                {savedCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      <DatePickerModal
        visible={pickerOpen === 'from'}
        title="בחר תאריך התחלה"
        value={dateFrom}
        onSelect={onChangeDateFrom}
        onClose={() => setPickerOpen(null)}
      />
      <DatePickerModal
        visible={pickerOpen === 'to'}
        title="בחר תאריך סיום"
        value={dateTo}
        onSelect={onChangeDateTo}
        onClose={() => setPickerOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  dateRow: {
    flexDirection: RTL_ROW,
    alignItems: 'stretch',
    gap: Spacing.xs,
  },
  dateField: {
    flex: 1,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    minHeight: MIN_TOUCH + 4,
  },
  dateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSeparator: {
    alignSelf: 'center',
  },
  segmentRow: {
    flexDirection: RTL_ROW,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  triggerRow: {
    flexDirection: RTL_ROW,
    alignItems: 'stretch',
    gap: Spacing.xs,
  },
  triggerPill: {
    flex: 1,
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    minHeight: MIN_TOUCH + 4,
  },
  triggerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  savedPill: {
    width: MIN_TOUCH + 4,
    minHeight: MIN_TOUCH + 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  savedBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
