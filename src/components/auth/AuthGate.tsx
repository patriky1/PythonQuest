import React, { PropsWithChildren, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export function AuthGate({ children }: PropsWithChildren) {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const firstSegment = segments[0];
    const isAuthRoute = firstSegment === 'auth';

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>🐍</Text>
        <Text style={styles.title}>PythonQuest</Text>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14
  },
  logo: {
    fontSize: 54
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827'
  }
});