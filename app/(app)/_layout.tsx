import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { NotificationsBadgeProvider } from '@/lib/notifications-badge';
import { Colors, Spacing, Radius } from '@/constants/tokens';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

const DEFAULT_BACKEND_ERROR =
  'לא ניתן לטעון את פרטי המשתמש מהשרת. בדוק את החיבור ונסה שוב.';

function BackendAuthErrorScreen() {
  const { backendAuthError, backendUserLoading, refreshBackendUser, signOut } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const onRetry = async () => {
    setRetrying(true);
    try {
      await refreshBackendUser();
    } finally {
      setRetrying(false);
    }
  };

  const isBusy = retrying || backendUserLoading;
  const message = backendAuthError ?? DEFAULT_BACKEND_ERROR;

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconWrap}>
        <MaterialCommunityIcons name="cloud-off-outline" size={40} color={Colors.error} />
      </View>
      <AppText variant="headingSm" weight="bold" align="center" style={styles.errorTitle}>
        לא ניתן להיכנס לאפליקציה
      </AppText>
      <AppText variant="bodyMd" color="variant" align="center" style={styles.errorMessage}>
        {message}
      </AppText>
      <View style={styles.errorActions}>
        <Button
          label="נסה שוב"
          onPress={onRetry}
          loading={isBusy}
          disabled={isBusy}
          fullWidth
          size="lg"
        />
        <Button
          label="התנתק"
          onPress={() => void signOut()}
          variant="secondary"
          disabled={isBusy}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { initialized, session, backendUser, backendUserLoading, passwordRecoveryPending } =
    useAuth();

  console.log('[AppLayout] Render:', { initialized, hasSession: !!session, hasBackendUser: !!backendUser, backendUserLoading });

  if (passwordRecoveryPending) {
    return <Redirect href="/(auth)/reset-password" />;
  }

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
    console.log('[AppLayout] Showing backend auth error screen');
    return <BackendAuthErrorScreen />;
  }

  console.log('[AppLayout] Rendering protected stack');
  return (
    <NotificationsBadgeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </NotificationsBadgeProvider>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    color: Colors.onBackground,
  },
  errorMessage: {
    maxWidth: 320,
    marginBottom: Spacing.sm,
  },
  errorActions: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
