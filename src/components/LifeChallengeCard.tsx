import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LifeChallenge } from '../types';
import { useTheme } from '../theme/useTheme';
import { useThemedStyles } from '../theme/useThemedStyles';

interface LifeChallengeCardProps {
  challenge: LifeChallenge;
  currentLives: number;
  maxLives: number;
  onRedeem: (challengeId: string) => void;
}

export const LifeChallengeCard: React.FC<LifeChallengeCardProps> = ({
  challenge,
  currentLives,
  maxLives,
  onRedeem,
}) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();

  // Usar los campos del backend directamente
  const canRedeem = challenge.canRedeem;
  const isRedeemed = challenge.status === 'redeemed';
  const isObtained = challenge.status === 'obtained';
  const isPending = challenge.status === 'pending';

  // Calcular casillas disponibles
  const availableSlots = maxLives - currentLives;

  const handlePress = () => {
    // Si ya está redimido (solo para tipo 'once'), mostrar mensaje
    if (isRedeemed && challenge.redeemable === 'once') {
      Alert.alert(
        'Reto Ya Completado',
        'Este reto solo se puede completar una vez y ya lo has redimido.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Si no puede redimir (pendiente o no cumple requisitos)
    if (!canRedeem) {
      Alert.alert(
        'Reto No Disponible',
        'Aún no cumples con los requisitos para este reto. ¡Sigue esforzándote!',
        [{ text: 'OK' }]
      );
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
            onPress: () => onRedeem(challenge.id),
          },
        ]
      );
      return;
    }

    // Flujo normal: puede redimir sin problemas
    Alert.alert(
      `¡Reto Completado! ${challenge.icon}`,
      `${challenge.title}\n\nRecompensa: +${challenge.reward} vida${challenge.reward > 1 ? 's' : ''}\n\n¿Quieres redimir tu recompensa?`,
      [
        { text: 'Más tarde', style: 'cancel' },
        {
          text: 'Redimir',
          style: 'default',
          onPress: () => onRedeem(challenge.id),
        },
      ]
    );
  };

  const getStatusColor = () => {
    if (isRedeemed && challenge.redeemable === 'once') return theme.colors.textMuted;
    if (canRedeem) return theme.colors.primary;
    if (isObtained) return theme.colors.success || '#27AE60';
    return theme.colors.border;
  };

  const getStatusText = () => {
    if (isRedeemed && challenge.redeemable === 'once') return 'Completado';
    if (canRedeem) return '¡Canjear!';
    if (isObtained) return 'Obtenido';
    return 'Pendiente';
  };

  // Determinar si la tarjeta debe estar deshabilitada visualmente
  const isDisabled = isRedeemed && challenge.redeemable === 'once';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: getStatusColor() },
        isDisabled && styles.cardDisabled,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isDisabled}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{challenge.icon}</Text>
        {canRedeem && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>!</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {challenge.title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {challenge.description}
        </Text>

        <View style={styles.footer}>
          {/* Badge de tipo: Una vez o Ilimitado */}
          <View style={[
            styles.typeBadge,
            challenge.redeemable === 'once' ? styles.typeBadgeOnce : styles.typeBadgeUnlimited
          ]}>
            <Ionicons
              name={challenge.redeemable === 'once' ? 'alert-circle' : 'infinite'}
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

          {/* Recompensa */}
          <View style={styles.rewardContainer}>
            <View style={styles.rewardContent}>
              <Ionicons name="heart" size={16} color="#E74C3C" />
              <Text style={styles.rewardText}>+{challenge.reward}</Text>
            </View>
          </View>

          {/* Estado */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        {isRedeemed && challenge.redeemable === 'once' && (
          <View style={styles.onceCompletedBanner}>
            <View style={styles.onceCompletedContent}>
              <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
              <Text style={styles.onceCompletedText}>Completado</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const baseStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  icon: {
    fontSize: 36,
  },
  availableBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 11,
    color: '#6C757D',
    lineHeight: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'column',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  typeBadgeOnce: {
    backgroundColor: '#FEF3E2',
  },
  typeBadgeUnlimited: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rewardContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  onceCompletedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  onceCompletedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onceCompletedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
} as const;








