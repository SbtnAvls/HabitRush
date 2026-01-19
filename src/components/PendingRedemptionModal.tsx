import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PendingRedemption, AvailableChallenge } from '../types';
import { PendingRedemptionService } from '../services/pendingRedemptionService';
import { ChallengeProofForm } from './ChallengeProofForm';
import { ValidationPendingView } from './ValidationPendingView';
import { ValidationResultView } from './ValidationResultView';
import { useChallengeValidation } from '../hooks/useChallengeValidation';
import { useTheme } from '../theme/useTheme';
import { AppTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ModalStep = 'decision' | 'select_challenge' | 'submit_proof' | 'validation_pending' | 'validation_result';

interface PendingRedemptionModalProps {
  visible: boolean;
  pending: PendingRedemption | null;
  onClose: () => void;
  onRedeemLife: (pendingId: string) => Promise<void>;
  onSelectChallenge: (pendingId: string, challengeId: string) => Promise<void>;
  onRefreshNeeded?: () => void;
  actionLoading: boolean;
}

export const PendingRedemptionModal: React.FC<PendingRedemptionModalProps> = ({
  visible,
  pending,
  onClose,
  onRedeemLife,
  onSelectChallenge,
  onRefreshNeeded,
  actionLoading,
}) => {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [step, setStep] = useState<ModalStep>('decision');
  const [formResetKey, setFormResetKey] = useState(0);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const option1Anim = useRef(new Animated.Value(0)).current;
  const option2Anim = useRef(new Animated.Value(0)).current;

  // Hook para manejar validación asíncrona
  const {
    validation,
    isPending: isValidationPending,
    isApproved,
    isRejected,
    submitProof,
    checkStatus,
    stopPolling,
    startPolling,
    reset: resetValidation,
    rejectionReason,
    isSubmitting,
    error: validationError,
    clearError,
  } = useChallengeValidation({
    redemptionId: pending?.id || '',
    onApproved: () => setStep('validation_result'),
    onRejected: () => setStep('validation_result'),
    onRefreshNeeded,
    autoCheckOnMount: false,
  });

  // Animación de entrada
  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
      option1Anim.setValue(0);
      option2Anim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered options animation
      Animated.sequence([
        Animated.delay(200),
        Animated.stagger(100, [
          Animated.spring(option1Anim, {
            toValue: 1,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(option2Anim, {
            toValue: 1,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Pulse animation for timer
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  // Reset step cuando cambia el pending
  useEffect(() => {
    if (pending) {
      resetValidation();
      if (pending.status === 'challenge_assigned') {
        checkStatus();
        setStep('submit_proof');
      } else {
        setStep('decision');
      }
    }
  }, [pending?.id]);

  // Cambiar step basado en estado de validación
  useEffect(() => {
    if (isValidationPending && step === 'submit_proof') {
      setStep('validation_pending');
    }
    if ((isApproved || isRejected) && step === 'validation_pending') {
      setStep('validation_result');
    }
  }, [isValidationPending, isApproved, isRejected, step]);

  // Manejar polling
  useEffect(() => {
    if (!visible) {
      stopPolling();
      setFormResetKey(prev => prev + 1);
      clearError();
    } else if (visible && isValidationPending) {
      startPolling();
    }
  }, [visible, isValidationPending, stopPolling, startPolling, clearError]);

  const timeRemaining = useMemo(
    () => pending ? PendingRedemptionService.formatTimeRemaining(pending.time_remaining_ms) : '',
    [pending?.time_remaining_ms]
  );

  const urgencyLevel = useMemo(
    () => pending ? PendingRedemptionService.getUrgencyLevel(pending.time_remaining_ms) : 'low',
    [pending?.time_remaining_ms]
  );

  if (!pending) return null;

  const handleRedeemLife = () => {
    Alert.alert(
      'Confirmar decisión',
      '¿Estás seguro de que quieres perder 1 vida?\n\nEsta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, perder vida',
          style: 'destructive',
          onPress: async () => {
            await onRedeemLife(pending.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleSelectChallenge = async (challenge: AvailableChallenge) => {
    try {
      await onSelectChallenge(pending.id, challenge.id);
      setStep('submit_proof');
    } catch (error) {
      // Error ya manejado
    }
  };

  const handleSubmitProof = async (proofText: string, proofImageUrls: string[]) => {
    const success = await submitProof(proofText, proofImageUrls);
    if (success) {
      setStep('validation_pending');
    }
  };

  const handleRetry = () => {
    resetValidation();
    setFormResetKey(prev => prev + 1);
    setStep('submit_proof');
  };

  const handleCloseAfterApproval = () => {
    onClose();
  };

  const getUrgencyColors = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
          border: '#EF4444',
          text: isDark ? '#FCA5A5' : '#DC2626',
          glow: '#EF4444',
        };
      case 'high':
        return {
          bg: isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5',
          border: '#F97316',
          text: isDark ? '#FDBA74' : '#EA580C',
          glow: '#F97316',
        };
      case 'medium':
        return {
          bg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF9C3',
          border: '#EAB308',
          text: isDark ? '#FDE047' : '#CA8A04',
          glow: '#EAB308',
        };
      default:
        return {
          bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
          border: '#22C55E',
          text: isDark ? '#86EFAC' : '#16A34A',
          glow: '#22C55E',
        };
    }
  };

  const urgencyColors = getUrgencyColors();

  const renderDecisionStep = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        {/* Animated Timer Badge */}
        <Animated.View
          style={[
            styles.timerBadge,
            {
              backgroundColor: urgencyColors.bg,
              borderColor: urgencyColors.border,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Icon name="timer-sand" size={20} color={urgencyColors.text} />
          <Text style={[styles.timerText, { color: urgencyColors.text }]}>
            {timeRemaining}
          </Text>
        </Animated.View>

        {/* Icon */}
        <View style={[styles.heroIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
        </View>

        {/* Title */}
        <Text style={styles.heroTitle}>¡Ups! Fallaste un hábito</Text>
        <View style={styles.habitNameContainer}>
          <Icon name="checkbox-marked-circle-outline" size={18} color={theme.colors.textMuted} />
          <Text style={styles.habitNameText}>{pending.habit_name}</Text>
        </View>
        <Text style={styles.failedDateText}>
          {new Date(pending.failed_date).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Options Section */}
      <View style={styles.optionsSection}>
        <Text style={styles.sectionTitle}>¿Cómo quieres resolverlo?</Text>

        {/* Option 1: Lose Life */}
        <Animated.View
          style={{
            opacity: option1Anim,
            transform: [
              {
                translateX: option1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={[styles.optionCard, styles.optionDanger]}
            onPress={handleRedeemLife}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconWrapper, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
              <Icon name="heart-broken" size={28} color="#EF4444" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Aceptar penalización</Text>
              <Text style={styles.optionSubtitle}>Perder 1 vida y continuar</Text>
            </View>
            {actionLoading ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <View style={[styles.optionArrow, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                <Icon name="chevron-right" size={20} color="#EF4444" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Option 2: Challenge */}
        <Animated.View
          style={{
            opacity: option2Anim,
            transform: [
              {
                translateX: option2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.optionSuccess,
              pending.available_challenges.length === 0 && styles.optionDisabled,
            ]}
            onPress={() => setStep('select_challenge')}
            disabled={actionLoading || pending.available_challenges.length === 0}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconWrapper, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <Icon name="trophy" size={28} color="#22C55E" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Completar un reto</Text>
              <Text style={styles.optionSubtitle}>
                {pending.available_challenges.length > 0
                  ? `${pending.available_challenges.length} ${pending.available_challenges.length === 1 ? 'reto disponible' : 'retos disponibles'}`
                  : 'No hay retos disponibles'}
              </Text>
            </View>
            <View style={[styles.optionArrow, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <Icon name="chevron-right" size={20} color="#22C55E" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Warning for critical urgency */}
      {urgencyLevel === 'critical' && (
        <Animated.View
          style={[
            styles.warningBanner,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Icon name="alert-octagon" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            ¡Tiempo casi agotado! Decide ahora o perderás la vida automáticamente.
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderSelectChallengeStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('decision')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.stepHeaderContent}>
          <Text style={styles.stepTitle}>Elige tu reto</Text>
          <Text style={styles.stepSubtitle}>Complétalo para salvar tu vida</Text>
        </View>
      </View>

      {/* Challenge List */}
      <View style={styles.challengeList}>
        {pending.available_challenges.map((challenge, index) => (
          <Animated.View
            key={challenge.id}
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30 * (index + 1), 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.challengeCard}
              onPress={() => handleSelectChallenge(challenge)}
              disabled={actionLoading}
              activeOpacity={0.7}
            >
              <View style={styles.challengeHeader}>
                <View style={[styles.difficultyBadge, getDifficultyStyle(challenge.difficulty, isDark)]}>
                  <Icon
                    name={getDifficultyIcon(challenge.difficulty)}
                    size={14}
                    color={getDifficultyColor(challenge.difficulty)}
                  />
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(challenge.difficulty) }]}>
                    {getDifficultyLabel(challenge.difficulty)}
                  </Text>
                </View>
              </View>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
              {actionLoading ? (
                <ActivityIndicator size="small" color="#22C55E" style={{ marginTop: 12 }} />
              ) : (
                <View style={styles.selectChallengeButton}>
                  <Text style={styles.selectChallengeText}>Elegir este reto</Text>
                  <Icon name="arrow-right" size={18} color="#22C55E" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderSubmitProofStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Header */}
      <View style={styles.proofHeader}>
        <Animated.View
          style={[
            styles.timerBadge,
            {
              backgroundColor: urgencyColors.bg,
              borderColor: urgencyColors.border,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Icon name="timer-sand" size={18} color={urgencyColors.text} />
          <Text style={[styles.timerText, { color: urgencyColors.text }]}>{timeRemaining}</Text>
        </Animated.View>
        <Text style={styles.proofTitle}>Envía tu prueba</Text>
        {pending.assigned_challenge && (
          <View style={styles.assignedChallengeBox}>
            <Icon name="target" size={20} color="#22C55E" />
            <View style={styles.assignedChallengeContent}>
              <Text style={styles.assignedChallengeTitle}>{pending.assigned_challenge.title}</Text>
              <Text style={styles.assignedChallengeDesc}>{pending.assigned_challenge.description}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Error box */}
      {validationError && (
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      )}

      <ChallengeProofForm
        onSubmit={handleSubmitProof}
        loading={isSubmitting || actionLoading}
        challengeTitle={pending.assigned_challenge?.title || ''}
        resetKey={`${pending.id}-${formResetKey}`}
      />
    </Animated.View>
  );

  const renderValidationPendingStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {validation ? (
        <ValidationPendingView
          validation={validation}
          message="Tu prueba está siendo revisada"
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando estado...</Text>
        </View>
      )}

      <View style={styles.pendingActions}>
        <TouchableOpacity style={styles.closeModalButton} onPress={onClose} activeOpacity={0.8}>
          <Icon name="close" size={20} color={theme.colors.textMuted} />
          <Text style={styles.closeModalButtonText}>Cerrar</Text>
        </TouchableOpacity>
        <Text style={styles.pendingHint}>
          Puedes cerrar y volver más tarde. Te notificaremos cuando esté listo.
        </Text>
      </View>
    </Animated.View>
  );

  const renderValidationResultStep = () => (
    <ValidationResultView
      isApproved={isApproved}
      rejectionReason={rejectionReason}
      canRetry={isRejected}
      onRetry={handleRetry}
      onClose={isApproved ? handleCloseAfterApproval : onClose}
      closeButtonText={isApproved ? 'Volver a mis hábitos' : 'Cerrar'}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Icon name="close" size={24} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'decision' && renderDecisionStep()}
          {step === 'select_challenge' && renderSelectChallengeStep()}
          {step === 'submit_proof' && renderSubmitProofStep()}
          {step === 'validation_pending' && renderValidationPendingStep()}
          {step === 'validation_result' && renderValidationResultStep()}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Helpers
const getDifficultyStyle = (difficulty: string, isDark: boolean) => {
  switch (difficulty) {
    case 'easy':
      return { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' };
    case 'medium':
      return { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF9C3' };
    case 'hard':
      return { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' };
    default:
      return { backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6' };
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '#22C55E';
    case 'medium': return '#EAB308';
    case 'hard': return '#EF4444';
    default: return '#6B7280';
  }
};

const getDifficultyIcon = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'star-outline';
    case 'medium': return 'star-half-full';
    case 'hard': return 'star';
    default: return 'star-outline';
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'Fácil';
    case 'medium': return 'Medio';
    case 'hard': return 'Difícil';
    default: return difficulty;
  }
};

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 60,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },

    // Hero Section
    heroSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 2,
      marginBottom: 24,
      gap: 8,
    },
    timerText: {
      fontSize: 16,
      fontWeight: '700',
    },
    heroIconContainer: {
      width: 88,
      height: 88,
      borderRadius: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    habitNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 8,
      marginBottom: 8,
    },
    habitNameText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    failedDateText: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textTransform: 'capitalize',
    },

    // Options Section
    optionsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionDanger: {
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    optionSuccess: {
      borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
    },
    optionDisabled: {
      opacity: 0.5,
    },
    optionIconWrapper: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    optionSubtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    optionArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Warning Banner
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#FCA5A5' : '#DC2626',
      lineHeight: 20,
    },

    // Step Header
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepHeaderContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    stepSubtitle: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: 2,
    },

    // Challenge List
    challengeList: {
      gap: 12,
    },
    challengeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    challengeHeader: {
      marginBottom: 12,
    },
    difficultyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
    },
    challengeTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    challengeDescription: {
      fontSize: 14,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    selectChallengeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 6,
    },
    selectChallengeText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#22C55E',
    },

    // Proof Header
    proofHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    proofTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 16,
      marginBottom: 16,
    },
    assignedChallengeBox: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#F0FDF4',
      borderRadius: 12,
      padding: 14,
      width: '100%',
      gap: 12,
    },
    assignedChallengeContent: {
      flex: 1,
    },
    assignedChallengeTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    assignedChallengeDesc: {
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },

    // Error Box
    errorBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      gap: 10,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#FCA5A5' : '#DC2626',
      lineHeight: 20,
    },

    // Pending Actions
    pendingActions: {
      alignItems: 'center',
      paddingTop: 24,
    },
    closeModalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginBottom: 12,
    },
    closeModalButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    pendingHint: {
      fontSize: 13,
      color: theme.colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 20,
    },

    // Loading
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textMuted,
    },
  });

export default PendingRedemptionModal;
