import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../theme/useTheme';
import { useFontScale } from '../theme/useFontScale';
import { AppTheme } from '../theme';
import { AuthModal } from './AuthModal';

interface AppHeaderProps {
  navigation?: any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ navigation }) => {
  const { state, isAuthenticated, authUser, checkAuthentication, refreshState } = useAppContext();
  const theme = useTheme();
  const { scale } = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, scale), [theme, scale]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const handleSettingsPress = () => {
    setMenuVisible(false);
    navigation?.navigate('Settings');
  };

  const handleLoginPress = () => {
    setAuthModalVisible(true);
  };

  const handleAuthSuccess = async () => {
    setAuthModalVisible(false);
    await checkAuthentication();
    await refreshState();
  };

  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.leftSection}>
        {isAuthenticated && authUser ? (
          <>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {getUserInitials(authUser.name)}
              </Text>
            </View>
            <Text style={styles.userName}>{authUser.name}</Text>
          </>
        ) : (
          <TouchableOpacity onPress={handleLoginPress}>
            <Text style={styles.loginText}>Iniciar sesión/Registrarse</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <FeatherIcon
            name="more-vertical"
            size={24 * scale}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSettingsPress}
            >
              <FeatherIcon
                name="settings"
                size={18 * scale}
                color={theme.colors.textSecondary}
                style={styles.menuItemIcon}
              />
              <Text style={styles.menuItemText}>Configuraciones</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </View>
  );
};

const createStyles = (theme: AppTheme, scale: number) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: theme.colors.textOnPrimary,
      fontSize: 16 * scale,
      fontWeight: 'bold',
    },
    userName: {
      fontSize: 18 * scale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    loginText: {
      fontSize: 16 * scale,
      fontWeight: '600',
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuButton: {
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingRight: 16,
    },
    menuContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      minWidth: 200,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: theme.name === 'dark' ? 0.6 : 0.25,
      shadowRadius: 3.84,
      elevation: 6,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuItemIcon: {
      marginRight: 12,
    },
    menuItemText: {
      fontSize: 16 * scale,
      color: theme.colors.textPrimary,
    },
  });

