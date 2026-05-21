import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabIconProps = {
  focused: boolean;
  icon: IoniconName;
  activeIcon: IoniconName;
};

function TabIcon({ focused, icon, activeIcon }: TabIconProps) {
  return (
    <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
      <Ionicons
        name={focused ? activeIcon : icon}
        size={22}
        color={focused ? '#16A34A' : '#8A94A6'}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '900'
        },

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#8A94A6',

        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'ios'
              ? 62 + insets.bottom
              : 62,
            paddingBottom: Platform.OS === 'ios'
              ? Math.max(insets.bottom, 6)
              : 6
          }
        ],

        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="home-outline"
              activeIcon="home"
            />
          )
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: 'Trilha',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="compass-outline"
              activeIcon="compass"
            />
          )
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="library-outline"
              activeIcon="library"
            />
          )
        }}
      />

      <Tabs.Screen
        name="playground"
        options={{
          title: 'Terminal',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="code-slash-outline"
              activeIcon="code-slash"
            />
          )
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="person-circle-outline"
              activeIcon="person-circle"
            />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,

    paddingTop: 4,
    paddingHorizontal: 6,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,
    borderTopColor: '#E8EEF5',

    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: -6
    },

    elevation: 14
  },

  tabBarItem: {
    height: 52,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center'
  },

  tabBarLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 0,
    marginBottom: 0
  },

  iconBox: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },

  iconBoxActive: {
    backgroundColor: '#ECFDF5'
  }
});