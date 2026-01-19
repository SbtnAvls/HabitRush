import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { SocialService } from '../services/socialService';
import { FollowListUser } from '../types/social';
import { UserListItem } from '../components/social/UserListItem';
import { useAppContext } from '../context/AppContext';

interface FollowListScreenProps {
  route: {
    params: {
      userId: string;
      type: 'followers' | 'following';
      username?: string;
    };
  };
  navigation: any;
}

export const FollowListScreen: React.FC<FollowListScreenProps> = ({
  route,
  navigation,
}) => {
  const { userId, type, username } = route.params;
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const { authUser } = useAppContext();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<FollowListUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = type === 'followers' ? 'Seguidores' : 'Siguiendo';

  useEffect(() => {
    loadUsers(1, true);
  }, [userId, type]);

  const loadUsers = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = type === 'followers'
        ? await SocialService.getFollowers(userId, pageNum)
        : await SocialService.getFollowing(userId, pageNum);

      // Si estoy viendo MI lista de "siguiendo", todos esos usuarios ya los sigo
      // Forzar is_following: true porque la API no lo devuelve correctamente
      const isMyFollowingList = type === 'following' && userId === authUser?.id;
      const processedUsers = isMyFollowingList
        ? response.users.map(user => ({ ...user, is_following: true }))
        : response.users;

      if (reset) {
        setUsers(processedUsers);
      } else {
        setUsers(prev => [...prev, ...processedUsers]);
      }

      setPage(pageNum);
      setHasMore(pageNum < response.totalPages);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('No se pudo cargar la lista');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadUsers(1, true);
  }, [userId, type]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      loadUsers(page + 1, false);
    }
  };

  const handleUserPress = (user: FollowListUser) => {
    navigation.push('PublicProfile', { userId: user.id });
  };

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === targetUserId
          ? { ...user, is_following: isFollowing }
          : user
      )
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    const emptyMessage = type === 'followers'
      ? 'No tiene seguidores aun'
      : 'No sigue a nadie aun';

    const emptyIcon = type === 'followers' ? 'people-outline' : 'person-add-outline';

    return (
      <View style={styles.emptyState}>
        <Ionicons name={emptyIcon} size={60} color="#6C757D" />
        <Text style={styles.emptyStateText}>{emptyMessage}</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4ECDC4" />
      </View>
    );
  };

  if (isLoading && users.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            {username && (
              <Text style={styles.headerSubtitle}>@{username}</Text>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      </View>
    );
  }

  if (error && users.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            {username && (
              <Text style={styles.headerSubtitle}>@{username}</Text>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadUsers(1, true)}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          {username && (
            <Text style={styles.headerSubtitle}>@{username}</Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserListItem
            user={item}
            onPress={handleUserPress}
            onFollowChange={handleFollowChange}
            isCurrentUser={item.id === authUser?.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4ECDC4']}
            tintColor="#4ECDC4"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
      />
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  headerRight: {
    width: 32,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
} as const;

export default FollowListScreen;
