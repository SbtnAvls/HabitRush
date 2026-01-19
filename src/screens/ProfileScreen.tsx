import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { HabitLogic } from '../services/habitLogic';
import { AuthModal } from '../components/AuthModal';
import { useCurrentLeague } from '../hooks/useCurrentLeague';
import { SocialService } from '../services/socialService';
import { UserSearchBar } from '../components/social/UserSearchBar';
import { SocialUser } from '../types/social';
import { useTheme } from '../theme/useTheme';
import { AppTheme } from '../theme';
import {
  ProfileScreenSkeleton,
  Skeleton,
  AnimatedView,
  AnimatedNumber,
} from '../components/animations';

const { width } = Dimensions.get('window');

// Animated Action Button with press feedback
interface AnimatedActionButtonProps {
  icon: string;
  iconColor: string;
  text: string;
  textColor?: string;
  onPress: () => void;
  style: any;
  theme: AppTheme;
  delay?: number;
}

const AnimatedActionButton: React.FC<AnimatedActionButtonProps> = ({
  icon,
  iconColor,
  text,
  textColor,
  onPress,
  style,
  theme,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: iconColor + '15',
          }}>
            <Ionicons name={icon as any} size={20} color={iconColor} />
          </View>
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: textColor || theme.colors.textPrimary,
          }}>{text}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { state, loading, isAuthenticated, authUser, logout, refreshState } = useAppContext();
  const stats = HabitLogic.getUserStats(state);
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated);
  const { data: currentLeagueData } = useCurrentLeague();
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0 });
  const [socialLoading, setSocialLoading] = useState(false);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(statsScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, 200);
  }, []);

  useEffect(() => {
    if (isAuthenticated && authUser?.id) {
      loadSocialStats();
    }
  }, [isAuthenticated, authUser?.id]);

  const loadSocialStats = async () => {
    if (!authUser?.id) return;
    setSocialLoading(true);
    try {
      const profile = await SocialService.getPublicProfile(authUser.id);
      setSocialStats({
        followers: profile.followers_count,
        following: profile.following_count,
      });
    } catch (error) {
      console.error('Error loading social stats:', error);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleUserPress = (user: SocialUser) => {
    navigation?.navigate('PublicProfile', { userId: user.id });
  };

  const handleFollowersPress = () => {
    if (authUser?.id) {
      navigation?.navigate('FollowList', {
        userId: authUser.id,
        type: 'followers',
        username: state.user.name,
      });
    }
  };

  const handleFollowingPress = () => {
    if (authUser?.id) {
      navigation?.navigate('FollowList', {
        userId: authUser.id,
        type: 'following',
        username: state.user.name,
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesion',
      'Estas seguro de que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation?.navigate('Home');
          },
        },
      ]
    );
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await refreshState();
  };

  const handleSettingsPress = () => {
    navigation?.navigate('Settings');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <AuthModal
          visible={true}
          onClose={() => navigation?.navigate('Home')}
          onAuthSuccess={handleAuthSuccess}
        />
      </View>
    );
  }

  const renderStatCard = (
    icon: string,
    value: number | string,
    label: string,
    color: string,
    delay: number = 0
  ) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          transform: [{ scale: statsScale }],
        },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      {typeof value === 'number' ? (
        <AnimatedNumber value={value} style={styles.statValue} duration={800} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  const renderLifeHeart = (index: number, isActive: boolean) => (
    <Animated.View
      key={index}
      style={[
        styles.heartContainer,
        {
          transform: [{ scale: statsScale }],
          opacity: isActive ? 1 : 0.3,
        },
      ]}
    >
      <Ionicons
        name={isActive ? 'heart' : 'heart-outline'}
        size={28}
        color={theme.colors.danger}
      />
    </Animated.View>
  );

  const renderHabitItem = (habit: typeof state.habits[0], index: number) => {
    const isActive = habit.isActive;
    return (
      <Animated.View
        key={habit.id}
        style={[
          styles.habitCard,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <View style={styles.habitLeft}>
          <View style={[styles.habitIndicator, { backgroundColor: isActive ? theme.colors.success : theme.colors.danger }]} />
          <View style={styles.habitInfo}>
            <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
            <View style={styles.habitMeta}>
              <Ionicons name="flame" size={14} color={theme.colors.warning} />
              <Text style={styles.habitStreak}>{habit.currentStreak} dias</Text>
            </View>
          </View>
        </View>
        <View style={[styles.habitBadge, { backgroundColor: isActive ? theme.colors.success + '15' : theme.colors.danger + '15' }]}>
          <Text style={[styles.habitBadgeText, { color: isActive ? theme.colors.success : theme.colors.danger }]}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Show skeleton during initial loading
  if (loading) {
    return (
      <View style={styles.container}>
        <ProfileScreenSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header with Settings */}
        <AnimatedView animation="fadeIn" delay={100}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </AnimatedView>

        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: avatarScale }] }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(state.user.name)}</Text>
            </View>
            {currentLeagueData?.league && (
              <View style={[styles.leagueBadge, { backgroundColor: currentLeagueData.league.colorHex }]}>
                <Ionicons name="trophy" size={12} color="#FFFFFF" />
              </View>
            )}
          </Animated.View>

          <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
            <Text style={styles.userName}>{state.user.name}</Text>
            {authUser?.email && (
              <Text style={styles.userEmail}>{authUser.email}</Text>
            )}
            <View style={styles.joinDateContainer}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.joinDate}>Desde {formatDate(state.user.createdAt)}</Text>
            </View>
          </Animated.View>

          {/* Social Stats */}
          {isAuthenticated && (
            <AnimatedView animation="fadeSlideUp" delay={300}>
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialItem} onPress={handleFollowersPress}>
                  {socialLoading ? (
                    <Skeleton width={40} height={24} borderRadius={6} />
                  ) : (
                    <AnimatedNumber value={socialStats.followers} style={styles.socialNumber} />
                  )}
                  <Text style={styles.socialLabel}>Seguidores</Text>
                </TouchableOpacity>

                <View style={styles.socialDivider} />

                <TouchableOpacity style={styles.socialItem} onPress={handleFollowingPress}>
                  {socialLoading ? (
                    <Skeleton width={40} height={24} borderRadius={6} />
                  ) : (
                    <AnimatedNumber value={socialStats.following} style={styles.socialNumber} />
                  )}
                  <Text style={styles.socialLabel}>Siguiendo</Text>
                </TouchableOpacity>
              </View>
            </AnimatedView>
          )}
        </View>

        {/* Search Friends */}
        {isAuthenticated && (
          <AnimatedView animation="fadeSlideUp" delay={400}>
            <View style={styles.searchSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={20} color={theme.colors.textPrimary} />
                <Text style={styles.sectionTitle}>Buscar Amigos</Text>
              </View>
              <UserSearchBar
                onUserPress={handleUserPress}
                currentUserId={authUser?.id}
                placeholder="Buscar por nombre de usuario..."
              />
            </View>
          </AnimatedView>
        )}

        {/* Stats Grid */}
        <AnimatedView animation="fadeSlideUp" delay={500}>
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitleLarge}>Estadisticas</Text>
            <View style={styles.statsGrid}>
              {renderStatCard('list-outline', stats.totalHabits, 'Habitos', theme.colors.primary)}
              {renderStatCard('checkmark-circle-outline', stats.activeHabits, 'Activos', theme.colors.success)}
              {renderStatCard('flame-outline', stats.totalStreak, 'Racha', theme.colors.warning)}
              {renderStatCard('today-outline', stats.completedToday, 'Hoy', '#9B59B6')}
            </View>
          </View>
        </AnimatedView>

        {/* Lives Section */}
        <AnimatedView animation="fadeSlideUp" delay={600}>
          <View style={styles.livesSection}>
            <View style={styles.livesCard}>
              <View style={styles.livesHeader}>
                <AnimatedView animation="bounce">
                  <Ionicons name="heart-circle" size={24} color={theme.colors.danger} />
                </AnimatedView>
                <Text style={styles.livesTitle}>Vidas</Text>
              </View>

              <View style={styles.heartsRow}>
                {Array.from({ length: stats.maxLives }, (_, index) =>
                  renderLifeHeart(index, index < stats.lives)
                )}
              </View>

              <Text style={styles.livesCount}>
                {stats.lives} de {stats.maxLives} vidas disponibles
              </Text>

              <View style={styles.livesTip}>
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.textMuted} />
                <Text style={styles.livesTipText}>
                  Pierdes una vida al no completar un habito. Recupera vidas completando retos.
                </Text>
              </View>
            </View>
          </View>
        </AnimatedView>

        {/* Habits List */}
        <AnimatedView animation="fadeSlideUp" delay={700}>
          <View style={styles.habitsSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="repeat-outline" size={20} color={theme.colors.textPrimary} />
                <Text style={styles.sectionTitleLarge}>Mis Habitos</Text>
              </View>
              <AnimatedView animation="scale" delay={800}>
                <View style={styles.habitCountBadge}>
                  <Text style={styles.habitCountText}>{state.habits.length}</Text>
                </View>
              </AnimatedView>
            </View>

            {state.habits.length === 0 ? (
              <View style={styles.emptyState}>
                <AnimatedView animation="bounce" delay={850}>
                  <Ionicons name="leaf-outline" size={48} color={theme.colors.textMuted} />
                </AnimatedView>
                <Text style={styles.emptyText}>No tienes habitos creados aun</Text>
                <Text style={styles.emptySubtext}>Crea tu primer habito para comenzar</Text>
              </View>
            ) : (
              <View style={styles.habitsList}>
                {state.habits
                  .sort((a, b) => (a.activeByUser ? -1 : 1))
                  .map((habit, index) => (
                    <AnimatedView
                      key={habit.id}
                      animation="fadeSlideUp"
                      delay={800 + (index * 80)}
                      index={index}
                    >
                      {renderHabitItem(habit, index)}
                    </AnimatedView>
                  ))}
              </View>
            )}
          </View>
        </AnimatedView>

        {/* Challenges Completed */}
        <AnimatedView animation="fadeSlideUp" delay={900}>
          <View style={styles.challengesSection}>
            <View style={styles.challengesCard}>
              <View style={styles.challengesHeader}>
                <AnimatedView animation="bounce" delay={950}>
                  <Ionicons name="trophy-outline" size={22} color={theme.colors.warning} />
                </AnimatedView>
                <Text style={styles.challengesTitle}>Retos Completados</Text>
              </View>

              {state.user.completedChallenges.length === 0 ? (
                <View style={styles.challengesEmpty}>
                  <Text style={styles.challengesEmptyText}>No has completado retos aun</Text>
                </View>
              ) : (
                <View style={styles.challengesCount}>
                  <AnimatedNumber
                    value={state.user.completedChallenges.length}
                    style={styles.challengesNumber}
                    duration={1200}
                  />
                  <Text style={styles.challengesLabel}>retos completados</Text>
                </View>
              )}
            </View>
          </View>
        </AnimatedView>

        {/* Account Actions */}
        <AnimatedView animation="fadeSlideUp" delay={1000}>
          <View style={styles.actionsSection}>
            <AnimatedActionButton
              icon="settings-outline"
              iconColor={theme.colors.primary}
              text="Configuracion"
              onPress={handleSettingsPress}
              style={styles.actionButton}
              theme={theme}
            />

            <AnimatedActionButton
              icon="log-out-outline"
              iconColor={theme.colors.danger}
              text="Cerrar Sesion"
              textColor={theme.colors.danger}
              onPress={handleLogout}
              style={styles.actionButton}
              theme={theme}
              delay={100}
            />
          </View>
        </AnimatedView>

        {/* Footer */}
        <AnimatedView animation="fadeIn" delay={1100}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>HabitRush v1.0.0</Text>
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const isDark = theme.name === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    headerSpacer: {
      width: 44,
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    heroSection: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.textOnPrimary,
    },
    leagueBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    userName: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    joinDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    joinDate: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    socialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    socialItem: {
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    socialNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    socialLabel: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    socialDivider: {
      width: 1,
      height: 36,
      backgroundColor: theme.colors.border,
    },
    searchSection: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sectionTitleLarge: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    statsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 16,
      gap: 12,
    },
    statCard: {
      width: (width - 52) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    livesSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    livesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    livesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    livesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    heartsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    heartContainer: {
      padding: 4,
    },
    livesCount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    livesTip: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 12,
      padding: 12,
    },
    livesTipText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    habitsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    habitCountBadge: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    habitCountText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    habitsList: {
      gap: 10,
    },
    habitCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    habitLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    habitIndicator: {
      width: 4,
      height: 36,
      borderRadius: 2,
      marginRight: 12,
    },
    habitInfo: {
      flex: 1,
    },
    habitName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    habitMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    habitStreak: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    habitBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    habitBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    challengesSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    challengesCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    challengesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    challengesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    challengesEmpty: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    challengesEmptyText: {
      fontSize: 14,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    challengesCount: {
      alignItems: 'center',
    },
    challengesNumber: {
      fontSize: 42,
      fontWeight: 'bold',
      color: theme.colors.warning,
    },
    challengesLabel: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: -4,
    },
    actionsSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 10,
    },
    actionButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
  });
};
