import apiClient from './apiClient';
import {
  SocialUser,
  FollowListUser,
  PublicProfile,
  FollowStatus,
  SearchUsersResponse,
  FollowListResponse,
  FollowActionResponse,
} from '../types/social';

/**
 * Servicio para interactuar con la API social de HabitRush
 * 
 * Endpoints:
 * - GET /social/search?q= - Buscar usuarios
 * - POST /social/follow/:userId - Seguir usuario
 * - DELETE /social/follow/:userId - Dejar de seguir
 * - GET /social/follow-status/:userId - Estado mutuo de follow
 * - GET /social/followers/:userId - Lista de seguidores
 * - GET /social/following/:userId - Lista de seguidos
 * - GET /social/profile/:userId - Perfil público
 */
export class SocialService {
  /**
   * Buscar usuarios por username
   * @param query - Texto a buscar (mínimo 2 caracteres)
   * @param page - Página actual (default: 1)
   * @param limit - Resultados por página (default: 20, max: 50)
   */
  static async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchUsersResponse> {
    try {
      const response = await apiClient.get<SearchUsersResponse>('/social/search', {
        params: { q: query, page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Seguir a un usuario
   * @param userId - ID del usuario a seguir
   */
  static async followUser(userId: string): Promise<FollowActionResponse> {
    try {
      const response = await apiClient.post<FollowActionResponse>(
        `/social/follow/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Dejar de seguir a un usuario
   * @param userId - ID del usuario a dejar de seguir
   */
  static async unfollowUser(userId: string): Promise<FollowActionResponse> {
    try {
      const response = await apiClient.delete<FollowActionResponse>(
        `/social/follow/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de follow mutuo con un usuario
   * @param userId - ID del usuario objetivo
   */
  static async getFollowStatus(userId: string): Promise<FollowStatus> {
    try {
      const response = await apiClient.get<FollowStatus>(
        `/social/follow-status/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting follow status:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de seguidores de un usuario
   * @param userId - ID del usuario
   * @param page - Página actual (default: 1)
   * @param limit - Resultados por página (default: 20, max: 50)
   */
  static async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FollowListResponse> {
    try {
      const response = await apiClient.get<FollowListResponse>(
        `/social/followers/${userId}`,
        { params: { page, limit } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting followers:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios que sigue un usuario
   * @param userId - ID del usuario
   * @param page - Página actual (default: 1)
   * @param limit - Resultados por página (default: 20, max: 50)
   */
  static async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FollowListResponse> {
    try {
      const response = await apiClient.get<FollowListResponse>(
        `/social/following/${userId}`,
        { params: { page, limit } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting following:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil público de un usuario
   * @param userId - ID del usuario
   */
  static async getPublicProfile(userId: string): Promise<PublicProfile> {
    try {
      const response = await apiClient.get<PublicProfile>(
        `/social/profile/${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting public profile:', error);
      throw error;
    }
  }

  /**
   * Toggle follow status (helper para UI)
   * Sigue si no está siguiendo, deja de seguir si ya sigue
   * @param userId - ID del usuario
   * @param currentlyFollowing - Estado actual de follow
   */
  static async toggleFollow(
    userId: string,
    currentlyFollowing: boolean
  ): Promise<{ isFollowing: boolean; message: string }> {
    try {
      if (currentlyFollowing) {
        const response = await this.unfollowUser(userId);
        return { isFollowing: false, message: response.message };
      } else {
        const response = await this.followUser(userId);
        return { isFollowing: true, message: response.message };
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }
}

export default SocialService;
