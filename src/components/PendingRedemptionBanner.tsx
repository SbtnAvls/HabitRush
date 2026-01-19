import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PendingRedemption } from '../types';
import { PendingRedemptionService } from '../services/pendingRedemptionService';
import { useTheme } from '../theme/useTheme';

interface PendingRedemptionBannerProps {
  pending: PendingRedemption;
  onPress: () => void;
}

/**
 * Banner compacto que muestra un pending redemption
 * Se usa en HomeScreen para alertar al usuario
 *
 * Ejemplo:
 * ⚠️ Fallaste "Ejercicio" | 🕐 5h 30m | [Decidir]
 */
export const PendingRedemptionBanner: React.FC<PendingRedemptionBannerProps> = ({
  pending,
  onPress,
}) => {
  const theme = useTheme();
  const isDark = theme.name === 'dark';

  const urgencyLevel = useMemo(
    () => PendingRedemptionService.getUrgencyLevel(pending.time_remaining_ms),
    [pending.time_remaining_ms]
  );

  const timeRemaining = useMemo(
    () => PendingRedemptionService.formatTimeRemaining(pending.time_remaining_ms),
    [pending.time_remaining_ms]
  );

  // Colores adaptados para modo claro y oscuro
  const urgencyColors = useMemo(() => ({
    low: {
      bg: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9',
      border: '#4CAF50',
      text: isDark ? '#81C784' : '#2E7D32',
      icon: '#4CAF50',
    },
    medium: {
      bg: isDark ? 'rgba(255, 193, 7, 0.15)' : '#FFF8E1',
      border: '#FFC107',
      text: isDark ? '#FFD54F' : '#F57F17',
      icon: '#FFA000',
    },
    high: {
      bg: isDark ? 'rgba(255, 152, 0, 0.15)' : '#FFF3E0',
      border: '#FF9800',
      text: isDark ? '#FFB74D' : '#E65100',
      icon: '#F57C00',
    },
    critical: {
      bg: isDark ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE',
      border: '#F44336',
      text: isDark ? '#EF5350' : '#C62828',
      icon: '#D32F2F',
    },
  }), [isDark]);

  const colors = urgencyColors[urgencyLevel];

  const getStatusText = () => {
    if (pending.status === 'challenge_assigned') {
      return 'Challenge asignado';
    }
    return 'Decide antes que expire';
  };

  const getIcon = () => {
    if (pending.status === 'challenge_assigned') {
      return 'target';
    }
    if (urgencyLevel === 'critical') {
      return 'alert-circle';
    }
    return 'clock-alert-outline';
  };

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderLeftColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Icon name={getIcon()} size={24} color={colors.icon} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
          Fallaste "{pending.habit_name}"
        </Text>
        <Text style={[styles.statusText, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
          {getStatusText()}
        </Text>
      </View>

      <View style={[styles.timeContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)' }]}>
        <Icon name="clock-outline" size={14} color={colors.icon} />
        <Text style={[styles.timeText, { color: colors.text }]}>
          {timeRemaining}
        </Text>
      </View>

      <View style={[styles.actionButton, { backgroundColor: colors.border }]}>
        <Text style={styles.actionText}>
          {pending.status === 'challenge_assigned' ? 'Enviar' : 'Decidir'}
        </Text>
        <Icon name="chevron-right" size={16} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 10,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 2,
  },
});

export default PendingRedemptionBanner;
