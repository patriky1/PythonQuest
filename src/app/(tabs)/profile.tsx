import React, { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { router } from 'expo-router';

import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';

import { lessons } from '@/data/curriculum';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/store/progressStore';

import { colors, spacing } from '@/theme/colors';
import { calculateProgressPercent } from '@/utils/game';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { progress, resetProgress, restoreHearts } = useProgress();

  const percent = calculateProgressPercent(progress.completedLessonIds);

  const completedLessons = progress.completedLessonIds.length;
  const totalLessons = lessons.length;

  const nextBadgeHint = useMemo(() => {
    if (completedLessons === 0) {
      return 'Conclua sua primeira missão para liberar a primeira medalha.';
    }

    if (completedLessons < 5) {
      return `Faltam ${5 - completedLessons} missões para a medalha Explorador Python.`;
    }

    if (completedLessons < 10) {
      return `Faltam ${10 - completedLessons} missões para a medalha Aventureiro do Código.`;
    }

    return 'Continue praticando para manter sua evolução ativa.';
  }, [completedLessons]);

  function confirmReset() {
    Alert.alert(
      'Zerar progresso?',
      'Essa ação remove XP, medalhas, corações e lições concluídas desta conta neste aparelho.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Zerar progresso',
          style: 'destructive',
          onPress: resetProgress
        }
      ]
    );
  }

  function confirmLogout() {
    Alert.alert(
      'Sair da conta?',
      'Você voltará para a tela de login.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: handleLogout
        }
      ]
    );
  }

  async function handleLogout() {
    await signOut();
    router.replace('/auth/login');
  }

  function openPlayground() {
    router.push('/(tabs)/playground');
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'P'}
            </Text>
          </View>

          <View style={styles.headerTextArea}>
            <Text style={styles.profileLabel}>Perfil do aluno</Text>
            <Text style={styles.profileName}>
              {user?.name || 'Aprendiz Python'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'Conta local'}
            </Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelLabel}>Progresso geral</Text>
              <Text style={styles.levelTitle}>
                {percent}% da trilha concluída
              </Text>
            </View>

            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{completedLessons}</Text>
            </View>
          </View>

          <ProgressBar value={percent} />

          <Text style={styles.levelHint}>
            {completedLessons} de {totalLessons} missões concluídas
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>{progress.xp}</Text>
            <Text style={styles.statLabel}>XP total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{progress.streak}</Text>
            <Text style={styles.statLabel}>Sequência</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statValue}>{progress.hearts}</Text>
            <Text style={styles.statLabel}>Corações</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medalhas</Text>
          <Text style={styles.sectionSubtitle}>
            Conquistas liberadas durante a trilha
          </Text>
        </View>

        <View style={styles.card}>
          {progress.badges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Nenhuma medalha ainda</Text>
              <Text style={styles.emptyText}>{nextBadgeHint}</Text>
            </View>
          ) : (
            <>
              <View style={styles.badgesList}>
                {progress.badges.map((badge) => (
                  <View key={badge} style={styles.badgeItem}>
                    <View style={styles.badgeIconBox}>
                      <Text style={styles.badgeIcon}>🏆</Text>
                    </View>

                    <View style={styles.badgeTextArea}>
                      <Text style={styles.badgeTitle}>{badge}</Text>
                      <Text style={styles.badgeDescription}>
                        Conquista desbloqueada no PythonQuest.
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.nextBadgeBox}>
                <Text style={styles.nextBadgeLabel}>Próxima meta</Text>
                <Text style={styles.nextBadgeText}>{nextBadgeHint}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <Text style={styles.sectionSubtitle}>
            Controle sua conta e sua prática
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.cardPressed
            ]}
            onPress={openPlayground}
          >
            <Text style={styles.actionIcon}>🧪</Text>
            <Text style={styles.actionTitle}>Laboratório</Text>
            <Text style={styles.actionText}>
              Teste comandos Python livremente.
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.cardPressed
            ]}
            onPress={restoreHearts}
          >
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionTitle}>Restaurar</Text>
            <Text style={styles.actionText}>
              Recarregue seus corações.
            </Text>
          </Pressable>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Área da conta</Text>

          <Pressable
            style={({ pressed }) => [
              styles.outlineDangerButton,
              pressed && styles.cardPressed
            ]}
            onPress={confirmReset}
          >
            <Text style={styles.outlineDangerButtonText}>
              Zerar progresso desta conta
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.solidDangerButton,
              pressed && styles.cardPressed
            ]}
            onPress={confirmLogout}
          >
            <Text style={styles.solidDangerButtonText}>
              Sair da conta
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl
  },
  headerCard: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12
    },
    elevation: 5
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '900'
  },
  headerTextArea: {
    flex: 1
  },
  profileLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  profileEmail: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  levelLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  levelTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900'
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  levelBadgeText: {
    color: '#166534',
    fontSize: 18,
    fontWeight: '900'
  },
  levelHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.sm
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.md,
    alignItems: 'center'
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center'
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.md
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: spacing.sm
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6
  },
  badgesList: {
    gap: spacing.sm
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: spacing.md
  },
  badgeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeIcon: {
    fontSize: 24
  },
  badgeTextArea: {
    flex: 1
  },
  badgeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900'
  },
  badgeDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  nextBadgeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    padding: spacing.md,
    marginTop: spacing.md
  },
  nextBadgeLabel: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  nextBadgeText: {
    color: '#1E3A8A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.md
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  actionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  dangerZone: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm
  },
  dangerTitle: {
    color: '#991B1B',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4
  },
  outlineDangerButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  outlineDangerButtonText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '900'
  },
  solidDangerButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  solidDangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9
  }
});