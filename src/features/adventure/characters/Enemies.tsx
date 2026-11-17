import React, { forwardRef } from 'react';
import { Animated, Image, View } from 'react-native';

import { AnimatedSprite, SpriteHandle } from '@/features/adventure/AnimatedSprite';
import { BUG_CLIPS, SPRITE_SHEETS, SPRITE_SOURCES } from '@/features/adventure/adventure.sprites';
import { Bat } from '@/features/adventure/characters/Bat';
import {
  AlertMark,
  Eye,
  useBlink,
  useClipHandle,
  useGaze,
  useLoop
} from '@/features/adventure/characters/shared';

export type EnemyKind = 'bug' | 'slime' | 'ghost' | 'bat';

/** Textos de cada inimigo (artigo e concordância já resolvidos). */
export const ENEMIES: Record<
  EnemyKind,
  { name: string; subject: string; defeated: string; warning: string; taunts: string[] }
> = {
  bug: {
    name: 'Bug',
    subject: 'o bug',
    defeated: 'Bug derrotado!',
    warning: 'Bug! Ataque!',
    taunts: ['Bzzz!', 'Hehe!', 'Erro 404!']
  },
  slime: {
    name: 'Gosma',
    subject: 'a gosma',
    defeated: 'Gosma derrotada!',
    warning: 'Gosma! Ataque!',
    taunts: ['Blub!', 'Glup glup!', 'SyntaxError!']
  },
  ghost: {
    name: 'Fantasma',
    subject: 'o fantasma',
    defeated: 'Fantasma derrotado!',
    warning: 'Fantasma! Ataque!',
    taunts: ['Buuu!', 'Hihihi!', 'None!']
  },
  bat: {
    name: 'Morcego',
    subject: 'o morcego',
    defeated: 'Morcego derrotado!',
    warning: 'Morcego! Ataque!',
    taunts: ['Squiik!', 'Vush!', 'IndexError!']
  }
};

const ENEMY_ROTATION: EnemyKind[] = ['bug', 'slime', 'ghost', 'bat'];

/** Cada fase traz um inimigo; eles se revezam na ordem das fases. */
export function getEnemyKind(missionIndex: number): EnemyKind {
  return ENEMY_ROTATION[missionIndex % ENEMY_ROTATION.length];
}

type EnemyProps = {
  size: number;
  alert: boolean;
  reduceMotion: boolean;
  /** Posição animada do herói (canto superior da casa), para os olhos seguirem. */
  gazeTarget?: Animated.ValueXY;
  /** Canto superior da casa do inimigo, no mesmo sistema do herói. */
  origin?: { x: number; y: number };
  /** Distância (px) em que o olhar chega ao máximo, normalmente 2 casas. */
  reach?: number;
};

type EnemyCharacterProps = EnemyProps & { kind: EnemyKind };

/**
 * Inimigo da fase. Todos aceitam `play('hit')` (golpe) e `play('taunt')`
 * (provocação ao toque), com a mesma interface do AnimatedSprite.
 */
export const EnemyCharacter = forwardRef<SpriteHandle, EnemyCharacterProps>(
  function EnemyCharacter({ kind, ...props }, ref) {
    return (
      <View style={{ width: props.size, height: props.size }}>
        {kind === 'bug' ? (
          <AnimatedSprite
            ref={ref}
            sheet={SPRITE_SHEETS.bug}
            size={props.size}
            clips={BUG_CLIPS}
            loopClip={props.alert ? 'alert' : 'idle'}
            reduceMotion={props.reduceMotion}
          />
        ) : kind === 'slime' ? (
          <Slime ref={ref} {...props} />
        ) : kind === 'ghost' ? (
          <Ghost ref={ref} {...props} />
        ) : (
          <Bat ref={ref} {...props} />
        )}
        <AlertMark visible={props.alert} size={props.size} reduceMotion={props.reduceMotion} />
      </View>
    );
  }
);

/** Versão parada e pequena do inimigo, para o HUD de objetivos. */
export function EnemyIcon({ kind, size }: { kind: EnemyKind; size: number }) {
  if (kind === 'bug') {
    return (
      <Image source={SPRITE_SOURCES.bug} resizeMode="contain" style={{ width: size, height: size }} />
    );
  }

  if (kind === 'slime') {
    return <Slime size={size} alert={false} reduceMotion />;
  }

  return kind === 'ghost' ? (
    <Ghost size={size} alert={false} reduceMotion />
  ) : (
    <Bat size={size} alert={false} reduceMotion />
  );
}

// ---------------------------------------------------------------------------
// Gosma: geleia que balança, segue o herói com os olhos e pula quando ele chega perto
// ---------------------------------------------------------------------------

const SLIME = {
  base: '#A21CAF',
  body: '#C026D3',
  light: '#E879F9',
  ink: '#3B0764',
  mouth: '#4A044E'
};

const SLIME_CLIPS = { hit: 260, taunt: 520 };

const Slime = forwardRef<SpriteHandle, EnemyProps>(function Slime(
  { size: s, alert, reduceMotion, gazeTarget, origin, reach = 0 },
  ref
) {
  const clips = useClipHandle(ref, SLIME_CLIPS, reduceMotion);
  const wobble = useLoop(alert ? 520 : 1300, !reduceMotion);
  const lid = useBlink(!reduceMotion && !alert);

  const w = s * 0.84;
  const h = s * 0.62;
  const left = (s - w) / 2;
  const top = s * 0.94 - h;
  const eyeW = w * 0.22;
  const eyeH = w * 0.25;
  const gaze = useGaze(gazeTarget, origin, reach, eyeW * 0.2);

  // Balanço apoiado na base: achata e alarga, e desce o mesmo tanto que encolhe.
  const squashY = wobble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: alert ? [1, 1.12, 1] : [1, 0.93, 1]
  });
  const squashX = wobble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: alert ? [1, 0.92, 1] : [1, 1.06, 1]
  });
  const hop = wobble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: alert ? [0, -s * 0.16, 0] : [0, h * 0.035, 0]
  });

  const hit = clips.hit;
  const taunt = clips.taunt;

  return (
    <View style={{ width: s, height: s }} pointerEvents="none">
      <Animated.View
        style={{
          position: 'absolute',
          left: s * 0.18,
          bottom: s * 0.02,
          width: s * 0.64,
          height: s * 0.1,
          borderRadius: s,
          backgroundColor: 'rgba(59,7,100,0.25)',
          transform: [{ scaleX: squashX }]
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          transform: [
            { translateY: hop },
            { scaleX: squashX },
            { scaleY: squashY },
            { scaleX: hit.interpolate({ inputRange: [0, 0.3, 0.65, 1], outputRange: [1, 1.3, 0.94, 1] }) },
            { scaleY: hit.interpolate({ inputRange: [0, 0.3, 0.65, 1], outputRange: [1, 0.66, 1.08, 1] }) },
            {
              rotate: taunt.interpolate({
                inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                outputRange: ['0deg', '-10deg', '9deg', '-6deg', '3deg', '0deg']
              })
            },
            { scaleY: taunt.interpolate({ inputRange: [0, 0.15, 0.5, 1], outputRange: [1, 1.18, 0.9, 1] }) }
          ]
        }}
      >
        {/* Gotas escorrendo nas laterais */}
        {[0.08, 0.78].map((x) => (
          <View
            key={x}
            style={{
              position: 'absolute',
              left: w * x,
              bottom: -h * 0.05,
              width: w * 0.16,
              height: w * 0.16,
              borderRadius: w,
              backgroundColor: SLIME.base
            }}
          />
        ))}

        <View
          style={{
            width: w,
            height: h,
            borderTopLeftRadius: w / 2,
            borderTopRightRadius: w / 2,
            borderBottomLeftRadius: w * 0.16,
            borderBottomRightRadius: w * 0.16,
            backgroundColor: SLIME.base,
            overflow: 'hidden'
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: w * 0.04,
              top: 0,
              width: w * 0.9,
              height: h * 0.86,
              borderTopLeftRadius: w / 2,
              borderTopRightRadius: w / 2,
              borderBottomLeftRadius: w * 0.3,
              borderBottomRightRadius: w * 0.4,
              backgroundColor: SLIME.body
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: w * 0.16,
              top: h * 0.12,
              width: w * 0.24,
              height: h * 0.16,
              borderRadius: w,
              backgroundColor: 'rgba(255,255,255,0.65)',
              transform: [{ rotate: '-30deg' }]
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: w * 0.44,
              top: h * 0.08,
              width: w * 0.06,
              height: w * 0.06,
              borderRadius: w,
              backgroundColor: 'rgba(255,255,255,0.6)'
            }}
          />
          {/* Bolhas dentro da geleia */}
          <View
            style={{
              position: 'absolute',
              left: w * 0.7,
              top: h * 0.62,
              width: w * 0.08,
              height: w * 0.08,
              borderRadius: w,
              borderWidth: 1,
              borderColor: SLIME.light
            }}
          />

          {/* Flash branco do golpe */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#FFFFFF',
              opacity: hit.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0, 0.85, 0.2, 0] })
            }}
          />
        </View>

        {[-1, 1].map((side) => (
          <Eye
            key={side}
            width={eyeW}
            height={eyeH}
            left={w / 2 + side * w * 0.17 - eyeW / 2}
            top={h * 0.3}
            gaze={gaze}
            lid={lid}
            pupilColor={SLIME.ink}
          />
        ))}

        {alert
          ? [-1, 1].map((side) => (
              <View
                key={side}
                style={{
                  position: 'absolute',
                  left: w / 2 + side * w * 0.17 - eyeW / 2,
                  top: h * 0.22,
                  width: eyeW,
                  height: Math.max(2, s * 0.035),
                  borderRadius: 2,
                  backgroundColor: SLIME.ink,
                  transform: [{ rotate: `${side * 22}deg` }]
                }}
              />
            ))
          : null}

        {alert ? (
          <View
            style={{
              position: 'absolute',
              left: w * 0.38,
              top: h * 0.64,
              width: w * 0.24,
              height: h * 0.2,
              borderRadius: w,
              backgroundColor: SLIME.mouth,
              alignItems: 'center'
            }}
          >
            <View
              style={{
                width: w * 0.06,
                height: h * 0.07,
                backgroundColor: '#FFFFFF',
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2
              }}
            />
          </View>
        ) : (
          <View
            style={{
              position: 'absolute',
              left: w * 0.42,
              top: h * 0.66,
              width: w * 0.16,
              height: w * 0.07,
              borderBottomLeftRadius: w,
              borderBottomRightRadius: w,
              backgroundColor: SLIME.mouth
            }}
          />
        )}
      </Animated.View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Fantasma: flutua balançando, olhos acompanham o herói e cresce quando ele chega perto
// ---------------------------------------------------------------------------

const GHOST = {
  body: '#C7D2FE',
  shade: '#A5B4FC',
  eye: '#1E1B4B',
  cheek: 'rgba(244,114,182,0.5)'
};

const GHOST_CLIPS = { hit: 260, taunt: 600 };

const Ghost = forwardRef<SpriteHandle, EnemyProps>(function Ghost(
  { size: s, alert, reduceMotion, gazeTarget, origin, reach = 0 },
  ref
) {
  const clips = useClipHandle(ref, GHOST_CLIPS, reduceMotion);
  const float = useLoop(alert ? 900 : 2200, !reduceMotion);
  const sway = useLoop(3000, !reduceMotion);
  const w = s * 0.64;
  const h = s * 0.66;
  const left = (s - w) / 2;
  const top = s * 0.12;
  const eyeW = w * 0.15;
  const eyeH = w * 0.22;
  const gaze = useGaze(gazeTarget, origin, reach, w * 0.06);

  const hit = clips.hit;
  const taunt = clips.taunt;
  const lift = float.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -s * 0.08, 0] });
  const bump = w / 3;

  return (
    <View style={{ width: s, height: s }} pointerEvents="none">
      {/* Sombra que encolhe quando o fantasma sobe */}
      <Animated.View
        style={{
          position: 'absolute',
          left: s * 0.26,
          bottom: s * 0.03,
          width: s * 0.48,
          height: s * 0.08,
          borderRadius: s,
          backgroundColor: 'rgba(30,27,75,0.22)',
          transform: [{ scaleX: float.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.7, 1] }) }]
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h + bump * 0.5,
          opacity: 0.94,
          transform: [
            { translateY: lift },
            { rotate: sway.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-5deg', '5deg', '-5deg'] }) },
            { scale: alert ? 1.08 : 1 },
            { translateX: hit.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, s * 0.08, -s * 0.06, s * 0.03, 0] }) },
            { scale: taunt.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [1, 1.25, 0.95, 1] }) }
          ]
        }}
      >
        {/* Bracinhos: sobem quando está em alerta */}
        {[-1, 1].map((side) => (
          <View
            key={side}
            style={{
              position: 'absolute',
              top: h * 0.42,
              left: w / 2 + side * w * 0.5 - w * 0.11,
              width: w * 0.22,
              height: w * 0.14,
              borderRadius: w,
              backgroundColor: GHOST.shade,
              transform: [{ rotate: `${side * (alert ? -50 : 25)}deg` }]
            }}
          />
        ))}

        <View
          style={{
            width: w,
            height: h,
            borderTopLeftRadius: w / 2,
            borderTopRightRadius: w / 2,
            backgroundColor: GHOST.body,
            overflow: 'hidden'
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: -w * 0.1,
              top: h * 0.1,
              width: w * 0.4,
              height: h,
              borderRadius: w,
              backgroundColor: GHOST.shade,
              opacity: 0.6
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: w * 0.16,
              top: h * 0.1,
              width: w * 0.22,
              height: h * 0.12,
              borderRadius: w,
              backgroundColor: 'rgba(255,255,255,0.8)',
              transform: [{ rotate: '-30deg' }]
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#FFFFFF',
              opacity: hit.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0, 0.9, 0.25, 0] })
            }}
          />
        </View>

        {/* Barra ondulada da "cauda" */}
        <View style={{ flexDirection: 'row', marginTop: -bump / 2 }}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{
                width: bump,
                height: bump,
                borderRadius: bump,
                backgroundColor: index === 2 ? GHOST.shade : GHOST.body
              }}
            />
          ))}
        </View>

        {/* Olhos ovais escuros que se movem inteiros */}
        {[-1, 1].map((side) => (
          <Animated.View
            key={side}
            style={{
              position: 'absolute',
              left: w / 2 + side * w * 0.17 - eyeW / 2,
              top: h * 0.3,
              width: eyeW,
              height: alert ? eyeH * 1.15 : eyeH,
              borderRadius: w,
              backgroundColor: GHOST.eye,
              transform: [{ translateX: gaze.x }, { translateY: gaze.y }]
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: eyeH * 0.12,
                right: eyeW * 0.15,
                width: eyeW * 0.4,
                height: eyeW * 0.4,
                borderRadius: w,
                backgroundColor: '#FFFFFF'
              }}
            />
          </Animated.View>
        ))}

        {[-1, 1].map((side) => (
          <View
            key={`cheek-${side}`}
            style={{
              position: 'absolute',
              left: w / 2 + side * w * 0.3 - w * 0.07,
              top: h * 0.56,
              width: w * 0.14,
              height: w * 0.08,
              borderRadius: w,
              backgroundColor: GHOST.cheek
            }}
          />
        ))}

        {/* Boca: "o" calmo, "BUU" aberto em alerta */}
        <View
          style={{
            position: 'absolute',
            left: w / 2 - (alert ? w * 0.13 : w * 0.06),
            top: h * 0.58,
            width: alert ? w * 0.26 : w * 0.12,
            height: alert ? h * 0.2 : w * 0.12,
            borderRadius: w,
            backgroundColor: GHOST.eye
          }}
        />
      </Animated.View>
    </View>
  );
});
