import React, { useState, useCallback } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from './Text';
import { Colors, Radius, Spacing, FontFamily, FontSize, MIN_TOUCH } from '@/constants/tokens';
import { formatDigitsAsIls, parseAmountDigits } from '@/lib/format/currency';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label?: string;
  hint?: string;
  error?: string;
  /** Digit-only value from parent (no commas). */
  value: string;
  onChangeValue: (digits: string) => void;
  containerStyle?: ViewStyle;
};

/**
 * Amount input with ₪ icon and thousands separators on blur (RTL).
 */
export function AmountField({
  label,
  hint,
  error,
  value,
  onChangeValue,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const displayText = focused ? value : value ? formatDigitsAsIls(value) : '';

  const borderColor = error ? Colors.error : focused ? Colors.primary : Colors.outlineVariant;

  const handleChange = useCallback(
    (text: string) => {
      onChangeValue(parseAmountDigits(text));
    },
    [onChangeValue],
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText variant="labelMd" weight="semiBold" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View style={[styles.inputRow, { borderColor }]}>
        <View style={styles.currencyWrap} accessibilityElementsHidden>
          <MaterialCommunityIcons name="currency-ils" size={22} color={Colors.primary} />
        </View>
        <TextInput
          style={[styles.input, style]}
          placeholder="0"
          placeholderTextColor={Colors.onSurfaceMuted}
          textAlign="right"
          keyboardType="number-pad"
          value={displayText}
          onChangeText={handleChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
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
  label: { textAlign: 'right' },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
  },
  currencyWrap: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.onBackground,
    paddingVertical: Spacing.sm,
  },
  hint: { marginTop: 2 },
});
