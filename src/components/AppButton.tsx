import React, { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  text: {
    fontSize: 16,
    fontWeight: '800'
  },
  compactText: {
    fontSize: 14
  }
});
