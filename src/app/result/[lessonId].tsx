import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CelebrationMascot } from '@/components/mascot/CelebrationMascot';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';

import { lessonMap } from '@/data/curriculum';
import { colors, spacing } from '@/theme/colors';
import { getNextLessonId } from '@/utils/game';

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    lessonId: string;
    correct?: string;
    total?: string;
    xp?: string;
  }>();

  const lesson = params.lessonId ? lessonMap[params.lessonId] : undefined;

  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const xp = Number(params.xp ?? lesson?.xp ?? 0);

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
  const nextLessonId = lesson ? getNextLessonId(lesson.id) : undefined;

  function goToNextLesson() {
    if (nextLessonId) {
      router.replace(`/lesson/${nextLessonId}`);
      return;
    }

    router.replace('/(tabs)');
  }

  function goHome() {
    router.replace('/(tabs)');
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.card}>
          <CelebrationMascot
            title="Missão concluída!"
            subtitle="Boa! Você ganhou XP e avançou na trilha Python."
          />

          <View style={styles.rewardCard}>
            <Text style={styles.rewardLabel}>XP ganho</Text>
            <Text style={styles.rewardValue}>+{xp}</Text>
          </View>

          <View style={styles.accuracyCard}>
            <View style={styles.accuracyHeader}>
              <Text style={styles.sectionTitle}>Desempenho</Text>
              <Text style={styles.accuracyPercent}>{accuracy}%</Text>
            </View>

            <ProgressBar value={accuracy} />

            <Text style={styles.accuracyText}>
              {correct}/{total} respostas corretas
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed
          ]}
          onPress={goToNextLesson}
        >
          <Text style={styles.primaryButtonText}>
            {nextLessonId ? 'Próxima missão' : 'Voltar ao início'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed
          ]}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonText}>Ir para o início</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    bottom: 50,
    padding: spacing.lg,
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14
    },
    elevation: 5
  },
  rewardCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 22,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md
  },
  rewardLabel: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  rewardValue: {
    color: '#D97706',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    marginTop: 4
  },
  accuracyCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 22,
    padding: spacing.lg
  },
  accuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  accuracyPercent: {
    color: '#16A34A',
    fontSize: 18,
    fontWeight: '900'
  },
  accuracyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.sm
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.sm
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900'
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9
  }
});