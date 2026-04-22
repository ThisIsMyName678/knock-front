import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/constants/tokens';

type Variant =
  | 'displayLg'
  | 'displayMd'
  | 'headingLg'
  | 'headingMd'
  | 'headingSm'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'labelLg'
  | 'labelMd'
  | 'labelSm'
  | 'caption';

type Weight = 'regular' | 'semiBold' | 'bold' | 'extraBold';

type Color =
  | 'default'
  | 'primary'
  | 'variant'
  | 'muted'
  | 'onPrimary'
  | 'error'
  | 'success'
  | 'warning'
  | 'white';

type Props = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: Color;
  align?: 'right' | 'left' | 'center';
};

const variantStyles: Record<Variant, object> = {
  displayLg: { fontSize: FontSize['4xl'], lineHeight: FontSize['4xl'] * 1.2 },
  displayMd: { fontSize: FontSize['3xl'], lineHeight: FontSize['3xl'] * 1.2 },
  headingLg: { fontSize: FontSize['2xl'], lineHeight: FontSize['2xl'] * 1.3 },
  headingMd: { fontSize: FontSize.xl, lineHeight: FontSize.xl * 1.3 },
  headingSm: { fontSize: FontSize.lg, lineHeight: FontSize.lg * 1.35 },
  bodyLg: { fontSize: FontSize.md, lineHeight: FontSize.md * 1.5 },
  bodyMd: { fontSize: FontSize.base, lineHeight: FontSize.base * 1.5 },
  bodySm: { fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.5 },
  labelLg: { fontSize: FontSize.base, lineHeight: FontSize.base * 1.4 },
  labelMd: { fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.4 },
  labelSm: { fontSize: FontSize.xs, lineHeight: FontSize.xs * 1.4 },
  caption: { fontSize: FontSize.xs, lineHeight: FontSize.xs * 1.5 },
};

const weightStyles: Record<Weight, object> = {
  regular: { fontFamily: FontFamily.regular },
  semiBold: { fontFamily: FontFamily.semiBold },
  bold: { fontFamily: FontFamily.bold },
  extraBold: { fontFamily: FontFamily.extraBold },
};

const colorStyles: Record<Color, object> = {
  default: { color: Colors.onBackground },
  primary: { color: Colors.primary },
  variant: { color: Colors.onSurfaceVariant },
  muted: { color: Colors.onSurfaceMuted },
  onPrimary: { color: Colors.onPrimary },
  error: { color: Colors.error },
  success: { color: Colors.success },
  warning: { color: Colors.warning },
  white: { color: '#ffffff' },
};

export function AppText({
  variant = 'bodyMd',
  weight = 'regular',
  color = 'default',
  align = 'right',
  style,
  children,
  ...rest
}: Props) {
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        weightStyles[weight],
        colorStyles[color],
        { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily.regular,
    color: Colors.onBackground,
    textAlign: 'right',
  },
});
