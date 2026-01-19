import { useState, useEffect, useCallback } from 'react';
import { SocialService } from '../services/socialService';
import { PublicProfile } from '../types/social';

interface UseSocialProfileResult {
  profile: PublicProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateFollowStatus: (isFollowing: boolean) => void;
}

/**
 * Hook para cargar y manejar un perfil social
 * @param userId - ID del usuario a cargar
 */
export const useSocialProfile = (userId: string | undefined): UseSocialProfileResult => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await SocialService.getPublicProfile(userId);
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Actualización optimista del estado de follow
  const updateFollowStatus = useCallback((isFollowing: boolean) => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        is_following: isFollowing,
        followers_count: prev.followers_count + (isFollowing ? 1 : -1),
      };
    });
  }, []);

  return {
    profile,
    isLoading,
    error,
    refresh,
    updateFollowStatus,
  };
};

export default useSocialProfile;
