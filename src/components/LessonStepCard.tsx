import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CodeBlock } from '@/components/CodeBlock';
import { Tag } from '@/components/Tag';
import { colors, radius, spacing } from '@/theme/colors';

type LessonStepCardProps = {
  title: string;
  body: string;
  analogy?: string;
  code?: string;
};

export function LessonStepCard({ title, body, analogy, code }: LessonStepCardProps) {
  return (
    <View style={styles.card}>
      <Tag label="Aula rápida" tone="success" icon="book" />

      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>

      {code ? <CodeBlock code={code} label="exemplo.py" style={styles.code} /> : null}

      {analogy ? (
        <View style={styles.analogyBox}>
          <View style={styles.analogyHeader}>
            <Ionicons name="bulb" size={18} color={colors.accentText} />
            <Text style={styles.analogyTitle}>Pense assim</Text>
          </View>
          <Text style={styles.analogyText}>{analogy}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.sm
  },
  body: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 26
  },
  code: {
    marginTop: spacing.md
  },
  analogyBox: {
    marginTop: spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  analogyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  analogyTitle: {
    fontWeight: '800',
    color: colors.accentText
  },
  analogyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  }
});
