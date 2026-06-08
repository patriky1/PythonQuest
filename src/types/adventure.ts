export type AdventurePosition = {
  row: number;
  col: number;
};

export type AdventureCommand =
  | 'moveRight'
  | 'moveLeft'
  | 'moveUp'
  | 'moveDown'
  | 'collect'
  | 'attack';

export type AdventureMission = {
  id: string;
  title: string;
  description: string;
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