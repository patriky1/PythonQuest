import React, { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { colors, radius, spacing } from '@/theme/colors';

type StateViewProps = {
  variant: 'loading' | 'error' | 'empty';
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
      <View style={[styles.iconBox, isError && styles.iconBoxError]}>
        {variant === 'loading' ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Ionicons
            name={icon ?? (isError ? 'cloud-offline-outline' : 'sparkles-outline')}
            size={34}
            color={isError ? colors.danger : colors.primary}
          />
        )}
      </View>

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

export function LearningLoadingView() {
  return (
    <StateView
      variant="loading"
      title="Carregando missões..."
      message="Na primeira abertura do dia o servidor pode levar alguns segundos para acordar."
    />
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
