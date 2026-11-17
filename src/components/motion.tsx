import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle
} from 'react-native';

// ---------------------------------------------------------------------------
// "Reduzir movimento" do sistema: lido uma vez ao carregar o módulo e mantido
// atualizado, para todas as animações do app respeitarem a preferência.
// ---------------------------------------------------------------------------

let reduceMotionEnabled = false;
const reduceMotionListeners = new Set<(enabled: boolean) => void>();

function setReduceMotion(enabled: boolean) {
  reduceMotionEnabled = enabled;
  reduceMotionListeners.forEach((listener) => listener(enabled));
}

AccessibilityInfo.isReduceMotionEnabled()
  .then(setReduceMotion)
  .catch(() => undefined);
AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

export function useReduceMotion() {
  const [enabled, setEnabled] = useState(reduceMotionEnabled);

  useEffect(() => {
    setEnabled(reduceMotionEnabled);
    reduceMotionListeners.add(setEnabled);

    return () => {
      reduceMotionListeners.delete(setEnabled);
    };
  }, []);

  return enabled;
}

// ---------------------------------------------------------------------------
// PressableScale: cartão/botão que afunda com mola ao toque
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> &
  PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    /** Escala no toque (0.97 = afunda 3%). */
    scaleTo?: number;
  }>;

export function PressableScale({
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      friction: 6,
      tension: 320,
      useNativeDriver: true
    }).start();

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        if (!reduceMotionEnabled) {
          springTo(scaleTo);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        springTo(1);
        onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Reveal: entrada da tela em sequência (sobe e aparece), uma vez por montagem
// ---------------------------------------------------------------------------

type RevealProps = PropsWithChildren<{
  /** Posição na sequência; cada passo atrasa um pouco mais. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

const REVEAL_STEP_MS = 70;
const REVEAL_MAX_STEPS = 7;

export function Reveal({ index = 0, style, children }: RevealProps) {
  const progress = useRef(new Animated.Value(reduceMotionEnabled ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotionEnabled) {
      progress.setValue(1);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, REVEAL_MAX_STEPS) * REVEAL_STEP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    });
    animation.start();

    // Se a animação for interrompida, o conteúdo nunca fica invisível.
    return () => {
      animation.stop();
      progress.setValue(1);
    };
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// CountUp: número que conta até o valor (XP, porcentagens, medalhas)
// ---------------------------------------------------------------------------

type CountUpProps = {
  value: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

export function CountUp({ value, style, prefix = '', suffix = '', duration = 700 }: CountUpProps) {
  const animated = useRef(new Animated.Value(reduceMotionEnabled ? value : 0)).current;
  const [display, setDisplay] = useState(reduceMotionEnabled ? value : 0);

  useEffect(() => {
    if (reduceMotionEnabled) {
      setDisplay(value);
      return;
    }

    const id = animated.addListener(({ value: current }) => setDisplay(Math.round(current)));
    const animation = Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      // Texto não é animável no driver nativo.
      useNativeDriver: false
    });
    animation.start(() => setDisplay(value));

    return () => {
      animation.stop();
      animated.removeListener(id);
    };
  }, [value, duration, animated]);

  return (
    <Text style={style}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// PulseRing: anel que pulsa atrás de um elemento para chamar atenção
// ---------------------------------------------------------------------------

export function PulseRing({ size, color }: { size: number; color: string }) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.setValue(0);

    if (reduceMotion) {
      return;
    }

    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    );
    loop.start();

    return () => loop.stop();
  }, [pulse, reduceMotion]);

  if (reduceMotion) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }]
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Float: sobe e desce devagar (ícones de destaque, logo)
// ---------------------------------------------------------------------------

export function Float({
  children,
  distance = 6,
  duration = 2600,
  style
}: PropsWithChildren<{ distance?: number; duration?: number; style?: StyleProp<ViewStyle> }>) {
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    value.setValue(0);

    if (reduceMotion) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [value, reduceMotion, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}
