import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const REPORTS = [
  { id: 'r1', title: 'דו״ח הכנסות חודשי', desc: 'סיכום הכנסות לפי פרויקט', icon: 'chart-bar', color: Colors.success },
  { id: 'r2', title: 'דו״ח נכסים פנויים', desc: 'רשימת נכסים לא מושכרים', icon: 'home-alert-outline', color: Colors.warning },
  { id: 'r3', title: 'דו״ח תחזוקה', desc: 'קריאות שירות חודשיות', icon: 'hammer-wrench', color: Colors.error },
  { id: 'r4', title: 'דו״ח חוזים', desc: 'חוזים שפגי תוקף / לחידוש', icon: 'file-sign', color: Colors.primary },
  { id: 'r5', title: 'דו״ח שנתי', desc: 'סיכום שנתי מלא', icon: 'file-chart-outline', color: Colors.info },
];

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="דוחות" showMenu />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        {REPORTS.map((r) => (
          <Card key={r.id} onPress={() => {}} style={{ marginBottom: 0 }}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: `${r.color}18` }]}>
                <MaterialCommunityIcons name={r.icon as any} size={24} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="bold">{r.title}</AppText>
                <AppText variant="bodySm" color="variant">{r.desc}</AppText>
              </View>
              <MaterialCommunityIcons name="download-outline" size={22} color={Colors.primary} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, paddingTop: Spacing.base, gap: Spacing.md },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  icon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
