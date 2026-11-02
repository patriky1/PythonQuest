import { ProgressState } from '@/features/progress/progress.types';
import { requestApi } from '@/services/apiClient';

type ProgressResponse = {
  progress: ProgressState;
};

const SYNC_ERROR = 'Não foi possível sincronizar o progresso.';

export async function getProgressFromApi(): Promise<ProgressState> {
  const data = await requestApi<ProgressResponse>('/progress', {
    method: 'GET',
    auth: true,
    fallbackMessage: SYNC_ERROR
  });

  return data.progress;
}

export async function saveProgressToApi(
  progress: ProgressState
): Promise<ProgressState> {
  const data = await requestApi<ProgressResponse>('/progress', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(progress),
    fallbackMessage: SYNC_ERROR
  });

  return data.progress;
}

export async function resetProgressOnApi(): Promise<ProgressState> {
  const data = await requestApi<ProgressResponse>('/progress/reset', {
    method: 'POST',
    auth: true,
    fallbackMessage: SYNC_ERROR
  });

  return data.progress;
}
