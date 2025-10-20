import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';

interface LivesIndicatorProps {
  currentLives: number;
  maxLives: number;
  onPress?: () => void;
  showWarning?: boolean;
}

export const LivesIndicator: React.FC<LivesIndicatorProps> = ({
  currentLives,
  maxLives,
  onPress,
  showWarning = true,
}) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  // Efecto de pulso cuando las vidas son bajas
  useEffect(() => {
    if (currentLives === 1) {
      // Pulso de advertencia
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [currentLives]);

  // Efecto de sacudida cuando pierdes una vida
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Renderizar corazones
  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < maxLives; i++) {
      const isFilled = i < currentLives;
      hearts.push(
        <Icon
          key={i}
          name={isFilled ? 'heart' : 'heart-outline'}
          size={28}
          color={isFilled ? '#FF6B6B' : '#CBD5E1'}
          style={{ marginHorizontal: 3 }}
        />
      );
    }
    return hearts;
  };

  // Determinar estado y color
  const getStatusInfo = () => {
    if (currentLives === 0) {
      return {
        status: 'dead',
        color: '#FF4444',
        message: '¡Sin vidas! Completa un reto para revivir',
        icon: 'skull',
      };
    } else if (currentLives === 1) {
      return {
        status: 'warning',
        color: '#FFB800',
        message: '¡Cuidado! Te queda solo 1 vida',
        icon: 'alert',
      };
    } else {
      return {
        status: 'healthy',
        color: '#4ECDC4',
        message: `Vidas: ${currentLives}/${maxLives}`,
        icon: 'heart',
      };
    }
  };

  const statusInfo = getStatusInfo();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (showWarning && currentLives === 0) {
      Alert.alert(
        '💀 Sin Vidas',
        'Tus hábitos están bloqueados. Completa un reto con pruebas o redime un Life Challenge para revivir.',
        [
          { text: 'Entendido', style: 'default' }
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={!onPress && currentLives > 0}
    >
      <Animated.View
        style={[
          styles.container,
          currentLives === 0 && styles.deadContainer,
          currentLives === 1 && styles.warningContainer,
          {
            transform: [
              { translateX: shakeAnim },
              { scale: currentLives === 1 ? pulseAnim : 1 }
            ],
          },
        ]}
      >
        {/* Corazones */}
        <View style={styles.heartsContainer}>
          {renderHearts()}
        </View>

        {/* Mensaje de estado */}
        {(currentLives <= 1) && (
          <View style={styles.messageContainer}>
            <Icon
              name={statusInfo.icon}
              size={16}
              color={statusInfo.color}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.message, { color: statusInfo.color }]}>
              {statusInfo.message}
            </Text>
          </View>
        )}

        {/* Badge de vidas */}
        <View style={[styles.badge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.badgeText}>
            {currentLives}/{maxLives}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Versión compacta para barra de navegación
export const LivesIndicatorCompact: React.FC<LivesIndicatorProps> = ({
  currentLives,
  maxLives,
  onPress,
}) => {
  const styles = useThemedStyles(compactStyles);
  const theme = useTheme();

  const getColor = () => {
    if (currentLives === 0) return '#FF4444';
    if (currentLives === 1) return '#FFB800';
    return '#FF6B6B';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Icon
        name={currentLives === 0 ? 'skull' : 'heart'}
        size={20}
        color={getColor()}
      />
      <Text style={[styles.text, { color: getColor() }]}>
        {currentLives}
      </Text>
    </TouchableOpacity>
  );
};

const baseStyles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deadContainer: {
    backgroundColor: '#FFE6E6',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  warningContainer: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
} as const;

const compactStyles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: 'bold',
  },
} as const;