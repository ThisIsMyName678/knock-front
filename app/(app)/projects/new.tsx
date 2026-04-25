import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { Colors, Spacing, Radius, Shadow, CONTENT_HORIZONTAL_PADDING } from '@/constants/tokens';

export default function NewProjectScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="פרויקט חדש" showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <AppText variant="headingSm" weight="bold" style={{ marginBottom: Spacing.base }}>
            פרטי הפרויקט
          </AppText>
          <Input
            label="שם הפרויקט"
            placeholder="לדוגמה: מגדלי הים"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: Spacing.md }}
          />
          <Input
            label="כתובת"
            placeholder="רחוב, עיר"
            value={address}
            onChangeText={setAddress}
            containerStyle={{ marginBottom: Spacing.md }}
          />
          <Input
            label="תיאור (אופציונלי)"
            placeholder="תיאור קצר של הפרויקט..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
          />
        </View>

        <Button
          label="צור פרויקט"
          onPress={() => {
            router.back();
          }}
          fullWidth
          size="lg"
          style={{ marginTop: Spacing.base }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: CONTENT_HORIZONTAL_PADDING, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
});
