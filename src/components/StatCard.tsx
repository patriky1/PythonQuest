import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/theme/colors';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

export function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2
  },
  value: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '800',
    marginTop: 4
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  }
});
