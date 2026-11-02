import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, radius, shadow, spacing } from '@/theme/colors';

type AuthLayoutProps = PropsWithChildren<{
  headline: string;
  description: string;
  title: string;
  errorMessage?: string;
}>;

export function AuthLayout({
  headline,
  description,
  title,
  errorMessage,
  children
}: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topArea}>
          <BrandLogo size={72} />
          <Text style={styles.headline} accessibilityRole="header">
            {headline}
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>

          {children}

          {errorMessage ? (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <AppButton
          title="Continuar sem conta"
          variant="ghost"
          onPress={() => router.replace('/home')}
          style={styles.guestButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20
  },
  topArea: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  headline: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.6
  },
  description: {
    marginTop: spacing.xs,
    maxWidth: 320,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.card
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    padding: 14
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  guestButton: {
    marginTop: spacing.md
  }
});
