import React, { PropsWithChildren } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';

import { colors, spacing } from '@/theme/colors';
import { getScreenBottomPadding } from '@/constants/layout';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}>;

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const isInsideTabs = segments.includes('(tabs)');

  const bottomPadding = isInsideTabs
    ? getScreenBottomPadding(insets.bottom)
    : Math.max(insets.bottom, spacing.lg);

  if (!scroll) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top
          },
          style,
          {
            paddingBottom: bottomPadding
          }
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: 0
        },
        style
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomPadding
          },
          contentContainerStyle
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  }
});