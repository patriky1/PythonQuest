import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { AppVideoSplash } from '@/components/app/AppVideoSplash';
import { AuthProvider } from '@/context/AuthContext';
import { LearningProvider } from '@/context/LearningContext';
import { ProgressProvider } from '@/features/progress/ProgressContext';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
// A tela nativa de abertura some esmaecendo, em vez de cortar de uma vez.
SplashScreen.setOptions({ fade: true, duration: 250 });

/** Se a animação nunca avisar que apareceu, a abertura nativa some mesmo assim. */
const NATIVE_SPLASH_FALLBACK_MS = 1500;

export default function RootLayout() {
  const [showVideoSplash, setShowVideoSplash] = useState(true);
  const nativeSplashHiddenRef = useRef(false);

  // Só tira a abertura nativa quando a animação de carregamento já está
  // desenhada; antes disso aparecia um instante de tela vazia (ou preta).
  const hideNativeSplash = useCallback(() => {
    if (nativeSplashHiddenRef.current) {
      return;
    }

    nativeSplashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(hideNativeSplash, NATIVE_SPLASH_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [hideNativeSplash]);

  const handleFinishVideoSplash = useCallback(() => {
    // Garante que a abertura nativa saiu antes de mostrar o app.
    hideNativeSplash();
    setShowVideoSplash(false);
  }, [hideNativeSplash]);

  return (
    <AuthProvider>
      <View style={styles.root}>
        <LearningProvider>
          <ProgressProvider>
            <StatusBar style="dark" />

            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.text,
                headerTitleStyle: { color: colors.text, fontWeight: '800' },
                contentStyle: { backgroundColor: colors.background }
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="mission/pythonquest-adventure"
                options={{ title: 'PythonQuest Adventure' }}
              />
              <Stack.Screen name="lesson/[lessonId]" options={{ title: 'Missão' }} />
              <Stack.Screen name="privacy" options={{ title: 'Política de Privacidade' }} />
              <Stack.Screen
                name="result/[lessonId]"
                options={{
                  title: 'Resultado',
                  headerBackVisible: false,
                  gestureEnabled: false
                }}
              />
            </Stack>
          </ProgressProvider>
        </LearningProvider>
      </View>

      {showVideoSplash ? (
        <AppVideoSplash onFinish={handleFinishVideoSplash} onReady={hideNativeSplash} />
      ) : null}
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  }
});
