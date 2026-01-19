import apiClient from './apiClient';
import { LifeChallenge, LifeChallengeStatus } from '../types';

/**
 * Interfaz de Life Challenge con estado del usuario (desde el backend)
 * GET /life-challenges?withStatus=true
 */
export interface LifeChallengeWithStatusAPI {
  life_challenge_id: string;
  title: string;
  description: string;
  reward: number;
  redeemable_type: 'once' | 'unlimited';
  icon: string;
  status: 'pending' | 'obtained' | 'redeemed';
  obtained_at: string | null;
  redeemed_at: string | null;
  can_redeem: boolean;
}

/**
 * Interfaz de historial de vida del usuario
 * GET /users/me/life-history
 */
export interface LifeHistoryAPI {
  lives_change: number;
  current_lives: number;
  reason: 'habit_missed' | 'challenge_completed' | 'life_challenge_redeemed';
  related_habit_id: string | null;
}

/**
 * Respuesta al redimir un desafío de vida (éxito)
 */
export interface RedeemLifeChallengeResponse {
  message: string;
  livesGained: number;
  currentLives: number;
  success: boolean;
}

/**
 * Códigos de error para redención de life challenges
 */
export type RedeemErrorCode = 'INSUFFICIENT_LIFE_SLOTS' | 'CHALLENGE_NOT_FOUND' | 'ALREADY_REDEEMED' | 'REQUIREMENTS_NOT_MET';

/**
 * Error al redimir un desafío de vida
 */
export interface RedeemLifeChallengeError {
  message: string;
  success: false;
  code?: RedeemErrorCode;
  requiredSlots?: number;
  availableSlots?: number;
}

/**
 * Mapper: Convierte entre formatos de life challenges
 */
export class LifeChallengeMapper {
  /**
   * Convierte LifeChallengeWithStatusAPI del backend a LifeChallenge local
   */
  static fromAPIWithStatus(api: LifeChallengeWithStatusAPI): LifeChallenge {
    return {
      id: api.life_challenge_id,
      title: api.title,
      description: api.description,
      reward: api.reward,
      redeemable: api.redeemable_type,
      icon: api.icon,
      status: api.status as LifeChallengeStatus,
      canRedeem: api.can_redeem,
      obtainedAt: api.obtained_at,
      redeemedAt: api.redeemed_at,
    };
  }
}

/**
 * Servicio para interactuar con la API de life challenges
 *
 * IMPORTANTE: El backend evalúa automáticamente si el usuario cumple cada reto.
 * El frontend solo debe consumir los estados (status, can_redeem) y permitir el canje.
 */
export class LifeChallengeService {
  /**
   * Obtiene los life challenges con su estado actual evaluado por el backend
   * Este es el método PRINCIPAL que debe usarse para obtener los retos
   *
   * @returns Lista de LifeChallenge con status y canRedeem evaluados por el servidor
   */
  static async getLifeChallengesWithStatus(): Promise<LifeChallenge[]> {
    try {
      const response = await apiClient.get<LifeChallengeWithStatusAPI[]>(
        '/life-challenges?withStatus=true'
      );
      console.log('Life challenges with status:', response.data);
      return response.data.map(lc => LifeChallengeMapper.fromAPIWithStatus(lc));
    } catch (error: any) {
      console.error('Error getting life challenges with status:', error);
      throw error;
    }
  }

  /**
   * Redime un desafío de vida para recuperar vidas
   * Solo funciona si canRedeem es true (evaluado por el backend)
   *
   * Errores posibles:
   * - INSUFFICIENT_LIFE_SLOTS: No hay suficientes casillas de vida disponibles (solo para retos 'once')
   * - ALREADY_REDEEMED: El reto ya fue canjeado
   * - REQUIREMENTS_NOT_MET: No cumple los requisitos del reto
   */
  static async redeemLifeChallenge(
    lifeChallengeId: string
  ): Promise<RedeemLifeChallengeResponse> {
    try {
      const response = await apiClient.post<RedeemLifeChallengeResponse>(
        `/life-challenges/${lifeChallengeId}/redeem`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error redeeming life challenge:', error);

      // Extraer información del error para mejor manejo en el UI
      const errorData = error.response?.data as RedeemLifeChallengeError | undefined;
      if (errorData) {
        const customError = new Error(errorData.message) as any;
        customError.code = errorData.code;
        customError.requiredSlots = errorData.requiredSlots;
        customError.availableSlots = errorData.availableSlots;
        throw customError;
      }

      throw error;
    }
  }

  /**
   * Obtiene el historial de cambios de vidas del usuario
   */
  static async getLifeHistory(): Promise<LifeHistoryAPI[]> {
    try {
      const response = await apiClient.get<LifeHistoryAPI[]>('/users/me/life-history');
      return response.data;
    } catch (error: any) {
      console.error('Error getting life history:', error);
      throw error;
    }
  }
}

