import { requestApi } from '@/services/apiClient';
import { AdventureMission } from '@/types/adventure';
import { Lesson, Topic } from '@/types/course';

export type CurriculumResponse = {
  topics: Topic[];
  lessons: Lesson[];
  orderedLessonIds: string[];
  lessonMap: Record<string, Lesson>;
};

type SpecialMissionFromApi = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  xp: number;
  badge: string | null;
  data: AdventureMission;
};

type SpecialMissionResponse = {
  missions: SpecialMissionFromApi[];
};

const LOAD_ERROR = 'Não foi possível carregar os dados.';

export function getCurriculumFromApi(): Promise<CurriculumResponse> {
  return requestApi<CurriculumResponse>('/learning/curriculum', {
    fallbackMessage: LOAD_ERROR
  });
}

export async function getAdventureMissionsFromApi(): Promise<AdventureMission[]> {
  const response = await requestApi<SpecialMissionResponse>(
    '/learning/special-missions',
    { fallbackMessage: LOAD_ERROR }
  );

  return response.missions
    .filter((mission) => mission.type === 'pythonquest-adventure')
    .map((mission) => ({
      ...mission.data,
      subtitle: mission.data.subtitle ?? mission.subtitle ?? ''
    }));
}
