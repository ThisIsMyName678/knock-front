import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '@/constants/tokens';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
};

export function Card({ children, onPress, style, elevated = false, noPadding = false }: Props) {
  const inner = (
    <View style={[styles.base, elevated && styles.elevated, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  elevated: {
    ...Shadow.md,
    borderWidth: 0,
  },
  noPadding: { padding: 0 },
  pressed: { opacity: 0.9 },
});
