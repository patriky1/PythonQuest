import React, { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBottomSafeArea, TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { colors } from '@/theme/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'home', title: 'Início', icon: 'home-outline', activeIcon: 'home' },
  { name: 'learn', title: 'Trilha', icon: 'map-outline', activeIcon: 'map' },
  { name: 'library', title: 'Biblioteca', icon: 'library-outline', activeIcon: 'library' },
  { name: 'playground', title: 'Terminal', icon: 'code-slash-outline', activeIcon: 'code-slash' },
  { name: 'profile', title: 'Perfil', icon: 'person-circle-outline', activeIcon: 'person-circle' }
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomSafeArea = getBottomSafeArea(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: [
          styles.tabBar,
          { height: TAB_BAR_BASE_HEIGHT + bottomSafeArea, paddingBottom: bottomSafeArea }
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={String(color)} />
              </View>
            )
          }}
        />
      ))}
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
    borderTopColor: colors.border,
    elevation: 12
  },
  tabBarItem: {
    height: 52,
    justifyContent: 'center'
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '800'
  },
  iconBox: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBoxActive: {
    backgroundColor: colors.primarySoft
  }
});
