import apiClient, { publicApiClient } from './apiClient';
import { Challenge } from '../types';

/**
 * Interfaz de desafío según la API del backend
 */
export interface ChallengeAPI {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'exercise' | 'learning' | 'mindfulness' | 'creative';
  estimated_time: number; // en minutos
  is_active: boolean;
  created_at: string;
  updated_at?: string; // Opcional
}

/**
 * Interfaz de desafío asignado al usuario
 * El backend devuelve los datos del desafío como campos planos, no como objeto anidado
 */
export interface UserChallengeAPI {
  id: string;
  user_id: string;
  challenge_id: string;
  habit_id: string;
  status: 'assigned' | 'completed' | 'discarded';
  assigned_at: string;
  completed_at?: string;
  // Campos del desafío (planos, no anidados)
  challenge_title: string;
  challenge_description: string;
  challenge_difficulty: 'easy' | 'medium' | 'hard';
  challenge_type: 'exercise' | 'learning' | 'mindfulness' | 'creative';
}

/**
 * DTO para asignar desafío
 */
export interface AssignChallengeDTO {
  habitId: string;
}

/**
 * DTO para actualizar estado de desafío
 */
export interface UpdateChallengeStatusDTO {
  status: 'completed' | 'discarded';
}

/**
 * Mapper: Convierte entre formatos de challenges
 */
export class ChallengeMapper {
  /**
   * Convierte ChallengeAPI del backend a Challenge local
   */
  static fromAPI(challengeAPI: ChallengeAPI): Challenge {
    return {
      id: challengeAPI.id,
      title: challengeAPI.title,
      description: challengeAPI.description,
      difficulty: challengeAPI.difficulty,
      type: challengeAPI.type,
      estimatedTime: challengeAPI.estimated_time,
      isCompleted: false, // Se actualiza con UserChallenge
    };
  }

  /**
   * Convierte UserChallengeAPI a Challenge con estado
   */
  static fromUserChallengeAPI(userChallengeAPI: UserChallengeAPI): Challenge & { habitId: string; userChallengeId: string } {
    // El backend devuelve los campos del desafío como campos planos
    return {
      id: userChallengeAPI.challenge_id,
      title: userChallengeAPI.challenge_title,
      description: userChallengeAPI.challenge_description,
      difficulty: userChallengeAPI.challenge_difficulty,
      type: userChallengeAPI.challenge_type,
      estimatedTime: 0, // No viene en la respuesta de user challenges
      isCompleted: userChallengeAPI.status === 'completed',
      habitId: userChallengeAPI.habit_id,
      userChallengeId: userChallengeAPI.id,
    };
  }
}

/**
 * Servicio para interactuar con la API de challenges
 */
export class ChallengeService {
  /**
   * Obtiene la lista de desafíos activos disponibles
   */
  static async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const response = await apiClient.get<ChallengeAPI[]>('/challenges');
      console.log('Active challenges:', response.data);
      return response.data.map(ChallengeMapper.fromAPI);
    } catch (error: any) {
      console.error('Error getting active challenges:', error);
      throw error;
    }
  }

  /**
   * Obtiene los desafíos asignados al usuario
   */
  static async getUserChallenges(): Promise<UserChallengeAPI[]> {
    try {
      const response = await apiClient.get<UserChallengeAPI[]>('/users/me/challenges');
      return response.data;
    } catch (error: any) {
      console.error('Error getting user challenges:', error);
      throw error;
    }
  }

  /**
   * Asigna un desafío a un hábito
   */
  static async assignChallenge(
    challengeId: string,
    habitId: string
  ): Promise<UserChallengeAPI> {
    try {
      const dto: AssignChallengeDTO = { habitId };
      
      const response = await apiClient.post<UserChallengeAPI>(
        `/challenges/${challengeId}/assign`,
        dto
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error assigning challenge:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un desafío del usuario
   */
  static async updateChallengeStatus(
    userChallengeId: string,
    status: 'completed' | 'discarded'
  ): Promise<UserChallengeAPI> {
    try {
      const dto: UpdateChallengeStatusDTO = { status };
      
      const response = await apiClient.put<UserChallengeAPI>(
        `/users/me/challenges/${userChallengeId}`,
        dto
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating challenge status:', error);
      throw error;
    }
  }

  /**
   * Completa un desafío (marca como completado)
   */
  static async completeChallenge(userChallengeId: string): Promise<UserChallengeAPI> {
    return this.updateChallengeStatus(userChallengeId, 'completed');
  }

  /**
   * Descarta un desafío
   */
  static async discardChallenge(userChallengeId: string): Promise<UserChallengeAPI> {
    return this.updateChallengeStatus(userChallengeId, 'discarded');
  }
}

