import React, { ComponentProps } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { LevelProgress } from '@/components/LevelProgress';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { LearningErrorView, LearningLoadingView } from '@/components/StateView';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/context/AuthContext';
import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { MAX_HEARTS } from '@/features/progress/progress.constants';
import { toPercent } from '@/features/progress/progress.helpers';
import { TopicProgress, useTopicProgress } from '@/features/progress/useTopicProgress';
import { colors, radius, shadow, spacing } from '@/theme/colors';

type QuickAction = {
  title: string;
  text: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  onPress: () => void;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Adventure',
    text: 'Guie o herói com comandos.',
    icon: 'game-controller',
    color: colors.secondary,
    onPress: () => router.push('/mission/pythonquest-adventure')
  },
  {
    title: 'Terminal',
    text: 'Teste Python livre.',
    icon: 'terminal',
    color: '#7C3AED',
    onPress: () => router.push('/playground')
  }
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { progress, activeStreak, nextLessonId } = useProgress();
  const { lessons, lessonMap, isLearningLoading, learningError, reloadLearning } =
    useLearning();
  const topics = useTopicProgress();

  const firstName = user?.name?.split(' ')[0];
  const nextLesson = nextLessonId ? lessonMap[nextLessonId] : undefined;
  const nextLessonTopic = topics.find((topic) => topic.id === nextLesson?.topicId);
  const overallPercent = toPercent(progress.completedLessonIds.length, lessons.length);

  function openTopic(topic: TopicProgress) {
    const lessonId = nextLesson && nextLesson.topicId === topic.id ? nextLesson.id : null;

    if (lessonId) {
      router.push(`/lesson/${lessonId}`);
    } else {
      router.push('/learn');
    }
  }

  if (isLearningLoading && lessons.length === 0) {
    return (
      <Screen>
        <LearningLoadingView />
      </Screen>
    );
  }

  if (learningError && lessons.length === 0) {
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
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.greetingArea}>
            <Text style={styles.greeting}>Olá, {firstName || 'aprendiz'}!</Text>
            <Text style={styles.heroTitle}>Pronto para a próxima missão?</Text>
          </View>

          <View
            style={[styles.streakBadge, activeStreak === 0 && styles.streakBadgeOff]}
            accessible
            accessibilityLabel={`Sequência de ${activeStreak} dias`}
          >
            <Ionicons
              name="flame"
              size={22}
              color={activeStreak > 0 ? '#FB923C' : colors.muted}
            />
            <Text style={styles.streakValue}>{activeStreak}</Text>
          </View>
        </View>

        <LevelProgress xp={progress.xp} dark />
      </View>

      {!user ? (
        <Pressable
          style={({ pressed }) => [styles.guestBanner, pressed && styles.pressed]}
          onPress={() => router.push('/auth/login')}
          accessibilityRole="button"
        >
          <Ionicons name="cloud-upload-outline" size={22} color={colors.secondaryDark} />
          <Text style={styles.guestText}>
            Você está no modo visitante. Entre para salvar seu progresso na nuvem.
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.secondaryDark} />
        </Pressable>
      ) : null}

      <View style={styles.statsRow}>
        <StatCard label="Missões" value={`${overallPercent}%`} icon="map" color={colors.primary} />
        <StatCard
          label="Corações"
          value={`${progress.hearts}/${MAX_HEARTS}`}
          icon="heart"
          color={colors.heart}
        />
        <StatCard
          label="Medalhas"
          value={progress.badges.length}
          icon="ribbon"
          color={colors.warning}
        />
      </View>

      <SectionHeader title="Continue de onde parou" />

      {nextLesson ? (
        <View style={styles.nextMissionCard}>
          <View style={styles.nextMissionTop}>
            <View style={styles.missionIcon}>
              <Ionicons name="play" size={22} color={colors.primary} />
            </View>

            <View style={styles.missionTextArea}>
              {nextLessonTopic ? (
                <Text style={styles.missionTopic}>
                  Módulo {nextLessonTopic.index + 1} · {nextLessonTopic.title}
                </Text>
              ) : null}
              <Text style={styles.missionTitle}>{nextLesson.title}</Text>
              <Text style={styles.missionSubtitle}>{nextLesson.subtitle}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Tag label={`+${nextLesson.xp} XP`} tone="warning" icon="flash" />
            <Tag label={`${nextLesson.estimatedMinutes} min`} icon="time-outline" />
            <Tag label={`${nextLesson.steps.length} etapas`} icon="layers-outline" />
          </View>

          <AppButton
            title={progress.completedLessonIds.length === 0 ? 'Começar' : 'Continuar'}
            icon="arrow-forward"
            onPress={() => router.push(`/lesson/${nextLesson.id}`)}
          />
        </View>
      ) : (
        <View style={styles.finishedCard}>
          <Ionicons name="trophy" size={40} color={colors.warning} />
          <Text style={styles.finishedTitle}>Trilha concluída!</Text>
          <Text style={styles.finishedText}>
            Você completou todas as missões. Revise as aulas, encare o Adventure ou crie
            seus próprios programas no Terminal.
          </Text>
        </View>
      )}

      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.title}
            accessibilityRole="button"
            style={({ pressed }) => [styles.quickActionCard, pressed && styles.pressed]}
            onPress={action.onPress}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}1A` }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionText}>{action.text}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Sua trilha" subtitle="Módulos organizados por etapa" />

      <View style={styles.topicList}>
        {topics.map((topic) => (
          <Pressable
            key={topic.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !topic.isUnlocked }}
            disabled={!topic.isUnlocked}
            onPress={() => openTopic(topic)}
            style={({ pressed }) => [
              styles.topicCard,
              !topic.isUnlocked && styles.topicCardLocked,
              pressed && styles.pressed
            ]}
          >
            <View style={[styles.topicEmojiBox, { backgroundColor: `${topic.color}22` }]}>
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            </View>

            <View style={styles.topicTextArea}>
              <View style={styles.topicTitleRow}>
                <Text style={styles.topicTitle} numberOfLines={1}>
                  {topic.title}
                </Text>
                {topic.isCompleted ? (
                  <Tag label="Concluído" tone="success" icon="checkmark" />
                ) : !topic.isUnlocked ? (
                  <Tag label="Bloqueado" icon="lock-closed" />
                ) : null}
              </View>

              <ProgressBar value={topic.percent} height={8} color={topic.color} />

              <Text style={styles.topicProgressText}>
                {topic.completedCount}/{topic.totalCount} missões
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadow.raised
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md
  },
  greetingArea: {
    flex: 1
  },
  greeting: {
    color: colors.inkText,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.6
  },
  streakBadge: {
    minWidth: 58,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(251,146,60,0.16)',
    alignItems: 'center'
  },
  streakBadgeOff: {
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  streakValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondarySoft,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  guestText: {
    flex: 1,
    color: colors.secondaryDark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  nextMissionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card
  },
  nextMissionTop: {
    flexDirection: 'row',
    gap: spacing.md
  },
  missionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  missionTextArea: {
    flex: 1
  },
  missionTopic: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  missionTitle: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800'
  },
  missionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  finishedCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs
  },
  finishedTitle: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: '900'
  },
  finishedText: {
    color: colors.accentText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center'
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  quickActionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  quickActionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  topicList: {
    gap: spacing.sm
  },
  topicCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  topicCardLocked: {
    opacity: 0.6
  },
  topicEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicEmoji: {
    fontSize: 26
  },
  topicTextArea: {
    flex: 1,
    gap: 8
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  topicTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  topicProgressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  }
});
