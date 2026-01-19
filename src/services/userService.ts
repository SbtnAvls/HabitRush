import apiClient from './apiClient';

/**
 * Respuesta de la API para el usuario
 */
export interface UserAPI {
  id: string;
  name: string;
  email: string;
  lives: number;
  max_lives: number;
  xp: number;
  weekly_xp: number;
  league_tier: number;
  league_week_start: string;
  theme?: 'light' | 'dark';
  font_size?: 'small' | 'medium' | 'large';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Servicio para interactuar con la API de usuarios
 */
export class UserService {
  /**
   * Obtiene los datos completos del usuario autenticado
   * Incluye: lives, max_lives, xp, weekly_xp, league_tier, etc.
   */
  static async getMe(): Promise<UserAPI> {
    try {
      const response = await apiClient.get<any>('/users/me');
      const data = response.data;

      // Mapear username a name (el backend usa username, el frontend usa name)
      return {
        ...data,
        name: data.username || data.name,
      };
    } catch (error: any) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario (nombre, tema, tamaño de fuente)
   */
  static async updateProfile(data: {
    name?: string;
    theme?: 'light' | 'dark';
    font_size?: 'small' | 'medium' | 'large';
  }): Promise<UserAPI> {
    try {
      const response = await apiClient.put<UserAPI>('/users/me', data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Elimina la cuenta del usuario
   */
  static async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete('/users/me');
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
}
