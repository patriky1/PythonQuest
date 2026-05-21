import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/theme/colors';

export default function OnboardingScreen() {
  const player = useVideoPlayer(
    require('../../assets/mascot/intro.mp4'),
    player => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.hero}>
        <VideoView
          player={player}
          style={styles.logoVideo}
          contentFit="contain"
          nativeControls={false}
        />

        <Text style={styles.title}>PythonQuest</Text>

        <Text style={styles.subtitle}>
          Aprenda Python em missões curtas, com XP, corações, trilhas e desafios interativos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Como funciona?</Text>
        <Text style={styles.item}>✅ Lições por tópico</Text>
        <Text style={styles.item}>⚡ Perguntas rápidas com feedback</Text>
        <Text style={styles.item}>🏆 XP, medalhas e progresso</Text>
        <Text style={styles.item}>📚 Conteúdo fácil de substituir pelos seus módulos</Text>
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
    justifyContent: 'space-between',
  },

  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  logoVideo: {
    width: 240,
    height: 240,
    marginBottom: 12,
  },

  title: {
    fontSize: 42,
    color: colors.text,
    fontWeight: '900',
    bottom: 50,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    bottom: 40,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    bottom: 20,
  },

  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: spacing.md,
  },

  item: {
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
});