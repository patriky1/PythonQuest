export type AdventurePosition = {
  row: number;
  col: number;
};

export type AdventureMission = {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  badge?: string;
  initialCode: string;
  availableCommands: string[];
  startPosition: AdventurePosition;
  coinPosition: AdventurePosition;
  enemyPosition: AdventurePosition;
  goalPosition: AdventurePosition;
  walls: AdventurePosition[];
};
