import React, { forwardRef } from 'react';
import { Animated, View } from 'react-native';

import type { SpriteHandle } from '@/features/adventure/AnimatedSprite';
import {
  Eye,
  useBlink,
  useClipHandle,
  useGaze,
  useLoop
} from '@/features/adventure/characters/shared';

export type CodeEnemyProps = {
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

const BAT = {
  body: '#5B21B6',
  belly: '#7C3AED',
  wing: '#4C1D95',
  ink: '#1E1B4B',
  eye: '#FDE047'
};

const BAT_CLIPS = { hit: 260, taunt: 560 };

/**
 * Morcego: bate as asas sem parar, paira no ar, segue o herói com os olhos
 * e mergulha (asas mais rápidas, cara fechada) quando ele chega perto.
 */
export const Bat = forwardRef<SpriteHandle, CodeEnemyProps>(function Bat(
  { size: s, alert, reduceMotion, gazeTarget, origin, reach = 0 },
  ref
) {
  const clips = useClipHandle(ref, BAT_CLIPS, reduceMotion);
  const flap = useLoop(alert ? 170 : 300, !reduceMotion);
  const hover = useLoop(alert ? 700 : 1700, !reduceMotion);
  const lid = useBlink(!reduceMotion && !alert);

  const body = s * 0.42;
  const bodyLeft = (s - body) / 2;
  const bodyTop = s * 0.26;
  const wingW = s * 0.36;
  const wingH = s * 0.24;
  const eyeW = body * 0.3;
  const eyeH = body * 0.34;
  const gaze = useGaze(gazeTarget, origin, reach, eyeW * 0.2);

  const hit = clips.hit;
  const taunt = clips.taunt;
  const lift = hover.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: alert ? [0, s * 0.1, 0] : [0, -s * 0.07, 0]
  });

  return (
    <View style={{ width: s, height: s }} pointerEvents="none">
      {/* Sombra no chão: o morcego voa acima da casa */}
      <Animated.View
        style={{
          position: 'absolute',
          left: s * 0.3,
          bottom: s * 0.04,
          width: s * 0.4,
          height: s * 0.07,
          borderRadius: s,
          backgroundColor: 'rgba(30,27,75,0.22)',
          transform: [
            {
              scaleX: hover.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: alert ? [1, 1.2, 1] : [1, 0.75, 1]
              })
            }
          ]
        }}
      />

      <Animated.View
        style={{
          width: s,
          height: s,
          transform: [
            { translateY: lift },
            {
              translateX: hit.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, s * 0.08, -s * 0.06, s * 0.03, 0]
              })
            },
            {
              rotate: hit.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['0deg', '-18deg', '0deg']
              })
            },
            {
              rotate: taunt.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: ['0deg', '-14deg', '14deg', '-8deg', '0deg']
              })
            },
            { scale: taunt.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.18, 1] }) }
          ]
        }}
      >
        {/* Asas: giram em torno do ponto onde encostam no corpo */}
        {[-1, 1].map((side) => (
          <Animated.View
            key={side}
            style={{
              position: 'absolute',
              top: bodyTop + body * 0.12,
              left: side < 0 ? s / 2 - body * 0.3 - wingW : s / 2 + body * 0.3,
              width: wingW,
              height: wingH,
              backgroundColor: BAT.wing,
              borderTopLeftRadius: side < 0 ? wingH : wingH * 0.25,
              borderTopRightRadius: side < 0 ? wingH * 0.25 : wingH,
              borderBottomLeftRadius: side < 0 ? wingH * 0.2 : wingH * 0.9,
              borderBottomRightRadius: side < 0 ? wingH * 0.9 : wingH * 0.2,
              transformOrigin: side < 0 ? 'right center' : 'left center',
              transform: [
                {
                  rotate: flap.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange:
                      side < 0 ? ['24deg', '-30deg', '24deg'] : ['-24deg', '30deg', '-24deg']
                  })
                }
              ]
            }}
          />
        ))}

        {/* Orelhas pontudas */}
        {[-1, 1].map((side) => (
          <View
            key={`ear-${side}`}
            style={{
              position: 'absolute',
              left: s / 2 + side * body * 0.26 - body * 0.14,
              top: bodyTop - body * 0.1,
              width: body * 0.28,
              height: body * 0.28,
              borderRadius: body * 0.05,
              backgroundColor: BAT.body,
              transform: [{ rotate: '45deg' }]
            }}
          />
        ))}

        <View
          style={{
            position: 'absolute',
            left: bodyLeft,
            top: bodyTop,
            width: body,
            height: body,
            borderRadius: body,
            backgroundColor: BAT.body,
            overflow: 'hidden'
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: body * 0.2,
              top: body * 0.5,
              width: body * 0.6,
              height: body * 0.6,
              borderRadius: body,
              backgroundColor: BAT.belly
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: body * 0.16,
              top: body * 0.08,
              width: body * 0.24,
              height: body * 0.12,
              borderRadius: body,
              backgroundColor: 'rgba(255,255,255,0.35)',
              transform: [{ rotate: '-28deg' }]
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
              opacity: hit.interpolate({ inputRange: [0, 0.12, 0.5, 1], outputRange: [0, 0.9, 0.25, 0] })
            }}
          />
        </View>

        {[-1, 1].map((side) => (
          <Eye
            key={`eye-${side}`}
            width={eyeW}
            height={eyeH}
            left={s / 2 + side * body * 0.2 - eyeW / 2}
            top={bodyTop + body * 0.24}
            gaze={gaze}
            lid={lid}
            pupilColor={BAT.ink}
            white={BAT.eye}
          />
        ))}

        {alert
          ? [-1, 1].map((side) => (
              <View
                key={`brow-${side}`}
                style={{
                  position: 'absolute',
                  left: s / 2 + side * body * 0.2 - eyeW / 2,
                  top: bodyTop + body * 0.17,
                  width: eyeW,
                  height: Math.max(2, s * 0.03),
                  borderRadius: 2,
                  backgroundColor: BAT.ink,
                  transform: [{ rotate: `${side * 24}deg` }]
                }}
              />
            ))
          : null}

        {/* Boca com duas presas */}
        <View
          style={{
            position: 'absolute',
            left: s / 2 - body * 0.16,
            top: bodyTop + body * 0.66,
            width: body * 0.32,
            height: alert ? body * 0.2 : body * 0.1,
            borderBottomLeftRadius: body,
            borderBottomRightRadius: body,
            backgroundColor: BAT.ink,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: body * 0.04
          }}
        >
          {[0, 1].map((index) => (
            <View
              key={index}
              style={{
                width: body * 0.07,
                height: body * 0.09,
                backgroundColor: '#FFFFFF',
                borderBottomLeftRadius: body,
                borderBottomRightRadius: body
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
});
