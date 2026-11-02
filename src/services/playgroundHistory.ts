import AsyncStorage from '@react-native-async-storage/async-storage';

import { PlaygroundHistoryItem } from '@/types/playground';

const MAX_HISTORY_ITEMS = 30;

function getHistoryStorageKey(userId: string) {
  return `@pythonquest:playground-history:${userId}`;
}

export async function getPlaygroundHistory(userId: string): Promise<PlaygroundHistoryItem[]> {
  const rawHistory = await AsyncStorage.getItem(getHistoryStorageKey(userId));

  if (!rawHistory) {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(rawHistory);
    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    await AsyncStorage.removeItem(getHistoryStorageKey(userId));
    return [];
  }
}

export async function addPlaygroundHistoryItem(
  userId: string,
  item: Omit<PlaygroundHistoryItem, 'id' | 'userId' | 'createdAt'>
): Promise<PlaygroundHistoryItem[]> {
  const currentHistory = await getPlaygroundHistory(userId);

  const newItem: PlaygroundHistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    createdAt: new Date().toISOString()
  };

  const updatedHistory = [newItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);

  await AsyncStorage.setItem(getHistoryStorageKey(userId), JSON.stringify(updatedHistory));

  return updatedHistory;
}

export async function clearPlaygroundHistory(userId: string) {
  await AsyncStorage.removeItem(getHistoryStorageKey(userId));
}
