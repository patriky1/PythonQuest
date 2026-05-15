import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

type QuestCardProps = {
  title: string;
  subtitle: string;
  emoji?: string;
  locked?: boolean;
  completed?: boolean;
  meta?: string;
  onPress: () => void;
};

export function QuestCard({ title, subtitle, emoji = '🐍', locked = false, completed = false, meta, onPress }: QuestCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [styles.card, locked && styles.locked, completed && styles.completed, pressed && !locked && styles.pressed]}
    >
      <View style={[styles.icon, locked && styles.lockedIcon, completed && styles.completedIcon]}>
        <Text style={styles.emoji}>{locked ? '🔒' : completed ? '✅' : emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, locked && styles.mutedText]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md
  },
  locked: {
    backgroundColor: '#F1F3F5',
    borderColor: '#DEE2E6'
  },
  completed: {
    borderColor: colors.primary,
    backgroundColor: colors.cardAlt
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center'
  },
  lockedIcon: {
    backgroundColor: '#E9ECEF'
  },
  completedIcon: {
    backgroundColor: '#D3F9D8'
  },
  emoji: {
    fontSize: 28
  },
  info: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  meta: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  mutedText: {
    color: colors.muted
  }
});
