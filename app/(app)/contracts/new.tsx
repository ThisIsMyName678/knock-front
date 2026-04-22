import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const STEPS = ['פרטי חוזה', 'תנאים', 'חתימה'];

export default function NewContractScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">חוזה חדש</AppText>
        <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>{step + 1}/{STEPS.length}</AppText>
      </View>

      <View style={styles.stepRow}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step
                ? <MaterialCommunityIcons name="check" size={14} color={Colors.onPrimary} />
                : <AppText variant="labelSm" weight="bold" color={i === step ? 'onPrimary' : 'muted'}>{i + 1}</AppText>}
            </View>
            <AppText variant="caption" color={i <= step ? 'primary' : 'muted'} align="center">{s}</AppText>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>פרטי חוזה</AppText>
            <Input label="שם הדייר" placeholder="שם מלא" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="נכס" placeholder="בחר נכס" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="שכירות חודשית (₪)" placeholder="0" keyboardType="numeric" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="תאריך התחלה" placeholder="DD/MM/YYYY" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="תאריך סיום" placeholder="DD/MM/YYYY" />
          </View>
        )}
        {step === 1 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>תנאים</AppText>
            <Input label="פיקדון (₪)" placeholder="0" keyboardType="numeric" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="יום התשלום בחודש" placeholder="1-28" keyboardType="numeric" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="הערות" placeholder="תנאים מיוחדים..." multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
          </View>
        )}
        {step === 2 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>חתימה</AppText>
            <Pressable style={styles.uploadBox} onPress={() => {}} accessibilityRole="button">
              <MaterialCommunityIcons name="draw-pen" size={32} color={Colors.primary} />
              <AppText variant="bodyMd" color="primary" weight="semiBold" align="center">לחץ לחתימה דיגיטלית</AppText>
            </Pressable>
          </View>
        )}
        <Button label={step === STEPS.length - 1 ? 'שמור חוזה' : 'המשך'} onPress={() => step < STEPS.length - 1 ? setStep((s) => s + 1) : router.back()} fullWidth size="lg" style={{ marginTop: Spacing.base }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row-reverse', justifyContent: 'center', padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, gap: 0 },
  stepItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
  uploadBox: { borderWidth: 2, borderColor: Colors.outlineVariant, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceVariant },
});
