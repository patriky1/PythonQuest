import React, { ComponentProps } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PressableScale } from '@/components/motion';
import { colors, radius, spacing } from '@/theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerOutline';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  danger: '#FFFFFF',
  ghost: colors.textSecondary,
  dangerOutline: colors.danger
};

const RIPPLE_COLOR: Record<Variant, string> = {
  primary: 'rgba(255,255,255,0.22)',
  secondary: 'rgba(255,255,255,0.22)',
  danger: 'rgba(255,255,255,0.22)',
  ghost: 'rgba(15,23,42,0.08)',
  dangerOutline: 'rgba(220,38,38,0.1)'
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  compact = false,
  style
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const textColor = TEXT_COLOR[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      scaleTo={0.96}
      android_ripple={{ color: RIPPLE_COLOR[variant], foreground: true }}
      style={[
        styles.button,
        compact && styles.compact,
        styles[variant],
        isDisabled && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={compact ? 16 : 19} color={textColor} />
          ) : null}
          <Text
            style={[styles.text, compact && styles.compactText, { color: textColor }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  compact: {
    minHeight: 40,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  primary: {
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderBottomWidth: 3,
    borderBottomColor: colors.secondaryDark
  },
  danger: {
    backgroundColor: colors.danger
  },
  ghost: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  dangerOutline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.dangerBorder
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    fontSize: 16,
    fontWeight: '800'
  },
  compactText: {
    fontSize: 14
  }
});
