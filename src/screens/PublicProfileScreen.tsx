import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { SocialService } from '../services/socialService';
import { PublicProfile, getLeagueName, getLeagueColor } from '../types/social';
import { FollowButton } from '../components/social/FollowButton';
import { useAppContext } from '../context/AppContext';

interface PublicProfileScreenProps {
  route: {
    params: {
      userId: string;
    };
  };
  navigation: any;
}

export const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({
  route,
  navigation,
}) => {
  const { userId } = route.params;
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const { authUser } = useAppContext();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await SocialService.getPublicProfile(userId);
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('No se pudo cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowersPress = () => {
    navigation.navigate('FollowList', {
      userId,
      type: 'followers',
      username: profile?.username,
    });
  };

  const handleFollowingPress = () => {
    navigation.navigate('FollowList', {
      userId,
      type: 'following',
      username: profile?.username,
    });
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        is_following: isFollowing,
        followers_count: profile.followers_count + (isFollowing ? 1 : -1),
      });
    }
  };

  // Volver al perfil principal (evita acumulación de pantallas)
  const handleGoBack = () => {
    navigation.popToTop();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Usuario no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con botón atrás */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.username}>{profile.username}</Text>

          {/* Follows You Badge */}
          {profile.follows_you && !isOwnProfile && (
            <View style={styles.followsYouBadge}>
              <Text style={styles.followsYouText}>Te sigue</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
              <Text style={styles.statNumber}>{profile.followers_count}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
              <Text style={styles.statNumber}>{profile.following_count}</Text>
              <Text style={styles.statLabel}>Siguiendo</Text>
            </TouchableOpacity>
          </View>

          {/* Follow Button */}
          {!isOwnProfile && (
            <FollowButton
              userId={userId}
              isFollowing={profile.is_following}
              onFollowChange={handleFollowChange}
              size="medium"
            />
          )}
        </View>

        {/* Stats Section */}
        {profile.stats ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estadisticas</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
                <Text style={styles.statCardNumber}>{profile.stats.max_streak}</Text>
                <Text style={styles.statCardLabel}>Max Racha</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                <Text style={styles.statCardNumber}>{profile.stats.total_completions}</Text>
                <Text style={styles.statCardLabel}>Completados</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={24} color="#9B59B6" />
                <Text style={styles.statCardNumber}>{profile.stats.member_since_days}</Text>
                <Text style={styles.statCardLabel}>Dias activo</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="list" size={24} color="#3498DB" />
                <Text style={styles.statCardNumber}>{profile.stats.total_habits}</Text>
                <Text style={styles.statCardLabel}>Habitos</Text>
              </View>
            </View>

            {/* League Info */}
            <View style={[styles.leagueCard, { borderColor: getLeagueColor(profile.stats.league) }]}>
              <Ionicons name="trophy" size={28} color={getLeagueColor(profile.stats.league)} />
              <View style={styles.leagueInfo}>
                <Text style={styles.leagueName}>{getLeagueName(profile.stats.league)}</Text>
                {profile.stats.league_position && (
                  <Text style={styles.leaguePosition}>
                    Posicion #{profile.stats.league_position}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.privateSection}>
            <Ionicons name="lock-closed" size={40} color="#6C757D" />
            <Text style={styles.privateText}>Este perfil es privado</Text>
            <Text style={styles.privateSubtext}>
              Solo puedes ver informacion basica de este usuario
            </Text>
          </View>
        )}

        {/* Member Since */}
        <View style={styles.memberSince}>
          <Ionicons name="time-outline" size={16} color="#6C757D" />
          <Text style={styles.memberSinceText}>
            Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  followsYouBadge: {
    backgroundColor: '#E8F8F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  followsYouText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E9ECEF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginTop: 4,
  },
  leagueInfo: {
    marginLeft: 12,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  leaguePosition: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  privateSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 32,
    alignItems: 'center',
  },
  privateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 12,
  },
  privateSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  memberSinceText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 6,
  },
} as const;

export default PublicProfileScreen;
