import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, monoFont, radius, spacing } from '@/theme/colors';

type CodeBlockProps = {
  code: string;
  label?: string;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
};

export function CodeBlock({ code, label, numberOfLines, style }: CodeBlockProps) {
  return (
    <View style={[styles.box, style]}>
      {label ? (
        <View style={styles.header}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: '#F87171' }]} />
            <View style={[styles.dot, { backgroundColor: '#FBBF24' }]} />
            <View style={[styles.dot, { backgroundColor: '#34D399' }]} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}

      <Text style={styles.code} numberOfLines={numberOfLines} selectable>
        {code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.codeBg,
    borderRadius: radius.md,
    padding: spacing.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  dots: {
    flexDirection: 'row',
    gap: 5
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  label: {
    color: colors.inkText,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: monoFont
  },
  code: {
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 14,
    lineHeight: 21
  }
});
