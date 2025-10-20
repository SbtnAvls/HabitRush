import apiClient from './apiClient';
import { HabitCompletion, ProgressData, ProgressType } from '../types';

/**
 * Interfaz de completación según la API del backend
 */
export interface HabitCompletionAPI {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // ISO date string
  completed: boolean;
  progress_type: 'yes_no' | 'time' | 'count';
  progress_value?: number;
  target_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Life Challenge obtenido al completar un hábito
 */
export interface NewLifeChallengeObtained {
  life_challenge_id: string;
  title: string;
  description: string;
  reward: number;
  status: 'obtained';
  can_redeem: boolean;
}

/**
 * Respuesta de creación de completación con posibles Life Challenges
 */
export interface CreateCompletionResponse extends HabitCompletionAPI {
  new_life_challenges_obtained?: NewLifeChallengeObtained[];
}

/**
 * Interfaz de imagen de completación según la API
 */
export interface CompletionImageAPI {
  id: string;
  completion_id: string;
  image_url: string;
  thumbnail_url?: string;
  uploaded_at: string;
}

/**
 * DTO para crear/actualizar completación
 */
export interface CreateCompletionDTO {
  date: string; // ISO date string "YYYY-MM-DD"
  completed: boolean;
  progress_type: 'yes_no' | 'time' | 'count';
  progress_value?: number;
  target_value?: number;
  notes?: string;
}

/**
 * DTO para actualizar notas
 */
export interface UpdateCompletionNotesDTO {
  notes: string;
}

/**
 * DTO para añadir imagen
 */
export interface AddImageDTO {
  imageUrl: string;
  thumbnailUrl?: string;
}

/**
 * Mapper: Convierte entre formatos de completions
 */
export class CompletionMapper {
  /**
   * Convierte HabitCompletion local a CreateCompletionDTO para el backend
   */
  static toCreateDTO(completion: HabitCompletion): CreateCompletionDTO {
    const dto: CreateCompletionDTO = {
      date: completion.date.toISOString().split('T')[0], // YYYY-MM-DD
      completed: completion.completed,
      progress_type: completion.progressData?.type || 'yes_no',
    };

    if (completion.progressData) {
      dto.progress_value = completion.progressData.value;
      dto.target_value = completion.progressData.targetValue;
    }

    if (completion.notes) {
      dto.notes = completion.notes;
    }

    return dto;
  }

  /**
   * Convierte HabitCompletionAPI del backend a HabitCompletion local
   */
  static fromAPI(completionAPI: HabitCompletionAPI, images?: string[]): HabitCompletion {
    const progressData: ProgressData = {
      type: completionAPI.progress_type as ProgressType,
      value: completionAPI.progress_value,
      targetValue: completionAPI.target_value,
    };

    return {
      habitId: completionAPI.habit_id,
      date: new Date(completionAPI.date),
      completed: completionAPI.completed,
      progressData: progressData,
      notes: completionAPI.notes,
      images: images,
    };
  }
}

/**
 * Servicio para interactuar con la API de completions
 */
export class CompletionService {
  /**
   * Obtiene todas las completaciones de un hábito
   */
  static async getHabitCompletions(habitId: string): Promise<HabitCompletion[]> {
    try {
      const response = await apiClient.get<HabitCompletionAPI[]>(
        `/habits/${habitId}/completions`
      );
      
      // Convertir todas las completaciones del backend al formato local
      return response.data.map(c => CompletionMapper.fromAPI(c));
    } catch (error: any) {
      console.error('Error getting habit completions:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza una completación de hábito
   * IMPORTANTE: La respuesta puede incluir new_life_challenges_obtained si se obtuvieron Life Challenges
   */
  static async createOrUpdateCompletion(
    habitId: string,
    completion: HabitCompletion
  ): Promise<CreateCompletionResponse> {
    try {
      const dto = CompletionMapper.toCreateDTO(completion);

      const response = await apiClient.post<CreateCompletionResponse>(
        `/habits/${habitId}/completions`,
        dto
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating/updating completion:', error);
      throw error;
    }
  }

  /**
   * Actualiza las notas de una completación
   */
  static async updateCompletionNotes(
    completionId: string,
    notes: string
  ): Promise<HabitCompletionAPI> {
    try {
      const dto: UpdateCompletionNotesDTO = { notes };
      
      const response = await apiClient.put<HabitCompletionAPI>(
        `/completions/${completionId}`,
        dto
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating completion notes:', error);
      throw error;
    }
  }

  /**
   * Elimina una completación
   */
  static async deleteCompletion(completionId: string): Promise<void> {
    try {
      await apiClient.delete(`/completions/${completionId}`);
    } catch (error: any) {
      console.error('Error deleting completion:', error);
      throw error;
    }
  }

  /**
   * Añade una imagen a una completación
   */
  static async addImage(
    completionId: string,
    imageUrl: string,
    thumbnailUrl?: string
  ): Promise<CompletionImageAPI> {
    try {
      const dto: AddImageDTO = {
        imageUrl,
        thumbnailUrl,
      };
      
      const response = await apiClient.post<CompletionImageAPI>(
        `/completions/${completionId}/images`,
        dto
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error adding image to completion:', error);
      throw error;
    }
  }

  /**
   * Elimina una imagen
   */
  static async deleteImage(imageId: string): Promise<void> {
    try {
      await apiClient.delete(`/images/${imageId}`);
    } catch (error: any) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las completaciones del usuario (de todos los hábitos)
   */
  static async getAllCompletions(habitIds: string[]): Promise<HabitCompletion[]> {
    try {
      // Obtener completaciones de cada hábito
      const promises = habitIds.map(habitId => 
        this.getHabitCompletions(habitId)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Combinar todas las completaciones exitosas
      const allCompletions: HabitCompletion[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allCompletions.push(...result.value);
        }
      });
      
      return allCompletions;
    } catch (error: any) {
      console.error('Error getting all completions:', error);
      throw error;
    }
  }

  /**
   * Sincroniza completaciones: útil para carga inicial
   */
  static async syncCompletions(habitIds: string[]): Promise<HabitCompletion[]> {
    try {
      return await this.getAllCompletions(habitIds);
    } catch (error: any) {
      console.error('Error syncing completions:', error);
      return [];
    }
  }
}

