import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, Settings, ThemePreference } from '../types';
import { StorageService } from '../services/storage';
import { HabitLogic } from '../services/habitLogic';
import { LeagueLogic } from '../services/leagueLogic';

interface AppContextType {
  state: AppState;
  loading: boolean;
  currentTheme: ThemePreference;
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

  const loadAppState = async () => {
    try {
      setLoading(true);
      let appState = await StorageService.loadAppState();
      
      // Verificar y resetear semana de liga si es necesario
      appState = await LeagueLogic.checkAndResetWeek(appState);
      
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
      const updatedState = await HabitLogic.markHabitCompleted(
        habitId,
        state,
        progressData,
        notes,
        images
      );
      setState(updatedState);
    } catch (error) {
      console.error('Error marking habit completed:', error);
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
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const completeChallenge = async (challengeId: string, habitId: string) => {
    try {
      const updatedState = await HabitLogic.completeChallengeAndReactivateHabit(
        challengeId,
        habitId,
        state
      );
      setState(updatedState);
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const activateHabit = async (habitId: string) => {
    try {
      const updatedState = await HabitLogic.activateHabit(habitId, state);
      setState(updatedState);
    } catch (error) {
      console.error('Error activating habit:', error);
    }
  };

  const deactivateHabit = async (habitId: string) => {
    try {
      const updatedState = await HabitLogic.deactivateHabit(habitId, state);
      setState(updatedState);
    } catch (error) {
      console.error('Error deactivating habit:', error);
    }
  };

  const redeemLifeChallenge = async (challengeId: string) => {
    try {
      const updatedState = await HabitLogic.redeemLifeChallenge(challengeId, state);
      setState(updatedState);
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

