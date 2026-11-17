import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { useLoop } from '@/features/adventure/characters/shared';
import type { AdventurePosition } from '@/types/adventure';

type Point = { x: number; y: number };

const PALETTES = [
  { wing: '#F472B6', inner: '#FBCFE8' },
  { wing: '#60A5FA', inner: '#DBEAFE' },
  { wing: '#FBBF24', inner: '#FEF3C7' }
];

type ButterfliesProps = {
  boardSize: number;
  cellSize: number;
  heroCell: AdventurePosition;
  count?: number;
};

/**
 * Borboletas que passeiam pelo tabuleiro e fogem quando o herói chega perto.
 * Só enfeite: não interferem no jogo nem recebem toques.
 */
export function Butterflies({ boardSize, cellSize, heroCell, count = 2 }: ButterfliesProps) {
  if (boardSize <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: boardSize, height: boardSize }}>
      {Array.from({ length: count }, (_, index) => (
        <Butterfly
          key={index}
          index={index}
          boardSize={boardSize}
          cellSize={cellSize}
          heroCell={heroCell}
        />
      ))}
    </View>
  );
}

function Butterfly({
  index,
  boardSize,
  cellSize,
  heroCell
}: {
  index: number;
  boardSize: number;
  cellSize: number;
  heroCell: AdventurePosition;
}) {
  const size = cellSize * 0.3;
  const palette = PALETTES[index % PALETTES.length];
  const flap = useLoop(180 + index * 40, true);
  const bob = useLoop(900 + index * 200, true);

  const heroRef = useRef(heroCell);
  heroRef.current = heroCell;

  const randomPoint = (awayFrom?: Point, minDistance = 0): Point => {
    const margin = size;
    let best: Point = { x: margin, y: margin };
    let bestDistance = -1;

    // Algumas tentativas: fica com o ponto mais longe do perigo.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const point = {
        x: margin + Math.random() * (boardSize - margin * 2),
        y: margin + Math.random() * (boardSize - margin * 2)
      };
      const distance = awayFrom ? Math.hypot(point.x - awayFrom.x, point.y - awayFrom.y) : 0;

      if (distance >= minDistance) {
        return point;
      }

      if (distance > bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }

    return best;
  };

  const startRef = useRef<Point | null>(null);
  if (!startRef.current) {
    startRef.current = randomPoint();
  }

  // Animação em JS (não nativa) para poder ler a posição atual na hora de fugir.
  const position = useRef(new Animated.ValueXY(startRef.current)).current;
  const currentRef = useRef<Point>(startRef.current);
  const [facing, setFacing] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroCenter = (): Point => ({
    x: (heroRef.current.col + 0.5) * cellSize,
    y: (heroRef.current.row + 0.5) * cellSize
  });

  const flyTo = (target: Point, duration: number, then: () => void) => {
    setFacing(target.x >= currentRef.current.x ? 1 : -1);
    Animated.timing(position, {
      toValue: target,
      duration,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished) {
        then();
      }
    });
  };

  const wander = () => {
    flyTo(randomPoint(heroCenter(), cellSize * 1.5), 2600 + Math.random() * 2200, () => {
      timerRef.current = setTimeout(wander, 300 + Math.random() * 1400);
    });
  };

  useEffect(() => {
    const id = position.addListener((value) => {
      currentRef.current = value;
    });
    timerRef.current = setTimeout(wander, index * 700);

    return () => {
      position.removeListener(id);
      position.stopAnimation();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // Começa a voar uma vez; o tamanho do tabuleiro raramente muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardSize]);

  // Herói chegou perto: foge rápido para longe e depois volta a passear.
  useEffect(() => {
    const hero = heroCenter();
    const current = currentRef.current;

    if (Math.hypot(current.x - hero.x, current.y - hero.y) > cellSize * 1.3) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    position.stopAnimation();
    flyTo(randomPoint(hero, cellSize * 2.2), 650, () => {
      timerRef.current = setTimeout(wander, 400);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroCell.row, heroCell.col]);

  const wingScale = flap.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.25, 1] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        transform: [
          { translateX: position.x },
          { translateY: position.y }
        ]
      }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -size * 0.3, 0] }) },
            { scaleX: facing },
            { rotate: '-12deg' }
          ]
        }}
      >
        <Animated.View style={{ width: size, height: size, transform: [{ scaleX: wingScale }] }}>
          {[-1, 1].map((side) => (
            <React.Fragment key={side}>
              <View
                style={{
                  position: 'absolute',
                  left: size / 2 + (side < 0 ? -size * 0.48 : size * 0.02),
                  top: size * 0.06,
                  width: size * 0.46,
                  height: size * 0.5,
                  borderRadius: size,
                  backgroundColor: palette.wing,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <View
                  style={{
                    width: size * 0.18,
                    height: size * 0.18,
                    borderRadius: size,
                    backgroundColor: palette.inner
                  }}
                />
              </View>
              <View
                style={{
                  position: 'absolute',
                  left: size / 2 + (side < 0 ? -size * 0.36 : size * 0.04),
                  top: size * 0.5,
                  width: size * 0.32,
                  height: size * 0.34,
                  borderRadius: size,
                  backgroundColor: palette.wing,
                  opacity: 0.85
                }}
              />
            </React.Fragment>
          ))}
        </Animated.View>
        <View
          style={{
            position: 'absolute',
            left: size / 2 - size * 0.05,
            top: size * 0.12,
            width: size * 0.1,
            height: size * 0.72,
            borderRadius: size,
            backgroundColor: '#1E293B'
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}
