import apiClient from './apiClient';
import {
  PendingRedemption,
  SubmitChallengeProofResponse,
  ValidationStatusResponse,
  ChallengeValidationErrorCode,
} from '../types';

/**
 * Respuesta del endpoint GET /pending-redemptions
 */
export interface PendingRedemptionsResponse {
  success: boolean;
  count: number;
  pending_redemptions: PendingRedemption[];
}

/**
 * Respuesta de POST /pending-redemptions/:id/redeem-life
 */
export interface RedeemLifeResponse {
  success: boolean;
  message: string;
  current_lives: number;
  is_dead: boolean;
}

/**
 * Respuesta de POST /pending-redemptions/:id/redeem-challenge
 */
export interface RedeemChallengeResponse {
  success: boolean;
  message: string;
  user_challenge: {
    id: string;
    challenge_id: string;
    habit_id: string;
    status: string;
    assigned_at: string;
  };
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
  };
  habit_still_blocked: boolean;
}

/**
 * Respuesta de POST /pending-redemptions/:id/complete-challenge (ASYNC)
 *
 * El sistema ahora es asíncrono:
 * - Siempre devuelve validation_id y status "pending_review"
 * - Frontend debe hacer polling con getValidationStatus()
 * - Resultado llega después (approved_* o rejected_*)
 */
// Re-export del tipo para compatibilidad
export type { SubmitChallengeProofResponse as CompleteChallengeResponse };

// Mantener para compatibilidad temporal
export type RedemptionActionResponse = RedeemLifeResponse | RedeemChallengeResponse;

/**
 * Mensajes de error mapeados para mostrar al usuario
 */
export const VALIDATION_ERROR_MESSAGES: Record<ChallengeValidationErrorCode, string> = {
  VALIDATION_PENDING: 'Ya tienes una prueba en revisión. Espera el resultado.',
  MAX_RETRIES_EXCEEDED: 'Has alcanzado el límite de 3 intentos.',
  REDEMPTION_TIME_EXPIRED: 'El tiempo para completar el challenge expiró.',
  REDEMPTION_EXPIRED: 'Esta redención expiró. Ya perdiste la vida.',
  IMAGE_TOO_LARGE: 'La imagen es muy grande. Máximo 5MB.',
  INVALID_IMAGE_FORMAT: 'Formato de imagen inválido. Usa JPEG, PNG, GIF o WebP.',
  NO_CHALLENGE_ASSIGNED: 'Primero debes elegir un challenge.',
  ALREADY_COMPLETED: 'Ya completaste este challenge.',
};

/**
 * Servicio para manejar el sistema de Pending Redemptions (24h de gracia)
 *
 * Flujo:
 * 1. Usuario falla hábito → se crea pending redemption (24h para decidir)
 * 2. Usuario puede:
 *    a) Aceptar perder vida (redeemLife)
 *    b) Elegir un challenge (redeemChallenge) → enviar prueba (completeChallenge)
 * 3. Si no decide en 24h → expira y pierde vida + penalización
 */
export class PendingRedemptionService {
  /**
   * Obtiene todas las pending redemptions activas del usuario
   * Incluye challenges disponibles para elegir
   */
  static async getPendingRedemptions(): Promise<PendingRedemptionsResponse> {
    try {
      const response = await apiClient.get<PendingRedemptionsResponse>('/pending-redemptions');
      return response.data;
    } catch (error: any) {
      console.error('Error getting pending redemptions:', error);
      throw error;
    }
  }

  /**
   * Acepta perder 1 vida para resolver el pending
   * El pending se marca como 'redeemed_life'
   *
   * IMPORTANTE: Verificar is_dead en la respuesta
   * Si is_dead=true, el usuario debe ir a pantalla de revival
   */
  static async redeemLife(pendingId: string): Promise<RedeemLifeResponse> {
    try {
      const response = await apiClient.post<RedeemLifeResponse>(
        `/pending-redemptions/${pendingId}/redeem-life`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error redeeming life:', error);
      throw error;
    }
  }

  /**
   * Elige un challenge para intentar salvarse
   * El pending se marca como 'challenge_assigned'
   * @param pendingId - ID del pending redemption
   * @param challengeId - ID del challenge elegido de available_challenges
   */
  static async redeemChallenge(
    pendingId: string,
    challengeId: string
  ): Promise<RedeemChallengeResponse> {
    try {
      const response = await apiClient.post<RedeemChallengeResponse>(
        `/pending-redemptions/${pendingId}/redeem-challenge`,
        { challenge_id: challengeId }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error redeeming with challenge:', error);
      throw error;
    }
  }

  /**
   * Envía pruebas de que completó el challenge asignado (ASYNC)
   *
   * IMPORTANTE: Este método ahora es asíncrono.
   * - Retorna validation_id y status "pending_review"
   * - Usar getValidationStatus() para polling del resultado
   *
   * @param pendingId - ID del pending redemption
   * @param proofText - Descripción de cómo completó el challenge (obligatorio, mín 20 chars)
   * @param proofImageUrls - Array de 1-2 imágenes en base64 (obligatorio)
   * @returns validation_id para tracking del estado
   */
  static async submitChallengeProof(
    pendingId: string,
    proofText: string,
    proofImageUrls: string[]
  ): Promise<SubmitChallengeProofResponse> {
    // Validación del texto (usar trim para consistencia con el form)
    const trimmedText = proofText?.trim() || '';
    if (trimmedText.length < 20) {
      throw new Error('La descripción debe tener al menos 20 caracteres.');
    }

    // Validación de imágenes
    if (!proofImageUrls || proofImageUrls.length === 0) {
      throw new Error('Debes adjuntar al menos 1 imagen como prueba.');
    }

    if (proofImageUrls.length > 2) {
      throw new Error('Máximo 2 imágenes permitidas.');
    }

    const response = await apiClient.post<SubmitChallengeProofResponse>(
      `/pending-redemptions/${pendingId}/complete-challenge`,
      {
        proof_text: trimmedText,
        proof_image_urls: proofImageUrls,
      }
    );
    return response.data;
  }

  /**
   * Consulta el estado de validación de un challenge (para polling)
   *
   * Estados posibles:
   * - pending_review: En espera de revisión
   * - approved_manual/approved_ai: Aprobado
   * - rejected_manual/rejected_ai: Rechazado (puede reintentar)
   *
   * @param pendingId - ID del pending redemption
   */
  static async getValidationStatus(pendingId: string): Promise<ValidationStatusResponse> {
    const response = await apiClient.get<ValidationStatusResponse>(
      `/pending-redemptions/${pendingId}/validation-status`
    );
    return response.data;
  }

  /**
   * Helper: Obtiene mensaje de error legible para el usuario
   */
  static getErrorMessage(errorCode: string): string {
    return VALIDATION_ERROR_MESSAGES[errorCode as ChallengeValidationErrorCode]
      || 'Error al procesar la solicitud. Intenta de nuevo.';
  }

  /**
   * Helper: Verifica si el error indica que ya hay validación pendiente
   */
  static isValidationPendingError(error: any): boolean {
    return error?.response?.data?.error_code === 'VALIDATION_PENDING';
  }

  /**
   * Helper: Verifica si se excedieron los reintentos
   */
  static isMaxRetriesError(error: any): boolean {
    return error?.response?.data?.error_code === 'MAX_RETRIES_EXCEEDED';
  }

  /**
   * Helper: Extrae validation_id de un error VALIDATION_PENDING
   */
  static getValidationIdFromError(error: any): string | null {
    return error?.response?.data?.validation_id || null;
  }

  /**
   * @deprecated Usar submitChallengeProof() en su lugar
   * Mantenido por compatibilidad temporal
   */
  static async completeChallenge(
    pendingId: string,
    proofText: string,
    proofImageUrls: string[]
  ): Promise<SubmitChallengeProofResponse> {
    console.warn('completeChallenge() is deprecated, use submitChallengeProof() instead');
    return this.submitChallengeProof(pendingId, proofText, proofImageUrls);
  }

  /**
   * Helper: Verifica si hay pending redemptions activas
   */
  static async hasActivePendings(): Promise<boolean> {
    try {
      const response = await this.getPendingRedemptions();
      return response.count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Obtiene solo los pendings que requieren acción inmediata
   * (status = 'pending' o 'challenge_assigned')
   */
  static async getActionablePendings(): Promise<PendingRedemption[]> {
    try {
      const response = await this.getPendingRedemptions();
      return response.pending_redemptions.filter(
        p => p.status === 'pending' || p.status === 'challenge_assigned'
      );
    } catch {
      return [];
    }
  }

  /**
   * Helper: Formatea el tiempo restante para mostrar al usuario
   */
  static formatTimeRemaining(timeRemainingMs: number): string {
    if (timeRemainingMs <= 0) {
      return 'Expirado';
    }

    const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Helper: Determina la urgencia basada en el tiempo restante
   */
  static getUrgencyLevel(timeRemainingMs: number): 'low' | 'medium' | 'high' | 'critical' {
    const hours = timeRemainingMs / (1000 * 60 * 60);

    if (hours <= 1) return 'critical';
    if (hours <= 3) return 'high';
    if (hours <= 12) return 'medium';
    return 'low';
  }
}
