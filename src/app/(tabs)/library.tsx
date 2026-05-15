import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { topics } from '@/data/curriculum';
import { colors, spacing } from '@/theme/colors';

const glossary = [
  { term: 'Variável', description: 'Nome usado para guardar um valor.' },
  { term: 'String', description: 'Texto em Python, geralmente escrito entre aspas.' },
  { term: 'int', description: 'Número inteiro, como 1, 20 ou 300.' },
  { term: 'float', description: 'Número decimal. Em Python, usa ponto: 19.90.' },
  { term: 'bool', description: 'Valor lógico: True ou False.' },
  { term: 'f-string', description: 'Forma prática de montar mensagens com variáveis usando f antes das aspas.' },
  { term: 'Operador aritmético', description: 'Símbolo usado em cálculos, como +, -, * e /.' },
  { term: 'Operador de comparação', description: 'Símbolo que compara valores e retorna True ou False, como ==, != e >=.' },
  { term: 'Atribuição', description: 'Uso do sinal = para guardar um valor em uma variável.' },
  { term: 'Média ponderada', description: 'Média em que cada valor pode ter um peso diferente.' },
  { term: 'if', description: 'Estrutura usada para tomar decisões.' },
  { term: 'for', description: 'Estrutura usada para repetir um bloco de código.' },
  { term: 'função', description: 'Bloco de código reutilizável que executa uma tarefa.' }
];

export default function LibraryScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Biblioteca</Text>
      <Text style={styles.subtitle}>Resumo dos tópicos e glossário rápido para revisão.</Text>

      <Text style={styles.sectionTitle}>Tópicos do curso</Text>
      {topics.map((topic) => (
        <View key={topic.id} style={styles.topicCard}>
          <Text style={styles.topicEmoji}>{topic.emoji}</Text>
          <View style={styles.topicInfo}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Glossário rápido</Text>
      {glossary.map((item) => (
        <View key={item.term} style={styles.glossaryCard}>
          <Text style={styles.term}>{item.term}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: spacing.xs
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: spacing.lg
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: spacing.md,
    marginBottom: spacing.md
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  topicEmoji: {
    fontSize: 30
  },
  topicInfo: {
    flex: 1
  },
  topicTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  topicDescription: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 3
  },
  glossaryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  term: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4
  },
  description: {
    color: colors.text,
    lineHeight: 20
  }
});
