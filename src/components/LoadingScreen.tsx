import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useReduceMotion } from '@/components/motion';

/**
 * Animação de carregamento: WebP animado gerado por
 * scripts/loading-animations/smooth_animations.py a partir do vídeo original.
 * 30 quadros/s com tempo uniforme e loop de ida e volta sem emenda.
 * Como imagem (e não vídeo), aparece já no primeiro quadro e não depende de
 * um player nativo que precise ser criado e liberado a cada tela.
 */
const loadingAnimation = require('../../assets/animations/loading.webp');

/** Tamanho padrão da animação (o mesmo da abertura do app). */
export const LOADING_ANIMATION_SIZE = 230;

type LoadingAnimationProps = {
  size?: number;
  /**
   * Espera antes de aparecer (ms). Carregamentos rápidos terminam antes e a
   * animação nem pisca na tela. A abertura do app usa 0.
   */
  delay?: number;
  /** Chamado quando o primeiro quadro já está na tela. */
  onDisplay?: () => void;
};

/** A animação de carregamento do app: a cobrinha em loop, entrando com suavidade. */
export function LoadingAnimation({
  size = LOADING_ANIMATION_SIZE,
  delay = 0,
  onDisplay
}: LoadingAnimationProps) {
  const reduceMotion = useReduceMotion();
  const appear = useRef(new Animated.Value(delay > 0 ? 0 : 1)).current;

  useEffect(() => {
    if (delay <= 0) {
      appear.setValue(1);
      return;
    }

    const animation = Animated.timing(appear, {
      toValue: 1,
      delay,
      duration: reduceMotion ? 1 : 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    });
    animation.start();

    return () => animation.stop();
  }, [appear, delay, reduceMotion]);

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            scale: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [reduceMotion ? 1 : 0.92, 1]
            })
          }
        ]
      }}
    >
      <Image
        source={loadingAnimation}
        contentFit="cover"
        // Com "reduzir movimento" ligado, mostra a cobrinha parada.
        autoplay={!reduceMotion}
        cachePolicy="memory"
        onDisplay={onDisplay}
        accessibilityIgnoresInvertColors
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.21,
          backgroundColor: '#FFFFFF'
        }}
      />
    </Animated.View>
  );
}

/**
 * Tela de carregamento padrão: só a animação, centralizada sobre branco
 * (mesmo fundo da animação, para não aparecer a borda dela).
 * Use `inline` dentro de uma página que já está aberta, em vez de tela cheia.
 */
export function LoadingScreen({
  inline = false,
  style
}: {
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[inline ? styles.inline : styles.fullScreen, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      <LoadingAnimation size={inline ? 140 : LOADING_ANIMATION_SIZE} delay={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 164,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF'
  }
});
