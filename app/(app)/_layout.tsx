import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Colors } from '@/constants/tokens';
import { AppText } from '@/components/ui/Text';

export default function AppLayout() {
  const { initialized, session, backendUser, backendUserLoading } = useAuth();

  console.log('[AppLayout] Render:', { initialized, hasSession: !!session, hasBackendUser: !!backendUser, backendUserLoading });

  if (!initialized || (session && backendUserLoading)) {
    console.log('[AppLayout] Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <AppText style={styles.loadingText}>טוען נתונים...</AppText>
      </View>
    );
  }

  if (!session) {
    console.log('[AppLayout] No session, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  if (!backendUser) {
    console.log('[AppLayout] Blocking render (no backend user)');
    return null;
  }

  console.log('[AppLayout] Rendering protected stack');
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.onSurfaceVariant,
  },
});
