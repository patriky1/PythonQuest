import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInputInstance, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const isFormValid = cleanEmail.length > 0 && password.length > 0;

  async function handleLogin() {
    if (!isFormValid || isSubmitting) {
      setErrorMessage('Preencha e-mail e senha para continuar.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signIn({ email: cleanEmail, password });
      router.replace('/home');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível entrar na sua conta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      headline="Continue sua jornada"
      description="Entre para salvar XP, medalhas e missões na nuvem."
      title="Entrar"
      errorMessage={errorMessage}
    >
      <FormField
        label="E-mail"
        placeholder="seuemail@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />

      <FormField
        ref={passwordRef}
        label="Senha"
        placeholder="Digite sua senha"
        secure
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <AppButton
        title="Entrar na conta"
        onPress={handleLogin}
        disabled={!isFormValid}
        loading={isSubmitting}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Ainda não tem conta?</Text>
        <AppButton
          title="Criar conta"
          variant="ghost"
          compact
          onPress={() => router.replace('/auth/register')}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  switchText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600'
  }
});
