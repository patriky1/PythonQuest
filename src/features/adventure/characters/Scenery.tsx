import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useLoop } from '@/features/adventure/characters/shared';

const FLOWER_PALETTES = [
  { petal: '#F472B6', center: '#FDE047' },
  { petal: '#60A5FA', center: '#FEF3C7' },
  { petal: '#FBBF24', center: '#B45309' },
  { petal: '#A78BFA', center: '#FDE047' }
];

const PETAL_ANGLES = [0, 72, 144, 216, 288];

type FlowerProps = {
  size: number;
  variant: number;
  /** Herói por perto: a flor dá pulinhos em vez de só balançar. */
  excited: boolean;
  reduceMotion: boolean;
};

/**
 * Flor de enfeite do tabuleiro: balança com o vento (apoiada no pé do caule)
 * e se anima quando o herói passa ao lado.
 */
export function Flower({ size: s, variant, excited, reduceMotion }: FlowerProps) {
  const palette = FLOWER_PALETTES[variant % FLOWER_PALETTES.length];
  const sway = useLoop(2400 + (variant % 3) * 500, !reduceMotion);
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!excited || reduceMotion) {
      return;
    }

    bounce.setValue(0);
    Animated.sequence([
      Animated.timing(bounce, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.spring(bounce, { toValue: 0, friction: 3, tension: 160, useNativeDriver: true })
    ]).start();
  }, [excited, reduceMotion, bounce]);

  const head = s * 0.56;
  const petal = head * 0.42;
  const center = head * 0.36;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: s,
        height: s,
        transformOrigin: 'center bottom',
        transform: [
          {
            rotate: sway.interpolate({
              inputRange: [0, 0.25, 0.75, 1],
              outputRange: ['0deg', '7deg', '-7deg', '0deg']
            })
          },
          { scaleY: bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) },
          { scaleX: bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }
        ]
      }}
    >
      {/* Caule e folhas */}
      <View
        style={{
          position: 'absolute',
          left: s / 2 - s * 0.035,
          bottom: 0,
          width: s * 0.07,
          height: s * 0.55,
          borderRadius: s,
          backgroundColor: '#16A34A'
        }}
      />
      {[-1, 1].map((side) => (
        <View
          key={side}
          style={{
            position: 'absolute',
            left: s / 2 + (side < 0 ? -s * 0.24 : s * 0.02),
            bottom: s * 0.12,
            width: s * 0.22,
            height: s * 0.12,
            borderRadius: s,
            backgroundColor: '#22C55E',
            transform: [{ rotate: `${side * -28}deg` }]
          }}
        />
      ))}

      {/* Pétalas em volta do miolo */}
      <View style={{ position: 'absolute', left: (s - head) / 2, top: 0, width: head, height: head }}>
        {PETAL_ANGLES.map((angle) => {
          const radians = (angle * Math.PI) / 180;
          const reach = head * 0.27;

          return (
            <View
              key={angle}
              style={{
                position: 'absolute',
                left: head / 2 - petal / 2 + Math.sin(radians) * reach,
                top: head / 2 - petal / 2 - Math.cos(radians) * reach,
                width: petal,
                height: petal,
                borderRadius: petal,
                backgroundColor: palette.petal
              }}
            />
          );
        })}
        <View
          style={{
            position: 'absolute',
            left: (head - center) / 2,
            top: (head - center) / 2,
            width: center,
            height: center,
            borderRadius: center,
            backgroundColor: palette.center
          }}
        />
      </View>
    </Animated.View>
  );
}

/** Anéis que se expandem sobre uma casa: mostra no tabuleiro o alvo da dica. */
export function CellPing({
  size,
  color,
  reduceMotion
}: {
  size: number;
  color: string;
  reduceMotion: boolean;
}) {
  // Com "reduzir movimento", os anéis ficam parados (o destaque continua visível).
  const pulse = useLoop(1100, !reduceMotion);

  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {[0, 0.5].map((offset) => (
        <Animated.View
          key={offset}
          style={{
            position: 'absolute',
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size,
            borderWidth: 3,
            borderColor: color,
            opacity: pulse.interpolate({
              inputRange: offset === 0 ? [0, 1] : [0, 0.5, 0.5001, 1],
              outputRange: offset === 0 ? [0.9, 0] : [0.45, 0, 0.9, 0.45]
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: offset === 0 ? [0, 1] : [0, 0.5, 0.5001, 1],
                  outputRange: offset === 0 ? [0.5, 1.35] : [0.925, 1.35, 0.5, 0.925]
                })
              }
            ]
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size,
          backgroundColor: color
        }}
      />
    </View>
  );
}
