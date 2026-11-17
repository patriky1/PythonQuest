import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/components/motion';
import { colors } from '@/theme/colors';

type ProgressBarProps = {
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
  /** Enche a partir do zero quando aparece (mudanças de valor sempre deslizam). */
  animated?: boolean;
};

export function ProgressBar({
  value,
  height = 10,
  color = colors.primary,
  trackColor = colors.border,
  animated = false
}: ProgressBarProps) {
  const reduceMotion = useReduceMotion();
  const normalized = Math.max(0, Math.min(100, value));
  const progress = useRef(new Animated.Value(animated ? 0 : normalized)).current;
  const mounted = useRef(false);

  useEffect(() => {
    const isFirstRun = !mounted.current;
    mounted.current = true;

    if (reduceMotion || (isFirstRun && !animated)) {
      progress.setValue(normalized);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: normalized,
      duration: isFirstRun ? 700 : 450,
      easing: Easing.out(Easing.cubic),
      // Largura não é animável no driver nativo.
      useNativeDriver: false
    });
    animation.start();

    return () => animation.stop();
  }, [animated, normalized, progress, reduceMotion]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: normalized }}
      style={[styles.track, { height, backgroundColor: trackColor }]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: progress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 999
  }
});
