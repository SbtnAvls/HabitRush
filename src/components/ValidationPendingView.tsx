import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ChallengeValidation } from '../types';

interface ValidationPendingViewProps {
  /** Datos de la validación en proceso */
  validation: ChallengeValidation;
  /** Mensaje personalizado (opcional) */
  message?: string;
}

/**
 * Vista que muestra el estado "en revisión" de una validación de challenge
 *
 * Incluye:
 * - Animación de loading
 * - Tiempo restante hasta expiración
 * - Mensaje informativo
 */
export const ValidationPendingView: React.FC<ValidationPendingViewProps> = ({
  validation,
  message = 'Tu prueba está siendo revisada',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Animación de rotación para el spinner
  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [spinValue]);

  // Animación de pulso para el ícono
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseValue]);

  // Actualizar tiempo restante cada segundo
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!validation.expires_at) {
        setTimeRemaining('');
        return;
      }

      const now = Date.now();
      const expiresAt = new Date(validation.expires_at).getTime();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Procesando...');
        return;
      }

      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [validation.expires_at]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Ícono animado */}
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.spinnerOuter,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <View style={styles.spinnerTrack} />
        </Animated.View>
        <Animated.View
          style={[
            styles.iconInner,
            { transform: [{ scale: pulseValue }] },
          ]}
        >
          <Icon name="file-search-outline" size={32} color="#3B82F6" />
        </Animated.View>
      </View>

      {/* Mensaje principal */}
      <Text style={styles.title}>{message}</Text>

      {/* Tiempo restante */}
      {timeRemaining && (
        <View style={styles.timeContainer}>
          <Icon name="clock-outline" size={16} color="#6B7280" />
          <Text style={styles.timeText}>
            Tiempo máximo de espera: {timeRemaining}
          </Text>
        </View>
      )}

      {/* Información adicional */}
      <View style={styles.infoBox}>
        <Icon name="information-outline" size={18} color="#3B82F6" />
        <Text style={styles.infoText}>
          Puedes cerrar esta pantalla. Te notificaremos cuando tengamos el resultado.
        </Text>
      </View>

      {/* Indicadores de pasos */}
      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <View style={[styles.stepDot, styles.stepDotCompleted]}>
            <Icon name="check" size={12} color="#FFF" />
          </View>
          <Text style={styles.stepText}>Prueba enviada</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <View style={[styles.stepDot, styles.stepDotActive]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon name="loading" size={12} color="#FFF" />
            </Animated.View>
          </View>
          <Text style={[styles.stepText, styles.stepTextActive]}>En revisión</Text>
        </View>
        <View style={[styles.stepLine, styles.stepLineInactive]} />
        <View style={styles.step}>
          <View style={[styles.stepDot, styles.stepDotInactive]}>
            <Icon name="check" size={12} color="#9CA3AF" />
          </View>
          <Text style={[styles.stepText, styles.stepTextInactive]}>Resultado</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  spinnerOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  spinnerTrack: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderTopColor: '#3B82F6',
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  stepDotInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#10B981',
    marginHorizontal: 4,
    marginBottom: 24,
  },
  stepLineInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  stepTextInactive: {
    color: '#9CA3AF',
  },
});

export default ValidationPendingView;
