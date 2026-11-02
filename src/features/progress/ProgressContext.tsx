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
  getActiveStreak,
  getNextLessonId,
  normalizeProgress,
  registerActivity
} from '@/features/progress/progress.helpers';
import {
  loadProgressFromStorage,
  saveProgressToStorage
} from '@/features/progress/progress.storage';
import {
  CompleteLessonPayload,
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

  const [progress, setProgress] = useState<ProgressState>(createDefaultProgress);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const progressRef = useRef<ProgressState>(progress);
  const saveSequenceRef = useRef(0);

  const applyProgress = useCallback((nextProgress: ProgressState) => {
    progressRef.current = nextProgress;
    setProgress(nextProgress);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      setIsProgressLoading(true);

      try {
        if (!user?.id) {
          const guestProgress = await loadProgressFromStorage(undefined);

          if (isMounted) {
            applyProgress(guestProgress);
          }

          return;
        }

        try {
          const apiProgress = normalizeProgress(await getProgressFromApi());

          if (!isMounted) {
            return;
          }

          applyProgress(apiProgress);
          await saveProgressToStorage(user.id, apiProgress);
        } catch {
          const storedProgress = await loadProgressFromStorage(user.id);

          if (isMounted) {
            applyProgress(storedProgress);
          }
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
  }, [user?.id, applyProgress]);

  const syncWithApi = useCallback(
    async (userId: string, localProgress: ProgressState, saveSequence: number) => {
      try {
        const apiProgress = normalizeProgress(await saveProgressToApi(localProgress));

        // Ignora respostas antigas para não sobrescrever uma ação mais recente.
        if (saveSequence !== saveSequenceRef.current) {
          return;
        }

        applyProgress(apiProgress);
        await saveProgressToStorage(userId, apiProgress);
      } catch {
        // Sem internet: o progresso fica salvo no aparelho e sincroniza na próxima ação.
      }
    },
    [applyProgress]
  );

  const commitProgress = useCallback(
    async (nextProgress: ProgressState) => {
      const normalizedProgress = normalizeProgress(nextProgress);
      const saveSequence = ++saveSequenceRef.current;

      applyProgress(normalizedProgress);
      await saveProgressToStorage(user?.id, normalizedProgress);

      // Em segundo plano: a tela não espera o servidor (que pode estar "acordando").
      if (user?.id) {
        syncWithApi(user.id, normalizedProgress, saveSequence);
      }
    },
    [user?.id, applyProgress, syncWithApi]
  );

  const updateProgress = useCallback(
    async (updater: (current: ProgressState) => ProgressState) => {
      await commitProgress(updater(progressRef.current));
    },
    [commitProgress]
  );

  const completeLesson = useCallback(
    async ({ lessonId, earnedXp }: CompleteLessonPayload) => {
      let awardedXp = 0;

      await updateProgress((current) => {
        if (current.completedLessonIds.includes(lessonId)) {
          return registerActivity(current);
        }

        awardedXp = earnedXp;

        const next: ProgressState = {
          ...registerActivity(current),
          xp: current.xp + earnedXp,
          hearts: MAX_HEARTS,
          completedLessonIds: addUnique(current.completedLessonIds, lessonId)
        };

        return { ...next, badges: createBadges(next) };
      });

      return awardedXp;
    },
    [updateProgress]
  );

  const completeSpecialMission = useCallback(
    async ({ missionId, earnedXp, badge }: CompleteSpecialMissionPayload) => {
      let awardedXp = 0;

      await updateProgress((current) => {
        if (current.completedSpecialMissionIds.includes(missionId)) {
          return registerActivity(current);
        }

        awardedXp = earnedXp;

        const next: ProgressState = {
          ...registerActivity(current),
          xp: current.xp + earnedXp,
          hearts: MAX_HEARTS,
          completedSpecialMissionIds: addUnique(
            current.completedSpecialMissionIds,
            missionId
          )
        };

        const badges = createBadges(next);

        return { ...next, badges: badge ? addUnique(badges, badge) : badges };
      });

      return awardedXp;
    },
    [updateProgress]
  );

  const loseHeart = useCallback(async () => {
    await updateProgress((current) => ({
      ...current,
      hearts: Math.max(0, current.hearts - 1),
      lastPlayedAt: new Date().toISOString()
    }));
  }, [updateProgress]);

  const restoreHearts = useCallback(async () => {
    await updateProgress((current) => ({
      ...current,
      hearts: MAX_HEARTS,
      lastPlayedAt: new Date().toISOString()
    }));
  }, [updateProgress]);

  const resetProgress = useCallback(async () => {
    if (user?.id) {
      try {
        const apiProgress = normalizeProgress(await resetProgressOnApi());

        applyProgress(apiProgress);
        await saveProgressToStorage(user.id, apiProgress);
        return;
      } catch {
        // Se a API falhar, zera localmente.
      }
    }

    await commitProgress(createDefaultProgress());
  }, [commitProgress, applyProgress, user?.id]);

  const addXp = useCallback(
    async (amount: number) => {
      if (amount <= 0) {
        return;
      }

      await updateProgress((current) => {
        const next: ProgressState = {
          ...registerActivity(current),
          xp: current.xp + amount
        };

        return { ...next, badges: createBadges(next) };
      });
    },
    [updateProgress]
  );

  const nextLessonId = useMemo(
    () => getNextLessonId(progress.completedLessonIds, orderedLessonIds),
    [progress.completedLessonIds, orderedLessonIds]
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      activeStreak: getActiveStreak(progress),
      isProgressLoading,
      nextLessonId,
      completeLesson,
      completeSpecialMission,
      loseHeart,
      restoreHearts,
      resetProgress,
      addXp
    }),
    [
      progress,
      isProgressLoading,
      nextLessonId,
      completeLesson,
      completeSpecialMission,
      loseHeart,
      restoreHearts,
      resetProgress,
      addXp
    ]
  );

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
