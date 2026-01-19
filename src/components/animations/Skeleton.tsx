import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  // Colores que coinciden con el tema
  const backgroundColor = theme.name === 'dark'
    ? theme.colors.borderStrong  // #334155 - más sutil en modo oscuro
    : '#E1E9EE';

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton para una tarjeta de hábito
export const HabitCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.card, {
      backgroundColor: theme.colors.surface,
      borderLeftColor: theme.colors.border,
    }]}>
      <View style={styles.cardHeader}>
        <Skeleton width="60%" height={22} borderRadius={6} />
        <Skeleton width={60} height={28} borderRadius={14} />
      </View>
      <View style={styles.cardDetails}>
        <Skeleton width="40%" height={16} borderRadius={4} />
        <Skeleton width="30%" height={16} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.timeline}>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} width={32} height={32} borderRadius={16} />
        ))}
      </View>
      <View style={styles.cardActions}>
        <Skeleton width={100} height={36} borderRadius={18} />
      </View>
    </View>
  );
};

// Skeleton para la sección de XP y Liga
export const StatsCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.statsContainer}>
      <View style={[styles.xpLeagueCard, {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }]}>
        <View style={styles.statSection}>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width={60} height={28} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statSection}>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width={80} height={24} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={[styles.compactStats, {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }]}>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={styles.compactStatItem}>
            <Skeleton width={36} height={24} borderRadius={6} />
            <Skeleton width={48} height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
    </View>
  );
};

// Skeleton para el indicador de vidas
export const LivesIndicatorSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.livesContainer, {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    }]}>
      <View style={styles.heartsRow}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} width={28} height={28} borderRadius={14} style={{ marginHorizontal: 3 }} />
        ))}
      </View>
    </View>
  );
};

// Skeleton completo del Home
export const HomeScreenSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.homeContainer, { backgroundColor: theme.colors.background }]}>
      <LivesIndicatorSkeleton />
      <StatsCardSkeleton />
      <View style={styles.sectionHeader}>
        <Skeleton width={150} height={20} borderRadius={6} />
      </View>
      <HabitCardSkeleton />
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </View>
  );
};

// Skeleton para una fila de competidor en ligas
export const LeagueRowSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.leagueRow, { backgroundColor: theme.colors.surfaceSecondary }]}>
      <View style={styles.leagueRowLeft}>
        <Skeleton width={28} height={28} borderRadius={8} />
        <Skeleton width={120} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
      </View>
      <Skeleton width={50} height={16} borderRadius={4} />
    </View>
  );
};

// Skeleton para el header de ligas
export const LeagueHeaderSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.leagueHeader, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.leagueHeaderLeft}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <View style={{ marginLeft: 12 }}>
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={100} height={12} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={styles.leagueHeaderRight}>
        <Skeleton width={70} height={24} borderRadius={12} />
        <Skeleton width={50} height={28} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
};

// Skeleton completo de Ligas
export const LeaguesScreenSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.homeContainer, { backgroundColor: theme.colors.background }]}>
      <LeagueHeaderSkeleton />
      <View style={[styles.leagueRankingContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.leagueRankingHeader}>
          <Skeleton width={120} height={20} borderRadius={6} />
          <Skeleton width={80} height={14} borderRadius={4} />
        </View>
        {[...Array(8)].map((_, i) => (
          <LeagueRowSkeleton key={i} />
        ))}
      </View>
    </View>
  );
};

// Skeleton para el avatar del perfil
export const ProfileAvatarSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.profileAvatarContainer}>
      <Skeleton width={100} height={100} borderRadius={50} />
      <Skeleton width={28} height={28} borderRadius={14} style={styles.profileLeagueBadge} />
    </View>
  );
};

// Skeleton para el hero del perfil
export const ProfileHeroSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.profileHero}>
      <ProfileAvatarSkeleton />
      <Skeleton width={180} height={26} borderRadius={8} style={{ marginTop: 16 }} />
      <Skeleton width={200} height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width={140} height={14} borderRadius={4} style={{ marginTop: 8 }} />

      {/* Social stats row */}
      <View style={[styles.profileSocialRow, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.profileSocialItem}>
          <Skeleton width={40} height={24} borderRadius={6} />
          <Skeleton width={70} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={[styles.profileSocialDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.profileSocialItem}>
          <Skeleton width={40} height={24} borderRadius={6} />
          <Skeleton width={70} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
};

// Skeleton para una tarjeta de estadísticas del perfil
export const ProfileStatCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.profileStatCard, { backgroundColor: theme.colors.surface }]}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <Skeleton width={40} height={28} borderRadius={6} style={{ marginTop: 12 }} />
      <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
};

// Skeleton para la sección de estadísticas del perfil
export const ProfileStatsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.profileStatsSection}>
      <Skeleton width={120} height={20} borderRadius={6} />
      <View style={styles.profileStatsGrid}>
        <ProfileStatCardSkeleton />
        <ProfileStatCardSkeleton />
        <ProfileStatCardSkeleton />
        <ProfileStatCardSkeleton />
      </View>
    </View>
  );
};

// Skeleton para la sección de vidas del perfil
export const ProfileLivesSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.profileLivesCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.profileLivesHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={60} height={18} borderRadius={6} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.profileHeartsRow}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} width={28} height={28} borderRadius={14} style={{ marginHorizontal: 4 }} />
        ))}
      </View>
      <Skeleton width={160} height={16} borderRadius={4} style={{ marginTop: 12 }} />
    </View>
  );
};

// Skeleton para un hábito en el perfil
export const ProfileHabitRowSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.profileHabitRow, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.profileHabitLeft}>
        <Skeleton width={4} height={36} borderRadius={2} />
        <View style={{ marginLeft: 12 }}>
          <Skeleton width={140} height={16} borderRadius={4} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Skeleton width={14} height={14} borderRadius={7} />
            <Skeleton width={60} height={12} borderRadius={4} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </View>
      <Skeleton width={60} height={24} borderRadius={10} />
    </View>
  );
};

// Skeleton para la sección de hábitos del perfil
export const ProfileHabitsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.profileHabitsSection}>
      <View style={styles.profileHabitsHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width={100} height={20} borderRadius={6} />
        </View>
        <Skeleton width={28} height={24} borderRadius={12} />
      </View>
      {[...Array(3)].map((_, i) => (
        <ProfileHabitRowSkeleton key={i} />
      ))}
    </View>
  );
};

// Skeleton para la sección de retos completados
export const ProfileChallengesSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.profileChallengesCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.profileChallengesHeader}>
        <Skeleton width={22} height={22} borderRadius={11} />
        <Skeleton width={140} height={18} borderRadius={6} style={{ marginLeft: 10 }} />
      </View>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Skeleton width={60} height={42} borderRadius={8} />
        <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// Skeleton para los botones de acción del perfil
export const ProfileActionsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.profileActionsSection}>
      {[...Array(2)].map((_, i) => (
        <View key={i} style={[styles.profileActionButton, { backgroundColor: theme.colors.surface }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <Skeleton width={100} height={16} borderRadius={4} />
          </View>
          <Skeleton width={20} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
};

// Skeleton completo del Perfil
export const ProfileScreenSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.homeContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={{ width: 44 }} />
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      <ProfileHeroSkeleton />
      <ProfileStatsSkeleton />
      <View style={styles.profileLivesSection}>
        <ProfileLivesSkeleton />
      </View>
      <ProfileHabitsSkeleton />
      <View style={styles.profileChallengesSection}>
        <ProfileChallengesSkeleton />
      </View>
      <ProfileActionsSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDetails: {
    marginBottom: 12,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  cardActions: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  xpLeagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  statSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  divider: {
    width: 1,
    height: 48,
    marginHorizontal: 16,
  },
  compactStats: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
  },
  compactStatItem: {
    alignItems: 'center',
  },
  livesContainer: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  heartsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeContainer: {
    flex: 1,
    paddingTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  // League Skeletons
  leagueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 6,
    borderRadius: 12,
  },
  leagueRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  leagueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueHeaderRight: {
    alignItems: 'flex-end',
  },
  leagueRankingContainer: {
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
  },
  leagueRankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Profile Skeletons
  profileAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  profileLeagueBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  profileHero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileSocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  profileSocialItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileSocialDivider: {
    width: 1,
    height: 36,
  },
  profileStatCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  profileStatsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  profileLivesCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  profileLivesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileHeartsRow: {
    flexDirection: 'row',
  },
  profileLivesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileHabitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  profileHabitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileHabitsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileHabitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileChallengesCard: {
    borderRadius: 16,
    padding: 20,
  },
  profileChallengesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileChallengesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  profileActionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
