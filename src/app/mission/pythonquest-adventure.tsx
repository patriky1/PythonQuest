import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';

import { Screen } from '@/components/Screen';
import {
  AdventureMission,
  AdventurePosition,
  PYTHONQUEST_ADVENTURE_MISSIONS
} from '@/data/pythonQuestAdventureMissions';
import { useProgress } from '@/store/progressStore';
import { colors } from '@/theme/colors';

type GameStatus = 'idle' | 'running' | 'success' | 'error';

type Command =
  | 'moveRight'
  | 'moveLeft'
  | 'moveUp'
  | 'moveDown'
  | 'collect'
  | 'attack';

type SuccessResult = {
  missionTitle: string;
  awardedXp: number;
  alreadyCompleted: boolean;
  isLastMission: boolean;
};

const GRID_SIZE = 5;

function wait(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}

function positionKey(position: AdventurePosition) {
  return `${position.row}:${position.col}`;
}

function isSamePosition(a: AdventurePosition, b: AdventurePosition) {
  return a.row === b.row && a.col === b.col;
}

function isInsideBoard(position: AdventurePosition) {
  return (
    position.row >= 0 &&
    position.row < GRID_SIZE &&
    position.col >= 0 &&
    position.col < GRID_SIZE
  );
}

function parseCommands(code: string): Command[] {
  const commands: Command[] = [];

  const lines = code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  for (const line of lines) {
    const match = line.match(
      /^(hero\.)?(moveRight|moveLeft|moveUp|moveDown|collect|attack)\(\)$/
    );

    if (!match) {
      throw new Error(`Comando inválido: ${line}`);
    }

    commands.push(match[2] as Command);
  }

  return commands;
}

function getNextPosition(
  position: AdventurePosition,
  command: Command
): AdventurePosition {
  if (command === 'moveRight') {
    return { row: position.row, col: position.col + 1 };
  }

  if (command === 'moveLeft') {
    return { row: position.row, col: position.col - 1 };
  }

  if (command === 'moveUp') {
    return { row: position.row - 1, col: position.col };
  }

  if (command === 'moveDown') {
    return { row: position.row + 1, col: position.col };
  }

  return position;
}

export default function PythonQuestAdventureScreen() {
  const { width, height } = useWindowDimensions();

  const { progress, completeSpecialMission } = useProgress();

  const heroAnimation = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const [selectedMissionIndex, setSelectedMissionIndex] = useState(0);
  const mission = PYTHONQUEST_ADVENTURE_MISSIONS[selectedMissionIndex];

  const [code, setCode] = useState(mission.initialCode);

  const [heroPosition, setHeroPosition] = useState<AdventurePosition>(
    mission.startPosition
  );

  const [hasCoin, setHasCoin] = useState(false);
  const [enemyDefeated, setEnemyDefeated] = useState(false);

  const [status, setStatus] = useState<GameStatus>('idle');
  const [logs, setLogs] = useState<string[]>([
    'Escolha uma missão e toque em Executar.'
  ]);

  const [successResult, setSuccessResult] = useState<SuccessResult | null>(
    null
  );

  const isSmallScreen = height < 740;

  const boardSize = useMemo(() => {
    const widthLimit = width - 48;
    const sizeLimit = isSmallScreen ? 158 : 190;

    return Math.max(145, Math.min(widthLimit, sizeLimit));
  }, [width, isSmallScreen]);

  const editorHeight = isSmallScreen ? 132 : 162;

  const cellSize = useMemo(() => {
    return boardSize / GRID_SIZE;
  }, [boardSize]);

  const statusText = {
    idle: 'Aguardando',
    running: 'Executando',
    success: 'Concluído',
    error: 'Erro'
  }[status];

  const isCurrentMissionCompleted =
    progress.completedSpecialMissionIds.includes(mission.id);

  useEffect(() => {
    loadMission(mission);
  }, [mission.id]);

  useEffect(() => {
    heroAnimation.setValue({
      x: mission.startPosition.col * cellSize,
      y: mission.startPosition.row * cellSize
    });
  }, [cellSize, heroAnimation, mission.startPosition]);

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

    return () => {
      animation.stop();
    };
  }, [pulseAnimation]);

  function loadMission(nextMission: AdventureMission) {
    setCode(nextMission.initialCode);
    setStatus('idle');
    setHeroPosition(nextMission.startPosition);
    setHasCoin(false);
    setEnemyDefeated(false);
    setSuccessResult(null);
    setLogs([`Missão carregada: ${nextMission.title}`]);

    heroAnimation.setValue({
      x: nextMission.startPosition.col * cellSize,
      y: nextMission.startPosition.row * cellSize
    });
  }

  function addLog(message: string) {
    setLogs((currentLogs) => [...currentLogs, message].slice(-4));
  }

  function isWall(position: AdventurePosition) {
    return mission.walls.some((wall) => isSamePosition(wall, position));
  }

  function resetGame() {
    setStatus('idle');
    setHeroPosition(mission.startPosition);
    setHasCoin(false);
    setEnemyDefeated(false);
    setLogs(['Mapa reiniciado.']);

    heroAnimation.setValue({
      x: mission.startPosition.col * cellSize,
      y: mission.startPosition.row * cellSize
    });
  }

  function animateHeroTo(position: AdventurePosition) {
    return new Promise<void>((resolve) => {
      Animated.timing(heroAnimation, {
        toValue: {
          x: position.col * cellSize,
          y: position.row * cellSize
        },
        duration: 420,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(() => resolve());
    });
  }

  async function executeMove(
    currentPosition: AdventurePosition,
    command: Command,
    currentEnemyDefeated: boolean
  ) {
    const nextPosition = getNextPosition(currentPosition, command);

    if (!isInsideBoard(nextPosition)) {
      throw new Error('O herói tentou sair do mapa.');
    }

    if (isWall(nextPosition)) {
      throw new Error('O herói bateu em uma parede.');
    }

    if (
      isSamePosition(currentPosition, mission.enemyPosition) &&
      !currentEnemyDefeated
    ) {
      throw new Error('Derrote o bug antes de sair desse quadrado.');
    }

    await animateHeroTo(nextPosition);

    setHeroPosition(nextPosition);

    return nextPosition;
  }

  async function completeCurrentMission() {
    const awardedXp = await completeSpecialMission({
      missionId: mission.id,
      earnedXp: mission.xp,
      badge: mission.badge
    });

    return awardedXp;
  }

  async function runCode() {
    if (status === 'running') {
      return;
    }

    let commands: Command[] = [];

    try {
      commands = parseCommands(code);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Código inválido.';

      setStatus('error');
      setLogs([message]);
      return;
    }

    resetGame();

    setStatus('running');
    setLogs(['Executando comandos...']);

    let currentPosition = mission.startPosition;
    let currentHasCoin = false;
    let currentEnemyDefeated = false;

    try {
      for (const command of commands) {
        addLog(`> hero.${command}()`);

        if (
          command === 'moveRight' ||
          command === 'moveLeft' ||
          command === 'moveUp' ||
          command === 'moveDown'
        ) {
          currentPosition = await executeMove(
            currentPosition,
            command,
            currentEnemyDefeated
          );

          if (
            isSamePosition(currentPosition, mission.coinPosition) &&
            !currentHasCoin
          ) {
            addLog('Você chegou na moeda. Use hero.collect().');
          }

          if (
            isSamePosition(currentPosition, mission.enemyPosition) &&
            !currentEnemyDefeated
          ) {
            addLog('Você encontrou um bug. Use hero.attack().');
          }

          continue;
        }

        if (command === 'collect') {
          if (!isSamePosition(currentPosition, mission.coinPosition)) {
            throw new Error('Não há moeda neste quadrado.');
          }

          if (currentHasCoin) {
            throw new Error('A moeda já foi coletada.');
          }

          currentHasCoin = true;
          setHasCoin(true);
          addLog('Moeda coletada.');
          await wait(260);
          continue;
        }

        if (command === 'attack') {
          if (!isSamePosition(currentPosition, mission.enemyPosition)) {
            throw new Error('Não há bug neste quadrado.');
          }

          if (currentEnemyDefeated) {
            throw new Error('O bug já foi derrotado.');
          }

          currentEnemyDefeated = true;
          setEnemyDefeated(true);
          addLog('Bug derrotado.');
          await wait(320);
        }
      }

      if (!isSamePosition(currentPosition, mission.goalPosition)) {
        throw new Error('Você ainda não chegou ao portal.');
      }

      if (!currentHasCoin) {
        throw new Error('Você chegou ao portal, mas esqueceu a moeda.');
      }

      if (!currentEnemyDefeated) {
        throw new Error('Você chegou ao portal, mas não derrotou o bug.');
      }

      setStatus('success');

      const awardedXp = await completeCurrentMission();

      setSuccessResult({
        missionTitle: mission.title,
        awardedXp,
        alreadyCompleted: awardedXp === 0,
        isLastMission:
          selectedMissionIndex >= PYTHONQUEST_ADVENTURE_MISSIONS.length - 1
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro durante a execução.';

      setStatus('error');
      addLog(`Erro: ${message}`);
    }
  }

  function goToNextMission() {
    const nextIndex = selectedMissionIndex + 1;

    if (nextIndex >= PYTHONQUEST_ADVENTURE_MISSIONS.length) {
      Alert.alert(
        'Parabéns!',
        'Você chegou ao fim das missões PythonQuest Adventure disponíveis.'
      );
      return;
    }

    setSuccessResult(null);
    setSelectedMissionIndex(nextIndex);
  }

  function replayMission() {
    setSuccessResult(null);
    resetGame();
  }

  function backToMission() {
    setSuccessResult(null);
  }

  function renderCell(row: number, col: number) {
    const position = { row, col };

    const isGoal = isSamePosition(position, mission.goalPosition);
    const wall = isWall(position);

    return (
      <View
        key={positionKey(position)}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize
          },
          isGoal && styles.goalCell,
          wall && styles.wallCell
        ]}
      >
        {isGoal ? <Text style={styles.cellIcon}>🏁</Text> : null}
        {wall ? <Text style={styles.cellIcon}>🧱</Text> : null}
      </View>
    );
  }

  if (successResult) {
    return (
      <Screen scroll={false} style={styles.screen}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🏆</Text>

            <Text style={styles.successTitle}>Missão concluída!</Text>

            <Text style={styles.successSubtitle}>
              {successResult.missionTitle}
            </Text>

            <View style={styles.successInfoBox}>
              {successResult.alreadyCompleted ? (
                <Text style={styles.successInfoText}>
                  Você já tinha recebido o XP desta missão.
                </Text>
              ) : (
                <Text style={styles.successInfoText}>
                  +{successResult.awardedXp} XP adicionado ao seu perfil.
                </Text>
              )}
            </View>

            <View style={styles.successActions}>
              {!successResult.isLastMission ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.successPrimaryButton,
                    pressed && styles.buttonPressed
                  ]}
                  onPress={goToNextMission}
                >
                  <Text style={styles.successPrimaryButtonText}>
                    Próxima missão
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.successPrimaryButton,
                    pressed && styles.buttonPressed
                  ]}
                  onPress={backToMission}
                >
                  <Text style={styles.successPrimaryButtonText}>
                    Ver missões
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.successSecondaryButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={replayMission}
              >
                <Text style={styles.successSecondaryButtonText}>
                  Repetir missão
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.successGhostButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={backToMission}
              >
                <Text style={styles.successGhostButtonText}>
                  Voltar ao código
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.hero}>
              <View style={styles.heroTextArea}>
                <Text style={styles.kicker}>PythonQuest Adventure</Text>
                <Text style={styles.title}>{mission.title}</Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  status === 'success' && styles.statusSuccess,
                  status === 'error' && styles.statusError,
                  status === 'running' && styles.statusRunning
                ]}
              >
                <Text style={styles.statusPillText}>
                  {isCurrentMissionCompleted && status !== 'running'
                    ? 'Concluída'
                    : statusText}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              contentContainerStyle={styles.missionTabs}
            >
              {PYTHONQUEST_ADVENTURE_MISSIONS.map((adventureMission, index) => {
                const selected = index === selectedMissionIndex;
                const completed =
                  progress.completedSpecialMissionIds.includes(
                    adventureMission.id
                  );

                return (
                  <Pressable
                    key={adventureMission.id}
                    style={[
                      styles.missionTab,
                      selected && styles.missionTabSelected
                    ]}
                    onPress={() => {
                      if (status !== 'running') {
                        setSelectedMissionIndex(index);
                      }
                    }}
                    disabled={status === 'running'}
                  >
                    <Text
                      style={[
                        styles.missionTabText,
                        selected && styles.missionTabTextSelected
                      ]}
                    >
                      {completed ? '✓ ' : ''}
                      {index + 1}. {adventureMission.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.mainArea}>
              <View style={styles.boardPanel}>
                <View
                  style={[
                    styles.board,
                    {
                      width: boardSize,
                      height: boardSize
                    }
                  ]}
                >
                  <View style={styles.grid}>
                    {Array.from({ length: GRID_SIZE }).map((_, row) => (
                      <View key={`row-${row}`} style={styles.row}>
                        {Array.from({ length: GRID_SIZE }).map((__, col) =>
                          renderCell(row, col)
                        )}
                      </View>
                    ))}
                  </View>

                  {!hasCoin ? (
                    <Animated.View
                      style={[
                        styles.objectLayer,
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
                      <Text style={styles.objectIcon}>🪙</Text>
                    </Animated.View>
                  ) : null}

                  {!enemyDefeated ? (
                    <Animated.View
                      style={[
                        styles.objectLayer,
                        {
                          width: cellSize,
                          height: cellSize,
                          transform: [
                            {
                              translateX:
                                mission.enemyPosition.col * cellSize
                            },
                            {
                              translateY:
                                mission.enemyPosition.row * cellSize
                            },
                            { scale: pulseAnimation }
                          ]
                        }
                      ]}
                    >
                      <Text style={styles.objectIcon}>🐞</Text>
                    </Animated.View>
                  ) : null}

                  <Animated.View
                    style={[
                      styles.heroSprite,
                      {
                        width: cellSize,
                        height: cellSize,
                        transform: heroAnimation.getTranslateTransform()
                      }
                    ]}
                  >
                    <View style={styles.heroBody}>
                      <Text style={styles.heroIcon}>🧑‍💻</Text>
                    </View>
                  </Animated.View>
                </View>

                <View style={styles.inventoryBar}>
                  <Text style={styles.inventoryText}>
                    🧑‍💻 {heroPosition.row + 1},{heroPosition.col + 1}
                  </Text>

                  <Text style={styles.inventoryText}>
                    🪙 {hasCoin ? 'ok' : 'pendente'}
                  </Text>

                  <Text style={styles.inventoryText}>
                    🐞 {enemyDefeated ? 'ok' : 'ativo'}
                  </Text>

                  <Text style={styles.inventoryText}>⚡ {mission.xp}</Text>
                </View>
              </View>

              <View style={styles.editorCard}>
                <View style={styles.editorHeader}>
                  <Text style={styles.sectionTitle}>Código</Text>

                  <Text style={styles.commandHint}>
                    move • collect • attack
                  </Text>
                </View>

                <TextInput
                  value={code}
                  onChangeText={setCode}
                  multiline
                  scrollEnabled
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textAlignVertical="top"
                  style={[styles.editor, { height: editorHeight }]}
                />

                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed
                    ]}
                    onPress={() => {
                      setCode(mission.initialCode);
                      resetGame();
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Código inicial
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed
                    ]}
                    onPress={resetGame}
                  >
                    <Text style={styles.secondaryButtonText}>Reset</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                      status === 'running' && styles.buttonDisabled
                    ]}
                    onPress={runCode}
                    disabled={status === 'running'}
                  >
                    <Text style={styles.primaryButtonText}>Executar</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.consoleCard}>
              <Text style={styles.consoleTitle}>Console</Text>

              <View style={styles.consoleLines}>
                {logs.map((log, index) => (
                  <Text key={`${log}-${index}`} style={styles.consoleText}>
                    {log}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.helpBar}>
              {mission.availableCommands.map((command) => (
                <Text key={command} style={styles.helpText}>
                  {command}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 10
  },
  keyboard: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28
  },
  container: {
    flexGrow: 1,
    gap: 8
  },
  hero: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  heroTextArea: {
    flex: 1
  },
  kicker: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  missionTabs: {
    gap: 8,
    paddingVertical: 2
  },
  missionTab: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  missionTabSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827'
  },
  missionTabText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900'
  },
  missionTabTextSelected: {
    color: '#FFFFFF'
  },
  mainArea: {
    alignItems: 'center',
    gap: 8
  },
  boardPanel: {
    alignItems: 'center',
    gap: 6
  },
  board: {
    backgroundColor: '#E5E7EB',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  grid: {
    flex: 1
  },
  row: {
    flexDirection: 'row'
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  wallCell: {
    backgroundColor: '#CBD5E1'
  },
  goalCell: {
    backgroundColor: '#DCFCE7'
  },
  cellIcon: {
    fontSize: 16
  },
  objectLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  objectIcon: {
    fontSize: 20
  },
  heroSprite: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroBody: {
    width: '72%',
    height: '72%',
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB'
  },
  heroIcon: {
    fontSize: 19
  },
  inventoryBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  inventoryText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900'
  },
  editorCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 10
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  commandHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800'
  },
  editor: {
    backgroundColor: '#0F172A',
    color: '#E5E7EB',
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'monospace'
  },
  actions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8
  },
  primaryButton: {
    flex: 1.15,
    minHeight: 40,
    backgroundColor: '#16A34A',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900'
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }]
  },
  buttonDisabled: {
    opacity: 0.55
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusSuccess: {
    backgroundColor: '#DCFCE7'
  },
  statusError: {
    backgroundColor: '#FEE2E2'
  },
  statusRunning: {
    backgroundColor: '#FEF3C7'
  },
  statusPillText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '900'
  },
  consoleCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 10,
    minHeight: 78
  },
  consoleTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5
  },
  consoleLines: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 8,
    minHeight: 44
  },
  consoleText: {
    color: '#D1FAE5',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'monospace'
  },
  helpBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center'
  },
  helpText: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#1E3A8A',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  successCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center'
  },
  successEmoji: {
    fontSize: 58,
    marginBottom: 12
  },
  successTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6
  },
  successSubtitle: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18
  },
  successInfoBox: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18
  },
  successInfoText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 20
  },
  successActions: {
    width: '100%',
    gap: 10
  },
  successPrimaryButton: {
    minHeight: 52,
    backgroundColor: '#16A34A',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  },
  successSecondaryButton: {
    minHeight: 52,
    backgroundColor: '#DBEAFE',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successSecondaryButtonText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '900'
  },
  successGhostButton: {
    minHeight: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successGhostButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '900'
  }
});