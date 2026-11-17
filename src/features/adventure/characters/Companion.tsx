import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

import { Eye, useBlink, useLoop } from '@/features/adventure/characters/shared';

export type CompanionMood = 'idle' | 'thinking' | 'happy' | 'worried';

type CompanionProps = {
  mood: CompanionMood;
  size: number;
  reduceMotion: boolean;
  onPress?: () => void;
};

const BODY = '#0EA5E9';
const BODY_LIGHT = '#38BDF8';
const INK = '#0C2A43';
const BULB = '#FDE047';

/**
 * Byte, o vaga-lume ajudante. Flutua batendo as asas, a lâmpada da antena
 * pulsa e o rosto acompanha o andamento do programa:
 * calmo (idle), pensando (executando), feliz (venceu) e preocupado (erro).
 */
export function Companion({ mood, size: s, reduceMotion, onPress }: CompanionProps) {
  const animate = !reduceMotion;
  const hover = useLoop(1900, animate);
  const wings = useLoop(240, animate);
  const glow = useLoop(1300, animate);
  const look = useLoop(1500, animate && mood === 'thinking');
  const lid = useBlink(animate && (mood === 'idle' || mood === 'thinking'));

  const jump = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const squish = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) {
      return;
    }

    if (mood === 'happy') {
      jump.setValue(0);
      Animated.timing(jump, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }).start();
    }

    if (mood === 'worried') {
      shake.setValue(0);
      Animated.sequence(
        [1, -1, 0.7, -0.5, 0.25, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 55, useNativeDriver: true })
        )
      ).start();
    }
  }, [mood, animate, jump, shake]);

  function handlePress() {
    if (animate) {
      squish.setValue(0);
      Animated.sequence([
        Animated.timing(squish, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.spring(squish, { toValue: 0, friction: 3, tension: 200, useNativeDriver: true })
      ]).start();
    }

    onPress?.();
  }

  const body = s * 0.62;
  const bodyLeft = (s - body) / 2;
  const bodyTop = s * 0.3;
  const eyeW = body * 0.3;
  const eyeH = body * 0.36;
  const eyeTop = bodyTop + body * 0.24;
  const pupilShift = eyeW * 0.18;
  const gaze = {
    x: look.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [0, pupilShift, 0, -pupilShift, 0]
    }),
    y: mood === 'worried' ? eyeH * 0.12 : 0
  };

  const wingFlap = wings.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.35, 1] });
  const bulb = s * 0.16;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Byte, seu ajudante. Toque para receber uma dica."
      style={{ width: s, height: s }}
    >
      <Animated.View
        style={{
          width: s,
          height: s,
          transform: [
            { translateY: hover.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -s * 0.06, 0] }) },
            {
              translateY: jump.interpolate({
                inputRange: [0, 0.45, 0.8, 1],
                outputRange: [0, -s * 0.4, s * 0.03, 0]
              })
            },
            { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-s * 0.08, s * 0.08] }) },
            { rotate: jump.interpolate({ inputRange: [0, 0.8, 1], outputRange: ['0deg', '360deg', '360deg'] }) },
            { scaleX: squish.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
            { scaleY: squish.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) }
          ]
        }}
      >
        {/* Asas atrás do corpo */}
        {[-1, 1].map((side) => (
          <Animated.View
            key={side}
            style={{
              position: 'absolute',
              top: bodyTop - s * 0.08,
              left: s / 2 + side * s * 0.2 - s * 0.17,
              width: s * 0.34,
              height: s * 0.26,
              borderRadius: s,
              backgroundColor: 'rgba(224,242,254,0.85)',
              borderWidth: 1.5,
              borderColor: 'rgba(14,165,233,0.45)',
              transform: [{ rotate: `${side * 28}deg` }, { scaleY: wingFlap }]
            }}
          />
        ))}

        {/* Antena com lâmpada que pulsa */}
        <View
          style={{
            position: 'absolute',
            left: s / 2 - 1,
            top: s * 0.12,
            width: 2,
            height: s * 0.2,
            backgroundColor: INK,
            borderRadius: 1
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            left: s / 2 - bulb,
            top: s * 0.08 - bulb / 2,
            width: bulb * 2,
            height: bulb * 2,
            borderRadius: bulb,
            backgroundColor: BULB,
            opacity: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.5, 0.15] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.15, 0.8] }) }]
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: s / 2 - bulb / 2,
            top: s * 0.08,
            width: bulb,
            height: bulb,
            borderRadius: bulb,
            backgroundColor: mood === 'worried' ? '#FCA5A5' : BULB,
            borderWidth: 1.5,
            borderColor: '#CA8A04'
          }}
        />

        {/* Corpo com volume: base escura, miolo claro e brilho */}
        <View
          style={{
            position: 'absolute',
            left: bodyLeft,
            top: bodyTop,
            width: body,
            height: body,
            borderRadius: body,
            backgroundColor: BODY,
            overflow: 'hidden'
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: body * 0.04,
              top: body * 0.02,
              width: body * 0.86,
              height: body * 0.86,
              borderRadius: body,
              backgroundColor: BODY_LIGHT
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: body * 0.18,
              top: body * 0.1,
              width: body * 0.26,
              height: body * 0.14,
              borderRadius: body,
              backgroundColor: 'rgba(255,255,255,0.7)',
              transform: [{ rotate: '-25deg' }]
            }}
          />
        </View>

        {/* Olhos: arcos "^^" quando feliz, pupilas que procuram quando pensa */}
        {mood === 'happy'
          ? [-1, 1].map((side) => (
              <View
                key={side}
                style={{
                  position: 'absolute',
                  left: s / 2 + side * body * 0.2 - eyeW / 2,
                  top: eyeTop + eyeH * 0.25,
                  width: eyeW,
                  height: eyeW * 0.55,
                  borderTopLeftRadius: eyeW,
                  borderTopRightRadius: eyeW,
                  borderWidth: 2.5,
                  borderBottomWidth: 0,
                  borderColor: INK
                }}
              />
            ))
          : [-1, 1].map((side) => (
              <Eye
                key={side}
                width={eyeW}
                height={eyeH}
                left={s / 2 + side * body * 0.2 - eyeW / 2}
                top={eyeTop}
                gaze={gaze}
                lid={lid}
                pupilColor={INK}
              />
            ))}

        {/* Sobrancelhas preocupadas */}
        {mood === 'worried'
          ? [-1, 1].map((side) => (
              <View
                key={side}
                style={{
                  position: 'absolute',
                  left: s / 2 + side * body * 0.2 - eyeW / 2,
                  top: eyeTop - eyeH * 0.22,
                  width: eyeW,
                  height: 2.5,
                  borderRadius: 2,
                  backgroundColor: INK,
                  transform: [{ rotate: `${side * -18}deg` }]
                }}
              />
            ))
          : null}

        {/* Bochechas */}
        {[-1, 1].map((side) => (
          <View
            key={side}
            style={{
              position: 'absolute',
              left: s / 2 + side * body * 0.33 - body * 0.07,
              top: eyeTop + eyeH * 1.0,
              width: body * 0.14,
              height: body * 0.08,
              borderRadius: body,
              backgroundColor: 'rgba(244,114,182,0.55)'
            }}
          />
        ))}

        <Mouth mood={mood} centerX={s / 2} top={eyeTop + eyeH * 1.08} width={body * 0.28} />

        {mood === 'worried' ? (
          <View
            style={{
              position: 'absolute',
              left: bodyLeft + body * 0.86,
              top: bodyTop + body * 0.02,
              width: body * 0.14,
              height: body * 0.2,
              borderTopLeftRadius: body * 0.01,
              borderTopRightRadius: body * 0.14,
              borderBottomLeftRadius: body * 0.14,
              borderBottomRightRadius: body * 0.14,
              backgroundColor: '#BAE6FD',
              borderWidth: 1,
              borderColor: '#0284C7',
              transform: [{ rotate: '-45deg' }]
            }}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function Mouth({
  mood,
  centerX,
  top,
  width
}: {
  mood: CompanionMood;
  centerX: number;
  top: number;
  width: number;
}) {
  if (mood === 'worried') {
    const d = width * 0.42;
    return (
      <View
        style={{
          position: 'absolute',
          left: centerX - d / 2,
          top,
          width: d,
          height: d,
          borderRadius: d,
          backgroundColor: INK
        }}
      />
    );
  }

  if (mood === 'thinking') {
    return (
      <View
        style={{
          position: 'absolute',
          left: centerX - width * 0.2,
          top: top + width * 0.12,
          width: width * 0.6,
          height: 2.5,
          borderRadius: 2,
          backgroundColor: INK,
          transform: [{ rotate: '-8deg' }]
        }}
      />
    );
  }

  const w = mood === 'happy' ? width * 1.25 : width;
  const h = mood === 'happy' ? w * 0.55 : w * 0.42;

  return (
    <View
      style={{
        position: 'absolute',
        left: centerX - w / 2,
        top,
        width: w,
        height: h,
        borderBottomLeftRadius: w,
        borderBottomRightRadius: w,
        backgroundColor: mood === 'happy' ? '#9F1239' : INK,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}
    >
      {mood === 'happy' ? (
        <View
          style={{
            width: w * 0.5,
            height: h * 0.45,
            borderTopLeftRadius: w,
            borderTopRightRadius: w,
            backgroundColor: '#FB7185'
          }}
        />
      ) : null}
    </View>
  );
}
