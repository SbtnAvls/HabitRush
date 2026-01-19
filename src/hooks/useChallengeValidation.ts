import { useState, useEffect, useCallback, useRef } from 'react';
import { ChallengeValidation, ChallengeValidationStatus } from '../types';
import { PendingRedemptionService } from '../services/pendingRedemptionService';

// Intervalo de polling en ms (30 segundos)
const DEFAULT_POLLING_INTERVAL = 30 * 1000;

interface UseChallengeValidationOptions {
  /** ID del pending redemption a monitorear */
  redemptionId: string;
  /** Callback cuando la validación es aprobada */
  onApproved?: (validation: ChallengeValidation) => void;
  /** Callback cuando la validación es rechazada */
  onRejected?: (validation: ChallengeValidation) => void;
  /** Callback para refrescar datos del usuario (hábitos, vidas, etc.) */
  onRefreshNeeded?: () => void;
  /** Intervalo de polling en ms (default: 30000) */
  pollingInterval?: number;
  /** Si debe verificar el estado al montar (default: true) */
  autoCheckOnMount?: boolean;
}

interface UseChallengeValidationReturn {
  // Estado actual
  validation: ChallengeValidation | null;
  isPolling: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Acciones
  submitProof: (proofText: string, proofImageUrls: string[]) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  reset: () => void;
  clearError: () => void;

  // Helpers computados
  isApproved: boolean;
  isRejected: boolean;
  isPending: boolean;
  canRetry: boolean;
  rejectionReason: string | null;
  validationStatus: ChallengeValidationStatus | null;
}

/**
 * Hook para manejar la validación asíncrona de challenges
 *
 * Flujo:
 * 1. Al montar, verifica si hay validación pendiente (checkStatus)
 * 2. Si hay pending_review, inicia polling automático
 * 3. Cuando llega resultado (approved/rejected), ejecuta callbacks y para polling
 *
 * Uso:
 * ```tsx
 * const {
 *   validation,
 *   isPending,
 *   isApproved,
 *   isRejected,
 *   submitProof,
 *   rejectionReason,
 * } = useChallengeValidation({
 *   redemptionId: 'xxx',
 *   onApproved: () => navigation.goBack(),
 *   onRejected: (v) => showToast(v.reviewer_notes),
 *   onRefreshNeeded: () => refreshUserData(),
 * });
 * ```
 */
export const useChallengeValidation = (
  options: UseChallengeValidationOptions
): UseChallengeValidationReturn => {
  const {
    redemptionId,
    onApproved,
    onRejected,
    onRefreshNeeded,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    autoCheckOnMount = true,
  } = options;

  // Estado
  const [validation, setValidation] = useState<ChallengeValidation | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(autoCheckOnMount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para evitar stale closures y memory leaks
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const callbacksRef = useRef({ onApproved, onRejected, onRefreshNeeded });

  // Mantener callbacks actualizados sin causar re-renders
  useEffect(() => {
    callbacksRef.current = { onApproved, onRejected, onRefreshNeeded };
  }, [onApproved, onRejected, onRefreshNeeded]);

  /**
   * Procesa el resultado de la validación y ejecuta callbacks
   */
  const processValidationResult = useCallback((newValidation: ChallengeValidation) => {
    if (!isMountedRef.current) return;

    setValidation(newValidation);

    const { status } = newValidation;
    const { onApproved, onRejected, onRefreshNeeded } = callbacksRef.current;

    if (status === 'approved_manual' || status === 'approved_ai') {
      stopPollingInternal();
      onRefreshNeeded?.();
      onApproved?.(newValidation);
    } else if (status === 'rejected_manual' || status === 'rejected_ai') {
      stopPollingInternal();
      onRejected?.(newValidation);
    }
  }, []);

  /**
   * Para el polling internamente
   */
  const stopPollingInternal = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  /**
   * Consulta el estado de validación al backend
   */
  const checkStatus = useCallback(async (): Promise<void> => {
    if (!redemptionId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await PendingRedemptionService.getValidationStatus(redemptionId);

      if (!isMountedRef.current) return;

      if (response.has_validation && response.validation) {
        processValidationResult(response.validation);

        // Si está pendiente, iniciar polling automático
        if (response.validation.status === 'pending_review') {
          startPollingInternal();
        }
      } else {
        setValidation(null);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('Error checking validation status:', err);
      setError(err?.message || 'Error al verificar estado de validación');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [redemptionId, processValidationResult]);

  /**
   * Inicia el polling internamente
   */
  const startPollingInternal = useCallback(() => {
    // Evitar múltiples pollings
    if (pollingRef.current) return;

    setIsPolling(true);

    pollingRef.current = setInterval(async () => {
      if (!isMountedRef.current) {
        stopPollingInternal();
        return;
      }

      try {
        const response = await PendingRedemptionService.getValidationStatus(redemptionId);

        if (!isMountedRef.current) return;

        if (response.has_validation && response.validation) {
          processValidationResult(response.validation);
        }
      } catch (err) {
        // Error silencioso en polling - no queremos molestar al usuario
        console.warn('Polling error (silent):', err);
      }
    }, pollingInterval);
  }, [redemptionId, pollingInterval, processValidationResult]);

  /**
   * Envía la prueba del challenge
   */
  const submitProof = useCallback(async (
    proofText: string,
    proofImageUrls: string[]
  ): Promise<boolean> => {
    if (!redemptionId) return false;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await PendingRedemptionService.submitChallengeProof(
        redemptionId,
        proofText,
        proofImageUrls
      );

      if (!isMountedRef.current) return false;

      // Crear validación inicial con los datos de la respuesta
      // Nota: expires_at es estimado del cliente (+1h). Se actualizará con datos
      // reales del servidor en el primer poll (máx 30 segundos después)
      const initialValidation: ChallengeValidation = {
        id: response.validation_id,
        status: 'pending_review',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        reviewed_at: null,
        reviewer_notes: null,
        ai_result: null,
      };

      setValidation(initialValidation);

      // Iniciar polling
      startPollingInternal();

      return true;
    } catch (err: any) {
      if (!isMountedRef.current) return false;

      console.error('Error submitting proof:', err);

      // Manejar errores específicos
      if (PendingRedemptionService.isValidationPendingError(err)) {
        // Ya hay validación pendiente - consultar estado actual
        setError('Ya tienes una prueba en revisión. Verificando estado...');
        checkStatus();
        return false;
      }

      const errorCode = err?.response?.data?.error_code;
      const errorMessage = errorCode
        ? PendingRedemptionService.getErrorMessage(errorCode)
        : err?.message || 'Error al enviar prueba';

      setError(errorMessage);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [redemptionId, startPollingInternal, checkStatus]);

  /**
   * Inicia el polling manualmente (expuesto para uso externo)
   */
  const startPolling = useCallback(() => {
    startPollingInternal();
  }, [startPollingInternal]);

  /**
   * Para el polling manualmente
   */
  const stopPolling = useCallback(() => {
    stopPollingInternal();
  }, []);

  /**
   * Resetea el estado del hook
   */
  const reset = useCallback(() => {
    stopPollingInternal();
    setValidation(null);
    setError(null);
    setIsLoading(false);
    setIsSubmitting(false);
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar estado al montar o cuando cambia redemptionId
  useEffect(() => {
    if (autoCheckOnMount && redemptionId) {
      checkStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redemptionId, autoCheckOnMount]); // checkStatus es estable gracias a useCallback

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopPollingInternal();
    };
  }, []);

  // Helpers computados
  const validationStatus = validation?.status || null;
  const isApproved = validationStatus === 'approved_manual' || validationStatus === 'approved_ai';
  const isRejected = validationStatus === 'rejected_manual' || validationStatus === 'rejected_ai';
  const isPending = validationStatus === 'pending_review';
  const canRetry = isRejected; // Por ahora, si fue rechazado puede reintentar (hasta 3 veces, controlado por backend)

  const rejectionReason = isRejected
    ? validation?.reviewer_notes || validation?.ai_result?.reasoning || 'La prueba no cumplió los requisitos.'
    : null;

  return {
    // Estado
    validation,
    isPolling,
    isLoading,
    isSubmitting,
    error,

    // Acciones
    submitProof,
    checkStatus,
    startPolling,
    stopPolling,
    reset,
    clearError,

    // Helpers
    isApproved,
    isRejected,
    isPending,
    canRetry,
    rejectionReason,
    validationStatus,
  };
};
