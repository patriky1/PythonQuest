import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  completedSpecialMissionIds: string[];
  badges: string[];
  lastActivityDate: string | null;
  lastPlayedAt?: string;
};

type CompleteLessonPayload = {
  lessonId: string;
  earnedXp?: number;
  badge?: string;
};

type CompleteSpecialMissionPayload = {
  missionId: string;
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

  completeSpecialMission: (
    payload: CompleteSpecialMissionPayload
  ) => Promise<number>;

  isSpecialMissionCompleted: (missionId: string) => boolean;

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
    completedSpecialMissionIds: [],
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

function normalizeProgress(
  rawProgress: Partial<ProgressState> | null
): ProgressState {
  if (!rawProgress) {
    return createDefaultProgress();
  }

  return {
    xp: typeof rawProgress.xp === 'number' ? rawProgress.xp : 0,
    streak: typeof rawProgress.streak === 'number' ? rawProgress.streak : 0,
    hearts:
      typeof rawProgress.hearts === 'number'
        ? rawProgress.hearts
        : MAX_HEARTS,
    completedLessonIds: Array.isArray(rawProgress.completedLessonIds)
      ? rawProgress.completedLessonIds
      : [],
    completedSpecialMissionIds: Array.isArray(
      rawProgress.completedSpecialMissionIds
    )
      ? rawProgress.completedSpecialMissionIds
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

  if (progress.completedSpecialMissionIds.length >= 1) {
    badges = addUnique(badges, 'Herói PythonQuest');
  }

  if (progress.completedSpecialMissionIds.length >= 4) {
    badges = addUnique(badges, 'Mestre Adventure');
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

  const progressRef = useRef<ProgressState>(createDefaultProgress());

  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const progressStorageKey = useMemo(() => {
    return getProgressStorageKey(user?.id);
  }, [user?.id]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

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
          const defaultProgress = createDefaultProgress();
          progressRef.current = defaultProgress;
          setProgress(defaultProgress);
          return;
        }

        const parsedProgress = JSON.parse(
          rawProgress
        ) as Partial<ProgressState>;

        const normalizedProgress = normalizeProgress(parsedProgress);

        progressRef.current = normalizedProgress;
        setProgress(normalizedProgress);
      } catch {
        if (isMounted) {
          const defaultProgress = createDefaultProgress();
          progressRef.current = defaultProgress;
          setProgress(defaultProgress);
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

  const commitProgress = useCallback(
    async (nextProgress: ProgressState) => {
      progressRef.current = nextProgress;
      setProgress(nextProgress);

      await AsyncStorage.setItem(
        progressStorageKey,
        JSON.stringify(nextProgress)
      );
    },
    [progressStorageKey]
  );

  const updateProgress = useCallback(
    async (updater: (current: ProgressState) => ProgressState) => {
      const currentProgress = progressRef.current;
      const nextProgress = updater(currentProgress);

      await commitProgress(nextProgress);
    },
    [commitProgress]
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

      await updateProgress((currentProgress) => {
        const alreadyCompleted =
          currentProgress.completedLessonIds.includes(payload.lessonId);

        if (alreadyCompleted) {
          return currentProgress;
        }

        const today = getTodayKey();

        const nextCompletedLessonIds = addUnique(
          currentProgress.completedLessonIds,
          payload.lessonId
        );

        const nextProgressBase: ProgressState = {
          ...currentProgress,
          xp: currentProgress.xp + (payload.earnedXp || 0),
          hearts: MAX_HEARTS,
          completedLessonIds: nextCompletedLessonIds,
          streak:
            currentProgress.lastActivityDate === today
              ? currentProgress.streak
              : currentProgress.streak + 1,
          lastActivityDate: today,
          lastPlayedAt: new Date().toISOString()
        };

        let nextBadges = createBadges(nextProgressBase);

        if (payload.badge) {
          nextBadges = addUnique(nextBadges, payload.badge);
        }

        return {
          ...nextProgressBase,
          badges: nextBadges
        };
      });
    },
    [updateProgress]
  );

  const completeSpecialMission = useCallback(
    async (payload: CompleteSpecialMissionPayload) => {
      if (!payload.missionId) {
        return 0;
      }

      let awardedXp = 0;

      await updateProgress((currentProgress) => {
        const alreadyCompleted =
          currentProgress.completedSpecialMissionIds.includes(
            payload.missionId
          );

        if (alreadyCompleted) {
          awardedXp = 0;
          return currentProgress;
        }

        const today = getTodayKey();

        awardedXp = payload.earnedXp || 0;

        const nextCompletedSpecialMissionIds = addUnique(
          currentProgress.completedSpecialMissionIds,
          payload.missionId
        );

        const nextProgressBase: ProgressState = {
          ...currentProgress,
          xp: currentProgress.xp + awardedXp,
          hearts: MAX_HEARTS,
          completedSpecialMissionIds: nextCompletedSpecialMissionIds,
          streak:
            currentProgress.lastActivityDate === today
              ? currentProgress.streak
              : currentProgress.streak + 1,
          lastActivityDate: today,
          lastPlayedAt: new Date().toISOString()
        };

        let nextBadges = createBadges(nextProgressBase);

        if (payload.badge) {
          nextBadges = addUnique(nextBadges, payload.badge);
        }

        return {
          ...nextProgressBase,
          badges: nextBadges
        };
      });

      return awardedXp;
    },
    [updateProgress]
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
    await updateProgress((currentProgress) => ({
      ...currentProgress,
      hearts: Math.max(0, currentProgress.hearts - 1)
    }));
  }, [updateProgress]);

  const restoreHearts = useCallback(async () => {
    await updateProgress((currentProgress) => ({
      ...currentProgress,
      hearts: MAX_HEARTS
    }));
  }, [updateProgress]);

  const resetProgress = useCallback(async () => {
    await commitProgress(createDefaultProgress());
  }, [commitProgress]);

  const addXp = useCallback(
    async (amount: number) => {
      if (!amount || amount <= 0) {
        return;
      }

      await updateProgress((currentProgress) => {
        const nextProgressBase: ProgressState = {
          ...currentProgress,
          xp: currentProgress.xp + amount,
          lastPlayedAt: new Date().toISOString()
        };

        return {
          ...nextProgressBase,
          badges: createBadges(nextProgressBase)
        };
      });
    },
    [updateProgress]
  );

  const addBadge = useCallback(
    async (badge: string) => {
      if (!badge) {
        return;
      }

      await updateProgress((currentProgress) => ({
        ...currentProgress,
        badges: addUnique(currentProgress.badges, badge)
      }));
    },
    [updateProgress]
  );

  const isSpecialMissionCompleted = useCallback(
    (missionId: string) => {
      return progress.completedSpecialMissionIds.includes(missionId);
    },
    [progress.completedSpecialMissionIds]
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
      completeSpecialMission,
      isSpecialMissionCompleted,
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
    completeSpecialMission,
    isSpecialMissionCompleted,
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