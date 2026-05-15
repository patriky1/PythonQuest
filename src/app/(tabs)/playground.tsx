import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  PythonRunnerHandle,
  PythonRunnerWebView
} from '@/components/python/PythonRunnerWebView';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/store/progressStore';

import {
  addPlaygroundHistoryItem,
  clearPlaygroundHistory,
  getPlaygroundHistory
} from '@/services/playgroundHistory';

import {
  awardPlaygroundPracticeXp,
  getTodayPlaygroundPracticeXp
} from '@/services/playgroundPractice';

import { PlaygroundHistoryItem, PlaygroundRunStatus } from '@/types/playground';
import { colors, spacing } from '@/theme/colors';

const DAILY_XP_LIMIT = 20;
const XP_PER_SUCCESSFUL_RUN = 2;

const initialCode = `# Laboratório Python
nome = "PythonQuest"

print(f"Olá, {nome}!")

for numero in range(1, 6):
    print(f"Número: {numero}")

2 + 2`;

const examples = [
  {
    title: 'Variáveis',
    code: `nome = "Ana"
idade = 20
altura = 1.68

print(f"{nome} tem {idade} anos.")
print(f"Altura: {altura:.2f} m")`
  },
  {
    title: 'Loop for',
    code: `produtos = ["Caneta", "Caderno", "Mochila"]

for produto in produtos:
    print(f"Produto: {produto}")`
  },
  {
    title: 'Condicional',
    code: `media = 8.4

if media >= 7:
    print("Aprovado")
else:
    print("Tente novamente")`
  },
  {
    title: 'Compra',
    code: `preco = 120.0
quantidade = 2
desconto = 10

subtotal = preco * quantidade
valor_desconto = subtotal * desconto / 100
total = subtotal - valor_desconto

print(f"Subtotal: R$ {subtotal:.2f}")
print(f"Desconto: R$ {valor_desconto:.2f}")
print(f"Total: R$ {total:.2f}")`
  }
];

function hasPythonError(output: string) {
  const normalizedOutput = output.toLowerCase();

  return (
    normalizedOutput.includes('traceback') ||
    normalizedOutput.includes('syntaxerror') ||
    normalizedOutput.includes('typeerror') ||
    normalizedOutput.includes('nameerror') ||
    normalizedOutput.includes('valueerror') ||
    normalizedOutput.includes('indentationerror')
  );
}

function getCodeReview(code: string, output: string) {
  const tips: string[] = [];

  if (!code.trim()) {
    tips.push('Digite algum código antes de executar.');
  }

  if (code.includes('input(')) {
    tips.push('input() interativo ainda não está habilitado nesta versão do laboratório.');
  }

  if (!code.includes('print(') && code.trim().split('\n').length > 1) {
    tips.push('Use print() para visualizar melhor os resultados de códigos com várias linhas.');
  }

  if (hasPythonError(output)) {
    tips.push('O Python encontrou um erro. Leia a última linha da saída para encontrar a causa principal.');
  }

  if (output.includes('IndentationError')) {
    tips.push('Revise a indentação. Linhas dentro de if, for e while precisam ficar recuadas.');
  }

  if (output.includes('NameError')) {
    tips.push('Alguma variável ou função foi usada antes de ser criada.');
  }

  if (output.includes('TypeError')) {
    tips.push('Confira se você não está misturando texto e número sem conversão.');
  }

  if (tips.length === 0) {
    tips.push('Código executado sem erros detectados. Agora tente alterar valores e observar o resultado.');
  }

  return tips;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Data indisponível';
  }
}

export default function PlaygroundScreen() {
  const runnerRef = useRef<PythonRunnerHandle>(null);
  const lastExecutedCodeRef = useRef(initialCode);

  const { user } = useAuth();
  const { addXp } = useProgress();

  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('Execute um código para ver a saída aqui.');
  const [reviewTips, setReviewTips] = useState<string[]>([
    'Execute um código para receber dicas automáticas.'
  ]);

  const [history, setHistory] = useState<PlaygroundHistoryItem[]>([]);
  const [isPythonReady, setIsPythonReady] = useState(false);
  const [todayPracticeXp, setTodayPracticeXp] = useState(0);
  const [lastXpAwarded, setLastXpAwarded] = useState(0);

  const xpPercent = useMemo(() => {
    return Math.min(100, Math.round((todayPracticeXp / DAILY_XP_LIMIT) * 100));
  }, [todayPracticeXp]);

  async function loadHistory() {
    if (!user?.id) {
      setHistory([]);
      setTodayPracticeXp(0);
      return;
    }

    const storedHistory = await getPlaygroundHistory(user.id);
    const storedTodayXp = await getTodayPlaygroundPracticeXp(user.id);

    setHistory(storedHistory);
    setTodayPracticeXp(storedTodayXp);
  }

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  async function saveExecution(params: {
    executedCode: string;
    executionOutput: string;
    status: PlaygroundRunStatus;
    xpAwarded: number;
  }) {
    if (!user?.id) {
      return;
    }

    const updatedHistory = await addPlaygroundHistoryItem(user.id, {
      code: params.executedCode,
      output: params.executionOutput,
      status: params.status,
      xpAwarded: params.xpAwarded
    });

    setHistory(updatedHistory);
  }

  async function handleSuccessfulOutput(executionOutput: string) {
    const executedCode = lastExecutedCodeRef.current;
    const executionHasError = hasPythonError(executionOutput);

    let xpAwarded = 0;

    if (!executionHasError && user?.id) {
      xpAwarded = await awardPlaygroundPracticeXp(
        user.id,
        XP_PER_SUCCESSFUL_RUN,
        DAILY_XP_LIMIT
      );

      if (xpAwarded > 0) {
        await addXp(xpAwarded);
      }
    }

    const status: PlaygroundRunStatus = executionHasError ? 'error' : 'success';

    setOutput(executionOutput);
    setLastXpAwarded(xpAwarded);

    const storedTodayXp = user?.id
      ? await getTodayPlaygroundPracticeXp(user.id)
      : 0;

    setTodayPracticeXp(storedTodayXp);
    setReviewTips(getCodeReview(executedCode, executionOutput));

    await saveExecution({
      executedCode,
      executionOutput,
      status,
      xpAwarded
    });
  }

  async function handleRunnerError(error: string) {
    const executedCode = lastExecutedCodeRef.current;

    setOutput(error);
    setLastXpAwarded(0);
    setReviewTips(getCodeReview(executedCode, error));

    await saveExecution({
      executedCode,
      executionOutput: error,
      status: 'error',
      xpAwarded: 0
    });
  }

  function handleRunCode() {
    const cleanCode = code.trim();

    if (!cleanCode) {
      Alert.alert('Código vazio', 'Digite algum comando Python antes de executar.');
      return;
    }

    if (!isPythonReady) {
      Alert.alert(
        'Python carregando',
        'Aguarde o interpretador ficar pronto antes de executar.'
      );
      return;
    }

    lastExecutedCodeRef.current = code;

    setOutput('Executando...');
    setLastXpAwarded(0);
    setReviewTips(['Executando análise...']);

    runnerRef.current?.runCode(code);
  }

  function handleClearOutput() {
    setOutput('Saída limpa. Execute um código para ver novos resultados.');
    setLastXpAwarded(0);
    setReviewTips(['Execute um código para receber dicas automáticas.']);
  }

  function handleResetSession() {
    runnerRef.current?.resetSession();
    setLastXpAwarded(0);
  }

  function handleAnalyzeCode() {
    setReviewTips(getCodeReview(code, output));
  }

  function handleUseHistoryItem(item: PlaygroundHistoryItem) {
    setCode(item.code);
    setOutput(item.output);
    setLastXpAwarded(item.xpAwarded);
    setReviewTips(getCodeReview(item.code, item.output));
  }

  function confirmClearHistory() {
    Alert.alert(
      'Limpar histórico?',
      'Todos os códigos executados neste laboratório serão removidos desta conta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: handleClearHistory
        }
      ]
    );
  }

  async function handleClearHistory() {
    if (!user?.id) {
      return;
    }

    await clearPlaygroundHistory(user.id);
    setHistory([]);
  }

  return (
    <Screen>
      <PythonRunnerWebView
        ref={runnerRef}
        onReadyChange={setIsPythonReady}
        onOutput={handleSuccessfulOutput}
        onError={handleRunnerError}
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroIconText}>Py</Text>
              </View>

              <View style={styles.heroTextArea}>
                <Text style={styles.heroLabel}>Laboratório</Text>
                <Text style={styles.heroTitle}>Terminal Python</Text>
                <Text style={styles.heroSubtitle}>
                  Escreva, execute, teste hipóteses e aprenda vendo o resultado.
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    isPythonReady ? styles.statusDotReady : styles.statusDotLoading
                  ]}
                />
                <Text style={styles.statusPillText}>
                  {isPythonReady ? 'Python pronto' : 'Carregando Python'}
                </Text>
              </View>

              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  ⚡ {todayPracticeXp}/{DAILY_XP_LIMIT} XP hoje
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpTitle}>Prática diária</Text>
              <Text style={styles.xpValue}>{xpPercent}%</Text>
            </View>

            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
            </View>

            <Text style={styles.xpHint}>
              Ganhe até {DAILY_XP_LIMIT} XP por dia executando códigos sem erro.
            </Text>

            {lastXpAwarded > 0 ? (
              <View style={styles.lastXpBox}>
                <Text style={styles.lastXpText}>
                  +{lastXpAwarded} XP adicionado ao seu perfil.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exemplos rápidos</Text>
            <Text style={styles.sectionSubtitle}>
              Toque em um exemplo para carregar no editor
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examplesRow}
          >
            {examples.map((example) => (
              <Pressable
                key={example.title}
                style={({ pressed }) => [
                  styles.exampleCard,
                  pressed && styles.cardPressed
                ]}
                onPress={() => setCode(example.code)}
              >
                <Text style={styles.exampleIcon}>⌘</Text>
                <Text style={styles.exampleTitle}>{example.title}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Editor</Text>
                <Text style={styles.cardSubtitle}>
                  Digite seu código Python abaixo
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.ghostButton,
                  pressed && styles.cardPressed
                ]}
                onPress={handleAnalyzeCode}
              >
                <Text style={styles.ghostButtonText}>Analisar</Text>
              </Pressable>
            </View>

            <TextInput
              value={code}
              onChangeText={setCode}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              textAlignVertical="top"
              style={styles.editor}
              placeholder="# Escreva seu código aqui"
              placeholderTextColor="#6B7280"
            />

            <View style={styles.editorActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  pressed && styles.cardPressed
                ]}
                onPress={() => setCode('')}
              >
                <Text style={styles.secondaryActionText}>Limpar código</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.runButton,
                  pressed && styles.cardPressed,
                  !isPythonReady && styles.disabledButton
                ]}
                onPress={handleRunCode}
                disabled={!isPythonReady}
              >
                <Text style={styles.runButtonText}>▶ Executar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Saída</Text>
                
              </View>

              <View style={styles.outputButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.ghostButton,
                    pressed && styles.cardPressed
                  ]}
                  onPress={handleClearOutput}
                >
                  <Text style={styles.ghostButtonText}>Limpar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.ghostButton,
                    pressed && styles.cardPressed
                  ]}
                  onPress={handleResetSession}
                >
                  <Text style={styles.ghostButtonText}>Reset</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.outputBox}>
              <Text style={styles.outputText}>
                {output || 'Sem saída.'}
              </Text>
            </View>
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewIcon}>💡</Text>
              <View style={styles.reviewTextArea}>
                <Text style={styles.reviewTitle}>Correção e dicas</Text>
                <Text style={styles.reviewSubtitle}>
                  Feedback rápido baseado no código e na saída
                </Text>
              </View>
            </View>

            <View style={styles.tipsList}>
              {reviewTips.map((tip) => (
                <Text key={tip} style={styles.reviewText}>
                  • {tip}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            <Text style={styles.sectionSubtitle}>
              Últimos códigos executados nesta conta
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyCount}>
                {history.length} registro{history.length === 1 ? '' : 's'}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.ghostButton,
                  pressed && styles.cardPressed,
                  history.length === 0 && styles.disabledButton
                ]}
                onPress={confirmClearHistory}
                disabled={history.length === 0}
              >
                <Text style={styles.ghostButtonText}>Limpar</Text>
              </Pressable>
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryIcon}>📄</Text>
                <Text style={styles.emptyHistoryTitle}>
                  Nenhuma execução ainda
                </Text>
                <Text style={styles.emptyHistoryText}>
                  Execute um código para começar seu histórico de prática.
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyItemTop}>
                      <View
                        style={[
                          styles.historyStatusBadge,
                          item.status === 'success'
                            ? styles.historyStatusSuccess
                            : styles.historyStatusError
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyStatusText,
                            item.status === 'success'
                              ? styles.historyStatusTextSuccess
                              : styles.historyStatusTextError
                          ]}
                        >
                          {item.status === 'success' ? 'Sucesso' : 'Erro'}
                        </Text>
                      </View>

                      <Text style={styles.historyDate}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.historyCodeBox}>
                      <Text numberOfLines={4} style={styles.historyCode}>
                        {item.code}
                      </Text>
                    </View>

                    <View style={styles.historyFooter}>
                      <Text style={styles.historyXp}>
                        XP ganho: {item.xpAwarded}
                      </Text>

                      <Pressable
                        style={({ pressed }) => [
                          styles.useHistoryButton,
                          pressed && styles.cardPressed
                        ]}
                        onPress={() => handleUseHistoryItem(item)}
                      >
                        <Text style={styles.useHistoryButtonText}>
                          Reutilizar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Observação</Text>
            <Text style={styles.noticeText}>
              O laboratório executa Python real. Nesta versão, comandos com input() ainda não funcionam de forma interativa.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing.xl
  },
  hero: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    marginBottom: spacing.md,
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12
    },
    elevation: 5
  },
  heroTop: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center'
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroIconText: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1
  },
  heroTextArea: {
    flex: 1
  },
  heroLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8
  },
  heroSubtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 18
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999
  },
  statusDotReady: {
    backgroundColor: '#22C55E'
  },
  statusDotLoading: {
    backgroundColor: '#FACC15'
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },
  xpCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  xpTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  xpValue: {
    color: '#16A34A',
    fontSize: 17,
    fontWeight: '900'
  },
  xpTrack: {
    height: 9,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden'
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 999
  },
  xpHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: spacing.sm
  },
  lastXpBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: spacing.sm,
    marginTop: spacing.md
  },
  lastXpText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center'
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  examplesRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg
  },
  exampleCard: {
    width: 132,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md
  },
  exampleIcon: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  exampleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  cardTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  ghostButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  ghostButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900'
  },
  editor: {
    minHeight: 280,
    backgroundColor: '#0F172A',
    color: '#E5E7EB',
    borderRadius: 20,
    padding: spacing.md,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    })
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '900'
  },
  runButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#16A34A',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  outputButtons: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  outputBox: {
    minHeight: 170,
    backgroundColor: '#020617',
    borderRadius: 20,
    padding: spacing.md
  },
  outputText: {
    color: '#D1FAE5',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    })
  },
  reviewCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md
  },
  reviewIcon: {
    fontSize: 30
  },
  reviewTextArea: {
    flex: 1
  },
  reviewTitle: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '900'
  },
  reviewSubtitle: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  tipsList: {
    gap: 6
  },
  reviewText: {
    color: '#1E3A8A',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  historyCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900'
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.lg
  },
  emptyHistoryIcon: {
    fontSize: 40,
    marginBottom: spacing.sm
  },
  emptyHistoryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  emptyHistoryText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6
  },
  historyList: {
    gap: spacing.md
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: spacing.md
  },
  historyItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  historyStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  historyStatusSuccess: {
    backgroundColor: '#DCFCE7'
  },
  historyStatusError: {
    backgroundColor: '#FEE2E2'
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '900'
  },
  historyStatusTextSuccess: {
    color: '#166534'
  },
  historyStatusTextError: {
    color: '#991B1B'
  },
  historyDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  historyCodeBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  historyCode: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    })
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm
  },
  historyXp: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900'
  },
  useHistoryButton: {
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  useHistoryButtonText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900'
  },
  noticeCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 22,
    padding: spacing.lg
  },
  noticeTitle: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  noticeText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.5
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9
  }
});