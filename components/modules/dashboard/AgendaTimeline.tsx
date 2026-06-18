import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Radius, Shadow } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';
import type { DashboardCalendarEvent } from '@/lib/mocks/dashboard';

type Props = {
  events: DashboardCalendarEvent[];
  onStatusPress: (eventId: string) => void;
  sourceColor: (source: DashboardCalendarEvent['source']) => string;
  eventIcon: (ev: DashboardCalendarEvent) => React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export function AgendaTimeline({ events, onStatusPress, sourceColor, eventIcon }: Props) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={Colors.onSurfaceMuted} />
        <AppText variant="bodyMd" color="variant" align="center">אין אירועים ביום זה</AppText>
      </View>
    );
  }
  return (
    <View style={styles.list}>
      {events.map((ev, index) => {
        const tint = sourceColor(ev.source);
        const isLast = index === events.length - 1;
        return (
          <View key={ev.id} style={styles.row}>
            <View style={styles.railCol}>
              <View style={[styles.dot, { backgroundColor: tint }]} />
              {!isLast && <View style={styles.line} />}
            </View>
            <AppText variant="labelSm" weight="semiBold" style={styles.time}>{ev.timeLabel ?? '—'}</AppText>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Badge label={ev.statusLabel} preset="neutral" />
                <View style={[styles.icon, { backgroundColor: `${tint}18` }]}>
                  <MaterialCommunityIcons name={eventIcon(ev)} size={18} color={tint} />
                </View>
              </View>
              <AppText variant="bodyMd" weight="semiBold" align="right" numberOfLines={2}>{ev.title}</AppText>
              {ev.detail ? <AppText variant="bodySm" color="variant" align="right" numberOfLines={2}>{ev.detail}</AppText> : null}
              {ev.source === 'manual' || ev.href ? (
                <View style={styles.actions}>
                  {ev.source === 'manual' ? (
                    <Pressable onPress={() => onStatusPress(ev.id)} hitSlop={6}>
                      <AppText variant="labelSm" weight="semiBold" style={{ color: Colors.accent }}>שינוי סטטוס</AppText>
                    </Pressable>
                  ) : null}
                  {ev.href ? (
                    <Pressable onPress={() => router.push(ev.href as Href)} hitSlop={6}>
                      <AppText variant="labelSm" weight="semiBold" style={{ color: Colors.accent }}>פרטים</AppText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  row: { flexDirection: RTL_ROW, alignItems: 'flex-start', gap: Spacing.sm },
  railCol: { width: 12, alignItems: 'center', paddingTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { flex: 1, width: 2, minHeight: 48, backgroundColor: Colors.outlineLight, marginTop: 4 },
  time: { width: 44, textAlign: 'center', paddingTop: 2 },
  card: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.outlineLight, padding: Spacing.md, gap: Spacing.xs, ...Shadow.sm },
  cardHead: { flexDirection: RTL_ROW, alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: RTL_ROW, gap: Spacing.md, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineLight },
  empty: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
});
