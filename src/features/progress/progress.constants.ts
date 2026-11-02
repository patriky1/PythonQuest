import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export const MAX_HEARTS = 5;

// Acerto mínimo (em %) para a missão contar como concluída e liberar a próxima.
export const MIN_ACCURACY_TO_PASS = 50;

export const ACCURACY_BONUS_XP = 10;

export const LEVEL_TITLES = [
  'Novato',
  'Aprendiz',
  'Explorador',
  'Programador',
  'Desenvolvedor',
  'Especialista',
  'Mestre Python'
];

export type BadgeMetric = 'lessons' | 'specialMissions' | 'xp' | 'streak';

export type BadgeDefinition = {
  id: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  metric: BadgeMetric;
  target: number;
};

// O id é o texto salvo no progresso do aluno (local e no servidor).
export const BADGES: BadgeDefinition[] = [
  {
    id: 'Primeira missão',
    description: 'Conclua sua primeira missão da trilha.',
    icon: 'flag',
    metric: 'lessons',
    target: 1
  },
  {
    id: 'Trilha aquecida',
    description: 'Conclua 3 missões da trilha.',
    icon: 'flame',
    metric: 'lessons',
    target: 3
  },
  {
    id: 'Explorador Python',
    description: 'Conclua 5 missões da trilha.',
    icon: 'compass',
    metric: 'lessons',
    target: 5
  },
  {
    id: 'Aventureiro do Código',
    description: 'Conclua 10 missões da trilha.',
    icon: 'rocket',
    metric: 'lessons',
    target: 10
  },
  {
    id: 'Herói PythonQuest',
    description: 'Vença sua primeira fase do Adventure.',
    icon: 'shield-checkmark',
    metric: 'specialMissions',
    target: 1
  },
  {
    id: 'Mestre Adventure',
    description: 'Vença 4 fases do Adventure.',
    icon: 'trophy',
    metric: 'specialMissions',
    target: 4
  },
  {
    id: '100 XP conquistados',
    description: 'Acumule 100 XP.',
    icon: 'flash',
    metric: 'xp',
    target: 100
  },
  {
    id: '300 XP conquistados',
    description: 'Acumule 300 XP.',
    icon: 'star',
    metric: 'xp',
    target: 300
  },
  {
    id: 'Três dias seguidos',
    description: 'Estude 3 dias seguidos.',
    icon: 'calendar',
    metric: 'streak',
    target: 3
  }
];
