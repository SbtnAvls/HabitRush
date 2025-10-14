import apiClient, { publicApiClient } from './apiClient';
import { LifeChallenge } from '../types';

/**
 * Interfaz de desafío de vida según la API del backend
 */
export interface LifeChallengeAPI {
  id: string;
  title: string;
  description: string;
  reward: number; // Número de vidas que otorga
  redeemable_type: 'once' | 'unlimited';
  icon: string; // Nombre del icono (ej: "leaf", "star")
  verification_function: string;
  is_active: boolean;
}

/**
 * Interfaz de historial de vida del usuario
 */
export interface LifeHistoryAPI {
  id: string;
  user_id: string;
  lives_change: number; // +/- número de vidas
  current_lives: number; // Vidas actuales después del cambio
  reason: 'habit_missed' | 'challenge_completed' | 'life_challenge_redeemed';
  related_habit_id: string | null;
  related_user_challenge_id: string | null;
  related_life_challenge_id: string | null;
  created_at: string;
}

/**
 * Respuesta al redimir un desafío de vida
 */
export interface RedeemLifeChallengeResponse {
  message: string;
  livesGained: number;
  currentLives: number;
}

/**
 * Mapper: Convierte entre formatos de life challenges
 */
export class LifeChallengeMapper {
  /**
   * Convierte LifeChallengeAPI del backend a LifeChallenge local
   */
  static fromAPI(lifeChallengeAPI: LifeChallengeAPI, completedCount: number = 0): LifeChallenge {
    return {
      id: lifeChallengeAPI.id,
      title: lifeChallengeAPI.title,
      description: lifeChallengeAPI.description,
      reward: lifeChallengeAPI.reward,
      redeemable: lifeChallengeAPI.redeemable_type,
      completedCount: completedCount,
      icon: lifeChallengeAPI.icon,
      verificationFunction: lifeChallengeAPI.verification_function,
    };
  }
}

/**
 * Servicio para interactuar con la API de life challenges
 */
export class LifeChallengeService {
  /**
   * Obtiene la lista de desafíos de vida activos (pública, no requiere auth)
   */
  static async getActiveLifeChallenges(): Promise<LifeChallenge[]> {
    try {
      const response = await publicApiClient.get<LifeChallengeAPI[]>('/life-challenges');
      console.log('Active life challenges:', response.data);
      return response.data.map(lc => LifeChallengeMapper.fromAPI(lc, 0));
    } catch (error: any) {
      console.error('Error getting active life challenges:', error);
      throw error;
    }
  }

  /**
   * Redime un desafío de vida para recuperar vidas
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

  /**
   * Obtiene los desafíos de vida con el contador de completaciones del usuario
   * Combina la lista pública con el historial del usuario
   */
  static async getLifeChallengesWithProgress(): Promise<LifeChallenge[]> {
    try {
      // Obtener lista pública de desafíos
      const challenges = await this.getActiveLifeChallenges();
      
      // Obtener historial del usuario
      const history = await this.getLifeHistory();
      
      // Contar cuántas veces se redimió cada desafío
      const completionCounts: Record<string, number> = {};
      history.forEach(entry => {
        if (entry.related_life_challenge_id && entry.lives_change > 0) {
          completionCounts[entry.related_life_challenge_id] = 
            (completionCounts[entry.related_life_challenge_id] || 0) + 1;
        }
      });
      
      // Actualizar completedCount de cada desafío
      return challenges.map(challenge => ({
        ...challenge,
        completedCount: completionCounts[challenge.id] || 0,
      }));
    } catch (error: any) {
      console.error('Error getting life challenges with progress:', error);
      // Si falla obtener el historial (ej: no autenticado), devolver solo la lista pública
      return this.getActiveLifeChallenges();
    }
  }
}

