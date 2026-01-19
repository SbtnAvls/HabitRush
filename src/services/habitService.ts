import apiClient from './apiClient';
import { Habit, Frequency, ProgressType } from '../types';

/**
 * Interfaz del hábito según la API del backend
 */
export interface HabitAPI {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  progress_type: 'yes_no' | 'time' | 'count';
  target_value?: number; // Minutos para time, cantidad para count, null/undefined para yes_no
  frequency_days_of_week?: string; // CSV: "0,1,2,3,4,5,6"
  target_date?: string; // ISO date string
  current_streak: number;
  is_active: boolean;
  active_by_user: boolean;
  is_blocked: boolean; // Bloqueado por fallo pendiente de resolver
  last_completed_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
  start_date: string;
  deleted_at?: string;
}

/**
 * DTO para crear un hábito en el backend
 */
export interface CreateHabitDTO {
  name: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  progress_type: 'yes_no' | 'time' | 'count';
  target_value?: number; // Requerido para time y count, no enviar para yes_no
  frequency_days_of_week?: string; // CSV: "0,1,2,3,4,5,6"
  target_date?: string; // ISO date string
  active_by_user: boolean;
}

/**
 * DTO para actualizar un hábito en el backend
 */
export interface UpdateHabitDTO {
  name?: string;
  description?: string;
  frequency_type?: 'daily' | 'weekly' | 'custom';
  progress_type?: 'yes_no' | 'time' | 'count';
  target_value?: number; // Requerido para time y count si se cambia progress_type
  frequency_days_of_week?: string; // CSV: "0,1,2,3,4,5,6"
  target_date?: string;
  active_by_user?: boolean;
  is_active?: boolean;
  current_streak?: number;
}

/**
 * Mapper: Convierte Habit del frontend a formato API
 */
export class HabitMapper {
  /**
   * Convierte un Habit local a CreateHabitDTO para el backend
   */
  static toCreateDTO(habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'isActive' | 'isBlocked' | 'lastCompletedDate'>): CreateHabitDTO {
    const dto: CreateHabitDTO = {
      name: habit.name,
      description: habit.description,
      frequency_type: habit.frequency.type,
      progress_type: habit.progressType,
      // Convertir array de días a CSV string para el backend
      frequency_days_of_week: habit.frequency.daysOfWeek?.join(','),
      target_date: habit.targetDate ? habit.targetDate.toISOString() : undefined,
      active_by_user: habit.activeByUser,
    };

    // Solo incluir target_value para hábitos de tipo time o count
    if ((habit.progressType === 'time' || habit.progressType === 'count') && habit.targetValue !== undefined) {
      dto.target_value = habit.targetValue;
    }

    return dto;
  }

  /**
   * Convierte un HabitAPI del backend a Habit local
   */
  static fromAPI(habitAPI: HabitAPI): Habit {
    // Parsear días de la semana desde CSV
    let daysOfWeek: number[] | undefined;
    if (habitAPI.frequency_days_of_week) {
      daysOfWeek = habitAPI.frequency_days_of_week
        .split(',')
        .map(d => parseInt(d.trim(), 10))
        .filter(d => !isNaN(d));
    }

    const frequency: Frequency = {
      type: habitAPI.frequency_type,
      daysOfWeek: daysOfWeek,
    };

    return {
      id: habitAPI.id,
      name: habitAPI.name,
      description: habitAPI.description,
      startDate: new Date(habitAPI.start_date),
      targetDate: habitAPI.target_date ? new Date(habitAPI.target_date) : undefined,
      currentStreak: habitAPI.current_streak,
      frequency: frequency,
      progressType: habitAPI.progress_type as ProgressType,
      targetValue: habitAPI.target_value,
      isActive: habitAPI.is_active,
      activeByUser: habitAPI.active_by_user,
      isBlocked: habitAPI.is_blocked ?? false,
      lastCompletedDate: habitAPI.last_completed_date ? new Date(habitAPI.last_completed_date) : undefined,
      createdAt: new Date(habitAPI.created_at),
    };
  }

  /**
   * Convierte cambios locales a UpdateHabitDTO
   */
  static toUpdateDTO(changes: Partial<Habit>): UpdateHabitDTO {
    const dto: UpdateHabitDTO = {};

    if (changes.name !== undefined) dto.name = changes.name;
    if (changes.description !== undefined) dto.description = changes.description;
    if (changes.frequency !== undefined) {
      dto.frequency_type = changes.frequency.type;
      dto.frequency_days_of_week = changes.frequency.daysOfWeek?.join(',');
    }
    if (changes.progressType !== undefined) dto.progress_type = changes.progressType;
    if (changes.targetValue !== undefined) dto.target_value = changes.targetValue;
    if (changes.targetDate !== undefined) {
      dto.target_date = changes.targetDate ? changes.targetDate.toISOString() : undefined;
    }
    if (changes.activeByUser !== undefined) dto.active_by_user = changes.activeByUser;
    if (changes.isActive !== undefined) dto.is_active = changes.isActive;
    if (changes.currentStreak !== undefined) dto.current_streak = changes.currentStreak;

    return dto;
  }
}

/**
 * Servicio para interactuar con la API de hábitos
 */
export class HabitService {
  /**
   * Obtiene todos los hábitos del usuario autenticado
   */
  static async getAllHabits(): Promise<Habit[]> {
    try {
      const response = await apiClient.get<HabitAPI[]>('/habits');
      return response.data.map(HabitMapper.fromAPI);
    } catch (error: any) {
      console.error('Error getting habits:', error);
      throw error;
    }
  }

  /**
   * Obtiene un hábito específico por ID
   */
  static async getHabitById(id: string): Promise<Habit> {
    try {
      const response = await apiClient.get<HabitAPI>(`/habits/${id}`);
      return HabitMapper.fromAPI(response.data);
    } catch (error: any) {
      console.error('Error getting habit:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo hábito en el backend
   */
  static async createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'isActive' | 'isBlocked' | 'lastCompletedDate'>): Promise<Habit> {
    try {
      const dto = HabitMapper.toCreateDTO(habit);
      const response = await apiClient.post<HabitAPI>('/habits', dto);
      return HabitMapper.fromAPI(response.data);
    } catch (error: any) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  /**
   * Actualiza un hábito existente
   */
  static async updateHabit(id: string, changes: Partial<Habit>): Promise<void> {
    try {
      const dto = HabitMapper.toUpdateDTO(changes);
      await apiClient.put(`/habits/${id}`, dto);
    } catch (error: any) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }

  /**
   * Elimina un hábito (eliminación lógica en el backend)
   */
  static async deleteHabit(id: string): Promise<void> {
    try {
      await apiClient.delete(`/habits/${id}`);
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  /**
   * Sincroniza hábitos: sube los locales y descarga los del servidor
   * Útil para la primera sincronización o reconciliación de datos
   */
  static async syncHabits(localHabits: Habit[]): Promise<Habit[]> {
    try {
      // Obtener hábitos del servidor
      const serverHabits = await this.getAllHabits();
      
      // Aquí podrías implementar lógica de merge si es necesario
      // Por ahora, priorizamos los hábitos del servidor
      
      return serverHabits;
    } catch (error: any) {
      console.error('Error syncing habits:', error);
      throw error;
    }
  }
}

