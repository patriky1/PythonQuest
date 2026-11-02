import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

type ProgressBarProps = {
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
  animated?: boolean;
};

export function ProgressBar({
  value,
  height = 10,
  color = colors.primary,
  trackColor = colors.border,
  animated = false
}: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const progress = useRef(new Animated.Value(animated ? 0 : normalized)).current;

  useEffect(() => {
    if (!animated) {
      progress.setValue(normalized);
      return;
    }

    Animated.timing(progress, {
      toValue: normalized,
      duration: 600,
      useNativeDriver: false
    }).start();
  }, [animated, normalized, progress]);

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
