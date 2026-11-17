import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, EasingFunction, View } from 'react-native';

export type BurstKind = 'dust' | 'sparkle' | 'poof' | 'confetti';

type Preset = {
  count: number;
  duration: number;
  colors: string[];
  shape: 'dot' | 'diamond' | 'rect';
  /** Distância percorrida, em casas. */
  distance: [number, number];
  /** Tamanho da partícula, em casas. */
  size: [number, number];
  /** Faixa de ângulos (radianos; negativo = para cima). */
  angles: [number, number];
  /** Achata o movimento vertical (poeira se espalha rente ao chão). */
  yScale: number;
  /** Queda no fim, em casas (confete cai depois de subir). */
  fall: number;
  grow: [number, number];
  easing: EasingFunction;
};

const PRESETS: Record<BurstKind, Preset> = {
  dust: {
    count: 6,
    duration: 460,
    colors: ['#CBD5E1', '#E2E8F0', '#D6D3D1'],
    shape: 'dot',
    distance: [0.16, 0.34],
    size: [0.09, 0.16],
    angles: [-Math.PI, 0],
    yScale: 0.35,
    fall: 0,
    grow: [0.5, 1.3],
    easing: Easing.out(Easing.cubic)
  },
  sparkle: {
    count: 10,
    duration: 680,
    colors: ['#FACC15', '#FDE68A', '#FFFFFF', '#F59E0B'],
    shape: 'diamond',
    distance: [0.35, 0.75],
    size: [0.08, 0.15],
    angles: [-Math.PI, Math.PI],
    yScale: 1,
    fall: 0,
    grow: [0.3, 1.15],
    easing: Easing.out(Easing.cubic)
  },
  poof: {
    count: 9,
    duration: 620,
    colors: ['#E9D5FF', '#C4B5FD', '#F1F5F9', '#CBD5E1'],
    shape: 'dot',
    distance: [0.18, 0.5],
    size: [0.2, 0.34],
    angles: [-Math.PI, Math.PI],
    yScale: 0.85,
    fall: 0,
    grow: [0.4, 1.25],
    easing: Easing.out(Easing.quad)
  },
  confetti: {
    count: 22,
    duration: 1500,
    colors: ['#FACC15', '#22C55E', '#3B82F6', '#EF4444', '#A855F7', '#06B6D4'],
    shape: 'rect',
    distance: [0.8, 2.2],
    size: [0.08, 0.13],
    angles: [-Math.PI * 0.95, -Math.PI * 0.05],
    yScale: 1,
    fall: 1.6,
    grow: [1, 1],
    easing: Easing.linear
  }
};

function between([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

type ParticleBurstProps = {
  kind: BurstKind;
  /** Centro da explosão, em px. */
  x: number;
  y: number;
  cell: number;
  onDone: () => void;
};

/** Explosão de partículas que se anima sozinha ao montar e avisa quando termina. */
export function ParticleBurst({ kind, x, y, cell, onDone }: ParticleBurstProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const preset = PRESETS[kind];

  const particles = useMemo(
    () =>
      Array.from({ length: preset.count }, (_, index) => {
        // Ângulos espalhados por igual na faixa, com um pouco de acaso.
        const t = (index + 0.5 + (Math.random() - 0.5) * 0.6) / preset.count;
        const angle = preset.angles[0] + t * (preset.angles[1] - preset.angles[0]);
        const distance = between(preset.distance) * cell;
        const size = between(preset.size) * cell;

        return {
          size,
          color: preset.colors[index % preset.colors.length],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance * preset.yScale,
          spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540)
        };
      }),
    [preset, cell]
  );

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: preset.duration,
      easing: preset.easing,
      useNativeDriver: true
    });
    animation.start(() => onDoneRef.current());

    return () => animation.stop();
  }, [preset, progress]);

  const fall = preset.fall * cell;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
      {particles.map((particle, index) => {
        const isRect = preset.shape === 'rect';
        const width = particle.size;
        const height = isRect ? particle.size * 0.55 : particle.size;
        const baseRotate = preset.shape === 'diamond' ? 45 : 0;

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: -width / 2,
              top: -height / 2,
              width,
              height,
              borderRadius: preset.shape === 'dot' ? width : 1.5,
              backgroundColor: particle.color,
              opacity: progress.interpolate({
                inputRange: [0, 0.08, 0.7, 1],
                outputRange: [0, 1, 1, 0]
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, particle.dx * (fall ? 0.75 : 0.8), particle.dx]
                  })
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.35, 1],
                    outputRange: [0, particle.dy * (fall ? 1 : 0.8), particle.dy * (fall ? 0.4 : 1) + fall]
                  })
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      `${baseRotate}deg`,
                      `${baseRotate + (isRect || preset.shape === 'diamond' ? particle.spin : 0)}deg`
                    ]
                  })
                },
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange:
                      preset.shape === 'diamond'
                        ? [preset.grow[0], preset.grow[1], 0]
                        : [preset.grow[0], (preset.grow[0] + preset.grow[1]) / 2, preset.grow[1]]
                  })
                }
              ]
            }}
          />
        );
      })}
    </View>
  );
}
