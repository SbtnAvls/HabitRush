import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, Habit, Challenge, HabitCompletion, LifeChallenge, Settings, PendingRedemption } from '../types';

const STORAGE_KEYS = {
  APP_STATE: 'habitRush_app_state',
  USER: 'habitRush_user',
  HABITS: 'habitRush_habits',
  COMPLETIONS: 'habitRush_completions',
  CHALLENGES: 'habitRush_challenges',
  AUTH_TOKEN: 'habitRush_auth_token',
  THEME: 'habitRush_theme', // Clave separada para cargar el tema rápidamente
  FONT_SIZE: 'habitRush_font_size', // Clave separada para el tamaño de fuente (puede ser número o preset)
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
  theme: 'dark', // Dark mode por defecto para evitar flash de tema claro
};

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
          isBlocked: habit.isBlocked ?? false, // Migración: hábitos antiguos no están bloqueados
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
        // Migrar lifeChallenges antiguos o mantener los nuevos
        // Los nuevos tienen: status, canRedeem, obtainedAt, redeemedAt
        // Los antiguos tenían: completedCount, verificationFunction
        state.lifeChallenges = (state.lifeChallenges || []).map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          reward: challenge.reward,
          redeemable: challenge.redeemable || challenge.redeemable_type,
          icon: challenge.icon,
          // Nuevos campos del backend
          status: challenge.status || 'pending',
          canRedeem: challenge.canRedeem || false,
          obtainedAt: challenge.obtainedAt || null,
          redeemedAt: challenge.redeemedAt || null,
        }));
        // Asegurar compatibilidad con configuraciones
        if (!state.settings) {
          state.settings = { ...defaultSettings };
        } else {
          state.settings = { ...defaultSettings, ...state.settings };
        }
        // Asegurar compatibilidad con pendingRedemptions
        if (!state.pendingRedemptions) {
          state.pendingRedemptions = [];
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
      challenges: [], // Los challenges vienen del backend cuando el usuario está autenticado
      lifeChallenges: [], // Los life challenges vienen del backend con su estado (status, canRedeem)
      settings: { ...defaultSettings },
      pendingRedemptions: [], // Pending redemptions vienen del backend
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
          isBlocked: habit.isBlocked ?? false, // Migración: hábitos antiguos no están bloqueados
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

  // Guardar token de autenticación (usado por AuthService)
  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  // Obtener token de autenticación (usado por AuthService)
  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Eliminar token de autenticación (usado por AuthService)
  static async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  }

  // Guardar tema de forma independiente (para carga rápida)
  static async saveTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
      // No lanzar error, no es crítico
    }
  }

  // Cargar tema de forma independiente (para carga rápida al inicio)
  static async loadTheme(): Promise<'light' | 'dark'> {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (theme === 'light' || theme === 'dark') {
        return theme;
      }
      return defaultSettings.theme; // 'dark' por defecto
    } catch (error) {
      console.error('Error loading theme:', error);
      return defaultSettings.theme;
    }
  }

  // Guardar tamaño de fuente de forma independiente (para preservar valor exacto del slider)
  static async saveFontSize(fontSize: number | 'small' | 'medium' | 'large'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, JSON.stringify(fontSize));
    } catch (error) {
      console.error('Error saving font size:', error);
      // No lanzar error, no es crítico
    }
  }

  // Cargar tamaño de fuente de forma independiente
  static async loadFontSize(): Promise<number | 'small' | 'medium' | 'large' | null> {
    try {
      const fontSizeStr = await AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      if (fontSizeStr) {
        return JSON.parse(fontSizeStr);
      }
      return null; // null indica que no hay valor guardado
    } catch (error) {
      console.error('Error loading font size:', error);
      return null;
    }
  }

  // Obtener tema por defecto
  static getDefaultTheme(): 'light' | 'dark' {
    return defaultSettings.theme;
  }
}



