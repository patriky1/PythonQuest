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

    return normalizeProgress(JSON.parse(rawProgress) as Partial<ProgressState>);
  } catch {
    await AsyncStorage.removeItem(storageKey);
    return createDefaultProgress();
  }
}

export async function saveProgressToStorage(
  userId: string | undefined,
  progress: ProgressState
) {
  await AsyncStorage.setItem(
    getProgressStorageKey(userId),
    JSON.stringify(progress)
  );
}
