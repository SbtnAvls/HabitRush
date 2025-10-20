import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemedStyles } from '../theme/useThemedStyles';

const { width: screenWidth } = Dimensions.get('window');

interface LifeChallengeNotificationProps {
  visible: boolean;
  title: string;
  description: string;
  reward: number;
  onPress?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const LifeChallengeNotification: React.FC<LifeChallengeNotificationProps> = ({
  visible,
  title,
  description,
  reward,
  onPress,
  onDismiss,
  duration = 5000,
}) => {
  const styles = useThemedStyles(baseStyles);
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Mostrar notificación
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Efecto shimmer
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-ocultar después del duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideNotification();
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible && opacity._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          if (onPress) {
            onPress();
          }
          hideNotification();
        }}
        style={styles.touchable}
      >
        {/* Efecto de brillo de fondo */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              opacity: shimmer.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />

        <View style={styles.content}>
          {/* Icono con animación */}
          <View style={styles.iconContainer}>
            <Icon name="star" size={30} color="#FFD700" />
            <View style={styles.sparkles}>
              <Icon name="sparkles" size={16} color="#FFD700" style={styles.sparkle1} />
              <Icon name="sparkles" size={12} color="#FFD700" style={styles.sparkle2} />
              <Icon name="sparkles" size={14} color="#FFD700" style={styles.sparkle3} />
            </View>
          </View>

          {/* Contenido del mensaje */}
          <View style={styles.messageContainer}>
            <Text style={styles.label}>¡LIFE CHALLENGE OBTENIDO!</Text>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>

            <View style={styles.rewardContainer}>
              <Icon name="heart" size={16} color="#FF6B6B" />
              <Text style={styles.rewardText}>+{reward} vida(s)</Text>
            </View>
          </View>

          {/* Botón de cerrar */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideNotification}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Indicador de toque para redimir */}
        {onPress && (
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>Toca para redimir</Text>
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const baseStyles = {
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 999,
  },
  touchable: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 0,
    right: 5,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 5,
    left: 0,
  },
  sparkle3: {
    position: 'absolute',
    top: 10,
    left: 5,
  },
  messageContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 6,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
    opacity: 0.6,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(78, 205, 196, 0.3)',
  },
  actionHintText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
} as const;

export default LifeChallengeNotification;