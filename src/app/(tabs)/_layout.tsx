import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { colors } from '@/theme/colors';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: '900' },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          marginBottom:50
        },
        tabBarLabelStyle: {
          fontWeight: '800'
        }
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Início', tabBarIcon: () => <TabIcon emoji="🏠" /> }} />
      <Tabs.Screen name="learn" options={{ title: 'Trilha', tabBarIcon: () => <TabIcon emoji="🗺️" /> }} />
      <Tabs.Screen name="library" options={{ title: 'Biblioteca', tabBarIcon: () => <TabIcon emoji="📚" /> }} />
      <Tabs.Screen
  name="playground"
  options={{
    title: 'Terminal',
    tabBarIcon: ({ color }) => (
      <Text style={{ color, fontSize: 22 }}>🧪</Text>
    )
  }}
/>
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: () => <TabIcon emoji="👤" /> }} />
    </Tabs>
  );
}
