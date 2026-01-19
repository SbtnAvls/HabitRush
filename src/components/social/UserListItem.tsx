import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { SocialUser, FollowListUser } from '../../types/social';
import { FollowButton } from './FollowButton';

interface UserListItemProps {
  user: SocialUser | FollowListUser;
  onPress: (user: SocialUser | FollowListUser) => void;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  showFollowButton?: boolean;
  showFollowsYouBadge?: boolean;
  isCurrentUser?: boolean;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onPress,
  onFollowChange,
  showFollowButton = true,
  showFollowsYouBadge = false,
  isCurrentUser = false,
}) => {
  const styles = useThemedStyles(baseStyles);

  const handleFollowChange = (isFollowing: boolean) => {
    onFollowChange?.(user.id, isFollowing);
  };

  const formatFollowersCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>
            {user.username}
          </Text>
          {showFollowsYouBadge && (
            <View style={styles.followsYouBadge}>
              <Text style={styles.followsYouText}>Te sigue</Text>
            </View>
          )}
        </View>
        <Text style={styles.followers}>
          {formatFollowersCount(user.followers_count)} seguidores
        </Text>
      </View>

      {/* Follow Button */}
      {showFollowButton && !isCurrentUser && (
        <FollowButton
          userId={user.id}
          isFollowing={user.is_following}
          onFollowChange={handleFollowChange}
          size="small"
        />
      )}

      {/* Current User Badge */}
      {isCurrentUser && (
        <View style={styles.youBadge}>
          <Text style={styles.youBadgeText}>Tú</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  followers: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  followsYouBadge: {
    backgroundColor: '#E8F8F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  followsYouText: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  youBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  youBadgeText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
  },
} as const;

export default UserListItem;
