import React, { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { CountUp, PressableScale, PulseRing, Reveal, useReduceMotion } from '@/components/motion';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { LearningErrorView } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { useLearning } from '@/context/LearningContext';
import { AnimatedSprite, SpriteHandle } from '@/features/adventure/AnimatedSprite';
import {
  BUG_CLIPS,
  COIN_CLIPS,
  HERO_CLIPS,
  HeroClip,
  SPRITE_SHEETS
} from '@/features/adventure/adventure.sprites';
import { useProgress } from '@/features/progress/ProgressContext';
import { MAX_HEARTS } from '@/features/progress/progress.constants';
import { getLevelInfo, toPercent } from '@/features/progress/progress.helpers';
import { TopicProgress, useTopicProgress } from '@/features/progress/useTopicProgress';
import { colors, monoFont, radius, shadow, spacing } from '@/theme/colors';

const MASCOT_REACTIONS: HeroClip[] = ['celebrate', 'collect', 'confused', 'celebrate'];
const MASCOT_SIZE = 84;
/** Máximo de pontos da trilha no cenário; módulos maiores mostram uma janela em volta da missão atual. */
const MAX_TRAIL_NODES = 12;
const NODE = 12;
const NODE_CURRENT = 20;
/** Quanto o cartão da missão sobe por cima do cenário. */
const CARD_OVERLAP = 34;

type TrailNode = { id: string; state: 'done' | 'current' | 'ahead' };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { progress, activeStreak, nextLessonId } = useProgress();
  const { lessons, lessonMap, isLearningLoading, learningError, reloadLearning } =
    useLearning();
  const topics = useTopicProgress();
  const reduceMotion = useReduceMotion();

  const mascotRef = useRef<SpriteHandle>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [trailWidth, setTrailWidth] = useState(0);

  const firstName = user?.name?.split(' ')[0];
  const nextLesson = nextLessonId ? lessonMap[nextLessonId] : undefined;
  const nextLessonTopic = topics.find((topic) => topic.id === nextLesson?.topicId);
  const overallPercent = toPercent(progress.completedLessonIds.length, lessons.length);
  const adventureDone = progress.completedSpecialMissionIds.length;
  const level = getLevelInfo(progress.xp);

  // Trilha do módulo atual: um ponto por missão, com o mascote em cima da atual.
  const trail = useMemo(() => {
    if (!nextLesson || !nextLessonTopic) {
      return null;
    }

    const completed = new Set(progress.completedLessonIds);
    const ids = nextLessonTopic.lessonIds;
    const currentIndex = Math.max(0, ids.indexOf(nextLesson.id));
    const start = Math.max(
      0,
      Math.min(currentIndex - Math.floor(MAX_TRAIL_NODES / 2), ids.length - MAX_TRAIL_NODES)
    );
    const nodes: TrailNode[] = ids.slice(start, start + MAX_TRAIL_NODES).map((id) => ({
      id,
      state: id === nextLesson.id ? 'current' : completed.has(id) ? 'done' : 'ahead'
    }));

    return { nodes, current: currentIndex - start, position: currentIndex + 1, total: ids.length };
  }, [nextLesson, nextLessonTopic, progress.completedLessonIds]);

  const tips = useMemo(
    () => [
      nextLesson ? 'Bora para a próxima missão?' : 'Trilha completa! Que tal o Adventure?',
      activeStreak > 0
        ? `${activeStreak} ${activeStreak === 1 ? 'dia seguido' : 'dias seguidos'}. Volte amanhã!`
        : 'Uma missão hoje começa sua sequência.',
      'O Terminal também rende XP.',
      'Me guie no Adventure. Sss!'
    ],
    [nextLesson, activeStreak]
  );

  function pokeMascot() {
    const next = (tipIndex + 1) % tips.length;
    setTipIndex(next);
    mascotRef.current?.play(MASCOT_REACTIONS[next % MASCOT_REACTIONS.length]);
  }

  function openTopic(topic: TopicProgress) {
    const lessonId = nextLesson && nextLesson.topicId === topic.id ? nextLesson.id : null;

    if (lessonId) {
      router.push(`/lesson/${lessonId}`);
    } else {
      router.push('/learn');
    }
  }

  if (isLearningLoading && lessons.length === 0) {
    return <LoadingScreen />;
  }

  if (learningError && lessons.length === 0) {
    return (
      <Screen safeTop>
        <LearningErrorView message={learningError} onRetry={reloadLearning} />
      </Screen>
    );
  }

  // Posição do mascote e do balão sobre a trilha.
  const nodeCount = trail?.nodes.length ?? 0;
  const inset = NODE_CURRENT / 2;
  const nodeX = (index: number) =>
    nodeCount <= 1
      ? trailWidth / 2
      : inset + (index * (trailWidth - inset * 2)) / (nodeCount - 1);
  const currentX = trail ? nodeX(trail.current) : MASCOT_SIZE / 2;
  const mascotLeft = Math.max(
    0,
    Math.min(currentX - MASCOT_SIZE / 2, Math.max(0, trailWidth - MASCOT_SIZE))
  );
  const bubbleOnRight = mascotLeft + MASCOT_SIZE / 2 < trailWidth / 2;

  return (
    <View style={styles.root}>
      {isFocused ? <StatusBar style="light" /> : null}

      <Screen
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLearningLoading}
            onRefresh={reloadLearning}
            colors={[colors.brand]}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Cenário: saudação, nível e a trilha do módulo com o mascote na missão atual */}
        <View style={[styles.scene, { paddingTop: insets.top + spacing.md }]}>
          <Reveal index={0}>
            <View style={styles.sceneTop}>
              <Text style={styles.greeting} accessibilityRole="header" numberOfLines={1}>
                Olá, {firstName || 'aprendiz'}
              </Text>

              <View style={styles.pills}>
                <View
                  style={styles.pill}
                  accessible
                  accessibilityLabel={`Sequência de ${activeStreak} ${activeStreak === 1 ? 'dia' : 'dias'}`}
                >
                  <Ionicons
                    name="flame"
                    size={16}
                    color={activeStreak > 0 ? '#FDBA74' : 'rgba(255,255,255,0.55)'}
                  />
                  <Text style={styles.pillText}>{activeStreak}</Text>
                </View>
                <View
                  style={styles.pill}
                  accessible
                  accessibilityLabel={`${progress.hearts} de ${MAX_HEARTS} corações`}
                >
                  <Ionicons name="heart" size={16} color="#FDA4AF" />
                  <Text style={styles.pillText}>{progress.hearts}</Text>
                </View>
              </View>
            </View>

            <View
              style={styles.levelRow}
              accessible
              accessibilityLabel={`Nível ${level.level}, ${level.title}. ${level.xpIntoLevel} de ${level.xpForNextLevel} XP.`}
            >
              <Text style={styles.levelName}>
                Nível {level.level} <Text style={styles.levelTitle}>{level.title}</Text>
              </Text>
              <Text style={styles.levelXp}>
                {level.xpIntoLevel}/{level.xpForNextLevel} XP
              </Text>
            </View>
            <ProgressBar
              value={level.percent}
              height={6}
              color={colors.brandYellow}
              trackColor="rgba(255,255,255,0.18)"
              animated
            />
          </Reveal>

          <Reveal index={1}>
            <View
              style={styles.stage}
              onLayout={(event) => setTrailWidth(event.nativeEvent.layout.width)}
            >
              {trailWidth > 0 ? (
                <>
                  <Pressable
                    onPress={pokeMascot}
                    accessibilityRole="button"
                    accessibilityLabel="Mascote. Toque para ouvir uma dica."
                    style={[styles.mascot, { left: mascotLeft }]}
                  >
                    <AnimatedSprite
                      ref={mascotRef}
                      sheet={SPRITE_SHEETS.hero}
                      size={MASCOT_SIZE}
                      clips={HERO_CLIPS}
                      loopClip="idle"
                      shadowColor="rgba(0,0,0,0.3)"
                      reduceMotion={reduceMotion}
                    />
                  </Pressable>

                  <Pressable
                    onPress={pokeMascot}
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.bubble,
                      bubbleOnRight
                        ? { left: mascotLeft + MASCOT_SIZE + 6 }
                        : { right: trailWidth - mascotLeft + 6 }
                    ]}
                  >
                    <View
                      style={[styles.bubbleTail, bubbleOnRight ? { left: -5 } : { right: -5 }]}
                    />
                    <Text style={styles.bubbleText}>{tips[tipIndex]}</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            {trail ? (
              <View
                style={styles.trail}
                accessible
                accessibilityLabel={`Missão ${trail.position} de ${trail.total} do módulo ${nextLessonTopic?.title ?? ''}`}
              >
                <View style={styles.trailTrack} />
                {trailWidth > 0 ? (
                  <View
                    style={[styles.trailDone, { width: Math.max(0, currentX - inset) }]}
                  />
                ) : null}
                {trailWidth > 0
                  ? trail.nodes.map((node, index) => {
                      const size = node.state === 'current' ? NODE_CURRENT : NODE;

                      return (
                        <View
                          key={node.id}
                          style={[
                            styles.nodeSlot,
                            { left: nodeX(index) - NODE_CURRENT / 2 }
                          ]}
                        >
                          {node.state === 'current' ? (
                            <PulseRing size={NODE_CURRENT} color="#FFFFFF" />
                          ) : null}
                          <View
                            style={[
                              styles.node,
                              { width: size, height: size, borderRadius: size / 2 },
                              node.state === 'done' && styles.nodeDone,
                              node.state === 'current' && styles.nodeCurrent
                            ]}
                          />
                        </View>
                      );
                    })
                  : null}
              </View>
            ) : null}
          </Reveal>
        </View>

        <View style={styles.body}>
          {/* Próxima missão: sobe por cima do cenário, com a ação principal à vista */}
          <Reveal index={2} style={styles.missionCard}>
            {nextLesson ? (
              <>
                {nextLessonTopic && trail ? (
                  <Text style={styles.missionWhere} numberOfLines={1}>
                    {nextLessonTopic.title}, missão {trail.position} de {trail.total}
                  </Text>
                ) : null}
                <Text style={styles.missionTitle}>{nextLesson.title}</Text>
                <Text style={styles.missionSubtitle}>{nextLesson.subtitle}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.meta}>
                    <Ionicons name="flash" size={14} color={colors.warning} />
                    <Text style={styles.metaText}>{nextLesson.xp} XP</Text>
                  </View>
                  <View style={styles.meta}>
                    <Ionicons name="time-outline" size={14} color={colors.muted} />
                    <Text style={styles.metaText}>{nextLesson.estimatedMinutes} min</Text>
                  </View>
                  <View style={styles.meta}>
                    <Ionicons name="layers-outline" size={14} color={colors.muted} />
                    <Text style={styles.metaText}>{nextLesson.steps.length} etapas</Text>
                  </View>
                </View>

                <AppButton
                  title={
                    progress.completedLessonIds.length === 0 ? 'Começar missão' : 'Continuar missão'
                  }
                  icon="play"
                  onPress={() => router.push(`/lesson/${nextLesson.id}`)}
                />
              </>
            ) : (
              <>
                <Text style={styles.missionTitle}>Trilha concluída</Text>
                <Text style={styles.missionSubtitle}>
                  Você completou todas as missões. Revise as aulas ou encare o Adventure.
                </Text>
                <AppButton
                  title="Revisar a trilha"
                  icon="map"
                  onPress={() => router.push('/learn')}
                />
              </>
            )}
          </Reveal>

          {/* Números da jornada: uma faixa só, sem cartões */}
          <Reveal index={3} style={styles.stats}>
            <View style={styles.stat} accessible accessibilityLabel={`${overallPercent}% da trilha`}>
              <CountUp value={overallPercent} suffix="%" style={styles.statValue} />
              <Text style={styles.statLabel}>da trilha</Text>
            </View>
            <View style={styles.statDivider} />
            <View
              style={styles.stat}
              accessible
              accessibilityLabel={`${progress.badges.length} medalhas`}
            >
              <CountUp value={progress.badges.length} style={styles.statValue} />
              <Text style={styles.statLabel}>medalhas</Text>
            </View>
            <View style={styles.statDivider} />
            <View
              style={styles.stat}
              accessible
              accessibilityLabel={`${adventureDone} fases do Adventure`}
            >
              <CountUp value={adventureDone} style={styles.statValue} />
              <Text style={styles.statLabel}>fases vencidas</Text>
            </View>
          </Reveal>

          {!user ? (
            <Reveal index={4}>
              <PressableScale
                style={styles.guestRow}
                onPress={() => router.push('/auth/login')}
                accessibilityRole="button"
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.brand} />
                <Text style={styles.guestText}>
                  Entre para salvar seu progresso na nuvem
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brand} />
              </PressableScale>
            </Reveal>
          ) : null}

          <Reveal index={5}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Jogue e pratique
            </Text>

            <View style={styles.playRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Adventure. Guie o herói com comandos."
                style={[styles.playCard, styles.adventureCard]}
                onPress={() => router.push('/mission/pythonquest-adventure')}
              >
                <View style={styles.playArt} pointerEvents="none">
                  <AnimatedSprite
                    sheet={SPRITE_SHEETS.coin}
                    size={34}
                    clips={COIN_CLIPS}
                    loopClip="idle"
                    reduceMotion={reduceMotion}
                  />
                  <AnimatedSprite
                    sheet={SPRITE_SHEETS.bug}
                    size={52}
                    clips={BUG_CLIPS}
                    loopClip="idle"
                    reduceMotion={reduceMotion}
                  />
                </View>
                <Text style={styles.playTitle}>Adventure</Text>
                <Text style={styles.playText}>Guie o herói com comandos.</Text>
              </PressableScale>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Terminal. Teste Python livre."
                style={[styles.playCard, styles.terminalCard]}
                onPress={() => router.push('/playground')}
              >
                <View style={styles.terminalArt} pointerEvents="none">
                  <Text style={styles.terminalLine} numberOfLines={1}>
                    <Text style={styles.terminalPrompt}>{'>>> '}</Text>print("oi")
                  </Text>
                  <Text style={[styles.terminalLine, styles.terminalOutput]}>oi</Text>
                </View>
                <Text style={[styles.playTitle, styles.onDark]}>Terminal</Text>
                <Text style={[styles.playText, styles.onDarkSoft]}>Teste Python livre.</Text>
              </PressableScale>
            </View>
          </Reveal>

          <Reveal index={6}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Módulos
            </Text>

            {/* Uma lista só, com divisórias, em vez de um cartão por módulo */}
            <View style={styles.moduleList}>
              {topics.map((topic, index) => (
                <PressableScale
                  key={topic.id}
                  scaleTo={0.98}
                  accessibilityRole="button"
                  accessibilityLabel={`${topic.title}. ${topic.completedCount} de ${topic.totalCount} missões${!topic.isUnlocked ? '. Bloqueado' : ''}`}
                  accessibilityState={{ disabled: !topic.isUnlocked }}
                  disabled={!topic.isUnlocked}
                  onPress={() => openTopic(topic)}
                  style={[styles.moduleRow, index > 0 && styles.moduleRowDivider]}
                >
                  <View
                    style={[
                      styles.moduleEmojiBox,
                      { backgroundColor: `${topic.color}22` },
                      !topic.isUnlocked && styles.moduleLocked
                    ]}
                  >
                    <Text style={styles.moduleEmoji}>{topic.emoji}</Text>
                  </View>

                  <View style={[styles.moduleText, !topic.isUnlocked && styles.moduleLocked]}>
                    <View style={styles.moduleTitleRow}>
                      <Text style={styles.moduleTitle} numberOfLines={1}>
                        {topic.title}
                      </Text>
                      <Text style={styles.moduleCount}>
                        {topic.completedCount}/{topic.totalCount}
                      </Text>
                    </View>
                    <ProgressBar value={topic.percent} height={6} color={topic.color} />
                  </View>

                  <Ionicons
                    name={
                      topic.isCompleted
                        ? 'checkmark-circle'
                        : topic.isUnlocked
                          ? 'chevron-forward'
                          : 'lock-closed'
                    }
                    size={18}
                    color={topic.isCompleted ? colors.primary : colors.muted}
                  />
                </PressableScale>
              ))}
            </View>
          </Reveal>
        </View>
      </Screen>

      {/* Faixa fixa atrás da barra de status: os ícones claros continuam legíveis ao rolar */}
      <View pointerEvents="none" style={[styles.statusStrip, { height: insets.top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 0
  },
  statusStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.brand
  },

  scene: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: CARD_OVERLAP + spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28
  },
  sceneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  greeting: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  pills: {
    flexDirection: 'row',
    gap: 6
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandDeep
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  levelName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  levelTitle: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600'
  },
  levelXp: {
    color: colors.brandYellow,
    fontSize: 13,
    fontWeight: '800'
  },

  stage: {
    height: MASCOT_SIZE + 6,
    marginTop: spacing.md
  },
  mascot: {
    position: 'absolute',
    bottom: 0,
    width: MASCOT_SIZE,
    height: MASCOT_SIZE
  },
  bubble: {
    position: 'absolute',
    bottom: 26,
    maxWidth: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  bubbleTail: {
    position: 'absolute',
    bottom: 12,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }]
  },
  bubbleText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },

  trail: {
    height: NODE_CURRENT,
    justifyContent: 'center'
  },
  trailTrack: {
    position: 'absolute',
    left: NODE_CURRENT / 2,
    right: NODE_CURRENT / 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)'
  },
  trailDone: {
    position: 'absolute',
    left: NODE_CURRENT / 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brandYellow
  },
  nodeSlot: {
    position: 'absolute',
    width: NODE_CURRENT,
    height: NODE_CURRENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  node: {
    backgroundColor: colors.brandDeep,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)'
  },
  nodeDone: {
    backgroundColor: colors.brandYellow,
    borderColor: colors.brandYellow
  },
  nodeCurrent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: colors.brandYellow
  },

  body: {
    paddingHorizontal: spacing.md,
    marginTop: -CARD_OVERLAP
  },
  missionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: 6,
    ...shadow.raised
  },
  missionWhere: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '700'
  },
  missionTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  missionSubtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 6,
    marginBottom: spacing.sm
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },

  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg
  },
  stat: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border
  },

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#E8F0F8',
    marginBottom: spacing.sm
  },
  guestText: {
    flex: 1,
    color: colors.brandDeep,
    fontSize: 14,
    fontWeight: '700'
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  playRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  playCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 150,
    justifyContent: 'flex-end'
  },
  adventureCard: {
    backgroundColor: '#E8F0F8'
  },
  terminalCard: {
    backgroundColor: colors.ink
  },
  playArt: {
    position: 'absolute',
    top: 10,
    left: spacing.md,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  terminalArt: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    gap: 2
  },
  terminalLine: {
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 19
  },
  terminalPrompt: {
    color: colors.brandYellow
  },
  terminalOutput: {
    color: colors.codeOutput
  },
  playTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800'
  },
  playText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  onDark: {
    color: '#FFFFFF'
  },
  onDarkSoft: {
    color: colors.inkText
  },

  moduleList: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card
  },
  moduleRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  moduleEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  moduleEmoji: {
    fontSize: 22
  },
  moduleLocked: {
    opacity: 0.5
  },
  moduleText: {
    flex: 1,
    gap: 8
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm
  },
  moduleTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  moduleCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  }
});
