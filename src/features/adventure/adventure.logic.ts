import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { AdventureMission, AdventurePosition } from '@/types/adventure';

export const GRID_SIZE = 5;

export type Command = 'moveRight' | 'moveLeft' | 'moveUp' | 'moveDown' | 'collect' | 'attack';

export const COMMAND_META: Record<
  Command,
  { label: string; icon: ComponentProps<typeof Ionicons>['name'] }
> = {
  moveRight: { label: 'Direita', icon: 'arrow-forward' },
  moveLeft: { label: 'Esquerda', icon: 'arrow-back' },
  moveUp: { label: 'Cima', icon: 'arrow-up' },
  moveDown: { label: 'Baixo', icon: 'arrow-down' },
  collect: { label: 'Coletar', icon: 'hand-left' },
  attack: { label: 'Atacar', icon: 'flash' }
};

const VALID_COMMANDS = Object.keys(COMMAND_META) as Command[];

export function isSamePosition(a: AdventurePosition, b: AdventurePosition) {
  return a.row === b.row && a.col === b.col;
}

export function isInsideBoard(position: AdventurePosition) {
  return (
    position.row >= 0 &&
    position.row < GRID_SIZE &&
    position.col >= 0 &&
    position.col < GRID_SIZE
  );
}

export function isMoveCommand(command: Command) {
  return command.startsWith('move');
}

export function commandToCodeLine(command: Command) {
  return `hero.${command}()`;
}

function parseCommands(code: string): Command[] {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const match = line.match(
        /^(hero\.)?(moveRight|moveLeft|moveUp|moveDown|collect|attack)\(\)$/
      );

      if (!match) {
        throw new Error(`Comando inválido: ${line}`);
      }

      return match[2] as Command;
    });
}

export function getInitialMissionCommands(mission: AdventureMission) {
  try {
    return parseCommands(mission.initialCode);
  } catch {
    return [];
  }
}

export function getAvailableCommands(mission: AdventureMission): Command[] {
  return mission.availableCommands
    .map((raw) => String(raw).replace('hero.', '').replace('()', '').trim())
    .filter((command): command is Command => VALID_COMMANDS.includes(command as Command));
}

export function getNextPosition(position: AdventurePosition, command: Command) {
  switch (command) {
    case 'moveRight':
      return { row: position.row, col: position.col + 1 };
    case 'moveLeft':
      return { row: position.row, col: position.col - 1 };
    case 'moveUp':
      return { row: position.row - 1, col: position.col };
    case 'moveDown':
      return { row: position.row + 1, col: position.col };
    default:
      return position;
  }
}
