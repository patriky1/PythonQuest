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

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanEmail = useMemo(() => {
    return email.trim().toLowerCase();
  }, [email]);

  const isFormValid = cleanEmail.length > 0 && password.length > 0;

  async function handleLogin() {
    setErrorMessage('');

    if (!cleanEmail || !password) {
      setErrorMessage('Preencha e-mail e senha para continuar.');
      return;
    }

    try {
      setIsSubmitting(true);

      await signIn({
        email: cleanEmail,
        password
      });

      router.replace('/');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar na sua conta.';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToRegister() {
    router.push('/auth/register');
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
            Continue sua jornada em Python
          </Text>

          <Text style={styles.description}>
            Entre para acessar suas missões, XP, histórico do laboratório e progresso salvo.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Entrar</Text>
            <Text style={styles.cardSubtitle}>
              Use sua conta criada neste aparelho.
            </Text>
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
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Atenção</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              (!isFormValid || isSubmitting) && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar na conta</Text>
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
            onPress={goToRegister}
          >
            <Text style={styles.secondaryButtonText}>
              Criar nova conta
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
    paddingTop: 36,
    paddingBottom: 56,
    justifyContent: 'flex-start'
  },
  topArea: {
    alignItems: 'center',
    marginBottom: 28
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
  description: {
    marginTop: 10,
    maxWidth: 320,
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
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
  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 0,
    color: '#111827',
    fontSize: 16,
    fontWeight: '600'
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