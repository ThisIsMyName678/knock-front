import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './Text';
import { Button } from './Button';
import { Colors, Spacing } from '@/constants/tokens';

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function EmptyState({ icon, title, description, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}

      <AppText variant="headingSm" weight="bold" align="center" style={styles.title}>
        {title}
      </AppText>

      {description ? (
        <AppText variant="bodyMd" color="variant" align="center" style={styles.desc}>
          {description}
        </AppText>
      ) : null}

      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { color: Colors.onBackground },
  desc: { maxWidth: 260 },
  action: { marginTop: Spacing.sm },
});
