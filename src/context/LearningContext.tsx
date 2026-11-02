import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { CurriculumResponse, getCurriculumFromApi } from '@/services/learningApi';
import { Lesson, Topic } from '@/types/course';

type LearningContextValue = {
  topics: Topic[];
  lessons: Lesson[];
  orderedLessonIds: string[];
  lessonMap: Record<string, Lesson>;
  isLearningLoading: boolean;
  learningError: string | null;
  reloadLearning: () => Promise<void>;
};

const EMPTY_CURRICULUM: CurriculumResponse = {
  topics: [],
  lessons: [],
  orderedLessonIds: [],
  lessonMap: {}
};

const LearningContext = createContext<LearningContextValue | null>(null);

export function LearningProvider({ children }: PropsWithChildren) {
  const [curriculum, setCurriculum] =
    useState<CurriculumResponse>(EMPTY_CURRICULUM);
  const [isLearningLoading, setIsLearningLoading] = useState(true);
  const [learningError, setLearningError] = useState<string | null>(null);

  const loadLearning = useCallback(async () => {
    setIsLearningLoading(true);
    setLearningError(null);

    try {
      setCurriculum(await getCurriculumFromApi());
    } catch (error) {
      setLearningError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as missões.'
      );
    } finally {
      setIsLearningLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLearning();
  }, [loadLearning]);

  const value = useMemo<LearningContextValue>(
    () => ({
      ...curriculum,
      isLearningLoading,
      learningError,
      reloadLearning: loadLearning
    }),
    [curriculum, isLearningLoading, learningError, loadLearning]
  );

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);

  if (!context) {
    throw new Error('useLearning precisa ser usado dentro de LearningProvider.');
  }

  return context;
}
