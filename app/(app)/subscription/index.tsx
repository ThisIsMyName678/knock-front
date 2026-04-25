import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

const PLANS = [
  {
    id: 'basic',
    name: 'בסיסי',
    price: 149,
    period: 'חודש',
    features: ['עד 10 נכסים', 'ניהול חוזים', 'תשלומים', 'תמיכה במייל'],
    current: false,
  },
  {
    id: 'pro',
    name: 'מקצועי',
    price: 349,
    period: 'חודש',
    features: ['נכסים ללא הגבלה', 'כל הפיצ׳רים', 'דוחות מתקדמים', 'תמיכה עדיפות', 'API גישה'],
    current: true,
  },
  {
    id: 'enterprise',
    name: 'ארגוני',
    price: 0,
    period: 'הצעת מחיר',
    features: ['הכל בגרסה מקצועית', 'SSO / SAML', 'SLA מותאם', 'הדרכה ייעודית', 'חשבון מנוהל'],
    current: false,
  },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="מסלולי מנוי" showBack />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]} showsVerticalScrollIndicator={false}>
        {/* Billing toggle */}
        <View style={styles.billingToggle}>
          {(['monthly', 'yearly'] as const).map((b) => (
            <Pressable key={b} onPress={() => setBilling(b)} style={[styles.billingBtn, billing === b && styles.billingBtnActive]} accessibilityRole="button">
              <AppText variant="labelMd" weight={billing === b ? 'bold' : 'regular'} style={{ color: billing === b ? Colors.onPrimary : Colors.onSurfaceVariant }}>
                {b === 'monthly' ? 'חודשי' : 'שנתי (-20%)'}
              </AppText>
            </Pressable>
          ))}
        </View>

        {PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.current && styles.planCardActive]}>
            {plan.current && (
              <View style={styles.currentBadge}>
                <Badge label="מסלול נוכחי" preset="primary" />
              </View>
            )}
            <View style={styles.planHeader}>
              <AppText variant="headingMd" weight="bold" color={plan.current ? 'onPrimary' : 'default'}>
                {plan.name}
              </AppText>
              <View style={styles.priceRow}>
                {plan.price > 0 ? (
                  <>
                    <AppText variant="displayMd" weight="extraBold" color={plan.current ? 'onPrimary' : 'primary'}>
                      ₪{billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price}
                    </AppText>
                    <AppText variant="bodyMd" color={plan.current ? 'onPrimary' : 'variant'} style={{ opacity: 0.8 }}>
                      /{plan.period}
                    </AppText>
                  </>
                ) : (
                  <AppText variant="headingSm" weight="bold" color={plan.current ? 'onPrimary' : 'primary'}>
                    {plan.period}
                  </AppText>
                )}
              </View>
            </View>

            <View style={styles.features}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={plan.current ? 'rgba(255,255,255,0.9)' : Colors.success} />
                  <AppText variant="bodyMd" color={plan.current ? 'onPrimary' : 'default'} style={{ opacity: plan.current ? 0.95 : 1 }}>{f}</AppText>
                </View>
              ))}
            </View>

            {!plan.current && (
              <Button
                label={plan.price === 0 ? 'צור קשר' : 'שדרג עכשיו'}
                onPress={() => {}}
                variant={plan.current ? 'secondary' : 'primary'}
                fullWidth
                style={{ marginTop: Spacing.md }}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.base },
  billingToggle: { flexDirection: 'row-reverse', backgroundColor: Colors.surfaceVariant, borderRadius: Radius.full, padding: 4, gap: 4 },
  billingBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.full },
  billingBtnActive: { backgroundColor: Colors.primary },
  planCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.outlineVariant, padding: Spacing.base, gap: Spacing.md, position: 'relative' },
  planCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  currentBadge: { position: 'absolute', top: -12, right: Spacing.base },
  planHeader: { gap: Spacing.xs },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4 },
  features: { gap: Spacing.sm },
  featureRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
});
