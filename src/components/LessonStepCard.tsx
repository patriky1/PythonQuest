import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

type LessonStepCardProps = {
  title: string;
  body: string;
  analogy?: string;
  code?: string;
};

export function LessonStepCard({ title, body, analogy, code }: LessonStepCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>AULA RÁPIDA</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {analogy ? (
        <View style={styles.analogyBox}>
          <Text style={styles.analogyTitle}>💡 Analogia</Text>
          <Text style={styles.analogyText}>{analogy}</Text>
        </View>
      ) : null}
      {code ? (
        <View style={styles.codeBox}>
          <Text style={styles.code}>{code}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  badge: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24
  },
  analogyBox: {
    marginTop: spacing.md,
    backgroundColor: '#FFF9DB',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE066'
  },
  analogyTitle: {
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4
  },
  analogyText: {
    color: colors.text,
    lineHeight: 21
  },
  codeBox: {
    marginTop: spacing.md,
    backgroundColor: colors.codeBg,
    borderRadius: 18,
    padding: spacing.md
  },
  code: {
    color: colors.codeText,
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 21
  }
});
