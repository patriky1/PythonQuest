import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { LoadingAnimation } from '@/components/LoadingScreen';

type AppVideoSplashProps = {
  onFinish: () => void;
  /** Primeiro quadro da animação visível: hora de tirar a tela nativa de abertura. */
  onReady?: () => void;
};

const SPLASH_DURATION_MS = 2600;
const FADE_DURATION_MS = 380;

/** Abertura do app: a animação de carregamento por cima de tudo, depois some com suavidade. */
export function AppVideoSplash({ onFinish, onReady }: AppVideoSplashProps) {
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(() => onFinish());
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onFinish, exit]);

  return (
    <Animated.View
      style={[styles.container, { opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      {/* Ao sair, a cobrinha cresce um pouco enquanto some (em vez de só apagar). */}
      <Animated.View
        style={{
          transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }]
        }}
      >
        <LoadingAnimation onDisplay={onReady} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
