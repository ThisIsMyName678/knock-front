import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing } from '@/constants/tokens';
import { RTL_ROW } from '@/constants/rtl';

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
};

export function SectionCard({
  title,
  subtitle,
  icon,
  iconColor = Colors.primary,
  children,
  style,
  noPadding = false,
}: Props) {
  return (
    <Card style={style} noPadding={noPadding}>
      <View style={[styles.header, noPadding && styles.headerWithPadding]}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
            <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMd" weight="bold">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" color="muted" numberOfLines={2}>{subtitle}</AppText>
          ) : null}
        </View>
      </View>
      <View style={[styles.body, noPadding && styles.bodyWithPadding]}>
        {children}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: RTL_ROW,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerWithPadding: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { gap: Spacing.sm },
  bodyWithPadding: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
});
