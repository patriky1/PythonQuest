export function getNextLessonId(
  currentLessonId: string,
  orderedLessonIds: string[] = []
): string | undefined {
  const index = orderedLessonIds.indexOf(currentLessonId);

  if (orderedLessonIds.length === 0) {
    return undefined;
  }

  if (index < 0) {
    return orderedLessonIds[0];
  }

  return orderedLessonIds[index + 1];
}

export function getLessonIndex(
  lessonId: string,
  orderedLessonIds: string[] = []
): number {
  return orderedLessonIds.indexOf(lessonId);
}

export function calculateProgressPercent(
  completedLessonIds: string[],
  totalLessons = 0
): number {
  if (totalLessons === 0) {
    return 0;
  }

  return Math.round((completedLessonIds.length / totalLessons) * 100);
}

export function isLessonUnlocked(
  lessonId: string,
  completedLessonIds: string[],
  orderedLessonIds: string[] = []
): boolean {
  const index = orderedLessonIds.indexOf(lessonId);

  if (index <= 0) {
    return true;
  }

  const previousLessonId = orderedLessonIds[index - 1];

  return completedLessonIds.includes(previousLessonId);
}

export function getCurrentLessonId(
  completedLessonIds: string[],
  orderedLessonIds: string[] = []
): string {
  const next = orderedLessonIds.find(
    (lessonId) => !completedLessonIds.includes(lessonId)
  );

  return next ?? orderedLessonIds[orderedLessonIds.length - 1] ?? '';
}

export function calculateLessonReward(
  baseXp: number,
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) {
    return baseXp;
  }

  const accuracyBonus = Math.round((correctAnswers / totalQuestions) * 10);

  return baseXp + accuracyBonus;
}