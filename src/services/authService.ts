import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { publicApiClient } from './apiClient';

const TOKEN_KEY = 'habitRush_auth_token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  theme?: 'light' | 'dark';
  font_size?: 'small' | 'medium' | 'large';
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface UpdateUserData {
  name?: string;
  theme?: 'light' | 'dark';
  font_size?: 'small' | 'medium' | 'large';
}

export class AuthService {
  // Guardar token
  static async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  // Obtener token
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Eliminar token
  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  }

  // Registrar usuario
  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await publicApiClient.post<AuthResponse>('/auth/register', credentials);
      const data = response.data;

      // Guardar token automáticamente
      await this.saveToken(data.token);

      return data;
    } catch (error: any) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  // Iniciar sesión
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await publicApiClient.post<AuthResponse>('/auth/login', credentials);
      const data = response.data;

      // Guardar token automáticamente
      await this.saveToken(data.token);

      return data;
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Obtener usuario autenticado
  static async getMe(): Promise<AuthUser> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await apiClient.get<AuthUser>('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Cerrar sesión
  static async logout(): Promise<void> {
    try {
      const token = await this.getToken();
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Siempre eliminar el token local
      await this.removeToken();
    }
  }

  // Actualizar perfil de usuario
  static async updateProfile(data: UpdateUserData): Promise<AuthUser> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await apiClient.put<AuthUser>('/users/me', data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Eliminar cuenta
  static async deleteAccount(): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      await apiClient.delete('/users/me');

      // Eliminar token local
      await this.removeToken();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Verificar si hay sesión activa
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      // Intentar obtener información del usuario para validar el token
      await this.getMe();
      return true;
    } catch (error) {
      return false;
    }
  }
}
