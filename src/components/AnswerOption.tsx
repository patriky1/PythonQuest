import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/theme/colors';

type AnswerOptionProps = {
  text: string;
  selected?: boolean;
  correct?: boolean;
  revealed?: boolean;
  onPress: () => void;
};

export function AnswerOption({ text, selected = false, correct = false, revealed = false, onPress }: AnswerOptionProps) {
  const showCorrect = revealed && correct;
  const showWrong = revealed && selected && !correct;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={revealed}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        showCorrect && styles.correct,
        showWrong && styles.wrong,
        pressed && !revealed && styles.pressed
      ]}
    >
      <Text style={[styles.text, showCorrect && styles.correctText, showWrong && styles.wrongText]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  selected: {
    borderColor: colors.secondary,
    backgroundColor: '#E7F5FF'
  },
  correct: {
    borderColor: colors.success,
    backgroundColor: '#D3F9D8'
  },
  wrong: {
    borderColor: colors.danger,
    backgroundColor: '#FFE3E3'
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  correctText: {
    color: colors.success
  },
  wrongText: {
    color: colors.danger
  }
});
