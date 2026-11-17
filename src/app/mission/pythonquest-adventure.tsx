import React, {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  Vibration,
  View
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import {
  Command,
  COMMAND_META,
  findShortestSolutionLength,
  getAvailableCommands,
  getDecorCells,
  getStarRating,
  getWallKeys,
  GRID_SIZE,
  isSamePosition,
  manhattan,
  positionKey,
  validateMission
} from '@/features/adventure/adventure.logic';
import { AnimatedSprite, SpriteHandle } from '@/features/adventure/AnimatedSprite';
import {
  BUG_CLIPS,
  COIN_CLIPS,
  getHeroWalk,
  HERO_CLIPS,
  HeroClip,
  PORTAL_CLIPS,
  SPRITE_SHEETS,
  SPRITE_SOURCES,
  WALL_CLIPS
} from '@/features/adventure/adventure.sprites';
import { Butterflies } from '@/features/adventure/characters/Butterflies';
import { Companion, CompanionMood } from '@/features/adventure/characters/Companion';
import {
  ENEMIES,
  EnemyCharacter,
  EnemyIcon,
  getEnemyKind
} from '@/features/adventure/characters/Enemies';
import {
  Achievement,
  ACHIEVEMENTS,
  AdventureProfile,
  applyWin,
  COINS_PER_CHEST,
  EMPTY_PROFILE,
  loadAdventureProfile,
  saveAdventureProfile
} from '@/features/adventure/adventureProfile';
import { Chest, Owl } from '@/features/adventure/characters/MapObjects';
import { BurstKind, ParticleBurst } from '@/features/adventure/characters/ParticleBurst';
import { CodeEditor } from '@/features/adventure/CodeEditor';
import {
  getExtraCells,
  getHint,
  getInitialCode,
  getMissionExtras,
  insertCodeLine,
  reviewCode,
  runAdventureCode,
  RunStep
} from '@/features/adventure/engine/adventure.engine';
import { CellPing, Flower } from '@/features/adventure/characters/Scenery';
import { useProgress } from '@/features/progress/ProgressContext';
import { getAdventureMissionsFromApi } from '@/services/learningApi';
import { colors, monoFont, radius, shadow, spacing } from '@/theme/colors';
import { AdventureMission, AdventurePosition } from '@/types/adventure';

type GameStatus = 'idle' | 'running' | 'success' | 'error';
type MessageTone = 'info' | 'success' | 'error';
type PopupTone = 'coin' | 'hit' | 'error';

type SuccessResult = {
  awardedXp: number;
  isLastMission: boolean;
  linesUsed: number;
  optimal: number | null;
  stars: number;
  coinsEarned: number;
  newAchievements: Achievement[];
  /** Comentários sobre o código vencedor. */
  notes: string[];
};

type Popup = {
  id: number;
  text: string;
  position: AdventurePosition;
  tone: PopupTone;
};

type Burst = {
  id: number;
  kind: BurstKind;
  position: AdventurePosition;
  /** Deslocamento do centro da casa, em frações da casa (ex.: 0.3 = pé do herói). */
  offsetY?: number;
};

type BoardIconName = keyof typeof SPRITE_SOURCES;

const HERO_TAP_REACTIONS: { clip: HeroClip; text: string }[] = [
  { clip: 'celebrate', text: 'Bora codar!' },
  { clip: 'collect', text: 'Sss!' },
  { clip: 'confused', text: 'Hã?' },
  { clip: 'celebrate', text: 'Oi!' }
];

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

const MOVE_DURATION_MS = 340;
const ATTACK_DURATION_MS = HERO_CLIPS.attack.duration;
/** Momento do bote dentro da animação de ataque (quadro desenhado 3 de 0..7). */
const ATTACK_IMPACT_AT = 0.42;
const STEP_GAP_MS = 70;
const MAX_BOARD_SIZE = 360;
const CHIP_SIZE = 44;
const CHIP_GAP = 6;
const MAX_UNDO = 50;
const COMPANION_SIZE = 46;
const MAX_LIVES = 3;
const EDITOR_HEIGHT = 128;

type Snippet = { label: string; code: string; icon?: ComponentProps<typeof Ionicons>['name'] };

/** Referência rápida mostrada no guia (tocar insere no código). */
const GUIDE: { title: string; items: { code: string; text: string }[] }[] = [
  {
    title: 'Ações do herói',
    items: [
      { code: 'hero.moveRight()', text: 'Anda 1 casa. Com número anda várias: hero.moveRight(3).' },
      { code: 'hero.collect()', text: 'Pega a moeda ou abre o baú da casa atual.' },
      { code: 'hero.attack()', text: 'Derrota o inimigo da casa atual.' },
      { code: 'hero.talk()', text: 'Conversa com a coruja quando ela está na casa ao lado.' },
      { code: 'hero.say("Oi!")', text: 'O herói fala um texto.' }
    ]
  },
  {
    title: 'Sensores (respondem True ou False)',
    items: [
      { code: 'hero.canMove("right")', text: 'O caminho está livre? Use "right", "left", "up" ou "down".' },
      { code: 'hero.enemyHere()', text: 'Há um inimigo nesta casa?' },
      { code: 'hero.enemyNear()', text: 'Há um inimigo nesta casa ou ao lado?' },
      { code: 'hero.onCoin()', text: 'A moeda está nesta casa?' },
      { code: 'hero.onChest()', text: 'Há um baú fechado nesta casa?' },
      { code: 'hero.atPortal()', text: 'O herói está no portal?' }
    ]
  },
  {
    title: 'Python',
    items: [
      { code: 'for i in range(3):', text: 'Repete o bloco de baixo 3 vezes.' },
      { code: 'while hero.canMove("down"):', text: 'Repete enquanto a condição for verdadeira.' },
      { code: 'if hero.enemyHere():', text: 'Só executa o bloco se a condição for verdadeira.' },
      { code: 'def caminho():', text: 'Cria uma função. Depois chame com caminho().' },
      { code: 'passos = 2', text: 'Guarda um valor numa variável.' }
    ]
  }
];

// Níveis de feedback (game-feel): a intensidade acompanha a importância do
// evento. Coletar é leve, atacar é médio (o hit-stop está nos quadros da
// animação de ataque), esbarrar avisa e vencer é o mais forte.
const FEEDBACK = {
  collect: { shake: 0, haptic: 15 },
  attack: { shake: 7, haptic: 35 },
  bump: { shake: 5, haptic: 60 },
  fail: { shake: 3, haptic: 40 },
  success: { shake: 0, haptic: [0, 40, 70, 40] }
} satisfies Record<string, { shake: number; haptic: number | number[] }>;

const POPUP_COLORS: Record<PopupTone, string> = {
  coin: '#B45309',
  hit: colors.secondaryDark,
  error: colors.danger
};

const EDIT_KEYS: {
  id: 'indent' | 'dedent' | 'delete' | 'clear';
  label: string;
  accessibilityLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'indent', label: 'recuar', accessibilityLabel: 'Aumentar o recuo da linha', icon: 'arrow-forward' },
  { id: 'dedent', label: 'voltar', accessibilityLabel: 'Diminuir o recuo da linha', icon: 'arrow-back' },
  { id: 'delete', label: 'linha', accessibilityLabel: 'Apagar a linha do cursor', icon: 'backspace-outline' },
  { id: 'clear', label: 'tudo', accessibilityLabel: 'Apagar todo o código', icon: 'trash-outline' }
];

class ExecutionStopped extends Error {}

function wait(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration));
}

function play(animation: Animated.CompositeAnimation) {
  return new Promise<void>((resolve) => animation.start(() => resolve()));
}

function haptic(pattern: number | number[]) {
  // No iOS a duração é ignorada e toda vibração dura ~400 ms, longa demais
  // para um feedback curto; por isso só vibra no Android.
  if (Platform.OS !== 'android' || pattern === 0) {
    return;
  }

  Vibration.vibrate(pattern);
}

function BoardIcon({ name, size }: { name: BoardIconName; size: `${number}%` | number }) {
  return (
    <Image source={SPRITE_SOURCES[name]} resizeMode="contain" style={{ width: size, height: size }} />
  );
}

function IconAction({
  icon,
  label,
  color = colors.textSecondary,
  disabled = false,
  onPress
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  color?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
        disabled && styles.disabled
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

export default function PythonQuestAdventureScreen() {
  const insets = useSafeAreaInsets();
  const { progress, isProgressLoading, completeSpecialMission } = useProgress();
  const { user } = useAuth();
  const profileOwner = user?.id ?? 'guest';

  // Valores de animação (só visual; nunca decidem a lógica do jogo).
  const heroPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const coinFx = useRef(new Animated.Value(0)).current;
  const bugFx = useRef(new Animated.Value(0)).current;
  const boardShake = useRef(new Animated.Value(0)).current;
  const popupAnimation = useRef(new Animated.Value(0)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const starsAnimation = useRef(new Animated.Value(0)).current;
  // Herói sendo sugado pelo portal ao vencer (0 = normal, 1 = sumiu).
  const heroPortalFx = useRef(new Animated.Value(0)).current;
  // Pulinho da moeda quando tocada.
  const coinPoke = useRef(new Animated.Value(0)).current;
  const burstIdRef = useRef(0);

  const heroPositionRef = useRef<AdventurePosition>({ row: 0, col: 0 });
  const cellSizeRef = useRef(0);
  const stopRequestedRef = useRef(false);
  // Trava síncrona: o estado `status` só muda na próxima renderização, então
  // dois toques rápidos em "Executar" passariam pela checagem de `isRunning`.
  const runningRef = useRef(false);
  const initialSelectionDoneRef = useRef(false);
  const speedRef = useRef(1);
  const reduceMotionRef = useRef(false);
  const popupIdRef = useRef(0);
  const stripRef = useRef<ScrollViewInstance>(null);

  // Sprites animados: cada um toca a animação da ação que a simulação decidiu.
  const heroSpriteRef = useRef<SpriteHandle>(null);
  const bugSpriteRef = useRef<SpriteHandle>(null);
  const goalSpriteRef = useRef<SpriteHandle>(null);
  const wallSpriteRefs = useRef(new Map<string, SpriteHandle>());

  const [missions, setMissions] = useState<AdventureMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [boardArea, setBoardArea] = useState({ width: 0, height: 0 });
  // O programa do aluno: código Python de verdade, executado pelo PythonLite.
  const [code, setCode] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [forcedCursor, setForcedCursor] = useState<number | null>(null);
  const cursorRef = useRef(0);
  const lastHistoryAtRef = useRef(0);

  // Execução passo a passo: o laço de execução espera o próximo toque em "Passo".
  const [paused, setPaused] = useState(false);
  const stepModeRef = useRef(false);
  const stepGateRef = useRef<(() => void) | null>(null);

  // Vidas da fase, dicas progressivas e extras do mapa.
  const [lives, setLives] = useState(MAX_LIVES);
  const livesLostRef = useRef(0);
  const hintLevelRef = useRef(0);
  const [chestsOpened, setChestsOpened] = useState<number[]>([]);
  const [owlTalkCount, setOwlTalkCount] = useState(0);

  // Moedas, recordes e conquistas (guardados no aparelho).
  const [profile, setProfile] = useState<AdventureProfile>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const profileRef = useRef<AdventureProfile>(EMPTY_PROFILE);
  const [showTrophies, setShowTrophies] = useState(false);
  const [hasCoin, setHasCoin] = useState(false);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [message, setMessage] = useState<{ text: string; tone: MessageTone }>({
    text: '',
    tone: 'info'
  });
  const [popup, setPopup] = useState<Popup | null>(null);
  const [heroFacing, setHeroFacing] = useState<'left' | 'right'>('right');
  const [showGuide, setShowGuide] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  // Casa onde o herói está (para o inimigo ficar em alerta e as borboletas fugirem).
  const [heroCell, setHeroCell] = useState<AdventurePosition>({ row: 0, col: 0 });
  const [bursts, setBursts] = useState<Burst[]>([]);
  // Casa apontada pela última dica do Byte (anéis pulsando sobre ela).
  const [hintTarget, setHintTarget] = useState<AdventurePosition | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mission = missions[selectedIndex];
  const enemyKind = getEnemyKind(selectedIndex);
  const enemy = ENEMIES[enemyKind];
  const isRunning = status === 'running';

  // Baús e coruja da fase (fixos por fase; nunca deixam a fase sem solução).
  const extras = useMemo(
    () => (mission ? getMissionExtras(mission, selectedIndex) : { chests: [], npc: null }),
    [mission, selectedIndex]
  );
  const completedIds = progress.completedSpecialMissionIds;

  const boardSize = useMemo(() => {
    const available = Math.min(boardArea.width, boardArea.height, MAX_BOARD_SIZE);
    return Math.floor(available / GRID_SIZE) * GRID_SIZE;
  }, [boardArea]);
  const cellSize = boardSize / GRID_SIZE;

  const availableCommands = useMemo(
    () => (mission ? getAvailableCommands(mission) : []),
    [mission]
  );

  const wallKeys = useMemo(() => (mission ? getWallKeys(mission) : new Set<string>()), [mission]);

  // Flores de enfeite em casas livres (fixas por fase).
  const decorKeys = useMemo(
    () => {
      const taken = new Set(getExtraCells(extras).map(positionKey));
      return new Set(
        mission
          ? getDecorCells(mission)
              .map(positionKey)
              .filter((key) => !taken.has(key))
          : []
      );
    },
    [mission, extras]
  );

  const optimalLines = useMemo(
    () => (mission ? findShortestSolutionLength(mission, availableCommands) : null),
    [mission, availableCommands]
  );

  // Prévia: o mesmo motor da execução roda a cada edição (é instantâneo) para
  // desenhar o trajeto planejado e contar as linhas do código.
  const preview = useMemo(
    () => (mission ? runAdventureCode(mission, extras, code) : null),
    [mission, extras, code]
  );

  const { plannedPath, plannedEnd } = useMemo(() => {
    const seen = new Set<string>();
    const path: AdventurePosition[] = [];
    const steps = preview?.steps ?? [];

    for (const step of steps) {
      if (step.effect === 'move' && !seen.has(positionKey(step.to))) {
        seen.add(positionKey(step.to));
        path.push(step.to);
      }
    }

    // Onde o herói realmente para (pode ser uma casa já visitada).
    const lastMove = [...steps].reverse().find((step) => step.effect === 'move');

    return { plannedPath: path, plannedEnd: lastMove ? lastMove.to : null };
  }, [preview]);

  // Carrega moedas, recordes, conquistas e códigos salvos do usuário.
  useEffect(() => {
    let active = true;
    setProfileLoaded(false);

    loadAdventureProfile(profileOwner).then((loaded) => {
      if (active) {
        profileRef.current = loaded;
        setProfile(loaded);
        setProfileLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, [profileOwner]);

  const updateProfile = useCallback(
    (next: AdventureProfile) => {
      profileRef.current = next;
      setProfile(next);
      saveAdventureProfile(profileOwner, next);
    },
    [profileOwner]
  );

  useEffect(() => {
    speedRef.current = fastMode ? 2 : 1;
  }, [fastMode]);

  // Acessibilidade: respeita "reduzir movimento" do sistema (sem tremida nem squash).
  useEffect(() => {
    const apply = (enabled: boolean) => {
      reduceMotionRef.current = enabled;
      setReduceMotion(enabled);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(apply)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);

    return () => subscription.remove();
  }, []);

  // Interrompe a execução se a tela for fechada no meio.
  useEffect(
    () => () => {
      stopRequestedRef.current = true;
      Vibration.cancel();
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    },
    []
  );

  const loadMissions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const missionsFromApi = await getAdventureMissionsFromApi();

      // Fases com dados quebrados (parede em cima de objeto, sem solução...)
      // ficam de fora em vez de travar o jogador numa fase impossível.
      const playable = missionsFromApi.filter((item) => {
        const { errors, warnings } = validateMission(item);

        if (warnings.length > 0) {
          console.warn(`[Adventure] Fase "${item.id}":`, warnings.join(' '));
        }

        if (errors.length > 0) {
          console.warn(`[Adventure] Fase "${item.id}" ignorada:`, errors.join(' '));
          return false;
        }

        return true;
      });

      setMissions(playable);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Não foi possível carregar as fases.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // Escolhe a primeira fase pendente só depois que fases E progresso
  // carregaram; antes disso o progresso ainda está vazio.
  useEffect(() => {
    if (initialSelectionDoneRef.current || isProgressLoading || missions.length === 0) {
      return;
    }

    initialSelectionDoneRef.current = true;
    const firstPending = missions.findIndex(
      (item) => !progress.completedSpecialMissionIds.includes(item.id)
    );
    setSelectedIndex(firstPending === -1 ? 0 : firstPending);
  }, [missions, isProgressLoading, progress.completedSpecialMissionIds]);

  const toPixels = useCallback(
    (position: AdventurePosition) => ({
      x: position.col * cellSizeRef.current,
      y: position.row * cellSizeRef.current
    }),
    []
  );

  const placeHero = useCallback(
    (position: AdventurePosition) => {
      heroPositionRef.current = position;
      heroPosition.setValue(toPixels(position));
      setHeroCell(position);
    },
    [heroPosition, toPixels]
  );

  // Reposiciona o herói quando o tabuleiro muda de tamanho.
  useEffect(() => {
    cellSizeRef.current = cellSize;
    placeHero(heroPositionRef.current);
  }, [cellSize, placeHero]);

  const resetBoard = useCallback(() => {
    if (!mission) {
      return;
    }

    setStatus('idle');
    setHasCoin(false);
    setEnemyDefeated(false);
    setActiveLine(null);
    setErrorLine(null);
    setChestsOpened([]);
    setPaused(false);
    setPopup(null);
    setHeroFacing('right');
    heroSpriteRef.current?.reset();
    bugSpriteRef.current?.reset();
    goalSpriteRef.current?.reset();
    coinFx.setValue(0);
    bugFx.setValue(0);
    boardShake.setValue(0);
    heroPortalFx.setValue(0);
    setBursts([]);
    setHintTarget(null);
    placeHero(mission.startPosition);
  }, [mission, placeHero, coinFx, bugFx, boardShake, heroPortalFx]);

  useEffect(() => {
    if (!mission) {
      return;
    }

    if (!profileLoaded) {
      return;
    }

    // Continua do código salvo da fase; na primeira vez, usa o código inicial da API.
    setCode(profileRef.current.savedCode[mission.id] ?? getInitialCode(mission));
    setHistory([]);
    setSuccessResult(null);
    setLives(MAX_LIVES);
    livesLostRef.current = 0;
    hintLevelRef.current = 0;
    setOwlTalkCount(0);
    setMessage({ text: mission.subtitle || 'Escreva o código e toque em Executar.', tone: 'info' });
    resetBoard();
    // Recarrega apenas quando a fase muda (ou quando o perfil termina de carregar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission, profileLoaded]);

  // Cartão de vitória entra com mola e as estrelas aparecem uma a uma.
  useEffect(() => {
    if (!successResult) {
      successAnimation.setValue(0);
      starsAnimation.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.spring(successAnimation, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true
      }),
      Animated.timing(starsAnimation, {
        toValue: 3,
        duration: reduceMotionRef.current ? 0 : 750,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ]).start();
  }, [successResult, successAnimation, starsAnimation]);

  function handleBoardLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBoardArea((current) =>
      current.width === width && current.height === height ? current : { width, height }
    );
  }

  function isMissionUnlocked(index: number) {
    return index === 0 || completedIds.includes(missions[index - 1]?.id);
  }

  // ---------------------------------------------------------------------
  // Edição com histórico de desfazer
  // ---------------------------------------------------------------------

  /** Aplica um novo código. `record` força um ponto de desfazer (ações por botão). */
  function applyCode(next: string, record: boolean) {
    if (runningRef.current || next === code) {
      return;
    }

    const now = Date.now();

    // Ao digitar, guarda um ponto de desfazer a cada pausa (não a cada letra).
    if (record || now - lastHistoryAtRef.current > 1200) {
      setHistory((current) => [...current.slice(-(MAX_UNDO - 1)), code]);
    }

    lastHistoryAtRef.current = now;
    setCode(next);

    if (status !== 'idle' || errorLine !== null) {
      resetBoard();
    }
  }

  function moveCursor(position: number) {
    cursorRef.current = position;
    setForcedCursor(position);
  }

  function handleTyping(next: string) {
    // Enter: mantém o recuo da linha de cima e recua mais se ela abre um bloco (":").
    const at = cursorRef.current;

    if (
      next.length === code.length + 1 &&
      next[at] === '\n' &&
      next.slice(0, at) === code.slice(0, at) &&
      next.slice(at + 1) === code.slice(at)
    ) {
      const lineStart = code.lastIndexOf('\n', at - 1) + 1;
      const line = code.slice(lineStart, at);
      const indent = /^ */.exec(line)![0] + (line.trimEnd().endsWith(':') ? '    ' : '');

      if (indent) {
        applyCode(next.slice(0, at + 1) + indent + next.slice(at + 1), false);
        moveCursor(at + 1 + indent.length);
        return;
      }
    }

    applyCode(next, false);
  }

  function insertSnippet(text: string) {
    if (isRunning) {
      return;
    }

    const result = insertCodeLine(code, cursorRef.current, text);
    applyCode(result.code, true);
    moveCursor(result.cursor);
  }

  /** Recua (+1) ou desfaz o recuo (-1) da linha do cursor. */
  function shiftIndent(delta: 1 | -1) {
    if (isRunning) {
      return;
    }

    const at = cursorRef.current;
    const lineStart = code.lastIndexOf('\n', at - 1) + 1;

    if (delta > 0) {
      applyCode(code.slice(0, lineStart) + '    ' + code.slice(lineStart), true);
      moveCursor(at + 4);
      return;
    }

    const spaces = Math.min(4, /^ */.exec(code.slice(lineStart))![0].length);

    if (spaces > 0) {
      applyCode(code.slice(0, lineStart) + code.slice(lineStart + spaces), true);
      moveCursor(Math.max(lineStart, at - spaces));
    }
  }

  function deleteCurrentLine() {
    if (isRunning || code.length === 0) {
      return;
    }

    const at = cursorRef.current;
    const lineStart = code.lastIndexOf('\n', at - 1) + 1;
    const lineEnd = code.indexOf('\n', at);
    const next =
      lineEnd === -1
        ? code.slice(0, Math.max(0, lineStart - 1))
        : code.slice(0, lineStart) + code.slice(lineEnd + 1);

    applyCode(next, true);
    moveCursor(Math.min(lineStart, next.length));
  }

  function replaceCode(next: string, text: string) {
    if (isRunning) {
      return;
    }

    applyCode(next, true);
    moveCursor(next.length);
    setMessage({ text, tone: 'info' });
  }

  function undoEdit() {
    if (isRunning || history.length === 0) {
      return;
    }

    const previous = history[history.length - 1];
    setCode(previous);
    setHistory((current) => current.slice(0, -1));
    moveCursor(Math.min(cursorRef.current, previous.length));
    resetBoard();
    setMessage({ text: 'Última alteração desfeita.', tone: 'info' });
  }

  // ---------------------------------------------------------------------
  // Feedback visual (game-feel)
  // ---------------------------------------------------------------------

  const scaled = (duration: number) => duration / speedRef.current;

  function shakeBoard(intensity: number) {
    if (intensity <= 0 || reduceMotionRef.current) {
      return;
    }

    // Tremida que decai até parar sozinha; mexe só no visual do tabuleiro.
    boardShake.setValue(0);
    Animated.sequence(
      [1, -0.75, 0.5, -0.3, 0.15, 0].map((factor) =>
        Animated.timing(boardShake, {
          toValue: factor * intensity,
          duration: 45,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      )
    ).start();
  }

  function showPopup(text: string, position: AdventurePosition, tone: PopupTone) {
    popupIdRef.current += 1;
    const id = popupIdRef.current;

    setPopup({ id, text, position, tone });
    popupAnimation.setValue(0);
    Animated.timing(popupAnimation, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && popupIdRef.current === id) {
        setPopup(null);
      }
    });
  }

  function playHero(clip: keyof typeof HERO_CLIPS, duration?: number) {
    return heroSpriteRef.current?.play(clip, { duration }) ?? Promise.resolve();
  }

  /** Dispara uma explosão de partículas (só enfeite; não segura a execução). */
  function spawnBurst(kind: BurstKind, position: AdventurePosition, offsetY = 0) {
    if (reduceMotionRef.current) {
      return;
    }

    burstIdRef.current += 1;
    const id = burstIdRef.current;
    setBursts((current) => [...current.slice(-7), { id, kind, position, offsetY }]);
  }

  function removeBurst(id: number) {
    setBursts((current) => current.filter((burst) => burst.id !== id));
  }

  // ---------------------------------------------------------------------
  // Toques nos personagens (só fora da execução)
  // ---------------------------------------------------------------------

  function pokeHero() {
    if (runningRef.current) {
      return;
    }

    const reaction = pick(HERO_TAP_REACTIONS);
    haptic(FEEDBACK.collect.haptic);
    showPopup(reaction.text, heroPositionRef.current, 'hit');
    playHero(reaction.clip);
  }

  function pokeEnemy() {
    if (runningRef.current || !mission) {
      return;
    }

    haptic(FEEDBACK.collect.haptic);
    showPopup(pick(enemy.taunts), mission.enemyPosition, 'error');
    bugSpriteRef.current?.play('taunt');
  }

  function pokeCoin() {
    if (runningRef.current || !mission) {
      return;
    }

    haptic(FEEDBACK.collect.haptic);
    spawnBurst('sparkle', mission.coinPosition);

    if (!reduceMotionRef.current) {
      coinPoke.setValue(0);
      Animated.timing(coinPoke, {
        toValue: 1,
        duration: 520,
        easing: Easing.linear,
        useNativeDriver: true
      }).start();
    }
  }

  function askCompanion() {
    if (!mission || runningRef.current) {
      return;
    }

    // Cada toque aprofunda a dica: 1) onde está o objetivo, 2) o conceito de
    // Python que ajuda, 3) só os dois próximos comandos. Nunca a solução inteira.
    const level = Math.min(3, hintLevelRef.current + 1) as 1 | 2 | 3;
    hintLevelRef.current = level;

    const hint = getHint(mission, extras, code, level, enemy.subject);
    setMessage({ text: `Dica ${level}/3: ${hint.text}`, tone: 'info' });

    // Mostra no tabuleiro onde fica o próximo objetivo por alguns segundos.
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
    setHintTarget(hint.target ?? null);
    hintTimerRef.current = setTimeout(() => setHintTarget(null), 4000);
  }

  function pokeOwl() {
    if (runningRef.current || !extras.npc) {
      return;
    }

    haptic(FEEDBACK.collect.haptic);
    setOwlTalkCount((count) => count + 1);
    showPopup('hero.talk()', extras.npc, 'hit');
    setMessage({
      text: 'Coruja: pare numa casa ao meu lado e use hero.talk(). Tenho um segredo de Python!',
      tone: 'info'
    });
  }

  async function moveHero(from: AdventurePosition, to: AdventurePosition) {
    heroPositionRef.current = to;
    const duration = scaled(MOVE_DURATION_MS);
    const walk = getHeroWalk(from, to);

    if (walk.facing) {
      setHeroFacing(walk.facing);
    }

    // Poeirinha no pé, na casa de onde saiu.
    spawnBurst('dust', from, 0.32);

    // O deslocamento no tabuleiro e a animação do passo (lado/cima/baixo)
    // têm a mesma duração, então o herói aterrissa exatamente na casa.
    await Promise.all([
      play(
        Animated.timing(heroPosition, {
          toValue: toPixels(to),
          duration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        })
      ),
      playHero(walk.clip, duration)
    ]);

    setHeroCell(to);
  }

  /** Avisa que o herói entrou na casa do inimigo: ele precisa atacar antes de sair. */
  function warnBugAhead(position: AdventurePosition) {
    haptic(FEEDBACK.collect.haptic);
    showPopup(enemy.warning, position, 'hit');
  }

  async function bumpHero(from: AdventurePosition, toward: AdventurePosition) {
    const origin = toPixels(from);
    const push = cellSizeRef.current * 0.32;
    const facing = getHeroWalk(from, toward).facing;

    if (facing) {
      setHeroFacing(facing);
    }

    await play(
      Animated.timing(heroPosition, {
        toValue: {
          x: origin.x + (toward.col - from.col) * push,
          y: origin.y + (toward.row - from.row) * push
        },
        duration: scaled(140),
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      })
    );

    // Impacto: herói machucado, parede (se houver) treme e solta poeira.
    const hurt = playHero('hurt', scaled(HERO_CLIPS.hurt.duration));
    wallSpriteRefs.current.get(positionKey(toward))?.play('hit', { duration: scaled(300) });
    spawnBurst('dust', from, 0.1);
    shakeBoard(FEEDBACK.bump.shake);
    haptic(FEEDBACK.bump.haptic);
    showPopup('Ai!', from, 'error');

    await Promise.all([
      play(
        Animated.timing(heroPosition, {
          toValue: origin,
          duration: scaled(280),
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true
        })
      ),
      hurt
    ]);
  }

  async function collectCoin(position: AdventurePosition) {
    haptic(FEEDBACK.collect.haptic);
    showPopup('+1 moeda', position, 'coin');
    spawnBurst('sparkle', position);

    await Promise.all([
      playHero('collect', scaled(HERO_CLIPS.collect.duration)),
      play(
        Animated.timing(coinFx, {
          toValue: 1,
          duration: scaled(320),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      )
    ]);

    setHasCoin(true);
  }

  async function defeatBug(position: AdventurePosition) {
    const duration = scaled(ATTACK_DURATION_MS);
    const attack = playHero('attack', duration);

    // Espera o quadro do golpe para disparar o impacto junto com ele.
    await wait(duration * ATTACK_IMPACT_AT);
    haptic(FEEDBACK.attack.haptic);
    shakeBoard(FEEDBACK.attack.shake);
    showPopup(enemy.defeated, position, 'hit');
    await bugSpriteRef.current?.play('hit', { duration: scaled(BUG_CLIPS.hit.duration) });

    // Achata e some numa nuvem de fumaça com estrelinhas.
    spawnBurst('poof', position);
    spawnBurst('sparkle', position);

    await Promise.all([
      attack,
      play(
        Animated.timing(bugFx, {
          toValue: 1,
          duration: scaled(360),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      )
    ]);

    setEnemyDefeated(true);
  }

  async function celebrateHero() {
    haptic(FEEDBACK.success.haptic);
    goalSpriteRef.current?.play('enter');
    spawnBurst('confetti', heroPositionRef.current);
    await playHero('celebrate');

    // O portal puxa o herói: gira, encolhe e some.
    spawnBurst('sparkle', heroPositionRef.current);

    if (!reduceMotionRef.current) {
      await play(
        Animated.timing(heroPortalFx, {
          toValue: 1,
          duration: 520,
          easing: Easing.in(Easing.back(1.6)),
          useNativeDriver: true
        })
      );
    }
  }

  // ---------------------------------------------------------------------
  // Execução: simula primeiro, depois reproduz o resultado na tela
  // ---------------------------------------------------------------------

  async function openChest(step: RunStep) {
    haptic(FEEDBACK.collect.haptic);
    showPopup(`+${COINS_PER_CHEST} moedas`, step.to, 'coin');
    spawnBurst('sparkle', step.to);
    setChestsOpened((current) => [...current, step.chestIndex ?? 0]);
    await playHero('collect', scaled(HERO_CLIPS.collect.duration));
  }

  async function talkToOwl(step: RunStep) {
    haptic(FEEDBACK.collect.haptic);
    setOwlTalkCount((count) => count + 1);
    showPopup('Hu-hu!', extras.npc ?? step.to, 'hit');
    setMessage({ text: `Coruja: ${step.text ?? ''}`, tone: 'info' });
    await wait(scaled(1500));
  }

  function releaseStepGate() {
    const gate = stepGateRef.current;
    stepGateRef.current = null;
    gate?.();
  }

  function stopRun() {
    stopRequestedRef.current = true;
    releaseStepGate();
  }

  // ---------------------------------------------------------------------
  // Execução: o motor roda o código inteiro primeiro; a tela reproduz os
  // passos, destacando a linha de cada um. Em modo "passo", espera um toque
  // entre um passo e outro.
  // ---------------------------------------------------------------------

  async function runCode(mode: 'run' | 'step') {
    if (!mission) {
      return;
    }

    if (runningRef.current) {
      // Já em execução: "Passo" avança um; "Continuar" segue até o fim.
      stepModeRef.current = mode === 'step';
      releaseStepGate();
      return;
    }

    runningRef.current = true;
    stepModeRef.current = mode === 'step';
    resetBoard();
    stopRequestedRef.current = false;
    setStatus('running');

    // Guarda o código da fase para continuar depois.
    updateProfile({
      ...profileRef.current,
      savedCode: { ...profileRef.current.savedCode, [mission.id]: code }
    });

    const result = runAdventureCode(mission, extras, code);
    const sourceLines = code.split('\n');
    const lineText = (line: number) => (sourceLines[line - 1] ?? '').trim();
    const ensureNotStopped = () => {
      if (stopRequestedRef.current) {
        throw new ExecutionStopped();
      }
    };

    try {
      let bugDefeatedSoFar = false;

      for (let position = 0; position < result.steps.length; position += 1) {
        const step = result.steps[position];
        const nextStep = result.steps[position + 1];

        ensureNotStopped();
        setActiveLine(step.line);
        setMessage({ text: `${step.line} | ${lineText(step.line)}`, tone: 'info' });

        if (step.effect === 'move') {
          await moveHero(step.from, step.to);

          if (!bugDefeatedSoFar && isSamePosition(step.to, mission.enemyPosition)) {
            warnBugAhead(step.to);
          }
        } else if (step.effect === 'collect') {
          await collectCoin(step.to);
        } else if (step.effect === 'attack') {
          await defeatBug(step.to);
          bugDefeatedSoFar = true;
        } else if (step.effect === 'chest') {
          await openChest(step);
        } else if (step.effect === 'talk') {
          await talkToOwl(step);
        } else {
          showPopup(step.text || '...', step.to, 'hit');
          await wait(scaled(650));
        }

        if (stepModeRef.current && nextStep) {
          // Passo a passo: espera o próximo toque.
          setPaused(true);
          await new Promise<void>((resolve) => {
            stepGateRef.current = resolve;
          });
          setPaused(false);
        } else if (!(step.effect === 'move' && nextStep?.effect === 'move')) {
          // Entre dois passos seguidos o herói continua andando; a pausa faria
          // o quadro parado aparecer por um instante (efeito de "piscar").
          await wait(scaled(STEP_GAP_MS));
        }
      }

      ensureNotStopped();

      if (result.error) {
        const { error } = result;

        if (error.line !== null) {
          setActiveLine(error.line);
          setMessage({ text: `${error.line} | ${lineText(error.line)}`, tone: 'info' });
        }

        if (error.bumpToward) {
          await bumpHero(heroPositionRef.current, error.bumpToward);
        } else {
          shakeBoard(FEEDBACK.fail.shake);
          haptic(FEEDBACK.fail.haptic);
          showPopup('?', heroPositionRef.current, 'error');
          await playHero('confused', scaled(HERO_CLIPS.confused.duration));
        }

        // Cada tentativa que falha custa uma vida. Sem vidas, elas recarregam
        // e o ajudante libera a dica mais direta (errar faz parte de aprender).
        livesLostRef.current += 1;
        const remaining = lives - 1;
        let afterLives = '';

        if (remaining <= 0) {
          setLives(MAX_LIVES);
          hintLevelRef.current = 2;
          afterLives = ' Vidas recarregadas: toque no Byte para uma dica mais direta.';
        } else {
          setLives(remaining);
        }

        const printed =
          result.output.length > 0 ? ` (print: ${result.output.slice(-2).join(' | ')})` : '';

        setStatus('error');
        setActiveLine(null);
        // Erros de fim de programa não são culpa de nenhuma linha específica.
        setErrorLine(error.line);
        setMessage({
          text: `${error.line !== null ? `Linha ${error.line}: ` : ''}${error.message}${printed}${afterLives}`,
          tone: 'error'
        });
        return;
      }

      await celebrateHero();
      setStatus('success');
      setActiveLine(null);
      setMessage({ text: 'Fase concluída!', tone: 'success' });

      const awardedXp = await completeSpecialMission({
        missionId: mission.id,
        earnedXp: mission.xp,
        badge: mission.badge
      });

      const stars = getStarRating(result.codeLines, optimalLines);
      const outcome = applyWin(profileRef.current, {
        missionId: mission.id,
        stars,
        lines: result.codeLines,
        actions: result.steps.length,
        usage: result.usage,
        livesLost: livesLostRef.current,
        chestsOpened: result.state.chestsOpened.flatMap((opened, index) => (opened ? [index] : [])),
        talkedToOwl: result.state.talked
      });
      updateProfile(outcome.profile);

      setSuccessResult({
        awardedXp,
        isLastMission: selectedIndex >= missions.length - 1,
        linesUsed: result.codeLines,
        optimal: optimalLines,
        stars,
        coinsEarned: outcome.coinsEarned,
        newAchievements: outcome.newAchievements,
        notes: reviewCode(code, result, optimalLines)
      });
    } catch (error) {
      if (error instanceof ExecutionStopped) {
        // Volta tudo ao início: moeda/bug de uma execução pela metade não contam.
        resetBoard();
        setMessage({ text: 'Execução interrompida.', tone: 'info' });
        return;
      }

      setStatus('error');
      setActiveLine(null);
      setMessage({
        text: error instanceof Error ? error.message : 'Não foi possível salvar o progresso.',
        tone: 'error'
      });
    } finally {
      runningRef.current = false;
      stepGateRef.current = null;
      setPaused(false);
    }
  }

  // O progresso só segura a tela na entrada (para escolher a fase certa);
  // depois disso, um recarregamento dele não pode desmontar o tabuleiro.
  if (isLoading || (isProgressLoading && !initialSelectionDoneRef.current)) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return (
      <Screen>
        <StateView
          variant="error"
          title="Não conseguimos carregar"
          message={loadError}
          actionLabel="Tentar novamente"
          onAction={loadMissions}
        />
      </Screen>
    );
  }

  if (!mission) {
    return (
      <Screen>
        <StateView
          variant="empty"
          icon="map-outline"
          title="Nenhuma fase disponível"
          message="Novas fases do Adventure aparecerão aqui em breve."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const objectives: { icon: React.ReactNode; label: string; done: boolean }[] = [
    { icon: <BoardIcon name="coin" size={20} />, label: 'Moeda', done: hasCoin },
    { icon: <EnemyIcon kind={enemyKind} size={22} />, label: enemy.name, done: enemyDefeated },
    { icon: <BoardIcon name="goal" size={20} />, label: 'Portal', done: status === 'success' }
  ];
  const portalReady = hasCoin && enemyDefeated;

  const snippets: Snippet[] = [
    ...availableCommands.map((command) => ({
      label: `${command}()`,
      code: `hero.${command}()`,
      icon: COMMAND_META[command].icon
    })),
    { label: 'for', code: 'for i in range(3):' },
    { label: 'while', code: 'while hero.canMove("right"):' },
    { label: 'if', code: 'if hero.enemyHere():' },
    { label: 'def', code: 'def caminho():' },
    ...(extras.chests.length > 0 ? [{ label: 'onChest', code: 'if hero.onChest():' }] : []),
    ...(extras.npc ? [{ label: 'talk()', code: 'hero.talk()' }] : [])
  ];

  // Ranking pessoal: fases vencidas, da melhor para a pior marca.
  const rankedRecords = missions
    .map((item, index) => ({
      id: item.id,
      number: index + 1,
      title: item.title,
      record: profile.records[item.id]
    }))
    .filter((item) => Boolean(item.record))
    .sort((a, b) => b.record.stars - a.record.stars || a.record.lines - b.record.lines);
  const popupWidth = cellSize * 3;
  const canPoke = !isRunning && status !== 'success';
  const enemyAlert =
    !enemyDefeated &&
    Math.abs(heroCell.row - mission.enemyPosition.row) +
      Math.abs(heroCell.col - mission.enemyPosition.col) <=
      1;
  const companionMood: CompanionMood =
    status === 'running'
      ? 'thinking'
      : status === 'success'
        ? 'happy'
        : status === 'error'
          ? 'worried'
          : 'idle';

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => setShowTrophies(true)}
              accessibilityRole="button"
              accessibilityLabel={`${profile.coins} moedas. Abrir conquistas e recordes.`}
              hitSlop={8}
              style={styles.wallet}
            >
              <BoardIcon name="coin" size={18} />
              <Text style={styles.walletText}>{profile.coins}</Text>
              <Ionicons name="trophy" size={15} color={colors.warning} />
            </Pressable>
          )
        }}
      />

      {/* Fases */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.phaseScroll}
        contentContainerStyle={styles.phaseRow}
      >
        {missions.map((item, index) => {
          const selected = index === selectedIndex;
          const completed = completedIds.includes(item.id);
          const unlocked = isMissionUnlocked(index);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Fase ${index + 1}: ${item.title}${!unlocked ? ', bloqueada' : completed ? ', concluída' : ''}`}
              accessibilityState={{ selected, disabled: !unlocked || isRunning }}
              disabled={!unlocked || isRunning}
              onPress={() => setSelectedIndex(index)}
              hitSlop={4}
              style={[
                styles.phaseChip,
                selected && styles.phaseChipSelected,
                completed && !selected && styles.phaseChipDone,
                !unlocked && styles.phaseChipLocked
              ]}
            >
              {!unlocked ? (
                <Ionicons name="lock-closed" size={13} color={colors.muted} />
              ) : completed ? (
                <Ionicons name="checkmark" size={14} color={selected ? '#86EFAC' : colors.primaryDark} />
              ) : null}
              <Text style={[styles.phaseText, selected && styles.phaseTextSelected]}>
                {index + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Missão e objetivos */}
      <View style={styles.missionBar}>
        <View style={styles.missionInfo}>
          <Text style={styles.missionTitle} numberOfLines={1}>
            {mission.title}
          </Text>
          <View style={styles.missionMeta}>
            <Text style={styles.missionXp}>
              <Ionicons name="flash" size={12} color={colors.warning} /> {mission.xp} XP
            </Text>
            {optimalLines !== null ? (
              <Text
                style={[
                  styles.missionGoal,
                  // Verde só depois de vencer: poucas linhas não significam programa certo.
                  status === 'success' &&
                    (preview?.codeLines ?? 0) <= optimalLines &&
                    styles.missionGoalMet
                ]}
                accessibilityLabel={`Meta: ${optimalLines} linhas. Você está usando ${preview?.codeLines ?? 0}.`}
              >
                <Ionicons name="star" size={11} color={colors.accent} /> {preview?.codeLines ?? 0}/
                {optimalLines} linhas
              </Text>
            ) : null}
            <View
              style={styles.lives}
              accessible
              accessibilityLabel={`${lives} de ${MAX_LIVES} vidas`}
            >
              {Array.from({ length: MAX_LIVES }, (_, index) => (
                <Ionicons
                  key={index}
                  name={index < lives ? 'heart' : 'heart-outline'}
                  size={13}
                  color={index < lives ? colors.heart : colors.locked}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.objectives}>
          {objectives.map((objective) => (
            <View
              key={objective.label}
              style={[styles.objective, objective.done && styles.objectiveDone]}
              accessible
              accessibilityLabel={`${objective.label}: ${objective.done ? 'concluído' : 'pendente'}`}
            >
              {objective.icon}
              {objective.done ? (
                <View style={styles.objectiveCheck}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Tabuleiro: ocupa todo o espaço que sobrar */}
      <View style={styles.boardArea} onLayout={handleBoardLayout}>
        {boardSize > 0 ? (
          <Animated.View
            style={{ width: boardSize, height: boardSize, transform: [{ translateX: boardShake }] }}
          >
            <View style={[styles.board, { width: boardSize, height: boardSize }]}>
              {Array.from({ length: GRID_SIZE }, (_, row) => (
                <View key={row} style={styles.row}>
                  {Array.from({ length: GRID_SIZE }, (__, col) => {
                    const isGoal = isSamePosition({ row, col }, mission.goalPosition);
                    const wallKey = positionKey({ row, col });
                    const isWall = wallKeys.has(wallKey);
                    const hasFlower = decorKeys.has(wallKey);

                    return (
                      <View
                        key={col}
                        style={[
                          styles.cell,
                          { width: cellSize, height: cellSize },
                          (row + col) % 2 === 1 && styles.cellAlt,
                          isGoal && styles.goalCell,
                          isGoal && portalReady && styles.goalCellReady,
                          isWall && styles.wallCell
                        ]}
                      >
                        {isGoal ? (
                          <AnimatedSprite
                            ref={goalSpriteRef}
                            sheet={SPRITE_SHEETS.portal}
                            size={cellSize * 0.88}
                            clips={PORTAL_CLIPS}
                            loopClip={portalReady ? 'open' : 'idle'}
                            reduceMotion={reduceMotion}
                          />
                        ) : null}
                        {isWall ? (
                          <AnimatedSprite
                            ref={(handle) => {
                              if (handle) {
                                wallSpriteRefs.current.set(wallKey, handle);
                              } else {
                                wallSpriteRefs.current.delete(wallKey);
                              }
                            }}
                            sheet={SPRITE_SHEETS.wall}
                            size={cellSize * 0.96}
                            clips={WALL_CLIPS}
                            loopClip="idle"
                            reduceMotion={reduceMotion}
                          />
                        ) : null}
                        {hasFlower ? (
                          <View style={styles.flowerSpot} pointerEvents="none">
                            <Flower
                              size={cellSize * 0.42}
                              variant={row * GRID_SIZE + col}
                              // Pula de alegria quando o herói passa ao lado.
                              excited={
                                Math.abs(heroCell.row - row) + Math.abs(heroCell.col - col) <= 1
                              }
                              reduceMotion={reduceMotion}
                            />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Trajeto planejado pelo código atual */}
              {showPath && status !== 'success'
                ? plannedPath.map((cell) => {
                    const isEnd = plannedEnd !== null && isSamePosition(cell, plannedEnd);
                    const dot = cellSize * (isEnd ? 0.3 : 0.18);

                    return (
                      <View
                        key={`path-${positionKey(cell)}`}
                        pointerEvents="none"
                        style={[
                          styles.layer,
                          {
                            width: cellSize,
                            height: cellSize,
                            transform: [
                              { translateX: cell.col * cellSize },
                              { translateY: cell.row * cellSize }
                            ]
                          }
                        ]}
                      >
                        <View
                          style={[
                            isEnd ? styles.pathEnd : styles.pathDot,
                            { width: dot, height: dot, borderRadius: dot / 2 }
                          ]}
                        />
                      </View>
                    );
                  })
                : null}
            </View>

            {/* Personagens ficam fora do recorte do tabuleiro para pulos e golpes não serem cortados.
                Fora da execução, tocar neles gera uma reação. */}
            <View pointerEvents="box-none" style={styles.entities}>
              {extras.chests.map((chest, index) => (
                <View
                  key={`chest-${index}`}
                  pointerEvents="none"
                  style={[
                    styles.layer,
                    {
                      width: cellSize,
                      height: cellSize,
                      transform: [
                        { translateX: chest.col * cellSize },
                        { translateY: chest.row * cellSize }
                      ]
                    }
                  ]}
                >
                  <Chest
                    size={cellSize * 0.72}
                    opened={chestsOpened.includes(index)}
                    reduceMotion={reduceMotion}
                  />
                </View>
              ))}

              {extras.npc ? (
                <View
                  pointerEvents={canPoke ? 'auto' : 'none'}
                  style={[
                    styles.layer,
                    {
                      width: cellSize,
                      height: cellSize,
                      transform: [
                        { translateX: extras.npc.col * cellSize },
                        { translateY: extras.npc.row * cellSize }
                      ]
                    }
                  ]}
                >
                  <Pressable
                    onPress={pokeOwl}
                    accessibilityRole="button"
                    accessibilityLabel="Coruja. Converse com hero.talk() numa casa ao lado."
                    style={styles.pokeArea}
                  >
                    <Owl
                      size={cellSize * 0.84}
                      attentive={manhattan(heroCell, extras.npc) === 1}
                      talkCount={owlTalkCount}
                      reduceMotion={reduceMotion}
                    />
                  </Pressable>
                </View>
              ) : null}

              {!hasCoin ? (
                <Animated.View
                  pointerEvents={canPoke ? 'auto' : 'none'}
                  style={[
                    styles.layer,
                    {
                      width: cellSize,
                      height: cellSize,
                      opacity: coinFx.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                      transform: [
                        { translateX: mission.coinPosition.col * cellSize },
                        { translateY: mission.coinPosition.row * cellSize },
                        {
                          translateY: coinFx.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -cellSize * 0.6]
                          })
                        },
                        {
                          translateY: coinPoke.interpolate({
                            inputRange: [0, 0.4, 0.75, 1],
                            outputRange: [0, -cellSize * 0.3, cellSize * 0.03, 0]
                          })
                        },
                        { scale: coinFx.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
                        {
                          rotate: coinFx.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '25deg'] })
                        }
                      ]
                    }
                  ]}
                >
                  <Pressable
                    onPress={pokeCoin}
                    accessibilityRole="button"
                    accessibilityLabel="Moeda"
                    style={styles.pokeArea}
                  >
                    <AnimatedSprite
                      sheet={SPRITE_SHEETS.coin}
                      size={cellSize * 0.6}
                      clips={COIN_CLIPS}
                      loopClip="idle"
                      reduceMotion={reduceMotion}
                    />
                  </Pressable>
                </Animated.View>
              ) : null}

              {!enemyDefeated ? (
                <Animated.View
                  pointerEvents={canPoke ? 'auto' : 'none'}
                  style={[
                    styles.layer,
                    {
                      width: cellSize,
                      height: cellSize,
                      opacity: bugFx.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [1, 0.8, 0]
                      }),
                      transform: [
                        { translateX: mission.enemyPosition.col * cellSize },
                        { translateY: mission.enemyPosition.row * cellSize },
                        // Achatado pelo golpe: alarga, desce e some.
                        {
                          translateY: bugFx.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, cellSize * 0.3]
                          })
                        },
                        { scaleX: bugFx.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.35, 1.5] }) },
                        { scaleY: bugFx.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.45, 0.1] }) }
                      ]
                    }
                  ]}
                >
                  <Pressable
                    onPress={pokeEnemy}
                    accessibilityRole="button"
                    accessibilityLabel={enemy.name}
                    style={styles.pokeArea}
                  >
                    <EnemyCharacter
                      key={enemyKind}
                      ref={bugSpriteRef}
                      kind={enemyKind}
                      size={cellSize * 0.84}
                      alert={enemyAlert}
                      reduceMotion={reduceMotion}
                      gazeTarget={heroPosition}
                      origin={{
                        x: mission.enemyPosition.col * cellSize,
                        y: mission.enemyPosition.row * cellSize
                      }}
                      reach={cellSize * 2}
                    />
                  </Pressable>
                </Animated.View>
              ) : null}

              <Animated.View
                pointerEvents={canPoke ? 'auto' : 'none'}
                style={[
                  styles.layer,
                  {
                    width: cellSize,
                    height: cellSize,
                    opacity: heroPortalFx.interpolate({
                      inputRange: [0, 0.7, 1],
                      outputRange: [1, 0.8, 0]
                    }),
                    transform: [
                      ...heroPosition.getTranslateTransform(),
                      {
                        rotate: heroPortalFx.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '540deg']
                        })
                      },
                      {
                        scale: heroPortalFx.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.05]
                        })
                      }
                    ]
                  }
                ]}
              >
                <Pressable
                  onPress={pokeHero}
                  accessibilityRole="button"
                  accessibilityLabel="Herói"
                  style={styles.pokeArea}
                >
                  <AnimatedSprite
                    ref={heroSpriteRef}
                    sheet={SPRITE_SHEETS.hero}
                    size={cellSize * 0.84}
                    clips={HERO_CLIPS}
                    loopClip="idle"
                    flipped={heroFacing === 'left'}
                    shadowColor="rgba(15,23,42,0.45)"
                    reduceMotion={reduceMotion}
                  />
                </Pressable>
              </Animated.View>

              {/* Destaque da dica do Byte */}
              {hintTarget ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.layer,
                    {
                      width: cellSize,
                      height: cellSize,
                      transform: [
                        { translateX: hintTarget.col * cellSize },
                        { translateY: hintTarget.row * cellSize }
                      ]
                    }
                  ]}
                >
                  <CellPing size={cellSize} color={colors.secondary} reduceMotion={reduceMotion} />
                </View>
              ) : null}

              {/* Enfeites: borboletas que fogem do herói e partículas dos eventos */}
              {!reduceMotion ? (
                <Butterflies boardSize={boardSize} cellSize={cellSize} heroCell={heroCell} />
              ) : null}

              {bursts.map((burst) => (
                <ParticleBurst
                  key={burst.id}
                  kind={burst.kind}
                  cell={cellSize}
                  x={(burst.position.col + 0.5) * cellSize}
                  y={(burst.position.row + 0.5 + (burst.offsetY ?? 0)) * cellSize}
                  onDone={() => removeBurst(burst.id)}
                />
              ))}
            </View>

            {/* Textos flutuantes ficam fora do tabuleiro para não serem cortados na borda */}
            {popup ? (
              <Animated.View
                key={popup.id}
                pointerEvents="none"
                style={[
                  styles.popup,
                  {
                    width: popupWidth,
                    left: Math.min(
                      Math.max(popup.position.col * cellSize - cellSize, 0),
                      boardSize - popupWidth
                    ),
                    top: popup.position.row * cellSize - cellSize * 0.1,
                    opacity: popupAnimation.interpolate({
                      inputRange: [0, 0.15, 0.7, 1],
                      outputRange: [0, 1, 1, 0]
                    }),
                    transform: [
                      {
                        translateY: popupAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -cellSize * 0.7]
                        })
                      },
                      {
                        scale: popupAnimation.interpolate({
                          inputRange: [0, 0.2, 1],
                          outputRange: [0.6, 1.12, 1]
                        })
                      }
                    ]
                  }
                ]}
              >
                <Text style={[styles.popupText, { color: POPUP_COLORS[popup.tone] }]}>
                  {popup.text}
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>

      {/* Console de uma linha: mostra o comando em execução ou o erro */}
      <View
        style={[
          styles.statusLine,
          message.tone === 'error' && styles.statusLineError,
          message.tone === 'success' && styles.statusLineSuccess
        ]}
      >
        <View style={styles.statusMessage} accessibilityLiveRegion="polite">
          {/* Byte, o ajudante: reage ao programa e dá dicas quando tocado */}
          <Companion
            mood={companionMood}
            size={COMPANION_SIZE}
            reduceMotion={reduceMotion}
            onPress={askCompanion}
          />
          <Text
            style={[styles.statusText, message.tone === 'error' && styles.statusTextError]}
            numberOfLines={3}
          >
            {message.text}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowPath((value) => !value)}
          accessibilityRole="switch"
          accessibilityLabel="Mostrar trajeto planejado"
          accessibilityState={{ checked: showPath }}
          hitSlop={6}
          style={[styles.statusToggle, showPath && styles.statusToggleOn]}
        >
          <Ionicons name={showPath ? 'eye' : 'eye-off'} size={16} color={colors.inkText} />
        </Pressable>
        <Pressable
          onPress={() => setFastMode((value) => !value)}
          accessibilityRole="switch"
          accessibilityLabel="Execução rápida"
          accessibilityState={{ checked: fastMode }}
          hitSlop={6}
          style={[styles.statusToggle, fastMode && styles.statusToggleOn]}
        >
          <Text style={styles.speedText}>{fastMode ? '2x' : '1x'}</Text>
        </Pressable>
      </View>

      {/* Painel de programação fixo: editor, atalhos e execução */}
      <View style={[styles.controlPanel, { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.xs }]}>
        <CodeEditor
          code={code}
          onChangeCode={handleTyping}
          editable={!isRunning}
          height={EDITOR_HEIGHT}
          activeLine={activeLine}
          errorLine={errorLine}
          forcedCursor={forcedCursor}
          onCursorChange={(cursor) => {
            cursorRef.current = cursor;

            if (forcedCursor !== null) {
              setForcedCursor(null);
            }
          }}
        />

        {/* Atalhos: inserem uma linha de código já com o recuo certo */}
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.snippets}
        >
          {snippets.map((snippet) => (
            <Pressable
              key={snippet.label}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel={`Inserir ${snippet.code}`}
              onPress={() => insertSnippet(snippet.code)}
              style={({ pressed }) => [
                styles.snippet,
                pressed && styles.snippetPressed,
                isRunning && styles.disabled
              ]}
            >
              {snippet.icon ? (
                <Ionicons name={snippet.icon} size={14} color={colors.primaryDark} />
              ) : null}
              <Text style={styles.snippetText}>{snippet.label}</Text>
            </Pressable>
          ))}

          <View style={styles.snippetDivider} />

          {EDIT_KEYS.map((key) => (
            <Pressable
              key={key.label}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel={key.accessibilityLabel}
              onPress={() => {
                if (key.id === 'indent') shiftIndent(1);
                else if (key.id === 'dedent') shiftIndent(-1);
                else if (key.id === 'delete') deleteCurrentLine();
                else replaceCode('', 'Código apagado. Toque em desfazer para recuperar.');
              }}
              style={({ pressed }) => [
                styles.snippet,
                styles.editKey,
                pressed && styles.snippetPressed,
                isRunning && styles.disabled
              ]}
            >
              <Ionicons name={key.icon} size={15} color={key.id === 'clear' ? colors.danger : colors.textSecondary} />
              <Text style={[styles.snippetText, styles.editKeyText]}>{key.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          {isRunning ? (
            <>
              <IconAction
                icon="play-skip-forward"
                label="Executar o próximo passo"
                color={colors.secondaryDark}
                disabled={!paused}
                onPress={() => runCode('step')}
              />
              <AppButton
                title="Parar"
                icon="stop"
                variant="danger"
                onPress={stopRun}
                style={styles.runButton}
              />
              {paused ? (
                <AppButton
                  title="Continuar"
                  icon="play"
                  onPress={() => runCode('run')}
                  style={styles.runButton}
                />
              ) : null}
            </>
          ) : (
            <>
              <IconAction
                icon="book-outline"
                label="Guia de comandos"
                color={colors.secondaryDark}
                onPress={() => setShowGuide(true)}
              />
              <IconAction
                icon="refresh"
                label="Restaurar código inicial"
                onPress={() => replaceCode(getInitialCode(mission), 'Código inicial restaurado.')}
              />
              <IconAction
                icon="arrow-undo"
                label="Desfazer última alteração"
                disabled={history.length === 0}
                onPress={undoEdit}
              />
              <IconAction
                icon="play-skip-forward"
                label="Executar passo a passo"
                color={colors.secondaryDark}
                onPress={() => runCode('step')}
              />
              <AppButton
                title="Executar"
                icon="play"
                onPress={() => runCode('run')}
                style={styles.runButton}
              />
            </>
          )}
        </View>
      </View>

      {/* Guia de comandos: tocar insere no código */}
      <Modal
        visible={showGuide}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGuide(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowGuide(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Guia de comandos</Text>
            <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false}>
              {GUIDE.map((section) => (
                <View key={section.title} style={styles.guideSection}>
                  <Text style={styles.guideHeading}>{section.title}</Text>
                  {section.items.map((item) => (
                    <Pressable
                      key={item.code}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.code}. ${item.text} Toque para inserir.`}
                      onPress={() => {
                        setShowGuide(false);
                        insertSnippet(item.code);
                      }}
                      style={({ pressed }) => [styles.guideItem, pressed && styles.guideItemPressed]}
                    >
                      <Text style={styles.guideCode}>{item.code}</Text>
                      <Text style={styles.guideText}>{item.text}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
            <AppButton title="Fechar" variant="ghost" onPress={() => setShowGuide(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Moedas, conquistas e recordes */}
      <Modal
        visible={showTrophies}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTrophies(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowTrophies(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.trophyHeader}>
              <Text style={styles.sheetTitle}>Sua jornada</Text>
              <View style={styles.wallet}>
                <BoardIcon name="coin" size={18} />
                <Text style={styles.walletText}>{profile.coins} moedas</Text>
              </View>
            </View>

            <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.guideHeading}>
                Conquistas ({profile.achievements.length}/{ACHIEVEMENTS.length})
              </Text>
              <View style={styles.achievementGrid}>
                {ACHIEVEMENTS.map((item) => {
                  const unlocked = profile.achievements.includes(item.id);

                  return (
                    <View
                      key={item.id}
                      style={[styles.achievement, unlocked && styles.achievementUnlocked]}
                      accessible
                      accessibilityLabel={`${item.title}. ${unlocked ? 'Conquistada' : 'Bloqueada'}. ${item.description}`}
                    >
                      <Ionicons
                        name={unlocked ? item.icon : 'lock-closed'}
                        size={18}
                        color={unlocked ? colors.accentText : colors.muted}
                      />
                      <View style={styles.achievementText}>
                        <Text style={styles.achievementTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.achievementDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.guideHeading}>Seus recordes</Text>
              {rankedRecords.length === 0 ? (
                <Text style={styles.guideText}>
                  Vença uma fase para registrar seu primeiro recorde.
                </Text>
              ) : (
                rankedRecords.map((item, position) => (
                  <View key={item.id} style={styles.recordRow}>
                    <Text style={styles.recordPosition}>{position + 1}</Text>
                    <View style={styles.achievementText}>
                      <Text style={styles.achievementTitle} numberOfLines={1}>
                        Fase {item.number}: {item.title}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {item.record.lines} {item.record.lines === 1 ? 'linha' : 'linhas'},{' '}
                        {item.record.actions} ações
                      </Text>
                    </View>
                    <View style={styles.recordStars}>
                      {[0, 1, 2].map((star) => (
                        <Ionicons
                          key={star}
                          name={star < item.record.stars ? 'star' : 'star-outline'}
                          size={14}
                          color={star < item.record.stars ? colors.accent : colors.locked}
                        />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <AppButton title="Fechar" variant="ghost" onPress={() => setShowTrophies(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Vitória sobre o tabuleiro, sem trocar de tela */}
      {successResult ? (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: successAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Animated.View
            style={[
              styles.successCard,
              {
                transform: [
                  {
                    scale: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="trophy" size={40} color={colors.warning} />
            </View>
            <Text style={styles.successTitle}>Fase concluída!</Text>

            <View
              style={styles.stars}
              accessible
              accessibilityLabel={`${successResult.stars} de 3 estrelas`}
            >
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={{
                    transform: [
                      {
                        scale: starsAnimation.interpolate({
                          inputRange: [index, index + 0.6, index + 1],
                          outputRange: [0, 1.3, 1],
                          extrapolate: 'clamp'
                        })
                      }
                    ]
                  }}
                >
                  <Ionicons
                    name={index < successResult.stars ? 'star' : 'star-outline'}
                    size={34}
                    color={index < successResult.stars ? colors.accent : colors.locked}
                  />
                </Animated.View>
              ))}
            </View>

            <Text style={styles.successText}>
              {successResult.awardedXp > 0
                ? `+${successResult.awardedXp} XP${mission.badge ? ` · medalha "${mission.badge}"` : ''}`
                : 'Você já tinha recebido o XP desta fase.'}
            </Text>
            <Text style={styles.successHint}>
              {successResult.optimal === null
                ? `Seu programa usou ${successResult.linesUsed} ${successResult.linesUsed === 1 ? 'linha' : 'linhas'}.`
                : successResult.stars === 3
                  ? `Solução perfeita: ${successResult.linesUsed} ${successResult.linesUsed === 1 ? 'linha' : 'linhas'}!`
                  : `Você usou ${successResult.linesUsed} linhas. Dá para fazer em ${successResult.optimal}!`}
            </Text>

            {successResult.coinsEarned > 0 ? (
              <View style={styles.successCoins}>
                <BoardIcon name="coin" size={18} />
                <Text style={styles.successCoinsText}>+{successResult.coinsEarned} moedas</Text>
              </View>
            ) : null}
            {successResult.newAchievements.map((item) => (
              <View key={item.id} style={styles.successBadge}>
                <Ionicons name={item.icon} size={15} color={colors.accentText} />
                <Text style={styles.successBadgeText}>Conquista: {item.title}</Text>
              </View>
            ))}
            {successResult.notes[0] ? (
              <Text style={styles.successNote}>{successResult.notes[0]}</Text>
            ) : null}

            <View style={styles.successActions}>
              {!successResult.isLastMission ? (
                <AppButton
                  title="Próxima fase"
                  icon="arrow-forward"
                  // Valor fixo (não funcional): dois toques não pulam fase.
                  onPress={() => setSelectedIndex(selectedIndex + 1)}
                />
              ) : (
                <Text style={styles.allDoneText}>Você venceu todas as fases disponíveis!</Text>
              )}
              <AppButton
                title={successResult.stars < 3 ? 'Tentar 3 estrelas' : 'Jogar de novo'}
                variant="ghost"
                icon="refresh"
                onPress={() => {
                  setSuccessResult(null);
                  resetBoard();
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  phaseScroll: {
    flexGrow: 0
  },
  phaseRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs
  },
  phaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 40,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  phaseChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  phaseChipDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder
  },
  phaseChipLocked: {
    backgroundColor: colors.surfaceMuted
  },
  phaseText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  phaseTextSelected: {
    color: '#FFFFFF'
  },
  missionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  missionInfo: {
    flex: 1
  },
  missionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 1
  },
  missionXp: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: '800'
  },
  missionGoal: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  missionGoalMet: {
    color: colors.primaryDark
  },
  objectives: {
    flexDirection: 'row',
    gap: 6
  },
  objective: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  objectiveDone: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  objectiveCheck: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  boardArea: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center'
  },
  board: {
    backgroundColor: '#E2E8F0',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  row: {
    flexDirection: 'row'
  },
  cell: {
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cellAlt: {
    backgroundColor: '#EEF2F7'
  },
  wallCell: {
    backgroundColor: '#CBD5E1'
  },
  goalCell: {
    backgroundColor: colors.primarySoft
  },
  goalCellReady: {
    backgroundColor: colors.primaryBorder
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  flowerSpot: {
    position: 'absolute',
    left: 2,
    bottom: 2
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft
  },
  walletText: {
    color: colors.accentText,
    fontSize: 14,
    fontWeight: '900'
  },
  lives: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1
  },
  snippets: {
    gap: 6,
    alignItems: 'center',
    paddingRight: spacing.sm
  },
  snippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  snippetPressed: {
    backgroundColor: colors.primaryBorder
  },
  snippetText: {
    color: colors.primaryDark,
    fontFamily: monoFont,
    fontSize: 12.5,
    fontWeight: '700'
  },
  snippetDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: 2
  },
  editKey: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border
  },
  editKeyText: {
    color: colors.textSecondary,
    fontFamily: undefined
  },
  guideScroll: {
    flexGrow: 0
  },
  guideSection: {
    marginBottom: spacing.sm
  },
  guideHeading: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: 6
  },
  guideItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 6
  },
  guideItemPressed: {
    backgroundColor: colors.primarySoft
  },
  guideCode: {
    color: colors.secondaryDark,
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '700'
  },
  guideText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  trophyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  achievementGrid: {
    gap: 6
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted
  },
  achievementUnlocked: {
    backgroundColor: colors.accentSoft
  },
  achievementText: {
    flex: 1
  },
  achievementTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  achievementDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  recordPosition: {
    width: 22,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center'
  },
  recordStars: {
    flexDirection: 'row',
    gap: 1
  },
  successCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  successCoinsText: {
    color: colors.accentText,
    fontSize: 15,
    fontWeight: '900'
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    marginBottom: 4
  },
  successBadgeText: {
    color: colors.accentText,
    fontSize: 13,
    fontWeight: '800'
  },
  successNote: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  pokeArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pathDot: {
    backgroundColor: colors.secondary,
    opacity: 0.35
  },
  pathEnd: {
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
    opacity: 0.8
  },
  entities: {
    // Mesmo ponto de origem das casas (o tabuleiro tem borda de 1 px).
    position: 'absolute',
    left: 1,
    top: 1,
    right: 0,
    bottom: 0
  },
  popup: {
    position: 'absolute',
    alignItems: 'center'
  },
  popupText: {
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: '#FFFFFF',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 }
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: COMPANION_SIZE + 6,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingLeft: 2,
    paddingRight: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.codeBg
  },
  statusLineError: {
    backgroundColor: '#450A0A'
  },
  statusLineSuccess: {
    backgroundColor: '#052E16'
  },
  statusMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  statusText: {
    flex: 1,
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 12.5,
    lineHeight: 17,
    paddingVertical: 4
  },
  statusTextError: {
    color: '#FECACA'
  },
  statusToggle: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  statusToggleOn: {
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  speedText: {
    color: colors.inkText,
    fontSize: 12,
    fontWeight: '900',
    fontFamily: monoFont
  },
  controlPanel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    ...shadow.raised
  },
  iconButton: {
    width: 46,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButtonPressed: {
    backgroundColor: colors.border
  },
  strip: {
    gap: CHIP_GAP,
    minHeight: CHIP_SIZE + 8,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  stripEmpty: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryDark,
    transform: [{ scale: 1.08 }]
  },
  chipError: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerText
  },
  chipIndex: {
    position: 'absolute',
    top: 2,
    right: 4,
    color: colors.primaryDark,
    fontSize: 9,
    fontWeight: '800'
  },
  chipIndexActive: {
    color: '#FFFFFF'
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6
  },
  padButton: {
    width: '32.3%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: colors.border
  },
  padButtonPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 2 }],
    backgroundColor: colors.primarySoft
  },
  padTextArea: {
    flex: 1
  },
  padLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800'
  },
  padCode: {
    color: colors.muted,
    fontSize: 10,
    fontFamily: monoFont
  },
  actions: {
    flexDirection: 'row',
    gap: 6
  },
  runButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.sm
  },
  disabled: {
    opacity: 0.45
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.55)'
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  codeScroll: {
    backgroundColor: colors.codeBg,
    borderRadius: radius.md,
    padding: spacing.md
  },
  codeComment: {
    color: '#64748B',
    fontFamily: monoFont,
    fontSize: 14,
    lineHeight: 24
  },
  codeLine: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: 6
  },
  codeLineError: {
    backgroundColor: 'rgba(220,38,38,0.3)'
  },
  lineNumber: {
    width: 22,
    color: '#475569',
    fontFamily: monoFont,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right'
  },
  codeText: {
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 14,
    lineHeight: 24
  },
  codeObject: {
    color: '#93C5FD'
  },
  codeMethod: {
    color: '#FDE68A'
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  successCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
    ...shadow.raised
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  successTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900'
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs
  },
  successText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  successHint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  successActions: {
    width: '100%',
    gap: spacing.sm
  },
  allDoneText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  }
});
