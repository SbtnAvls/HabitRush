import { useState, useEffect, useCallback } from 'react';
import { LeagueService, LeagueHistoryAPI } from '../services/leagueService';
import { useAppContext } from '../context/AppContext';

interface UseLeagueHistoryReturn {
  data: LeagueHistoryAPI[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personalizado para obtener el historial de ligas del usuario
 * Solo hace fetch si el usuario está autenticado
 */
export const useLeagueHistory = (): UseLeagueHistoryReturn => {
  const { isAuthenticated } = useAppContext();
  const [data, setData] = useState<LeagueHistoryAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    // Si no está autenticado, no hacer fetch
    if (!isAuthenticated) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await LeagueService.getLeagueHistory();
      setData(response);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching league history:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    loading,
    error,
    refetch: fetchHistory,
  };
};
