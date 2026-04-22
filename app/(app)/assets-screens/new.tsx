import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const STEPS = ['פרטי הנכס', 'פרטי חוזה', 'מסמכים'];

const ASSET_TYPES = [
  { key: 'apartment', label: 'דירה', icon: 'home-outline' },
  { key: 'office', label: 'משרד', icon: 'office-building-outline' },
  { key: 'parking', label: 'חניה', icon: 'car-outline' },
  { key: 'storage', label: 'מחסן', icon: 'archive-outline' },
];

export default function NewAssetScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [assetType, setAssetType] = useState('');
  const [rent, setRent] = useState('');

  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.back();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())} style={styles.iconBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.onPrimary} />
        </Pressable>
        <AppText variant="headingMd" weight="bold" color="onPrimary">יצירת נכס</AppText>
        <AppText variant="bodySm" color="onPrimary" style={{ opacity: 0.8 }}>
          {step + 1}/{STEPS.length}
        </AppText>
      </View>

      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? (
                <MaterialCommunityIcons name="check" size={14} color={Colors.onPrimary} />
              ) : (
                <AppText variant="labelSm" weight="bold" color={i === step ? 'onPrimary' : 'muted'}>
                  {i + 1}
                </AppText>
              )}
            </View>
            <AppText variant="caption" color={i <= step ? 'primary' : 'muted'} align="center">
              {s}
            </AppText>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>פרטי הנכס</AppText>
            <Input label="שם הנכס" placeholder="לדוגמה: דירה 4B" value={name} onChangeText={setName} containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="כתובת" placeholder="רחוב, מספר, עיר" value={address} onChangeText={setAddress} containerStyle={{ marginBottom: Spacing.md }} />
            <AppText variant="labelMd" weight="semiBold" style={{ marginBottom: Spacing.sm }}>סוג נכס</AppText>
            <View style={styles.typeGrid}>
              {ASSET_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setAssetType(t.key)}
                  style={[styles.typeCard, assetType === t.key && styles.typeCardActive]}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name={t.icon as any} size={24} color={assetType === t.key ? Colors.primary : Colors.onSurfaceVariant} />
                  <AppText variant="bodySm" weight={assetType === t.key ? 'bold' : 'regular'} color={assetType === t.key ? 'primary' : 'variant'} align="center">
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>פרטי חוזה</AppText>
            <Input label="שכירות חודשית (₪)" placeholder="0" value={rent} onChangeText={setRent} keyboardType="numeric" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="שם דייר" placeholder="שם מלא" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="תאריך תחילת חוזה" placeholder="DD/MM/YYYY" containerStyle={{ marginBottom: Spacing.md }} />
            <Input label="תאריך סיום חוזה" placeholder="DD/MM/YYYY" />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>מסמכים</AppText>
            <Pressable
              style={styles.uploadBox}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="upload-outline" size={32} color={Colors.primary} />
              <AppText variant="bodyMd" color="primary" weight="semiBold" align="center">
                לחץ להעלאת מסמך
              </AppText>
              <AppText variant="bodySm" color="muted" align="center">
                PDF, תמונות — עד 10MB
              </AppText>
            </Pressable>
          </View>
        )}

        <Button label={isLast ? 'צור נכס' : 'המשך'} onPress={handleNext} fullWidth size="lg" style={{ marginTop: Spacing.base }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: Spacing.base, paddingTop: Spacing.sm, ...Shadow.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepBar: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'center', padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, gap: 0 },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative', gap: Spacing.xs },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepLine: { position: 'absolute', top: 14, left: '50%', right: '-50%', height: 2, backgroundColor: Colors.outlineVariant },
  stepLineActive: { backgroundColor: Colors.primary },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.outlineVariant },
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
  typeCard: { width: '47%', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outlineVariant, backgroundColor: Colors.surface },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer },
  uploadBox: { borderWidth: 2, borderColor: Colors.outlineVariant, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceVariant },
});
