import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReduceMotion } from '@/components/motion';
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

  const reduceMotion = useReduceMotion();
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  // Resposta revelada: a errada treme, a certa dá um "pop".
  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    if (showWrong) {
      shake.setValue(0);
      Animated.sequence(
        [1, -1, 0.7, -0.5, 0.25, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 55, useNativeDriver: true })
        )
      ).start();
    } else if (showCorrect) {
      pop.setValue(0);
      Animated.sequence([
        Animated.timing(pop, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true })
      ]).start();
    }
  }, [showWrong, showCorrect, reduceMotion, shake, pop]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] }) },
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }
        ]
      }}
    >
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
    </Animated.View>
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
