import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  CONTENT_HORIZONTAL_PADDING,
} from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  visible: boolean;
  defaultName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function SaveReportModal({ visible, defaultName = '', onClose, onSave }: Props) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  const canSave = name.trim().length >= 2;

  const handleSave = () => {
    if (!canSave) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.center}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMd" weight="bold">שמירת דוח</AppText>
                <AppText variant="caption" color="muted">
                  כל ההגדרות וסינוני הדוח יישמרו בשם שתבחר
                </AppText>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <MaterialCommunityIcons name="close" size={18} color={Colors.onSurface} />
              </Pressable>
            </View>

            <View style={{ marginTop: Spacing.md }}>
              <Input
                label="שם הדוח"
                value={name}
                onChangeText={setName}
                placeholder="לדוגמה: סיכום פיננסי רבעוני"
                required
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <View style={styles.footer}>
              <Button label="ביטול" onPress={onClose} variant="ghost" style={{ flex: 1 }} />
              <Button
                label="שמור"
                onPress={handleSave}
                disabled={!canSave}
                style={{ flex: 2 }}
                icon={
                  <MaterialCommunityIcons name="check" size={18} color={Colors.onPrimary} />
                }
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: CONTENT_HORIZONTAL_PADDING,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.lg,
  },
  header: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: RTL_ROW,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
