import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { Colors, Spacing } from '@/constants/tokens';

export default function LoadingScreen() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={Colors.accent} />
      <AppText variant="bodyMd" color="variant" align="center" style={{ marginTop: Spacing.md }}>
        טוען נתונים...
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
});
