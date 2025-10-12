import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { LeagueLogic } from '../services/leagueLogic';
import { AppHeader } from '../components/AppHeader';
import { useThemedStyles } from '../theme/useThemedStyles';

// Nombres de las ligas
const LEAGUE_NAMES = {
  1: { name: 'Liga Diamante', emoji: '💎', color: '#B9F2FF' },
  2: { name: 'Liga Oro', emoji: '🥇', color: '#FFD700' },
  3: { name: 'Liga Plata', emoji: '🥈', color: '#C0C0C0' },
  4: { name: 'Liga Bronce', emoji: '🥉', color: '#CD7F32' },
  5: { name: 'Liga Inicial', emoji: '🌱', color: '#90EE90' },
};

interface LeaguesScreenProps {
  navigation?: any;
}

export const LeaguesScreen: React.FC<LeaguesScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(baseStyles);
  const { state } = useAppContext();
  const { user } = state;

  // Generar competidores simulados usando el servicio
  const leagueCompetitors = useMemo(() => {
    return LeagueLogic.generateCompetitors(
      user.id,
      user.name,
      user.weeklyXp,
      user.league
    );
  }, [user.id, user.name, user.weeklyXp, user.league]);

  const userPosition = leagueCompetitors.find(c => c.id === user.id)?.position || 0;
  const isTopThree = userPosition <= 3;
  const currentLeague = LEAGUE_NAMES[user.league as keyof typeof LEAGUE_NAMES];

  // Calcular días restantes hasta el fin de semana
  const daysUntilWeekEnd = useMemo(() => {
    return LeagueLogic.getDaysUntilWeekEnd(user.leagueWeekStart);
  }, [user.leagueWeekStart]);

  return (
    <View style={styles.containerWrapper}>
      <AppHeader navigation={navigation} />
      <ScrollView style={styles.container}>
        {/* Header con información de la liga actual */}
        <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu Liga</Text>
        <View style={styles.leagueInfo}>
          <Text style={styles.leagueEmoji}>{currentLeague.emoji}</Text>
          <Text style={styles.leagueName}>{currentLeague.name}</Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>XP Total</Text>
          <Text style={styles.xpValue}>{user.xp}</Text>
        </View>
        <View style={styles.weeklyXpContainer}>
          <Text style={styles.weeklyXpLabel}>XP esta semana</Text>
          <Text style={styles.weeklyXpValue}>{user.weeklyXp}</Text>
        </View>
        <Text style={styles.timeRemaining}>
          ⏰ Termina en {daysUntilWeekEnd} {daysUntilWeekEnd === 1 ? 'día' : 'días'}
        </Text>
      </View>

      {/* Información de promoción */}
      {user.league > 1 && (
        <View style={styles.promotionInfo}>
          <Text style={styles.promotionTitle}>🎯 Objetivo Semanal</Text>
          <Text style={styles.promotionText}>
            Termina entre los 3 primeros para subir a{' '}
            {LEAGUE_NAMES[(user.league - 1) as keyof typeof LEAGUE_NAMES].name}
          </Text>
          {isTopThree && (
            <View style={styles.promotionBadge}>
              <Text style={styles.promotionBadgeText}>
                ¡Estás en zona de promoción! 🎉
              </Text>
            </View>
          )}
        </View>
      )}

      {user.league === 1 && (
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
        {leagueCompetitors.map((competitor, index) => {
          const isUser = competitor.id === user.id;
          const isPromotion = index < 3;
          
          return (
            <View
              key={competitor.id}
              style={[
                styles.competitorCard,
                isUser && styles.competitorCardUser,
                isPromotion && styles.competitorCardPromotion,
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

      {/* Información adicional sobre las ligas */}
      <View style={styles.leaguesInfoContainer}>
        <Text style={styles.leaguesInfoTitle}>Todas las Ligas</Text>
        {Object.entries(LEAGUE_NAMES).reverse().map(([level, league]) => {
          const isCurrentLeague = parseInt(level) === user.league;
          return (
            <View
              key={level}
              style={[
                styles.leagueItem,
                isCurrentLeague && styles.leagueItemCurrent,
              ]}
            >
              <Text style={styles.leagueItemEmoji}>{league.emoji}</Text>
              <Text style={[styles.leagueItemName, isCurrentLeague && styles.textBold]}>
                {league.name}
              </Text>
              {isCurrentLeague && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Actual</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ ¿Cómo funcionan las ligas?</Text>
        <Text style={styles.infoText}>
          • Todos empiezan en la Liga Inicial (Liga 5){'\n'}
          • Compite contra 19 personas de tu mismo nivel{'\n'}
          • Los 3 primeros de cada semana suben de liga{'\n'}
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
    borderLeftColor: '#FFD700',
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



