import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';

type TagTone = 'success' | 'info' | 'neutral' | 'warning' | 'danger';

const TONES: Record<TagTone, { background: string; text: string }> = {
  success: { background: colors.primarySoft, text: '#166534' },
  info: { background: colors.secondarySoft, text: colors.secondaryDark },
  neutral: { background: colors.surfaceMuted, text: colors.textSecondary },
  warning: { background: colors.accentSoft, text: colors.accentText },
  danger: { background: colors.dangerSoft, text: colors.dangerText }
};

type TagProps = {
  label: string;
  tone?: TagTone;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function Tag({ label, tone = 'neutral', icon }: TagProps) {
  const palette = TONES[tone];

  return (
    <View style={[styles.tag, { backgroundColor: palette.background }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.text} /> : null}
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  text: {
    fontSize: 12,
    fontWeight: '800'
  }
});
