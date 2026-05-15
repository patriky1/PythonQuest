import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { lessonMap } from '@/data/curriculum';
import { colors, spacing } from '@/theme/colors';
import { getNextLessonId } from '@/utils/game';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ lessonId: string; correct?: string; total?: string; xp?: string }>();
  const lesson = params.lessonId ? lessonMap[params.lessonId] : undefined;
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const xp = Number(params.xp ?? lesson?.xp ?? 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
  const nextLessonId = lesson ? getNextLessonId(lesson.id) : undefined;

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>Missão concluída!</Text>
        <Text style={styles.subtitle}>{lesson?.title ?? 'Lição'} foi adicionada ao seu progresso.</Text>

        <View style={styles.rewardBox}>
          <Text style={styles.rewardLabel}>XP ganho</Text>
          <Text style={styles.rewardValue}>+{xp}</Text>
        </View>

        <View style={styles.accuracyBox}>
          <Text style={styles.sectionTitle}>Acertos</Text>
          <ProgressBar value={accuracy} />
          <Text style={styles.accuracyText}>{correct}/{total} respostas corretas • {accuracy}%</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {nextLessonId ? (
          <AppButton title="Próxima missão" onPress={() => router.replace(`/lesson/${nextLessonId}`)} />
        ) : (
          <AppButton title="Ver trilha completa" onPress={() => router.replace('/learn')} />
        )}
        <AppButton title="Voltar ao início" variant="ghost" onPress={() => router.replace('/home')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    justifyContent: 'space-between'
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: spacing.xl
  },
  trophy: {
    fontSize: 82,
    marginBottom: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center'
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: spacing.sm,
    marginBottom: spacing.lg
  },
  rewardBox: {
    backgroundColor: '#FFF9DB',
    borderRadius: 22,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg
  },
  rewardLabel: {
    color: colors.muted,
    fontWeight: '900'
  },
  rewardValue: {
    color: colors.warning,
    fontSize: 42,
    fontWeight: '900'
  },
  accuracyBox: {
    width: '100%'
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  accuracyText: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: spacing.sm
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  }
});
