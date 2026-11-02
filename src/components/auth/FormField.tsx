import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputInstance,
  TextInputProps,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/theme/colors';

type FormFieldProps = TextInputProps & {
  label: string;
  secure?: boolean;
  success?: boolean;
  hint?: string;
  hintColor?: string;
};

export const FormField = forwardRef<TextInputInstance, FormFieldProps>(function FormField(
  { label, secure = false, success = false, hint, hintColor, ...inputProps },
  ref
) {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          success && styles.inputSuccess
        ]}
      >
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />

        {secure ? (
          <Pressable
            onPress={() => setHidden((current) => !current)}
            hitSlop={12}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>

      {hint ? (
        <Text style={[styles.hint, hintColor ? { color: hintColor } : null]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC'
  },
  inputFocused: {
    borderColor: colors.secondary,
    backgroundColor: colors.card
  },
  inputSuccess: {
    borderColor: colors.primary
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16
  },
  eyeButton: {
    paddingHorizontal: spacing.md
  },
  hint: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  }
});
