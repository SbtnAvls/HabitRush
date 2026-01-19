import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { LifeChallengeService } from '../services/lifeChallengeService';
import { LifeChallenge } from '../types';

interface LifeChallengeRedemptionProps {
  onSuccess: () => void;
  onBack?: () => void;
  showOnlyRedeemable?: boolean;
  currentLives: number;
  maxLives: number;
}

export const LifeChallengeRedemption: React.FC<LifeChallengeRedemptionProps> = ({
  onSuccess,
  onBack,
  showOnlyRedeemable = false,
  currentLives,
  maxLives,
}) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();

  const [challenges, setChallenges] = useState<LifeChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [successAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadLifeChallenges();
  }, []);

  const loadLifeChallenges = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const lifeChallenges = await LifeChallengeService.getLifeChallengesWithStatus();

      if (showOnlyRedeemable) {
        setChallenges(lifeChallenges.filter(lc => lc.canRedeem));
      } else {
        setChallenges(lifeChallenges);
      }
    } catch (error) {
      console.error('Error loading life challenges:', error);
      Alert.alert('Error', 'No se pudieron cargar los Life Challenges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const availableSlots = maxLives - currentLives;

  const executeRedemption = async (challenge: LifeChallenge) => {
    setRedeeming(challenge.id);
    try {
      const result = await LifeChallengeService.redeemLifeChallenge(challenge.id);

      // Animación de éxito
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          delay: 1500,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert(
        '¡Éxito!',
        `Has ganado ${result.livesGained} vida(s). Ahora tienes ${result.currentLives} vidas.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              if (result.currentLives > 0) {
                onSuccess();
              } else {
                loadLifeChallenges();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      // Manejar error de casillas insuficientes (retos 'once')
      if (error.code === 'INSUFFICIENT_LIFE_SLOTS') {
        Alert.alert(
          'Casillas Insuficientes',
          `${error.message}\n\n` +
          `Puedes desbloquear más casillas de vida completando ciertos retos especiales que aumentan tu máximo de vidas.`,
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert('Error', error.message || 'No se pudo redimir el Life Challenge');
      }
    } finally {
      setRedeeming(null);
    }
  };

  const redeemChallenge = async (challenge: LifeChallenge) => {
    if (!challenge.canRedeem) {
      Alert.alert('No disponible', 'Este Life Challenge no se puede redimir en este momento');
      return;
    }

    // Para retos 'unlimited': verificar si hay casillas insuficientes y advertir
    if (challenge.redeemable === 'unlimited' && challenge.reward > availableSlots) {
      const livesToReceive = Math.min(challenge.reward, availableSlots);

      if (availableSlots === 0) {
        Alert.alert(
          'Casillas de Vida Llenas',
          `Ya tienes todas tus casillas de vida llenas (${currentLives}/${maxLives}).\n\n` +
          `Este reto da +${challenge.reward} vida${challenge.reward > 1 ? 's' : ''}, pero no recibirás ninguna.\n\n` +
          `Puedes desbloquear más casillas de vida completando ciertos retos especiales.`,
          [{ text: 'Entendido' }]
        );
        return;
      }

      Alert.alert(
        'Redención Parcial',
        `Este reto da +${challenge.reward} vida${challenge.reward > 1 ? 's' : ''}, pero solo tienes ${availableSlots} casilla${availableSlots > 1 ? 's' : ''} disponible${availableSlots > 1 ? 's' : ''}.\n\n` +
        `Recibirás solo +${livesToReceive} vida${livesToReceive > 1 ? 's' : ''}.\n\n` +
        `Puedes desbloquear más casillas de vida completando ciertos retos especiales.\n\n` +
        `¿Quieres canjear de todas formas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Canjear',
            style: 'default',
            onPress: () => executeRedemption(challenge),
          },
        ]
      );
      return;
    }

    // Flujo normal
    Alert.alert(
      'Confirmar Redención',
      `¿Deseas redimir "${challenge.title}" por ${challenge.reward} vida(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redimir',
          style: 'default',
          onPress: () => executeRedemption(challenge),
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'obtained':
        return {
          text: 'Disponible',
          color: '#4ECDC4',
          icon: 'check-circle',
        };
      case 'redeemed':
        return {
          text: 'Redimido',
          color: '#94A3B8',
          icon: 'check-decagram',
        };
      case 'pending':
        return {
          text: 'Pendiente',
          color: '#FFB800',
          icon: 'clock-outline',
        };
      default:
        return {
          text: status,
          color: '#6C757D',
          icon: 'help-circle',
        };
    }
  };

  const getIconForChallenge = (iconName?: string) => {
    const iconMap: Record<string, string> = {
      'star': 'star',
      'leaf': 'leaf',
      'trophy': 'trophy',
      'medal': 'medal',
      'crown': 'crown',
      'fire': 'fire',
      'lightning': 'lightning-bolt',
      'heart': 'heart',
      'diamond': 'diamond-stone',
    };
    return iconMap[iconName || 'star'] || 'star';
  };

  const renderChallenge = (challenge: LifeChallenge) => {
    const status = getStatusBadge(challenge.status);
    const isRedeeming = redeeming === challenge.id;
    const icon = getIconForChallenge(challenge.icon);

    return (
      <TouchableOpacity
        key={challenge.id}
        style={[
          styles.challengeCard,
          challenge.status === 'redeemed' && styles.challengeCardRedeemed,
        ]}
        onPress={() => challenge.canRedeem && redeemChallenge(challenge)}
        disabled={!challenge.canRedeem || isRedeeming}
        activeOpacity={challenge.canRedeem ? 0.8 : 1}
      >
        <View style={styles.challengeHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${status.color}20` }]}>
            <Icon name={icon} size={30} color={status.color} />
          </View>

          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>

            <View style={styles.challengeFooter}>
              <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
                <Icon name={status.icon} size={14} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.text}
                </Text>
              </View>

              {/* Badge de tipo: Una vez o Ilimitado */}
              <View style={[
                styles.typeBadge,
                challenge.redeemable === 'once' ? styles.typeBadgeOnce : styles.typeBadgeUnlimited
              ]}>
                <Icon
                  name={challenge.redeemable === 'once' ? 'alert-circle-outline' : 'infinity'}
                  size={12}
                  color={challenge.redeemable === 'once' ? '#E67E22' : '#9B59B6'}
                />
                <Text style={[
                  styles.typeBadgeText,
                  { color: challenge.redeemable === 'once' ? '#E67E22' : '#9B59B6' }
                ]}>
                  {challenge.redeemable === 'once' ? '1 vez' : 'Ilimitado'}
                </Text>
              </View>
            </View>

            {challenge.canRedeem && (
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={() => redeemChallenge(challenge)}
                disabled={isRedeeming}
              >
                {isRedeeming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="cards-heart" size={16} color="#FFFFFF" />
                    <Text style={styles.redeemButtonText}>
                      Redimir +{challenge.reward} vida(s)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {challenge.obtainedAt && (
              <Text style={styles.dateText}>
                Obtenido: {new Date(challenge.obtainedAt).toLocaleDateString('es-ES')}
              </Text>
            )}

            {challenge.redeemedAt && (
              <Text style={styles.dateText}>
                Redimido: {new Date(challenge.redeemedAt).toLocaleDateString('es-ES')}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const groupedChallenges = {
    available: challenges.filter(c => c.canRedeem),
    redeemed: challenges.filter(c => c.status === 'redeemed'),
    pending: challenges.filter(c => c.status === 'pending'),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando Life Challenges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Life Challenges</Text>
      </View>

      {/* Animación de éxito */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: successAnimation,
            transform: [
              {
                scale: successAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Icon name="heart-multiple" size={80} color="#FF6B6B" />
        <Text style={styles.successText}>¡Vida Recuperada!</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLifeChallenges(true)}
            colors={[theme.colors.primary]}
          />
        }
      >
        {groupedChallenges.available.length === 0 && showOnlyRedeemable && (
          <View style={styles.emptyContainer}>
            <Icon name="emoticon-sad" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No hay Life Challenges disponibles</Text>
            <Text style={styles.emptyText}>
              Completa hábitos y logros para obtener Life Challenges
            </Text>
          </View>
        )}

        {/* Life Challenges Disponibles */}
        {groupedChallenges.available.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✨ Disponibles para Redimir ({groupedChallenges.available.length})
            </Text>
            {groupedChallenges.available.map(renderChallenge)}
          </View>
        )}

        {/* Life Challenges Pendientes */}
        {!showOnlyRedeemable && groupedChallenges.pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⏳ Pendientes ({groupedChallenges.pending.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Completa los requisitos para desbloquear estos challenges
            </Text>
            {groupedChallenges.pending.map(renderChallenge)}
          </View>
        )}

        {/* Life Challenges Redimidos */}
        {!showOnlyRedeemable && groupedChallenges.redeemed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✅ Redimidos ({groupedChallenges.redeemed.length})
            </Text>
            {groupedChallenges.redeemed.map(renderChallenge)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 12,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeCardRedeemed: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },
  challengeHeader: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 8,
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeOnce: {
    backgroundColor: '#FEF3E2',
  },
  typeBadgeUnlimited: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeText: {
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '500',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  successOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginTop: 10,
  },
} as const;