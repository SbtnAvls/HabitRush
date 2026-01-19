import { Habit, User, HabitCompletion, Challenge, AppState, LifeChallenge } from '../types';
import { StorageService } from './storage';
import { LeagueLogic } from './leagueLogic';

export class HabitLogic {
  // Verificar si un hábito debe completarse hoy
  static shouldCompleteToday(habit: Habit): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.shouldCompleteTodayForDate(habit, today);
  }

  // Verificar si un hábito debe completarse en una fecha específica
  static shouldCompleteTodayForDate(habit: Habit, date: Date): boolean {
    if (!habit.isActive) return false;

    switch (habit.frequency.type) {
      case 'daily':
        return true;

      case 'weekly':
        if (habit.frequency.daysOfWeek) {
          return habit.frequency.daysOfWeek.includes(date.getDay());
        }
        return false;

      case 'custom':
        if (habit.frequency.daysOfWeek) {
          return habit.frequency.daysOfWeek.includes(date.getDay());
        }
        return false;

      default:
        return false;
    }
  }

  // Verificar si un hábito fue completado hoy
  static wasCompletedToday(habitId: string, completions: HabitCompletion[]): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompletion = completions.find(completion => 
      completion.habitId === habitId &&
      completion.date.getTime() === today.getTime()
    );

    return todayCompletion?.completed || false;
  }

  // Marcar hábito como completado hoy
  static async markHabitCompleted(
    habitId: string, 
    state: AppState,
    progressData?: any,
    notes?: string,
    images?: string[]
  ): Promise<AppState> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular XP ganado usando el servicio de ligas
    const habit = state.habits.find(h => h.id === habitId);
    const xpGained = habit 
      ? LeagueLogic.calculateXpForHabitCompletion(habit.currentStreak)
      : 10;

    // Actualizar el hábito
    const updatedHabits = state.habits.map(habit => {
      if (habit.id === habitId) {
        return {
          ...habit,
          currentStreak: habit.currentStreak + 1,
          lastCompletedDate: today,
        };
      }
      return habit;
    });

    // Agregar o actualizar la completión
    const existingCompletionIndex = state.completions.findIndex(
      completion => completion.habitId === habitId && completion.date.getTime() === today.getTime()
    );

    let updatedCompletions = [...state.completions];
    const completionData = {
      habitId,
      date: today,
      completed: true,
      progressData,
      notes,
      images,
    };

    if (existingCompletionIndex >= 0) {
      updatedCompletions[existingCompletionIndex] = completionData;
    } else {
      updatedCompletions.push(completionData);
    }

    // Actualizar XP del usuario
    const updatedUser = {
      ...state.user,
      xp: state.user.xp + xpGained,
      weeklyXp: state.user.weeklyXp + xpGained,
    };

    const newState: AppState = {
      ...state,
      habits: updatedHabits,
      completions: updatedCompletions,
      user: updatedUser,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // Verificar si se perdió la racha y perder vida
  static async checkAndHandleMissedHabits(state: AppState): Promise<AppState> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let updatedState = { ...state };
    let livesLost = 0;

    // Verificar cada hábito activo
    for (const habit of state.habits) {
      // Solo verificar hábitos que están activos y activados por el usuario
      if (!habit.isActive || !habit.activeByUser) continue;

      // Verificar si AYER debía completarse (no HOY)
      const shouldCompleteYesterday = this.shouldCompleteTodayForDate(habit, yesterday);

      if (shouldCompleteYesterday) {
        // Verificar si se completó ayer
        const wasCompletedYesterday = state.completions.some(completion =>
          completion.habitId === habit.id &&
          completion.date.getTime() === yesterday.getTime() &&
          completion.completed
        );

        // Si no se completó ayer, verificar si ya se penalizó este fallo
        if (!wasCompletedYesterday) {
          // Solo penalizar si la última completación fue antes de ayer
          // Esto evita penalizar múltiples veces por el mismo día fallido
          const lastCompletedDate = habit.lastCompletedDate;
          const shouldPenalize = !lastCompletedDate ||
            lastCompletedDate.getTime() < yesterday.getTime();

          if (shouldPenalize) {
            livesLost++;

            // Resetear racha del hábito y desactivarlo
            updatedState.habits = updatedState.habits.map(h =>
              h.id === habit.id ? { ...h, currentStreak: 0, isActive: false } : h
            );
          }
        }
      }
    }

    // Actualizar vidas del usuario
    if (livesLost > 0) {
      updatedState.user = {
        ...updatedState.user,
        lives: Math.max(0, updatedState.user.lives - livesLost),
      };
    }

    await StorageService.saveAppState(updatedState);
    return updatedState;
  }

  // Obtener retos aleatorios para reactivar hábitos
  static getRandomChallenges(challenges: Challenge[], count: number = 1): Challenge[] {
    const availableChallenges = challenges.filter(c => !c.isCompleted);
    const shuffled = [...availableChallenges].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Completar reto y reactivar hábito
  static async completeChallengeAndReactivateHabit(
    challengeId: string,
    habitId: string,
    state: AppState
  ): Promise<AppState> {
    // Marcar reto como completado
    const updatedChallenges = state.challenges.map(challenge =>
      challenge.id === challengeId 
        ? { ...challenge, isCompleted: true }
        : challenge
    );

    // Reactivar hábito
    const updatedHabits = state.habits.map(habit =>
      habit.id === habitId
        ? { ...habit, isActive: true, currentStreak: 0 }
        : habit
    );

    // Restaurar una vida
    const updatedUser = {
      ...state.user,
      lives: Math.min(state.user.maxLives, state.user.lives + 1),
      completedChallenges: [...state.user.completedChallenges, challengeId],
    };

    const newState: AppState = {
      ...state,
      challenges: updatedChallenges,
      habits: updatedHabits,
      user: updatedUser,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // Crear nuevo hábito
  static async createHabit(
    name: string,
    frequency: any,
    progressType: any,
    activeByUser: boolean,
    description?: string,
    targetDate?: Date,
    state?: AppState,
    targetValue?: number
  ): Promise<AppState> {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name,
      description,
      startDate: new Date(),
      targetDate,
      currentStreak: 0,
      frequency,
      progressType,
      targetValue: (progressType === 'time' || progressType === 'count') ? targetValue : undefined,
      isActive: activeByUser, // Si el usuario lo pone en pausa, isActive = false
      activeByUser,
      createdAt: new Date(),
    };

    if (!state) {
      throw new Error('State is required');
    }

    const updatedHabits = [...state.habits, newHabit];
    const updatedUser = {
      ...state.user,
      totalHabits: state.user.totalHabits + 1,
    };

    const newState: AppState = {
      ...state,
      habits: updatedHabits,
      user: updatedUser,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // Obtener estadísticas del usuario
  static getUserStats(state: AppState) {
    const activeHabits = state.habits.filter(h => h.isActive && h.activeByUser);
    const completedToday = state.completions.filter(c => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return c.date.getTime() === today.getTime() && c.completed;
    }).length;

    const totalStreak = state.habits.reduce((sum, habit) => sum + habit.currentStreak, 0);

    return {
      activeHabits: activeHabits.length,
      completedToday,
      totalStreak,
      lives: state.user.lives,
      maxLives: state.user.maxLives,
      totalHabits: state.user.totalHabits,
    };
  }

  // Activar hábito (por usuario)
  static async activateHabit(habitId: string, state: AppState): Promise<AppState> {
    const updatedHabits = state.habits.map(habit =>
      habit.id === habitId
        ? { ...habit, activeByUser: true }
        : habit
    );

    const newState: AppState = {
      ...state,
      habits: updatedHabits,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // Desactivar hábito (por usuario) - Borra progreso pero mantiene notas
  static async deactivateHabit(habitId: string, state: AppState): Promise<AppState> {
    // Actualizar hábito: desactivar y resetear racha
    const updatedHabits = state.habits.map(habit =>
      habit.id === habitId
        ? {
            ...habit,
            activeByUser: false,
            currentStreak: 0,
            lastCompletedDate: undefined
          }
        : habit
    );

    // Borrar progreso (progressData) pero mantener notas e imágenes
    const updatedCompletions = state.completions.map(completion =>
      completion.habitId === habitId
        ? {
            ...completion,
            completed: false,
            progressData: undefined,
          }
        : completion
    );

    const newState: AppState = {
      ...state,
      habits: updatedHabits,
      completions: updatedCompletions,
    };

    await StorageService.saveAppState(newState);
    return newState;
  }

  // DEPRECATED: La verificación de life challenges ahora se hace en el backend
  // El frontend debe usar challenge.canRedeem directamente
  // Esta función se mantiene por compatibilidad pero ya no se usa
  static getAvailableLifeChallenges(state: AppState): Map<string, boolean> {
    const availabilityMap = new Map<string, boolean>();
    // Los lifeChallenges ahora vienen del backend con canRedeem ya calculado
    if (state.lifeChallenges) {
      for (const challenge of state.lifeChallenges) {
        availabilityMap.set(challenge.id, challenge.canRedeem || false);
      }
    }
    return availabilityMap;
  }
}
