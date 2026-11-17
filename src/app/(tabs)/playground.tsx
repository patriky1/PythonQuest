import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEvent,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { ProgressBar } from '@/components/ProgressBar';
import {
  PythonRunnerHandle,
  PythonRunnerWebView,
  PythonRunResult
} from '@/components/python/PythonRunnerWebView';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Tag';
import {
  EDITOR_SHORTCUTS,
  INITIAL_CODE,
  PLAYGROUND_EXAMPLES,
  PlaygroundExample
} from '@/constants/playgroundExamples';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { toPercent } from '@/features/progress/progress.helpers';
import {
  addPlaygroundHistoryItem,
  clearPlaygroundHistory,
  getPlaygroundHistory
} from '@/services/playgroundHistory';
import {
  awardPlaygroundPracticeXp,
  getTodayPlaygroundPracticeXp,
  PLAYGROUND_DAILY_XP_LIMIT,
  PLAYGROUND_XP_PER_RUN
} from '@/services/playgroundPractice';
import { colors, monoFont, radius, shadow, spacing } from '@/theme/colors';
import { PlaygroundHistoryItem } from '@/types/playground';
import { getCodeReview } from '@/utils/pythonFeedback';

type RunnerStatus = 'loading' | 'ready' | 'error';
type OutputStatus = 'idle' | 'running' | 'success' | 'error';
type Selection = { start: number; end: number };

const SLOW_RUN_MS = 8000;
const HISTORY_PREVIEW_COUNT = 5;

// Tons do console: tudo deriva do azul-marinho do tema para parecer uma peça só.
const consoleTone = {
  body: colors.codeBg,
  bar: colors.inkSoft,
  output: '#081022',
  divider: 'rgba(148,163,184,0.16)',
  key: '#273449',
  keyPressed: colors.secondary,
  ready: '#4ADE80',
  errorText: '#FCA5A5',
  python: '#FACC15'
};

const RUNNER_LABEL: Record<RunnerStatus, string> = {
  ready: 'Python pronto',
  loading: 'Carregando Python',
  error: 'Python indisponível'
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function countInputs(value: string) {
  return value.split('\n').filter((line) => line.length > 0).length;
}

export default function PlaygroundScreen() {
  const { user } = useAuth();
  const { addXp } = useProgress();
  const historyOwner = user?.id ?? 'guest';

  const runnerRef = useRef<PythonRunnerHandle>(null);
  const lastExecutedCodeRef = useRef('');
  const lastRewardedCodeRef = useRef('');
  const selectionRef = useRef<Selection>({ start: 0, end: 0 });
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [code, setCode] = useState(INITIAL_CODE);
  const [forcedSelection, setForcedSelection] = useState<Selection>();
  const [inputs, setInputs] = useState('');
  const [showInputs, setShowInputs] = useState(false);

  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>('loading');
  const [output, setOutput] = useState('Toque em Executar para ver o resultado aqui.');
  const [outputStatus, setOutputStatus] = useState<OutputStatus>('idle');
  const [isSlowRun, setIsSlowRun] = useState(false);
  const [reviewTips, setReviewTips] = useState<string[]>([]);

  const [history, setHistory] = useState<PlaygroundHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [todayXp, setTodayXp] = useState(0);
  const [lastXpAwarded, setLastXpAwarded] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getPlaygroundHistory(historyOwner),
      getTodayPlaygroundPracticeXp(historyOwner)
    ]).then(([storedHistory, storedXp]) => {
      if (isMounted) {
        setHistory(storedHistory);
        setTodayXp(storedXp);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [historyOwner]);

  useEffect(() => () => clearSlowTimer(), []);

  function clearSlowTimer() {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    setIsSlowRun(false);
  }

  const handleResult = useCallback(
    async ({ output: runOutput, hasError }: PythonRunResult) => {
      clearSlowTimer();

      const executedCode = lastExecutedCodeRef.current;
      const normalizedCode = executedCode.trim();
      let xpAwarded = 0;

      // XP só para código novo: repetir o mesmo programa não rende pontos.
      if (!hasError && normalizedCode !== lastRewardedCodeRef.current) {
        xpAwarded = await awardPlaygroundPracticeXp(historyOwner);

        if (xpAwarded > 0) {
          lastRewardedCodeRef.current = normalizedCode;
          await addXp(xpAwarded);
        }
      }

      setOutput(runOutput || 'Código executado sem saída. Use print() para mostrar resultados.');
      setOutputStatus(hasError ? 'error' : 'success');
      setLastXpAwarded(xpAwarded);
      setReviewTips(getCodeReview(executedCode, runOutput, hasError));
      setTodayXp(await getTodayPlaygroundPracticeXp(historyOwner));

      setHistory(
        await addPlaygroundHistoryItem(historyOwner, {
          code: executedCode,
          output: runOutput,
          status: hasError ? 'error' : 'success',
          xpAwarded
        })
      );
    },
    [addXp, historyOwner]
  );

  function handleRun() {
    if (!code.trim()) {
      setOutputStatus('error');
      setOutput('O editor está vazio. Escreva um comando, como print("Oi").');
      return;
    }

    if (runnerStatus !== 'ready') {
      return;
    }

    lastExecutedCodeRef.current = code;
    setOutputStatus('running');
    setOutput('Executando...');
    setLastXpAwarded(0);
    setReviewTips([]);

    clearSlowTimer();
    slowTimerRef.current = setTimeout(() => setIsSlowRun(true), SLOW_RUN_MS);

    runnerRef.current?.runCode(code, inputs ? inputs.split('\n') : []);
  }

  function handleReloadRunner() {
    clearSlowTimer();
    setRunnerStatus('loading');
    setOutputStatus('idle');
    setOutput('Python reiniciado. Revise o código (um while sem fim trava a execução) e tente de novo.');
    runnerRef.current?.reload();
  }

  function loadExample(example: PlaygroundExample) {
    setCode(example.code);
    setInputs(example.inputs ?? '');
    setShowInputs(Boolean(example.inputs));
    setOutputStatus('idle');
    setOutput('Exemplo carregado. Toque em Executar.');
    setReviewTips([]);
  }

  function insertShortcut(symbol: string) {
    const text = symbol === 'TAB' ? '    ' : symbol;
    const { start, end } = selectionRef.current;
    const cursor = start + text.length;

    setCode((current) => current.slice(0, start) + text + current.slice(end));
    selectionRef.current = { start: cursor, end: cursor };
    setForcedSelection({ start: cursor, end: cursor });
  }

  function handleSelectionChange(event: TextInputSelectionChangeEvent) {
    selectionRef.current = event.nativeEvent.selection;

    if (forcedSelection) {
      setForcedSelection(undefined);
    }
  }

  function loadHistoryItem(item: PlaygroundHistoryItem) {
    setCode(item.code);
    setOutput(item.output || 'Sem saída.');
    setOutputStatus(item.status);
    setReviewTips(getCodeReview(item.code, item.output, item.status === 'error'));
  }

  function confirmClearHistory() {
    Alert.alert('Limpar histórico?', 'Os códigos executados serão removidos deste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          await clearPlaygroundHistory(historyOwner);
          setHistory([]);
        }
      }
    ]);
  }

  const visibleHistory = showAllHistory ? history : history.slice(0, HISTORY_PREVIEW_COUNT);
  const isRunning = outputStatus === 'running';
  const isReady = runnerStatus === 'ready';
  const inputCount = countInputs(inputs);
  const dailyLimitReached = todayXp >= PLAYGROUND_DAILY_XP_LIMIT;

  return (
    <Screen>
      <PythonRunnerWebView
        ref={runnerRef}
        onReadyChange={(ready) => setRunnerStatus(ready ? 'ready' : 'loading')}
        onLoadError={(message) => {
          setRunnerStatus('error');
          setOutputStatus('error');
          setOutput(message);
        }}
        onResult={handleResult}
        onInfo={(message) => {
          clearSlowTimer();
          setOutputStatus('idle');
          setOutput(message);
        }}
      />

      {/* XP do dia: informação de apoio, fica discreta acima do console. */}
      <View style={styles.xpStrip}>
        <View style={styles.xpRow}>
          <Ionicons name="flash" size={15} color={colors.warning} />
          <Text style={styles.xpValue}>
            {todayXp} de {PLAYGROUND_DAILY_XP_LIMIT} XP hoje
          </Text>
          <Text style={styles.xpHint} numberOfLines={1}>
            {dailyLimitReached
              ? 'Limite de hoje atingido'
              : `+${PLAYGROUND_XP_PER_RUN} por programa novo sem erros`}
          </Text>
        </View>
        <ProgressBar
          value={toPercent(todayXp, PLAYGROUND_DAILY_XP_LIMIT)}
          height={4}
          color={colors.accent}
          trackColor={colors.border}
        />
      </View>

      <Text style={styles.examplesLabel}>Comece por um exemplo</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.examplesRow}
        style={styles.examplesScroll}
      >
        {PLAYGROUND_EXAMPLES.map((example) => (
          <Pressable
            key={example.title}
            accessibilityRole="button"
            accessibilityLabel={`Carregar exemplo ${example.title}`}
            style={({ pressed }) => [styles.exampleChip, pressed && styles.exampleChipPressed]}
            onPress={() => loadExample(example)}
          >
            <Text style={styles.exampleText}>{example.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Console: editor, execução e saída numa peça só. */}
      <View style={styles.console}>
        <View style={styles.consoleBar}>
          <View style={styles.fileTab}>
            <Ionicons name="logo-python" size={15} color={consoleTone.python} />
            <Text style={styles.fileName}>main.py</Text>
          </View>

          <View
            style={styles.runtime}
            accessibilityLiveRegion="polite"
            accessibilityLabel={RUNNER_LABEL[runnerStatus]}
          >
            {runnerStatus === 'loading' ? (
              <ActivityIndicator size="small" color={colors.inkText} />
            ) : (
              <View
                style={[
                  styles.runtimeDot,
                  { backgroundColor: isReady ? consoleTone.ready : colors.danger }
                ]}
              />
            )}
            <Text style={styles.runtimeText}>{RUNNER_LABEL[runnerStatus]}</Text>
          </View>

          <Pressable
            onPress={() => setCode('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Apagar todo o código"
            style={({ pressed }) => [styles.barAction, pressed && styles.barActionPressed]}
          >
            <Text style={styles.barActionText}>Limpar</Text>
          </Pressable>
        </View>

        <TextInput
          value={code}
          onChangeText={setCode}
          selection={forcedSelection}
          onSelectionChange={handleSelectionChange}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textAlignVertical="top"
          style={styles.editor}
          placeholder="# Escreva seu código aqui"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Editor de código Python"
        />

        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsRow}
          style={styles.shortcutsScroll}
        >
          {EDITOR_SHORTCUTS.map((symbol) => (
            <Pressable
              key={symbol}
              onPress={() => insertShortcut(symbol)}
              accessibilityLabel={symbol === 'TAB' ? 'Inserir recuo' : `Inserir ${symbol}`}
              style={({ pressed }) => [styles.shortcutKey, pressed && styles.shortcutKeyPressed]}
            >
              <Text style={styles.shortcutText}>{symbol === 'TAB' ? '⇥' : symbol}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {showInputs ? (
          <View style={styles.inputsPanel}>
            <Text style={styles.inputsLabel}>Respostas para input(), uma por linha</Text>
            <TextInput
              value={inputs}
              onChangeText={setInputs}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={'Ana\n16'}
              placeholderTextColor={colors.muted}
              style={styles.inputsField}
              accessibilityLabel="Respostas para input(), uma por linha"
            />
          </View>
        ) : null}

        <View style={styles.runBar}>
          <Pressable
            onPress={() => setShowInputs((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={`Entradas para input()${inputCount ? `, ${inputCount} preenchidas` : ''}`}
            accessibilityState={{ expanded: showInputs }}
            style={({ pressed }) => [
              styles.barButton,
              showInputs && styles.barButtonActive,
              pressed && styles.barActionPressed
            ]}
          >
            <Ionicons name="keypad-outline" size={17} color={colors.codeText} />
            <Text style={styles.barButtonText}>Entradas</Text>
            {inputCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{inputCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => runnerRef.current?.resetSession()}
            disabled={!isReady || isRunning}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar sessão do Python"
            accessibilityState={{ disabled: !isReady || isRunning }}
            style={({ pressed }) => [
              styles.barButton,
              styles.iconButton,
              (!isReady || isRunning) && styles.barButtonDisabled,
              pressed && styles.barActionPressed
            ]}
          >
            <Ionicons name="refresh" size={18} color={colors.codeText} />
          </Pressable>

          <AppButton
            title={isRunning ? 'Executando' : 'Executar'}
            icon="play"
            compact
            loading={isRunning}
            disabled={!isReady}
            onPress={handleRun}
            style={styles.runButton}
          />
        </View>

        <View style={styles.output} accessibilityLiveRegion="polite">
          <View style={styles.outputHeader}>
            <Text style={styles.outputTitle}>Saída</Text>
            {outputStatus === 'success' ? <Tag label="Sucesso" tone="success" icon="checkmark" /> : null}
            {outputStatus === 'error' ? <Tag label="Erro" tone="danger" icon="alert" /> : null}
            {lastXpAwarded > 0 ? <Tag label={`+${lastXpAwarded} XP`} tone="warning" icon="flash" /> : null}
          </View>

          <Text
            style={[
              styles.outputText,
              outputStatus === 'idle' && styles.outputTextIdle,
              outputStatus === 'error' && styles.outputTextError
            ]}
            selectable
          >
            {output}
          </Text>

          {runnerStatus === 'error' ? (
            <AppButton
              title="Carregar o Python de novo"
              icon="refresh"
              variant="secondary"
              compact
              onPress={handleReloadRunner}
            />
          ) : null}

          {isSlowRun ? (
            <View style={styles.slowBox}>
              <Text style={styles.slowText}>
                Está demorando muito. Pode ser um loop infinito (um while que nunca termina).
              </Text>
              <AppButton title="Parar e reiniciar Python" variant="danger" compact onPress={handleReloadRunner} />
            </View>
          ) : null}
        </View>
      </View>

      {reviewTips.length > 0 ? (
        <View style={[styles.tipsCard, outputStatus === 'error' && styles.tipsCardError]}>
          <View style={styles.tipsHeader}>
            <Ionicons
              name={outputStatus === 'error' ? 'bug' : 'bulb'}
              size={18}
              color={outputStatus === 'error' ? colors.dangerText : colors.secondaryDark}
            />
            <Text style={[styles.tipsTitle, outputStatus === 'error' && styles.tipsTitleError]}>
              {outputStatus === 'error' ? 'Como corrigir' : 'Dica'}
            </Text>
          </View>
          {reviewTips.map((tip) => (
            <Text key={tip} style={styles.tipText}>
              {tip}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle} accessibilityRole="header">
          Histórico
        </Text>
        {history.length > 0 ? (
          <Pressable
            onPress={confirmClearHistory}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Limpar histórico"
          >
            <Text style={styles.clearHistory}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>

      {history.length === 0 ? (
        <Text style={styles.emptyHistory}>
          Cada programa que você executar fica salvo aqui. Toque nele depois para abrir no editor.
        </Text>
      ) : (
        <View style={styles.historyList}>
          {visibleHistory.map((item, index) => {
            const isSuccess = item.status === 'success';

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${isSuccess ? 'Sucesso' : 'Erro'}, ${formatDate(item.createdAt)}`}
                accessibilityHint="Abre este código no editor"
                onPress={() => loadHistoryItem(item)}
                style={({ pressed }) => [
                  styles.historyItem,
                  index > 0 && styles.historyItemDivider,
                  pressed && styles.historyItemPressed
                ]}
              >
                <View
                  style={[
                    styles.historyStatus,
                    { backgroundColor: isSuccess ? colors.primary : colors.danger }
                  ]}
                />
                <View style={styles.historyBody}>
                  <Text style={styles.historyCode} numberOfLines={2}>
                    {item.code.trim()}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {isSuccess ? 'Sucesso' : 'Erro'}, {formatDate(item.createdAt)}
                    {item.xpAwarded > 0 ? `, +${item.xpAwarded} XP` : ''}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      )}

      {history.length > HISTORY_PREVIEW_COUNT ? (
        <AppButton
          title={showAllHistory ? 'Mostrar menos' : `Ver todas (${history.length})`}
          variant="ghost"
          compact
          onPress={() => setShowAllHistory((current) => !current)}
          style={styles.moreHistory}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  xpStrip: {
    gap: 8,
    marginBottom: spacing.md
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  xpValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  xpHint: {
    flex: 1,
    textAlign: 'right',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600'
  },

  examplesLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  examplesScroll: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md
  },
  examplesRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md
  },
  exampleChip: {
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 40
  },
  exampleChipPressed: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondaryBorder
  },
  exampleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },

  console: {
    backgroundColor: consoleTone.body,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.raised
  },
  consoleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 48,
    backgroundColor: consoleTone.bar
  },
  fileTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  fileName: {
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '700'
  },
  runtime: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  runtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  runtimeText: {
    color: colors.inkText,
    fontSize: 12,
    fontWeight: '700'
  },
  barAction: {
    paddingHorizontal: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.sm
  },
  barActionPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  barActionText: {
    color: consoleTone.errorText,
    fontSize: 13,
    fontWeight: '800'
  },

  editor: {
    minHeight: 240,
    color: colors.codeText,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: monoFont
  },

  shortcutsScroll: {
    borderTopWidth: 1,
    borderTopColor: consoleTone.divider
  },
  shortcutsRow: {
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  shortcutKey: {
    minWidth: 42,
    height: 40,
    borderRadius: 10,
    backgroundColor: consoleTone.key,
    borderBottomWidth: 2,
    borderBottomColor: '#111A2B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  shortcutKeyPressed: {
    backgroundColor: consoleTone.keyPressed,
    borderBottomColor: colors.secondaryDark
  },
  shortcutText: {
    color: '#FFFFFF',
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: '700'
  },

  inputsPanel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: consoleTone.divider
  },
  inputsLabel: {
    color: colors.inkText,
    fontSize: 13,
    fontWeight: '700'
  },
  inputsField: {
    minHeight: 72,
    backgroundColor: consoleTone.output,
    borderWidth: 1,
    borderColor: consoleTone.divider,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.codeText,
    fontFamily: monoFont,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: 'top'
  },

  runBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm
  },
  barButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)'
  },
  barButtonActive: {
    backgroundColor: 'rgba(37,99,235,0.22)',
    borderColor: colors.secondary
  },
  barButtonDisabled: {
    opacity: 0.4
  },
  barButtonText: {
    color: colors.codeText,
    fontSize: 14,
    fontWeight: '700'
  },
  iconButton: {
    width: 44,
    paddingHorizontal: 0,
    justifyContent: 'center'
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  runButton: {
    flex: 1,
    minHeight: 44
  },

  output: {
    backgroundColor: consoleTone.output,
    borderTopWidth: 1,
    borderTopColor: consoleTone.divider,
    padding: spacing.md,
    minHeight: 140,
    gap: spacing.sm
  },
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  outputTitle: {
    flex: 1,
    color: colors.inkText,
    fontSize: 13,
    fontWeight: '800'
  },
  outputText: {
    color: colors.codeOutput,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: monoFont
  },
  outputTextIdle: {
    color: '#94A3B8'
  },
  outputTextError: {
    color: consoleTone.errorText
  },
  slowBox: {
    backgroundColor: 'rgba(220,38,38,0.14)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.sm
  },
  slowText: {
    color: '#FECACA',
    fontSize: 13,
    lineHeight: 19
  },

  tipsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 6
  },
  tipsCardError: {
    borderLeftColor: colors.danger
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tipsTitle: {
    color: colors.secondaryDark,
    fontSize: 15,
    fontWeight: '800'
  },
  tipsTitleError: {
    color: colors.dangerText
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  historyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  clearHistory: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800'
  },
  emptyHistory: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  historyList: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    minHeight: 64
  },
  historyItemDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  historyItemPressed: {
    backgroundColor: colors.surfaceMuted
  },
  historyStatus: {
    width: 4,
    alignSelf: 'stretch',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2
  },
  historyBody: {
    flex: 1,
    gap: 4
  },
  historyCode: {
    color: colors.text,
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 19
  },
  historyMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600'
  },
  moreHistory: {
    marginTop: spacing.sm
  }
});
