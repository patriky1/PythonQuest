import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Image } from 'expo-image';

import { colors, spacing } from '@/theme/colors';

type CelebrationMascotProps = {
  title?: string;
  subtitle?: string;
};

const confettiColors = [
  '#FACC15',
  '#22C55E',
  '#3B82F6',
  '#EF4444',
  '#A855F7',
  '#06B6D4'
];

export function CelebrationMascot({
  title = 'Missão concluída!',
  subtitle = 'Excelente trabalho. Você avançou na trilha Python.'
}: CelebrationMascotProps) {
  const mascotScale = useRef(new Animated.Value(0.82)).current;
  const mascotTranslateY = useRef(new Animated.Value(18)).current;
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const glowOpacity = useRef(new Animated.Value(0.35)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(14)).current;

  const confetti = useMemo(() => {
    return Array.from({ length: 20 }).map((_, index) => ({
      id: index,
      x: 16 + ((index * 41) % 280),
      delay: (index % 7) * 110,
      color: confettiColors[index % confettiColors.length],
      fall: new Animated.Value(0),
      rotate: new Animated.Value(0)
    }));
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(mascotScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true
      }),

      Animated.spring(mascotTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 85,
        useNativeDriver: true
      }),

      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 420,
        delay: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),

      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 420,
        delay: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotTranslateY, {
          toValue: -6,
          duration: 50,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(mascotTranslateY, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.16,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(glowScale, {
            toValue: 0.86,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ]),

        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.12,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      ])
    ).start();

    confetti.forEach((piece) => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(piece.delay),
            Animated.timing(piece.fall, {
              toValue: 1,
              duration: 1900,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(piece.fall, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true
            })
          ]),

          Animated.sequence([
            Animated.delay(piece.delay),
            Animated.timing(piece.rotate, {
              toValue: 1,
              duration: 1900,
              easing: Easing.linear,
              useNativeDriver: true
            }),
            Animated.timing(piece.rotate, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true
            })
          ])
        ])
      ).start();
    });
  }, [
    mascotScale,
    mascotTranslateY,
    glowScale,
    glowOpacity,
    titleOpacity,
    titleTranslateY,
    confetti
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.animationArea}>
        {confetti.map((piece) => {
          const translateY = piece.fall.interpolate({
            inputRange: [0, 1],
            outputRange: [-35, 220]
          });

          const translateX = piece.fall.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, piece.id % 2 === 0 ? 18 : -18, 0]
          });

          const opacity = piece.fall.interpolate({
            inputRange: [0, 0.1, 0.85, 1],
            outputRange: [0, 1, 1, 0]
          });

          const rotation = piece.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          });

          return (
            <Animated.View
              key={piece.id}
              style={[
                styles.confetti,
                {
                  left: piece.x,
                  backgroundColor: piece.color,
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate: rotation }
                  ]
                }
              ]}
            />
          );
        })}

        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }]
            }
          ]}
        />

        <Animated.View
          style={[
            styles.mascotWrapper,
            {
              transform: [
                { translateY: mascotTranslateY },
                { scale: mascotScale }
              ]
            }
          ]}
        >
          <Image
            source={require('../../../assets/mascot/snake-celebrate.gif')}
            style={styles.mascotGif}
            contentFit="contain"
            cachePolicy="memory-disk"
            allowDownscaling={false}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.textArea,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }]
          }
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: -95
  },
  animationArea: {
    width: '100%',
    height: 265,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  glow: {
    position: 'absolute',
    width: 215,
    height: 215,
    borderRadius: 108,
    backgroundColor: '#22C55E'
  },
  mascotWrapper: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mascotGif: {
    width: 330,
    height: 330
  },
  confetti: {
    position: 'absolute',
    top: 8,
    width: 9,
    height: 16,
    borderRadius: 3
  },
  textArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    bottom: 40
    
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.7
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  }
});