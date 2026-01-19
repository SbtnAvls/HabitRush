import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ValidationResultViewProps {
  /** Si la validación fue aprobada */
  isApproved: boolean;
  /** Razón del rechazo (solo si isApproved = false) */
  rejectionReason?: string | null;
  /** Si puede reintentar (solo si rechazado) */
  canRetry?: boolean;
  /** Número de intento actual (ej: 2 de 3) */
  attemptNumber?: number;
  /** Máximo de intentos permitidos */
  maxAttempts?: number;
  /** Callback para reintentar */
  onRetry?: () => void;
  /** Callback para cerrar/volver */
  onClose: () => void;
  /** Texto del botón de cerrar */
  closeButtonText?: string;
}

/**
 * Vista que muestra el resultado de una validación de challenge
 *
 * Estados:
 * - Aprobado: Ícono verde, mensaje de éxito, botón para volver
 * - Rechazado: Ícono rojo, razón del rechazo, botón para reintentar (si aplica)
 */
export const ValidationResultView: React.FC<ValidationResultViewProps> = ({
  isApproved,
  rejectionReason,
  canRetry = true,
  attemptNumber,
  maxAttempts = 3,
  onRetry,
  onClose,
  closeButtonText,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleValue, fadeValue]);

  const renderApprovedContent = () => (
    <>
      {/* Ícono de éxito */}
      <Animated.View
        style={[
          styles.iconContainer,
          styles.iconContainerSuccess,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <Icon name="check-circle" size={64} color="#10B981" />
      </Animated.View>

      {/* Mensaje de éxito */}
      <Text style={styles.title}>¡Challenge completado!</Text>
      <Text style={styles.subtitle}>
        Tu prueba fue validada correctamente
      </Text>

      {/* Info adicional */}
      <View style={[styles.infoBox, styles.infoBoxSuccess]}>
        <Icon name="shield-check" size={20} color="#059669" />
        <Text style={styles.infoTextSuccess}>
          Tu hábito ha sido desbloqueado y puedes continuar con tu racha.
        </Text>
      </View>

      {/* Botón para volver */}
      <TouchableOpacity
        style={[styles.button, styles.buttonSuccess]}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <Icon name="home" size={20} color="#FFF" />
        <Text style={styles.buttonText}>
          {closeButtonText || 'Volver a mis hábitos'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderRejectedContent = () => (
    <>
      {/* Ícono de rechazo */}
      <Animated.View
        style={[
          styles.iconContainer,
          styles.iconContainerError,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <Icon name="close-circle" size={64} color="#EF4444" />
      </Animated.View>

      {/* Mensaje de rechazo */}
      <Text style={styles.title}>Prueba rechazada</Text>

      {/* Razón del rechazo */}
      {rejectionReason && (
        <View style={styles.rejectionBox}>
          <View style={styles.rejectionHeader}>
            <Icon name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.rejectionLabel}>Motivo:</Text>
          </View>
          <Text style={styles.rejectionReason}>{rejectionReason}</Text>
        </View>
      )}

      {/* Contador de intentos */}
      {attemptNumber !== undefined && (
        <View style={styles.attemptsContainer}>
          <Icon name="refresh" size={16} color="#6B7280" />
          <Text style={styles.attemptsText}>
            Intento {attemptNumber} de {maxAttempts}
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.buttonsContainer}>
        {canRetry && onRetry && (
          <TouchableOpacity
            style={[styles.button, styles.buttonRetry]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Icon name="camera-retake" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Enviar nueva prueba</Text>
          </TouchableOpacity>
        )}

        {!canRetry && (
          <View style={[styles.infoBox, styles.infoBoxWarning]}>
            <Icon name="alert" size={20} color="#D97706" />
            <Text style={styles.infoTextWarning}>
              Has alcanzado el límite de intentos. El hábito permanecerá bloqueado.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            canRetry ? styles.buttonSecondary : styles.buttonPrimary,
          ]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.buttonText,
              canRetry && styles.buttonTextSecondary,
            ]}
          >
            {closeButtonText || (canRetry ? 'Cerrar' : 'Volver')}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeValue }]}>
      {isApproved ? renderApprovedContent() : renderRejectedContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainerSuccess: {
    backgroundColor: '#ECFDF5',
  },
  iconContainerError: {
    backgroundColor: '#FEF2F2',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  infoBoxSuccess: {
    backgroundColor: '#ECFDF5',
  },
  infoBoxWarning: {
    backgroundColor: '#FFFBEB',
    marginBottom: 16,
  },
  infoTextSuccess: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },
  infoTextWarning: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#D97706',
    lineHeight: 20,
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  attemptsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  buttonSuccess: {
    backgroundColor: '#10B981',
    width: '100%',
  },
  buttonRetry: {
    backgroundColor: '#3B82F6',
  },
  buttonPrimary: {
    backgroundColor: '#6B7280',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  buttonTextSecondary: {
    color: '#374151',
  },
});

export default ValidationResultView;
