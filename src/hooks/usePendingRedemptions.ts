import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PendingRedemption } from '../types';
import {
  PendingRedemptionService,
  RedeemLifeResponse,
  RedeemChallengeResponse,
  CompleteChallengeResponse,
} from '../services/pendingRedemptionService';
import { useAppContext } from '../context/AppContext';

// Intervalo de polling en ms (30 segundos según documentación del backend)
const POLLING_INTERVAL = 30 * 1000;

// Intervalo para actualizar countdown local (1 segundo)
const COUNTDOWN_INTERVAL = 1000;

// Umbral para considerar un pending como urgente (3 horas)
const URGENT_THRESHOLD_MS = 3 * 60 * 60 * 1000;

interface UsePendingRedemptionsOptions {
  /** Callback cuando el usuario pierde todas las vidas (is_dead: true) */
  onUserDead?: () => void;
}

interface UsePendingRedemptionsReturn {
  // Estado
  pendingRedemptions: PendingRedemption[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean;

  // Acciones
  refresh: () => Promise<void>;
  redeemLife: (pendingId: string) => Promise<RedeemLifeResponse>;
  redeemChallenge: (pendingId: string, challengeId: string) => Promise<RedeemChallengeResponse>;
  completeChallenge: (
    pendingId: string,
    proofText?: string,
    proofImageUrl?: string
  ) => Promise<CompleteChallengeResponse>;

  // Helpers computados
  hasActivePendings: boolean;
  activePendingsCount: number;
  urgentPendings: PendingRedemption[];
  pendingWithChallenge: PendingRedemption | null;
}

/**
 * Hook para manejar el sistema de Pending Redemptions (24h de gracia)
 *
 * Características:
 * - Carga automática al montar (si está autenticado)
 * - Polling cada 60s cuando hay pendings activos (silencioso, sin loading)
 * - Countdown local que actualiza cada segundo
 * - Acciones para resolver pendings
 * - Helpers para UI (urgentes, con challenge asignado, etc.)
 */
export const usePendingRedemptions = (
  options: UsePendingRedemptionsOptions = {}
): UsePendingRedemptionsReturn => {
  const { onUserDead } = options;
  const { isAuthenticated, refreshState } = useAppContext();

  const [pendingRedemptions, setPendingRedemptions] = useState<PendingRedemption[]>([]);
  const [loading, setLoading] = useState(true); // true inicialmente para mostrar loading
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs para evitar race conditions y loops
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);
  const pendingRedemptionsRef = useRef<PendingRedemption[]>([]);

  /**
   * Obtiene los pending redemptions del servidor
   * @param showLoading - Si true, muestra el estado de loading (solo para carga inicial)
   */
  const fetchPendings = useCallback(async (showLoading = false) => {
    // Evitar llamadas simultáneas
    if (isFetchingRef.current) {
      return;
    }

    if (!isAuthenticated) {
      setPendingRedemptions([]);
      setLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;

      // Solo mostrar loading en carga inicial o refresh manual
      if (showLoading) {
        setLoading(true);
      }

      setError(null);
      const response = await PendingRedemptionService.getPendingRedemptions();
      setPendingRedemptions(response.pending_redemptions);
      pendingRedemptionsRef.current = response.pending_redemptions; // Mantener ref actualizado
      lastFetchTimeRef.current = Date.now();
    } catch (err: any) {
      console.error('Error fetching pending redemptions:', err);
      // Solo setear error si no hay datos previos (no perder datos por error de polling)
      if (pendingRedemptionsRef.current.length === 0 || showLoading) {
        setError(err?.message || 'Error al cargar pending redemptions');
      }
    } finally {
      isFetchingRef.current = false;
      if (showLoading || isInitialLoadRef.current) {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  }, [isAuthenticated]); // Solo depende de isAuthenticated, usa refs para el resto

  /**
   * Actualiza el time_remaining_ms localmente cada segundo
   */
  const updateLocalCountdown = useCallback(() => {
    if (lastFetchTimeRef.current === 0) return;

    setPendingRedemptions(prev => {
      const updated = prev.map(p => ({
        ...p,
        time_remaining_ms: Math.max(0, p.time_remaining_ms - COUNTDOWN_INTERVAL),
      }));
      pendingRedemptionsRef.current = updated; // Mantener ref sincronizado
      return updated;
    });
  }, []);

  /**
   * Acepta perder una vida
   * IMPORTANTE: Si is_dead=true en la respuesta, se llama a onUserDead
   */
  const redeemLife = useCallback(
    async (pendingId: string): Promise<RedeemLifeResponse> => {
      try {
        setActionLoading(true);
        setError(null);
        const response = await PendingRedemptionService.redeemLife(pendingId);

        // Refrescar pendings y estado global (vidas) en paralelo
        await Promise.all([
          fetchPendings(false),
          refreshState()
        ]);

        // Si el usuario perdió todas las vidas, notificar
        if (response.is_dead && onUserDead) {
          onUserDead();
        }

        return response;
      } catch (err: any) {
        console.error('Error redeeming life:', err);
        setError(err?.message || 'Error al aceptar perder vida');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPendings, refreshState, onUserDead]
  );

  /**
   * Elige un challenge para intentar salvarse
   */
  const redeemChallenge = useCallback(
    async (pendingId: string, challengeId: string): Promise<RedeemChallengeResponse> => {
      try {
        setActionLoading(true);
        setError(null);
        const response = await PendingRedemptionService.redeemChallenge(pendingId, challengeId);

        // Refrescar pendings para actualizar estado
        await fetchPendings(false);

        return response;
      } catch (err: any) {
        console.error('Error redeeming with challenge:', err);
        setError(err?.message || 'Error al elegir challenge');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPendings]
  );

  /**
   * Envía pruebas de completación del challenge
   */
  const completeChallenge = useCallback(
    async (
      pendingId: string,
      proofText?: string,
      proofImageUrl?: string
    ): Promise<CompleteChallengeResponse> => {
      try {
        setActionLoading(true);
        setError(null);
        const response = await PendingRedemptionService.completeChallenge(
          pendingId,
          proofText,
          proofImageUrl
        );

        // Refrescar pendings y estado global en paralelo
        await Promise.all([
          fetchPendings(false),
          refreshState()
        ]);

        return response;
      } catch (err: any) {
        console.error('Error completing challenge:', err);
        setError(err?.message || 'Error al enviar pruebas');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPendings, refreshState]
  );

  // Helpers computados con useMemo para evitar recálculos innecesarios
  const activePendings = useMemo(() =>
    pendingRedemptions.filter(
      p => p.status === 'pending' || p.status === 'challenge_assigned'
    ),
    [pendingRedemptions]
  );

  const hasActivePendings = activePendings.length > 0;
  const activePendingsCount = activePendings.length;

  const urgentPendings = useMemo(() =>
    activePendings.filter(p => p.time_remaining_ms <= URGENT_THRESHOLD_MS),
    [activePendings]
  );

  const pendingWithChallenge = useMemo(() =>
    pendingRedemptions.find(p => p.status === 'challenge_assigned') || null,
    [pendingRedemptions]
  );

  // Carga inicial - solo una vez
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendings(true); // Con loading visible
    } else {
      setPendingRedemptions([]);
      setLoading(false);
    }
  }, [isAuthenticated]); // Solo depende de isAuthenticated

  // Polling: usar ref para el estado de hasActivePendings para evitar recrear el intervalo
  useEffect(() => {
    // Limpiar polling anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Solo hacer polling si está autenticado
    if (!isAuthenticated) {
      return;
    }

    // Iniciar polling (verificará internamente si hay pendings activos usando ref)
    pollingRef.current = setInterval(() => {
      // Usar ref para evitar stale closure
      const currentPendings = pendingRedemptionsRef.current;
      const hasActive = currentPendings.some(
        p => p.status === 'pending' || p.status === 'challenge_assigned'
      );
      if (hasActive) {
        fetchPendings(false); // Silencioso, sin loading
      }
    }, POLLING_INTERVAL);

    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isAuthenticated]); // NO incluir activePendings ni fetchPendings para evitar recrear el intervalo

  // Countdown local - actualiza cada segundo cuando hay pendings activos
  useEffect(() => {
    // Limpiar countdown anterior
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // Solo hacer countdown si hay pendings activos
    if (hasActivePendings) {
      countdownRef.current = setInterval(updateLocalCountdown, COUNTDOWN_INTERVAL);
    }

    // Cleanup
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [hasActivePendings, updateLocalCountdown]);

  // Función de refresh manual (con loading visible)
  const refresh = useCallback(() => fetchPendings(true), [fetchPendings]);

  return {
    // Estado
    pendingRedemptions,
    loading,
    error,
    actionLoading,

    // Acciones
    refresh,
    redeemLife,
    redeemChallenge,
    completeChallenge,

    // Helpers
    hasActivePendings,
    activePendingsCount,
    urgentPendings,
    pendingWithChallenge,
  };
};
