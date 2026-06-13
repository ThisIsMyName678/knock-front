import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/tokens';

const knockLogo = require('@/assets/knock-logo.png');

type Props = {
  canDismiss: boolean;
  onDismiss: () => void;
  onPainted: () => void;
};

export function StartupSplashScreen({ canDismiss, onDismiss, onPainted }: Props) {
  const logoScale = useSharedValue(0.985);
  const overlayOpacity = useSharedValue(1);
  const hasDismissedRef = useRef(false);
  const hasPaintedRef = useRef(false);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.975, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [logoScale]);

  useEffect(() => {
    if (!canDismiss || hasDismissedRef.current) {
      return;
    }

    hasDismissedRef.current = true;

    overlayOpacity.value = withTiming(
      0,
      { duration: 450, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      },
    );
  }, [canDismiss, onDismiss, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const handleLayout = () => {
    if (hasPaintedRef.current) {
      return;
    }

    hasPaintedRef.current = true;
    onPainted();
  };

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      onLayout={handleLayout}
      pointerEvents="auto"
    >
      <Animated.View style={[styles.content, contentStyle]}>
        <Image source={knockLogo} style={styles.logo} resizeMode="contain" accessibilityLabel="Knock" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  logo: {
    width: 240,
    height: 200,
  },
});
