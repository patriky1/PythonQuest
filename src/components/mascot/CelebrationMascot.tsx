import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { colors } from '@/theme/colors';

type CelebrationMascotProps = {
  celebrate?: boolean;
};

const CONFETTI_COLORS = ['#FACC15', '#22C55E', '#3B82F6', '#EF4444', '#A855F7', '#06B6D4'];
const CONFETTI_COUNT = 14;
const AREA_HEIGHT = 190;

export function CelebrationMascot({ celebrate = true }: CelebrationMascotProps) {
  const mascotScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
        id: index,
        left: `${6 + ((index * 37) % 88)}%` as const,
        delay: (index % 5) * 120,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        drift: index % 2 === 0 ? 16 : -16,
        fall: new Animated.Value(0)
      })),
    []
  );

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mascotScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true
      }),
      Animated.timing(glowOpacity, {
        toValue: celebrate ? 0.22 : 0.12,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();

    if (!celebrate) {
      return;
    }

    Animated.stagger(
      60,
      confetti.map((piece) =>
        Animated.timing(piece.fall, {
          toValue: 1,
          duration: 1800,
          delay: piece.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      )
    ).start();
  }, [celebrate, confetti, glowOpacity, mascotScale]);

  return (
    <View style={styles.area} accessible={false} importantForAccessibility="no-hide-descendants">
      {celebrate
        ? confetti.map((piece) => (
            <Animated.View
              key={piece.id}
              style={[
                styles.confetti,
                {
                  left: piece.left,
                  backgroundColor: piece.color,
                  opacity: piece.fall.interpolate({
                    inputRange: [0, 0.1, 0.8, 1],
                    outputRange: [0, 1, 1, 0]
                  }),
                  transform: [
                    {
                      translateY: piece.fall.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, AREA_HEIGHT]
                      })
                    },
                    {
                      translateX: piece.fall.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, piece.drift, 0]
                      })
                    },
                    {
                      rotate: piece.fall.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '320deg']
                      })
                    }
                  ]
                }
              ]}
            />
          ))
        : null}

      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: celebrate ? colors.primary : colors.secondary,
            opacity: glowOpacity
          }
        ]}
      />

      <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
        <Image
          source={require('../../../assets/mascot/snake-celebrate.gif')}
          style={styles.mascot}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    width: '100%',
    height: AREA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  glow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85
  },
  mascot: {
    width: 190,
    height: 190
  },
  confetti: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 14,
    borderRadius: 3
  }
});
