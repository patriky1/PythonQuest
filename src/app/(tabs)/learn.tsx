import React, { useMemo } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { LearningErrorView, LearningLoadingView } from '@/components/StateView';
import { Tag } from '@/components/Tag';
import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { isLessonUnlocked, toPercent } from '@/features/progress/progress.helpers';
import { useTopicProgress } from '@/features/progress/useTopicProgress';
import { colors, radius, shadow, spacing } from '@/theme/colors';

type LessonState = 'completed' | 'current' | 'open' | 'locked';

const STATE_LABEL: Record<LessonState, string> = {
  completed: 'Concluída',
  current: 'Atual',
  open: 'Aberta',
  locked: 'Bloqueada'
};

export default function LearnScreen() {
  const { progress, nextLessonId } = useProgress();
  const { orderedLessonIds, lessonMap, isLearningLoading, learningError, reloadLearning } =
    useLearning();
  const topics = useTopicProgress();

  const completedSet = useMemo(
    () => new Set(progress.completedLessonIds),
    [progress.completedLessonIds]
  );

  const totalLessons = orderedLessonIds.length;
  const completedLessons = orderedLessonIds.filter((id) => completedSet.has(id)).length;
  const overallPercent = toPercent(completedLessons, totalLessons);

  function getLessonState(lessonId: string): LessonState {
    if (completedSet.has(lessonId)) return 'completed';
    if (lessonId === nextLessonId) return 'current';
    if (isLessonUnlocked(lessonId, progress.completedLessonIds, orderedLessonIds)) return 'open';
    return 'locked';
  }

  if (isLearningLoading && totalLessons === 0) {
    return (
      <Screen>
        <LearningLoadingView />
      </Screen>
    );
  }

  if (learningError && totalLessons === 0) {
    return (
      <Screen>
        <LearningErrorView message={learningError} onRetry={reloadLearning} />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isLearningLoading}
          onRefresh={reloadLearning}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTextArea}>
            <Text style={styles.heroLabel}>Trilha guiada</Text>
            <Text style={styles.heroTitle}>Aprenda Python por missões</Text>
            <Text style={styles.heroSubtitle}>
              Acerte pelo menos metade das perguntas para liberar a próxima missão.
            </Text>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{overallPercent}%</Text>
          </View>
        </View>

        <ProgressBar
          value={overallPercent}
          color={colors.accent}
          trackColor="rgba(255,255,255,0.14)"
          animated
        />
        <Text style={styles.heroProgressText}>
          {completedLessons} de {totalLessons} missões concluídas
        </Text>
      </View>

      {topics.map((topic) => (
        <View key={topic.id} style={styles.topicBlock}>
          <View style={styles.topicHeader}>
            <View style={[styles.topicIconBox, { backgroundColor: `${topic.color}22` }]}>
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            </View>

            <View style={styles.topicInfo}>
              <Text style={styles.topicModule}>Módulo {topic.index + 1}</Text>
              <Text style={styles.topicTitle} accessibilityRole="header">
                {topic.title}
              </Text>
              <Text style={styles.topicDescription}>{topic.description}</Text>

              <View style={styles.topicProgressRow}>
                <View style={styles.topicProgressBar}>
                  <ProgressBar value={topic.percent} height={8} color={topic.color} />
                </View>
                <Text style={styles.topicProgressText}>
                  {topic.completedCount}/{topic.totalCount}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.lessonPath}>
            {topic.lessonIds.map((lessonId, index) => {
              const lesson = lessonMap[lessonId];

              if (!lesson) {
                return null;
              }

              const state = getLessonState(lessonId);
              const locked = state === 'locked';
              const isLast = index === topic.lessonIds.length - 1;

              return (
                <View key={lessonId} style={styles.lessonRow}>
                  {!isLast ? (
                    <View
                      style={[
                        styles.pathLine,
                        state === 'completed' && { backgroundColor: colors.primaryBorder }
                      ]}
                    />
                  ) : null}

                  <View style={[styles.pathNode, styles[`node_${state}`]]}>
                    {state === 'completed' ? (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    ) : locked ? (
                      <Ionicons name="lock-closed" size={16} color={colors.muted} />
                    ) : (
                      <Text style={styles.pathNodeText}>{index + 1}</Text>
                    )}
                  </View>

                  <Pressable
                    disabled={locked}
                    accessibilityRole="button"
                    accessibilityLabel={`${lesson.title}. ${STATE_LABEL[state]}`}
                    accessibilityState={{ disabled: locked }}
                    onPress={() => router.push(`/lesson/${lessonId}`)}
                    style={({ pressed }) => [
                      styles.lessonCard,
                      state === 'current' && styles.lessonCardCurrent,
                      locked && styles.lessonCardLocked,
                      pressed && styles.pressed
                    ]}
                  >
                    <View style={styles.lessonCardTop}>
                      <Text
                        style={[styles.lessonTitle, locked && styles.lockedText]}
                        numberOfLines={2}
                      >
                        {lesson.title}
                      </Text>
                      {state === 'current' ? (
                        <Tag label="Atual" tone="info" icon="play" />
                      ) : null}
                    </View>

                    <Text style={styles.lessonSubtitle} numberOfLines={2}>
                      {lesson.subtitle}
                    </Text>

                    <View style={styles.lessonMetaRow}>
                      <Tag label={`${lesson.estimatedMinutes} min`} icon="time-outline" />
                      <Tag
                        label={`${lesson.xp} XP`}
                        tone={state === 'completed' ? 'success' : 'warning'}
                        icon={state === 'completed' ? 'checkmark' : 'flash'}
                      />
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {topics.length === 0 ? (
        <SectionHeader
          title="Nenhum módulo disponível"
          subtitle="Puxe a tela para baixo para atualizar."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...shadow.raised
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  heroTextArea: {
    flex: 1
  },
  heroLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  heroSubtitle: {
    color: colors.inkText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  heroBadge: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroBadgeText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  heroProgressText: {
    color: colors.inkText,
    fontSize: 13,
    fontWeight: '700'
  },
  topicBlock: {
    marginBottom: spacing.lg
  },
  topicHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.md
  },
  topicIconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicEmoji: {
    fontSize: 28
  },
  topicInfo: {
    flex: 1
  },
  topicModule: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  topicTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2
  },
  topicDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  topicProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  topicProgressBar: {
    flex: 1
  },
  topicProgressText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800'
  },
  lessonPath: {
    gap: spacing.sm
  },
  lessonRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  pathLine: {
    position: 'absolute',
    left: 19,
    top: 56,
    bottom: -14,
    width: 3,
    borderRadius: 999,
    backgroundColor: colors.border
  },
  pathNode: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderWidth: 3,
    borderColor: colors.background
  },
  node_completed: {
    backgroundColor: colors.primary
  },
  node_current: {
    backgroundColor: colors.secondary
  },
  node_open: {
    backgroundColor: colors.primaryDark
  },
  node_locked: {
    backgroundColor: colors.surfaceMuted
  },
  pathNodeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15
  },
  lessonCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6
  },
  lessonCardCurrent: {
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: '#F8FAFF'
  },
  lessonCardLocked: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.75
  },
  lessonCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  lessonTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800'
  },
  lockedText: {
    color: colors.muted
  },
  lessonSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  lessonMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  }
});
