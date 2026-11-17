import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Float } from '@/components/motion';
import { colors, radius, spacing } from '@/theme/colors';

type StateViewProps = {
  // Carregamento usa o LoadingScreen (animação padrão do app), não este componente.
  variant: 'error' | 'empty';
  title: string;
  message?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

export function StateView({
  variant,
  title,
  message,
  icon,
  actionLabel,
  onAction
}: StateViewProps) {
  const isError = variant === 'error';

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Float distance={5} style={[styles.iconBox, isError && styles.iconBoxError]}>
        <Ionicons
          name={icon ?? (isError ? 'cloud-offline-outline' : 'sparkles-outline')}
          size={34}
          color={isError ? colors.danger : colors.primary}
        />
      </Float>

      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          icon={isError ? 'refresh' : undefined}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export function LearningErrorView({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <StateView
      variant="error"
      title="Não conseguimos carregar"
      message={message}
      actionLabel="Tentar novamente"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  iconBoxError: {
    backgroundColor: colors.dangerSoft
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center'
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'stretch'
  }
});
