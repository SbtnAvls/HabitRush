import { Platform } from 'react-native';
import apiClient, { publicApiClient, checkTokenMigration } from './apiClient';
import { SecureStorage } from './secureStorage';
import sessionEventEmitter, { SESSION_EVENTS } from './sessionEventEmitter';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '../config/google';

/**
 * Servicio de Autenticación con soporte de Refresh Tokens
 *
 * Maneja:
 * - Login/Register con nueva estructura de tokens
 * - Almacenamiento seguro de tokens
 * - Logout con blacklist de tokens
 * - Verificación de autenticación
 * - Migración desde AsyncStorage
 */

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
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UpdateUserData {
  name?: string;
  theme?: 'light' | 'dark';
  font_size?: 'small' | 'medium' | 'large';
}

export class AuthService {
  /**
   * Registrar un nuevo usuario
   */
  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await publicApiClient.post<AuthResponse>('/auth/register', credentials);
      const data = response.data;

      // Guardar tokens de forma segura
      await SecureStorage.setTokens(data.accessToken, data.refreshToken, data.expiresIn);

      // Emitir evento de login exitoso
      sessionEventEmitter.emit(SESSION_EVENTS.LOGIN_SUCCESS);

      return data;
    } catch (error: any) {
      // Manejar rate limiting
      if (error.status === 429) {
        throw new Error('Demasiados intentos. Por favor espera 15 minutos antes de intentar de nuevo.');
      }

      console.error('Error registering:', error);
      throw error;
    }
  }

  /**
   * Iniciar sesión
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await publicApiClient.post<AuthResponse>('/auth/login', credentials);
      const data = response.data;

      // Guardar tokens de forma segura
      await SecureStorage.setTokens(data.accessToken, data.refreshToken, data.expiresIn);

      // Emitir evento de login exitoso
      sessionEventEmitter.emit(SESSION_EVENTS.LOGIN_SUCCESS);

      return data;
    } catch (error: any) {
      // Manejar rate limiting
      if (error.status === 429) {
        throw new Error('Demasiados intentos de login. Por favor espera 15 minutos.');
      }

      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario autenticado
   * Usa el apiClient que automáticamente maneja el refresh token
   */
  static async getMe(): Promise<AuthUser> {
    try {
      const hasTokens = await SecureStorage.hasTokens();
      if (!hasTokens) {
        throw new Error('No hay token de autenticación');
      }

      const response = await apiClient.get<AuthUser>('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   * Envía el refresh token para blacklist en el servidor
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = await SecureStorage.getRefreshToken();

      if (refreshToken) {
        // Intentar notificar al servidor para blacklist de tokens
        try {
          await apiClient.post('/auth/logout', { refreshToken });
        } catch (error) {
          console.error('Error during server logout:', error);
          // Continuar con limpieza local aunque falle el servidor
        }
      }

      // También cerrar sesión de Google si estaba logueado con Google
      await this.signOutGoogle();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Siempre limpiar tokens locales
      await SecureStorage.clearTokens();

      // Emitir evento de logout
      sessionEventEmitter.emit(SESSION_EVENTS.LOGOUT);
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateProfile(data: UpdateUserData): Promise<AuthUser> {
    try {
      const hasTokens = await SecureStorage.hasTokens();
      if (!hasTokens) {
        throw new Error('No hay token de autenticación');
      }

      const response = await apiClient.put<AuthUser>('/users/me', data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Eliminar cuenta
   */
  static async deleteAccount(): Promise<void> {
    try {
      const hasTokens = await SecureStorage.hasTokens();
      if (!hasTokens) {
        throw new Error('No hay token de autenticación');
      }

      await apiClient.delete('/users/me');

      // Limpiar tokens locales
      await SecureStorage.clearTokens();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay sesión activa
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const hasTokens = await SecureStorage.hasTokens();
      if (!hasTokens) {
        return false;
      }

      // Verificar si el token está expirado
      const isExpired = await SecureStorage.isAccessTokenExpired();
      if (isExpired) {
        // El apiClient manejará el refresh automáticamente
        // Intentar hacer una llamada para verificar
        try {
          await this.getMe();
          return true;
        } catch {
          return false;
        }
      }

      // Token válido
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Obtener información de los tokens (para debugging)
   */
  static async getTokenInfo(): Promise<{
    hasTokens: boolean;
    isExpired: boolean;
    expiresIn?: number;
  }> {
    try {
      const hasTokens = await SecureStorage.hasTokens();
      if (!hasTokens) {
        return { hasTokens: false, isExpired: true };
      }

      const tokenData = await SecureStorage.getTokenData();
      const isExpired = await SecureStorage.isAccessTokenExpired();

      return {
        hasTokens: true,
        isExpired,
        expiresIn: tokenData?.expiresIn,
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return { hasTokens: false, isExpired: true };
    }
  }

  /**
   * Verificar y migrar tokens desde AsyncStorage si es necesario
   */
  static async checkAndMigrateTokens(): Promise<boolean> {
    try {
      const needsMigration = await checkTokenMigration();

      if (needsMigration) {
        console.log('Token migration needed - user needs to re-login');
        // El usuario necesitará hacer login de nuevo
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking token migration:', error);
      return false;
    }
  }

  /**
   * Refrescar token manualmente (normalmente es automático)
   * Útil para testing o casos especiales
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStorage.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await publicApiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken
      });

      const data = response.data;

      // Guardar los nuevos tokens (rotación)
      await SecureStorage.setTokens(data.accessToken, data.refreshToken, data.expiresIn);

      // Emitir evento de sesión refrescada
      sessionEventEmitter.emit(SESSION_EVENTS.SESSION_REFRESHED);

      return true;
    } catch (error: any) {
      console.error('Error refreshing token:', error);

      if (error.status === 401 || error.status === 403) {
        // Token inválido, limpiar
        await SecureStorage.clearTokens();
        sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
      }

      // Rate limiting en refresh (10 intentos por 15 minutos)
      if (error.status === 429) {
        sessionEventEmitter.emit(SESSION_EVENTS.RATE_LIMITED, {
          endpoint: '/auth/refresh',
          retryAfter: 15 * 60
        });
      }

      return false;
    }
  }

  /**
   * Limpiar todos los datos de autenticación (emergencia)
   */
  static async clearAllAuthData(): Promise<void> {
    try {
      await SecureStorage.clearTokens();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Configurar Google Sign-In
   * Debe llamarse una vez al iniciar la app
   */
  static configureGoogleSignIn(): void {
    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.webClientId,
      iosClientId: Platform.OS === 'ios' ? GOOGLE_CONFIG.iosClientId : undefined,
      offlineAccess: false,
    });
  }

  /**
   * Iniciar sesión con Google
   */
  static async loginWithGoogle(): Promise<AuthResponse> {
    try {
      // Verificar que Google Play Services esté disponible (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Realizar el sign-in con Google
      const signInResult = await GoogleSignin.signIn();

      // Obtener el ID token
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No se pudo obtener el token de Google');
      }

      // Enviar el token al backend para autenticación
      const response = await publicApiClient.post<AuthResponse>('/auth/google', {
        idToken,
      });

      const data = response.data;

      // Guardar tokens de forma segura
      await SecureStorage.setTokens(data.accessToken, data.refreshToken, data.expiresIn);

      // Emitir evento de login exitoso
      sessionEventEmitter.emit(SESSION_EVENTS.LOGIN_SUCCESS);

      return data;
    } catch (error: any) {
      // Manejar errores específicos de Google Sign-In
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Inicio de sesión cancelado');
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Ya hay un inicio de sesión en progreso');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services no está disponible');
      }

      // Manejar errores del backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // Manejar rate limiting
      if (error.status === 429) {
        throw new Error('Demasiados intentos. Por favor espera 15 minutos.');
      }

      console.error('Error en Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión de Google (además del logout normal)
   */
  static async signOutGoogle(): Promise<void> {
    try {
      const isSignedIn = await GoogleSignin.getCurrentUser();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }
}