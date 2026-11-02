import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { getLevelInfo } from '@/features/progress/progress.helpers';
import { colors, radius, spacing } from '@/theme/colors';

type LevelProgressProps = {
  xp: number;
  dark?: boolean;
};

export function LevelProgress({ xp, dark = false }: LevelProgressProps) {
  const level = getLevelInfo(xp);
  const remainingXp = level.xpForNextLevel - level.xpIntoLevel;

  return (
    <View style={[styles.container, dark ? styles.containerDark : styles.containerLight]}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{level.level}</Text>
        </View>

        <View style={styles.textArea}>
          <Text style={[styles.levelLabel, dark && styles.textOnDark]}>
            Nível {level.level} · {level.title}
          </Text>
          <Text style={[styles.hint, dark && styles.hintOnDark]}>
            Faltam {remainingXp} XP para o nível {level.level + 1}
          </Text>
        </View>

        <Text style={[styles.xpValue, dark && styles.xpValueOnDark]}>{xp} XP</Text>
      </View>

      <ProgressBar
        value={level.percent}
        color={colors.accent}
        trackColor={dark ? 'rgba(255,255,255,0.14)' : colors.border}
        animated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  containerLight: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  levelNumber: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  textArea: {
    flex: 1
  },
  levelLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  textOnDark: {
    color: '#FFFFFF'
  },
  hintOnDark: {
    color: colors.inkText
  },
  xpValue: {
    color: colors.accentText,
    fontSize: 14,
    fontWeight: '800'
  },
  xpValueOnDark: {
    color: colors.accent
  }
});
