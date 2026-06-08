import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createDefaultProgress,
  normalizeProgress
} from '@/features/progress/progress.helpers';

import { ProgressState } from '@/features/progress/progress.types';

function getProgressStorageKey(userId?: string) {
  return `@pythonquest:progress:${userId || 'guest'}`;
}

export async function loadProgressFromStorage(
  userId?: string
): Promise<ProgressState> {
  const storageKey = getProgressStorageKey(userId);

  try {
    const rawProgress = await AsyncStorage.getItem(storageKey);

    if (!rawProgress) {
      return createDefaultProgress();
    }

    const parsedProgress = JSON.parse(rawProgress) as Partial<ProgressState>;

    return normalizeProgress(parsedProgress);
  } catch {
    await AsyncStorage.removeItem(storageKey);
    return createDefaultProgress();
  }
}

export async function saveProgressToStorage(
  userId: string | undefined,
  progress: ProgressState
) {
  const storageKey = getProgressStorageKey(userId);

  await AsyncStorage.setItem(storageKey, JSON.stringify(progress));
}

export async function resetProgressInStorage(userId?: string) {
  const defaultProgress = createDefaultProgress();

  await saveProgressToStorage(userId, defaultProgress);

  return defaultProgress;
}