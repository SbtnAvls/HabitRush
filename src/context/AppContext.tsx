import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, Settings, ThemePreference, AuthUser, User } from '../types';
import { StorageService } from '../services/storage';
import { SecureStorage } from '../services/secureStorage';
import { HabitLogic } from '../services/habitLogic';
import { LeagueLogic } from '../services/leagueLogic';
import { AuthService } from '../services/authService';
import { HabitService } from '../services/habitService';
import { CompletionService } from '../services/completionService';
import { ChallengeService } from '../services/challengeService';
import { LifeChallengeService } from '../services/lifeChallengeService';
import { LeagueService } from '../services/leagueService';
import { UserService } from '../services/userService';
import sessionEventEmitter, { SESSION_EVENTS } from '../services/sessionEventEmitter';

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
  ) => Promise<{ success: boolean; lifeChallengesObtained: any[] | null }>;
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
  const [isHandlingSessionExpiry, setIsHandlingSessionExpiry] = useState(false);

  const checkAuthentication = async (): Promise<boolean> => {
    try {
      // Verificar si necesitamos migrar tokens desde AsyncStorage
      const needsMigration = await AuthService.checkAndMigrateTokens();
      if (needsMigration) {
        setIsAuthenticated(false);
        setAuthUser(null);
        return false;
      }

      // Verificar si hay tokens válidos
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        setIsAuthenticated(false);
        setAuthUser(null);
        return false;
      }

      // Validar el token con el servidor llamando a getMe
      // El apiClient manejará el refresh automáticamente si es necesario
      const user = await AuthService.getMe();
      setIsAuthenticated(true);
      setAuthUser(user);
      return true;
    } catch (error: any) {
      console.error('Error checking authentication:', error);

      // Si hay un error 401, el token es inválido
      // El interceptor ya lo habrá eliminado y emitido el evento
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
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  /**
   * Maneja la sesión expirada (401)
   * Se llama automáticamente cuando el interceptor detecta un 401
   */
  const handleSessionExpired = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isHandlingSessionExpiry) {
      return;
    }

    // Si no estaba autenticado, no hacer nada
    if (!isAuthenticated) {
      return;
    }
    setIsHandlingSessionExpiry(true);

    try {
      // Marcar como no autenticado
      setIsAuthenticated(false);
      setAuthUser(null);

      // Obtener estado por defecto (limpio)
      const defaultState = StorageService.getDefaultAppState();

      // Mantener solo la configuración del usuario
      const clearedState: AppState = {
        ...defaultState,
        settings: state.settings, // Mantener configuración
      };

      // Actualizar el estado inmediatamente
      setState(clearedState);

      // Guardar el estado limpio en storage
      await StorageService.saveAppState(clearedState);
    } finally {
      setIsHandlingSessionExpiry(false);
    }
  };

  const syncHabits = async () => {
    try {
      if (!isAuthenticated) {
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

      let appState = await StorageService.loadAppState();

      // Si está autenticado, cargar datos SOLO del servidor (no del storage)
      if (authenticated) {
        try {
          // Verificar que realmente tenemos tokens antes de cargar datos
          const hasTokens = await SecureStorage.hasTokens();

          if (!hasTokens) {
            console.warn('Authentication check passed but no tokens found - session may have expired');
            // Marcar como no autenticado
            setIsAuthenticated(false);
            setAuthUser(null);
            // Limpiar datos
            appState.habits = [];
            appState.completions = [];
            appState.challenges = StorageService.getDefaultAppState().challenges;
            appState.lifeChallenges = StorageService.getDefaultAppState().lifeChallenges;
            appState.user = StorageService.getDefaultAppState().user;
          } else {
            // Cargar datos del usuario (vidas, XP, etc.) desde el backend
            try {
              const userData = await UserService.getMe();
              appState.user = {
                ...appState.user,
                id: userData.id,
                name: userData.name,
                email: userData.email,
                lives: userData.lives,
                maxLives: userData.max_lives,
                xp: userData.xp,
                weeklyXp: userData.weekly_xp,
                league: userData.league_tier,
                leagueWeekStart: new Date(userData.league_week_start),
              };
            } catch (userError) {
              console.error('Error loading user data:', userError);
              // Si falla, usar datos por defecto
            }

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

            // Cargar liga actual y weeklyXp (solo si está autenticado)
            try {
              const currentLeague = await LeagueService.getCurrentLeague();
              if (currentLeague && currentLeague.league && currentLeague.competitors) {
                appState.user.league = currentLeague.league.tier;

                // Actualizar weeklyXp del usuario desde el backend
                // Obtener el usuario autenticado para su ID
                const authenticatedUser = await AuthService.getMe();
                const userCompetitor = currentLeague.competitors.find(
                  c => c.user_id === authenticatedUser.id
                );
                if (userCompetitor) {
                  appState.user.weeklyXp = userCompetitor.weekly_xp;
                }
              }
            } catch (leagueError) {
              console.error('Error loading league data:', leagueError);
              // No es crítico, continuar sin datos de liga
            }
          }
        } catch (error: any) {
          console.error('Error loading data from server:', error);

          // Si el error es 401 o menciona falta de token, la sesión expiró
          const isAuthError = error?.status === 401 ||
                             error?.message?.includes('token') ||
                             error?.message?.includes('No token provided');

          if (isAuthError) {
            console.warn('Session expired during data loading');
            // El interceptor ya manejará esto, pero aseguramos datos limpios
            setIsAuthenticated(false);
            setAuthUser(null);
            appState.habits = [];
            appState.completions = [];
            appState.challenges = StorageService.getDefaultAppState().challenges;
            appState.lifeChallenges = StorageService.getDefaultAppState().lifeChallenges;
            appState.user = StorageService.getDefaultAppState().user;
          } else {
            // Otro tipo de error: usar datos vacíos pero mantener autenticación
            appState.habits = [];
            appState.completions = [];
          }
        }
      } else {
        // Si NO está autenticado, asegurar que NO haya datos de usuario
        // Esto es crítico para evitar que se muestren datos de sesiones anteriores
        if (appState.habits.length > 0 || appState.completions.length > 0) {
          appState.habits = [];
          appState.completions = [];
          appState.challenges = StorageService.getDefaultAppState().challenges;
          appState.lifeChallenges = StorageService.getDefaultAppState().lifeChallenges;
          appState.user = StorageService.getDefaultAppState().user;

          // Guardar el estado limpio
          await StorageService.saveAppState(appState);
        }
      }

      // Verificar y resetear semana de liga si es necesario
      appState = await LeagueLogic.checkAndResetWeek(appState);

      // NOTA: La verificación de hábitos perdidos se maneja en el BACKEND
      // mediante un cron job que ejecuta evaluateMissedHabits() diariamente.
      // El frontend solo debe sincronizar los datos del servidor.
      // NO verificar hábitos perdidos aquí para evitar duplicar penalizaciones.

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
        const response = await CompletionService.createOrUpdateCompletion(habitId, newCompletion);

        // Verificar si se obtuvieron Life Challenges
        let lifeChallengesObtained = null;
        if (response.new_life_challenges_obtained && response.new_life_challenges_obtained.length > 0) {
          lifeChallengesObtained = response.new_life_challenges_obtained;

          // Emitir evento para mostrar notificación
          sessionEventEmitter.emit('LIFE_CHALLENGE_OBTAINED', lifeChallengesObtained);
        }

        // Actualizar estado con los datos del servidor
        setState(tempState);

        // Retornar los Life Challenges obtenidos para que el componente pueda manejarlos
        return { success: true, lifeChallengesObtained };
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
        return { success: true, lifeChallengesObtained: null };
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
    // Verificar autenticación antes de recargar
    const authenticated = await checkAuthentication();

    // Si el token no es válido, limpiar el estado
    if (!authenticated && isAuthenticated) {
      await handleSessionExpired();
      return;
    }

    // Recargar el estado normalmente
    await loadAppState();
  };

  useEffect(() => {
    loadAppState();

    // Escuchar eventos de sesión expirada
    const handleSessionExpiredEvent = () => {
      handleSessionExpired();
    };

    sessionEventEmitter.on(SESSION_EVENTS.SESSION_EXPIRED, handleSessionExpiredEvent);

    // Limpiar el listener al desmontar
    return () => {
      sessionEventEmitter.off(SESSION_EVENTS.SESSION_EXPIRED, handleSessionExpiredEvent);
    };
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

