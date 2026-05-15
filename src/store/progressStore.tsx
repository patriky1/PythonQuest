import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { useAuth } from '@/context/AuthContext';

const MAX_HEARTS = 5;

function createDefaultProgress(): ProgressState {
  return {
    xp: 0,
    hearts: MAX_HEARTS,
    completedLessonIds: [],
    badges: [],
    streak: 0,
    lastActivityDate: null
  };
}

function getProgressStorageKey(userId: string | undefined) {
  return `@pythonquest:progress:${userId || 'guest'}`;
}

function normalizeProgress(progress: Partial<ProgressState> | null): ProgressState {
  if (!progress) {
    return createDefaultProgress();
  }

  return {
    xp: typeof progress.xp === 'number' ? progress.xp : 0,
    hearts: typeof progress.hearts === 'number' ? progress.hearts : MAX_HEARTS,
    completedLessonIds: Array.isArray(progress.completedLessonIds)
      ? progress.completedLessonIds
      : [],
    badges: Array.isArray(progress.badges) ? progress.badges : [],
    streak: typeof progress.streak === 'number' ? progress.streak : 0,
    lastActivityDate: progress.lastActivityDate ?? null
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function addUniqueItem<T>(items: T[], item: T) {
  if (items.includes(item)) {
    return items;
  }

  return [...items, item];
}

export type ProgressState = {
  xp: number;
  hearts: number;
  completedLessonIds: string[];
  badges: string[];
  streak: number;
  lastActivityDate: string | null;
};

type LessonLike = {
  id: string;
  xp?: number;
};

type ProgressContextValue = {
  progress: ProgressState;
  isProgressLoading: boolean;
  isLoading: boolean;
  completeLesson: (lessonOrId: string | LessonLike, xpReward?: number, badge?: string) => Promise<void>;
  markLessonCompleted: (lessonOrId: string | LessonLike, xpReward?: number, badge?: string) => Promise<void>;
  restoreHearts: () => Promise<void>;
  loseHeart: () => Promise<void>;
  resetProgress: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  addBadge: (badge: string) => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();

  const [progress, setProgress] = useState<ProgressState>(() => createDefaultProgress());
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const progressStorageKey = useMemo(() => {
    return getProgressStorageKey(user?.id);
  }, [user?.id]);

  const saveProgress = useCallback(
    async (nextProgress: ProgressState) => {
      setProgress(nextProgress);
      await AsyncStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
    },
    [progressStorageKey]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadUserProgress() {
      setIsProgressLoading(true);

      try {
        const rawProgress = await AsyncStorage.getItem(progressStorageKey);

        if (!isMounted) {
          return;
        }

        if (!rawProgress) {
          setProgress(createDefaultProgress());
          return;
        }

        const parsedProgress = JSON.parse(rawProgress) as Partial<ProgressState>;
        setProgress(normalizeProgress(parsedProgress));
      } catch {
        if (isMounted) {
          setProgress(createDefaultProgress());
        }
      } finally {
        if (isMounted) {
          setIsProgressLoading(false);
        }
      }
    }

    loadUserProgress();

    return () => {
      isMounted = false;
    };
  }, [progressStorageKey]);

  const completeLesson = useCallback(
    async (lessonOrId: string | LessonLike, xpReward = 0, badge?: string) => {
      const lessonId = typeof lessonOrId === 'string' ? lessonOrId : lessonOrId.id;

      const lessonXp =
        typeof lessonOrId === 'string'
          ? xpReward
          : xpReward || lessonOrId.xp || 0;

      const alreadyCompleted = progress.completedLessonIds.includes(lessonId);

      if (alreadyCompleted) {
        return;
      }

      const today = getTodayKey();

      const completedLessonIds = addUniqueItem(progress.completedLessonIds, lessonId);

      let nextBadges = progress.badges;

      if (completedLessonIds.length === 1) {
        nextBadges = addUniqueItem(nextBadges, 'Primeira missão concluída');
      }

      if (completedLessonIds.length === 5) {
        nextBadges = addUniqueItem(nextBadges, 'Explorador Python');
      }

      if (completedLessonIds.length === 10) {
        nextBadges = addUniqueItem(nextBadges, 'Aventureiro do Código');
      }

      if (badge) {
        nextBadges = addUniqueItem(nextBadges, badge);
      }

      const nextProgress: ProgressState = {
        ...progress,
        xp: progress.xp + lessonXp,
        completedLessonIds,
        badges: nextBadges,
        streak:
          progress.lastActivityDate === today
            ? progress.streak
            : progress.streak + 1,
        lastActivityDate: today
      };

      await saveProgress(nextProgress);
    },
    [progress, saveProgress]
  );

  const markLessonCompleted = useCallback(
    async (lessonOrId: string | LessonLike, xpReward = 0, badge?: string) => {
      await completeLesson(lessonOrId, xpReward, badge);
    },
    [completeLesson]
  );

  const restoreHearts = useCallback(async () => {
    const nextProgress: ProgressState = {
      ...progress,
      hearts: MAX_HEARTS
    };

    await saveProgress(nextProgress);
  }, [progress, saveProgress]);

  const loseHeart = useCallback(async () => {
    const nextProgress: ProgressState = {
      ...progress,
      hearts: Math.max(0, progress.hearts - 1)
    };

    await saveProgress(nextProgress);
  }, [progress, saveProgress]);

  const resetProgress = useCallback(async () => {
    const emptyProgress = createDefaultProgress();
    await saveProgress(emptyProgress);
  }, [saveProgress]);

  const addXp = useCallback(
    async (amount: number) => {
      const nextProgress: ProgressState = {
        ...progress,
        xp: progress.xp + amount
      };

      await saveProgress(nextProgress);
    },
    [progress, saveProgress]
  );

  const addBadge = useCallback(
    async (badge: string) => {
      const nextProgress: ProgressState = {
        ...progress,
        badges: addUniqueItem(progress.badges, badge)
      };

      await saveProgress(nextProgress);
    },
    [progress, saveProgress]
  );

  const value = useMemo<ProgressContextValue>(() => {
    return {
      progress,
      isProgressLoading,
      isLoading: isProgressLoading,
      completeLesson,
      markLessonCompleted,
      restoreHearts,
      loseHeart,
      resetProgress,
      addXp,
      addBadge
    };
  }, [
    progress,
    isProgressLoading,
    completeLesson,
    markLessonCompleted,
    restoreHearts,
    loseHeart,
    resetProgress,
    addXp,
    addBadge
  ]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error('useProgress precisa ser usado dentro de ProgressProvider.');
  }

  return context;
}