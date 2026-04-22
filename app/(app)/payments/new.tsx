import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const STEPS = ['סוג תשלום', 'פרטים', 'אישור'];
const TYPES = [
  { key: 'rent', label: 'שכירות', icon: 'home-outline' },
  { key: 'maintenance', label: 'תחזוקה', icon: 'hammer-wrench' },
  { key: 'management', label: 'ניהול', icon: 'office-building-outline' },
  { key: 'other', label: 'אחר', icon: 'dots-horizontal' },
];

export default function NewPaymentScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [payType, setPayType] = useState('');
  const [direction, setDirection] = useState<'in' | 'out'>('in');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">הוספת תשלום</AppText>
        <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>{step + 1}/{STEPS.length}</AppText>
      </View>

      <View style={styles.stepRow}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? <MaterialCommunityIcons name="check" size={14} color={Colors.onPrimary} /> : <AppText variant="labelSm" weight="bold" color={i === step ? 'onPrimary' : 'muted'}>{i + 1}</AppText>}
            </View>
            <AppText variant="caption" color={i <= step ? 'primary' : 'muted'} align="center">{s}</AppText>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.md }}>כיוון תשלום</AppText>
            <View style={styles.directionRow}>
              {(['in', 'out'] as const).map((d) => (
                <Pressable key={d} onPress={() => setDirection(d)} style={[styles.dirBtn, direction === d && { borderColor: d === 'in' ? Colors.inbound : Colors.outbound, backgroundColor: d === 'in' ? Colors.inboundBg : Colors.outboundBg }]} accessibilityRole="button">
                  <MaterialCommunityIcons name={d === 'in' ? 'arrow-down' : 'arrow-up'} size={22} color={d === 'in' ? Colors.inbound : Colors.outbound} />
                  <AppText variant="bodyMd" weight="bold" style={{ color: d === 'in' ? Colors.inbound : Colors.outbound }}>{d === 'in' ? 'הכנסה' : 'הוצאה'}</AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="labelMd" weight="semiBold" style={{ marginTop: Spacing.base, marginBottom: Spacing.sm }}>קטגוריה</AppText>
            <View style={styles.typeGrid}>
              {TYPES.map((t) => (
                <Pressable key={t.key} onPress={() => setPayType(t.key)} style={[styles.typeCard, payType === t.key && styles.typeCardActive]} accessibilityRole="button">
                  <MaterialCommunityIcons name={t.icon as any} size={22} color={payType === t.key ? Colors.primary : Colors.onSurfaceVariant} />
                  <AppText variant="bodySm" color={payType === t.key ? 'primary' : 'variant'} weight={payType === t.key ? 'bold' : 'regular'} align="center">{t.label}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {step === 1 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>פרטי תשלום</AppText>
            <Input label="סכום (₪)" placeholder="0" keyboardType="numeric" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="תאריך" placeholder="DD/MM/YYYY" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="שם/מקור" placeholder="שם הדייר או הספק" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="הערות" placeholder="אופציונלי..." multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
          </View>
        )}
        {step === 2 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>אישור</AppText>
            <AppText variant="bodyMd" color="variant">בדוק את הפרטים לפני השמירה.</AppText>
          </View>
        )}
        <Button label={step === STEPS.length - 1 ? 'שמור תשלום' : 'המשך'} onPress={() => step < STEPS.length - 1 ? setStep((s) => s + 1) : router.back()} fullWidth size="lg" style={{ marginTop: Spacing.base }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row-reverse', justifyContent: 'center', padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  stepItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
  directionRow: { flexDirection: 'row-reverse', gap: Spacing.md },
  dirBtn: { flex: 1, alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.outlineVariant },
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
  typeCard: { width: '47%', alignItems: 'center', gap: Spacing.xs, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outlineVariant },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer },
});
