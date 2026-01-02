import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { LeagueLogic } from '../services/leagueLogic';
import { AppHeader } from '../components/AppHeader';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useCurrentLeague } from '../hooks/useCurrentLeague';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Nombres de las ligas según el backend
const LEAGUE_EMOJIS: { [key: string]: string } = {
  'Master': '💎',
  'Diamond': '💠',
  'Gold': '🥇',
  'Silver': '🥈',
  'Bronze': '🥉',
};

// Tiers de las ligas (para lógica de promoción/descenso)
const LEAGUE_TIERS: { [key: string]: number } = {
  'Bronze': 1,
  'Silver': 2,
  'Gold': 3,
  'Diamond': 4,
  'Master': 5,
};

const getLeagueTier = (leagueName: string): number => LEAGUE_TIERS[leagueName] || 1;

interface LeaguesScreenProps {
  navigation?: any;
}

export const LeaguesScreen: React.FC<LeaguesScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(baseStyles);
  const { state, isAuthenticated } = useAppContext();
  const { user } = state;
  const { data: leagueData, loading, error, refetch } = useCurrentLeague();

  // Encontrar la posición del usuario actual usando isCurrentUser del backend
  const userPosition = useMemo(() => {
    if (!leagueData || !leagueData.competitors) return 0;
    const userCompetitor = leagueData.competitors.find(c => c.isCurrentUser);
    return userCompetitor?.position || 0;
  }, [leagueData]);

  const isTopFive = userPosition > 0 && userPosition <= 5;
  const isBottomFive = userPosition >= 16 && userPosition <= 20;

  // Obtener emoji de la liga
  const getLeagueEmoji = (leagueName: string) => {
    return LEAGUE_EMOJIS[leagueName] || '🏆';
  };

  // Calcular días restantes hasta el fin de semana
  const daysUntilWeekEnd = useMemo(() => {
    return LeagueLogic.getDaysUntilWeekEnd(user.leagueWeekStart);
  }, [user.leagueWeekStart]);

  // Estado de carga
  if (loading && !leagueData) {
    return (
      <View style={styles.containerWrapper}>
        <AppHeader navigation={navigation} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Cargando liga...</Text>
        </View>
      </View>
    );
  }

  // Usuario no autenticado
  if (!isAuthenticated) {
    return (
      <View style={styles.containerWrapper}>
        <AppHeader navigation={navigation} />
        <View style={styles.centerContainer}>
          <Ionicons name="trophy-outline" size={80} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>Ligas no disponibles</Text>
          <Text style={styles.emptySubtitle}>
            Inicia sesión para competir en las ligas y enfrentarte a otros jugadores
          </Text>
        </View>
      </View>
    );
  }

  // Sin liga activa
  if (!leagueData || !leagueData.league || leagueData.competitors.length === 0) {
    return (
      <View style={styles.containerWrapper}>
        <AppHeader navigation={navigation} />
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
        >
          <View style={styles.centerContainer}>
            <Ionicons name="hourglass-outline" size={80} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>Sin liga activa</Text>
            <Text style={styles.emptySubtitle}>
              {leagueData?.message || 'Completa hábitos para ganar XP y unirte a la competencia'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ℹ️ ¿Cómo funcionan las ligas?</Text>
            <Text style={styles.infoText}>
              • Compite contra 19 personas de tu mismo nivel{'\n'}
              • Los 5 primeros de cada semana suben de liga{'\n'}
              • Los 5 últimos bajan de liga{'\n'}
              • Acumula XP completando tus hábitos{'\n'}
              • El ranking se resetea cada lunes
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Con datos de liga
  const { league, competitors } = leagueData;
  const leagueEmoji = getLeagueEmoji(league.name);
  const userWeeklyXp = competitors.find(c => c.isCurrentUser)?.weeklyXp || 0;

  return (
    <View style={styles.containerWrapper}>
      <AppHeader navigation={navigation} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {/* Header con información de la liga actual */}
        <View style={[styles.header, { backgroundColor: league.colorHex + '20' }]}>
          <Text style={styles.headerTitle}>Tu Liga</Text>
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueEmoji}>{leagueEmoji}</Text>
            <View style={[styles.leagueBadge, { backgroundColor: league.colorHex }]}>
              <Text style={styles.leagueBadgeText}>{league.name}</Text>
            </View>
          </View>
          <View style={styles.xpContainer}>
            <Text style={styles.xpLabel}>XP Total</Text>
            <Text style={styles.xpValue}>{user.xp}</Text>
          </View>
          <View style={styles.weeklyXpContainer}>
            <Text style={styles.weeklyXpLabel}>XP esta semana</Text>
            <Text style={styles.weeklyXpValue}>{userWeeklyXp}</Text>
          </View>
          <Text style={styles.timeRemaining}>
            ⏰ Termina en {daysUntilWeekEnd} {daysUntilWeekEnd === 1 ? 'día' : 'días'}
          </Text>
        </View>

        {/* Información de promoción */}
        {getLeagueTier(league.name) < 5 && (
          <View style={styles.promotionInfo}>
            <Text style={styles.promotionTitle}>🎯 Objetivo Semanal</Text>
            <Text style={styles.promotionText}>
              Termina entre los 5 primeros para subir de liga
            </Text>
            {isTopFive && (
              <View style={styles.promotionBadge}>
                <Text style={styles.promotionBadgeText}>
                  ¡Estás en zona de promoción! 🎉
                </Text>
              </View>
            )}
            {isBottomFive && (
              <View style={[styles.promotionBadge, { backgroundColor: '#E74C3C' }]}>
                <Text style={styles.promotionBadgeText}>
                  ⚠️ Zona de descenso - ¡esfuérzate más!
                </Text>
              </View>
            )}
          </View>
        )}

        {getLeagueTier(league.name) === 5 && (
          <View style={styles.topLeagueInfo}>
            <Text style={styles.topLeagueText}>
              ¡Felicidades! Estás en la liga más alta 🏆
            </Text>
            <Text style={styles.topLeagueSubtext}>
              Sigue acumulando XP para mantenerte entre los mejores
            </Text>
          </View>
        )}

        {/* Ranking */}
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>Clasificación</Text>
          {competitors.map((competitor, index) => {
            const isUser = competitor.isCurrentUser;
            const isPromotion = competitor.position <= 5;
            const isRelegation = competitor.position >= 16;
            const leagueTier = getLeagueTier(league.name);

            return (
              <View
                key={competitor.userId || `bot-${index}`}
                style={[
                  styles.competitorCard,
                  isUser && styles.competitorCardUser,
                  isPromotion && leagueTier < 5 && styles.competitorCardPromotion,
                  isRelegation && leagueTier > 1 && styles.competitorCardRelegation,
                ]}
              >
                <View style={styles.competitorLeft}>
                  <Text style={styles.competitorPosition}>
                    {competitor.position}
                  </Text>
                  {competitor.position === 1 && <Text style={styles.medal}>🥇</Text>}
                  {competitor.position === 2 && <Text style={styles.medal}>🥈</Text>}
                  {competitor.position === 3 && <Text style={styles.medal}>🥉</Text>}
                  <View style={styles.competitorInfo}>
                    <Text style={[styles.competitorName, isUser && styles.textBold]}>
                      {competitor.name}
                      {isUser && ' (Tú)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.competitorRight}>
                  <Text style={[styles.competitorXp, isUser && styles.textBold]}>
                    {competitor.weeklyXp} XP
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ ¿Cómo funcionan las ligas?</Text>
          <Text style={styles.infoText}>
            • Compite contra 19 personas de tu mismo nivel{'\n'}
            • Los 5 primeros de cada semana suben de liga{'\n'}
            • Los 5 últimos bajan de liga{'\n'}
            • Acumula XP completando tus hábitos{'\n'}
            • El ranking se resetea cada lunes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const baseStyles = {
  containerWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 10,
  },
  leagueInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  leagueEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  leagueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  leagueBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leagueBadgeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xpContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  xpLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  xpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  weeklyXpContainer: {
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    width: '100%',
  },
  weeklyXpLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  weeklyXpValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  timeRemaining: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  promotionInfo: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  promotionText: {
    fontSize: 14,
    color: '#856404',
  },
  promotionBadge: {
    marginTop: 12,
    backgroundColor: '#28A745',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  promotionBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topLeagueInfo: {
    backgroundColor: '#D4EDDA',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C3E6CB',
    alignItems: 'center',
  },
  topLeagueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 4,
  },
  topLeagueSubtext: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
  },
  rankingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  competitorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  competitorCardUser: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  competitorCardPromotion: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  competitorCardRelegation: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  competitorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  competitorPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C757D',
    width: 30,
  },
  medal: {
    fontSize: 20,
    marginRight: 8,
  },
  competitorInfo: {
    flex: 1,
  },
  competitorName: {
    fontSize: 16,
    color: '#212529',
  },
  competitorRight: {
    alignItems: 'flex-end',
  },
  competitorXp: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  textBold: {
    fontWeight: 'bold',
  },
  leaguesInfoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  leaguesInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  leagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  leagueItemCurrent: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  leagueItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  leagueItemName: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#E7F3FF',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004085',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#004085',
    lineHeight: 22,
  },
} as const;



