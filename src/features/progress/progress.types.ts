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

export type CompleteLessonPayload = {
  lessonId: string;
  earnedXp?: number;
  badge?: string;
};

export type CompleteSpecialMissionPayload = {
  missionId: string;
  earnedXp?: number;
  badge?: string;
};

export type LessonLike = {
  id: string;
  xp?: number;
};

export type CompleteLessonInput =
  | string
  | LessonLike
  | CompleteLessonPayload;

export type ProgressContextValue = {
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