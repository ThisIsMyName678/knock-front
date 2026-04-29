import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import { AppText } from './Text';
import { Colors, Radius, Spacing, FontFamily, FontSize, MIN_TOUCH } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = TextInputProps & {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightPress?: () => void;
  containerStyle?: ViewStyle;
};

export function Input({
  label,
  required,
  hint,
  error,
  icon,
  iconRight,
  onIconRightPress,
  containerStyle,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
      ? Colors.primary
      : Colors.outlineVariant;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="labelMd" weight="semiBold" style={styles.label}>
            {label}
          </AppText>
          {required && (
            <AppText variant="labelMd" weight="bold" style={styles.asterisk}>
              {' '}*
            </AppText>
          )}
        </View>
      ) : null}

      <View style={[styles.inputRow, { borderColor }]}>
        {icon ? <View style={styles.iconLeft}>{icon}</View> : null}

        <TextInput
          style={[styles.input, icon ? styles.inputWithIconLeft : undefined, style]}
          placeholderTextColor={Colors.onSurfaceMuted}
          textAlign="right"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {iconRight ? (
          <Pressable
            onPress={onIconRightPress}
            style={styles.iconRight}
            hitSlop={8}
          >
            {iconRight}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" color="error" style={styles.hint}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="muted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  label: { textAlign: 'right' },
  asterisk: { color: Colors.error },
  inputRow: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    paddingVertical: Spacing.sm,
  },
  inputWithIconLeft: { paddingRight: Spacing.xs },
  iconLeft: { marginLeft: Spacing.xs },
  iconRight: {
    marginRight: Spacing.xs,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  hint: { marginTop: 2 },
});
