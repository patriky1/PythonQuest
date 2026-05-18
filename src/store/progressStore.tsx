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
import { orderedLessonIds } from '@/data/curriculum';

const MAX_HEARTS = 5;

export type ProgressState = {
  xp: number;
  streak: number;
  hearts: number;
  completedLessonIds: string[];
  badges: string[];
  lastActivityDate: string | null;
  lastPlayedAt?: string;
};

type CompleteLessonPayload = {
  lessonId: string;
  earnedXp?: number;
  badge?: string;
};

type LessonLike = {
  id: string;
  xp?: number;
};

type CompleteLessonInput = string | LessonLike | CompleteLessonPayload;

type ProgressContextValue = {
  progress: ProgressState;
  hydrated: boolean;
  isLoading: boolean;
  isProgressLoading: boolean;
  currentLessonId: string;
  completeLesson: (
    lessonOrPayload: CompleteLessonInput,
    xpReward?: number,
    badge?: string
  ) => Promise<void>;
  markLessonCompleted: (
    lessonOrPayload: CompleteLessonInput,
    xpReward?: number,
    badge?: string
  ) => Promise<void>;
  loseHeart: () => Promise<void>;
  restoreHearts: () => Promise<void>;
  resetProgress: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  addBadge: (badge: string) => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined
);

function createDefaultProgress(): ProgressState {
  return {
    xp: 0,
    streak: 0,
    hearts: MAX_HEARTS,
    completedLessonIds: [],
    badges: [],
    lastActivityDate: null,
    lastPlayedAt: undefined
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getProgressStorageKey(userId?: string) {
  return `@pythonquest:progress:${userId || 'guest'}`;
}

function normalizeProgress(rawProgress: Partial<ProgressState> | null): ProgressState {
  if (!rawProgress) {
    return createDefaultProgress();
  }

  return {
    xp: typeof rawProgress.xp === 'number' ? rawProgress.xp : 0,
    streak: typeof rawProgress.streak === 'number' ? rawProgress.streak : 0,
    hearts: typeof rawProgress.hearts === 'number' ? rawProgress.hearts : MAX_HEARTS,
    completedLessonIds: Array.isArray(rawProgress.completedLessonIds)
      ? rawProgress.completedLessonIds
      : [],
    badges: Array.isArray(rawProgress.badges) ? rawProgress.badges : [],
    lastActivityDate: rawProgress.lastActivityDate ?? null,
    lastPlayedAt: rawProgress.lastPlayedAt
  };
}

function addUnique<T>(items: T[], item: T) {
  if (items.includes(item)) {
    return items;
  }

  return [...items, item];
}

function createBadges(progress: ProgressState) {
  let badges = progress.badges;

  if (progress.completedLessonIds.length >= 1) {
    badges = addUnique(badges, 'Primeira missão');
  }

  if (progress.completedLessonIds.length >= 3) {
    badges = addUnique(badges, 'Trilha aquecida');
  }

  if (progress.completedLessonIds.length >= 5) {
    badges = addUnique(badges, 'Explorador Python');
  }

  if (progress.completedLessonIds.length >= 10) {
    badges = addUnique(badges, 'Aventureiro do Código');
  }

  if (progress.xp >= 100) {
    badges = addUnique(badges, '100 XP conquistados');
  }

  return badges;
}

function resolveCompleteLessonPayload(
  lessonOrPayload: CompleteLessonInput,
  xpReward = 0,
  badge?: string
) {
  if (typeof lessonOrPayload === 'string') {
    return {
      lessonId: lessonOrPayload,
      earnedXp: xpReward,
      badge
    };
  }

  if ('lessonId' in lessonOrPayload) {
    return {
      lessonId: lessonOrPayload.lessonId,
      earnedXp: lessonOrPayload.earnedXp ?? xpReward,
      badge: lessonOrPayload.badge ?? badge
    };
  }

  return {
    lessonId: lessonOrPayload.id,
    earnedXp: xpReward || lessonOrPayload.xp || 0,
    badge
  };
}

function getCurrentLessonId(completedLessonIds: string[]) {
  const nextLessonId = orderedLessonIds.find(
    (lessonId) => !completedLessonIds.includes(lessonId)
  );

  if (nextLessonId) {
    return nextLessonId;
  }

  return orderedLessonIds[orderedLessonIds.length - 1];
}

export function ProgressProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();

  const [progress, setProgress] = useState<ProgressState>(() =>
    createDefaultProgress()
  );

  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const progressStorageKey = useMemo(() => {
    return getProgressStorageKey(user?.id);
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
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

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [progressStorageKey]);

  const saveProgress = useCallback(
    async (nextProgress: ProgressState) => {
      setProgress(nextProgress);
      await AsyncStorage.setItem(
        progressStorageKey,
        JSON.stringify(nextProgress)
      );
    },
    [progressStorageKey]
  );

  const completeLesson = useCallback(
    async (
      lessonOrPayload: CompleteLessonInput,
      xpReward = 0,
      badge?: string
    ) => {
      const payload = resolveCompleteLessonPayload(
        lessonOrPayload,
        xpReward,
        badge
      );

      if (!payload.lessonId) {
        return;
      }

      const alreadyCompleted = progress.completedLessonIds.includes(
        payload.lessonId
      );

      if (alreadyCompleted) {
        return;
      }

      const today = getTodayKey();

      const nextCompletedLessonIds = addUnique(
        progress.completedLessonIds,
        payload.lessonId
      );

      const nextProgressBase: ProgressState = {
        ...progress,
        xp: progress.xp + (payload.earnedXp || 0),
        hearts: MAX_HEARTS,
        completedLessonIds: nextCompletedLessonIds,
        streak:
          progress.lastActivityDate === today
            ? progress.streak
            : progress.streak + 1,
        lastActivityDate: today,
        lastPlayedAt: new Date().toISOString()
      };

      let nextBadges = createBadges(nextProgressBase);

      if (payload.badge) {
        nextBadges = addUnique(nextBadges, payload.badge);
      }

      const nextProgress: ProgressState = {
        ...nextProgressBase,
        badges: nextBadges
      };

      await saveProgress(nextProgress);
    },
    [progress, saveProgress]
  );

  const markLessonCompleted = useCallback(
    async (
      lessonOrPayload: CompleteLessonInput,
      xpReward = 0,
      badge?: string
    ) => {
      await completeLesson(lessonOrPayload, xpReward, badge);
    },
    [completeLesson]
  );

  const loseHeart = useCallback(async () => {
    const nextProgress: ProgressState = {
      ...progress,
      hearts: Math.max(0, progress.hearts - 1)
    };

    await saveProgress(nextProgress);
  }, [progress, saveProgress]);

  const restoreHearts = useCallback(async () => {
    const nextProgress: ProgressState = {
      ...progress,
      hearts: MAX_HEARTS
    };

    await saveProgress(nextProgress);
  }, [progress, saveProgress]);

  const resetProgress = useCallback(async () => {
    await saveProgress(createDefaultProgress());
  }, [saveProgress]);

  const addXp = useCallback(
    async (amount: number) => {
      if (!amount || amount <= 0) {
        return;
      }

      const nextProgressBase: ProgressState = {
        ...progress,
        xp: progress.xp + amount,
        lastPlayedAt: new Date().toISOString()
      };

      const nextProgress: ProgressState = {
        ...nextProgressBase,
        badges: createBadges(nextProgressBase)
      };

      await saveProgress(nextProgress);
    },
    [progress, saveProgress]
  );

  const addBadge = useCallback(
    async (badge: string) => {
      const nextProgress: ProgressState = {
        ...progress,
        badges: addUnique(progress.badges, badge)
      };

      await saveProgress(nextProgress);
    },
    [progress, saveProgress]
  );

  const currentLessonId = useMemo(() => {
    return getCurrentLessonId(progress.completedLessonIds);
  }, [progress.completedLessonIds]);

  const value = useMemo<ProgressContextValue>(() => {
    return {
      progress,
      hydrated: !isProgressLoading,
      isLoading: isProgressLoading,
      isProgressLoading,
      currentLessonId,
      completeLesson,
      markLessonCompleted,
      loseHeart,
      restoreHearts,
      resetProgress,
      addXp,
      addBadge
    };
  }, [
    progress,
    isProgressLoading,
    currentLessonId,
    completeLesson,
    markLessonCompleted,
    loseHeart,
    restoreHearts,
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