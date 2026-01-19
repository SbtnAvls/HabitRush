import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../theme/useTheme';
import { AppTheme } from '../theme';

interface FirstCompletionCelebrationProps {
  visible: boolean;
  habitName: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const FirstCompletionCelebration: React.FC<FirstCompletionCelebrationProps> = ({
  visible,
  habitName,
  onClose,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const starRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      starRotation.setValue(0);

      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación continua de la estrella
      Animated.loop(
        Animated.sequence([
          Animated.timing(starRotation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(starRotation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const spin = starRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Confeti desde múltiples posiciones */}
        <ConfettiCannon
          count={150}
          origin={{ x: 0, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={400}
          fallSpeed={3000}
          colors={['#4ECDC4', '#FFE66D', '#FF6B6B', '#A78BFA', '#34D399', '#F472B6']}
        />
        <ConfettiCannon
          count={150}
          origin={{ x: width, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={400}
          fallSpeed={3000}
          colors={['#4ECDC4', '#FFE66D', '#FF6B6B', '#A78BFA', '#34D399', '#F472B6']}
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Estrella animada */}
          <Animated.Text
            style={[styles.starEmoji, { transform: [{ rotate: spin }] }]}
          >
            ⭐
          </Animated.Text>

          {/* Emoji principal */}
          <Text style={styles.mainEmoji}>🎉</Text>

          {/* Título */}
          <Text style={styles.title}>¡Felicitaciones!</Text>

          {/* Subtítulo */}
          <Text style={styles.subtitle}>
            Completaste tu primer día de
          </Text>
          <Text style={styles.habitName}>"{habitName}"</Text>

          {/* Mensaje motivacional */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Este es el comienzo de algo increíble.{'\n'}
              Cada día que completes te acerca más a tu mejor versión.
            </Text>
          </View>

          {/* Stats de motivación */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statLabel}>Racha: 1 día</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💪</Text>
              <Text style={styles.statLabel}>¡Sigue así!</Text>
            </View>
          </View>

          {/* Botón de continuar */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>¡A seguir adelante!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 32,
      marginHorizontal: 24,
      alignItems: 'center',
      maxWidth: 340,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
    },
    starEmoji: {
      fontSize: 40,
      position: 'absolute',
      top: -20,
      right: 20,
    },
    mainEmoji: {
      fontSize: 72,
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    habitName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    messageContainer: {
      backgroundColor: theme.name === 'dark' ? 'rgba(78, 205, 196, 0.15)' : '#E8F8F7',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    message: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 24,
    },
    statItem: {
      alignItems: 'center',
    },
    statEmoji: {
      fontSize: 28,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 25,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default FirstCompletionCelebration;
