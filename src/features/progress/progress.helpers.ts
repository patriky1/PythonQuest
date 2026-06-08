import { MAX_HEARTS } from '@/features/progress/progress.constants';

import {
  CompleteLessonInput,
  ProgressState
} from '@/features/progress/progress.types';

export function createDefaultProgress(): ProgressState {
  return {
    xp: 0,
    streak: 0,
    hearts: MAX_HEARTS,
    completedLessonIds: [],
    completedSpecialMissionIds: [],
    badges: [],
    lastActivityDate: null,
    lastPlayedAt: undefined
  };
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeProgress(
  rawProgress: Partial<ProgressState> | null
): ProgressState {
  if (!rawProgress) {
    return createDefaultProgress();
  }

  return {
    xp: typeof rawProgress.xp === 'number' ? rawProgress.xp : 0,
    streak: typeof rawProgress.streak === 'number' ? rawProgress.streak : 0,
    hearts:
      typeof rawProgress.hearts === 'number'
        ? rawProgress.hearts
        : MAX_HEARTS,
    completedLessonIds: Array.isArray(rawProgress.completedLessonIds)
      ? rawProgress.completedLessonIds
      : [],
    completedSpecialMissionIds: Array.isArray(
      rawProgress.completedSpecialMissionIds
    )
      ? rawProgress.completedSpecialMissionIds
      : [],
    badges: Array.isArray(rawProgress.badges) ? rawProgress.badges : [],
    lastActivityDate: rawProgress.lastActivityDate ?? null,
    lastPlayedAt: rawProgress.lastPlayedAt
  };
}

export function addUnique<T>(items: T[], item: T) {
  if (items.includes(item)) {
    return items;
  }

  return [...items, item];
}

export function createBadges(progress: ProgressState) {
  let badges = progress.badges;

  if (progress.completedLessonIds.length >= 1) {
    badges = addUnique(badges, 'Primeira missão');
  }

  if (progress.completedLessonIds.length >= 3) {
    badges = addUnique(badges, 'Trilha aquecida');
  }

  if (progress.completedLessonIds.length >= 5) {
    badges = addUnique(badges, 'Explorador Python');
  }

  if (progress.completedLessonIds.length >= 10) {
    badges = addUnique(badges, 'Aventureiro do Código');
  }

  if (progress.completedSpecialMissionIds.length >= 1) {
    badges = addUnique(badges, 'Herói PythonQuest');
  }

  if (progress.completedSpecialMissionIds.length >= 4) {
    badges = addUnique(badges, 'Mestre Adventure');
  }

  if (progress.xp >= 100) {
    badges = addUnique(badges, '100 XP conquistados');
  }

  return badges;
}

export function resolveCompleteLessonPayload(
  lessonOrPayload: CompleteLessonInput,
  xpReward = 0,
  badge?: string
) {
  if (typeof lessonOrPayload === 'string') {
    return {
      lessonId: lessonOrPayload,
      earnedXp: xpReward,
      badge
    };
  }

  if ('lessonId' in lessonOrPayload) {
    return {
      lessonId: lessonOrPayload.lessonId,
      earnedXp: lessonOrPayload.earnedXp ?? xpReward,
      badge: lessonOrPayload.badge ?? badge
    };
  }

  return {
    lessonId: lessonOrPayload.id,
    earnedXp: xpReward || lessonOrPayload.xp || 0,
    badge
  };
}

export function getCurrentLessonId(
  completedLessonIds: string[],
  orderedLessonIds: string[]
) {
  const nextLessonId = orderedLessonIds.find(
    (lessonId) => !completedLessonIds.includes(lessonId)
  );

  if (nextLessonId) {
    return nextLessonId;
  }

  return orderedLessonIds[orderedLessonIds.length - 1] || '';
}