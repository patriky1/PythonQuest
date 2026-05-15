import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

type StatCardProps = {
  label: string;
  value: string | number;
  emoji: string;
};

export function StatCard({ label, value, emoji }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4
  },
  value: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '900'
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  }
});
