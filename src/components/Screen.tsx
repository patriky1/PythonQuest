import React, { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/colors';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Edge[];
}>;

const defaultEdges: Edge[] = ['top', 'left', 'right'];

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  edges = defaultEdges
}: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.container, style]}>
        <View style={[styles.staticContent, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, contentStyle]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  staticContent: {
    flex: 1
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.md
  }
});