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
  canRedeem: boolean;
  onRedeem: (challengeId: string) => void;
}

export const LifeChallengeCard: React.FC<LifeChallengeCardProps> = ({
  challenge,
  canRedeem,
  onRedeem,
}) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const isCompleted = challenge.completedCount > 0;
  const canStillRedeem = challenge.redeemable === 'unlimited' || challenge.completedCount === 0;

  const handlePress = () => {
    if (!canRedeem) {
      Alert.alert(
        'Reto No Completado',
        'Aún no cumples con los requisitos para este reto. ¡Sigue esforzándote!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!canStillRedeem) {
      Alert.alert(
        'Reto Ya Completado',
        'Este reto solo se puede completar una vez y ya lo has redimido.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      `¡Reto Completado! ${challenge.icon}`,
      `${challenge.title}\n\nRecompensa: +${challenge.reward} vida\n\n¿Quieres redimir tu recompensa?`,
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
    if (!canStillRedeem) return theme.colors.textMuted;
    if (canRedeem) return theme.colors.primary;
    return theme.colors.border;
  };

  const getStatusText = () => {
    if (challenge.redeemable === 'unlimited') {
      return `Completado ${challenge.completedCount}x`;
    }
    return isCompleted ? 'Completado' : 'Disponible';
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: getStatusColor() },
        !canStillRedeem && styles.cardDisabled,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!canRedeem && !isCompleted}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{challenge.icon}</Text>
        {canRedeem && canStillRedeem && (
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
          <View style={styles.rewardContainer}>
            <View style={styles.rewardContent}>
              <Ionicons name="heart" size={16} color="#E74C3C" />
              <Text style={styles.rewardText}>+{challenge.reward}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        {challenge.redeemable === 'once' && isCompleted && (
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
    marginHorizontal: 4,
    width: '31%', // Para 3 columnas con espaciado
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








