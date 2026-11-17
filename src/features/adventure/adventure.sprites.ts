import type { ImageSourcePropType } from 'react-native';

import type { SpriteClip, SpriteSheet } from '@/features/adventure/AnimatedSprite';
import type { AdventurePosition } from '@/types/adventure';

/** Imagens estáticas (sem fundo), usadas nos ícones de objetivo do HUD. */
export const SPRITE_SOURCES = {
  hero: require('../../assets/adventure/hero.png') as ImageSourcePropType,
  coin: require('../../assets/adventure/coin.png') as ImageSourcePropType,
  bug: require('../../assets/adventure/bug.png') as ImageSourcePropType,
  wall: require('../../assets/adventure/wall.png') as ImageSourcePropType,
  goal: require('../../assets/adventure/goal.png') as ImageSourcePropType
};

/**
 * Folhas de sprite geradas por scripts/adventure-sprites/make_sheets.py.
 * Cada linha é uma animação; cada coluna, um quadro desenhado (160 px).
 * Se regenerar as folhas, confira linhas/colunas no manifest.json gerado.
 */
export const SPRITE_SHEETS = {
  hero: {
    source: require('../../assets/adventure/sprites/hero_sheet.png') as ImageSourcePropType,
    columns: 16,
    rows: 7
  },
  bug: {
    source: require('../../assets/adventure/sprites/bug_sheet.png') as ImageSourcePropType,
    columns: 12,
    rows: 2
  },
  coin: {
    source: require('../../assets/adventure/sprites/coin_sheet.png') as ImageSourcePropType,
    columns: 16,
    rows: 1
  },
  portal: {
    source: require('../../assets/adventure/sprites/portal_sheet.png') as ImageSourcePropType,
    columns: 12,
    rows: 2
  },
  wall: {
    source: require('../../assets/adventure/sprites/wall_sheet.png') as ImageSourcePropType,
    columns: 8,
    rows: 1
  }
} satisfies Record<string, SpriteSheet>;

// Linhas das folhas (iguais ao manifest.json do gerador).
const HERO_ROWS = {
  idle: { row: 0, count: 16 },
  slither: { row: 1, count: 8 },
  attack: { row: 2, count: 8 },
  collect: { row: 3, count: 6 },
  hurt: { row: 4, count: 6 },
  celebrate: { row: 5, count: 8 },
  confused: { row: 6, count: 8 }
};

export type HeroClip =
  | 'idle'
  | 'walkSide'
  | 'walkUp'
  | 'walkDown'
  | 'attack'
  | 'collect'
  | 'hurt'
  | 'confused'
  | 'celebrate';

// Os quadros desenhados fazem o "corpo" da animação (ondular, piscar, dar o
// bote). As poses só somam deslocamento leve por cima, para não deformar a arte.
export const HERO_CLIPS: Record<HeroClip, SpriteClip> = {
  // Respira, balança a cabeça e pisca de vez em quando.
  idle: { loop: true, duration: 3200, sheet: HERO_ROWS.idle },
  // Rasteja de lado: corpo ondula e inclina para onde vai.
  walkSide: {
    duration: 340,
    sheet: HERO_ROWS.slither,
    frames: [{}, { rotate: 4, y: -0.02 }, { rotate: 5, y: -0.03 }, { rotate: 3, y: -0.02 }, {}]
  },
  // Rasteja para o fundo: estica um pouco e fica mais estreito.
  walkUp: {
    duration: 340,
    sheet: HERO_ROWS.slither,
    frames: [{}, { sx: 0.97, sy: 1.03, y: -0.03 }, { sx: 0.96, sy: 1.04, y: -0.04 }, { y: -0.02 }, {}]
  },
  // Rasteja para a frente: "aproxima" e assenta.
  walkDown: {
    duration: 340,
    sheet: HERO_ROWS.slither,
    frames: [{}, { sx: 1.03, sy: 0.98, y: -0.02 }, { sx: 1.04, sy: 1.02, y: -0.03 }, { sx: 1.02 }, {}]
  },
  // Recolhe a cabeça e dá o bote (o golpe está no meio da animação).
  attack: {
    duration: 460,
    sheet: HERO_ROWS.attack,
    frames: [{}, { x: -0.04 }, { x: -0.05 }, { x: 0.1 }, { x: 0.09 }, { x: 0.03 }, {}]
  },
  // Abaixa a cabeça até a moeda, fecha os olhos contente e levanta.
  collect: { duration: 380, sheet: HERO_ROWS.collect, frames: [{}, { y: 0.02 }, {}] },
  // Sacode a cabeça, fecha os olhos, fica avermelhado e recua.
  hurt: {
    duration: 420,
    sheet: HERO_ROWS.hurt,
    frames: [{}, { x: -0.1, rotate: -6 }, { x: -0.06, rotate: 4 }, { x: -0.03 }, {}]
  },
  // Inclina a cabeça de um lado para o outro.
  confused: { duration: 640, sheet: HERO_ROWS.confused },
  // Rebola de alegria e dá um pulinho.
  celebrate: {
    duration: 760,
    sheet: HERO_ROWS.celebrate,
    frames: [
      {},
      { sx: 1.05, sy: 0.94, y: 0.01 },
      { y: -0.22 },
      { y: -0.28 },
      { y: -0.12 },
      { sx: 1.04, sy: 0.95 },
      {}
    ]
  }
};

export const BUG_CLIPS: Record<'idle' | 'alert' | 'hit' | 'taunt', SpriteClip> = {
  // Patas mexendo, corpo balançando, olhos pulsando e fumaça ondulando.
  idle: { loop: true, duration: 950, sheet: { row: 0, count: 12 } },
  // Herói por perto: patas aceleram e ele dá pulinhos de ameaça.
  alert: {
    loop: true,
    duration: 520,
    sheet: { row: 0, count: 12 },
    frames: [{}, { y: -0.1, sx: 0.95, sy: 1.06 }, { y: -0.02 }, { sx: 1.06, sy: 0.94 }, {}]
  },
  // Provocação ao toque: sacode de um lado para o outro.
  taunt: {
    duration: 480,
    sheet: { row: 0, count: 12 },
    frames: [{}, { rotate: -10, y: -0.06 }, { rotate: 9 }, { rotate: -6, y: -0.04 }, { rotate: 3 }, {}]
  },
  // Pisca branco, fica vermelho e achata com o golpe.
  hit: {
    duration: 260,
    sheet: { row: 1, count: 4 },
    frames: [{}, { sx: 1.12, sy: 0.9 }, { sx: 0.95, sy: 1.05 }, {}]
  }
};

export const COIN_CLIPS: Record<'idle', SpriteClip> = {
  // Gira em 3D, para de frente com um brilho passando e flutua.
  idle: {
    loop: true,
    duration: 1700,
    sheet: { row: 0, count: 16 },
    frames: [{}, { y: -0.05 }, { y: -0.07 }, { y: -0.05 }, {}]
  }
};

export const PORTAL_CLIPS: Record<'idle' | 'open' | 'enter', SpriteClip> = {
  // Redemoinho calmo com faíscas subindo.
  idle: { loop: true, duration: 2400, sheet: { row: 0, count: 12 } },
  // Pronto (moeda + bug concluídos): redemoinho rápido e mais brilhante.
  open: { loop: true, duration: 1100, sheet: { row: 1, count: 12 } },
  // Herói entrou: pulso de energia.
  enter: {
    duration: 560,
    sheet: { row: 1, count: 12 },
    frames: [{}, { sx: 1.1, sy: 1.1 }, { sx: 0.97, sy: 0.97 }, { sx: 1.03, sy: 1.03 }, {}]
  }
};

export const WALL_CLIPS: Record<'idle' | 'hit', SpriteClip> = {
  // Grama balançando com o vento.
  idle: { loop: true, duration: 2400, sheet: { row: 0, count: 8 } },
  // Treme quando o herói bate nela.
  hit: {
    duration: 300,
    sheet: { row: 0, count: 8 },
    frames: [{}, { x: 0.05, rotate: 2 }, { x: -0.04, rotate: -2 }, { x: 0.025 }, { x: -0.01 }, {}]
  }
};

/** Animação de passo e direção do herói para um movimento de `from` até `to`. */
export function getHeroWalk(from: AdventurePosition, to: AdventurePosition): {
  clip: HeroClip;
  facing?: 'left' | 'right';
} {
  if (to.col > from.col) {
    return { clip: 'walkSide', facing: 'right' };
  }

  if (to.col < from.col) {
    return { clip: 'walkSide', facing: 'left' };
  }

  return { clip: to.row < from.row ? 'walkUp' : 'walkDown' };
}
