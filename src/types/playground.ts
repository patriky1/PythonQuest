export type PlaygroundRunStatus = 'success' | 'error';

export type PlaygroundHistoryItem = {
  id: string;
  userId: string;
  code: string;
  output: string;
  status: PlaygroundRunStatus;
  xpAwarded: number;
  createdAt: string;
};