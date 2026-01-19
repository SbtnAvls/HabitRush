import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { LeagueLogic } from '../services/leagueLogic';
import { AppHeader } from '../components/AppHeader';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { useCurrentLeague } from '../hooks/useCurrentLeague';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LeaguesScreenSkeleton } from '../components/animations/Skeleton';
import { AnimatedView } from '../components/animations/AnimatedView';

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

// Animation config
const ANIMATION_CONFIG = {
  staggerDelay: 40,
  rowDuration: 350,
  zoneFadeDelay: 300,
  zoneFadeDuration: 500,
  glowDuration: 1500,
};

// Zone Separator Component
interface ZoneSeparatorProps {
  type: 'promotion' | 'safe' | 'relegation';
  opacity: Animated.Value;
  isHeader?: boolean;
}

const ZONE_CONFIG = {
  promotion: { color: '#34D399', label: 'Zona de Ascenso', icon: 'arrow-up' },
  safe: { color: '#4ECDC4', label: 'Zona Segura', icon: 'shield-checkmark' },
  relegation: { color: '#F87171', label: 'Zona de Descenso', icon: 'arrow-down' },
};

const ZoneSeparator: React.FC<ZoneSeparatorProps> = ({ type, opacity, isHeader = false }) => {
  const config = ZONE_CONFIG[type];

  if (isHeader) {
    // Header style (no line, just badge on the left)
    return (
      <Animated.View style={[separatorStyles.headerContainer, { opacity }]}>
        <View style={[separatorStyles.badgeContainer, { backgroundColor: config.color + '18' }]}>
          <Ionicons name={config.icon as any} size={12} color={config.color} />
          <Text style={[separatorStyles.badgeLabel, { color: config.color }]}>{config.label}</Text>
        </View>
      </Animated.View>
    );
  }

  // Separator style (badge on the left + line extending to the right)
  return (
    <Animated.View style={[separatorStyles.container, { opacity }]}>
      <View style={[separatorStyles.badgeContainer, { backgroundColor: config.color + '18' }]}>
        <Ionicons name={config.icon as any} size={12} color={config.color} />
        <Text style={[separatorStyles.badgeLabel, { color: config.color }]}>{config.label}</Text>
      </View>
      <View style={[separatorStyles.line, { backgroundColor: config.color }]} />
    </Animated.View>
  );
};

const separatorStyles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: 12,
    gap: 10,
  },
  headerContainer: {
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
};

// User Status Indicator Component
interface UserStatusIndicatorProps {
  position: number;
  leagueTier: number;
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({ position, leagueTier }) => {
  const getStatus = () => {
    if (position <= 5 && leagueTier < 5) {
      return { type: 'promotion', icon: 'trending-up', color: '#34D399', text: 'Subiendo' };
    } else if (position >= 16 && leagueTier > 1) {
      return { type: 'relegation', icon: 'trending-down', color: '#F87171', text: 'En riesgo' };
    }
    return { type: 'safe', icon: 'shield-checkmark', color: '#4ECDC4', text: 'Seguro' };
  };

  const status = getStatus();

  return (
    <View style={[statusStyles.container, { borderColor: status.color + '60' }]}>
      <Ionicons name={status.icon as any} size={14} color={status.color} />
      <Text style={[statusStyles.text, { color: status.color }]}>{status.text}</Text>
    </View>
  );
};

const statusStyles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
};

interface LeaguesScreenProps {
  navigation?: any;
}

export const LeaguesScreen: React.FC<LeaguesScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const { state, isAuthenticated } = useAppContext();
  const { user } = state;
  const { data: leagueData, loading, error, refetch } = useCurrentLeague();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    setTimeout(initializeAnimations, 100);
  };

  // Animation values
  const rowAnimations = useRef<{ translateX: Animated.Value; opacity: Animated.Value }[]>([]);
  const zoneOpacity = useRef(new Animated.Value(0)).current;
  const userGlowOpacity = useRef(new Animated.Value(0.3)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  // Encontrar la posición del usuario actual usando isCurrentUser del backend
  const userPosition = useMemo(() => {
    if (!leagueData || !leagueData.competitors) return 0;
    const userCompetitor = leagueData.competitors.find(c => c.isCurrentUser);
    return userCompetitor?.position || 0;
  }, [leagueData]);

  // Obtener emoji de la liga
  const getLeagueEmoji = (leagueName: string) => {
    return LEAGUE_EMOJIS[leagueName] || '🏆';
  };

  // Calcular días restantes hasta el fin de semana
  const daysUntilWeekEnd = useMemo(() => {
    return LeagueLogic.getDaysUntilWeekEnd(user.leagueWeekStart);
  }, [user.leagueWeekStart]);

  // Initialize row animations when competitors change
  const initializeAnimations = useCallback(() => {
    if (!leagueData?.competitors?.length) return;

    // Reset animation values
    rowAnimations.current = leagueData.competitors.map(() => ({
      translateX: new Animated.Value(50),
      opacity: new Animated.Value(0),
    }));
    zoneOpacity.setValue(0);
    headerOpacity.setValue(0);
    headerTranslateY.setValue(-20);

    // Header animation
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Row stagger animations
    const rowAnims = rowAnimations.current.flatMap((anim, index) => [
      Animated.timing(anim.translateX, {
        toValue: 0,
        duration: ANIMATION_CONFIG.rowDuration,
        delay: index * ANIMATION_CONFIG.staggerDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(anim.opacity, {
        toValue: 1,
        duration: ANIMATION_CONFIG.rowDuration * 0.7,
        delay: index * ANIMATION_CONFIG.staggerDelay,
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel(rowAnims).start();

    // Zone separator fade in
    Animated.timing(zoneOpacity, {
      toValue: 1,
      duration: ANIMATION_CONFIG.zoneFadeDuration,
      delay: ANIMATION_CONFIG.zoneFadeDelay,
      useNativeDriver: true,
    }).start();
  }, [leagueData?.competitors?.length]);

  // Start animations on data load
  useEffect(() => {
    if (leagueData?.competitors?.length) {
      initializeAnimations();
    }
  }, [leagueData?.competitors?.length, initializeAnimations]);

  // User row glow animation (continuous)
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(userGlowOpacity, {
          toValue: 0.6,
          duration: ANIMATION_CONFIG.glowDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(userGlowOpacity, {
          toValue: 0.3,
          duration: ANIMATION_CONFIG.glowDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  // Estado de carga inicial - mostrar skeletons
  if (loading && !leagueData) {
    return (
      <View style={styles.containerWrapper}>
        <AppHeader navigation={navigation} />
        <ScrollView style={styles.container}>
          <LeaguesScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  // Usuario no autenticado
  if (!isAuthenticated) {
    return (
      <View style={styles.containerWrapper}>
        <AppHeader navigation={navigation} />
        <View style={styles.centerContainer}>
          <AnimatedView animation="bounce" delay={200}>
            <Ionicons name="trophy-outline" size={80} color="#BDC3C7" />
          </AnimatedView>
          <AnimatedView animation="fadeSlideUp" delay={400}>
            <Text style={styles.emptyTitle}>Ligas no disponibles</Text>
          </AnimatedView>
          <AnimatedView animation="fadeSlideUp" delay={500}>
            <Text style={styles.emptySubtitle}>
              Inicia sesión para competir en las ligas y enfrentarte a otros jugadores
            </Text>
          </AnimatedView>
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {refreshing ? (
            <LeaguesScreenSkeleton />
          ) : (
            <>
              <View style={styles.centerContainer}>
                <AnimatedView animation="bounce" delay={200}>
                  <Ionicons name="hourglass-outline" size={80} color="#BDC3C7" />
                </AnimatedView>
                <AnimatedView animation="fadeSlideUp" delay={400}>
                  <Text style={styles.emptyTitle}>Sin liga activa</Text>
                </AnimatedView>
                <AnimatedView animation="fadeSlideUp" delay={500}>
                  <Text style={styles.emptySubtitle}>
                    {leagueData?.message || 'Completa hábitos para ganar XP y unirte a la competencia'}
                  </Text>
                </AnimatedView>
                <AnimatedView animation="scale" delay={600}>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                    <Text style={styles.retryButtonText}>Actualizar</Text>
                  </TouchableOpacity>
                </AnimatedView>
              </View>

              <AnimatedView animation="fadeSlideUp" delay={700}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>¿Cómo funcionan las ligas?</Text>
                  <Text style={styles.infoText}>
                    • Compite contra 19 personas de tu mismo nivel{'\n'}
                    • Los 5 primeros de cada semana suben de liga{'\n'}
                    • Los 5 últimos bajan de liga{'\n'}
                    • Acumula XP completando tus hábitos{'\n'}
                    • El ranking se resetea cada lunes
                  </Text>
                </View>
              </AnimatedView>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // Con datos de liga
  const { league, competitors } = leagueData;
  const leagueEmoji = getLeagueEmoji(league.name);
  const userWeeklyXp = competitors.find(c => c.isCurrentUser)?.weeklyXp || 0;
  const leagueTier = getLeagueTier(league.name);

  // Render ranking list with zone separators
  const renderRankingList = () => {
    const elements: React.ReactNode[] = [];

    // Determine which zones affect styling based on league tier
    const canPromote = leagueTier < 5; // Can't promote from Master
    const canRelegate = leagueTier > 1; // Can't relegate from Bronze

    competitors.forEach((competitor, index) => {
      const isUser = competitor.isCurrentUser;
      const isPromotion = competitor.position <= 5 && canPromote;
      const isRelegation = competitor.position >= 16 && canRelegate;

      // Add "Zona de Ascenso" header before position 1
      if (competitor.position === 1) {
        elements.push(
          <ZoneSeparator key="zone-promotion" type="promotion" opacity={zoneOpacity} isHeader />
        );
      }

      // Add "Zona Segura" separator after position 5 (before position 6)
      if (competitor.position === 6) {
        elements.push(
          <ZoneSeparator key="zone-safe" type="safe" opacity={zoneOpacity} />
        );
      }

      // Add "Zona de Descenso" separator after position 15 (before position 16)
      if (competitor.position === 16) {
        elements.push(
          <ZoneSeparator key="zone-relegation" type="relegation" opacity={zoneOpacity} />
        );
      }

      const rowAnim = rowAnimations.current[index];

      elements.push(
        <Animated.View
          key={competitor.userId || `bot-${index}`}
          style={[
            styles.competitorCard,
            isPromotion && styles.competitorCardPromotion,
            isRelegation && styles.competitorCardRelegation,
            isUser && styles.competitorCardUser,
            rowAnim && {
              transform: [{ translateX: rowAnim.translateX }],
              opacity: rowAnim.opacity,
            },
          ]}
        >
          <View style={styles.competitorLeft}>
            <View style={[
              styles.positionContainer,
              isPromotion && styles.positionPromotion,
              isRelegation && styles.positionRelegation,
            ]}>
              <Text style={[
                styles.competitorPosition,
                isPromotion && styles.positionTextPromotion,
                isRelegation && styles.positionTextRelegation,
              ]}>
                {competitor.position}
              </Text>
            </View>
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
            <Text style={[
              styles.competitorXp,
              isUser && styles.textBold,
              isPromotion && styles.xpPromotion,
              isRelegation && styles.xpRelegation,
            ]}>
              {competitor.weeklyXp} XP
            </Text>
          </View>
        </Animated.View>
      );
    });

    return elements;
  };

  return (
    <View style={styles.containerWrapper}>
      <AppHeader navigation={navigation} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Mostrar skeletons durante refresh */}
        {refreshing ? (
          <LeaguesScreenSkeleton />
        ) : (
        <>
        {/* Compact Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            }
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.leagueSection}>
              <Text style={styles.leagueEmoji}>{leagueEmoji}</Text>
              <View>
                <View style={[styles.leagueBadge, { backgroundColor: league.colorHex }]}>
                  <Text style={styles.leagueBadgeText}>{league.name}</Text>
                </View>
                <Text style={styles.timeRemaining}>
                  {daysUntilWeekEnd} {daysUntilWeekEnd === 1 ? 'día' : 'días'} restantes
                </Text>
              </View>
            </View>
            <View style={styles.statsSection}>
              <UserStatusIndicator position={userPosition} leagueTier={leagueTier} />
              <View style={styles.xpDisplay}>
                <Text style={styles.xpValue}>{userWeeklyXp}</Text>
                <Text style={styles.xpLabel}>XP semanal</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Master League Info */}
        {leagueTier === 5 && (
          <View style={styles.masterInfo}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.masterText}>Liga más alta alcanzada</Text>
          </View>
        )}

        {/* Ranking */}
        <View style={styles.rankingContainer}>
          <View style={styles.rankingHeader}>
            <Text style={styles.rankingTitle}>Clasificación</Text>
            <Text style={styles.rankingSubtitle}>{competitors.length} competidores</Text>
          </View>
          {renderRankingList()}
        </View>

        {/* Info Section */}
        <AnimatedView animation="fadeSlideUp" delay={600}>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>¿Cómo funcionan las ligas?</Text>
            <Text style={styles.infoText}>
              • Compite contra 19 personas de tu mismo nivel{'\n'}
              • Los 5 primeros de cada semana suben de liga{'\n'}
              • Los 5 últimos bajan de liga{'\n'}
              • Acumula XP completando tus hábitos{'\n'}
              • El ranking se resetea cada lunes
            </Text>
          </View>
        </AnimatedView>
        </>
        )}
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
  // Compact Header
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leagueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leagueEmoji: {
    fontSize: 42,
  },
  leagueBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  leagueBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeRemaining: {
    marginTop: 6,
    fontSize: 12,
    color: '#6C757D',
  },
  statsSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  xpDisplay: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  xpLabel: {
    fontSize: 11,
    color: '#6C757D',
    marginTop: 1,
  },
  // Master League Info
  masterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  masterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
  },
  // Ranking
  rankingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  rankingSubtitle: {
    fontSize: 12,
    color: '#6C757D',
  },
  // Competitor Cards
  competitorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  competitorCardUser: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderWidth: 1.5,
    borderColor: '#4ECDC4',
  },
  competitorCardPromotion: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  competitorCardRelegation: {
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  competitorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  positionPromotion: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  positionRelegation: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  competitorPosition: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C757D',
  },
  positionTextPromotion: {
    color: '#34D399',
  },
  positionTextRelegation: {
    color: '#F87171',
  },
  medal: {
    fontSize: 18,
    marginRight: 8,
  },
  competitorInfo: {
    flex: 1,
  },
  competitorName: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
  },
  competitorRight: {
    alignItems: 'flex-end',
  },
  competitorXp: {
    fontSize: 15,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  xpPromotion: {
    color: '#34D399',
  },
  xpRelegation: {
    color: '#F87171',
  },
  textBold: {
    fontWeight: 'bold',
  },
  // Info Section
  infoSection: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 22,
  },
} as const;
