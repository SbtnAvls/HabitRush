/**
 * Tipos para el módulo social de HabitRush
 */

// ============================================
// Usuarios en búsqueda y listas
// ============================================

export interface SocialUser {
  id: string;
  username: string;
  followers_count: number;
  following_count: number;
  is_profile_public: boolean;
  is_following: boolean;
}

export interface FollowListUser extends SocialUser {
  created_at: string; // Fecha en que comenzó a seguir
}

// ============================================
// Perfil Público
// ============================================

export interface PublicProfileStats {
  total_habits: number;
  max_streak: number;
  total_completions: number;
  member_since_days: number;
  league: number;
  league_position: number | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  is_profile_public: boolean;
  is_following: boolean;
  follows_you: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
  stats: PublicProfileStats | null;
}

// ============================================
// Estado de Follow
// ============================================

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

// ============================================
// Respuestas Paginadas
// ============================================

export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SearchUsersResponse = PaginatedResponse<SocialUser>;
export type FollowListResponse = PaginatedResponse<FollowListUser>;

// ============================================
// Parámetros de Búsqueda
// ============================================

export interface SearchUsersParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface FollowListParams {
  userId: string;
  page?: number;
  limit?: number;
}

// ============================================
// Respuestas de Acciones
// ============================================

export interface FollowActionResponse {
  message: string;
}

// ============================================
// Mapeo de Ligas
// ============================================

export const LEAGUE_NAMES: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Diamond',
  5: 'Master',
};

export const LEAGUE_COLORS: Record<number, string> = {
  1: '#CD7F32', // Bronze
  2: '#C0C0C0', // Silver
  3: '#FFD700', // Gold
  4: '#B9F2FF', // Diamond
  5: '#9B59B6', // Master
};

export const getLeagueName = (league: number): string => {
  return LEAGUE_NAMES[league] || 'Unknown';
};

export const getLeagueColor = (league: number): string => {
  return LEAGUE_COLORS[league] || '#6C757D';
};
