import apiClient from './apiClient';

/**
 * Interfaz de liga según la API del backend
 */
export interface LeagueAPI {
  id: number;
  name: string;
  colorHex: string;
}

/**
 * Interfaz de competidor en la liga
 */
export interface LeagueCompetitorAPI {
  userId: string;
  name: string;
  weeklyXp: number;
  position: number;
  isReal: boolean;
  isCurrentUser: boolean;
}

/**
 * Respuesta de la liga actual
 */
export interface CurrentLeagueResponse {
  league?: LeagueAPI;
  competitors: LeagueCompetitorAPI[];
  message?: string;
}

/**
 * Interfaz de historial de liga del usuario
 */
export interface LeagueHistoryAPI {
  weeklyXp: number;
  position: number;
  changeType: 'promoted' | 'relegated' | 'stayed';
  leagueName: string;
  leagueColor: string;
  weekStart: string;
}

/**
 * Mapper: Convierte entre formatos de ligas
 */
export class LeagueMapper {
  /**
   * Convierte LeagueAPI del backend a formato local
   */
  static fromAPI(leagueAPI: LeagueAPI) {
    return {
      id: leagueAPI.id,
      name: leagueAPI.name,
      color: leagueAPI.colorHex,
    };
  }

  /**
   * Convierte LeagueCompetitorAPI a formato local
   * La API ya devuelve camelCase, así que solo pasamos los datos
   */
  static competitorFromAPI(competitorAPI: LeagueCompetitorAPI) {
    return {
      userId: competitorAPI.userId,
      name: competitorAPI.name,
      weeklyXp: competitorAPI.weeklyXp,
      position: competitorAPI.position,
      isReal: competitorAPI.isReal,
      isCurrentUser: competitorAPI.isCurrentUser,
    };
  }

  /**
   * Convierte LeagueHistoryAPI a formato local
   */
  static historyFromAPI(historyAPI: LeagueHistoryAPI) {
    return {
      weeklyXp: historyAPI.weeklyXp,
      position: historyAPI.position,
      changeType: historyAPI.changeType,
      leagueName: historyAPI.leagueName,
      leagueColor: historyAPI.leagueColor,
      weekStart: new Date(historyAPI.weekStart),
    };
  }
}

/**
 * Servicio para interactuar con la API de leagues
 */
export class LeagueService {
  /**
   * Obtiene la liga actual del usuario y el ranking semanal
   * Retorna null si no hay liga activa o hay error
   */
  static async getCurrentLeague(): Promise<CurrentLeagueResponse | null> {
    try {
      const response = await apiClient.get<CurrentLeagueResponse>('/leagues/current');
      console.log('Current league:', response.data);
      return response.data;
    } catch (error: any) {
      // No hay liga activa es un caso normal, no es error
      if (error.message?.includes('No active league week found') || 
          error.message?.includes('User not found in any league')) {
        console.log('User not in an active league this week');
        return null;
      }
      console.error('Error getting current league:', error);
      return null;
    }
  }

  /**
   * Obtiene el historial de ligas del usuario
   */
  static async getLeagueHistory(): Promise<LeagueHistoryAPI[]> {
    try {
      const response = await apiClient.get<LeagueHistoryAPI[]>('/users/me/league-history');
      console.log('League history:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error getting league history:', error);
      throw error;
    }
  }

  /**
   * Obtiene la liga actual con datos mapeados al formato local
   */
  static async getCurrentLeagueMapped() {
    const response = await this.getCurrentLeague();
    
    if (!response || !response.league) {
      return {
        league: null,
        competitors: [],
        message: response?.message || 'No active league this week',
      };
    }

    return {
      league: LeagueMapper.fromAPI(response.league),
      competitors: response.competitors.map(LeagueMapper.competitorFromAPI),
      message: response.message,
    };
  }

  /**
   * Obtiene el historial de ligas mapeado al formato local
   */
  static async getLeagueHistoryMapped() {
    const history = await this.getLeagueHistory();
    return history.map(LeagueMapper.historyFromAPI);
  }
}

