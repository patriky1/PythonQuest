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

export function positionKey(position: AdventurePosition) {
  return `${position.row}:${position.col}`;
}

export function getWallKeys(mission: AdventureMission) {
  return new Set((mission.walls ?? []).map(positionKey));
}

// ---------------------------------------------------------------------------
// Simulação: o tabuleiro é a fonte da verdade e é resolvido sem nenhuma
// animação. A tela só "reproduz" o resultado, então lógica e visual nunca
// ficam dessincronizados.
// ---------------------------------------------------------------------------

export type BoardState = {
  position: AdventurePosition;
  coinCollected: boolean;
  bugDefeated: boolean;
};

export type CommandOutcome =
  | { ok: true; state: BoardState }
  | { ok: false; message: string; bumpToward?: AdventurePosition };

export type SimulationStep = {
  index: number;
  command: Command;
  effect: 'move' | 'collect' | 'attack';
  from: AdventurePosition;
  to: AdventurePosition;
};

export type SimulationError = {
  index: number;
  message: string;
  /** Quadrado contra o qual o herói esbarrou (parede ou borda do mapa). */
  bumpToward?: AdventurePosition;
};

export type SimulationResult = {
  steps: SimulationStep[];
  error: SimulationError | null;
};

export function applyCommand(
  mission: AdventureMission,
  walls: Set<string>,
  state: BoardState,
  command: Command
): CommandOutcome {
  if (isMoveCommand(command)) {
    if (!state.bugDefeated && isSamePosition(state.position, mission.enemyPosition)) {
      return { ok: false, message: 'Derrote o bug antes de sair desse quadrado.' };
    }

    const next = getNextPosition(state.position, command);

    if (!isInsideBoard(next)) {
      return { ok: false, message: 'O herói tentou sair do mapa.', bumpToward: next };
    }

    if (walls.has(positionKey(next))) {
      return { ok: false, message: 'O herói bateu em uma parede.', bumpToward: next };
    }

    return { ok: true, state: { ...state, position: next } };
  }

  if (command === 'collect') {
    if (state.coinCollected) {
      return { ok: false, message: 'A moeda já foi coletada.' };
    }

    if (!isSamePosition(state.position, mission.coinPosition)) {
      return { ok: false, message: 'Não há moeda neste quadrado.' };
    }

    // Se a moeda estiver na casa do bug, ele a protege até ser derrotado.
    if (!state.bugDefeated && isSamePosition(state.position, mission.enemyPosition)) {
      return { ok: false, message: 'O bug está protegendo a moeda. Derrote-o primeiro.' };
    }

    return { ok: true, state: { ...state, coinCollected: true } };
  }

  if (state.bugDefeated) {
    return { ok: false, message: 'O bug já foi derrotado.' };
  }

  if (!isSamePosition(state.position, mission.enemyPosition)) {
    return { ok: false, message: 'Não há bug neste quadrado.' };
  }

  return { ok: true, state: { ...state, bugDefeated: true } };
}

export function isWinningState(mission: AdventureMission, state: BoardState) {
  return (
    state.coinCollected &&
    state.bugDefeated &&
    isSamePosition(state.position, mission.goalPosition)
  );
}

export function simulateProgram(
  mission: AdventureMission,
  commands: Command[]
): SimulationResult {
  const walls = getWallKeys(mission);
  const steps: SimulationStep[] = [];
  let state: BoardState = {
    position: mission.startPosition,
    coinCollected: false,
    bugDefeated: false
  };

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    const outcome = applyCommand(mission, walls, state, command);

    if (!outcome.ok) {
      return {
        steps,
        error: { index, message: outcome.message, bumpToward: outcome.bumpToward }
      };
    }

    steps.push({
      index,
      command,
      effect: isMoveCommand(command) ? 'move' : command === 'collect' ? 'collect' : 'attack',
      from: state.position,
      to: outcome.state.position
    });
    state = outcome.state;
  }

  // Erros de fim de programa não pertencem a nenhuma linha: todas rodaram
  // certo, faltou algo. O índice fica "depois do fim" para a tela não
  // marcar a última linha como errada.
  const endIndex = commands.length;

  if (!isSamePosition(state.position, mission.goalPosition)) {
    return {
      steps,
      error: { index: endIndex, message: 'O código terminou, mas o herói não chegou ao portal.' }
    };
  }

  if (!state.coinCollected) {
    return {
      steps,
      error: { index: endIndex, message: 'Você chegou ao portal, mas esqueceu a moeda.' }
    };
  }

  if (!state.bugDefeated) {
    return {
      steps,
      error: { index: endIndex, message: 'Você chegou ao portal, mas não derrotou o bug.' }
    };
  }

  return { steps, error: null };
}

/**
 * Menor número de linhas que resolve a fase (busca em largura sobre
 * posição + moeda + bug). Retorna null se a fase não tiver solução com os
 * comandos disponíveis.
 */
export function findShortestSolutionLength(
  mission: AdventureMission,
  availableCommands: Command[]
): number | null {
  const walls = getWallKeys(mission);
  const start: BoardState = {
    position: mission.startPosition,
    coinCollected: false,
    bugDefeated: false
  };
  const keyOf = (state: BoardState) =>
    `${positionKey(state.position)}:${state.coinCollected ? 1 : 0}:${state.bugDefeated ? 1 : 0}`;

  const queue: { state: BoardState; depth: number }[] = [{ state: start, depth: 0 }];
  const visited = new Set([keyOf(start)]);

  for (let head = 0; head < queue.length; head += 1) {
    const { state, depth } = queue[head];

    if (isWinningState(mission, state)) {
      return depth;
    }

    for (const command of availableCommands) {
      const outcome = applyCommand(mission, walls, state, command);

      if (!outcome.ok) {
        continue;
      }

      const key = keyOf(outcome.state);

      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: outcome.state, depth: depth + 1 });
      }
    }
  }

  return null;
}

export type MissionValidation = {
  /** Problemas que deixam a fase impossível ou quebrada; a fase não deve ser jogada. */
  errors: string[];
  /** Problemas que não impedem o jogo (ex.: código inicial ignorado). */
  warnings: string[];
};

/**
 * Confere os dados de uma fase vinda do backend: posições dentro do mapa,
 * paredes fora dos objetos e existência de solução com os comandos liberados.
 */
export function validateMission(mission: AdventureMission): MissionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const points: [string, AdventurePosition | undefined][] = [
    ['início', mission.startPosition],
    ['moeda', mission.coinPosition],
    ['bug', mission.enemyPosition],
    ['portal', mission.goalPosition]
  ];

  for (const [name, position] of points) {
    if (!position || !isInsideBoard(position)) {
      errors.push(`Posição de ${name} fora do mapa.`);
    }
  }

  for (const wall of mission.walls ?? []) {
    if (!isInsideBoard(wall)) {
      warnings.push(`Parede fora do mapa em ${positionKey(wall)}.`);
    }
  }

  const walls = getWallKeys(mission);

  for (const [name, position] of points) {
    if (position && walls.has(positionKey(position))) {
      errors.push(`Há uma parede em cima de ${name}.`);
    }
  }

  if (errors.length === 0 && findShortestSolutionLength(mission, getAvailableCommands(mission)) === null) {
    errors.push('A fase não tem solução com os comandos disponíveis.');
  }

  try {
    parseCommands(mission.initialCode ?? '');
  } catch (error) {
    warnings.push(
      `Código inicial ignorado (${error instanceof Error ? error.message : 'formato inválido'}).`
    );
  }

  return { errors, warnings };
}

function describeOffset(from: AdventurePosition, to: AdventurePosition) {
  const parts: string[] = [];
  const dx = to.col - from.col;
  const dy = to.row - from.row;

  if (dx !== 0) {
    const n = Math.abs(dx);
    parts.push(`${n} ${n === 1 ? 'casa' : 'casas'} para a ${dx > 0 ? 'direita' : 'esquerda'}`);
  }

  if (dy !== 0) {
    const n = Math.abs(dy);
    parts.push(`${n} ${n === 1 ? 'casa' : 'casas'} para ${dy > 0 ? 'baixo' : 'cima'}`);
  }

  return parts.join(' e ');
}

export function manhattan(a: AdventurePosition, b: AdventurePosition) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export type ProgramHint = {
  text: string;
  /** Casa para destacar no tabuleiro (o próximo objetivo), quando houver. */
  target?: AdventurePosition;
};

/**
 * Dica do ajudante: olha onde o programa atual deixa o herói e aponta o
 * próximo objetivo. `enemySubject` é o nome do inimigo com artigo ("a gosma").
 */
export function getProgramHint(
  mission: AdventureMission,
  commands: Command[],
  enemySubject = 'o bug'
): ProgramHint {
  const { steps, error } = simulateProgram(mission, commands);

  if (error && error.index < commands.length) {
    return {
      text: `A linha ${error.index + 1} vai dar problema: ${error.message}`,
      target: error.bumpToward && isInsideBoard(error.bumpToward) ? error.bumpToward : undefined
    };
  }

  let position = mission.startPosition;
  let coin = false;
  let enemy = false;

  for (const step of steps) {
    position = step.to;
    coin = coin || step.effect === 'collect';
    enemy = enemy || step.effect === 'attack';
  }

  const prefix = commands.length > 0 ? 'No fim do seu código, o herói' : 'O herói';
  const goals: { at: AdventurePosition; name: string; action: string }[] = [];

  if (!enemy) {
    goals.push({ at: mission.enemyPosition, name: enemySubject, action: 'attack()' });
  }

  // A moeda na casa do inimigo só sai depois do ataque.
  if (!coin && (enemy || !isSamePosition(mission.coinPosition, mission.enemyPosition))) {
    goals.push({ at: mission.coinPosition, name: 'a moeda', action: 'collect()' });
  }

  if (goals.length > 0) {
    const next = goals.reduce((best, goal) =>
      manhattan(position, goal.at) < manhattan(position, best.at) ? goal : best
    );

    if (isSamePosition(position, next.at)) {
      return {
        text: `${prefix} está na casa d${next.name}. Use ${next.action}.`,
        target: next.at
      };
    }

    const walls = (mission.walls ?? []).length > 0 ? ' Desvie das paredes.' : '';
    return {
      text: `Próximo objetivo: ${next.name} está ${describeOffset(position, next.at)}.${walls}`,
      target: next.at
    };
  }

  if (!isSamePosition(position, mission.goalPosition)) {
    return {
      text: `Falta pouco! O portal está ${describeOffset(position, mission.goalPosition)}.`,
      target: mission.goalPosition
    };
  }

  return { text: 'Esse programa resolve a fase. Toque em Executar!' };
}

/**
 * Casas livres para enfeites (flores): não ocupadas por início, moeda,
 * inimigo, portal ou parede. A escolha é fixa por fase, para o cenário não
 * mudar a cada renderização.
 */
export function getDecorCells(mission: AdventureMission, max = 3): AdventurePosition[] {
  const taken = getWallKeys(mission);

  for (const position of [
    mission.startPosition,
    mission.coinPosition,
    mission.enemyPosition,
    mission.goalPosition
  ]) {
    taken.add(positionKey(position));
  }

  const free: AdventurePosition[] = [];

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!taken.has(positionKey({ row, col }))) {
        free.push({ row, col });
      }
    }
  }

  if (free.length === 0) {
    return [];
  }

  // Semente simples a partir do id da fase.
  let seed = 0;
  for (const char of mission.id) {
    seed = (seed * 31 + char.charCodeAt(0)) % 9973;
  }

  const picked: AdventurePosition[] = [];
  const step = Math.max(1, Math.floor(free.length / max));

  for (let index = 0; index < max && index * step < free.length; index += 1) {
    picked.push(free[(seed + index * step + index * 2) % free.length]);
  }

  // Remove repetidas (casas iguais por coincidência do módulo).
  return picked.filter(
    (cell, index) => picked.findIndex((other) => isSamePosition(other, cell)) === index
  );
}

/** 3 estrelas na solução ótima, 2 até duas linhas a mais, 1 no resto. */
export function getStarRating(linesUsed: number, optimal: number | null) {
  if (optimal === null || linesUsed <= optimal) {
    return 3;
  }

  return linesUsed <= optimal + 2 ? 2 : 1;
}
