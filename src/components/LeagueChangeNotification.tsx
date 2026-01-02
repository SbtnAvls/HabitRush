import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useThemedStyles } from '../theme/useThemedStyles';

// Colores de las ligas
const LEAGUE_COLORS: { [key: string]: string } = {
  'Bronze': '#CD7F32',
  'Silver': '#C0C0C0',
  'Gold': '#FFD700',
  'Diamond': '#B9F2FF',
  'Master': '#E5E4E2',
};

const LEAGUE_EMOJIS: { [key: string]: string } = {
  'Master': '💎',
  'Diamond': '💠',
  'Gold': '🥇',
  'Silver': '🥈',
  'Bronze': '🥉',
};

interface LeagueChangeNotificationProps {
  visible: boolean;
  changeType: 'promoted' | 'relegated' | 'stayed';
  fromLeague?: string;
  toLeague: string;
  position: number;
  weeklyXp: number;
  onDismiss: () => void;
}

export const LeagueChangeNotification: React.FC<LeagueChangeNotificationProps> = ({
  visible,
  changeType,
  fromLeague,
  toLeague,
  position,
  weeklyXp,
  onDismiss,
}) => {
  const styles = useThemedStyles(baseStyles);

  // Animaciones
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const confettiY = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  const isPromotion = changeType === 'promoted';
  const isRelegation = changeType === 'relegated';
  const leagueColor = LEAGUE_COLORS[toLeague] || '#4ECDC4';
  const leagueEmoji = LEAGUE_EMOJIS[toLeague] || '🏆';

  useEffect(() => {
    if (visible) {
      // Reset valores
      opacity.setValue(0);
      scale.setValue(0.5);
      rotation.setValue(0);
      confettiY.setValue(0);
      bounce.setValue(0);

      // Animacion de entrada
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Animacion de brillo continuo
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      if (isPromotion) {
        // Confetti para promocion
        Animated.loop(
          Animated.sequence([
            Animated.timing(confettiY, {
              toValue: 1,
              duration: 2000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(confettiY, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Rotacion del emoji
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotation, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rotation, {
              toValue: -1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rotation, {
              toValue: 0,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Bounce del emoji
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounce, {
              toValue: -10,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bounce, {
              toValue: 0,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity },
      ]}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      />

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale }],
            borderColor: leagueColor,
          },
        ]}
      >
        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              backgroundColor: leagueColor,
              opacity: shimmer.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
            },
          ]}
        />

        {/* Confetti para promocion */}
        {isPromotion && (
          <View style={styles.confettiContainer}>
            {[...Array(12)].map((_, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.confetti,
                  {
                    left: `${(i * 8) + 4}%`,
                    transform: [
                      {
                        translateY: confettiY.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 150],
                        }),
                      },
                    ],
                    opacity: confettiY.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [1, 1, 0],
                    }),
                  },
                ]}
              >
                {['🎉', '✨', '⭐', '🎊'][i % 4]}
              </Animated.Text>
            ))}
          </View>
        )}

        {/* Header */}
        <View style={[styles.header, { backgroundColor: leagueColor }]}>
          <Text style={styles.headerText}>
            {isPromotion ? '¡PROMOCIÓN!' : isRelegation ? 'DESCENSO' : 'RESULTADO SEMANAL'}
          </Text>
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {/* Emoji animado */}
          <Animated.Text
            style={[
              styles.leagueEmoji,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { translateY: bounce },
                ],
              },
            ]}
          >
            {leagueEmoji}
          </Animated.Text>

          {/* Mensaje */}
          <Text style={styles.title}>
            {isPromotion
              ? '¡Subiste de liga!'
              : isRelegation
              ? 'Bajaste de liga'
              : 'Te mantuviste'}
          </Text>

          {/* Liga destino */}
          <View style={[styles.leagueBadge, { backgroundColor: leagueColor }]}>
            <Text style={styles.leagueBadgeText}>{toLeague}</Text>
          </View>

          {/* Detalles */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Posición final</Text>
              <Text style={styles.statValue}>#{position}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>XP semanal</Text>
              <Text style={styles.statValue}>{weeklyXp}</Text>
            </View>
          </View>

          {/* Mensaje motivacional */}
          <Text style={styles.motivationalText}>
            {isPromotion
              ? '¡Excelente trabajo! Sigue así para llegar a la cima.'
              : isRelegation
              ? 'No te rindas, la próxima semana será mejor.'
              : '¡Buen trabajo manteniendo tu posición!'}
          </Text>
        </View>

        {/* Boton de cerrar */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: leagueColor }]}
          onPress={onDismiss}
        >
          <Text style={styles.closeButtonText}>
            {isPromotion ? '¡Genial!' : isRelegation ? 'Entendido' : 'Continuar'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const baseStyles = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    overflow: 'hidden',
    zIndex: 10,
  },
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
  header: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  leagueEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  leagueBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  leagueBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  motivationalText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  closeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
} as const;

export default LeagueChangeNotification;
