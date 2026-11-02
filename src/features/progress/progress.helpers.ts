import {
  ACCURACY_BONUS_XP,
  BadgeDefinition,
  BADGES,
  LEVEL_TITLES,
  MAX_HEARTS
} from '@/features/progress/progress.constants';
import { ProgressState } from '@/features/progress/progress.types';

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

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

// Data local (e não UTC) para a sequência virar o dia no horário do aluno.
export function getTodayKey() {
  return toDateKey(new Date());
}

function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return toDateKey(date);
}

export function getActiveStreak(progress: ProgressState) {
  const { lastActivityDate, streak } = progress;

  if (lastActivityDate === getTodayKey() || lastActivityDate === getYesterdayKey()) {
    return streak;
  }

  return 0;
}

export function registerActivity(progress: ProgressState): ProgressState {
  const today = getTodayKey();

  let streak = 1;

  if (progress.lastActivityDate === today) {
    streak = Math.max(progress.streak, 1);
  } else if (progress.lastActivityDate === getYesterdayKey()) {
    streak = progress.streak + 1;
  }

  return {
    ...progress,
    streak,
    lastActivityDate: today,
    lastPlayedAt: new Date().toISOString()
  };
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
      typeof rawProgress.hearts === 'number' ? rawProgress.hearts : MAX_HEARTS,
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
  return items.includes(item) ? items : [...items, item];
}

export function getBadgeMetricValue(
  progress: ProgressState,
  badge: BadgeDefinition
) {
  switch (badge.metric) {
    case 'lessons':
      return progress.completedLessonIds.length;
    case 'specialMissions':
      return progress.completedSpecialMissionIds.length;
    case 'xp':
      return progress.xp;
    case 'streak':
      return progress.streak;
  }
}

export function createBadges(progress: ProgressState) {
  return BADGES.reduce(
    (badges, badge) =>
      getBadgeMetricValue(progress, badge) >= badge.target
        ? addUnique(badges, badge.id)
        : badges,
    progress.badges
  );
}

export function getLevelInfo(xp: number) {
  // Nível n começa em 50 * n * (n - 1) XP: 0, 100, 300, 600, 1000...
  let level = 1;

  while (50 * (level + 1) * level <= xp) {
    level += 1;
  }

  const levelStartXp = 50 * level * (level - 1);
  const nextLevelXp = 50 * (level + 1) * level;

  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    xpIntoLevel: xp - levelStartXp,
    xpForNextLevel: nextLevelXp - levelStartXp,
    percent: Math.round(((xp - levelStartXp) / (nextLevelXp - levelStartXp)) * 100)
  };
}

export function toPercent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function isLessonUnlocked(
  lessonId: string,
  completedLessonIds: string[],
  orderedLessonIds: string[]
) {
  const index = orderedLessonIds.indexOf(lessonId);

  if (index <= 0) {
    return true;
  }

  return completedLessonIds.includes(orderedLessonIds[index - 1]);
}

export function getNextLessonId(
  completedLessonIds: string[],
  orderedLessonIds: string[]
) {
  return orderedLessonIds.find(
    (lessonId) => !completedLessonIds.includes(lessonId)
  );
}

export function calculateLessonReward(
  baseXp: number,
  correctAnswers: number,
  totalQuestions: number
) {
  if (totalQuestions === 0) {
    return baseXp;
  }

  return baseXp + Math.round((correctAnswers / totalQuestions) * ACCURACY_BONUS_XP);
}
