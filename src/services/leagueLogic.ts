import { AppState, LeagueCompetitor } from '../types';
import { StorageService } from './storage';

export class LeagueLogic {
  // Verificar si la semana de liga ha terminado
  static hasWeekEnded(weekStart: Date): boolean {
    const now = new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return now >= weekEnd;
  }

  // Calcular días restantes hasta el fin de semana
  static getDaysUntilWeekEnd(weekStart: Date): number {
    const now = new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const diffTime = weekEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  // Resetear el XP semanal y la fecha de inicio de semana
  static async resetWeeklyProgress(state: AppState): Promise<AppState> {
    const updatedUser = {
      ...state.user,
      weeklyXp: 0,
      leagueWeekStart: new Date(),
    };

    const newState: AppState = {
      ...state,
      user: updatedUser,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // Verificar si el usuario está en zona de promoción (top 3)
  static isInPromotionZone(
    userWeeklyXp: number,
    competitors: LeagueCompetitor[]
  ): boolean {
    const userPosition = competitors
      .sort((a, b) => b.weeklyXp - a.weeklyXp)
      .findIndex(c => c.weeklyXp <= userWeeklyXp);
    
    return userPosition < 3;
  }

  // Promover usuario a la siguiente liga (si está en zona de promoción)
  static async promoteUser(state: AppState): Promise<AppState> {
    if (state.user.league <= 1) {
      // Ya está en la liga más alta
      return state;
    }

    const updatedUser = {
      ...state.user,
      league: state.user.league - 1,
    };

    const newState: AppState = {
      ...state,
      user: updatedUser,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // Generar competidores simulados para la liga actual
  static generateCompetitors(
    userId: string,
    userName: string,
    userWeeklyXp: number,
    league: number
  ): LeagueCompetitor[] {
    const competitors: LeagueCompetitor[] = [];
    
    // Agregar al usuario actual
    competitors.push({
      id: userId,
      name: userName,
      weeklyXp: userWeeklyXp,
      league,
      position: 0,
    });

    // Nombres para competidores simulados
    const names = [
      'Ana García', 'Carlos López', 'María Rodríguez', 'Luis Martínez', 
      'Sofía González', 'Diego Hernández', 'Elena Pérez', 'Miguel Sánchez',
      'Laura Torres', 'Pedro Ramírez', 'Carmen Flores', 'Javier Cruz', 
      'Isabel Morales', 'Roberto Jiménez', 'Patricia Ruiz', 'Fernando Díaz',
      'Rosa Álvarez', 'Antonio Castro', 'Beatriz Ortega'
    ];

    // Generar competidores con XP basado en la liga
    const baseXp = league === 1 ? 300 : league === 2 ? 200 : league === 3 ? 150 : league === 4 ? 100 : 50;
    const variance = league === 1 ? 200 : league === 2 ? 150 : league === 3 ? 100 : league === 4 ? 75 : 50;

    for (let i = 0; i < 19; i++) {
      const randomXp = Math.floor(Math.random() * variance) + (baseXp - variance / 2);
      competitors.push({
        id: `competitor_${i}`,
        name: names[i],
        weeklyXp: Math.max(0, randomXp),
        league,
        position: 0,
      });
    }

    // Ordenar por XP semanal (de mayor a menor)
    competitors.sort((a, b) => b.weeklyXp - a.weeklyXp);

    // Asignar posiciones
    competitors.forEach((comp, index) => {
      comp.position = index + 1;
    });

    return competitors;
  }

  // Obtener nombre e información de una liga
  static getLeagueInfo(league: number): {
    name: string;
    emoji: string;
    color: string;
  } {
    const leagues = {
      1: { name: 'Liga Diamante', emoji: '💎', color: '#B9F2FF' },
      2: { name: 'Liga Oro', emoji: '🥇', color: '#FFD700' },
      3: { name: 'Liga Plata', emoji: '🥈', color: '#C0C0C0' },
      4: { name: 'Liga Bronce', emoji: '🥉', color: '#CD7F32' },
      5: { name: 'Liga Inicial', emoji: '🌱', color: '#90EE90' },
    };

    return leagues[league as keyof typeof leagues] || leagues[5];
  }

  // Calcular XP ganado por completar un hábito
  static calculateXpForHabitCompletion(
    currentStreak: number,
    habitDifficulty?: 'easy' | 'medium' | 'hard'
  ): number {
    let baseXp = 10;

    // Bonus por dificultad (para futuras implementaciones)
    if (habitDifficulty === 'hard') {
      baseXp = 15;
    } else if (habitDifficulty === 'medium') {
      baseXp = 12;
    }

    // Bonus por racha (0.5 XP extra por cada día de racha)
    const streakBonus = Math.floor(currentStreak * 0.5);

    return baseXp + streakBonus;
  }

  // Verificar y resetear semana si es necesario
  static async checkAndResetWeek(state: AppState): Promise<AppState> {
    if (this.hasWeekEnded(state.user.leagueWeekStart)) {
      return await this.resetWeeklyProgress(state)
    }
    return state;
  }
}

