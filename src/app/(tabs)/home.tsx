import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { router } from 'expo-router';

import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';

import {
  lessonMap,
  lessons,
  orderedLessonIds,
  topics
} from '@/data/curriculum';

import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/store/progressStore';

import { colors, spacing } from '@/theme/colors';
import { calculateProgressPercent } from '@/utils/game';

export default function HomeScreen() {
  const { user } = useAuth();
  const { progress } = useProgress();

  const completedSet = useMemo(() => {
    return new Set(progress.completedLessonIds);
  }, [progress.completedLessonIds]);

  const percent = calculateProgressPercent(progress.completedLessonIds);

  const nextLesson = useMemo(() => {
    const nextLessonId = orderedLessonIds.find(
      (lessonId) => !completedSet.has(lessonId)
    );

    if (!nextLessonId) {
      return null;
    }

    return lessonMap[nextLessonId];
  }, [completedSet]);

  const completedLessonsCount = progress.completedLessonIds.length;
  const totalLessonsCount = lessons.length;

  const topicProgress = useMemo(() => {
    return topics.map((topic) => {
      const completedInTopic = topic.lessonIds.filter((lessonId) =>
        completedSet.has(lessonId)
      ).length;

      const totalInTopic = topic.lessonIds.length;
      const topicPercent =
        totalInTopic === 0
          ? 0
          : Math.round((completedInTopic / totalInTopic) * 100);

      return {
        ...topic,
        completedInTopic,
        totalInTopic,
        topicPercent
      };
    });
  }, [completedSet]);

  function openNextLesson() {
    if (!nextLesson) {
      return;
    }

    router.push(`/lesson/${nextLesson.id}`);
  }

  function openTopicFirstAvailableLesson(topicId: string) {
    const topic = topics.find((currentTopic) => currentTopic.id === topicId);

    if (!topic) {
      return;
    }

    const firstAvailableLessonId =
      topic.lessonIds.find((lessonId) => !completedSet.has(lessonId)) ||
      topic.lessonIds[0];

    if (!firstAvailableLessonId) {
      return;
    }

    router.push(`/lesson/${firstAvailableLessonId}`);
  }

  function openPlayground() {
    router.push('/(tabs)/playground');
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.greetingArea}>
              <Text style={styles.greeting}>Olá, {user?.name || 'aprendiz'}.</Text>
              <Text style={styles.heroTitle}>Vamos praticar Python hoje?</Text>
            </View>

            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>Py</Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            Complete missões curtas, teste comandos no laboratório e acompanhe seu avanço.
          </Text>

          <View style={styles.heroProgressArea}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso geral</Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>

            <ProgressBar value={percent} />

            <Text style={styles.progressHint}>
              {completedLessonsCount} de {totalLessonsCount} missões concluídas
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="XP" value={progress.xp} emoji="⚡" />
          <StatCard label="Sequência" value={progress.streak} emoji="🔥" />
          <StatCard label="Corações" value={progress.hearts} emoji="❤️" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próxima missão</Text>
          <Text style={styles.sectionCaption}>Continue de onde parou</Text>
        </View>

        {nextLesson ? (
          <Pressable
            style={({ pressed }) => [
              styles.nextMissionCard,
              pressed && styles.cardPressed
            ]}
            onPress={openNextLesson}
          >
            <View style={styles.nextMissionContent}>
              <View style={styles.missionIcon}>
                <Text style={styles.missionIconText}>▶</Text>
              </View>

              <View style={styles.missionTextArea}>
                <Text style={styles.missionTitle}>{nextLesson.title}</Text>
                <Text style={styles.missionSubtitle}>
                  {nextLesson.subtitle}
                </Text>

                <View style={styles.missionMetaRow}>
                  <Text style={styles.metaPill}>
                    ⚡ {nextLesson.xp} XP
                  </Text>

                  <Text style={styles.metaPill}>
                    ⏱ {nextLesson.estimatedMinutes} min
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.nextMissionAction}>Começar</Text>
          </Pressable>
        ) : (
          <View style={styles.finishedCard}>
            <Text style={styles.finishedEmoji}>🏆</Text>
            <Text style={styles.finishedTitle}>Trilha concluída</Text>
            <Text style={styles.finishedText}>
              Você concluiu todas as missões disponíveis. Continue praticando no laboratório Python.
            </Text>
          </View>
        )}

        <View style={styles.quickActionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionCard,
              pressed && styles.cardPressed
            ]}
            onPress={openPlayground}
          >
            <Text style={styles.quickActionIcon}>🧪</Text>
            <Text style={styles.quickActionTitle}>Laboratório</Text>
            <Text style={styles.quickActionText}>
              Teste códigos livres e ganhe XP praticando.
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.quickActionCard,
              pressed && styles.cardPressed
            ]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionTitle}>Perfil</Text>
            <Text style={styles.quickActionText}>
              Veja medalhas, XP e progresso da conta.
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trilha de aprendizado</Text>
          <Text style={styles.sectionCaption}>Tópicos organizados por etapa</Text>
        </View>

        <View style={styles.topicList}>
          {topicProgress.map((topic, index) => {
            const isCompleted =
              topic.totalInTopic > 0 &&
              topic.completedInTopic === topic.totalInTopic;

            const isLocked =
              index > 0 &&
              topicProgress[index - 1].completedInTopic === 0 &&
              topic.completedInTopic === 0;

            return (
              <Pressable
                key={topic.id}
                style={({ pressed }) => [
                  styles.topicCard,
                  pressed && !isLocked && styles.cardPressed,
                  isLocked && styles.topicCardLocked
                ]}
                onPress={() => {
                  if (!isLocked) {
                    openTopicFirstAvailableLesson(topic.id);
                  }
                }}
              >
                <View style={styles.topicTopRow}>
                  <View
                    style={[
                      styles.topicEmojiBox,
                      { backgroundColor: topic.color || '#2563EB' }
                    ]}
                  >
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  </View>

                  <View style={styles.topicTextArea}>
                    <View style={styles.topicTitleRow}>
                      <Text style={styles.topicTitle}>{topic.title}</Text>

                      {isCompleted ? (
                        <Text style={styles.completedTag}>Concluído</Text>
                      ) : isLocked ? (
                        <Text style={styles.lockedTag}>Bloqueado</Text>
                      ) : (
                        <Text style={styles.activeTag}>Aberto</Text>
                      )}
                    </View>

                    <Text style={styles.topicDescription}>
                      {topic.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.topicProgressFooter}>
                  <View style={styles.topicProgressTrack}>
                    <View
                      style={[
                        styles.topicProgressFill,
                        {
                          width: `${topic.topicPercent}%`,
                          backgroundColor: topic.color || '#2563EB'
                        }
                      ]}
                    />
                  </View>

                  <Text style={styles.topicProgressText}>
                    {topic.completedInTopic}/{topic.totalInTopic} missões
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl
  },
  hero: {
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
    justifyContent: 'space-between',
    gap: spacing.md
  },
  greetingArea: {
    flex: 1
  },
  greeting: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.8
  },
  avatarBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.8
  },
  heroDescription: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14
  },
  heroProgressArea: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: spacing.md,
    marginTop: 18
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
  progressPercent: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '900'
  },
  progressHint: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
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
  sectionCaption: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  nextMissionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  nextMissionContent: {
    flexDirection: 'row',
    gap: spacing.md
  },
  missionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  missionIconText: {
    color: '#16A34A',
    fontSize: 20,
    fontWeight: '900'
  },
  missionTextArea: {
    flex: 1
  },
  missionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24
  },
  missionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  missionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  metaPill: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900'
  },
  nextMissionAction: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.md
  },
  finishedCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 26,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center'
  },
  finishedEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm
  },
  finishedTitle: {
    color: '#92400E',
    fontSize: 20,
    fontWeight: '900'
  },
  finishedText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.md
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm
  },
  quickActionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  quickActionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  topicList: {
    gap: spacing.sm
  },
  topicCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: spacing.md
  },
  topicCardLocked: {
    opacity: 0.58
  },
  topicTopRow: {
    flexDirection: 'row',
    gap: spacing.md
  },
  topicEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicEmoji: {
    fontSize: 24
  },
  topicTextArea: {
    flex: 1
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap'
  },
  topicTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  completedTag: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden'
  },
  activeTag: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden'
  },
  lockedTag: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden'
  },
  topicDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5
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
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92
  }
});