import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { SocialService } from '../../services/socialService';
import { SocialUser } from '../../types/social';
import { UserListItem } from './UserListItem';

interface UserSearchBarProps {
  onUserPress: (user: SocialUser) => void;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  placeholder?: string;
  currentUserId?: string;
}

export const UserSearchBar: React.FC<UserSearchBarProps> = ({
  onUserPress,
  onFollowChange,
  placeholder = 'Buscar usuarios...',
  currentUserId,
}) => {
  const styles = useThemedStyles(baseStyles);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SocialUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await SocialService.searchUsers(query);
        setResults(response.users);
        setHasSearched(true);
      } catch (err: any) {
        console.error('Search error:', err);
        setError('Error al buscar usuarios');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={24} color="#E74C3C" />
          <Text style={styles.emptyStateText}>{error}</Text>
        </View>
      );
    }

    if (query.length > 0 && query.length < 2) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Escribe al menos 2 caracteres</Text>
        </View>
      );
    }

    if (hasSearched && results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Sin resultados para "{query}"</Text>
        </View>
      );
    }

    // No mostrar nada si no ha buscado - el input es suficiente
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color="#6C757D" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#ADB5BD"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#6C757D" />
          </TouchableOpacity>
        )}
        {isLoading && (
          <ActivityIndicator size="small" color="#4ECDC4" style={styles.loader} />
        )}
      </View>

      {/* Results */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              onPress={onUserPress}
              onFollowChange={onFollowChange}
              isCurrentUser={item.id === currentUserId}
            />
          )}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const baseStyles = {
  container: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  clearButton: {
    padding: 4,
  },
  loader: {
    marginLeft: 8,
  },
  resultsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
  },
} as const;

export default UserSearchBar;
