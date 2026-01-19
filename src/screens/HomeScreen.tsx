import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { HabitCard } from '../components/HabitCard';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { AddHabitModal } from '../components/AddHabitModal';
import { CompleteHabitModal } from '../components/CompleteHabitModal';
import { LifeChallengeCard } from '../components/LifeChallengeCard';
import { AppHeader } from '../components/AppHeader';
import { AuthModal } from '../components/AuthModal';
import { HabitLogic } from '../services/habitLogic';
import { Habit, PendingRedemption } from '../types';
import { useCurrentLeague } from '../hooks/useCurrentLeague';
import { usePendingRedemptions } from '../hooks/usePendingRedemptions';
import { LivesIndicator } from '../components/LivesIndicator';
import { GameOverScreen } from './GameOverScreen';
import { LifeChallengeNotification } from '../components/LifeChallengeNotification';
import { LeagueChangeNotification } from '../components/LeagueChangeNotification';
import { PendingRedemptionBanner } from '../components/PendingRedemptionBanner';
import { PendingRedemptionModal } from '../components/PendingRedemptionModal';
import { useLeagueChangeDetection } from '../hooks/useLeagueChangeDetection';
import { FirstCompletionCelebration } from '../components/FirstCompletionCelebration';
import sessionEventEmitter from '../services/sessionEventEmitter';
import { HomeScreenSkeleton } from '../components/animations/Skeleton';
import { AnimatedView, AnimatedNumber } from '../components/animations/AnimatedView';
import { AnimatedFAB } from '../components/animations/AnimatedFAB';
import { PulsingDot } from '../components/animations/PulsingDot';
import { AnimatedCollapsible, AnimatedToggleButton, AnimatedFadeOverlay } from '../components/animations/AnimatedCollapsible';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const { state, loading, markHabitCompleted, createHabit, refreshState, completeChallenge, activateHabit, redeemLifeChallenge, isAuthenticated, authUser } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllChallenges, setShowAllChallenges] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lifeChallengeNotification, setLifeChallengeNotification] = useState<any>(null);
  const [selectedPendingRedemption, setSelectedPendingRedemption] = useState<PendingRedemption | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [firstCompletionCelebration, setFirstCompletionCelebration] = useState<{ visible: boolean; habitName: string }>({ visible: false, habitName: '' });
  const { data: leagueData } = useCurrentLeague();
  const { pendingChange: leagueChange, dismissChange: dismissLeagueChange } = useLeagueChangeDetection();
  const scrollViewRef = useRef<ScrollView>(null);

  // Resetear scroll al top cuando cambie el estado de autenticación
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [isAuthenticated]);

  // Hook para pending redemptions (24h de gracia)
  // onUserDead: cuando el usuario pierde todas las vidas al aceptar perder vida
  const {
    pendingRedemptions,
    hasActivePendings,
    redeemLife,
    redeemChallenge,
    actionLoading: pendingActionLoading,
  } = usePendingRedemptions({
    onUserDead: () => {
      // El usuario perdió todas las vidas - el componente GameOverScreen
      // se mostrará automáticamente al detectar lives === 0
      // No necesitamos hacer nada adicional aquí
    },
  });

  // Separar hábitos activos e inactivos
  const activeHabits = state.habits.filter(h => h.activeByUser);
  const inactiveHabits = state.habits.filter(h => !h.activeByUser);

  // NOTA: La disponibilidad de retos (canRedeem) ahora viene del backend
  // ya no se calcula localmente con HabitLogic.getAvailableLifeChallenges

  // Escuchar eventos de Life Challenges obtenidos
  useEffect(() => {
    const handleLifeChallengeObtained = (challenges: any[]) => {
      if (challenges && challenges.length > 0) {
        setLifeChallengeNotification(challenges[0]);
      }
    };

    sessionEventEmitter.on('LIFE_CHALLENGE_OBTAINED', handleLifeChallengeObtained);

    return () => {
      sessionEventEmitter.off('LIFE_CHALLENGE_OBTAINED', handleLifeChallengeObtained);
    };
  }, []);

  // Verificar si el usuario no tiene vidas
  const userHasNoLives = state.user.lives === 0;

  // Si no tiene vidas, mostrar pantalla de Game Over
  if (userHasNoLives) {
    return <GameOverScreen />;
  }

  // Si está cargando inicialmente (sin datos), mostrar skeletons
  if (loading && state.habits.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <ScrollView contentContainerStyle={styles.listContainer}>
          <HomeScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  // Determinar si mostrar skeletons (durante refresh)
  const showSkeletons = refreshing;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshState();
    setRefreshing(false);
  };

  const handleCompleteHabit = (habitId: string) => {
    const habit = state.habits.find(h => h.id === habitId);
    if (habit) {
      setSelectedHabit(habit);
      setShowCompleteModal(true);
    }
  };

  const handleCompleteConfirm = async (progressData?: any, notes?: string, images?: string[]) => {
    if (selectedHabit) {
      // Verificar si es el primer completion (racha actual es 0)
      const isFirstCompletion = selectedHabit.currentStreak === 0;
      const habitName = selectedHabit.name;

      const result = await markHabitCompleted(selectedHabit.id, progressData, notes, images);

      // Si es el primer completion, mostrar celebración
      if (isFirstCompletion && result.success) {
        setFirstCompletionCelebration({ visible: true, habitName });
      }
      // Si se obtuvieron Life Challenges, mostrar notificación (después de la celebración)
      else if (result.lifeChallengesObtained && result.lifeChallengesObtained.length > 0) {
        setLifeChallengeNotification(result.lifeChallengesObtained[0]);
      }

      setSelectedHabit(null);
    }
  };

  const handleCreateHabit = async (
    name: string,
    frequency: any,
    progressType: any,
    activeByUser: boolean,
    description?: string,
    targetDate?: Date,
    targetValue?: number
  ) => {
    await createHabit(name, frequency, progressType, activeByUser, description, targetDate, targetValue);
  };

  const handleAddHabitPress = () => {
    if (!isAuthenticated) {
      // Si no está autenticado, mostrar el modal de autenticación
      setShowAuthModal(true);
    } else {
      // Si está autenticado, mostrar el modal de agregar hábito
      setShowAddModal(true);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    // Recargar el estado después de autenticar
    await refreshState();
    // Ahora sí abrir el modal de agregar hábito
    setShowAddModal(true);
  };

  const handleActivateHabit = async (habitId: string) => {
    await activateHabit(habitId);
  };

  const handleRedeemChallenge = async (challengeId: string) => {
    try {
      await redeemLifeChallenge(challengeId);
      Alert.alert(
        '¡Vida Obtenida!',
        'Has canjeado tu recompensa exitosamente.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error redeeming challenge:', error);

      // Manejar error de casillas insuficientes (retos 'once')
      if (error.code === 'INSUFFICIENT_LIFE_SLOTS') {
        Alert.alert(
          'Casillas Insuficientes',
          `${error.message}\n\n` +
          `Puedes desbloquear más casillas de vida completando ciertos retos especiales que aumentan tu máximo de vidas.`,
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'No se pudo canjear el reto. Intenta de nuevo.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleReactivateHabit = async (habitId: string) => {
    const availableChallenges = state.challenges.filter(c => !c.isCompleted);
    const randomChallenge = HabitLogic.getRandomChallenges(availableChallenges, 1)[0];
    
    if (randomChallenge) {
      await completeChallenge(randomChallenge.id, habitId);
    }
  };

  const handleHabitPress = (habitId: string) => {
    if (navigation) {
      navigation.navigate('HabitDetail', { habitId });
    }
  };

  // Handlers para pending redemptions
  const handlePendingBannerPress = (pending: PendingRedemption) => {
    setSelectedPendingRedemption(pending);
    setShowPendingModal(true);
  };

  const handleClosePendingModal = () => {
    setShowPendingModal(false);
    setSelectedPendingRedemption(null);
  };

  const handlePendingRedeemLife = async (pendingId: string) => {
    await redeemLife(pendingId);
  };

  const handlePendingRedeemChallenge = async (pendingId: string, challengeId: string) => {
    await redeemChallenge(pendingId, challengeId);
  };

  const renderHabitCard = ({ item: habit }: { item: any }) => {
    const isCompletedToday = HabitLogic.wasCompletedToday(habit.id, state.completions);
    const availableChallenges = state.challenges.filter(c => !c.isCompleted);

    return (
      <HabitCard
        habit={habit}
        isCompletedToday={isCompletedToday}
        onComplete={handleCompleteHabit}
        onReactivate={handleReactivateHabit}
        onPress={handleHabitPress}
        availableChallenges={availableChallenges}
        completions={state.completions}
      />
    );
  };

  const stats = HabitLogic.getUserStats(state);

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />

      {/* Indicador sutil de sincronización */}
      {loading && (
        <AnimatedView animation="fadeIn" duration={200}>
          <View style={styles.syncIndicator}>
            <PulsingDot size={8} color="#4ECDC4" />
            <Text style={styles.syncIndicatorText}>Sincronizando...</Text>
          </View>
        </AnimatedView>
      )}

      {/* Indicador de vidas con animación */}
      <AnimatedView animation="fadeSlideUp" delay={100}>
        <LivesIndicator
          currentLives={state.user.lives}
          maxLives={state.user.maxLives}
        />
      </AnimatedView>

      {/* Banners de Pending Redemptions (24h de gracia) */}
      {hasActivePendings && (
        <View style={styles.pendingRedemptionsContainer}>
          {pendingRedemptions
            .filter(p => p.status === 'pending' || p.status === 'challenge_assigned')
            .map(pending => (
              <PendingRedemptionBanner
                key={pending.id}
                pending={pending}
                onPress={() => handlePendingBannerPress(pending)}
              />
            ))}
        </View>
      )}

      {/* Lista de hábitos */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Mostrar skeletons durante refresh */}
        {showSkeletons ? (
          <HomeScreenSkeleton />
        ) : (
        <>
        {/* XP y Liga en la parte superior */}
        <View style={styles.topInfoContainer}>
          <AnimatedView animation="fadeSlideUp" delay={200}>
            <View style={styles.xpLeagueCard}>
              <View style={styles.xpSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="flash-outline"
                    size={20}
                    style={[styles.sectionIcon, styles.xpIcon]}
                  />
                  <Text style={styles.xpLabel}>XP Total</Text>
                </View>
                <AnimatedNumber value={state.user.xp} style={styles.xpValue} duration={1000} />
              </View>
              <View style={styles.leagueDivider} />
              <View style={styles.leagueSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="trophy-outline"
                    size={20}
                    style={[styles.sectionIcon, styles.leagueIcon]}
                  />
                  <Text style={styles.leagueLabel}>Liga Actual</Text>
                </View>
                {isAuthenticated && leagueData?.league ? (
                  <Text style={styles.leagueNumber}>{leagueData.league.name}</Text>
                ) : (
                  <Text style={styles.leagueNumber}>-</Text>
                )}
              </View>
            </View>
          </AnimatedView>

          {/* Estadísticas compactas con animación escalonada */}
          <AnimatedView animation="fadeSlideUp" delay={300}>
            <View style={styles.compactStatsContainer}>
              <AnimatedView animation="scale" index={0} staggerDelay={100} delay={400}>
                <View style={styles.compactStatItem}>
                  <AnimatedNumber value={stats.activeHabits} style={styles.compactStatNumber} duration={800} />
                  <Text style={styles.compactStatLabel}>Activos</Text>
                </View>
              </AnimatedView>
              <AnimatedView animation="scale" index={1} staggerDelay={100} delay={400}>
                <View style={styles.compactStatItem}>
                  <AnimatedNumber value={stats.completedToday} style={styles.compactStatNumber} duration={800} />
                  <Text style={styles.compactStatLabel}>Hoy</Text>
                </View>
              </AnimatedView>
              <AnimatedView animation="scale" index={2} staggerDelay={100} delay={400}>
                <View style={styles.compactStatItem}>
                  <AnimatedNumber value={stats.totalStreak} style={styles.compactStatNumber} duration={800} />
                  <Text style={styles.compactStatLabel}>Racha</Text>
                </View>
              </AnimatedView>
            </View>
          </AnimatedView>
        </View>
        {state.habits.length === 0 ? (
          <AnimatedView animation="fadeSlideUp" delay={300}>
            <View style={styles.emptyContainer}>
              <AnimatedView animation="bounce" delay={500}>
                <Ionicons name="leaf-outline" size={64} color="#4ECDC4" style={{ marginBottom: 16 }} />
              </AnimatedView>
              <Text style={styles.emptyTitle}>No tienes hábitos aún</Text>
              <Text style={styles.emptySubtitle}>
                Crea tu primer hábito para comenzar tu journey
              </Text>
              <AnimatedView animation="scale" delay={700}>
                <TouchableOpacity
                  style={styles.createFirstButton}
                  onPress={handleAddHabitPress}
                >
                  <Text style={styles.createFirstButtonText}>Crear mi primer hábito</Text>
                </TouchableOpacity>
              </AnimatedView>
            </View>
          </AnimatedView>
        ) : (
          <>
            {/* Hábitos Activos */}
            {activeHabits.length > 0 && (
              <View style={styles.section}>
                <AnimatedView animation="slideRight" delay={400}>
                  <Text style={styles.sectionTitle}>Hábitos Activos</Text>
                </AnimatedView>
                {activeHabits.map((habit, index) => {
                  const isCompletedToday = HabitLogic.wasCompletedToday(habit.id, state.completions);
                  const availableChallenges = state.challenges.filter(c => !c.isCompleted);

                  return (
                    <AnimatedView
                      key={habit.id}
                      animation="fadeSlideUp"
                      index={index}
                      staggerDelay={80}
                      delay={500}
                    >
                      <HabitCard
                        habit={habit}
                        isCompletedToday={isCompletedToday}
                        onComplete={handleCompleteHabit}
                        onReactivate={handleReactivateHabit}
                        onPress={handleHabitPress}
                        availableChallenges={availableChallenges}
                        completions={state.completions}
                      />
                    </AnimatedView>
                  );
                })}
              </View>
            )}

            {/* Hábitos Inactivos */}
            {inactiveHabits.length > 0 && (
              <View style={styles.section}>
                <AnimatedView animation="slideRight" delay={600}>
                  <View>
                    <Text style={styles.sectionTitle}>Hábitos Inactivos</Text>
                  </View>
                </AnimatedView>
                {inactiveHabits.map((habit, index) => (
                  <AnimatedView
                    key={habit.id}
                    animation="fadeSlideUp"
                    index={index}
                    staggerDelay={80}
                    delay={700}
                  >
                    <TouchableOpacity
                      onPress={() => handleActivateHabit(habit.id)}
                      activeOpacity={0.7}
                    >
                      <HabitCard
                        habit={habit}
                        isCompletedToday={false}
                        onComplete={handleCompleteHabit}
                        onReactivate={handleReactivateHabit}
                        onPress={handleHabitPress}
                        availableChallenges={[]}
                        completions={state.completions}
                      />
                    </TouchableOpacity>
                  </AnimatedView>
                ))}
              </View>
            )}

            {/* Retos para Obtener Vidas */}
            <View style={styles.section}>

              <View style={styles.challengesWrapper}>
                <AnimatedCollapsible
                  expanded={showAllChallenges}
                  collapsedHeight={350}
                >
                  <View style={styles.challengesGrid}>
                    {state.lifeChallenges && state.lifeChallenges.map((challenge, index) => (
                      <AnimatedView
                        key={challenge.id}
                        animation="scale"
                        index={index}
                        staggerDelay={60}
                        delay={900}
                        style={{ width: '31%', marginHorizontal: 4 }}
                      >
                        <LifeChallengeCard
                          challenge={challenge}
                          currentLives={state.user.lives}
                          maxLives={state.user.maxLives}
                          onRedeem={handleRedeemChallenge}
                        />
                      </AnimatedView>
                    ))}
                  </View>
                </AnimatedCollapsible>

                {state.lifeChallenges && state.lifeChallenges.length > 6 && (
                  <AnimatedFadeOverlay
                    visible={!showAllChallenges}
                    height={120}
                    color={theme.colors.background}
                  />
                )}
              </View>

              {state.lifeChallenges && state.lifeChallenges.length > 6 && (
                <AnimatedToggleButton
                  expanded={showAllChallenges}
                  onPress={() => setShowAllChallenges(!showAllChallenges)}
                  expandedText="Ocultar retos"
                  collapsedText="Ver todos los retos"
                />
              )}
            </View>
          </>
        )}
        </>
        )}
      </ScrollView>

      {/* Botón flotante animado para agregar hábito */}
      <AnimatedFAB
        onPress={handleAddHabitPress}
        backgroundColor="#4ECDC4"
        size={56}
        pulseOnMount={true}
      >
        <Text style={styles.fabText}>+</Text>
      </AnimatedFAB>

      {/* Modal de autenticación */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Modal para agregar hábito */}
      <AddHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateHabit}
      />

      {/* Modal para completar hábito */}
      <CompleteHabitModal
        visible={showCompleteModal}
        habit={selectedHabit}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedHabit(null);
        }}
        onComplete={handleCompleteConfirm}
      />

      {/* Celebración de primer completion */}
      <FirstCompletionCelebration
        visible={firstCompletionCelebration.visible}
        habitName={firstCompletionCelebration.habitName}
        onClose={() => setFirstCompletionCelebration({ visible: false, habitName: '' })}
      />

      {/* Notificación de Life Challenge obtenido */}
      {lifeChallengeNotification && (
        <LifeChallengeNotification
          visible={!!lifeChallengeNotification}
          title={lifeChallengeNotification.title}
          description={lifeChallengeNotification.description}
          reward={lifeChallengeNotification.reward}
          onDismiss={() => setLifeChallengeNotification(null)}
          onPress={() => setLifeChallengeNotification(null)}
        />
      )}

      {/* Notificación de cambio de liga */}
      <LeagueChangeNotification
        visible={!!leagueChange}
        changeType={leagueChange?.changeType || 'stayed'}
        toLeague={leagueChange?.toLeague || ''}
        position={leagueChange?.position || 0}
        weeklyXp={leagueChange?.weeklyXp || 0}
        onDismiss={dismissLeagueChange}
      />

      {/* Modal de Pending Redemption */}
      <PendingRedemptionModal
        visible={showPendingModal}
        pending={selectedPendingRedemption}
        onClose={handleClosePendingModal}
        onRedeemLife={handlePendingRedeemLife}
        onSelectChallenge={handlePendingRedeemChallenge}
        onRefreshNeeded={refreshState}
        actionLoading={pendingActionLoading}
      />
    </View>
  );
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    gap: 8,
  },
  syncIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4ECDC4',
  },
  pendingRedemptionsContainer: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  topInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  xpLeagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
    marginBottom: 12,
  },
  xpSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  xpLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    fontWeight: '600',
  },
  xpValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  sectionIcon: {
    color: '#6C757D',
  },
  xpIcon: {
    color: '#4ECDC4',
  },
  leagueDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E9ECEF',
  },
  leagueSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  leagueLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    fontWeight: '600',
  },
  leagueIcon: {
    color: '#F1C40F',
  },
  leagueNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  compactStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  compactStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  compactStatLabel: {
    fontSize: 10,
    color: '#6C757D',
    fontWeight: '500',
  },
  livesCompact: {
    alignItems: 'center',
    gap: 4,
  },
  livesDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lifeHeart: {
    marginLeft: 0,
  },
  lifeActive: {
    color: '#E74C3C',
  },
  lifeInactive: {
    color: '#95A5A6',
    opacity: 0.6,
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  challengesWrapper: {
    position: 'relative',
  },
  challengesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
} as const;


