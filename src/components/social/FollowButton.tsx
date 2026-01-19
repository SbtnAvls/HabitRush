import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { SocialService } from '../../services/socialService';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  size = 'medium',
  disabled = false,
}) => {
  const styles = useThemedStyles(baseStyles);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    // Optimistic update
    const newState = !isFollowing;
    setIsFollowing(newState);
    onFollowChange?.(newState);

    try {
      await SocialService.toggleFollow(userId, !newState);
    } catch (error) {
      // Rollback on error
      setIsFollowing(!newState);
      onFollowChange?.(!newState);
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = [
    styles.button,
    size === 'small' ? styles.buttonSmall : styles.buttonMedium,
    isFollowing ? styles.buttonFollowing : styles.buttonFollow,
    disabled && styles.buttonDisabled,
  ];

  const textStyle = [
    styles.text,
    size === 'small' ? styles.textSmall : styles.textMedium,
    isFollowing ? styles.textFollowing : styles.textFollow,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={isLoading || disabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? '#6C757D' : '#FFFFFF'}
        />
      ) : (
        <Text style={textStyle}>
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = {
  button: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
  },
  buttonMedium: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
  },
  buttonFollow: {
    backgroundColor: '#4ECDC4',
  },
  buttonFollowing: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textFollow: {
    color: '#FFFFFF',
  },
  textFollowing: {
    color: '#6C757D',
  },
} as const;

export default FollowButton;
