import React, { useMemo, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      label: 'Aguardando senha',
      percent: 0,
      color: '#E5E7EB'
    };
  }

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: 'Senha fraca',
      percent: 30,
      color: '#EF4444'
    };
  }

  if (score <= 3) {
    return {
      label: 'Senha média',
      percent: 65,
      color: '#F59E0B'
    };
  }

  return {
    label: 'Senha forte',
    percent: 100,
    color: '#16A34A'
  };
}

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanName = useMemo(() => name.trim(), [name]);
  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(password);
  }, [password]);

  const passwordsMatch =
    password.length > 0 &&
    passwordConfirmation.length > 0 &&
    password === passwordConfirmation;

  const canSubmit =
    cleanName.length >= 3 &&
    cleanEmail.includes('@') &&
    cleanEmail.includes('.') &&
    password.length >= 6 &&
    password === passwordConfirmation;

  function validateForm() {
    if (!cleanName) {
      return 'Digite seu nome.';
    }

    if (cleanName.length < 3) {
      return 'O nome precisa ter pelo menos 3 caracteres.';
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return 'Digite um e-mail válido.';
    }

    if (password.length < 6) {
      return 'A senha precisa ter pelo menos 6 caracteres.';
    }

    if (password !== passwordConfirmation) {
      return 'As senhas não conferem.';
    }

    return '';
  }

  async function handleRegister() {
    setErrorMessage('');

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      await signUp({
        name: cleanName,
        email: cleanEmail,
        password
      });

      router.replace('/');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar sua conta.';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToLogin() {
    router.push('/auth/login');
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topArea}>
          <BrandLogo size={76} />

          <Text style={styles.headline}>
            Crie sua conta de aprendiz
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cadastro</Text>
            <Text style={styles.cardSubtitle}>
              Comece com uma conta local neste aparelho.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Como você quer aparecer no app?"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Senha</Text>

              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={10}
              >
                <Text style={styles.passwordToggle}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
              />
            </View>

            <View style={styles.passwordMeterArea}>
              <View style={styles.passwordMeterTrack}>
                <View
                  style={[
                    styles.passwordMeterFill,
                    {
                      width: `${passwordStrength.percent}%`,
                      backgroundColor: passwordStrength.color
                    }
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.passwordStrengthText,
                  { color: passwordStrength.color }
                ]}
              >
                {passwordStrength.label}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Confirmar senha</Text>

              <Pressable
                onPress={() =>
                  setShowPasswordConfirmation((current) => !current)
                }
                hitSlop={10}
              >
                <Text style={styles.passwordToggle}>
                  {showPasswordConfirmation ? 'Ocultar' : 'Mostrar'}
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.inputWrapper,
                passwordsMatch && styles.inputWrapperSuccess
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPasswordConfirmation}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                returnKeyType="done"
              />
            </View>

            {passwordConfirmation.length > 0 ? (
              <Text
                style={[
                  styles.matchText,
                  passwordsMatch ? styles.matchSuccess : styles.matchError
                ]}
              >
                {passwordsMatch
                  ? 'As senhas conferem.'
                  : 'As senhas ainda não conferem.'}
              </Text>
            ) : null}
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Revise os dados</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              (!canSubmit || isSubmitting) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Criar conta</Text>
            )}
          </Pressable>

          <View style={styles.dividerArea}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed
            ]}
            onPress={goToLogin}
          >
            <Text style={styles.secondaryButtonText}>
              Já tenho uma conta
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  scroll: {
    flex: 1
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 64,
    justifyContent: 'flex-start'
  },
  topArea: {
    alignItems: 'center',
    marginBottom: 24
  },
  brandBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 6
  },
  brandIcon: {
    color: '#FACC15',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1
  },
  appName: {
    marginTop: 16,
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4
  },
  headline: {
    marginTop: 10,
    color: '#111827',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14
    },
    elevation: 5
  },
  cardHeader: {
    marginBottom: 20
  },
  cardTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  cardSubtitle: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20
  },
  fieldGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8
  },
  passwordToggle: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900'
  },
  inputWrapper: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  inputWrapperSuccess: {
    borderColor: '#16A34A'
  },
  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 0,
    color: '#111827',
    fontSize: 16,
    fontWeight: '600'
  },
  passwordMeterArea: {
    marginTop: 10
  },
  passwordMeterTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden'
  },
  passwordMeterFill: {
    height: '100%',
    borderRadius: 999
  },
  passwordStrengthText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '900'
  },
  matchText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800'
  },
  matchSuccess: {
    color: '#16A34A'
  },
  matchError: {
    color: '#DC2626'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16
  },
  errorTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900'
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0
  },
  dividerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '800'
  }
});