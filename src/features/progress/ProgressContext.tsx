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
import { useLearning } from '@/context/LearningContext';

import { MAX_HEARTS } from '@/features/progress/progress.constants';

import {
  addUnique,
  createBadges,
  createDefaultProgress,
  getCurrentLessonId,
  getTodayKey,
  normalizeProgress,
  resolveCompleteLessonPayload
} from '@/features/progress/progress.helpers';

import {
  loadProgressFromStorage,
  saveProgressToStorage
} from '@/features/progress/progress.storage';

import {
  CompleteLessonInput,
  CompleteSpecialMissionPayload,
  ProgressContextValue,
  ProgressState
} from '@/features/progress/progress.types';

import {
  getProgressFromApi,
  resetProgressOnApi,
  saveProgressToApi
} from '@/services/progressApi';

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined
);

export function ProgressProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { orderedLessonIds } = useLearning();

  const [progress, setProgress] = useState<ProgressState>(() =>
    createDefaultProgress()
  );

  const progressRef = useRef<ProgressState>(createDefaultProgress());

  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      setIsProgressLoading(true);

      try {
        if (!user?.id) {
          const guestProgress = await loadProgressFromStorage(undefined);

          if (!isMounted) {
            return;
          }

          progressRef.current = guestProgress;
          setProgress(guestProgress);
          return;
        }

        try {
          const apiProgress = normalizeProgress(await getProgressFromApi());

          if (!isMounted) {
            return;
          }

          progressRef.current = apiProgress;
          setProgress(apiProgress);

          await saveProgressToStorage(user.id, apiProgress);
        } catch {
          const storedProgress = await loadProgressFromStorage(user.id);

          if (!isMounted) {
            return;
          }

          progressRef.current = storedProgress;
          setProgress(storedProgress);
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
  }, [user?.id]);

  const commitProgress = useCallback(
    async (nextProgress: ProgressState) => {
      const normalizedProgress = normalizeProgress(nextProgress);

      progressRef.current = normalizedProgress;
      setProgress(normalizedProgress);

      await saveProgressToStorage(user?.id, normalizedProgress);

      if (user?.id) {
        try {
          const apiProgress = normalizeProgress(
            await saveProgressToApi(normalizedProgress)
          );

          progressRef.current = apiProgress;
          setProgress(apiProgress);

          await saveProgressToStorage(user.id, apiProgress);
        } catch {
          // Mantém o progresso local se a internet/API falhar.
          // Na próxima ação, o app tentará sincronizar novamente.
        }
      }
    },
    [user?.id]
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

  const isSpecialMissionCompleted = useCallback(
    (missionId: string) => {
      return progress.completedSpecialMissionIds.includes(missionId);
    },
    [progress.completedSpecialMissionIds]
  );

  const loseHeart = useCallback(async () => {
    await updateProgress((currentProgress) => ({
      ...currentProgress,
      hearts: Math.max(0, currentProgress.hearts - 1),
      lastPlayedAt: new Date().toISOString()
    }));
  }, [updateProgress]);

  const restoreHearts = useCallback(async () => {
    await updateProgress((currentProgress) => ({
      ...currentProgress,
      hearts: MAX_HEARTS,
      lastPlayedAt: new Date().toISOString()
    }));
  }, [updateProgress]);

  const resetProgress = useCallback(async () => {
    if (user?.id) {
      try {
        const apiProgress = normalizeProgress(await resetProgressOnApi());

        progressRef.current = apiProgress;
        setProgress(apiProgress);

        await saveProgressToStorage(user.id, apiProgress);
        return;
      } catch {
        // Se a API falhar, zera localmente.
      }
    }

    await commitProgress(createDefaultProgress());
  }, [commitProgress, user?.id]);

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
        badges: addUnique(currentProgress.badges, badge),
        lastPlayedAt: new Date().toISOString()
      }));
    },
    [updateProgress]
  );

  const currentLessonId = useMemo(() => {
    return getCurrentLessonId(progress.completedLessonIds, orderedLessonIds);
  }, [progress.completedLessonIds, orderedLessonIds]);

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