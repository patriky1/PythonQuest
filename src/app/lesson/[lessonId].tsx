import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnswerOption } from '@/components/AnswerOption';
import { AppButton } from '@/components/AppButton';
import { LessonStepCard } from '@/components/LessonStepCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { lessonMap } from '@/data/curriculum';
import { useProgress } from '@/store/progressStore';
import { Choice, CodeStep, QuizStep } from '@/types/course';
import { colors, spacing } from '@/theme/colors';
import { calculateLessonReward } from '@/utils/game';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = lessonId ? lessonMap[lessonId] : undefined;
  const { completeLesson, loseHeart, progress } = useProgress();
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const step = lesson?.steps[stepIndex];
  const progressValue = lesson ? ((stepIndex + 1) / lesson.steps.length) * 100 : 0;

  const selectedChoice = useMemo(() => {
    if (!step || (step.type !== 'quiz' && step.type !== 'code') || !selectedChoiceId) return undefined;
    return step.choices.find((choice) => choice.id === selectedChoiceId);
  }, [step, selectedChoiceId]);

  if (!lesson || !step) {
    return (
      <Screen>
        <View style={styles.notFoundCard}>
          <Text style={styles.title}>Missão não encontrada</Text>
          <Text style={styles.subtitle}>Volte para a trilha e escolha outra lição.</Text>
          <AppButton title="Voltar para trilha" onPress={() => router.replace('/learn')} />
        </View>
      </Screen>
    );
  }

  const goNext = () => {
    setSelectedChoiceId(null);
    setRevealed(false);

    if (stepIndex + 1 >= lesson.steps.length) {
      const reward = calculateLessonReward(lesson.xp, correctAnswers, totalAnswered);
      completeLesson({ lessonId: lesson.id, earnedXp: reward });
      router.replace({ pathname: '/result/[lessonId]', params: { lessonId: lesson.id, correct: String(correctAnswers), total: String(totalAnswered), xp: String(reward) } });
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const handleChoice = (choice: Choice) => {
    if (revealed) return;
    setSelectedChoiceId(choice.id);
    setRevealed(true);
    setTotalAnswered((current) => current + 1);

    if (choice.isCorrect) {
      setCorrectAnswers((current) => current + 1);
    } else {
      loseHeart();
    }
  };

  const renderInteractiveStep = (interactiveStep: QuizStep | CodeStep) => {
    const isCode = interactiveStep.type === 'code';

    return (
      <View style={styles.challengeCard}>
        <Text style={styles.badge}>{isCode ? 'DESAFIO DE CÓDIGO' : 'PERGUNTA'}</Text>
        <Text style={styles.challengeTitle}>{interactiveStep.title}</Text>
        <Text style={styles.question}>{isCode ? interactiveStep.prompt : interactiveStep.question}</Text>

        {isCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.code}>{interactiveStep.code}</Text>
          </View>
        ) : null}

        <View style={styles.options}>
          {interactiveStep.choices.map((choice) => (
            <AnswerOption
              key={choice.id}
              text={choice.text}
              selected={choice.id === selectedChoiceId}
              correct={choice.isCorrect}
              revealed={revealed}
              onPress={() => handleChoice(choice)}
            />
          ))}
        </View>

        {revealed && selectedChoice ? (
          <View style={[styles.feedbackBox, selectedChoice.isCorrect ? styles.feedbackSuccess : styles.feedbackError]}>
            <Text style={styles.feedbackTitle}>{selectedChoice.isCorrect ? 'Boa!' : 'Quase!'}</Text>
            <Text style={styles.feedbackText}>{selectedChoice.feedback}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.hearts}>❤️ {progress.hearts}</Text>
          <View style={styles.progressWrap}>
            <ProgressBar value={progressValue} />
          </View>
          <Text style={styles.xp}>⚡ {lesson.xp}</Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {step.type === 'content' ? (
            <LessonStepCard title={step.title} body={step.body} analogy={step.analogy} code={step.code} />
          ) : (
            renderInteractiveStep(step)
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.stepLabel}>Etapa {stepIndex + 1} de {lesson.steps.length}</Text>
          <AppButton
            title={step.type === 'content' ? 'Continuar' : revealed ? 'Continuar' : 'Escolha uma resposta'}
            disabled={step.type !== 'content' && !revealed}
            onPress={goNext}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  hearts: {
    color: colors.danger,
    fontWeight: '900',
    width: 56
  },
  progressWrap: {
    flex: 1
  },
  xp: {
    color: colors.warning,
    fontWeight: '900',
    width: 56,
    textAlign: 'right'
  },
  body: {
    flex: 1
  },
  bodyContent: {
  flexGrow: 1,
  justifyContent: 'flex-start',
  paddingVertical: spacing.md
},
  footer: {
    gap: spacing.sm,
    paddingBottom: spacing.sm
  },
  stepLabel: {
    color: colors.muted,
    fontWeight: '800',
    textAlign: 'center'
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg
  },
  badge: {
    color: colors.primaryDark,
    fontWeight: '900',
    marginBottom: spacing.sm,
    fontSize: 12
  },
  challengeTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  question: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: spacing.md,
    fontWeight: '700'
  },
  codeBox: {
    backgroundColor: colors.codeBg,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  code: {
    color: colors.codeText,
    fontFamily: 'monospace',
    fontSize: 15
  },
  options: {
    marginTop: spacing.sm
  },
  feedbackBox: {
    borderRadius: 18,
    padding: spacing.md,
    marginTop: spacing.sm
  },
  feedbackSuccess: {
    backgroundColor: '#D3F9D8'
  },
  feedbackError: {
    backgroundColor: '#FFE3E3'
  },
  feedbackTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4
  },
  feedbackText: {
    color: colors.text,
    lineHeight: 20
  },
  notFoundCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22
  }
});
