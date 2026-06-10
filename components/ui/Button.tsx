import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { AppText } from './Text';
import { Colors, Radius, Shadow, Spacing, FontFamily, MIN_TOUCH } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'right' | 'left';
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'right',
  fullWidth = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? Colors.onPrimary : Colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'right' && icon}
          <AppText
            variant={size === 'sm' ? 'labelMd' : 'labelLg'}
            weight="bold"
            align="center"
            style={{
              fontFamily: FontFamily.bold,
              color:
                variant === 'primary' || variant === 'danger'
                  ? Colors.onPrimary
                  : Colors.primary,
            }}
          >
            {label}
          </AppText>
          {icon && iconPosition === 'left' && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TOUCH,
    borderRadius: Radius.lg,
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  size_lg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md },
  variant_primary: { backgroundColor: Colors.primary, ...Shadow.sm },
  variant_secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: Colors.error },
});
