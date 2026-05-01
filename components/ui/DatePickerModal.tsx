/**
 * Simple inline calendar date-picker modal (pure React Native, no native deps).
 * Returns a date string in DD/MM/YYYY format via onSelect.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];
const HE_DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']; // Sun..Sat

function pad2(n: number) { return String(n).padStart(2, '0'); }

function toDdMmYyyy(y: number, m: number, d: number): string {
  return `${pad2(d)}/${pad2(m + 1)}/${y}`;
}

function parseDdMmYyyy(s: string): { y: number; m: number; d: number } | null {
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return { y, m, d };
}

type Props = {
  visible: boolean;
  value: string; // DD/MM/YYYY or ''
  onSelect: (dateStr: string) => void;
  onClose: () => void;
  title?: string;
};

export function DatePickerModal({ visible, value, onSelect, onClose, title }: Props) {
  const today = new Date();
  const parsed = parseDdMmYyyy(value);

  const [month, setMonth] = useState<number>(parsed?.m ?? today.getMonth());
  const [year, setYear] = useState<number>(parsed?.y ?? today.getFullYear());

  const selectedKey = parsed ? `${parsed.y}-${parsed.m}-${parsed.d}` : null;

  // Days in the current calendar view
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Pad start (blank cells for days before the 1st)
    return { firstDay, daysInMonth };
  }, [month, year]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDay = (d: number) => {
    onSelect(toDdMmYyyy(year, month, d));
    onClose();
  };

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  // Build grid rows
  const cells: (number | null)[] = [];
  for (let i = 0; i < days.firstDay; i++) cells.push(null);
  for (let d = 1; d <= days.daysInMonth; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.picker} onPress={(e) => e.stopPropagation()}>
          {/* Title */}
          <View style={styles.titleBar}>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={18} color={Colors.onSurface} />
            </Pressable>
            <AppText variant="labelMd" weight="semiBold" style={{ flex: 1, textAlign: 'center' }}>
              {title ?? 'בחר תאריך'}
            </AppText>
            <View style={{ width: 32 }} />
          </View>

          {/* Month navigation */}
          <View style={styles.navRow}>
            <Pressable onPress={nextMonth} style={styles.navBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
            </Pressable>
            <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'center' }}>
              {HE_MONTHS[month]} {year}
            </AppText>
            <Pressable onPress={prevMonth} style={styles.navBtn} accessibilityRole="button">
              <MaterialCommunityIcons name="chevron-left" size={22} color={Colors.primary} />
            </Pressable>
          </View>

          {/* Day-of-week header */}
          <View style={styles.dowRow}>
            {HE_DOW.map((d) => (
              <AppText key={d} variant="caption" weight="bold" color="muted" style={styles.dowCell}>
                {d}
              </AppText>
            ))}
          </View>

          {/* Day grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((d, ci) => {
                if (d === null) return <View key={ci} style={styles.dayCell} />;
                const key = `${year}-${month}-${d}`;
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                return (
                  <Pressable
                    key={ci}
                    onPress={() => handleDay(d)}
                    style={[styles.dayCell, styles.dayCellBtn, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
                    accessibilityRole="button"
                    accessibilityLabel={`${d} ${HE_MONTHS[month]} ${year}`}
                  >
                    <AppText
                      variant="bodySm"
                      weight={isSelected ? 'bold' : 'regular'}
                      style={{ color: isSelected ? Colors.onPrimary : isToday ? Colors.primary : Colors.onBackground, textAlign: 'center' }}
                    >
                      {d}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Clear button */}
          {value ? (
            <Pressable onPress={() => { onSelect(''); onClose(); }} style={styles.clearBtn} accessibilityRole="button">
              <AppText variant="labelSm" style={{ color: Colors.error }}>נקה בחירה</AppText>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = 38;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: CONTENT_HORIZONTAL_PADDING,
  },
  picker: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    width: '100%',
    maxWidth: 340,
    ...Shadow.lg,
    overflow: 'hidden',
  },
  titleBar: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
  },
  dowRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  dowCell: {
    width: CELL_SIZE,
    textAlign: 'center',
    paddingBottom: 4,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellBtn: {
    borderRadius: Radius.md,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineLight,
    marginTop: Spacing.xs,
  },
});
