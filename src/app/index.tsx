import React, { ComponentProps, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, shadow, spacing } from '@/theme/colors';

const ONBOARDING_DONE_KEY = '@pythonquest:onboarding-done';

const FEATURES: {
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  text: string;
}[] = [
  {
    icon: 'map',
    color: colors.primary,
    title: 'Trilha por missões',
    text: 'Do print() aos dicionários, uma fase de cada vez.'
  },
  {
    icon: 'game-controller',
    color: colors.secondary,
    title: 'Aprenda jogando',
    text: 'Ganhe XP, suba de nível e desbloqueie medalhas.'
  },
  {
    icon: 'terminal',
    color: '#7C3AED',
    title: 'Python de verdade',
    text: 'Teste seus códigos no terminal do próprio app.'
  }
];

export default function OnboardingScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY)
      .then((value) => setOnboardingDone(value === 'true'))
      .catch(() => setOnboardingDone(false));
  }, []);

  if (isLoading || onboardingDone === null) {
    return null;
  }

  if (isAuthenticated || onboardingDone) {
    return <Redirect href="/home" />;
  }

  async function finishOnboarding(target: '/home' | '/auth/login') {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true').catch(() => undefined);
    router.replace(target);
  }

  return (
    <Screen safeTop>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          PythonQuest
        </Text>
        <Text style={styles.subtitle}>
          Aprenda Python como quem joga: missões curtas, desafios e recompensas.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}1A` }]}>
              <Ionicons name={feature.icon} size={22} color={feature.color} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Começar jornada"
          icon="rocket"
          onPress={() => finishOnboarding('/home')}
        />
        <AppButton
          title="Já tenho conta"
          variant="ghost"
          onPress={() => finishOnboarding('/auth/login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.lg
  },
  logoBox: {
    width: 150,
    height: 150,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.raised
  },
  logo: {
    width: 130,
    height: 130
  },
  title: {
    fontSize: 36,
    color: colors.text,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: spacing.lg
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 330
  },
  features: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginVertical: spacing.lg
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureText: {
    flex: 1
  },
  featureTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  featureDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2
  },
  actions: {
    gap: spacing.sm,
    marginTop: 'auto'
  }
});
