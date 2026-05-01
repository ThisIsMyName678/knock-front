import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { RECOMMENDED_DOCUMENT_CHECKLIST } from '@/lib/mocks/documents';
import { Colors, Spacing, Radius } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

/**
 * צ׳קליסט מסמכים מומלצים — זהה לטאב מסמכים בפרטי נכס/פרויקט.
 */
export function RecommendedDocChecklistPanel() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const toggleDoc = useCallback((name: string) => {
    setCheckedDocs((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  return (
    <View>
      <Pressable
        onPress={() => setShowChecklist((v) => !v)}
        style={styles.checklistHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: showChecklist }}
      >
        <AppText variant="labelMd" weight="bold" color="primary">
          רשימת מסמכים מומלצים
        </AppText>
        <MaterialCommunityIcons
          name={showChecklist ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.primary}
        />
      </Pressable>
      {showChecklist ? (
        <View style={styles.checklistBody}>
          {RECOMMENDED_DOCUMENT_CHECKLIST.map((name) => (
            <Pressable
              key={name}
              onPress={() => toggleDoc(name)}
              style={styles.checklistRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!checkedDocs[name] }}
            >
              <MaterialCommunityIcons
                name={checkedDocs[name] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={checkedDocs[name] ? Colors.success : Colors.outlineVariant}
              />
              <AppText
                variant="bodyMd"
                style={{
                  flex: 1,
                  textAlign: 'right',
                  textDecorationLine: checkedDocs[name] ? 'line-through' : 'none',
                  opacity: checkedDocs[name] ? 0.5 : 1,
                }}
              >
                {name}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  checklistHeader: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  checklistBody: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  checklistRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
});
