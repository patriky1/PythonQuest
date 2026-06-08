import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { getCurriculumFromApi } from '@/services/learningApi';
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

const LearningContext = createContext<LearningContextValue | null>(null);

export function LearningProvider({ children }: PropsWithChildren) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [orderedLessonIds, setOrderedLessonIds] = useState<string[]>([]);
  const [lessonMap, setLessonMap] = useState<Record<string, Lesson>>({});
  const [isLearningLoading, setIsLearningLoading] = useState(true);
  const [learningError, setLearningError] = useState<string | null>(null);

  async function loadLearning() {
    setIsLearningLoading(true);
    setLearningError(null);

    try {
      const curriculum = await getCurriculumFromApi();

      setTopics(curriculum.topics);
      setLessons(curriculum.lessons);
      setOrderedLessonIds(curriculum.orderedLessonIds);
      setLessonMap(curriculum.lessonMap);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as missões.';

      setLearningError(message);
    } finally {
      setIsLearningLoading(false);
    }
  }

  useEffect(() => {
    loadLearning();
  }, []);

  const value = useMemo<LearningContextValue>(() => {
    return {
      topics,
      lessons,
      orderedLessonIds,
      lessonMap,
      isLearningLoading,
      learningError,
      reloadLearning: loadLearning
    };
  }, [
    topics,
    lessons,
    orderedLessonIds,
    lessonMap,
    isLearningLoading,
    learningError
  ]);

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