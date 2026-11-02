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
  earnedXp: number;
};

export type CompleteSpecialMissionPayload = {
  missionId: string;
  earnedXp: number;
  badge?: string;
};

export type ProgressContextValue = {
  progress: ProgressState;
  activeStreak: number;
  isProgressLoading: boolean;
  nextLessonId: string | undefined;

  // Retornam o XP realmente concedido (0 se a missão já tinha sido concluída).
  completeLesson: (payload: CompleteLessonPayload) => Promise<number>;
  completeSpecialMission: (
    payload: CompleteSpecialMissionPayload
  ) => Promise<number>;

  loseHeart: () => Promise<void>;
  restoreHearts: () => Promise<void>;
  resetProgress: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
};
