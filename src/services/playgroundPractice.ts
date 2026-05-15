import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_XP_PER_RUN = 2;
const DEFAULT_DAILY_LIMIT = 20;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getPracticeXpStorageKey(userId: string) {
  return `@pythonquest:playground-xp:${userId}:${getTodayKey()}`;
}

export async function awardPlaygroundPracticeXp(
  userId: string,
  amount = DEFAULT_XP_PER_RUN,
  dailyLimit = DEFAULT_DAILY_LIMIT
): Promise<number> {
  if (!userId) {
    return 0;
  }

  const storageKey = getPracticeXpStorageKey(userId);

  const rawCurrentXp = await AsyncStorage.getItem(storageKey);
  const currentXp = Number(rawCurrentXp || 0);

  const safeCurrentXp = Number.isNaN(currentXp) ? 0 : currentXp;
  const remainingXp = Math.max(0, dailyLimit - safeCurrentXp);

  if (remainingXp <= 0) {
    return 0;
  }

  const xpAwarded = Math.min(amount, remainingXp);
  const nextXp = safeCurrentXp + xpAwarded;

  await AsyncStorage.setItem(storageKey, String(nextXp));

  return xpAwarded;
}

export async function getTodayPlaygroundPracticeXp(userId: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  const rawCurrentXp = await AsyncStorage.getItem(getPracticeXpStorageKey(userId));
  const currentXp = Number(rawCurrentXp || 0);

  return Number.isNaN(currentXp) ? 0 : currentXp;
}