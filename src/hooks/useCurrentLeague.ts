import { useState, useEffect, useCallback } from 'react';
import { LeagueService, CurrentLeagueResponse } from '../services/leagueService';
import { useAppContext } from '../context/AppContext';

interface UseCurrentLeagueReturn {
  data: CurrentLeagueResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personalizado para obtener la liga actual del usuario
 * Solo hace fetch si el usuario está autenticado
 */
export const useCurrentLeague = (): UseCurrentLeagueReturn => {
  const { isAuthenticated } = useAppContext();
  const [data, setData] = useState<CurrentLeagueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeague = useCallback(async () => {
    // Si no está autenticado, no hacer fetch
    if (!isAuthenticated) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await LeagueService.getCurrentLeague();
      setData(response);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching current league:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLeague();
  }, [fetchLeague]);

  return {
    data,
    loading,
    error,
    refetch: fetchLeague,
  };
};
