/**
 * Motor do Adventure: liga o interpretador PythonLite ao tabuleiro.
 *
 * O código do aluno roda inteiro, sem animação, contra o estado do mapa. O
 * resultado é uma lista de passos (cada um com a linha que o gerou) que a tela
 * só reproduz. As regras de movimento, moeda e inimigo são as mesmas de
 * adventure.logic (applyCommand), então nada muda no que a API define.
 */
import type { AdventureMission, AdventurePosition } from '@/types/adventure';

import {
  applyCommand,
  BoardState,
  Command,
  getAvailableCommands,
  getNextPosition,
  GRID_SIZE,
  isInsideBoard,
  isSamePosition,
  manhattan,
  positionKey
} from '../adventure.logic';
import {
  CodeUsage,
  countCodeLines,
  HostObject,
  PyError,
  PyErrorKind,
  PyValue,
  runProgram
} from './pythonLite';

// ---------------------------------------------------------------------------
// Extras do mapa: baús de tesouro e a coruja (NPC)
// ---------------------------------------------------------------------------

export type MissionExtras = {
  /** Baús opcionais: abrir com hero.collect() rende moedas. */
  chests: AdventurePosition[];
  /** Coruja sábia: ocupa uma casa e conversa com hero.talk() quando o herói está ao lado. */
  npc: AdventurePosition | null;
};

const NO_EXTRAS: MissionExtras = { chests: [], npc: null };

function seedFrom(text: string) {
  let seed = 7;

  for (const char of text) {
    seed = (seed * 31 + char.charCodeAt(0)) % 2147483647;
  }

  return seed;
}

function shuffled<T>(items: T[], seed: number) {
  const result = [...items];
  let state = seed || 1;

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 48271) % 2147483647;
    const other = state % (index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }

  return result;
}

/** Casas alcançáveis a pé a partir do início (ignora a regra do inimigo). */
function reachableCells(mission: AdventureMission, blocked: Set<string>) {
  const seen = new Set([positionKey(mission.startPosition)]);
  const queue = [mission.startPosition];

  for (let head = 0; head < queue.length; head += 1) {
    for (const command of ['moveRight', 'moveLeft', 'moveUp', 'moveDown'] as Command[]) {
      const next = getNextPosition(queue[head], command);
      const key = positionKey(next);

      if (isInsideBoard(next) && !blocked.has(key) && !seen.has(key)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }

  return seen;
}

function wallSet(mission: AdventureMission, extra: AdventurePosition[] = []) {
  return new Set([...(mission.walls ?? []), ...extra].map(positionKey));
}

/**
 * Baús e coruja de cada fase. São escolhidos de forma fixa a partir do id da
 * fase (a API não muda) e nunca tornam a fase impossível: a coruja só entra
 * numa casa que mantém a fase com solução.
 */
export function getMissionExtras(mission: AdventureMission, missionIndex: number): MissionExtras {
  if (missionIndex < 1) {
    // A primeira fase é o tutorial: mapa limpo.
    return NO_EXTRAS;
  }

  const seed = seedFrom(mission.id);
  const special = new Set(
    [mission.startPosition, mission.coinPosition, mission.enemyPosition, mission.goalPosition].map(positionKey)
  );
  const baseReachable = reachableCells(mission, wallSet(mission));
  const candidates = shuffled(
    [...baseReachable].filter((key) => !special.has(key)),
    seed
  ).map((key) => {
    const [row, col] = key.split(':').map(Number);
    return { row, col };
  });

  let npc: AdventurePosition | null = null;

  if (missionIndex % 3 === 2) {
    npc =
      candidates.find(
        (cell) => findCommandPath({ ...mission, walls: [...(mission.walls ?? []), cell] }, null) !== null
      ) ?? null;
  }

  const reachable = reachableCells(mission, wallSet(mission, npc ? [npc] : []));
  const chestCount = missionIndex >= 5 ? 2 : 1;
  const chests = candidates
    .filter((cell) => reachable.has(positionKey(cell)) && !(npc && isSamePosition(cell, npc)))
    .slice(0, chestCount);

  return { chests, npc };
}

/** Todas as casas ocupadas por algo (para os enfeites não ficarem em cima). */
export function getExtraCells(extras: MissionExtras) {
  return [...extras.chests, ...(extras.npc ? [extras.npc] : [])];
}

// ---------------------------------------------------------------------------
// Caminho mais curto (para dicas e para validar a coruja)
// ---------------------------------------------------------------------------

const INITIAL_STATE = (mission: AdventureMission): BoardState => ({
  position: mission.startPosition,
  coinCollected: false,
  bugDefeated: false
});

/**
 * Menor sequência de comandos que vence a fase a partir de `from` (busca em
 * largura). Retorna null se não houver solução.
 */
export function findCommandPath(mission: AdventureMission, from: BoardState | null): Command[] | null {
  const walls = wallSet(mission);
  const allowed = getAvailableCommands(mission);
  const start = from ?? INITIAL_STATE(mission);
  const keyOf = (state: BoardState) =>
    `${positionKey(state.position)}:${state.coinCollected ? 1 : 0}:${state.bugDefeated ? 1 : 0}`;
  const queue: { state: BoardState; path: Command[] }[] = [{ state: start, path: [] }];
  const visited = new Set([keyOf(start)]);

  for (let head = 0; head < queue.length; head += 1) {
    const { state, path } = queue[head];

    if (
      state.coinCollected &&
      state.bugDefeated &&
      isSamePosition(state.position, mission.goalPosition)
    ) {
      return path;
    }

    for (const command of allowed) {
      const outcome = applyCommand(mission, walls, state, command);

      if (outcome.ok && !visited.has(keyOf(outcome.state))) {
        visited.add(keyOf(outcome.state));
        queue.push({ state: outcome.state, path: [...path, command] });
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Execução do código
// ---------------------------------------------------------------------------

export type RunEffect = 'move' | 'collect' | 'attack' | 'chest' | 'talk' | 'say';

export type RunStep = {
  index: number;
  /** Linha do código que gerou este passo (1 = primeira). */
  line: number;
  effect: RunEffect;
  from: AdventurePosition;
  to: AdventurePosition;
  /** Texto de hero.say() ou a fala da coruja. */
  text?: string;
  /** Qual baú foi aberto (índice em extras.chests). */
  chestIndex?: number;
};

export type RunError = {
  /** Linha do erro; null quando o código terminou sem cumprir os objetivos. */
  line: number | null;
  message: string;
  kind: PyErrorKind | 'goal';
  /** Casa contra a qual o herói esbarrou (parede, borda ou coruja). */
  bumpToward?: AdventurePosition;
};

export type RunState = BoardState & {
  chestsOpened: boolean[];
  talked: boolean;
};

export type RunResult = {
  steps: RunStep[];
  error: RunError | null;
  /** Saída dos print(). */
  output: string[];
  usage: CodeUsage | null;
  codeLines: number;
  /** Estado do tabuleiro no fim (ou no ponto do erro). */
  state: RunState;
  won: boolean;
};

const MAX_ACTIONS = 150;

const DIRECTIONS: Record<string, Command> = {
  right: 'moveRight',
  left: 'moveLeft',
  up: 'moveUp',
  down: 'moveDown',
  direita: 'moveRight',
  esquerda: 'moveLeft',
  cima: 'moveUp',
  baixo: 'moveDown'
};

const OWL_FACTS = [
  'Em Python, o recuo (4 espaços) diz o que está dentro do bloco.',
  'for i in range(3): repete o bloco 3 vezes. Menos linhas, mesmo caminho.',
  'while repete enquanto a condição for verdadeira. Cuide para ela mudar!',
  'Uma função (def) guarda comandos com um nome para você reutilizar.',
  'if só executa o bloco quando a condição é verdadeira.',
  'Variáveis guardam valores: passos = 3 e depois hero.moveRight(passos).'
];

export function runAdventureCode(
  mission: AdventureMission,
  extras: MissionExtras,
  code: string
): RunResult {
  const walls = wallSet(mission);
  const allowed = new Set(getAvailableCommands(mission));
  const steps: RunStep[] = [];
  const output: string[] = [];
  const state: RunState = {
    ...INITIAL_STATE(mission),
    chestsOpened: extras.chests.map(() => false),
    talked: false
  };

  const push = (line: number, effect: RunEffect, from: AdventurePosition, extra: Partial<RunStep> = {}) => {
    if (steps.length >= MAX_ACTIONS) {
      throw new PyError(
        `O herói já fez ${MAX_ACTIONS} ações e cansou. Confira se algum loop está repetindo demais.`,
        line,
        'limit'
      );
    }

    steps.push({ index: steps.length, line, effect, from, to: state.position, ...extra });
  };

  const requireAllowed = (command: Command, line: number) => {
    if (!allowed.has(command)) {
      throw new PyError(
        `Nesta fase o comando ${command}() está bloqueado. Encontre outro caminho.`,
        line,
        'game'
      );
    }
  };

  const act = (command: Command, line: number) => {
    requireAllowed(command, line);
    const from = state.position;
    const next = getNextPosition(from, command);

    if (extras.npc && command.startsWith('move') && isSamePosition(next, extras.npc)) {
      throw new PyError('A coruja está nessa casa. Dê a volta (ou converse com ela: hero.talk()).', line, 'game', next);
    }

    const outcome = applyCommand(mission, walls, state, command);

    if (!outcome.ok) {
      throw new PyError(outcome.message, line, 'game', outcome.bumpToward);
    }

    Object.assign(state, outcome.state);
    push(line, command.startsWith('move') ? 'move' : command === 'collect' ? 'collect' : 'attack', from);
  };

  const move = (command: Command) => (args: PyValue[], line: number) => {
    const times = args.length === 0 ? 1 : args[0];

    if (typeof times !== 'number' || !Number.isInteger(times) || times < 0) {
      throw new PyError(
        `${command}() aceita um número inteiro de passos, como ${command}(3).`,
        line
      );
    }

    for (let count = 0; count < times; count += 1) {
      act(command, line);
    }

    return null;
  };

  const direction = (args: PyValue[], line: number, method: string): Command => {
    const value = args[0];
    const command = typeof value === 'string' ? DIRECTIONS[value.toLowerCase()] : undefined;

    if (!command) {
      throw new PyError(
        `${method}() precisa de uma direção entre aspas: "right", "left", "up" ou "down".`,
        line
      );
    }

    return command;
  };

  const canMove = (command: Command) => {
    const next = getNextPosition(state.position, command);

    if (extras.npc && isSamePosition(next, extras.npc)) {
      return false;
    }

    return allowed.has(command) && applyCommand(mission, walls, state, command).ok;
  };

  const chestHere = () =>
    extras.chests.findIndex(
      (chest, index) => !state.chestsOpened[index] && isSamePosition(chest, state.position)
    );
  const enemyAlive = () => !state.bugDefeated;

  const hero: HostObject = {
    kind: 'host',
    name: 'hero',
    methods: {
      moveRight: move('moveRight'),
      moveLeft: move('moveLeft'),
      moveUp: move('moveUp'),
      moveDown: move('moveDown'),
      move: (args, line) => {
        act(direction(args, line, 'hero.move'), line);
        return null;
      },
      collect: (_args, line) => {
        const chestIndex = chestHere();

        if (chestIndex >= 0) {
          requireAllowed('collect', line);
          state.chestsOpened[chestIndex] = true;
          push(line, 'chest', state.position, { chestIndex });
          return null;
        }

        act('collect', line);
        return null;
      },
      attack: (_args, line) => {
        act('attack', line);
        return null;
      },
      talk: (_args, line) => {
        if (!extras.npc || manhattan(state.position, extras.npc) !== 1) {
          throw new PyError(
            extras.npc
              ? 'A coruja está longe. Chegue a uma casa ao lado dela antes de hero.talk().'
              : 'Não há ninguém nesta fase para conversar.',
            line,
            'game'
          );
        }

        state.talked = true;
        push(line, 'talk', state.position, {
          text: OWL_FACTS[seedFrom(mission.id) % OWL_FACTS.length]
        });
        return null;
      },
      say: (args, line) => {
        push(line, 'say', state.position, {
          text: args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ').slice(0, 40)
        });
        return null;
      },
      // Sensores: deixam o código decidir com if/while em vez de contar casas.
      canMove: (args, line) => canMove(direction(args, line, 'hero.canMove')),
      onCoin: () => !state.coinCollected && isSamePosition(state.position, mission.coinPosition),
      onChest: () => chestHere() >= 0,
      hasCoin: () => state.coinCollected,
      enemyHere: () => enemyAlive() && isSamePosition(state.position, mission.enemyPosition),
      enemyNear: () => enemyAlive() && manhattan(state.position, mission.enemyPosition) <= 1,
      enemyDefeated: () => state.bugDefeated,
      atPortal: () => isSamePosition(state.position, mission.goalPosition),
      owlNear: () => Boolean(extras.npc) && manhattan(state.position, extras.npc!) === 1
    },
    getters: {
      x: () => state.position.col,
      y: () => state.position.row,
      col: () => state.position.col,
      row: () => state.position.row
    }
  };

  let usage: CodeUsage | null = null;
  let error: RunError | null = null;

  try {
    usage = runProgram(code, {
      globals: { hero },
      onPrint: (text) => {
        if (output.length < 20) {
          output.push(text);
        }
      }
    }).usage;
  } catch (caught) {
    if (!(caught instanceof PyError)) {
      throw caught;
    }

    error = {
      line: caught.line,
      message: caught.message,
      kind: caught.kind,
      bumpToward: caught.detail as AdventurePosition | undefined
    };
  }

  const codeLines = countCodeLines(code);

  if (!error) {
    // Todas as linhas rodaram: confere os objetivos da fase.
    if (steps.length === 0) {
      error = {
        line: null,
        kind: 'goal',
        message:
          codeLines === 0
            ? 'Escreva pelo menos um comando, como hero.moveRight().'
            : 'O código rodou, mas o herói não fez nenhuma ação. Chame um comando, como hero.moveRight().'
      };
    } else if (!isSamePosition(state.position, mission.goalPosition)) {
      error = { line: null, kind: 'goal', message: 'O código terminou, mas o herói não chegou ao portal.' };
    } else if (!state.coinCollected) {
      error = { line: null, kind: 'goal', message: 'Você chegou ao portal, mas esqueceu a moeda.' };
    } else if (!state.bugDefeated) {
      error = { line: null, kind: 'goal', message: 'Você chegou ao portal, mas não derrotou o inimigo.' };
    }
  }

  return { steps, error, output, usage, codeLines, state, won: error === null };
}

// ---------------------------------------------------------------------------
// Dicas progressivas (3 níveis) e avaliação do código
// ---------------------------------------------------------------------------

export type Hint = { text: string; target?: AdventurePosition; level: 1 | 2 | 3 };

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

/** Maior sequência de linhas iguais e seguidas com um mesmo comando (ex.: 3x hero.moveRight()). */
export function findRepeatedCommand(code: string): { command: string; count: number } | null {
  let best: { command: string; count: number } | null = null;
  let previous = '';
  let count = 0;

  for (const raw of code.split('\n')) {
    const line = raw.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    if (line === previous && /^hero\.\w+\(\)$/.test(line)) {
      count += 1;
    } else {
      previous = line;
      count = 1;
    }

    if (count >= 3 && (!best || count > best.count)) {
      best = { command: line, count };
    }
  }

  return best;
}

const ERROR_LESSONS: { test: RegExp; lesson: string }[] = [
  {
    test: /Faltou ":"/,
    lesson: 'Linhas de if, for, while e def sempre terminam com dois-pontos. Exemplo: for i in range(3):'
  },
  {
    test: /recuo|Recuo|bloco/,
    lesson: 'O recuo marca o que está dentro do bloco. Use 4 espaços a mais nas linhas de dentro e volte ao recuo anterior quando o bloco acabar.'
  },
  {
    test: /parênteses/,
    lesson: 'Um comando só é executado com parênteses no fim: hero.moveRight(). Sem eles, o Python só olha para o comando e não faz nada.'
  },
  {
    test: /não existe|não tem "/,
    lesson: 'O Python diferencia maiúsculas de minúsculas e não perdoa letra trocada: moveRight é diferente de moveright.'
  },
  {
    test: /loop infinito|ações e cansou/,
    lesson: 'Um while precisa de algo dentro dele que mude a condição. Em while hero.canMove("right"):, mova o herói para a direita dentro do bloco.'
  },
  { test: /"=="/, lesson: 'Um sinal (=) guarda um valor na variável. Dois sinais (==) perguntam se dois valores são iguais.' },
  {
    test: /parede|sair do mapa|coruja está nessa casa/,
    lesson: 'Antes de andar, você pode perguntar se o caminho está livre: if hero.canMove("right"): e o movimento recuado embaixo.'
  },
  {
    test: /Derrote|protegendo/,
    lesson: 'Ao entrar na casa do inimigo, use hero.attack() antes de qualquer outro comando.'
  }
];

/**
 * Dica do ajudante, em três níveis para não entregar a solução de cara:
 * 1. onde fica o próximo objetivo; 2. o conceito de Python que ajuda;
 * 3. só os dois próximos comandos do caminho.
 */
export function getHint(
  mission: AdventureMission,
  extras: MissionExtras,
  code: string,
  level: 1 | 2 | 3,
  enemySubject = 'o bug'
): Hint {
  const result = runAdventureCode(mission, extras, code);
  const { state, error } = result;
  const errorLine = error?.line ?? null;
  const prefix = errorLine !== null ? `Linha ${errorLine}: ${error!.message} ` : '';

  // Próximo objetivo a partir de onde o herói para.
  const goals: { at: AdventurePosition; name: string; action: string }[] = [];

  if (!state.bugDefeated) {
    goals.push({ at: mission.enemyPosition, name: enemySubject, action: 'hero.attack()' });
  }

  if (
    !state.coinCollected &&
    (state.bugDefeated || !isSamePosition(mission.coinPosition, mission.enemyPosition))
  ) {
    goals.push({ at: mission.coinPosition, name: 'a moeda', action: 'hero.collect()' });
  }

  const next =
    goals.length > 0
      ? goals.reduce((best, goal) =>
          manhattan(state.position, goal.at) < manhattan(state.position, best.at) ? goal : best
        )
      : { at: mission.goalPosition, name: 'o portal', action: '' };
  const target = error?.bumpToward && isInsideBoard(error.bumpToward) ? error.bumpToward : next.at;

  if (result.won) {
    const repeated = findRepeatedCommand(code);
    return {
      level,
      text: repeated
        ? `Esse código já vence a fase. Desafio: troque as ${repeated.count} linhas de ${repeated.command} por um for.`
        : 'Esse código já vence a fase. Toque em Executar!'
    };
  }

  if (level === 1) {
    if (errorLine !== null) {
      return { level, target, text: `${prefix}Toque em mim de novo para entender o motivo.` };
    }

    return {
      level,
      target,
      text: isSamePosition(state.position, next.at)
        ? `O herói está na casa d${next.name}. ${next.action ? `Use ${next.action}.` : ''}`
        : `Próximo objetivo: ${next.name} está ${describeOffset(state.position, next.at)} de onde o herói para.`
    };
  }

  if (level === 2) {
    if (error && errorLine !== null) {
      const lesson = ERROR_LESSONS.find((item) => item.test.test(error.message));
      return { level, target, text: lesson ? lesson.lesson : `${prefix}Leia a linha com calma e compare com um comando que já funcionou.` };
    }

    const repeated = findRepeatedCommand(code);

    if (repeated) {
      return {
        level,
        target,
        text: `Você repetiu ${repeated.command} ${repeated.count} vezes. Tente: for i in range(${repeated.count}): e o comando recuado na linha de baixo.`
      };
    }

    return {
      level,
      target,
      text:
        extras.chests.length > 0 && state.chestsOpened.includes(false)
          ? 'Há um baú no mapa: pare em cima dele e use hero.collect() para ganhar moedas. Sensores como hero.canMove("down") ajudam a decidir o caminho.'
          : 'Em vez de contar casas, pergunte ao herói: while hero.canMove("down"): com hero.moveDown() recuado embaixo anda até encontrar um obstáculo.'
    };
  }

  // Nível 3: só os próximos dois comandos, a partir do ponto em que o herói para.
  const blocked = extras.npc ? [extras.npc] : [];
  const path = findCommandPath({ ...mission, walls: [...(mission.walls ?? []), ...blocked] }, state);

  if (!path || path.length === 0) {
    return {
      level,
      target,
      text: 'Daqui o herói não consegue mais vencer. Apague as últimas linhas e tente outro caminho.'
    };
  }

  const nextSteps = path.slice(0, 2).map((command) => `hero.${command}()`);

  return {
    level,
    target,
    text: `${errorLine !== null ? `Corrija a linha ${errorLine}. ` : ''}Depois de onde o herói para, continue com ${nextSteps.join(' e depois ')}. O resto é com você!`
  };
}

/** Comentários sobre o código vencedor: o que foi bem e o que dá para melhorar. */
export function reviewCode(code: string, result: RunResult, optimalLines: number | null): string[] {
  const notes: string[] = [];
  const usage = result.usage;
  const repeated = findRepeatedCommand(code);

  if (usage?.functions) {
    notes.push('Você criou uma função: é assim que programas grandes ficam organizados.');
  } else if (usage?.loops) {
    notes.push('Você usou repetição em vez de copiar linhas. Código de gente grande!');
  }

  if (usage?.conditionals) {
    notes.push('Seu código toma decisões com if: ele funcionaria até se o mapa mudasse um pouco.');
  }

  if (repeated && !usage?.loops) {
    notes.push(
      `Dá para encurtar: ${repeated.command} aparece ${repeated.count} vezes seguidas. Um for i in range(${repeated.count}): faz o mesmo.`
    );
  } else if (optimalLines !== null && result.codeLines > optimalLines && !usage?.loops) {
    notes.push('Existe um caminho com menos linhas. Tente de novo para ganhar 3 estrelas.');
  }

  if (notes.length === 0) {
    notes.push('Código direto e correto. Na próxima, experimente um for para repetir movimentos.');
  }

  return notes;
}

// ---------------------------------------------------------------------------
// Edição: inserir uma linha de código na posição do cursor
// ---------------------------------------------------------------------------

/**
 * Insere `text` como uma nova linha logo abaixo da linha do cursor, com o
 * recuo certo: um nível a mais se a linha atual abre um bloco (termina com
 * ":"), senão o mesmo recuo dela. Retorna o novo código e a posição do cursor.
 */
export function insertCodeLine(code: string, cursor: number, text: string) {
  const position = Math.max(0, Math.min(cursor, code.length));
  const lineStart = code.lastIndexOf('\n', position - 1) + 1;
  const lineEndIndex = code.indexOf('\n', position);
  const lineEnd = lineEndIndex === -1 ? code.length : lineEndIndex;
  const currentLine = code.slice(lineStart, lineEnd);
  const indent = /^ */.exec(currentLine)![0];

  if (currentLine.trim() === '') {
    // Linha vazia: escreve nela mesma, mantendo o recuo.
    const inserted = `${indent}${text}`;
    const next = code.slice(0, lineStart) + inserted + code.slice(lineEnd);
    return { code: next, cursor: lineStart + inserted.length };
  }

  const opensBlock = currentLine.trimEnd().endsWith(':');
  const inserted = `\n${indent}${opensBlock ? '    ' : ''}${text}`;
  const next = code.slice(0, lineEnd) + inserted + code.slice(lineEnd);

  return { code: next, cursor: lineEnd + inserted.length };
}

/** Código inicial da fase, pronto para o editor. */
export function getInitialCode(mission: AdventureMission) {
  return (mission.initialCode ?? '').replace(/\r\n?/g, '\n').trimEnd();
}

export { GRID_SIZE };
