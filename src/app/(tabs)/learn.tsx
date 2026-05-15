import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { QuestCard } from '@/components/QuestCard';
import { Screen } from '@/components/Screen';
import { lessonMap, topics } from '@/data/curriculum';
import { useProgress } from '@/store/progressStore';
import { colors, spacing } from '@/theme/colors';
import { isLessonUnlocked } from '@/utils/game';

export default function LearnScreen() {
  const { progress } = useProgress();

  return (
    <Screen>
      <Text style={styles.title}>Trilha de aprendizado</Text>
      <Text style={styles.subtitle}>Avance em ordem, ganhe XP e desbloqueie novas missões.</Text>

      {topics.map((topic) => (
        <View key={topic.id} style={styles.topicBlock}>
          <View style={[styles.topicHeader, { borderLeftColor: topic.color }]}>
            <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            <View style={styles.topicInfo}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicDescription}>{topic.description}</Text>
            </View>
          </View>

          {topic.lessonIds.map((lessonId, index) => {
            const lesson = lessonMap[lessonId];
            const completed = progress.completedLessonIds.includes(lessonId);
            const unlocked = isLessonUnlocked(lessonId, progress.completedLessonIds);

            return (
              <View key={lessonId} style={styles.pathRow}>
                <View style={styles.pathLine} />
                <View style={styles.pathNumber}>
                  <Text style={styles.pathNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.pathCard}>
                  <QuestCard
                    title={lesson.title}
                    subtitle={lesson.subtitle}
                    completed={completed}
                    locked={!unlocked}
                    meta={`${lesson.estimatedMinutes} min • ${lesson.xp} XP`}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: spacing.xs
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: spacing.lg
  },
  topicBlock: {
    marginBottom: spacing.lg
  },
  topicHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.md
  },
  topicEmoji: {
    fontSize: 34
  },
  topicInfo: {
    flex: 1
  },
  topicTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  topicDescription: {
    color: colors.muted,
    marginTop: 4,
    lineHeight: 20
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pathLine: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.border
  },
  pathNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    zIndex: 1
  },
  pathNumberText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  pathCard: {
    flex: 1
  }
});
