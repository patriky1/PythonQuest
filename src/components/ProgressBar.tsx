import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

type ProgressBarProps = {
  value: number;
  height?: number;
};

export function ProgressBar({ value, height = 12 }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${normalized}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#DDEFE5',
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary
  }
});
