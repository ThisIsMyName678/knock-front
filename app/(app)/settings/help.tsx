import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type FaqItem = {
  id: string;
  q: string;
  a: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'f1',
    q: 'איך מוסיפים נכס חדש?',
    a: 'עבור לדף "נכסים" דרך התפריט, לחץ על כפתור ה־+ בתחתית המסך, ומלא את פרטי הנכס בשלבים.',
  },
  {
    id: 'f2',
    q: 'איך יוצרים חוזה חדש?',
    a: 'עבור לדף "חוזים", לחץ על "חוזה חדש" ומלא את הפרטים בשלבים. ניתן גם לשייך חוזה ישירות בעת יצירת נכס.',
  },
  {
    id: 'f3',
    q: 'איך מנהלים תשלומים?',
    a: 'בדף "תשלומים" תמצא רשימת כל התשלומים. ניתן לסנן לפי תאריך, כיוון (הכנסות/הוצאות) וקטגוריה.',
  },
  {
    id: 'f4',
    q: 'מה ההבדל בין פרויקט לנכס?',
    a: 'פרויקט הוא ישות שמכילה מספר נכסים (למשל בניין מגורים עם דירות). נכס הוא יחידה בודדת כמו דירה, משרד או חנות.',
  },
  {
    id: 'f5',
    q: 'כיצד משייכים משימה לנכס?',
    a: 'בעת יצירת משימה, ניתן לבחור נכס או פרויקט מהרשימה. ניתן גם ליצור משימה ישירות מתוך מסך הנכס, בלשונית "משימות".',
  },
  {
    id: 'f6',
    q: 'האם ניתן לייצא נתונים?',
    a: 'ייצוא נתונים זמין במסלול Enterprise. פנה לתמיכה לפרטים נוספים.',
  },
];

const QUICK_LINKS = [
  { icon: 'email-outline' as const, label: 'שלח מייל לתמיכה', onPress: () => Linking.openURL('mailto:support@knocknock.co.il') },
  { icon: 'whatsapp' as const, label: 'WhatsApp לתמיכה', onPress: () => Linking.openURL('https://wa.me/972501234567') },
  { icon: 'web' as const, label: 'מרכז העזרה המלא', onPress: () => Linking.openURL('https://help.knocknock.co.il') },
];

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => [styles.faqRow, pressed && { backgroundColor: Colors.surfaceVariant }]}
      accessibilityRole="button"
    >
      <View style={styles.faqTop}>
        <AppText variant="bodyMd" weight="semiBold" style={{ flex: 1, textAlign: 'right' }}>
          {item.q}
        </AppText>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </View>
      {open && (
        <AppText variant="bodyMd" color="variant" style={styles.faqAnswer}>
          {item.a}
        </AppText>
      )}
    </Pressable>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="עזרה ותמיכה" showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introWrap}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons name="lifebuoy" size={32} color={Colors.primary} />
          </View>
          <AppText variant="headingSm" weight="bold" style={{ textAlign: 'right' }}>
            איך נוכל לעזור?
          </AppText>
          <AppText variant="bodyMd" color="variant" style={{ textAlign: 'right' }}>
            מצא תשובות לשאלות נפוצות, או צור איתנו קשר ישירות.
          </AppText>
        </View>

        {/* Quick contact */}
        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
          צור קשר
        </AppText>
        <Card>
          {QUICK_LINKS.map((link, i) => (
            <Pressable
              key={link.label}
              onPress={link.onPress}
              style={({ pressed }) => [styles.linkRow, pressed && { backgroundColor: Colors.surfaceVariant }, i < QUICK_LINKS.length - 1 && styles.rowBorder]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name={link.icon} size={20} color={Colors.primary} />
              <AppText variant="bodyMd" style={{ flex: 1, textAlign: 'right' }}>{link.label}</AppText>
              <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.onSurfaceMuted} />
            </Pressable>
          ))}
        </Card>

        {/* FAQ */}
        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.sectionLabel}>
          שאלות נפוצות
        </AppText>
        <View style={styles.faqCard}>
          {FAQ_ITEMS.map((item, i) => (
            <View key={item.id} style={i < FAQ_ITEMS.length - 1 && styles.rowBorder}>
              <FaqRow item={item} />
            </View>
          ))}
        </View>

        <AppText variant="caption" color="muted" style={{ textAlign: 'center', marginTop: Spacing.xl }}>
          גרסה 1.0.0 · Knock Asset Management
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.sm },
  introWrap: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  introIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    textAlign: 'right',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  linkRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineLight },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  faqRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  faqTop: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  faqAnswer: {
    marginTop: Spacing.sm,
    paddingRight: 4,
    lineHeight: 22,
  },
});
