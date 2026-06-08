import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';

import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/store/progressStore';

import { colors, spacing } from '@/theme/colors';

function isLessonUnlockedFromApi(
  lessonId: string,
  orderedLessonIds: string[],
  completedLessonIds: string[]
) {
  const lessonIndex = orderedLessonIds.indexOf(lessonId);

  if (lessonIndex <= 0) {
    return true;
  }

  const previousLessonId = orderedLessonIds[lessonIndex - 1];

  return completedLessonIds.includes(previousLessonId);
}

export default function LearnScreen() {
  const { progress } = useProgress();

  const {
    topics,
    orderedLessonIds,
    lessonMap,
    isLearningLoading,
    learningError,
    reloadLearning
  } = useLearning();

  const completedSet = useMemo(() => {
    return new Set(progress.completedLessonIds);
  }, [progress.completedLessonIds]);

  const allLessonIds = orderedLessonIds;

  const totalLessons = allLessonIds.length;
  const completedLessons = progress.completedLessonIds.length;

  const overallPercent =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  const nextLessonId = useMemo(() => {
    return allLessonIds.find((lessonId) => !completedSet.has(lessonId));
  }, [allLessonIds, completedSet]);

  const nextLesson = nextLessonId ? lessonMap[nextLessonId] : null;

  function openLesson(lessonId: string) {
    const unlocked = isLessonUnlockedFromApi(
      lessonId,
      orderedLessonIds,
      progress.completedLessonIds
    );

    if (!unlocked) {
      return;
    }

    router.push(`/lesson/${lessonId}`);
  }

  function openNextLesson() {
    if (!nextLesson) {
      return;
    }

    router.push(`/lesson/${nextLesson.id}`);
  }

  if (isLearningLoading) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>🐍</Text>
          <Text style={styles.centerTitle}>Carregando trilha...</Text>
          <Text style={styles.centerText}>
            Buscando módulos, missões e exercícios no servidor.
          </Text>
        </View>
      </Screen>
    );
  }

  if (learningError) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <Text style={styles.centerEmoji}>⚠️</Text>
          <Text style={styles.centerTitle}>Não foi possível carregar</Text>
          <Text style={styles.centerText}>{learningError}</Text>

          <Pressable style={styles.retryButton} onPress={reloadLearning}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTextArea}>
            <Text style={styles.heroLabel}>Trilha guiada</Text>
            <Text style={styles.heroTitle}>Aprenda Python por missões</Text>
            <Text style={styles.heroSubtitle}>
              Siga a ordem das aulas, conclua desafios e desbloqueie novas
              etapas.
            </Text>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{overallPercent}%</Text>
          </View>
        </View>

        <View style={styles.heroProgressArea}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso da trilha</Text>
            <Text style={styles.progressValue}>
              {completedLessons}/{totalLessons}
            </Text>
          </View>

          <ProgressBar value={overallPercent} />
        </View>
      </View>

      {nextLesson ? (
        <Pressable
          style={({ pressed }) => [
            styles.continueCard,
            pressed && styles.cardPressed
          ]}
          onPress={openNextLesson}
        >
          <View style={styles.continueIcon}>
            <Text style={styles.continueIconText}>▶</Text>
          </View>

          <View style={styles.continueTextArea}>
            <Text style={styles.continueLabel}>Continue agora</Text>
            <Text style={styles.continueTitle}>{nextLesson.title}</Text>
            <Text style={styles.continueSubtitle}>
              {nextLesson.estimatedMinutes} min • {nextLesson.xp} XP
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.finishedCard}>
          <Text style={styles.finishedEmoji}>🏆</Text>
          <Text style={styles.finishedTitle}>Todas as missões concluídas</Text>
          <Text style={styles.finishedText}>
            Continue praticando no laboratório para reforçar seus conhecimentos.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Módulos do curso</Text>
        <Text style={styles.sectionSubtitle}>
          Complete uma missão para liberar a próxima
        </Text>
      </View>

      {topics.map((topic, topicIndex) => {
        const completedInTopic = topic.lessonIds.filter((lessonId) =>
          completedSet.has(lessonId)
        ).length;

        const totalInTopic = topic.lessonIds.length;

        const topicPercent =
          totalInTopic === 0
            ? 0
            : Math.round((completedInTopic / totalInTopic) * 100);

        const topicCompleted =
          totalInTopic > 0 && completedInTopic === totalInTopic;

        return (
          <View key={topic.id} style={styles.topicBlock}>
            <View style={styles.topicHeader}>
              <View
                style={[
                  styles.topicIconBox,
                  { backgroundColor: topic.color || colors.primary }
                ]}
              >
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              </View>

              <View style={styles.topicInfo}>
                <View style={styles.topicTitleRow}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>

                  <Text
                    style={[
                      styles.topicStatus,
                      topicCompleted
                        ? styles.topicStatusCompleted
                        : styles.topicStatusActive
                    ]}
                  >
                    {topicCompleted ? 'Concluído' : 'Em andamento'}
                  </Text>
                </View>

                <Text style={styles.topicDescription}>
                  {topic.description}
                </Text>

                <View style={styles.topicProgressFooter}>
                  <View style={styles.topicProgressTrack}>
                    <View
                      style={[
                        styles.topicProgressFill,
                        {
                          width: `${topicPercent}%`,
                          backgroundColor: topic.color || colors.primary
                        }
                      ]}
                    />
                  </View>

                  <Text style={styles.topicProgressText}>
                    {completedInTopic}/{totalInTopic} missões
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

                const completed = completedSet.has(lessonId);

                const unlocked = isLessonUnlockedFromApi(
                  lessonId,
                  orderedLessonIds,
                  progress.completedLessonIds
                );

                const isCurrent = nextLessonId === lessonId;
                const isLastLesson = index === topic.lessonIds.length - 1;

                return (
                  <View key={lessonId} style={styles.lessonRow}>
                    {!isLastLesson ? <View style={styles.pathLine} /> : null}

                    <View
                      style={[
                        styles.pathNode,
                        completed && styles.pathNodeCompleted,
                        isCurrent && styles.pathNodeCurrent,
                        !unlocked && styles.pathNodeLocked
                      ]}
                    >
                      <Text
                        style={[
                          styles.pathNodeText,
                          !unlocked && styles.pathNodeTextLocked
                        ]}
                      >
                        {completed ? '✓' : !unlocked ? '⌛' : index + 1}
                      </Text>
                    </View>

                    <Pressable
                      disabled={!unlocked}
                      onPress={() => openLesson(lessonId)}
                      style={({ pressed }) => [
                        styles.lessonCard,
                        completed && styles.lessonCardCompleted,
                        isCurrent && styles.lessonCardCurrent,
                        !unlocked && styles.lessonCardLocked,
                        pressed && unlocked && styles.cardPressed
                      ]}
                    >
                      <View style={styles.lessonCardTop}>
                        <View style={styles.lessonTitleArea}>
                          <Text
                            style={[
                              styles.lessonTitle,
                              !unlocked && styles.lessonTitleLocked
                            ]}
                          >
                            {lesson.title}
                          </Text>

                          <Text
                            style={[
                              styles.lessonSubtitle,
                              !unlocked && styles.lessonSubtitleLocked
                            ]}
                          >
                            {lesson.subtitle}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.lessonStatus,
                            completed && styles.lessonStatusCompleted,
                            isCurrent && styles.lessonStatusCurrent,
                            !unlocked && styles.lessonStatusLocked
                          ]}
                        >
                          {completed
                            ? 'Feita'
                            : isCurrent
                              ? 'Atual'
                              : unlocked
                                ? 'Aberta'
                                : 'Bloqueada'}
                        </Text>
                      </View>

                      <View style={styles.lessonMetaRow}>
                        <Text style={styles.lessonMeta}>
                          ⏱ {lesson.estimatedMinutes} min
                        </Text>

                        <Text style={styles.lessonMeta}>
                          ⚡ {lesson.xp} XP
                        </Text>

                        <Text style={styles.lessonMeta}>
                          Módulo {topicIndex + 1}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  centerEmoji: {
    fontSize: 48,
    marginBottom: spacing.md
  },
  centerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  centerText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm
  },
  retryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: spacing.lg
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  },
  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    marginBottom: spacing.md,
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12
    },
    elevation: 5
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start'
  },
  heroTextArea: {
    flex: 1
  },
  heroLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8
  },
  heroSubtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8
  },
  heroBadge: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroBadgeText: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900'
  },
  heroProgressArea: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: spacing.md,
    marginTop: spacing.lg
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  progressValue: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '900'
  },
  continueCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  continueIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  continueIconText: {
    color: '#16A34A',
    fontSize: 20,
    fontWeight: '900'
  },
  continueTextArea: {
    flex: 1
  },
  continueLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  continueTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900'
  },
  continueSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4
  },
  finishedCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 26,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center'
  },
  finishedEmoji: {
    fontSize: 38,
    marginBottom: spacing.sm
  },
  finishedTitle: {
    color: '#92400E',
    fontSize: 19,
    fontWeight: '900'
  },
  finishedText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  topicBlock: {
    marginBottom: spacing.lg
  },
  topicHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.md
  },
  topicIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicEmoji: {
    fontSize: 28
  },
  topicInfo: {
    flex: 1
  },
  topicTitleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  topicTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  topicStatus: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden'
  },
  topicStatusCompleted: {
    backgroundColor: '#DCFCE7',
    color: '#166534'
  },
  topicStatusActive: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8'
  },
  topicDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  topicProgressFooter: {
    marginTop: spacing.md
  },
  topicProgressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden'
  },
  topicProgressFill: {
    height: '100%',
    borderRadius: 999
  },
  topicProgressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6
  },
  lessonPath: {
    gap: spacing.sm
  },
  lessonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch'
  },
  pathLine: {
    position: 'absolute',
    left: 19,
    top: 42,
    bottom: -14,
    width: 3,
    borderRadius: 999,
    backgroundColor: colors.border
  },
  pathNode: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: spacing.md
  },
  pathNodeCompleted: {
    backgroundColor: '#16A34A'
  },
  pathNodeCurrent: {
    backgroundColor: '#2563EB'
  },
  pathNodeLocked: {
    backgroundColor: '#E5E7EB'
  },
  pathNodeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14
  },
  pathNodeTextLocked: {
    color: '#6B7280'
  },
  lessonCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: spacing.md
  },
  lessonCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  lessonCardCurrent: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE'
  },
  lessonCardLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.74
  },
  lessonCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  lessonTitleArea: {
    flex: 1
  },
  lessonTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900'
  },
  lessonTitleLocked: {
    color: '#6B7280'
  },
  lessonSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4
  },
  lessonSubtitleLocked: {
    color: '#9CA3AF'
  },
  lessonStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden'
  },
  lessonStatusCompleted: {
    backgroundColor: '#DCFCE7',
    color: '#166534'
  },
  lessonStatusCurrent: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8'
  },
  lessonStatusLocked: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280'
  },
  lessonMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  lessonMeta: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden'
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92
  }
});