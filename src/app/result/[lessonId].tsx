import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { LevelProgress } from '@/components/LevelProgress';
import { CelebrationMascot } from '@/components/mascot/CelebrationMascot';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { MIN_ACCURACY_TO_PASS } from '@/features/progress/progress.constants';
import { toPercent } from '@/features/progress/progress.helpers';
import { colors, radius, shadow, spacing } from '@/theme/colors';

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    lessonId: string;
    correct?: string;
    total?: string;
    xp?: string;
    passed?: string;
    replay?: string;
  }>();

  const { lessonMap } = useLearning();
  const { progress, nextLessonId } = useProgress();

  const lesson = params.lessonId ? lessonMap[params.lessonId] : undefined;
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const awardedXp = Number(params.xp ?? 0);
  const passed = params.passed !== '0';
  const isReplay = params.replay === '1';
  const accuracy = total > 0 ? toPercent(correct, total) : 100;

  const title = !passed
    ? 'Quase lá!'
    : isReplay
      ? 'Revisão concluída!'
      : accuracy === 100
        ? 'Perfeito!'
        : 'Missão concluída!';

  const message = !passed
    ? `Você precisa acertar pelo menos ${MIN_ACCURACY_TO_PASS}% para avançar. Revise as explicações e tente de novo — você consegue!`
    : isReplay
      ? 'Você já tinha concluído esta missão. Revisar também conta para sua sequência de estudos.'
      : lesson
        ? `Você concluiu "${lesson.title}".`
        : 'Continue assim!';

  function goHome() {
    router.replace('/home');
  }

  function retryLesson() {
    if (params.lessonId) {
      router.replace(`/lesson/${params.lessonId}`);
    }
  }

  function goToNextLesson() {
    if (nextLessonId) {
      router.replace(`/lesson/${nextLessonId}`);
    } else {
      goHome();
    }
  }

  return (
    <Screen>
      <View style={styles.card}>
        <CelebrationMascot celebrate={passed} />

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.xpBox]}>
            <Ionicons name="flash" size={20} color={colors.warning} />
            <Text style={styles.xpValue}>+{awardedXp}</Text>
            <Text style={styles.statLabel}>XP ganho</Text>
          </View>

          <View style={[styles.statBox, passed ? styles.accuracyBoxOk : styles.accuracyBoxLow]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'refresh-circle'}
              size={20}
              color={passed ? colors.primary : colors.danger}
            />
            <Text style={[styles.accuracyValue, !passed && styles.accuracyValueLow]}>
              {accuracy}%
            </Text>
            <Text style={styles.statLabel}>
              {correct}/{total} acertos
            </Text>
          </View>
        </View>

        <ProgressBar
          value={accuracy}
          color={passed ? colors.primary : colors.danger}
          animated
        />
      </View>

      {passed ? (
        <View style={styles.levelArea}>
          <LevelProgress xp={progress.xp} />
        </View>
      ) : null}

      <View style={styles.actions}>
        {passed ? (
          <>
            <AppButton
              title={nextLessonId ? 'Próxima missão' : 'Voltar ao início'}
              icon={nextLessonId ? 'arrow-forward' : 'home'}
              onPress={goToNextLesson}
            />
            {nextLessonId ? (
              <AppButton title="Ir para o início" variant="ghost" onPress={goHome} />
            ) : null}
          </>
        ) : (
          <>
            <AppButton title="Tentar novamente" icon="refresh" onPress={retryLesson} />
            <AppButton title="Voltar para a trilha" variant="ghost" onPress={() => router.replace('/learn')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.card
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.6
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    gap: 2
  },
  xpBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  accuracyBoxOk: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.primaryBorder
  },
  accuracyBoxLow: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.dangerBorder
  },
  xpValue: {
    color: colors.warning,
    fontSize: 28,
    fontWeight: '900'
  },
  accuracyValue: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: '900'
  },
  accuracyValueLow: {
    color: colors.danger
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  levelArea: {
    marginTop: spacing.md
  },
  actions: {
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.lg
  }
});
