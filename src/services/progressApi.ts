import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/config/api';
import { ProgressState } from '@/features/progress/progress.types';

const TOKEN_KEY = '@pythonquest:token';

type ProgressResponse = {
  progress: ProgressState;
};

async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function requestProgressApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      'Não foi possível sincronizar o progresso.';

    throw new Error(message);
  }

  return data as T;
}

export async function getProgressFromApi(): Promise<ProgressState> {
  const data = await requestProgressApi<ProgressResponse>('/progress', {
    method: 'GET'
  });

  return data.progress;
}

export async function saveProgressToApi(
  progress: ProgressState
): Promise<ProgressState> {
  const data = await requestProgressApi<ProgressResponse>('/progress', {
    method: 'PUT',
    body: JSON.stringify(progress)
  });

  return data.progress;
}

export async function resetProgressOnApi(): Promise<ProgressState> {
  const data = await requestProgressApi<ProgressResponse>('/progress/reset', {
    method: 'POST'
  });

  return data.progress;
}