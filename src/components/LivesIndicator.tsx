import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/useTheme';
import { AppTheme } from '../theme';

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
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [pulseAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  // Animaciones de entrada para cada corazón
  const heartAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;

  // Animación de entrada escalonada para los corazones
  useEffect(() => {
    const animations = heartAnims.slice(0, maxLives).map((anim, index) =>
      Animated.spring(anim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        delay: index * 80,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, animations).start();
  }, [maxLives]);

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

  // Renderizar corazones con animación
  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < maxLives; i++) {
      const isFilled = i < currentLives;
      const heartScale = heartAnims[i].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1.2, 1],
      });

      hearts.push(
        <Animated.View
          key={i}
          style={{
            transform: [{ scale: heartScale }],
            opacity: heartAnims[i],
          }}
        >
          <Icon
            name={isFilled ? 'heart' : 'heart-outline'}
            size={28}
            color={isFilled ? '#FF6B6B' : (isDark ? '#4B5563' : '#CBD5E1')}
            style={{ marginHorizontal: 3 }}
          />
        </Animated.View>
      );
    }
    return hearts;
  };

  // Determinar estado y color
  const getStatusInfo = () => {
    if (currentLives === 0) {
      return {
        status: 'dead',
        color: '#EF4444',
        message: '¡Sin vidas! Completa un reto para revivir',
        icon: 'skull',
      };
    } else if (currentLives === 1) {
      return {
        status: 'warning',
        color: isDark ? '#FBBF24' : '#F59E0B',
        message: '¡Cuidado! Te queda solo 1 vida',
        icon: 'alert',
      };
    } else {
      return {
        status: 'healthy',
        color: '#10B981',
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

  // Estilos dinámicos para estados
  const getContainerStyle = () => {
    if (currentLives === 0) {
      return {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
        borderWidth: 2,
        borderColor: '#EF4444',
      };
    } else if (currentLives === 1) {
      return {
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
        borderWidth: 1,
        borderColor: isDark ? '#FBBF24' : '#F59E0B',
      };
    }
    return {};
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
          getContainerStyle(),
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
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const styles = useMemo(() => createCompactStyles(theme, isDark), [theme, isDark]);

  const getColor = () => {
    if (currentLives === 0) return '#EF4444';
    if (currentLives === 1) return isDark ? '#FBBF24' : '#F59E0B';
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

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
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
  });

const createCompactStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    text: {
      marginLeft: 6,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
