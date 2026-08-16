import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';


import { AppVideoSplash } from '@/components/app/AppVideoSplash';
import { AuthProvider } from '@/context/AuthContext';
import { LearningProvider } from '@/context/LearningContext';
import { ProgressProvider } from '@/store/progressStore';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const [showVideoSplash, setShowVideoSplash] = useState(true);

  useEffect(() => {
    async function hideNativeSplash() {
      try {
        await SplashScreen.hideAsync();
      } finally {
        setNativeSplashHidden(true);
      }
    }

    hideNativeSplash();
  }, []);

  const handleFinishVideoSplash = useCallback(() => {
    setShowVideoSplash(false);
  }, []);

  if (!nativeSplashHidden) {
    return null;
  }

  return (
    
      
    <AuthProvider>
      {showVideoSplash ? (
          <AppVideoSplash onFinish={handleFinishVideoSplash} />
        ) : null}

      <View style={styles.root}>
          
          <LearningProvider>
            <ProgressProvider>
              <StatusBar style="dark" />

              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: colors.background
                  },
                  headerShadowVisible: false,
                  headerTitleStyle: {
                    color: colors.text,
                    fontWeight: '900'
                  },
                  contentStyle: {
                    backgroundColor: colors.background
                  }
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false
                  }}
                />

                <Stack.Screen
                  name="auth"
                  options={{
                    headerShown: false
                  }}
                />

                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false
                  }}
                />

                <Stack.Screen
                  name="mission/pythonquest-adventure"
                  options={{
                    title: 'PythonQuest Adventure'
                  }}
                />

                <Stack.Screen
                  name="lesson/[lessonId]"
                  options={{
                    title: 'Missão'
                  }}
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
          </LearningProvider>
        

      
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  }
});