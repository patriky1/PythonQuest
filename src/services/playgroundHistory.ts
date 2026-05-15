import AsyncStorage from '@react-native-async-storage/async-storage';

import { PlaygroundHistoryItem } from '@/types/playground';

const MAX_HISTORY_ITEMS = 30;

function getHistoryStorageKey(userId: string) {
  return `@pythonquest:playground-history:${userId}`;
}

export async function getPlaygroundHistory(userId: string): Promise<PlaygroundHistoryItem[]> {
  if (!userId) {
    return [];
  }

  const rawHistory = await AsyncStorage.getItem(getHistoryStorageKey(userId));

  if (!rawHistory) {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(rawHistory) as PlaygroundHistoryItem[];

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory;
  } catch {
    await AsyncStorage.removeItem(getHistoryStorageKey(userId));
    return [];
  }
}

export async function savePlaygroundHistory(
  userId: string,
  history: PlaygroundHistoryItem[]
) {
  if (!userId) {
    return;
  }

  await AsyncStorage.setItem(
    getHistoryStorageKey(userId),
    JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS))
  );
}

export async function addPlaygroundHistoryItem(
  userId: string,
  item: Omit<PlaygroundHistoryItem, 'id' | 'userId' | 'createdAt'>
): Promise<PlaygroundHistoryItem[]> {
  const currentHistory = await getPlaygroundHistory(userId);

  const newItem: PlaygroundHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    code: item.code,
    output: item.output,
    status: item.status,
    xpAwarded: item.xpAwarded,
    createdAt: new Date().toISOString()
  };

  const updatedHistory = [newItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);

  await savePlaygroundHistory(userId, updatedHistory);

  return updatedHistory;
}

export async function clearPlaygroundHistory(userId: string) {
  if (!userId) {
    return;
  }

  await AsyncStorage.removeItem(getHistoryStorageKey(userId));
}