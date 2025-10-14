/**
 * Configuración de la API
 * 
 * IMPORTANTE: Antes de usar la aplicación, debes cambiar la URL base de la API
 * por la URL de tu servidor backend.
 */

// Cambia esta URL por la URL de tu servidor backend
export const API_BASE_URL = 'http://172.19.32.1:3000';

// Ejemplo de URLs para diferentes entornos:
// export const API_BASE_URL = 'https://api.habitrush.com'; // Producción
// export const API_BASE_URL = 'http://localhost:3000'; // Desarrollo local
// export const API_BASE_URL = 'http://192.168.1.100:3000'; // Desarrollo en red local (para testing en dispositivos físicos)

/**
 * Endpoints de la API
 */
export const API_ENDPOINTS = {
  // Autenticación
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // Usuarios
  USER_ME: '/users/me',
  UPDATE_USER: '/users/me',
  DELETE_USER: '/users/me',
};

/**
 * Configuración de timeouts
 */
export const API_TIMEOUT = 10000; // 10 segundos

/**
 * Headers por defecto
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

