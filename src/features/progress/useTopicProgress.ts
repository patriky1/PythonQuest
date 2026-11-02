import { useMemo } from 'react';

import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { isLessonUnlocked, toPercent } from '@/features/progress/progress.helpers';
import { Topic } from '@/types/course';

export type TopicProgress = Topic & {
  index: number;
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
  isUnlocked: boolean;
};

export function useTopicProgress(): TopicProgress[] {
  const { topics, orderedLessonIds } = useLearning();
  const { progress } = useProgress();

  return useMemo(() => {
    const completed = new Set(progress.completedLessonIds);

    return topics.map((topic, index) => {
      const completedCount = topic.lessonIds.filter((id) => completed.has(id)).length;
      const totalCount = topic.lessonIds.length;
      const firstLessonId = topic.lessonIds[0];

      return {
        ...topic,
        index,
        completedCount,
        totalCount,
        percent: toPercent(completedCount, totalCount),
        isCompleted: totalCount > 0 && completedCount === totalCount,
        isUnlocked:
          !firstLessonId ||
          completedCount > 0 ||
          isLessonUnlocked(firstLessonId, progress.completedLessonIds, orderedLessonIds)
      };
    });
  }, [topics, orderedLessonIds, progress.completedLessonIds]);
}
