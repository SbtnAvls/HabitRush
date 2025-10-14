import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, Settings, ThemePreference, AuthUser, User } from '../types';
import { StorageService } from '../services/storage';
import { HabitLogic } from '../services/habitLogic';
import { LeagueLogic } from '../services/leagueLogic';
import { AuthService } from '../services/authService';
import { HabitService } from '../services/habitService';
import { CompletionService } from '../services/completionService';
import { ChallengeService } from '../services/challengeService';
import { LifeChallengeService } from '../services/lifeChallengeService';
import { LeagueService } from '../services/leagueService';

interface AppContextType {
  state: AppState;
  loading: boolean;
  currentTheme: ThemePreference;
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  checkAuthentication: () => Promise<boolean>;
  logout: () => Promise<void>;
  syncHabits: () => Promise<void>;
  markHabitCompleted: (
    habitId: string,
    progressData?: any,
    notes?: string,
    images?: string[]
  ) => Promise<void>;
  createHabit: (
    name: string,
    frequency: any,
    progressType: any,
    activeByUser: boolean,
    description?: string,
    targetDate?: Date
  ) => Promise<void>;
  completeChallenge: (challengeId: string, habitId: string) => Promise<void>;
  activateHabit: (habitId: string) => Promise<void>;
  deactivateHabit: (habitId: string) => Promise<void>;
  redeemLifeChallenge: (challengeId: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>(StorageService.getDefaultAppState());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setIsAuthenticated(false);
        setAuthUser(null);
        return false;
      }

      const user = await AuthService.getMe();
      setIsAuthenticated(true);
      setAuthUser(user);
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setIsAuthenticated(false);
      setAuthUser(null);
      
      // Obtener estado por defecto (limpio) desde StorageService
      const defaultState = StorageService.getDefaultAppState();
      
      // Mantener solo la configuración del usuario
      const clearedState: AppState = {
        ...defaultState,
        settings: state.settings, // Mantener configuración (tema, preferencias)
      };
      
      setState(clearedState);
      
      // Limpiar storage con estado inicial
      await StorageService.saveAppState(clearedState);
      
      console.log('Logout completed, all data cleared and reset to defaults');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const syncHabits = async () => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping habit sync');
        return;
      }

      // Obtener hábitos del servidor
      const serverHabits = await HabitService.getAllHabits();
      
      // Actualizar el estado con los hábitos del servidor
      // NO guardar en storage, solo en memoria
      const updatedState: AppState = {
        ...state,
        habits: serverHabits,
      };
      
      setState(updatedState);
      
      console.log('Habits synced successfully (memory only)');
    } catch (error) {
      console.error('Error syncing habits:', error);
      // No lanzar error, mantener hábitos locales
    }
  };

  const loadAppState = async () => {
    try {
      setLoading(true);
      
      // Verificar autenticación
      const authenticated = await checkAuthentication();
      
      let appState = await StorageService.loadAppState()
      
      // Si está autenticado, cargar datos SOLO del servidor (no del storage)
      if (authenticated) {
        try {
          // Cargar hábitos
          const serverHabits = await HabitService.getAllHabits();
          appState.habits = serverHabits;
          
          // Cargar completaciones
          const habitIds = serverHabits.map(h => h.id);
          if (habitIds.length > 0) {
            const serverCompletions = await CompletionService.getAllCompletions(habitIds);
            appState.completions = serverCompletions;
          } else {
            appState.completions = [];
          }
          
          // Cargar desafíos activos
          const activeChallenges = await ChallengeService.getActiveChallenges();
          appState = { ...appState, challenges: activeChallenges };
          
          // Cargar desafíos de vida con progreso
          const lifeChallenges = await LifeChallengeService.getLifeChallengesWithProgress();
          appState.lifeChallenges = lifeChallenges;
          
          // Cargar liga actual (solo si está autenticado)
          // Nota: La pantalla de ligas usa datos locales generados,
          // esto solo actualiza el tier si el servidor tiene información
          const currentLeague = await LeagueService.getCurrentLeague();
          if (currentLeague && currentLeague.league) {
            // Actualizar datos de liga del usuario desde el servidor
            appState.user.league = currentLeague.league.tier;
            // Los competitors se manejan en la pantalla de ligas, no en el estado global
          }
        } catch (error) {
          console.error('Error loading data from server:', error);
          // Si falla, usar datos vacíos (no los del storage)
          appState.habits = [];
          appState.completions = [];
          // Mantener challenges y lifeChallenges por defecto si fallan
        }
      }
      // Si NO está autenticado, usar datos del storage local
      
      // Verificar y resetear semana de liga si es necesario
      appState = await LeagueLogic.checkAndResetWeek(appState)
      
      // Verificar hábitos perdidos al cargar la app
      appState = await HabitLogic.checkAndHandleMissedHabits(appState);
      
      setState(appState);
    } catch (error) {
      console.error('Error loading app state:', error);
    } finally {
      setLoading(false);
    }
  };

  const markHabitCompleted = async (
    habitId: string,
    progressData?: any,
    notes?: string,
    images?: string[]
  ) => {
    try {
      // Si está autenticado, crear completación en el servidor
      if (isAuthenticated) {
        // Crear completación localmente para obtener los datos
        const tempState = await HabitLogic.markHabitCompleted(
          habitId,
          state,
          progressData,
          notes,
          images
        );
        
        // Obtener la completación recién creada
        const newCompletion = tempState.completions[tempState.completions.length - 1];
        
        // Crear en el servidor
        await CompletionService.createOrUpdateCompletion(habitId, newCompletion);
        
        // Actualizar estado con los datos del servidor
        // Por simplicidad, usamos los datos locales (el servidor devuelve similar)
        setState(tempState);
        
        // NO guardar en storage si está autenticado
      } else {
        // Usuario local: guardar en storage
        const updatedState = await HabitLogic.markHabitCompleted(
          habitId,
          state,
          progressData,
          notes,
          images
        );
        setState(updatedState);
        await StorageService.saveAppState(updatedState);
      }
    } catch (error) {
      console.error('Error marking habit completed:', error);
      throw error;
    }
  };

  const createHabit = async (
    name: string,
    frequency: any,
    progressType: any,
    activeByUser: boolean,
    description?: string,
    targetDate?: Date
  ) => {
    try {
      // Si está autenticado, crear DIRECTAMENTE en el servidor
      if (isAuthenticated) {
        try {
          // Crear hábito temporal para obtener los datos
          const tempState = await HabitLogic.createHabit(
            name,
            frequency,
            progressType,
            activeByUser,
            description,
            targetDate,
            state
          );
          const newHabit = tempState.habits[tempState.habits.length - 1];
          
          // Crear en el backend
          const serverHabit = await HabitService.createHabit({
            name: newHabit.name,
            description: newHabit.description,
            startDate: newHabit.startDate,
            targetDate: newHabit.targetDate,
            frequency: newHabit.frequency,
            progressType: newHabit.progressType,
            activeByUser: newHabit.activeByUser,
          });

          // Actualizar estado con el hábito del servidor
          const updatedState = {
            ...state,
            habits: [...state.habits, serverHabit],
          };
          
          setState(updatedState);
          // NO guardar en storage si está autenticado
          
        } catch (syncError) {
          console.error('Error creating habit on server:', syncError);
          throw syncError;
        }
      } else {
        // Si NO está autenticado, crear localmente y guardar en storage
        const updatedState = await HabitLogic.createHabit(
          name,
          frequency,
          progressType,
          activeByUser,
          description,
          targetDate,
          state
        );
        setState(updatedState);
        await StorageService.saveAppState(updatedState);
      }
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  };

  const completeChallenge = async (challengeId: string, habitId: string) => {
    try {
      // Si está autenticado, completar en el servidor
      if (isAuthenticated) {
        // El challengeId aquí es en realidad el userChallengeId
        await ChallengeService.completeChallenge(challengeId);
        
        // Actualizar estado local
        const updatedState = await HabitLogic.completeChallengeAndReactivateHabit(
          challengeId,
          habitId,
          state
        );
        setState(updatedState);
        
        // NO guardar en storage si está autenticado
      } else {
        // Usuario local: guardar en storage
        const updatedState = await HabitLogic.completeChallengeAndReactivateHabit(
          challengeId,
          habitId,
          state
        );
        setState(updatedState);
        await StorageService.saveAppState(updatedState);
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  };

  const activateHabit = async (habitId: string) => {
    try {
      // Si está autenticado, actualizar en el servidor primero
      if (isAuthenticated) {
        await HabitService.updateHabit(habitId, {
          activeByUser: true,
          isActive: true,
        });
      }
      
      // Actualizar estado local
      const updatedState = await HabitLogic.activateHabit(habitId, state);
      setState(updatedState);

      // Solo guardar en storage si NO está autenticado
      if (!isAuthenticated) {
        await StorageService.saveAppState(updatedState);
      }
    } catch (error) {
      console.error('Error activating habit:', error);
    }
  };

  const deactivateHabit = async (habitId: string) => {
    try {
      // Si está autenticado, actualizar en el servidor primero
      if (isAuthenticated) {
        await HabitService.updateHabit(habitId, {
          activeByUser: false,
          isActive: false,
        });
      }
      
      // Actualizar estado local
      const updatedState = await HabitLogic.deactivateHabit(habitId, state);
      setState(updatedState);

      // Solo guardar en storage si NO está autenticado
      if (!isAuthenticated) {
        await StorageService.saveAppState(updatedState);
      }
    } catch (error) {
      console.error('Error deactivating habit:', error);
    }
  };

  const redeemLifeChallenge = async (challengeId: string) => {
    try {
      // Si está autenticado, redimir en el servidor
      if (isAuthenticated) {
        const response = await LifeChallengeService.redeemLifeChallenge(challengeId);
        
        // Actualizar estado local con los datos del servidor
        const updatedState = await HabitLogic.redeemLifeChallenge(challengeId, state);
        
        // Actualizar vidas con el valor del servidor
        updatedState.user.lives = response.currentLives;
        
        setState(updatedState);
        
        // NO guardar en storage si está autenticado
      } else {
        // Usuario local: guardar en storage
        const updatedState = await HabitLogic.redeemLifeChallenge(challengeId, state);
        setState(updatedState);
        await StorageService.saveAppState(updatedState);
      }
    } catch (error) {
      console.error('Error redeeming life challenge:', error);
      throw error;
    }
  };

  const updateSettings = async (settings: Partial<Settings>) => {
    try {
      const updatedState: AppState = {
        ...state,
        settings: {
          ...state.settings,
          ...settings,
        },
      };
      setState(updatedState);
      await StorageService.saveAppState(updatedState);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const refreshState = async () => {
    await loadAppState();
  };

  useEffect(() => {
    loadAppState();
  }, []);

  const currentTheme = state.settings.theme;

  const value: AppContextType = {
    state,
    loading,
    currentTheme,
    isAuthenticated,
    authUser,
    checkAuthentication,
    logout,
    syncHabits,
    markHabitCompleted,
    createHabit,
    completeChallenge,
    activateHabit,
    deactivateHabit,
    redeemLifeChallenge,
    updateSettings,
    refreshState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

