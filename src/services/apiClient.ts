import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'habitRush_auth_token';

/**
 * Cliente de Axios configurado para HabitRush
 * 
 * Características:
 * - Base URL configurable
 * - Timeout de 10 segundos
 * - Interceptor de request para agregar token automáticamente
 * - Interceptor de response para manejo de errores
 * - Eliminación automática de token en caso de 401
 */

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: Agregar token de autorización
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: Manejo de errores
apiClient.interceptors.response.use(
  (response: any) => {
    // Devolver solo los datos de la respuesta
    return response;
  },
  async (error: AxiosError) => {
    // Si es un error 401 (no autenticado), eliminar el token
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        console.error('Error removing token:', e);
      }
    }

    // Extraer mensaje de error del servidor
    let errorMessage = 'Error en la petición';
    
    if (error.response?.data) {
      const data = error.response.data as any;
      errorMessage = data.error || data.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Crear un error más descriptivo
    const customError = new Error(errorMessage);
    (customError as any).status = error.response?.status;
    (customError as any).originalError = error;

    return Promise.reject(customError);
  }
);

/**
 * Cliente de Axios sin interceptor de autenticación
 * Útil para endpoints públicos como login y registro
 */
export const publicApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de response para el cliente público (solo manejo de errores)
publicApiClient.interceptors.response.use(
  (response: any) => response,
  (error: AxiosError) => {
    let errorMessage = 'Error en la petición';
    
    if (error.response?.data) {
      const data = error.response.data as any;
      errorMessage = data.error || data.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    const customError = new Error(errorMessage);
    (customError as any).status = error.response?.status;
    (customError as any).originalError = error;

    return Promise.reject(customError);
  }
);

export default apiClient;

