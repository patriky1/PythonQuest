import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { Eye, useBlink, useLoop } from '@/features/adventure/characters/shared';

// ---------------------------------------------------------------------------
// Baú de tesouro: fechado balança de leve; ao abrir, a tampa sobe e brilha
// ---------------------------------------------------------------------------

type ChestProps = {
  size: number;
  opened: boolean;
  reduceMotion: boolean;
};

export function Chest({ size: s, opened, reduceMotion }: ChestProps) {
  const open = useRef(new Animated.Value(opened ? 1 : 0)).current;
  const wiggle = useLoop(2600, !reduceMotion && !opened);

  useEffect(() => {
    if (reduceMotion) {
      open.setValue(opened ? 1 : 0);
      return;
    }

    Animated.spring(open, {
      toValue: opened ? 1 : 0,
      friction: 5,
      tension: 120,
      useNativeDriver: true
    }).start();
  }, [opened, open, reduceMotion]);

  const w = s * 0.7;
  const bodyH = s * 0.34;
  const lidH = s * 0.2;
  const left = (s - w) / 2;
  const bodyTop = s * 0.5;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: s,
        height: s,
        transform: [
          {
            rotate: wiggle.interpolate({
              inputRange: [0, 0.06, 0.12, 0.18, 1],
              outputRange: ['0deg', '-5deg', '5deg', '0deg', '0deg']
            })
          }
        ]
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: s * 0.16,
          bottom: s * 0.1,
          width: s * 0.68,
          height: s * 0.1,
          borderRadius: s,
          backgroundColor: 'rgba(15,23,42,0.2)'
        }}
      />

      {/* Brilho do tesouro, visível quando abre */}
      <Animated.View
        style={{
          position: 'absolute',
          left: left + w * 0.15,
          top: bodyTop - s * 0.16,
          width: w * 0.7,
          height: s * 0.3,
          borderRadius: s,
          backgroundColor: '#FDE047',
          opacity: open.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85], extrapolate: 'clamp' }),
          transform: [{ scaleY: open.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }]
        }}
      />

      {/* Corpo */}
      <View
        style={{
          position: 'absolute',
          left,
          top: bodyTop,
          width: w,
          height: bodyH,
          borderBottomLeftRadius: s * 0.06,
          borderBottomRightRadius: s * 0.06,
          backgroundColor: '#92400E',
          borderWidth: Math.max(1.5, s * 0.03),
          borderColor: '#78350F',
          alignItems: 'center'
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: bodyH * 0.38,
            height: Math.max(2, s * 0.045),
            backgroundColor: '#FBBF24'
          }}
        />
        <View
          style={{
            marginTop: bodyH * 0.14,
            width: s * 0.13,
            height: s * 0.15,
            borderRadius: s * 0.03,
            backgroundColor: '#FDE047',
            borderWidth: 1,
            borderColor: '#B45309'
          }}
        />
      </View>

      {/* Tampa: gira para trás ao abrir */}
      <Animated.View
        style={{
          position: 'absolute',
          left: left - s * 0.02,
          top: bodyTop - lidH + 1,
          width: w + s * 0.04,
          height: lidH,
          borderTopLeftRadius: s * 0.14,
          borderTopRightRadius: s * 0.14,
          backgroundColor: '#B45309',
          borderWidth: Math.max(1.5, s * 0.03),
          borderColor: '#78350F',
          transformOrigin: 'center bottom',
          transform: [
            { translateY: open.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.14] }) },
            { rotate: open.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-22deg'] }) }
          ]
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: lidH * 0.18,
            height: Math.max(2, s * 0.04),
            backgroundColor: '#FBBF24'
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Coruja sábia (NPC): pisca, balança a cabeça e pula quando conversa
// ---------------------------------------------------------------------------

type OwlProps = {
  size: number;
  /** Herói ao lado: a coruja se anima para chamar atenção. */
  attentive: boolean;
  /** Muda quando o herói conversa (dispara o pulinho). */
  talkCount: number;
  reduceMotion: boolean;
};

export function Owl({ size: s, attentive, talkCount, reduceMotion }: OwlProps) {
  const sway = useLoop(attentive ? 900 : 3200, !reduceMotion);
  const lid = useBlink(!reduceMotion);
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (talkCount === 0 || reduceMotion) {
      return;
    }

    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 3, tension: 150, useNativeDriver: true })
    ]).start();
  }, [talkCount, hop, reduceMotion]);

  const w = s * 0.6;
  const h = s * 0.68;
  const left = (s - w) / 2;
  const top = s * 0.18;
  const eye = w * 0.36;
  const noGaze = { x: 0, y: 0 };

  return (
    <View style={{ width: s, height: s }} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          left: s * 0.24,
          bottom: s * 0.05,
          width: s * 0.52,
          height: s * 0.09,
          borderRadius: s,
          backgroundColor: 'rgba(15,23,42,0.2)'
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          transformOrigin: 'center bottom',
          transform: [
            { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.16] }) },
            {
              rotate: sway.interpolate({
                inputRange: [0, 0.25, 0.75, 1],
                outputRange: ['0deg', '5deg', '-5deg', '0deg']
              })
            }
          ]
        }}
      >
        {/* Tufos das orelhas */}
        {[-1, 1].map((side) => (
          <View
            key={side}
            style={{
              position: 'absolute',
              left: w / 2 + side * w * 0.3 - w * 0.11,
              top: -w * 0.06,
              width: w * 0.22,
              height: w * 0.22,
              borderRadius: w * 0.04,
              backgroundColor: '#78350F',
              transform: [{ rotate: '45deg' }]
            }}
          />
        ))}

        {/* Asas */}
        {[-1, 1].map((side) => (
          <View
            key={`wing-${side}`}
            style={{
              position: 'absolute',
              left: side < 0 ? -w * 0.08 : w * 0.86,
              top: h * 0.42,
              width: w * 0.22,
              height: h * 0.42,
              borderRadius: w,
              backgroundColor: '#78350F',
              transform: [{ rotate: `${side * (attentive ? -22 : -6)}deg` }]
            }}
          />
        ))}

        {/* Corpo e barriga */}
        <View
          style={{
            width: w,
            height: h,
            borderTopLeftRadius: w * 0.5,
            borderTopRightRadius: w * 0.5,
            borderBottomLeftRadius: w * 0.42,
            borderBottomRightRadius: w * 0.42,
            backgroundColor: '#92400E',
            overflow: 'hidden',
            alignItems: 'center'
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: h * 0.48,
              width: w * 0.62,
              height: h * 0.6,
              borderRadius: w,
              backgroundColor: '#FDE68A'
            }}
          />
        </View>

        {[-1, 1].map((side) => (
          <Eye
            key={`eye-${side}`}
            width={eye}
            height={eye}
            left={w / 2 + side * eye * 0.56 - eye / 2}
            top={h * 0.14}
            gaze={noGaze}
            lid={lid}
            pupil={eye * 0.5}
            pupilColor="#1C1917"
            white="#FFFBEB"
          />
        ))}

        {/* Bico */}
        <View
          style={{
            position: 'absolute',
            left: w / 2 - w * 0.08,
            top: h * 0.38,
            width: w * 0.16,
            height: w * 0.16,
            borderRadius: w * 0.03,
            backgroundColor: '#F59E0B',
            transform: [{ rotate: '45deg' }]
          }}
        />
      </Animated.View>
    </View>
  );
}
