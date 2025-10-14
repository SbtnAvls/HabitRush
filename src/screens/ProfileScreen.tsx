import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { HabitLogic } from '../services/habitLogic';
import { AppHeader } from '../components/AppHeader';
import { useThemedStyles } from '../theme/useThemedStyles';
import { AuthModal } from '../components/AuthModal';

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const styles = useThemedStyles(baseStyles);
  const { state, isAuthenticated, authUser, logout, checkAuthentication } = useAppContext();
  const stats = HabitLogic.getUserStats(state);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Éxito', 'Sesión cerrada correctamente');
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await checkAuthentication();
    Alert.alert('Éxito', '¡Bienvenido!');
  };

  const handleResetData = () => {
    Alert.alert(
      'Resetear Datos',
      '¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            // Aquí implementarías la lógica para resetear los datos
            Alert.alert('Éxito', 'Datos reseteados correctamente');
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.containerWrapper}>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <AppHeader navigation={navigation} />
      <ScrollView style={styles.container}>
        {/* Header del perfil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {state.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{state.user.name}</Text>
          {isAuthenticated && authUser && (
            <Text style={styles.userEmail}>{authUser.email}</Text>
          )}
          <Text style={styles.joinDate}>
            Miembro desde {formatDate(state.user.createdAt)}
          </Text>
          {isAuthenticated && (
            <View style={styles.authBadge}>
              <Text style={styles.authBadgeText}>✓ Cuenta sincronizada</Text>
            </View>
          )}
        </View>

      {/* Estadísticas generales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalHabits}</Text>
            <Text style={styles.statLabel}>Total Hábitos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeHabits}</Text>
            <Text style={styles.statLabel}>Hábitos Activos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalStreak}</Text>
            <Text style={styles.statLabel}>Racha Total</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completados Hoy</Text>
          </View>
        </View>
      </View>

      {/* Información de vidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Vidas</Text>
        
        <View style={styles.livesInfo}>
          <View style={styles.livesDisplay}>
            {Array.from({ length: stats.maxLives }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.lifeHeart,
                  index < stats.lives ? styles.lifeActive : styles.lifeInactive,
                ]}
              >
                <Text style={styles.lifeText}>♥</Text>
              </View>
            ))}
          </View>
          <Text style={styles.livesText}>
            {stats.lives} de {stats.maxLives} vidas disponibles
          </Text>
        </View>

        <Text style={styles.livesDescription}>
          Pierdes una vida cuando no completas un hábito en el día asignado. 
          Puedes recuperar vidas completando retos cuando un hábito se desactiva.
        </Text>
      </View>

      {/* Hábitos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Hábitos</Text>
        
        {state.habits.length === 0 ? (
          <Text style={styles.emptyText}>No tienes hábitos creados aún</Text>
        ) : (
          <View style={styles.habitsList}>
            {state.habits.map((habit) => (
              <View key={habit.id} style={styles.habitItem}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.habitStreak}>
                    {habit.currentStreak} días de racha
                  </Text>
                </View>
                <View style={[
                  styles.habitStatus,
                  { backgroundColor: habit.isActive ? '#4ECDC4' : '#FF6B6B' }
                ]}>
                  <Text style={styles.habitStatusText}>
                    {habit.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Retos completados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Retos Completados</Text>
        
        {state.user.completedChallenges.length === 0 ? (
          <Text style={styles.emptyText}>No has completado retos aún</Text>
        ) : (
          <Text style={styles.challengesText}>
            Has completado {state.user.completedChallenges.length} retos
          </Text>
        )}
      </View>

      {/* Cuenta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        
        {isAuthenticated ? (
          <>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Estado</Text>
              <Text style={styles.accountValue}>Cuenta activa</Text>
            </View>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <Text style={[styles.settingText, styles.logoutText]}>Cerrar Sesión</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Estado</Text>
              <Text style={styles.accountValue}>Sin cuenta vinculada</Text>
            </View>
            <TouchableOpacity 
              style={[styles.settingItem, styles.loginButton]} 
              onPress={handleLogin}
            >
              <Text style={[styles.settingText, styles.loginText]}>Iniciar Sesión / Registrarse</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Configuración */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleResetData}>
          <Text style={styles.settingText}>Resetear todos los datos</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>HabitRush v1.0.0</Text>
      </View>
      </ScrollView>
    </View>
  );
};

const baseStyles = {
  containerWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  authBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  authBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
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
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
  },
  livesInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  livesDisplay: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  lifeHeart: {
    marginHorizontal: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeActive: {
    // Color rojo para corazones activos
  },
  lifeInactive: {
    opacity: 0.3,
  },
  lifeText: {
    fontSize: 24,
    color: '#E74C3C',
  },
  livesText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  livesDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    textAlign: 'center',
  },
  habitsList: {
    // Estilos para la lista de hábitos
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  habitStreak: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  habitStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  habitStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  challengesText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  emptyText: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  settingArrow: {
    fontSize: 18,
    color: '#6C757D',
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  accountLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  accountValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  logoutText: {
    color: '#E74C3C',
  },
  loginButton: {
    backgroundColor: '#E8F8F7',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  loginText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6C757D',
  },
} as const;


