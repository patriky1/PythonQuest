export type AdventurePosition = {
  row: number;
  col: number;
};

export type AdventureMission = {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  badge: string;
  startPosition: AdventurePosition;
  coinPosition: AdventurePosition;
  enemyPosition: AdventurePosition;
  goalPosition: AdventurePosition;
  walls: AdventurePosition[];
  initialCode: string;
  availableCommands: string[];
};

const commands = [
  'hero.moveRight()',
  'hero.moveLeft()',
  'hero.moveUp()',
  'hero.moveDown()',
  'hero.collect()',
  'hero.attack()'
];

export const PYTHONQUEST_ADVENTURE_MISSIONS: AdventureMission[] = [
  {
    id: 'pythonquest-adventure-01',
    title: 'Portal do Vale',
    subtitle:
      'Tutorial: use comandos simples para pegar a moeda, derrotar o bug e chegar ao portal.',
    xp: 40,
    badge: 'Portal do Vale',
    startPosition: { row: 0, col: 0 },
    coinPosition: { row: 1, col: 2 },
    enemyPosition: { row: 2, col: 3 },
    goalPosition: { row: 4, col: 4 },
    walls: [
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 2 }
    ],
    initialCode: `# Missão 1: Portal do Vale
# Esta primeira missão vem com o caminho completo.
# Execute para ver como o herói obedece aos comandos.

hero.moveRight()
hero.moveRight()
hero.moveDown()
hero.collect()
hero.moveRight()
hero.moveDown()
hero.attack()
hero.moveDown()
hero.moveDown()
hero.moveRight()`,
    availableCommands: commands
  },
  {
    id: 'pythonquest-adventure-02',
    title: 'Bug no Corredor',
    subtitle:
      'Agora é sua vez: colete a moeda no topo, desça pelo corredor e vença o bug.',
    xp: 45,
    badge: 'Bug no Corredor',
    startPosition: { row: 0, col: 0 },
    coinPosition: { row: 0, col: 3 },
    enemyPosition: { row: 2, col: 4 },
    goalPosition: { row: 4, col: 4 },
    walls: [
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 1 },
      { row: 3, col: 3 }
    ],
    initialCode: `# Missão 2: Bug no Corredor
# Objetivo:
# 1. Pegue a moeda no topo
# 2. Desça até o bug
# 3. Use hero.attack()
# 4. Chegue ao portal

hero.moveRight()
hero.moveRight()

# Continue o caminho...`,
    availableCommands: commands
  },
  {
    id: 'pythonquest-adventure-03',
    title: 'Labirinto da Moeda',
    subtitle:
      'Planeje a rota antes de executar. A solução não vem pronta nesta fase.',
    xp: 50,
    badge: 'Labirinto da Moeda',
    startPosition: { row: 4, col: 0 },
    coinPosition: { row: 2, col: 2 },
    enemyPosition: { row: 1, col: 4 },
    goalPosition: { row: 0, col: 4 },
    walls: [
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 4 }
    ],
    initialCode: `# Missão 3: Labirinto da Moeda
# Comece embaixo.
# Pegue a moeda, derrote o bug e vá ao portal.
# Escreva os comandos abaixo:

`,
    availableCommands: commands
  },
  {
    id: 'pythonquest-adventure-04',
    title: 'Rota do Depurador',
    subtitle:
      'Use o console para entender seus erros e ajustar o percurso.',
    xp: 55,
    badge: 'Rota do Depurador',
    startPosition: { row: 0, col: 4 },
    coinPosition: { row: 3, col: 4 },
    enemyPosition: { row: 4, col: 2 },
    goalPosition: { row: 4, col: 0 },
    walls: [
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 3, col: 2 }
    ],
    initialCode: `# Missão 4: Rota do Depurador
# Nesta fase, a rota é por sua conta.
# Leia o console quando errar.

`,
    availableCommands: commands
  }
];