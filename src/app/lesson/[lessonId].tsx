import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnswerOption } from '@/components/AnswerOption';
import { AppButton } from '@/components/AppButton';
import { CodeBlock } from '@/components/CodeBlock';
import { LessonStepCard } from '@/components/LessonStepCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { LearningErrorView, LearningLoadingView, StateView } from '@/components/StateView';
import { Tag } from '@/components/Tag';
import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { MAX_HEARTS, MIN_ACCURACY_TO_PASS } from '@/features/progress/progress.constants';
import {
  calculateLessonReward,
  isLessonUnlocked,
  toPercent
} from '@/features/progress/progress.helpers';
import { colors, radius, spacing } from '@/theme/colors';
import { Choice, CodeStep, QuizStep } from '@/types/course';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function shuffleChoices(choices: Choice[]) {
  const shuffled = [...choices];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { lessonMap, orderedLessonIds, isLearningLoading, learningError, reloadLearning } =
    useLearning();
  const { progress, completeLesson, loseHeart, restoreHearts } = useProgress();
  const insets = useSafeAreaInsets();

  const lesson = lessonId ? lessonMap[lessonId] : undefined;

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(() => progress.hearts <= 0);

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollViewInstance>(null);

  const step = lesson?.steps[stepIndex];
  const revealed = selectedChoiceId !== null;

  const displayChoices = useMemo(() => {
    if (!step || step.type === 'content') {
      return [];
    }

    return shuffleChoices(step.choices);
  }, [step]);

  const selectedChoice = displayChoices.find((choice) => choice.id === selectedChoiceId);

  useEffect(() => {
    Animated.spring(feedbackAnim, {
      toValue: revealed ? 1 : 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true
    }).start();

    if (revealed) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [revealed, feedbackAnim]);

  if (isLearningLoading && !lesson) {
    return (
      <Screen>
        <LearningLoadingView />
      </Screen>
    );
  }

  if (learningError && !lesson) {
    return (
      <Screen>
        <LearningErrorView message={learningError} onRetry={reloadLearning} />
      </Screen>
    );
  }

  if (!lesson || !step) {
    return (
      <Screen>
        <StateView
          variant="empty"
          icon="help-circle-outline"
          title="Missão não encontrada"
          message="Volte para a trilha e escolha outra missão."
          actionLabel="Ver trilha"
          onAction={() => router.replace('/learn')}
        />
      </Screen>
    );
  }

  if (!isLessonUnlocked(lesson.id, progress.completedLessonIds, orderedLessonIds)) {
    return (
      <Screen>
        <StateView
          variant="empty"
          icon="lock-closed-outline"
          title="Missão bloqueada"
          message="Conclua a missão anterior da trilha para liberar esta."
          actionLabel="Ver trilha"
          onAction={() => router.replace('/learn')}
        />
      </Screen>
    );
  }

  function restartLesson() {
    setStepIndex(0);
    setSelectedChoiceId(null);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setOutOfHearts(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  async function handleRefillAndRestart() {
    await restoreHearts();
    restartLesson();
  }

  if (outOfHearts) {
    return (
      <Screen>
        <StateView
          variant="empty"
          icon="heart-dislike-outline"
          title="Seus corações acabaram"
          message="Errar faz parte de aprender! Revise a explicação desde o início com os corações recarregados."
          actionLabel="Revisar e recomeçar"
          onAction={handleRefillAndRestart}
        />
      </Screen>
    );
  }

  const currentLesson = lesson;
  const isLastStep = stepIndex + 1 >= currentLesson.steps.length;
  const progressValue = toPercent(stepIndex + (revealed || step.type === 'content' ? 1 : 0), currentLesson.steps.length);

  async function finishLesson() {
    setIsFinishing(true);

    const accuracy = totalAnswered > 0 ? toPercent(correctAnswers, totalAnswered) : 100;
    const passed = accuracy >= MIN_ACCURACY_TO_PASS;
    const alreadyCompleted = progress.completedLessonIds.includes(currentLesson.id);

    let awardedXp = 0;

    if (passed) {
      awardedXp = await completeLesson({
        lessonId: currentLesson.id,
        earnedXp: calculateLessonReward(currentLesson.xp, correctAnswers, totalAnswered)
      });
    }

    router.replace({
      pathname: '/result/[lessonId]',
      params: {
        lessonId: currentLesson.id,
        correct: String(correctAnswers),
        total: String(totalAnswered),
        xp: String(awardedXp),
        passed: passed ? '1' : '0',
        replay: alreadyCompleted ? '1' : '0'
      }
    });
  }

  function goNext() {
    if (isFinishing) {
      return;
    }

    const answeredWrong = selectedChoice && !selectedChoice.isCorrect;

    if (answeredWrong && progress.hearts <= 0) {
      setOutOfHearts(true);
      return;
    }

    if (isLastStep) {
      finishLesson();
      return;
    }

    setSelectedChoiceId(null);
    setStepIndex((current) => current + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function handleChoice(choice: Choice) {
    if (revealed) {
      return;
    }

    setSelectedChoiceId(choice.id);
    setTotalAnswered((current) => current + 1);

    if (choice.isCorrect) {
      setCorrectAnswers((current) => current + 1);
    } else {
      loseHeart();
    }
  }

  function renderInteractiveStep(interactiveStep: QuizStep | CodeStep) {
    const isCode = interactiveStep.type === 'code';

    return (
      <View style={styles.challengeCard}>
        <Tag
          label={isCode ? 'Desafio de código' : 'Pergunta'}
          tone={isCode ? 'info' : 'warning'}
          icon={isCode ? 'code-slash' : 'help'}
        />

        <Text style={styles.challengeTitle} accessibilityRole="header">
          {interactiveStep.title}
        </Text>
        <Text style={styles.question}>
          {isCode ? interactiveStep.prompt : interactiveStep.question}
        </Text>

        {isCode ? (
          <CodeBlock code={interactiveStep.code} label="desafio.py" style={styles.codeBox} />
        ) : null}

        <View>
          {displayChoices.map((choice, index) => (
            <AnswerOption
              key={choice.id}
              letter={LETTERS[index] ?? String(index + 1)}
              text={choice.text}
              isCode={isCode}
              selected={choice.id === selectedChoiceId}
              correct={choice.isCorrect}
              revealed={revealed}
              onPress={() => handleChoice(choice)}
            />
          ))}
        </View>
      </View>
    );
  }

  const isCorrect = selectedChoice?.isCorrect ?? false;
  const canContinue = step.type === 'content' || revealed;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: currentLesson.title }} />

      <View style={styles.topBar}>
        <View style={styles.hearts} accessible accessibilityLabel={`${progress.hearts} corações`}>
          <Ionicons name="heart" size={20} color={colors.heart} />
          <Text style={styles.heartsText}>{progress.hearts}</Text>
        </View>

        <View style={styles.progressWrap}>
          <ProgressBar value={progressValue} height={12} animated />
        </View>

        <Text style={styles.stepLabel}>
          {stepIndex + 1}/{currentLesson.steps.length}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {step.type === 'content' ? (
          <LessonStepCard
            title={step.title}
            body={step.body}
            analogy={step.analogy}
            code={step.code}
          />
        ) : (
          renderInteractiveStep(step)
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
          revealed && (isCorrect ? styles.footerSuccess : styles.footerError)
        ]}
      >
        {revealed && selectedChoice ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedback,
              {
                opacity: feedbackAnim,
                transform: [
                  {
                    translateY: feedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={26}
                color={isCorrect ? colors.primary : colors.danger}
              />
              <Text style={[styles.feedbackTitle, !isCorrect && styles.feedbackTitleError]}>
                {isCorrect ? 'Mandou bem!' : 'Quase! Veja a explicação'}
              </Text>
              {!isCorrect ? (
                <Text style={styles.heartLost}>
                  -1 <Ionicons name="heart" size={13} color={colors.heart} />
                </Text>
              ) : null}
            </View>
            <Text style={styles.feedbackText}>{selectedChoice.feedback}</Text>
          </Animated.View>
        ) : null}

        <AppButton
          title={
            !canContinue
              ? 'Escolha uma resposta'
              : isLastStep
                ? 'Concluir missão'
                : 'Continuar'
          }
          icon={canContinue ? (isLastStep ? 'flag' : 'arrow-forward') : undefined}
          variant={revealed && !isCorrect ? 'danger' : 'primary'}
          disabled={!canContinue}
          loading={isFinishing}
          onPress={goNext}
        />

        {progress.hearts < MAX_HEARTS && !revealed ? (
          <Text style={styles.footerHint}>
            Cada erro custa 1 coração. Conclua a missão para recarregar.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  hearts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 48
  },
  heartsText: {
    color: colors.heart,
    fontWeight: '900',
    fontSize: 16
  },
  progressWrap: {
    flex: 1
  },
  stepLabel: {
    color: colors.muted,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right'
  },
  body: {
    flex: 1
  },
  bodyContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg
  },
  challengeTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  question: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: spacing.md,
    fontWeight: '600'
  },
  codeBox: {
    marginBottom: spacing.md
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  footerSuccess: {
    backgroundColor: '#F0FDF4',
    borderTopColor: colors.primaryBorder
  },
  footerError: {
    backgroundColor: '#FEF2F2',
    borderTopColor: colors.dangerBorder
  },
  feedback: {
    gap: 4
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  feedbackTitle: {
    flex: 1,
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 18
  },
  feedbackTitleError: {
    color: colors.dangerText
  },
  heartLost: {
    color: colors.heart,
    fontWeight: '900'
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  footerHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center'
  }
});
