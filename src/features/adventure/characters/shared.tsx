import React, { ForwardedRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import type { SpriteHandle } from '@/features/adventure/AnimatedSprite';

type AnimatedNumber = Animated.Value | Animated.AnimatedInterpolation<number> | number;

/** Valor que vai de 0 a 1 em loop enquanto `enabled` for verdadeiro (volta a 0 quando para). */
export function useLoop(duration: number, enabled: boolean) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    value.setValue(0);

    if (!enabled) {
      return;
    }

    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    loop.start();

    return () => loop.stop();
  }, [duration, enabled, value]);

  return value;
}

/** Piscar em intervalos aleatórios: 1 = olho aberto, ~0 = fechado. */
export function useBlink(enabled: boolean) {
  const lid = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    lid.setValue(1);

    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(lid, { toValue: 0.08, duration: 70, useNativeDriver: true }),
          Animated.timing(lid, { toValue: 1, duration: 120, useNativeDriver: true })
        ]).start(() => {
          if (!cancelled) {
            schedule();
          }
        });
      }, 1800 + Math.random() * 3200);
    };

    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      lid.stopAnimation();
      lid.setValue(1);
    };
  }, [enabled, lid]);

  return lid;
}

/**
 * Direção do olhar até um alvo que se move (o herói). `origin` e o alvo estão
 * no mesmo sistema de coordenadas do tabuleiro; `reach` é a distância em que o
 * olhar chega ao máximo e `range` é quanto a pupila anda.
 */
export function useGaze(
  target: Animated.ValueXY | undefined,
  origin: { x: number; y: number } | undefined,
  reach: number,
  range: number
): { x: AnimatedNumber; y: AnimatedNumber } {
  const originX = origin?.x ?? 0;
  const originY = origin?.y ?? 0;

  return useMemo(() => {
    if (!target || !origin || reach <= 0) {
      return { x: 0, y: 0 };
    }

    const axis = (value: Animated.Value, center: number) =>
      value.interpolate({
        inputRange: [center - reach, center, center + reach],
        outputRange: [-range, 0, range],
        extrapolate: 'clamp'
      });

    return { x: axis(target.x, originX), y: axis(target.y, originY) };
    // `origin` entra pelos números para não recriar a cada renderização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, originX, originY, reach, range]);
}

/**
 * Expõe a mesma interface do AnimatedSprite (`play`/`reset`) para
 * personagens desenhados em código. Cada clipe é um valor de 0 a 1.
 */
export function useClipHandle<Clip extends string>(
  ref: ForwardedRef<SpriteHandle>,
  durations: Record<Clip, number>,
  reduceMotion: boolean
) {
  const valuesRef = useRef<Record<Clip, Animated.Value> | null>(null);

  if (!valuesRef.current) {
    valuesRef.current = Object.fromEntries(
      Object.keys(durations).map((name) => [name, new Animated.Value(0)])
    ) as Record<Clip, Animated.Value>;
  }

  const values = valuesRef.current;

  useImperativeHandle(
    ref,
    () => ({
      play: (name, options) =>
        new Promise<void>((resolve) => {
          const value = values[name as Clip];

          if (!value) {
            resolve();
            return;
          }

          const duration = options?.duration ?? durations[name as Clip];
          value.stopAnimation();
          value.setValue(0);

          if (reduceMotion) {
            setTimeout(resolve, duration);
            return;
          }

          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true
          }).start(() => {
            value.setValue(0);
            resolve();
          });
        }),
      reset: () => {
        for (const value of Object.values(values) as Animated.Value[]) {
          value.stopAnimation();
          value.setValue(0);
        }
      }
    }),
    [durations, reduceMotion, values]
  );

  return values;
}

type EyeProps = {
  width: number;
  height: number;
  left: number;
  top: number;
  gaze: { x: AnimatedNumber; y: AnimatedNumber };
  lid?: Animated.Value;
  pupil?: number;
  pupilColor?: string;
  white?: string | null;
};

/** Olho com pupila que segue o olhar, brilho e pálpebra. */
export function Eye({
  width,
  height,
  left,
  top,
  gaze,
  lid,
  pupil = Math.min(width, height) * 0.58,
  pupilColor = '#0F172A',
  white = '#FFFFFF'
}: EyeProps) {
  const glint = Math.max(2, pupil * 0.34);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        borderRadius: width,
        backgroundColor: white ?? 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transform: lid ? [{ scaleY: lid }] : []
      }}
    >
      <Animated.View
        style={{
          width: pupil,
          height: white ? pupil : height,
          borderRadius: pupil,
          backgroundColor: pupilColor,
          transform: [{ translateX: gaze.x }, { translateY: gaze.y }]
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: pupil * 0.12,
            right: pupil * 0.14,
            width: glint,
            height: glint,
            borderRadius: glint,
            backgroundColor: '#FFFFFF'
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

/** Ponto de exclamação que aparece com um "pop" quando o inimigo fica em alerta. */
export function AlertMark({
  visible,
  size,
  reduceMotion
}: {
  visible: boolean;
  size: number;
  reduceMotion: boolean;
}) {
  const pop = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      pop.setValue(visible ? 1 : 0);
      return;
    }

    if (visible) {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
    } else {
      Animated.timing(pop, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    }
  }, [visible, pop, reduceMotion]);

  const badge = Math.max(14, size * 0.3);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -badge * 0.55,
        right: size * 0.04,
        width: badge,
        height: badge,
        borderRadius: badge,
        backgroundColor: '#FACC15',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pop,
        transform: [
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
          { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '8deg'] }) }
        ]
      }}
    >
      <Animated.Text
        style={{ color: '#B91C1C', fontSize: badge * 0.68, fontWeight: '900', lineHeight: badge * 0.8 }}
      >
        !
      </Animated.Text>
    </Animated.View>
  );
}
