import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProgressProvider } from '@/store/progressStore';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <ProgressProvider>
          <StatusBar style="dark" />

          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTitleStyle: { color: colors.text, fontWeight: '900' },
              contentStyle: { backgroundColor: colors.background }
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="auth" options={{ headerShown: false }} />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
              name="lesson/[lessonId]"
              options={{ title: 'Missão' }}
            />

            <Stack.Screen
              name="result/[lessonId]"
              options={{
                title: 'Resultado',
                headerBackVisible: false
              }}
            />
          </Stack>
        </ProgressProvider>
      </AuthGate>
    </AuthProvider>
  );
}