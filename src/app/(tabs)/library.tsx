import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { CodeBlock } from '@/components/CodeBlock';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { LearningErrorView, LearningLoadingView } from '@/components/StateView';
import { GLOSSARY, GlossaryTerm } from '@/constants/glossary';
import { useLearning } from '@/context/LearningContext';
import { useTopicProgress } from '@/features/progress/useTopicProgress';
import { colors, radius, spacing } from '@/theme/colors';

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const GlossaryCard = memo(function GlossaryCard({ item }: { item: GlossaryTerm }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityHint="Mostra um exemplo de código"
      onPress={() => setExpanded((current) => !current)}
      style={styles.glossaryCard}
    >
      <View style={styles.glossaryHeader}>
        <Text style={styles.term}>{item.term}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.muted}
        />
      </View>
      <Text style={styles.description}>{item.description}</Text>
      {expanded ? <CodeBlock code={item.example} style={styles.example} /> : null}
    </Pressable>
  );
});

export default function LibraryScreen() {
  const { isLearningLoading, learningError, reloadLearning } = useLearning();
  const topics = useTopicProgress();
  const [search, setSearch] = useState('');

  const filteredGlossary = useMemo(() => {
    const query = normalize(search.trim());

    if (!query) {
      return GLOSSARY;
    }

    return GLOSSARY.filter((item) =>
      normalize(`${item.term} ${item.description}`).includes(query)
    );
  }, [search]);

  return (
    <Screen>
      <SectionHeader title="Glossário Python" subtitle="Toque em um termo para ver o exemplo" />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar: lista, while, f-string..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Buscar no glossário"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={12} accessibilityLabel="Limpar busca">
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {filteredGlossary.length === 0 ? (
        <Text style={styles.emptySearch}>
          Nenhum termo encontrado. Tente outra palavra, como variável, for ou função.
        </Text>
      ) : (
        filteredGlossary.map((item) => <GlossaryCard key={item.term} item={item} />)
      )}

      <SectionHeader title="Módulos do curso" subtitle="Resumo do que você vai aprender" />

      {isLearningLoading && topics.length === 0 ? <LearningLoadingView /> : null}
      {learningError && topics.length === 0 ? (
        <LearningErrorView message={learningError} onRetry={reloadLearning} />
      ) : null}

      {topics.map((topic) => (
        <Pressable
          key={topic.id}
          accessibilityRole="button"
          onPress={() => router.push('/learn')}
          style={({ pressed }) => [styles.topicCard, pressed && styles.pressed]}
        >
          <View style={[styles.topicIcon, { backgroundColor: `${topic.color}22` }]}>
            <Text style={styles.topicEmoji}>{topic.emoji}</Text>
          </View>

          <View style={styles.topicInfo}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
            <View style={styles.topicProgress}>
              <ProgressBar value={topic.percent} height={6} color={topic.color} />
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    marginBottom: spacing.md
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 10
  },
  emptySearch: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: spacing.lg
  },
  glossaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  glossaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  term: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 16
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21
  },
  example: {
    marginTop: spacing.sm
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  topicIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicEmoji: {
    fontSize: 26
  },
  topicInfo: {
    flex: 1
  },
  topicTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  topicDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2
  },
  topicProgress: {
    marginTop: spacing.sm
  },
  pressed: {
    opacity: 0.9
  }
});
