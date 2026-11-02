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
import { CodeBlock } from '@/components/CodeBlock';
import { ProgressBar } from '@/components/ProgressBar';
import {
  PythonRunnerHandle,
  PythonRunnerWebView,
  PythonRunResult
} from '@/components/python/PythonRunnerWebView';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
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

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            {runnerStatus === 'loading' ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: runnerStatus === 'ready' ? '#22C55E' : colors.danger }
                ]}
              />
            )}
            <Text style={styles.statusText}>
              {runnerStatus === 'ready'
                ? 'Python pronto'
                : runnerStatus === 'loading'
                  ? 'Carregando Python...'
                  : 'Python indisponível'}
            </Text>
          </View>

          <Text style={styles.xpText}>
            <Ionicons name="flash" size={13} color={colors.accent} /> {todayXp}/
            {PLAYGROUND_DAILY_XP_LIMIT} XP hoje
          </Text>
        </View>

        <ProgressBar
          value={toPercent(todayXp, PLAYGROUND_DAILY_XP_LIMIT)}
          height={6}
          color={colors.accent}
          trackColor="rgba(255,255,255,0.14)"
        />
        <Text style={styles.statusHint}>
          Ganhe {PLAYGROUND_XP_PER_RUN} XP a cada programa novo que roda sem erros.
        </Text>

        {runnerStatus === 'error' ? (
          <AppButton title="Tentar carregar de novo" icon="refresh" compact onPress={handleReloadRunner} />
        ) : null}
      </View>

      <SectionHeader title="Exemplos" subtitle="Toque para carregar no editor" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.examplesRow}
      >
        {PLAYGROUND_EXAMPLES.map((example) => (
          <Pressable
            key={example.title}
            accessibilityRole="button"
            accessibilityLabel={`Carregar exemplo ${example.title}`}
            style={({ pressed }) => [styles.exampleChip, pressed && styles.pressed]}
            onPress={() => loadExample(example)}
          >
            <Ionicons name="code-slash" size={14} color={colors.secondaryDark} />
            <Text style={styles.exampleText}>{example.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorFile}>main.py</Text>
          <Pressable
            onPress={() => setCode('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Apagar todo o código"
          >
            <Text style={styles.editorAction}>Limpar</Text>
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
          placeholderTextColor="#64748B"
          accessibilityLabel="Editor de código Python"
        />

        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsRow}
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
      </View>

      <Pressable
        onPress={() => setShowInputs((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showInputs }}
        style={styles.inputsToggle}
      >
        <Ionicons name="keypad-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.inputsToggleText}>
          Entradas para input() {inputs ? `(${inputs.split('\n').length})` : ''}
        </Text>
        <Ionicons name={showInputs ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>

      {showInputs ? (
        <TextInput
          value={inputs}
          onChangeText={setInputs}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={'Uma resposta por linha.\nEx.: Ana\n16'}
          placeholderTextColor={colors.muted}
          style={styles.inputsField}
          accessibilityLabel="Entradas para o input, uma por linha"
        />
      ) : null}

      <View style={styles.actionsRow}>
        <AppButton
          title="Reiniciar sessão"
          variant="ghost"
          icon="refresh"
          compact
          disabled={runnerStatus !== 'ready' || isRunning}
          onPress={() => runnerRef.current?.resetSession()}
          style={styles.actionButton}
        />
        <AppButton
          title={isRunning ? 'Executando' : 'Executar'}
          icon="play"
          loading={isRunning}
          disabled={runnerStatus !== 'ready'}
          onPress={handleRun}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.outputCard}>
        <View style={styles.outputHeader}>
          <Text style={styles.outputTitle}>Saída</Text>
          {outputStatus === 'success' ? <Tag label="Sucesso" tone="success" icon="checkmark" /> : null}
          {outputStatus === 'error' ? <Tag label="Erro" tone="danger" icon="alert" /> : null}
          {lastXpAwarded > 0 ? <Tag label={`+${lastXpAwarded} XP`} tone="warning" icon="flash" /> : null}
        </View>

        <Text
          style={[styles.outputText, outputStatus === 'error' && styles.outputTextError]}
          selectable
        >
          {output}
        </Text>

        {isSlowRun ? (
          <View style={styles.slowBox}>
            <Text style={styles.slowText}>
              Está demorando muito. Pode ser um loop infinito (um while que nunca termina).
            </Text>
            <AppButton title="Parar e reiniciar Python" variant="danger" compact onPress={handleReloadRunner} />
          </View>
        ) : null}
      </View>

      {reviewTips.length > 0 ? (
        <View style={[styles.tipsCard, outputStatus === 'error' && styles.tipsCardError]}>
          <View style={styles.tipsHeader}>
            <Ionicons
              name={outputStatus === 'error' ? 'bug' : 'bulb'}
              size={20}
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
        <SectionHeader title="Histórico" subtitle={`${history.length} execuções salvas`} />
        {history.length > 0 ? (
          <Pressable onPress={confirmClearHistory} hitSlop={10} accessibilityRole="button">
            <Text style={styles.clearHistory}>Limpar</Text>
          </Pressable>
        ) : null}
      </View>

      {history.length === 0 ? (
        <Text style={styles.emptyHistory}>
          Seus códigos executados aparecem aqui para você reutilizar depois.
        </Text>
      ) : (
        visibleHistory.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityHint="Carrega este código no editor"
            onPress={() => loadHistoryItem(item)}
            style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}
          >
            <View style={styles.historyTop}>
              <Tag
                label={item.status === 'success' ? 'Sucesso' : 'Erro'}
                tone={item.status === 'success' ? 'success' : 'danger'}
              />
              <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <CodeBlock code={item.code} numberOfLines={3} />
          </Pressable>
        ))
      )}

      {history.length > HISTORY_PREVIEW_COUNT ? (
        <AppButton
          title={showAllHistory ? 'Mostrar menos' : `Ver todas (${history.length})`}
          variant="ghost"
          compact
          onPress={() => setShowAllHistory((current) => !current)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.raised
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  xpText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800'
  },
  statusHint: {
    color: colors.inkText,
    fontSize: 12,
    lineHeight: 17
  },
  examplesRow: {
    gap: spacing.xs,
    paddingBottom: spacing.md
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 40
  },
  exampleText: {
    color: colors.secondaryDark,
    fontSize: 14,
    fontWeight: '800'
  },
  editorCard: {
    backgroundColor: colors.codeBg,
    borderRadius: radius.lg,
    overflow: 'hidden'
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.inkSoft
  },
  editorFile: {
    color: colors.inkText,
    fontFamily: monoFont,
    fontSize: 13,
    fontWeight: '700'
  },
  editorAction: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800'
  },
  editor: {
    minHeight: 220,
    color: colors.codeText,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: monoFont
  },
  shortcutsRow: {
    gap: 6,
    padding: spacing.xs,
    backgroundColor: colors.inkSoft
  },
  shortcutKey: {
    minWidth: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  shortcutKeyPressed: {
    backgroundColor: colors.secondary
  },
  shortcutText: {
    color: '#FFFFFF',
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: '700'
  },
  inputsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    marginTop: spacing.sm
  },
  inputsToggleText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700'
  },
  inputsField: {
    minHeight: 80,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontFamily: monoFont,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: spacing.sm
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  actionButton: {
    flex: 1,
    minHeight: 52
  },
  outputCard: {
    backgroundColor: '#020617',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    minHeight: 130,
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
    fontSize: 14,
    fontWeight: '800',
    fontFamily: monoFont
  },
  outputText: {
    color: colors.codeOutput,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: monoFont
  },
  outputTextError: {
    color: '#FCA5A5'
  },
  slowBox: {
    backgroundColor: 'rgba(220,38,38,0.12)',
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
    backgroundColor: colors.secondarySoft,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 6
  },
  tipsCardError: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.dangerBorder
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tipsTitle: {
    color: colors.secondaryDark,
    fontSize: 16,
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
    marginTop: spacing.md
  },
  clearHistory: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800'
  },
  emptyHistory: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  historyItem: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.85
  }
});
