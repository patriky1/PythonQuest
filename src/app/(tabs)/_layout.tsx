import React, { ComponentProps, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/components/motion';
import { getBottomSafeArea, TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import { colors } from '@/theme/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TABS: {
  name: string;
  title: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  headerShown?: boolean;
}[] = [
  // O Início tem cabeçalho próprio (saudação, sequência e corações).
  { name: 'home', title: 'Início', icon: 'home-outline', activeIcon: 'home', headerShown: false },
  { name: 'learn', title: 'Trilha', icon: 'map-outline', activeIcon: 'map' },
  { name: 'library', title: 'Biblioteca', icon: 'library-outline', activeIcon: 'library' },
  { name: 'playground', title: 'Terminal', icon: 'code-slash-outline', activeIcon: 'code-slash' },
  { name: 'profile', title: 'Perfil', icon: 'person-circle-outline', activeIcon: 'person-circle' }
];

/** Ícone da aba: a pílula verde abre e o ícone dá um pulinho ao ser selecionado. */
function TabIcon({
  focused,
  color,
  icon,
  activeIcon
}: {
  focused: boolean;
  color: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}) {
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(focused ? 1 : 0);
      return;
    }

    Animated.spring(value, {
      toValue: focused ? 1 : 0,
      friction: 5,
      tension: 190,
      useNativeDriver: true
    }).start();
  }, [focused, reduceMotion, value]);

  return (
    <View style={styles.iconBox}>
      <Animated.View
        style={[
          styles.iconPill,
          {
            opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ scaleX: value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]
          }
        ]}
      />
      <Animated.View
        style={{
          transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }]
        }}
      >
        <Ionicons name={focused ? activeIcon : icon} size={22} color={color} />
      </Animated.View>
    </View>
  );
}

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
            headerShown: tab.headerShown ?? true,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                focused={focused}
                color={String(color)}
                icon={tab.icon}
                activeIcon={tab.activeIcon}
              />
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
    width: 48,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconPill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 15,
    backgroundColor: colors.primarySoft
  }
});
