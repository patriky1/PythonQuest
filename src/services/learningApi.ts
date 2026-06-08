import { AdventureMission } from '@/types/adventure';
import { Lesson, Topic } from '@/types/course';

import { API_URL } from '@/config/api';

export type CurriculumResponse = {
  topics: Topic[];
  lessons: Lesson[];
  orderedLessonIds: string[];
  lessonMap: Record<string, Lesson>;
};

export type SpecialMissionFromApi = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  xp: number;
  badge: string | null;
  data: AdventureMission;
};

export type SpecialMissionResponse = {
  missions: SpecialMissionFromApi[];
};

async function requestApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      'Não foi possível carregar os dados.';

    throw new Error(message);
  }

  return data as T;
}

export async function getCurriculumFromApi(): Promise<CurriculumResponse> {
  return requestApi<CurriculumResponse>('/learning/curriculum');
}

export async function getSpecialMissionsFromApi(): Promise<SpecialMissionResponse> {
  return requestApi<SpecialMissionResponse>('/learning/special-missions');
}

export async function getAdventureMissionsFromApi(): Promise<AdventureMission[]> {
  const response = await getSpecialMissionsFromApi();

  return response.missions
    .filter((mission) => mission.type === 'pythonquest-adventure')
    .map((mission) => mission.data);
}