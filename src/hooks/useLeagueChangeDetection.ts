import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeagueService, LeagueHistoryAPI } from '../services/leagueService';
import { useAppContext } from '../context/AppContext';

const LAST_SEEN_LEAGUE_RESULT_KEY = '@habitrush_last_seen_league_result';

export interface LeagueChangeData {
  changeType: 'promoted' | 'relegated' | 'stayed';
  toLeague: string;
  position: number;
  weeklyXp: number;
  weekStart: string;
}

interface UseLeagueChangeDetectionReturn {
  pendingChange: LeagueChangeData | null;
  loading: boolean;
  dismissChange: () => Promise<void>;
  checkForChanges: () => Promise<void>;
}

/**
 * Hook para detectar cambios de liga (promocion/descenso)
 * Compara el historial con el ultimo resultado visto
 */
export const useLeagueChangeDetection = (): UseLeagueChangeDetectionReturn => {
  const { isAuthenticated } = useAppContext();
  const [pendingChange, setPendingChange] = useState<LeagueChangeData | null>(null);
  const [loading, setLoading] = useState(false);

  const checkForChanges = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingChange(null);
      return;
    }

    try {
      setLoading(true);

      // Obtener historial de ligas
      const history = await LeagueService.getLeagueHistory();

      if (!history || history.length === 0) {
        return;
      }

      // El resultado mas reciente
      const latestResult = history[0];

      // Obtener el ultimo resultado que el usuario ya vio
      const lastSeenJson = await AsyncStorage.getItem(LAST_SEEN_LEAGUE_RESULT_KEY);
      const lastSeen = lastSeenJson ? JSON.parse(lastSeenJson) : null;

      // Si no hay resultado previo o el resultado es nuevo
      if (!lastSeen || lastSeen.weekStart !== latestResult.weekStart) {
        // Solo mostrar si fue promocion o descenso (no 'stayed' la primera vez)
        if (latestResult.changeType === 'promoted' || latestResult.changeType === 'relegated') {
          setPendingChange({
            changeType: latestResult.changeType,
            toLeague: latestResult.leagueName,
            position: latestResult.position,
            weeklyXp: latestResult.weeklyXp,
            weekStart: latestResult.weekStart,
          });
        } else if (lastSeen) {
          // Si ya habia visto un resultado antes y ahora 'stayed', tambien mostrar
          setPendingChange({
            changeType: latestResult.changeType,
            toLeague: latestResult.leagueName,
            position: latestResult.position,
            weeklyXp: latestResult.weeklyXp,
            weekStart: latestResult.weekStart,
          });
        }
      }
    } catch (error) {
      console.error('Error checking for league changes:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const dismissChange = useCallback(async () => {
    if (pendingChange) {
      // Guardar que el usuario ya vio este resultado
      await AsyncStorage.setItem(
        LAST_SEEN_LEAGUE_RESULT_KEY,
        JSON.stringify({
          weekStart: pendingChange.weekStart,
          changeType: pendingChange.changeType,
        })
      );
      setPendingChange(null);
    }
  }, [pendingChange]);

  // Verificar cambios al montar y cuando cambia autenticacion
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  return {
    pendingChange,
    loading,
    dismissChange,
    checkForChanges,
  };
};
