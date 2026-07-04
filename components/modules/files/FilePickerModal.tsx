import React from 'react';
import {
  View,
  Modal,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { pickFile, type PickedFile } from '@/lib/storage';
import {
  Colors,
  Spacing,
  Radius,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type FilePickerModalProps = {
  visible: boolean;
  onPicked: (file: PickedFile) => void;
  onCancel: () => void;
};

export function FilePickerModal({ visible, onPicked, onCancel }: FilePickerModalProps) {
  const insets = useSafeAreaInsets();

  const handlePickFile = async (imageOnly: boolean) => {
    onCancel();
    let picked: PickedFile | null = null;
    try {
      picked = await pickFile(imageOnly);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לפתוח את בורר הקבצים');
      return;
    }
    if (!picked) return;
    onPicked(picked);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.pickSheetHandle} />
          <AppText variant="labelMd" weight="bold" style={styles.pickSheetTitle}>
            בחירת מקור
          </AppText>
          {(
            [
              { kind: 'file' as const, icon: 'file-upload-outline' as const, label: 'קובץ מהמכשיר', hint: 'PDF או מסמך', imageOnly: false },
              { kind: 'image' as const, icon: 'image-outline' as const, label: 'תמונה מהגלריה', hint: 'בחירת תמונה', imageOnly: true },
              { kind: 'camera' as const, icon: 'camera-outline' as const, label: 'מצלמה', hint: 'בקרוב', imageOnly: false },
            ] as const
          ).map((opt, i) => (
            <Pressable
              key={opt.kind}
              onPress={() => {
                if (opt.kind === 'camera') {
                  onCancel();
                  Alert.alert('בקרוב', 'צילום ממצלמה יתווסף בגרסה הבאה');
                  return;
                }
                handlePickFile(opt.imageOnly);
              }}
              style={({ pressed }) => [
                styles.pickSheetRow,
                i < 2 && styles.pickSheetRowBorder,
                pressed && { backgroundColor: Colors.surfaceVariant },
              ]}
              accessibilityRole="button"
            >
              <View style={styles.pickSheetIconCircle}>
                <MaterialCommunityIcons name={opt.icon} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="semiBold">
                  {opt.label}
                </AppText>
                <AppText variant="caption" color="muted">
                  {opt.hint}
                </AppText>
              </View>
              <MaterialCommunityIcons name="chevron-left" size={20} color={Colors.onSurfaceMuted} />
            </Pressable>
          ))}
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.pickSheetCancel, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
          >
            <AppText variant="bodyMd" color="variant" align="center">
              ביטול
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  pickSheetTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  pickSheetRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pickSheetRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineLight,
  },
  pickSheetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickSheetCancel: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
    maxHeight: '70%',
  },
});
