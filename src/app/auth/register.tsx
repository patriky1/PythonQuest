import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInputInstance, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { ProgressBar } from '@/components/ProgressBar';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Senha fraca', percent: 30, color: colors.danger };
  if (score <= 3) return { label: 'Senha média', percent: 65, color: colors.warning };
  return { label: 'Senha forte', percent: 100, color: colors.primary };
}

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmationRef = useRef<TextInputInstance>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const strength = getPasswordStrength(password);
  const passwordsMatch = passwordConfirmation.length > 0 && password === passwordConfirmation;

  function validateForm() {
    if (cleanName.length < 3) return 'O nome precisa ter pelo menos 3 letras.';
    if (!EMAIL_PATTERN.test(cleanEmail)) return 'Digite um e-mail válido.';
    if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (password !== passwordConfirmation) return 'As senhas não conferem.';
    return '';
  }

  async function handleRegister() {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signUp({ name: cleanName, email: cleanEmail, password });
      router.replace('/home');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível criar sua conta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      headline="Crie sua conta de aprendiz"
      description="Seu progresso fica salvo na nuvem e você pode continuar em qualquer celular."
      title="Cadastro"
      errorMessage={errorMessage}
    >
      <FormField
        label="Nome"
        placeholder="Como você quer aparecer no app?"
        autoCapitalize="words"
        autoComplete="name"
        value={name}
        onChangeText={setName}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        submitBehavior="submit"
      />

      <FormField
        ref={emailRef}
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

      <View>
        <FormField
          ref={passwordRef}
          label="Senha"
          placeholder="Mínimo de 6 caracteres"
          secure
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          returnKeyType="next"
          onSubmitEditing={() => confirmationRef.current?.focus()}
          submitBehavior="submit"
        />

        {password ? (
          <View style={styles.strength}>
            <ProgressBar value={strength.percent} height={6} color={strength.color} />
            <Text style={[styles.strengthText, { color: strength.color }]}>
              {strength.label}
            </Text>
          </View>
        ) : null}
      </View>

      <FormField
        ref={confirmationRef}
        label="Confirmar senha"
        placeholder="Digite a senha novamente"
        secure
        autoComplete="new-password"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        returnKeyType="done"
        onSubmitEditing={handleRegister}
        success={passwordsMatch}
        hint={
          passwordConfirmation
            ? passwordsMatch
              ? 'As senhas conferem.'
              : 'As senhas ainda não conferem.'
            : undefined
        }
        hintColor={passwordsMatch ? colors.primaryDark : colors.danger}
      />

      <AppButton title="Criar conta" onPress={handleRegister} loading={isSubmitting} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Já tem uma conta?</Text>
        <AppButton
          title="Entrar"
          variant="ghost"
          compact
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  strength: {
    marginTop: spacing.sm,
    gap: 6
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '800'
  },
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
