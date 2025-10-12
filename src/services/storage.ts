import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, Habit, Challenge, HabitCompletion, LifeChallenge, Settings } from '../types';
import { LIFE_CHALLENGES } from './lifeChallenges';

const STORAGE_KEYS = {
  APP_STATE: 'habitRush_app_state',
  USER: 'habitRush_user',
  HABITS: 'habitRush_habits',
  COMPLETIONS: 'habitRush_completions',
  CHALLENGES: 'habitRush_challenges',
};

// Datos iniciales por defecto
const defaultUser: User = {
  id: 'user_1',
  name: 'Usuario',
  lives: 2,
  maxLives: 2,
  totalHabits: 0,
  completedChallenges: [],
  createdAt: new Date(),
  xp: 0,
  league: 5, // Todos empiezan en la liga 5
  weeklyXp: 0,
  leagueWeekStart: new Date(),
};

const defaultSettings: Settings = {
  fontSize: 'medium',
  theme: 'light',
};

const defaultChallenges: Challenge[] = [
  {
    id: 'challenge_1',
    title: 'Hacer 20 flexiones',
    description: 'Completa 20 flexiones para reactivar tu hábito',
    difficulty: 'easy',
    type: 'exercise',
    estimatedTime: 5,
  },
  {
    id: 'challenge_2',
    title: 'Leer por 15 minutos',
    description: 'Dedica 15 minutos a leer algo nuevo',
    difficulty: 'easy',
    type: 'learning',
    estimatedTime: 15,
  },
  {
    id: 'challenge_3',
    title: 'Meditar 10 minutos',
    description: 'Practica meditación por 10 minutos',
    difficulty: 'easy',
    type: 'mindfulness',
    estimatedTime: 10,
  },
  {
    id: 'challenge_4',
    title: 'Hacer 30 sentadillas',
    description: 'Completa 30 sentadillas para reactivar tu hábito',
    difficulty: 'medium',
    type: 'exercise',
    estimatedTime: 8,
  },
  {
    id: 'challenge_5',
    title: 'Escribir un poema',
    description: 'Escribe un poema corto sobre tus metas',
    difficulty: 'medium',
    type: 'creative',
    estimatedTime: 20,
  },
  {
    id: 'challenge_6',
    title: 'Hacer 50 saltos',
    description: 'Completa 50 saltos para reactivar tu hábito',
    difficulty: 'hard',
    type: 'exercise',
    estimatedTime: 10,
  },
];

export class StorageService {
  // Guardar estado completo de la app
  static async saveAppState(state: AppState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving app state:', error);
      throw error;
    }
  }

  // Cargar estado completo de la app
  static async loadAppState(): Promise<AppState> {
    try {
      const stateString = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE);
      if (stateString) {
        const state = JSON.parse(stateString);
        // Convertir strings de fecha de vuelta a objetos Date
        state.habits = state.habits.map((habit: any) => ({
          ...habit,
          startDate: new Date(habit.startDate),
          targetDate: habit.targetDate ? new Date(habit.targetDate) : undefined,
          lastCompletedDate: habit.lastCompletedDate ? new Date(habit.lastCompletedDate) : undefined,
          createdAt: new Date(habit.createdAt),
        }));
        state.user.createdAt = new Date(state.user.createdAt);
        state.user.leagueWeekStart = state.user.leagueWeekStart 
          ? new Date(state.user.leagueWeekStart) 
          : new Date();
        // Asegurar compatibilidad con usuarios existentes
        if (state.user.xp === undefined) state.user.xp = 0;
        if (state.user.league === undefined) state.user.league = 5;
        if (state.user.weeklyXp === undefined) state.user.weeklyXp = 0;
        state.completions = state.completions.map((completion: any) => ({
          ...completion,
          date: new Date(completion.date),
        }));
        state.lifeChallenges = state.lifeChallenges.map((challenge: any) => ({
          ...challenge,
          completedCount: challenge.completedCount,
        }));
        // Asegurar compatibilidad con configuraciones
        if (!state.settings) {
          state.settings = { ...defaultSettings };
        } else {
          state.settings = { ...defaultSettings, ...state.settings };
        }
        return state;
      }
      return this.getDefaultAppState();
    } catch (error) {
      console.error('Error loading app state:', error);
      return this.getDefaultAppState();
    }
  }

  // Obtener estado por defecto
  static getDefaultAppState(): AppState {
    return {
      habits: [],
      user: defaultUser,
      completions: [],
      challenges: defaultChallenges,
      lifeChallenges: LIFE_CHALLENGES.map(lc => ({ ...lc })),
      settings: { ...defaultSettings },
    };
  }

  // Guardar usuario
  static async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  // Cargar usuario
  static async loadUser(): Promise<User> {
    try {
      const userString = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userString) {
        const user = JSON.parse(userString);
        user.createdAt = new Date(user.createdAt);
        user.leagueWeekStart = user.leagueWeekStart 
          ? new Date(user.leagueWeekStart) 
          : new Date();
        // Asegurar compatibilidad con usuarios existentes
        if (user.xp === undefined) user.xp = 0;
        if (user.league === undefined) user.league = 5;
        if (user.weeklyXp === undefined) user.weeklyXp = 0;
        return user;
      }
      return defaultUser;
    } catch (error) {
      console.error('Error loading user:', error);
      return defaultUser;
    }
  }

  // Guardar hábitos
  static async saveHabits(habits: Habit[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
      throw error;
    }
  }

  // Cargar hábitos
  static async loadHabits(): Promise<Habit[]> {
    try {
      const habitsString = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
      if (habitsString) {
        const habits = JSON.parse(habitsString);
        return habits.map((habit: any) => ({
          ...habit,
          startDate: new Date(habit.startDate),
          targetDate: habit.targetDate ? new Date(habit.targetDate) : undefined,
          lastCompletedDate: habit.lastCompletedDate ? new Date(habit.lastCompletedDate) : undefined,
          createdAt: new Date(habit.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  }

  // Guardar completiones
  static async saveCompletions(completions: HabitCompletion[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
    } catch (error) {
      console.error('Error saving completions:', error);
      throw error;
    }
  }

  // Cargar completiones
  static async loadCompletions(): Promise<HabitCompletion[]> {
    try {
      const completionsString = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      if (completionsString) {
        const completions = JSON.parse(completionsString);
        return completions.map((completion: any) => ({
          ...completion,
          date: new Date(completion.date),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading completions:', error);
      return [];
    }
  }

  // Limpiar todo el almacenamiento
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}



