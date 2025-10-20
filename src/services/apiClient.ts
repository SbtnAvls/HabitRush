import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config';
import { SecureStorage } from './secureStorage';
import sessionEventEmitter, { SESSION_EVENTS } from './sessionEventEmitter';

/**
 * Cliente de Axios configurado para HabitRush con soporte de Refresh Tokens
 *
 * Características:
 * - Base URL configurable
 * - Timeout de 10 segundos
 * - Interceptor de request para agregar token automáticamente
 * - Interceptor de response para manejo de errores y auto-refresh
 * - Refresh automático de tokens cuando expiran
 * - Rotación de tokens en cada refresh
 * - Eliminación automática de token en caso de 401 no recuperable
 */

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para prevenir múltiples intentos de refresh
let isRefreshing = false;

// Cola de peticiones esperando el refresh
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Notificar a todas las peticiones en espera cuando el token se refresca
 */
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Agregar peticiones a la cola de espera
 */
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Refrescar el access token usando el refresh token
 */
const refreshAccessToken = async (): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> => {
  try {
    const refreshToken = await SecureStorage.getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    // Llamar directamente con axios para evitar interceptores
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: API_TIMEOUT
      }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

    // Guardar los nuevos tokens (rotación de tokens)
    await SecureStorage.setTokens(accessToken, newRefreshToken, expiresIn);

    // Emitir evento de sesión refrescada
    sessionEventEmitter.emit(SESSION_EVENTS.SESSION_REFRESHED);

    return response.data;
  } catch (error: any) {
    console.error('Error refreshing token:', error?.response?.data || error?.message);

    // Si el refresh token es inválido o expirado
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // Limpiar tokens y emitir evento de sesión expirada
      await SecureStorage.clearTokens();
      sessionEventEmitter.emit(SESSION_EVENTS.TOKEN_INVALID);
      sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
    }

    return null;
  }
};

// Interceptor de request: Agregar token de autorización
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Verificar si el token está expirado antes de usarlo
      const isExpired = await SecureStorage.isAccessTokenExpired();

      if (isExpired && !isRefreshing) {
        // Si el token está expirado y no estamos refrescando, refrescar primero
        isRefreshing = true;

        const newTokens = await refreshAccessToken();

        isRefreshing = false;

        if (!newTokens) {
          // No se pudo refrescar, la sesión expiró
          return config;
        }

        // Notificar a todas las peticiones en espera
        onTokenRefreshed(newTokens.accessToken);

        // Usar el nuevo token
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      } else if (isExpired && isRefreshing) {
        // Si ya estamos refrescando, esperar
        return new Promise((resolve) => {
          addRefreshSubscriber(async (token: string) => {
            if (!config.headers) {
              config.headers = {} as any;
            }
            config.headers.Authorization = `Bearer ${token}`;
            resolve(config);
          });
        });
      } else {
        // Token válido, usar el existente
        const accessToken = await SecureStorage.getAccessToken();
        const refreshToken = await SecureStorage.getRefreshToken();

        if (!accessToken) {
          // No hay token pero no está marcado como expirado
          // Esto puede indicar un problema de sincronización
          console.error('No access token found in secure storage');

          // Intentar refrescar si hay refresh token (ya obtuvimos refreshToken arriba)
          if (refreshToken && !isRefreshing) {
            isRefreshing = true;
            const newTokens = await refreshAccessToken();
            isRefreshing = false;

            if (newTokens) {
              if (!config.headers) {
                config.headers = {} as any;
              }
              config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              onTokenRefreshed(newTokens.accessToken);
            } else {
              // No se pudo refrescar, limpiar todo y rechazar petición
              await SecureStorage.clearTokens();
              sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
              return Promise.reject(new Error('No hay token de autenticación válido'));
            }
          } else if (refreshToken && isRefreshing) {
            // Ya estamos refrescando, esperar
            return new Promise((resolve, reject) => {
              addRefreshSubscriber(async (token: string) => {
                if (token) {
                  if (!config.headers) {
                    config.headers = {} as any;
                  }
                  config.headers.Authorization = `Bearer ${token}`;
                  resolve(config);
                } else {
                  reject(new Error('No se pudo obtener token de autenticación'));
                }
              });
            });
          } else {
            // No hay refresh token tampoco, sesión inválida - rechazar petición
            await SecureStorage.clearTokens();
            sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
            return Promise.reject(new Error('No hay token de autenticación'));
          }
        } else {
          // Token encontrado, agregarlo al header
          if (!config.headers) {
            config.headers = {} as any;
          }
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
      // Propagar el error si es de autenticación
      if (error instanceof Error && error.message.includes('token')) {
        return Promise.reject(error);
      }
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: Manejo de errores y auto-refresh
apiClient.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Si es un error 401 y no hemos reintentado
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Límite de reintentos
      if (originalRequest._retryCount > 2) {
        await SecureStorage.clearTokens();
        sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya estamos refrescando, agregar a la cola
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(async (token: string) => {
            if (!originalRequest.headers) {
              originalRequest.headers = {} as any;
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            try {
              const response = await apiClient(originalRequest);
              resolve(response);
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      isRefreshing = true;

      // Intentar refrescar el token
      const newTokens = await refreshAccessToken();

      isRefreshing = false;

      if (newTokens) {
        // Actualizar el header con el nuevo token
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any;
        }
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

        // Notificar a todas las peticiones en espera
        onTokenRefreshed(newTokens.accessToken);

        // Reintentar la petición original
        return apiClient(originalRequest);
      } else {
        // No se pudo refrescar, sesión expirada
        await SecureStorage.clearTokens();
        sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
      }
    }

    // Si el error es 403 (token blacklisted/revoked)
    if (error.response?.status === 403) {
      const errorMessage = (error.response?.data as any)?.message || '';
      if (errorMessage.includes('revoked') || errorMessage.includes('blacklisted')) {
        await SecureStorage.clearTokens();
        sessionEventEmitter.emit(SESSION_EVENTS.TOKEN_INVALID);
        sessionEventEmitter.emit(SESSION_EVENTS.SESSION_EXPIRED);
      }
    }

    // Si es un error 429 (rate limiting)
    // El componente debe manejar este error mostrando un mensaje al usuario

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

// Función helper para verificar si necesitamos migrar tokens
export const checkTokenMigration = async (): Promise<boolean> => {
  try {
    return await SecureStorage.migrateFromAsyncStorage();
  } catch (error) {
    console.error('Error checking token migration:', error);
    return false;
  }
};

export default apiClient;