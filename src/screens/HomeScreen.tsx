import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { HabitCard } from '../components/HabitCard';
import { useThemedStyles } from '../theme/useThemedStyles';
import { AddHabitModal } from '../components/AddHabitModal';
import { CompleteHabitModal } from '../components/CompleteHabitModal';
import { LifeChallengeCard } from '../components/LifeChallengeCard';
import { AppHeader } from '../components/AppHeader';
import { AuthModal } from '../components/AuthModal';
import { HabitLogic } from '../services/habitLogic';
import { Habit } from '../types';
import { useCurrentLeague } from '../hooks/useCurrentLeague';
import { LivesIndicator } from '../components/LivesIndicator';
import { GameOverScreen } from './GameOverScreen';
import { LifeChallengeNotification } from '../components/LifeChallengeNotification';
import { LeagueChangeNotification } from '../components/LeagueChangeNotification';
import { useLeagueChangeDetection } from '../hooks/useLeagueChangeDetection';
import sessionEventEmitter from '../services/sessionEventEmitter';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(baseStyles);
  const { state, markHabitCompleted, createHabit, refreshState, completeChallenge, activateHabit, redeemLifeChallenge, isAuthenticated, authUser } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllChallenges, setShowAllChallenges] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lifeChallengeNotification, setLifeChallengeNotification] = useState<any>(null);
  const { data: leagueData } = useCurrentLeague();
  const { pendingChange: leagueChange, dismissChange: dismissLeagueChange } = useLeagueChangeDetection();

  // Separar hábitos activos e inactivos
  const activeHabits = state.habits.filter(h => h.activeByUser);
  const inactiveHabits = state.habits.filter(h => !h.activeByUser);

  // Verificar disponibilidad de retos
  const challengeAvailability = HabitLogic.getAvailableLifeChallenges(state);

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
      const result = await markHabitCompleted(selectedHabit.id, progressData, notes, images);

      // Si se obtuvieron Life Challenges, mostrar notificación
      if (result.lifeChallengesObtained && result.lifeChallengesObtained.length > 0) {
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
    targetDate?: Date
  ) => {
    await createHabit(name, frequency, progressType, activeByUser, description, targetDate);
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
    } catch (error) {
      console.error('Error redeeming challenge:', error);
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

      {/* Indicador de vidas */}
      <LivesIndicator
        currentLives={state.user.lives}
        maxLives={state.user.maxLives}
        onPress={() => navigation?.navigate('LifeChallenges')}
      />

      {/* Lista de hábitos */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* XP y Liga en la parte superior */}
        <View style={styles.topInfoContainer}>
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
              <Text style={styles.xpValue}>{state.user.xp}</Text>
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

          {/* Estadísticas compactas */}
          <View style={styles.compactStatsContainer}>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatNumber}>{stats.activeHabits}</Text>
              <Text style={styles.compactStatLabel}>Activos</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatNumber}>{stats.completedToday}</Text>
              <Text style={styles.compactStatLabel}>Hoy</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatNumber}>{stats.totalStreak}</Text>
              <Text style={styles.compactStatLabel}>Racha</Text>
            </View>
          </View>
        </View>
        {state.habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tienes hábitos aún</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer hábito para comenzar tu journey
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={handleAddHabitPress}
            >
              <Text style={styles.createFirstButtonText}>Crear mi primer hábito</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Hábitos Activos */}
            {activeHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hábitos Activos</Text>
                {activeHabits.map((habit) => {
                  const isCompletedToday = HabitLogic.wasCompletedToday(habit.id, state.completions);
                  const availableChallenges = state.challenges.filter(c => !c.isCompleted);

                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      isCompletedToday={isCompletedToday}
                      onComplete={handleCompleteHabit}
                      onReactivate={handleReactivateHabit}
                      onPress={handleHabitPress}
                      availableChallenges={availableChallenges}
                      completions={state.completions}
                    />
                  );
                })}
              </View>
            )}

            {/* Hábitos Inactivos */}
            {inactiveHabits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hábitos Inactivos</Text>
                <Text style={styles.sectionSubtitle}>
                  Toca para activar
                </Text>
                {inactiveHabits.map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
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
                ))}
              </View>
            )}

            {/* Retos para Obtener Vidas */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithIcon}>
                <Ionicons name="trophy" size={20} color="#F1C40F" />
                <Text style={styles.sectionTitle}>Retos para Obtener Vidas</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Completa retos para ganar vidas extras
              </Text>
              
              <View style={styles.challengesWrapper}>
                <View style={[
                  styles.challengesGrid,
                  !showAllChallenges && styles.challengesGridCollapsed
                ]}>
                  {state.lifeChallenges && state.lifeChallenges.map((challenge, index) => (
                    <LifeChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      canRedeem={challengeAvailability.get(challenge.id) || false}
                      onRedeem={handleRedeemChallenge}
                    />
                  ))}
                </View>
                
                {!showAllChallenges && state.lifeChallenges && state.lifeChallenges.length > 6 && (
                  <View style={styles.fadeOverlay}>
                    <View style={[styles.fadeLayer, { opacity: 0 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.1 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.2 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.3 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.4 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.5 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.6 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.7 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.8 }]} />
                    <View style={[styles.fadeLayer, { opacity: 0.9 }]} />
                    <View style={[styles.fadeLayer, { opacity: 1 }]} />
                  </View>
                )}
              </View>

              {state.lifeChallenges && state.lifeChallenges.length > 6 && (
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowAllChallenges(!showAllChallenges)}
                >
                  <Text style={styles.toggleButtonText}>
                    {showAllChallenges ? '▲ Ocultar retos' : '▼ Ver todos los retos'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Botón flotante para agregar hábito */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddHabitPress}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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

      {/* Notificación de Life Challenge obtenido */}
      {lifeChallengeNotification && (
        <LifeChallengeNotification
          visible={!!lifeChallengeNotification}
          title={lifeChallengeNotification.title}
          description={lifeChallengeNotification.description}
          reward={lifeChallengeNotification.reward}
          onDismiss={() => setLifeChallengeNotification(null)}
          onPress={() => {
            navigation?.navigate('LifeChallenges');
            setLifeChallengeNotification(null);
          }}
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
    </View>
  );
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
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
  challengesGridCollapsed: {
    maxHeight: 350, // Altura para mostrar ~1.5 filas
    overflow: 'hidden',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    pointerEvents: 'none',
  },
  fadeLayer: {
    height: 15,
    backgroundColor: '#F8F9FA',
  },
  toggleButton: {
    alignSelf: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
} as const;


