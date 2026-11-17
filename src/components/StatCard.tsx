import React, { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CountUp } from '@/components/motion';
import { colors, radius, spacing } from '@/theme/colors';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

export function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconBox, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      {typeof value === 'number' ? (
        <CountUp value={value} style={styles.value} />
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
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
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  value: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '800',
    marginTop: 6
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700'
  }
});
