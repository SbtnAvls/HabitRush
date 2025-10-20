/**
 * Servicio de almacenamiento seguro para tokens
 * Usa react-native-keychain para almacenamiento encriptado
 *
 * IMPORTANTE: No usar AsyncStorage para tokens, ya que no es seguro
 */

import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_SERVICE = 'habitrush_access_token';
const REFRESH_TOKEN_SERVICE = 'habitrush_refresh_token';
const TOKEN_EXPIRY_SERVICE = 'habitrush_token_expiry';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  savedAt?: number;
}

export class SecureStorage {
  /**
   * Guardar ambos tokens de forma segura
   */
  static async setTokens(accessToken: string, refreshToken: string, expiresIn?: number): Promise<void> {
    try {
      // Guardar access token
      await Keychain.setInternetCredentials(
        ACCESS_TOKEN_SERVICE,
        'token',
        accessToken
      );

      // Guardar refresh token
      await Keychain.setInternetCredentials(
        REFRESH_TOKEN_SERVICE,
        'token',
        refreshToken
      );

      // Guardar tiempo de expiración si se proporciona
      if (expiresIn !== undefined) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        await Keychain.setInternetCredentials(
          TOKEN_EXPIRY_SERVICE,
          'expiry',
          expiryTime.toString()
        );
      }
    } catch (error) {
      console.error('Error saving tokens to secure storage:', error);
      throw error;
    }
  }

  /**
   * Obtener access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(ACCESS_TOKEN_SERVICE);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Obtener refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(REFRESH_TOKEN_SERVICE);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Obtener tiempo de expiración del access token
   */
  static async getTokenExpiry(): Promise<number | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(TOKEN_EXPIRY_SERVICE);
      return credentials ? parseInt(credentials.password) : null;
    } catch (error) {
      console.error('Error getting token expiry:', error);
      return null;
    }
  }

  /**
   * Verificar si el access token está expirado
   */
  static async isAccessTokenExpired(): Promise<boolean> {
    try {
      const expiry = await this.getTokenExpiry();
      if (!expiry) return true;

      // Agregar un buffer de 30 segundos para refrescar antes de que expire
      return Date.now() >= (expiry - 30000);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Limpiar todos los tokens
   */
  static async clearTokens(): Promise<void> {
    const services = [ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE, TOKEN_EXPIRY_SERVICE];

    for (const service of services) {
      try {
        // Intentar borrar sin opciones (método estándar)
        await Keychain.resetInternetCredentials(service);
      } catch (error) {
        // Si falla, intentar usando resetGenericPassword con service
        try {
          await Keychain.resetGenericPassword({ service });
        } catch (err) {
          console.warn(`Could not clear ${service}:`, err);
          // Continuar con el siguiente
        }
      }
    }
  }

  /**
   * Obtener todos los tokens y metadata
   */
  static async getTokenData(): Promise<TokenData | null> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      const expiry = await this.getTokenExpiry();

      if (!accessToken || !refreshToken) {
        return null;
      }

      const now = Date.now();
      const expiresIn = expiry ? Math.max(0, Math.floor((expiry - now) / 1000)) : 0;

      return {
        accessToken,
        refreshToken,
        expiresIn,
        savedAt: expiry ? expiry - (expiresIn * 1000) : now
      };
    } catch (error) {
      console.error('Error getting token data:', error);
      return null;
    }
  }

  /**
   * Verificar si hay tokens guardados
   */
  static async hasTokens(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Error checking tokens:', error);
      return false;
    }
  }

  /**
   * Migrar tokens desde AsyncStorage (para actualización)
   * Esto es temporal para migrar usuarios existentes
   */
  static async migrateFromAsyncStorage(): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      // Buscar token antiguo
      const oldToken = await AsyncStorage.getItem('habitRush_auth_token');

      if (oldToken) {
        // Por ahora, solo podemos migrar como access token
        // El usuario necesitará hacer login de nuevo para obtener refresh token
        console.log('Found old token, migration needed - user needs to re-login');

        // Eliminar token antiguo
        await AsyncStorage.removeItem('habitRush_auth_token');

        return true; // Indica que se necesita re-login
      }

      return false;
    } catch (error) {
      console.error('Error during token migration:', error);
      return false;
    }
  }
}

export default SecureStorage;