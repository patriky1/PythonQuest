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

import { getScreenBottomPadding } from '@/constants/layout';
import { colors, spacing } from '@/theme/colors';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  // Use em telas sem cabeçalho para respeitar a barra de status.
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  refreshControl?: ScrollViewProps['refreshControl'];
}>;

export function Screen({
  children,
  scroll = true,
  safeTop = false,
  style,
  contentContainerStyle,
  refreshControl
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const isInsideTabs = (segments as string[]).includes('(tabs)');

  const paddingTop = safeTop ? insets.top : 0;
  const paddingBottom = isInsideTabs
    ? getScreenBottomPadding(insets.bottom)
    : Math.max(insets.bottom, spacing.md);

  if (!scroll) {
    return (
      <View
        style={[
          styles.container,
          styles.padded,
          { paddingTop: paddingTop + spacing.sm, paddingBottom },
          style
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop }, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.scrollContent,
          styles.padded,
          { paddingBottom },
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
  padded: {
    paddingHorizontal: spacing.md
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.sm
  }
});
