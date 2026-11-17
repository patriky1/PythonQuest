/**
 * Progresso próprio do Adventure, guardado no aparelho por usuário:
 * moedas, recordes por fase, conquistas e o código salvo de cada fase.
 * (XP, medalhas e fases concluídas continuam no progresso geral, via API.)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { CodeUsage } from '@/features/adventure/engine/pythonLite';

export type PhaseRecord = {
  stars: number;
  /** Menor número de linhas de código com que a fase foi vencida. */
  lines: number;
  /** Menor número de ações do herói. */
  actions: number;
  wins: number;
};

export type AdventureProfile = {
  coins: number;
  records: Record<string, PhaseRecord>;
  achievements: string[];
  /** Último código escrito em cada fase, para continuar de onde parou. */
  savedCode: Record<string, string>;
  /** Baús já abertos (fase:índice), para as moedas não serem pagas duas vezes. */
  openedChests: string[];
};

export const EMPTY_PROFILE: AdventureProfile = {
  coins: 0,
  records: {},
  achievements: [],
  savedCode: {},
  openedChests: []
};

const keyFor = (owner: string) => `@pythonquest:adventure-profile:${owner}`;

export async function loadAdventureProfile(owner: string): Promise<AdventureProfile> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(owner));
    return raw ? { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<AdventureProfile>) } : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function saveAdventureProfile(owner: string, profile: AdventureProfile) {
  try {
    await AsyncStorage.setItem(keyFor(owner), JSON.stringify(profile));
  } catch {
    // Sem espaço ou sem permissão: o jogo continua, só não salva.
  }
}

// ---------------------------------------------------------------------------
// Conquistas
// ---------------------------------------------------------------------------

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', title: 'Primeiro portal', description: 'Vença uma fase.', icon: 'flag' },
  { id: 'loop', title: 'Mestre da repetição', description: 'Vença usando for ou while.', icon: 'repeat' },
  { id: 'condition', title: 'Decisão certa', description: 'Vença usando if.', icon: 'git-branch' },
  { id: 'function', title: 'Criador de funções', description: 'Vença usando def.', icon: 'cube' },
  { id: 'variable', title: 'Memória boa', description: 'Vença usando uma variável.', icon: 'file-tray' },
  { id: 'three-stars', title: 'Código enxuto', description: 'Ganhe 3 estrelas numa fase.', icon: 'star' },
  { id: 'flawless', title: 'De primeira', description: 'Vença sem perder nenhuma vida.', icon: 'heart' },
  { id: 'treasure', title: 'Caçador de tesouros', description: 'Abra um baú.', icon: 'cube-outline' },
  { id: 'owl', title: 'Amigo da coruja', description: 'Converse com a coruja.', icon: 'chatbubbles' },
  { id: 'five-phases', title: 'Aventureiro', description: 'Vença 5 fases.', icon: 'map' },
  { id: 'all-stars-5', title: 'Colecionador', description: 'Some 15 estrelas.', icon: 'sparkles' }
];

export type WinSummary = {
  missionId: string;
  stars: number;
  lines: number;
  actions: number;
  usage: CodeUsage | null;
  livesLost: number;
  /** Índices dos baús abertos nesta execução. */
  chestsOpened: number[];
  talkedToOwl: boolean;
};

export const COINS_PER_CHEST = 5;
export const COINS_PER_STAR = 2;
export const COINS_OWL = 3;

/**
 * Aplica uma vitória ao perfil: recordes, moedas e conquistas.
 * Retorna o novo perfil e o que foi ganho agora (para mostrar na tela).
 */
export function applyWin(profile: AdventureProfile, win: WinSummary) {
  const previous = profile.records[win.missionId];
  const record: PhaseRecord = {
    stars: Math.max(previous?.stars ?? 0, win.stars),
    lines: Math.min(previous?.lines ?? Infinity, win.lines),
    actions: Math.min(previous?.actions ?? Infinity, win.actions),
    wins: (previous?.wins ?? 0) + 1
  };

  // Moedas: estrelas novas (só a diferença para o recorde) + baús inéditos + coruja na 1ª vez.
  const newStars = Math.max(0, win.stars - (previous?.stars ?? 0));
  const newChests = win.chestsOpened
    .map((index) => `${win.missionId}:${index}`)
    .filter((key) => !profile.openedChests.includes(key));
  const owlKey = `${win.missionId}:owl`;
  const newOwl = win.talkedToOwl && !profile.openedChests.includes(owlKey);
  const coinsEarned =
    newStars * COINS_PER_STAR + newChests.length * COINS_PER_CHEST + (newOwl ? COINS_OWL : 0);

  const records = { ...profile.records, [win.missionId]: record };
  const totalStars = Object.values(records).reduce((sum, item) => sum + item.stars, 0);
  const earnedIds = [
    'first-win',
    win.usage?.loops && 'loop',
    win.usage?.conditionals && 'condition',
    win.usage?.functions && 'function',
    win.usage?.variables && 'variable',
    win.stars === 3 && 'three-stars',
    win.livesLost === 0 && 'flawless',
    win.chestsOpened.length > 0 && 'treasure',
    win.talkedToOwl && 'owl',
    Object.keys(records).length >= 5 && 'five-phases',
    totalStars >= 15 && 'all-stars-5'
  ].filter((id): id is string => typeof id === 'string');
  const newAchievements = earnedIds.filter((id) => !profile.achievements.includes(id));

  const next: AdventureProfile = {
    ...profile,
    coins: profile.coins + coinsEarned,
    records,
    achievements: [...profile.achievements, ...newAchievements],
    openedChests: [...profile.openedChests, ...newChests, ...(newOwl ? [owlKey] : [])]
  };

  return {
    profile: next,
    coinsEarned,
    newAchievements: ACHIEVEMENTS.filter((item) => newAchievements.includes(item.id)),
    isNewRecord: !previous || win.stars > previous.stars || win.lines < previous.lines
  };
}
