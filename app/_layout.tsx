import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { I18nManager, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Assistant_400Regular,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
} from '@expo-google-fonts/assistant';
import { AuthProvider } from '@/lib/auth';
import { useAppReady } from '@/lib/use-app-ready';
import { useMinimumSplashElapsed } from '@/lib/use-minimum-splash-elapsed';
import { StartupSplashScreen } from '@/components/splash/StartupSplashScreen';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

I18nManager.forceRTL(true);

async function hideNativeSplash() {
  try {
    await SplashScreen.hideAsync();
  } catch {
    // noop — already hidden or unavailable in this runtime
  }
}

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const appReady = useAppReady(fontsLoaded);
  const minSplashElapsed = useMinimumSplashElapsed(1100);
  const [showSplash, setShowSplash] = useState(true);
  const canDismissSplash = appReady && minSplashElapsed;

  useEffect(() => {
    if (canDismissSplash) {
      void hideNativeSplash();
    }
  }, [canDismissSplash]);

  const onSplashDismiss = useCallback(() => {
    void hideNativeSplash();
    setShowSplash(false);
  }, []);

  const onSplashPainted = useCallback(() => {
    void hideNativeSplash();
  }, []);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      {showSplash ? (
        <StartupSplashScreen
          canDismiss={canDismissSplash}
          onDismiss={onSplashDismiss}
          onPainted={onSplashPainted}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Assistant_400Regular,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
