import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTodayKey } from '@/features/progress/progress.helpers';

export const PLAYGROUND_XP_PER_RUN = 2;
export const PLAYGROUND_DAILY_XP_LIMIT = 20;

function getPracticeXpStorageKey(userId: string) {
  return `@pythonquest:playground-xp:${userId}:${getTodayKey()}`;
}

export async function getTodayPlaygroundPracticeXp(userId: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  const currentXp = Number(
    (await AsyncStorage.getItem(getPracticeXpStorageKey(userId))) || 0
  );

  return Number.isNaN(currentXp) ? 0 : currentXp;
}

export async function awardPlaygroundPracticeXp(userId: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  const currentXp = await getTodayPlaygroundPracticeXp(userId);
  const xpAwarded = Math.min(
    PLAYGROUND_XP_PER_RUN,
    Math.max(0, PLAYGROUND_DAILY_XP_LIMIT - currentXp)
  );

  if (xpAwarded > 0) {
    await AsyncStorage.setItem(
      getPracticeXpStorageKey(userId),
      String(currentXp + xpAwarded)
    );
  }

  return xpAwarded;
}
