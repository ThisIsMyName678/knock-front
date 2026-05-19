import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import {
  Colors,
  Spacing,
  Radius,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type ImportModule = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  templateName: string;
};

const IMPORT_MODULES: ImportModule[] = [
  {
    key: 'assets',
    title: 'נכסים',
    description: 'ייבוא נכסים, יחידות ופרטי שטח/כתובת לפי תבנית המערכת.',
    icon: 'home-outline',
    templateName: 'נכסים',
  },
  {
    key: 'projects',
    title: 'פרויקטים',
    description: 'ייבוא פרויקטים וקישור לנכסים קיימים.',
    icon: 'domain',
    templateName: 'פרויקטים',
  },
  {
    key: 'tasks',
    title: 'משימות',
    description: 'ייבוא משימות, תאריכי יעד וסטטוסים.',
    icon: 'checkbox-marked-outline',
    templateName: 'משימות',
  },
  {
    key: 'contracts',
    title: 'חוזים',
    description: 'ייבוא חוזים, תקופות וצדדים (לפי שדות נתמכים).',
    icon: 'file-sign',
    templateName: 'חוזים',
  },
  {
    key: 'payments',
    title: 'תשלומים',
    description: 'ייבוא תנועות תשלום, סכומים ותאריכים.',
    icon: 'cash-multiple',
    templateName: 'תשלומים',
  },
  {
    key: 'documents',
    title: 'מסמכים',
    description: 'רישום מטא-דאטה של מסמכים; קבצים יעלו בנפרד.',
    icon: 'folder-outline',
    templateName: 'מסמכים',
  },
  {
    key: 'contacts',
    title: 'אנשי קשר',
    description: 'ייבוא אנשי קשר, תפקידים ופרטי התקשרות.',
    icon: 'contacts-outline',
    templateName: 'אנשי קשר',
  },
];

function ImportSectionCard({ mod }: { mod: ImportModule }) {
  const onDownloadTemplate = () => {
    Alert.alert(
      'הורדת פורמט',
      `הורדת קובץ הדוגמה ל־${mod.templateName} (CSV/Excel) תתחבר לשרת בהמשך.`,
    );
  };

  const onUpload = () => {
    Alert.alert(
      'העלאת קובץ',
      `בחירת קובץ לייבוא ${mod.title} תתווסף בהמשך (בחירה מהמכשיר / ענן).`,
    );
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <MaterialCommunityIcons name={mod.icon} size={22} color={Colors.primary} />
        </View>
        <View style={styles.sectionTitleCol}>
          <AppText variant="bodyMd" weight="bold" style={styles.sectionTitle}>
            {mod.title}
          </AppText>
          <AppText variant="caption" color="muted" style={styles.sectionDesc}>
            {mod.description}
          </AppText>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <Button
          label="הורדת פורמט"
          variant="secondary"
          size="sm"
          onPress={onDownloadTemplate}
          style={styles.actionBtn}
          icon={
            <MaterialCommunityIcons name="download-outline" size={18} color={Colors.primary} />
          }
        />
        <Button
          label="העלאת קובץ"
          variant="primary"
          size="sm"
          onPress={onUpload}
          style={styles.actionBtn}
          icon={
            <MaterialCommunityIcons name="upload-outline" size={18} color={Colors.onPrimary} />
          }
        />
      </View>
    </View>
  );
}

export default function DataImportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="ייבוא נתונים"
        subtitle="תבניות והעלאה לפי מודול"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <MaterialCommunityIcons name="database-import" size={36} color={Colors.primary} />
          <AppText variant="bodyMd" color="variant" style={styles.introText}>
            בכל מודול ניתן להוריד קובץ דוגמה עם כותרות העמודות, למלא נתונים ולהעלות בחזרה.
            הפעולות כאן הן לתצוגה — חיבור לשרת יופעל בהמשך.
          </AppText>
        </View>

        <AppText variant="labelSm" weight="semiBold" color="muted" style={styles.listLabel}>
          מודולים
        </AppText>

        {IMPORT_MODULES.map((mod) => (
          <ImportSectionCard key={mod.key} mod={mod} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: CONTENT_HORIZONTAL_PADDING,
    gap: Spacing.md,
  },
  intro: {
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.base,
  },
  introText: { flex: 1, textAlign: 'right', lineHeight: 22 },
  listLabel: {
    textAlign: 'right',
    paddingTop: Spacing.sm,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleCol: { flex: 1, gap: 4 },
  sectionTitle: { textAlign: 'right' },
  sectionDesc: { textAlign: 'right', lineHeight: 18 },
  actionsRow: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
  },
  actionBtn: { flex: 1 },
});
