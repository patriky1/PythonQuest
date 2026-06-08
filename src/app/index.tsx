import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/theme/colors';

export default function OnboardingScreen() {
  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>PythonQuest</Text>

        <Text style={styles.subtitle}>
          Aprenda Python em missões curtas, com XP, corações, trilhas e desafios
          interativos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Como funciona?</Text>
        <Text style={styles.item}>✅ Lições por tópico</Text>
        <Text style={styles.item}>⚡ Perguntas rápidas com feedback</Text>
        <Text style={styles.item}>🏆 XP, medalhas e progresso</Text>
        <Text style={styles.item}>📚 Conteúdo carregado pelo servidor</Text>
      </View>

      <AppButton
        title="Começar jornada"
        onPress={() => router.replace('/home')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    justifyContent: 'space-between'
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl
  },
  logoBox: {
    width: 220,
    height: 220,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  logo: {
    width: 180,
    height: 180
  },
  title: {
    fontSize: 42,
    color: colors.text,
    fontWeight: '900',
    bottom: 30
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    bottom: 20
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    bottom: 20
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: spacing.md
  },
  item: {
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.sm,
    fontWeight: '700'
  }
});