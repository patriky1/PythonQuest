import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, monoFont, radius, spacing } from '@/theme/colors';

type AnswerOptionProps = {
  letter: string;
  text: string;
  selected?: boolean;
  correct?: boolean;
  revealed?: boolean;
  isCode?: boolean;
  onPress: () => void;
};

export const AnswerOption = memo(function AnswerOption({
  letter,
  text,
  selected = false,
  correct = false,
  revealed = false,
  isCode = false,
  onPress
}: AnswerOptionProps) {
  const showCorrect = revealed && correct;
  const showWrong = revealed && selected && !correct;
  const dimmed = revealed && !showCorrect && !showWrong;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Alternativa ${letter}: ${text}`}
      accessibilityState={{ disabled: revealed, selected }}
      accessibilityHint={
        showCorrect ? 'Resposta correta' : showWrong ? 'Resposta incorreta' : undefined
      }
      disabled={revealed}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        showCorrect && styles.correct,
        showWrong && styles.wrong,
        dimmed && styles.dimmed,
        pressed && !revealed && styles.pressed
      ]}
    >
      <View
        style={[
          styles.letterBox,
          showCorrect && styles.letterBoxCorrect,
          showWrong && styles.letterBoxWrong
        ]}
      >
        {showCorrect || showWrong ? (
          <Ionicons
            name={showCorrect ? 'checkmark' : 'close'}
            size={18}
            color="#FFFFFF"
          />
        ) : (
          <Text style={styles.letter}>{letter}</Text>
        )}
      </View>

      <Text
        style={[
          styles.text,
          isCode && styles.codeText,
          showCorrect && styles.correctText,
          showWrong && styles.wrongText
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 56
  },
  correct: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  wrong: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2'
  },
  dimmed: {
    opacity: 0.55
  },
  pressed: {
    borderBottomWidth: 2,
    transform: [{ translateY: 2 }]
  },
  letterBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  letterBoxCorrect: {
    backgroundColor: colors.primary
  },
  letterBoxWrong: {
    backgroundColor: colors.danger
  },
  letter: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800'
  },
  text: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600'
  },
  codeText: {
    fontFamily: monoFont,
    fontSize: 15
  },
  correctText: {
    color: '#166534'
  },
  wrongText: {
    color: colors.dangerText
  }
});
