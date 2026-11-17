import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

/**
 * Uma pose (quadro-chave de movimento) do sprite. Distâncias são frações do
 * tamanho do sprite, para a animação funcionar igual em qualquer tabuleiro.
 */
export type SpritePose = {
  /** Deslocamento horizontal, no sentido para onde o sprite está virado. */
  x?: number;
  /** Deslocamento vertical (negativo = para cima). */
  y?: number;
  /** Rotação em graus. */
  rotate?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
};

/**
 * Uma animação: quadros desenhados da folha de sprite (`sheet`) + poses de
 * movimento interpoladas por cima (`frames`). O primeiro e o último quadro de
 * `frames` devem ser a pose de descanso, para as animações emendarem.
 */
export type SpriteClip = {
  duration: number;
  loop?: boolean;
  /** Linha da folha de sprite e quantos quadros ela tem. */
  sheet?: { row: number; count: number };
  frames?: SpritePose[];
};

/** Folha de sprite: grade de quadros quadrados (linhas = animações). */
export type SpriteSheet = {
  source: ImageSourcePropType;
  columns: number;
  rows: number;
};

export type SpriteHandle = {
  /** Toca uma animação uma vez; a promessa resolve quando ela termina ou é interrompida. */
  play: (clip: string, options?: { duration?: number }) => Promise<void>;
  /** Interrompe a animação atual e volta ao loop padrão. */
  reset: () => void;
};

type AnimatedSpriteProps = {
  sheet: SpriteSheet;
  size: number;
  clips: Record<string, SpriteClip>;
  /** Animação em loop tocada quando nenhuma animação única está ativa. */
  loopClip?: string;
  flipped?: boolean;
  shadowColor?: string;
  reduceMotion?: boolean;
};

type ActivePlayback = {
  id: number;
  name: string;
  duration: number;
  resolve: () => void;
};

const REST_POSES: SpritePose[] = [{}, {}];
const STEP_EPSILON = 0.0001;

export const AnimatedSprite = forwardRef<SpriteHandle, AnimatedSpriteProps>(
  function AnimatedSprite(
    { sheet, size, clips, loopClip, flipped = false, shadowColor, reduceMotion = false },
    ref
  ) {
    const clock = useRef(new Animated.Value(0)).current;
    const playbackIdRef = useRef(0);
    const [active, setActive] = useState<ActivePlayback | null>(null);

    const clipName = active?.name ?? loopClip;
    const clip = clipName ? clips[clipName] : undefined;

    const play = useCallback(
      (name: string, options?: { duration?: number }) => {
        const target = clips[name];

        if (!target) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          playbackIdRef.current += 1;
          // Volta ao quadro 0 antes de trocar de animação para não piscar a pose antiga.
          clock.stopAnimation();
          clock.setValue(0);
          setActive({
            id: playbackIdRef.current,
            name,
            duration: options?.duration ?? target.duration,
            resolve
          });
        });
      },
      [clips, clock]
    );

    const reset = useCallback(() => {
      playbackIdRef.current += 1;
      clock.stopAnimation();
      clock.setValue(0);
      setActive(null);
    }, [clock]);

    useImperativeHandle(ref, () => ({ play, reset }), [play, reset]);

    useEffect(() => {
      if (active) {
        const { id, duration, resolve } = active;
        const finish = () => {
          if (playbackIdRef.current === id) {
            setActive(null);
          }
          resolve();
        };

        clock.setValue(0);

        if (reduceMotion) {
          // Sem movimento, mas mantém o tempo para a lógica continuar sincronizada.
          const timer = setTimeout(finish, duration);
          return () => {
            clearTimeout(timer);
            resolve();
          };
        }

        const animation = Animated.timing(clock, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true
        });
        animation.start(finish);
        return () => animation.stop();
      }

      clock.setValue(0);

      if (!clip?.loop || reduceMotion) {
        return;
      }

      const loop = Animated.loop(
        Animated.timing(clock, {
          toValue: 1,
          duration: clip.duration,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      loop.start();
      return () => loop.stop();
    }, [active, clip, clock, reduceMotion]);

    const animated = useMemo(() => {
      // Quadros da folha: troca em degraus (quadro 0, 1, 2...) ao longo do clipe.
      const count = Math.max(1, clip?.sheet?.count ?? 1);
      const stepInput: number[] = [];
      const stepOutput: number[] = [];

      for (let index = 0; index < count; index += 1) {
        stepInput.push(index / count, (index + 1) / count - STEP_EPSILON);
        stepOutput.push(-index * size, -index * size);
      }

      // Poses de movimento: interpolação linear entre quadros-chave.
      const poses = clip?.frames && clip.frames.length >= 2 ? clip.frames : REST_POSES;
      const inputRange = poses.map((_, index) => index / (poses.length - 1));
      const channel = (read: (pose: SpritePose) => number) =>
        clock.interpolate({ inputRange, outputRange: poses.map(read), extrapolate: 'clamp' });

      return {
        frameX:
          count > 1
            ? clock.interpolate({ inputRange: stepInput, outputRange: stepOutput, extrapolate: 'clamp' })
            : 0,
        row: clip?.sheet?.row ?? 0,
        translateX: channel((pose) => (pose.x ?? 0) * size),
        translateY: channel((pose) => (pose.y ?? 0) * size),
        rotate: clock.interpolate({
          inputRange,
          outputRange: poses.map((pose) => `${pose.rotate ?? 0}deg`),
          extrapolate: 'clamp'
        }),
        scaleX: channel((pose) => pose.sx ?? 1),
        scaleY: channel((pose) => pose.sy ?? 1),
        opacity: channel((pose) => pose.opacity ?? 1),
        // A sombra encolhe e clareia quando o sprite sobe.
        shadowScale: channel((pose) => Math.max(0.45, 1 + (pose.y ?? 0) * 1.6)),
        shadowOpacity: channel((pose) => Math.max(0.12, 0.4 + (pose.y ?? 0) * 1.2))
      };
    }, [clip, clock, size]);

    return (
      <View style={{ width: size, height: size }} pointerEvents="none">
        {shadowColor ? (
          <Animated.View
            style={[
              styles.shadow,
              {
                width: size * 0.6,
                height: size * 0.14,
                left: size * 0.2,
                bottom: size * 0.01,
                borderRadius: size,
                backgroundColor: shadowColor,
                opacity: animated.shadowOpacity,
                transform: [{ scaleX: animated.shadowScale }]
              }
            ]}
          />
        ) : null}

        <Animated.View
          style={{
            width: size,
            height: size,
            opacity: animated.opacity,
            transform: [
              // Virar vem primeiro: os deslocamentos seguintes acompanham a direção.
              { scaleX: flipped ? -1 : 1 },
              { translateX: animated.translateX },
              { translateY: animated.translateY },
              { rotate: animated.rotate },
              { scaleX: animated.scaleX },
              { scaleY: animated.scaleY }
            ]
          }}
        >
          {/* Janela de um quadro: a folha inteira desliza por trás dela. */}
          <View style={[styles.window, { width: size, height: size }]}>
            <Animated.View
              style={{
                width: size * sheet.columns,
                height: size * sheet.rows,
                transform: [{ translateX: animated.frameX }, { translateY: -animated.row * size }]
              }}
            >
              <Image
                source={sheet.source}
                fadeDuration={0}
                resizeMode="stretch"
                style={{ width: size * sheet.columns, height: size * sheet.rows }}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute'
  },
  window: {
    overflow: 'hidden'
  }
});
