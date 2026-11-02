import React, {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import {
  Command,
  COMMAND_META,
  commandToCodeLine,
  getAvailableCommands,
  getInitialMissionCommands,
  getNextPosition,
  GRID_SIZE,
  isInsideBoard,
  isMoveCommand,
  isSamePosition
} from '@/features/adventure/adventure.logic';
import { useProgress } from '@/features/progress/ProgressContext';
import { getAdventureMissionsFromApi } from '@/services/learningApi';
import { colors, monoFont, radius, shadow, spacing } from '@/theme/colors';
import { AdventureMission, AdventurePosition } from '@/types/adventure';

type GameStatus = 'idle' | 'running' | 'success' | 'error';
type MessageTone = 'info' | 'success' | 'error';

type SuccessResult = {
  awardedXp: number;
  isLastMission: boolean;
};

type BoardIconName = 'hero' | 'coin' | 'bug' | 'wall' | 'goal';

const BOARD_ICONS: Record<BoardIconName, ImageSourcePropType> = {
  hero: require('../../assets/adventure/hero.png'),
  coin: require('../../assets/adventure/coin.png'),
  bug: require('../../assets/adventure/bug.png'),
  wall: require('../../assets/adventure/wall.png'),
  goal: require('../../assets/adventure/goal.png')
};

const MOVE_DURATION_MS = 360;
const MAX_BOARD_SIZE = 360;
const CHIP_SIZE = 44;
const CHIP_GAP = 6;

class ExecutionStopped extends Error {}

function wait(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration));
}

function BoardIcon({ name, size }: { name: BoardIconName; size: `${number}%` | number }) {
  return (
    <Image source={BOARD_ICONS[name]} resizeMode="contain" style={{ width: size, height: size }} />
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
  const { progress, completeSpecialMission } = useProgress();

  const heroAnimation = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const heroPositionRef = useRef<AdventurePosition>({ row: 0, col: 0 });
  const cellSizeRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const stripRef = useRef<ScrollViewInstance>(null);

  const [missions, setMissions] = useState<AdventureMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [boardArea, setBoardArea] = useState({ width: 0, height: 0 });
  const [commands, setCommands] = useState<Command[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [hasCoin, setHasCoin] = useState(false);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [message, setMessage] = useState<{ text: string; tone: MessageTone }>({
    text: '',
    tone: 'info'
  });
  const [showCode, setShowCode] = useState(false);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);

  const mission = missions[selectedIndex];
  const isRunning = status === 'running';
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

  const wallKeys = useMemo(
    () => new Set((mission?.walls ?? []).map((wall) => `${wall.row}:${wall.col}`)),
    [mission]
  );

  const loadMissions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const missionsFromApi = await getAdventureMissionsFromApi();
      setMissions(missionsFromApi);

      const firstPending = missionsFromApi.findIndex(
        (item) => !progress.completedSpecialMissionIds.includes(item.id)
      );
      setSelectedIndex(firstPending === -1 ? 0 : firstPending);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Não foi possível carregar as fases.'
      );
    } finally {
      setIsLoading(false);
    }
    // Só escolhe a fase inicial no primeiro carregamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const placeHero = useCallback(
    (position: AdventurePosition) => {
      heroPositionRef.current = position;
      heroAnimation.setValue({
        x: position.col * cellSizeRef.current,
        y: position.row * cellSizeRef.current
      });
    },
    [heroAnimation]
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
    setActiveStep(null);
    setErrorStep(null);
    placeHero(mission.startPosition);
  }, [mission, placeHero]);

  useEffect(() => {
    if (!mission) {
      return;
    }

    setCommands(getInitialMissionCommands(mission));
    setSuccessResult(null);
    setMessage({ text: mission.subtitle || 'Monte a sequência e toque em Executar.', tone: 'info' });
    resetBoard();
    // Recarrega apenas quando a fase muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.08,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulseAnimation]);

  useEffect(() => {
    if (activeStep === null) {
      return;
    }

    stripRef.current?.scrollTo({
      x: Math.max(0, activeStep * (CHIP_SIZE + CHIP_GAP) - CHIP_SIZE * 2),
      animated: true
    });
  }, [activeStep]);

  function handleBoardLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBoardArea((current) =>
      current.width === width && current.height === height ? current : { width, height }
    );
  }

  function isMissionUnlocked(index: number) {
    return index === 0 || completedIds.includes(missions[index - 1]?.id);
  }

  function editCommands(update: (current: Command[]) => Command[], text: string) {
    if (isRunning) {
      return;
    }

    setCommands(update);
    resetBoard();
    setMessage({ text, tone: 'info' });
  }

  function animateHeroTo(position: AdventurePosition) {
    heroPositionRef.current = position;

    return new Promise<void>((resolve) => {
      Animated.timing(heroAnimation, {
        toValue: { x: position.col * cellSize, y: position.row * cellSize },
        duration: MOVE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(() => resolve());
    });
  }

  async function runCode() {
    if (!mission || isRunning) {
      return;
    }

    if (commands.length === 0) {
      setStatus('error');
      setMessage({ text: 'Adicione pelo menos um comando antes de executar.', tone: 'error' });
      return;
    }

    resetBoard();
    stopRequestedRef.current = false;
    setStatus('running');

    let position = mission.startPosition;
    let coinCollected = false;
    let bugDefeated = false;
    let step = 0;

    try {
      for (step = 0; step < commands.length; step += 1) {
        if (stopRequestedRef.current) {
          throw new ExecutionStopped();
        }

        const command = commands[step];
        setActiveStep(step);
        setMessage({ text: `> ${commandToCodeLine(command)}`, tone: 'info' });

        if (isMoveCommand(command)) {
          if (isSamePosition(position, mission.enemyPosition) && !bugDefeated) {
            throw new Error('Derrote o bug antes de sair desse quadrado.');
          }

          const next = getNextPosition(position, command);

          if (!isInsideBoard(next)) {
            throw new Error('O herói tentou sair do mapa.');
          }

          if (wallKeys.has(`${next.row}:${next.col}`)) {
            throw new Error('O herói bateu em uma parede.');
          }

          await animateHeroTo(next);
          position = next;
          continue;
        }

        if (command === 'collect') {
          if (!isSamePosition(position, mission.coinPosition) || coinCollected) {
            throw new Error(
              coinCollected ? 'A moeda já foi coletada.' : 'Não há moeda neste quadrado.'
            );
          }

          coinCollected = true;
          setHasCoin(true);
          await wait(260);
          continue;
        }

        if (!isSamePosition(position, mission.enemyPosition) || bugDefeated) {
          throw new Error(bugDefeated ? 'O bug já foi derrotado.' : 'Não há bug neste quadrado.');
        }

        bugDefeated = true;
        setEnemyDefeated(true);
        await wait(300);
      }

      step = commands.length - 1;

      if (!isSamePosition(position, mission.goalPosition)) {
        throw new Error('O código terminou, mas o herói não chegou ao portal.');
      }

      if (!coinCollected) {
        throw new Error('Você chegou ao portal, mas esqueceu a moeda.');
      }

      if (!bugDefeated) {
        throw new Error('Você chegou ao portal, mas não derrotou o bug.');
      }

      setStatus('success');
      setActiveStep(null);
      setMessage({ text: 'Fase concluída!', tone: 'success' });

      const awardedXp = await completeSpecialMission({
        missionId: mission.id,
        earnedXp: mission.xp,
        badge: mission.badge
      });

      setSuccessResult({ awardedXp, isLastMission: selectedIndex >= missions.length - 1 });
    } catch (error) {
      setStatus('error');
      setActiveStep(null);

      if (error instanceof ExecutionStopped) {
        setMessage({ text: 'Execução interrompida.', tone: 'info' });
        return;
      }

      setErrorStep(step);
      setMessage({
        text: `Linha ${step + 1}: ${error instanceof Error ? error.message : 'falha na execução.'}`,
        tone: 'error'
      });
    }
  }

  if (isLoading) {
    return (
      <Screen>
        <StateView variant="loading" title="Carregando Adventure..." message="Buscando as fases no servidor." />
      </Screen>
    );
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

  const objectives: { icon: BoardIconName; label: string; done: boolean }[] = [
    { icon: 'coin', label: 'Moeda', done: hasCoin },
    { icon: 'bug', label: 'Bug', done: enemyDefeated },
    { icon: 'goal', label: 'Portal', done: status === 'success' }
  ];

  return (
    <View style={styles.screen}>
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
          <Text style={styles.missionXp}>
            <Ionicons name="flash" size={12} color={colors.warning} /> {mission.xp} XP
          </Text>
        </View>

        <View style={styles.objectives}>
          {objectives.map((objective) => (
            <View
              key={objective.label}
              style={[styles.objective, objective.done && styles.objectiveDone]}
              accessible
              accessibilityLabel={`${objective.label}: ${objective.done ? 'concluído' : 'pendente'}`}
            >
              <BoardIcon name={objective.icon} size={20} />
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
          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {Array.from({ length: GRID_SIZE }, (_, row) => (
              <View key={row} style={styles.row}>
                {Array.from({ length: GRID_SIZE }, (__, col) => {
                  const isGoal = isSamePosition({ row, col }, mission.goalPosition);
                  const isWall = wallKeys.has(`${row}:${col}`);

                  return (
                    <View
                      key={col}
                      style={[
                        styles.cell,
                        { width: cellSize, height: cellSize },
                        (row + col) % 2 === 1 && styles.cellAlt,
                        isGoal && styles.goalCell,
                        isWall && styles.wallCell
                      ]}
                    >
                      {isGoal ? <BoardIcon name="goal" size="70%" /> : null}
                      {isWall ? <BoardIcon name="wall" size="86%" /> : null}
                    </View>
                  );
                })}
              </View>
            ))}

            {!hasCoin ? (
              <Animated.View
                style={[
                  styles.layer,
                  {
                    width: cellSize,
                    height: cellSize,
                    transform: [
                      { translateX: mission.coinPosition.col * cellSize },
                      { translateY: mission.coinPosition.row * cellSize },
                      { scale: pulseAnimation }
                    ]
                  }
                ]}
              >
                <BoardIcon name="coin" size="66%" />
              </Animated.View>
            ) : null}

            {!enemyDefeated ? (
              <Animated.View
                style={[
                  styles.layer,
                  {
                    width: cellSize,
                    height: cellSize,
                    transform: [
                      { translateX: mission.enemyPosition.col * cellSize },
                      { translateY: mission.enemyPosition.row * cellSize },
                      { scale: pulseAnimation }
                    ]
                  }
                ]}
              >
                <BoardIcon name="bug" size="72%" />
              </Animated.View>
            ) : null}

            <Animated.View
              style={[
                styles.layer,
                {
                  width: cellSize,
                  height: cellSize,
                  transform: heroAnimation.getTranslateTransform()
                }
              ]}
            >
              <View style={styles.heroBody}>
                <BoardIcon name="hero" size="90%" />
              </View>
            </Animated.View>
          </View>
        ) : null}
      </View>

      {/* Console de uma linha: mostra o comando em execução ou o erro */}
      <View
        style={[
          styles.statusLine,
          message.tone === 'error' && styles.statusLineError,
          message.tone === 'success' && styles.statusLineSuccess
        ]}
        accessibilityLiveRegion="polite"
      >
        <Ionicons
          name={
            message.tone === 'error'
              ? 'alert-circle'
              : message.tone === 'success'
                ? 'checkmark-circle'
                : isRunning
                  ? 'play-circle'
                  : 'information-circle'
          }
          size={18}
          color={
            message.tone === 'error'
              ? '#FCA5A5'
              : message.tone === 'success'
                ? colors.codeOutput
                : colors.inkText
          }
        />
        <Text
          style={[styles.statusText, message.tone === 'error' && styles.statusTextError]}
          numberOfLines={2}
        >
          {message.text}
        </Text>
      </View>

      {/* Painel de controle fixo */}
      <View style={[styles.controlPanel, { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.xs }]}>
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          onContentSizeChange={() => {
            if (!isRunning) stripRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {commands.length === 0 ? (
            <Text style={styles.stripEmpty}>Toque nos comandos abaixo para montar o caminho.</Text>
          ) : (
            commands.map((command, index) => {
              const isActive = activeStep === index;
              const isError = errorStep === index;

              return (
                <Pressable
                  key={`${command}-${index}`}
                  disabled={isRunning}
                  accessibilityRole="button"
                  accessibilityLabel={`Linha ${index + 1}: ${commandToCodeLine(command)}. Toque para remover.`}
                  onPress={() =>
                    editCommands(
                      (current) => current.filter((_, itemIndex) => itemIndex !== index),
                      `Linha ${index + 1} removida.`
                    )
                  }
                  style={[
                    styles.chip,
                    isActive && styles.chipActive,
                    isError && styles.chipError
                  ]}
                >
                  <Ionicons
                    name={COMMAND_META[command].icon}
                    size={18}
                    color={isActive || isError ? '#FFFFFF' : colors.primaryDark}
                  />
                  <Text style={[styles.chipIndex, (isActive || isError) && styles.chipIndexActive]}>
                    {index + 1}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <View style={styles.pad}>
          {availableCommands.map((command) => (
            <Pressable
              key={command}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${COMMAND_META[command].label}`}
              onPress={() =>
                editCommands(
                  (current) => [...current, command],
                  `Adicionado: ${commandToCodeLine(command)}`
                )
              }
              style={({ pressed }) => [
                styles.padButton,
                pressed && styles.padButtonPressed,
                isRunning && styles.disabled
              ]}
            >
              <Ionicons name={COMMAND_META[command].icon} size={18} color={colors.primaryDark} />
              <View style={styles.padTextArea}>
                <Text style={styles.padLabel}>{COMMAND_META[command].label}</Text>
                <Text style={styles.padCode} numberOfLines={1}>
                  {command}()
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <IconAction
            icon="code-slash"
            label="Ver código Python"
            color={colors.secondaryDark}
            onPress={() => setShowCode(true)}
          />
          <IconAction
            icon="refresh"
            label="Restaurar código inicial"
            disabled={isRunning}
            onPress={() =>
              editCommands(() => getInitialMissionCommands(mission), 'Código inicial restaurado.')
            }
          />
          <IconAction
            icon="trash-outline"
            label="Apagar todos os comandos"
            color={colors.danger}
            disabled={isRunning || commands.length === 0}
            onPress={() => editCommands(() => [], 'Sequência limpa.')}
          />
          <IconAction
            icon="backspace-outline"
            label="Desfazer último comando"
            disabled={isRunning || commands.length === 0}
            onPress={() => editCommands((current) => current.slice(0, -1), 'Último comando removido.')}
          />
          {isRunning ? (
            <AppButton
              title="Parar"
              icon="stop"
              variant="danger"
              onPress={() => {
                stopRequestedRef.current = true;
              }}
              style={styles.runButton}
            />
          ) : (
            <AppButton title="Executar" icon="play" onPress={runCode} style={styles.runButton} />
          )}
        </View>
      </View>

      {/* Código Python completo */}
      <Modal
        visible={showCode}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCode(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowCode(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Código Python</Text>
            <ScrollView style={styles.codeScroll}>
              <Text style={styles.codeComment}># {mission.title}</Text>
              {commands.length === 0 ? (
                <Text style={styles.codeComment}># Nenhum comando ainda</Text>
              ) : (
                commands.map((command, index) => (
                  <View
                    key={`${command}-${index}`}
                    style={[styles.codeLine, errorStep === index && styles.codeLineError]}
                  >
                    <Text style={styles.lineNumber}>{index + 1}</Text>
                    <Text style={styles.codeText}>
                      <Text style={styles.codeObject}>hero</Text>.
                      <Text style={styles.codeMethod}>{command}</Text>()
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <AppButton title="Fechar" variant="ghost" onPress={() => setShowCode(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Vitória sobre o tabuleiro, sem trocar de tela */}
      {successResult ? (
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="trophy" size={40} color={colors.warning} />
            </View>
            <Text style={styles.successTitle}>Fase concluída!</Text>
            <Text style={styles.successText}>
              {successResult.awardedXp > 0
                ? `+${successResult.awardedXp} XP${mission.badge ? ` · medalha "${mission.badge}"` : ''}`
                : 'Você já tinha recebido o XP desta fase.'}
            </Text>
            <Text style={styles.successHint}>
              Seu programa usou {commands.length} {commands.length === 1 ? 'linha' : 'linhas'}.
            </Text>

            <View style={styles.successActions}>
              {!successResult.isLastMission ? (
                <AppButton
                  title="Próxima fase"
                  icon="arrow-forward"
                  onPress={() => setSelectedIndex((index) => index + 1)}
                />
              ) : (
                <Text style={styles.allDoneText}>Você venceu todas as fases disponíveis!</Text>
              )}
              <AppButton
                title="Jogar de novo"
                variant="ghost"
                icon="refresh"
                onPress={() => {
                  setSuccessResult(null);
                  resetBoard();
                }}
              />
            </View>
          </View>
        </View>
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
  missionXp: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1
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
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroBody: {
    width: '80%',
    height: '80%',
    borderRadius: 999,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    overflow: 'hidden'
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.codeBg
  },
  statusLineError: {
    backgroundColor: '#450A0A'
  },
  statusLineSuccess: {
    backgroundColor: '#052E16'
  },
  statusText: {
    flex: 1,
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 18
  },
  statusTextError: {
    color: '#FECACA'
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
  successText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  successHint: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.md
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
