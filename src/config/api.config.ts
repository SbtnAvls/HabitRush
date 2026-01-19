/**
 * Configuración de la API
 *
 * La URL se selecciona automáticamente:
 * - __DEV__ true (Metro): localhost:3000 (requiere: adb reverse tcp:3000 tcp:3000)
 * - __DEV__ false (APK): IP de la red local
 */

// URL para APK (dispositivo físico en red local)
const PRODUCTION_URL = 'http://192.168.0.100:3000';

// URL para desarrollo con Metro (emulador con adb reverse)
const DEV_URL = 'http://localhost:3000';

export const API_BASE_URL = __DEV__ ? DEV_URL : PRODUCTION_URL;

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

  // Social
  SOCIAL_SEARCH: '/social/search',
  SOCIAL_FOLLOW: '/social/follow',
  SOCIAL_FOLLOW_STATUS: '/social/follow-status',
  SOCIAL_FOLLOWERS: '/social/followers',
  SOCIAL_FOLLOWING: '/social/following',
  SOCIAL_PROFILE: '/social/profile',
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

