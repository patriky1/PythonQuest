import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { LevelProgress } from '@/components/LevelProgress';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import { useLearning } from '@/context/LearningContext';
import { useProgress } from '@/features/progress/ProgressContext';
import { BADGES } from '@/features/progress/progress.constants';
import { getBadgeMetricValue, toPercent } from '@/features/progress/progress.helpers';
import { colors, radius, shadow, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { progress, activeStreak, resetProgress } = useProgress();
  const { lessons } = useLearning();

  const completedLessons = progress.completedLessonIds.length;
  const trackPercent = toPercent(completedLessons, lessons.length);

  const achievements = useMemo(
    () =>
      BADGES.map((badge) => {
        const value = Math.min(getBadgeMetricValue(progress, badge), badge.target);

        return {
          ...badge,
          value,
          unlocked: progress.badges.includes(badge.id) || value >= badge.target
        };
      }).sort((a, b) => Number(b.unlocked) - Number(a.unlocked)),
    [progress]
  );

  const adventureBadges = useMemo(() => {
    const catalogIds = new Set(BADGES.map((badge) => badge.id));
    return progress.badges.filter((badge) => !catalogIds.has(badge));
  }, [progress.badges]);

  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  function confirmReset() {
    Alert.alert(
      'Zerar progresso?',
      user
        ? 'Isso apaga XP, medalhas e missões concluídas da sua conta. Não dá para desfazer.'
        : 'Isso apaga XP, medalhas e missões concluídas deste aparelho. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Zerar progresso', style: 'destructive', onPress: resetProgress }
      ]
    );
  }

  function confirmLogout() {
    Alert.alert('Sair da conta?', 'Seu progresso fica salvo na nuvem.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        }
      }
    ]);
  }

  return (
    <Screen>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {user?.name ? (
            <Text style={styles.avatarText}>{user.name.slice(0, 1).toUpperCase()}</Text>
          ) : (
            <Ionicons name="person" size={32} color={colors.ink} />
          )}
        </View>

        <View style={styles.headerTextArea}>
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.name || 'Visitante'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email || 'Progresso salvo só neste aparelho'}
          </Text>
        </View>
      </View>

      <LevelProgress xp={progress.xp} />

      <View style={styles.statsGrid}>
        <StatCard label="Sequência" value={activeStreak} icon="flame" color="#EA580C" />
        <StatCard label="Corações" value={progress.hearts} icon="heart" color={colors.heart} />
        <StatCard
          label="Adventure"
          value={progress.completedSpecialMissionIds.length}
          icon="game-controller"
          color={colors.secondary}
        />
      </View>

      <View style={styles.trackCard}>
        <View style={styles.trackHeader}>
          <Text style={styles.trackTitle}>Trilha Python</Text>
          <Text style={styles.trackPercent}>{trackPercent}%</Text>
        </View>
        <ProgressBar value={trackPercent} />
        <Text style={styles.trackHint}>
          {completedLessons} de {lessons.length} missões concluídas
        </Text>
      </View>

      <SectionHeader
        title="Conquistas"
        subtitle={`${unlockedCount} de ${achievements.length} desbloqueadas`}
      />

      <View style={styles.badgeGrid}>
        {achievements.map((badge) => (
          <View
            key={badge.id}
            style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}
            accessible
            accessibilityLabel={`${badge.id}. ${badge.unlocked ? 'Desbloqueada' : `Bloqueada, ${badge.value} de ${badge.target}`}. ${badge.description}`}
          >
            <View style={[styles.badgeIcon, badge.unlocked && styles.badgeIconUnlocked]}>
              <Ionicons
                name={badge.unlocked ? badge.icon : 'lock-closed'}
                size={22}
                color={badge.unlocked ? colors.accentText : colors.muted}
              />
            </View>
            <Text style={styles.badgeTitle} numberOfLines={2}>
              {badge.id}
            </Text>
            <Text style={styles.badgeDescription} numberOfLines={2}>
              {badge.description}
            </Text>
            {!badge.unlocked ? (
              <View style={styles.badgeProgress}>
                <View style={styles.badgeProgressBar}>
                  <ProgressBar
                    value={toPercent(badge.value, badge.target)}
                    height={6}
                    color={colors.warning}
                  />
                </View>
                <Text style={styles.badgeProgressText}>
                  {badge.value}/{badge.target}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {adventureBadges.length > 0 ? (
        <>
          <SectionHeader title="Medalhas do Adventure" />
          <View style={styles.adventureBadges}>
            {adventureBadges.map((badge) => (
              <View key={badge} style={styles.adventureBadge}>
                <Ionicons name="medal" size={16} color={colors.secondaryDark} />
                <Text style={styles.adventureBadgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Conta" />

      <View style={styles.accountCard}>
        {user ? (
          <AppButton title="Sair da conta" icon="log-out-outline" variant="ghost" onPress={confirmLogout} />
        ) : (
          <>
            <Text style={styles.accountHint}>
              Crie uma conta para salvar seu progresso na nuvem e continuar em outro celular.
            </Text>
            <AppButton title="Entrar" icon="log-in-outline" onPress={() => router.push('/auth/login')} />
            <AppButton title="Criar conta" variant="ghost" onPress={() => router.push('/auth/register')} />
          </>
        )}

        <AppButton
          title="Zerar progresso"
          icon="trash-outline"
          variant="dangerOutline"
          onPress={confirmReset}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadow.raised
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900'
  },
  headerTextArea: {
    flex: 1
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  profileEmail: {
    color: colors.inkText,
    fontSize: 14,
    marginTop: 4
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md
  },
  trackCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  trackTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  trackPercent: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '900'
  },
  trackHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm
  },
  badgeCard: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4
  },
  badgeCardLocked: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  badgeIconUnlocked: {
    backgroundColor: colors.accentSoft
  },
  badgeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  badgeDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  badgeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  badgeProgressBar: {
    flex: 1
  },
  badgeProgressText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800'
  },
  adventureBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  adventureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  adventureBadgeText: {
    color: colors.secondaryDark,
    fontSize: 13,
    fontWeight: '800'
  },
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm
  },
  accountHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  }
});
