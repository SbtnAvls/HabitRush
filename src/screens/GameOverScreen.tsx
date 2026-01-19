import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { RevivalChallengeFlow } from '../components/RevivalChallengeFlow';
import { useAppContext } from '../context/AppContext';

type RevivalMethod = 'none' | 'challenge';

const { width: screenWidth } = Dimensions.get('window');

export const GameOverScreen: React.FC = () => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();
  const { refreshState } = useAppContext();

  const [revivalMethod, setRevivalMethod] = useState<RevivalMethod>('none');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRevivalSuccess = async () => {
    setLoading(true);
    try {
      // Refrescar estado completo
      await refreshState();
      // La navegación debería manejarse automáticamente cuando el estado se actualice
    } catch (error) {
      console.error('Error refreshing after revival:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Actualizando estado...</Text>
      </View>
    );
  }

  // Flujo de resurrección con challenges
  if (revivalMethod === 'challenge') {
    return (
      <RevivalChallengeFlow
        onSuccess={handleRevivalSuccess}
        onBack={() => setRevivalMethod('none')}
      />
    );
  }

  // Pantalla principal de Game Over
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Ilustración de Game Over */}
        <View style={styles.illustrationContainer}>
          <Icon name="skull" size={100} color="#FF4444" />
          <View style={styles.brokenHeartsContainer}>
            <Icon name="heart-broken" size={40} color="#FFB0B0" style={styles.brokenHeart1} />
            <Icon name="heart-broken" size={40} color="#FFB0B0" style={styles.brokenHeart2} />
          </View>
        </View>

        {/* Título y mensaje */}
        <Text style={styles.title}>¡Te quedaste sin vidas!</Text>
        <Text style={styles.subtitle}>
          Tus hábitos están bloqueados hasta que revivas
        </Text>

        {/* Información de por qué perdiste vidas */}
        <View style={styles.infoCard}>
          <Icon name="information-outline" size={20} color="#FF6B6B" />
          <Text style={styles.infoText}>
            Perdiste vidas por no completar tus hábitos diarios.
            Para recuperar el acceso, debes completar un reto.
          </Text>
        </View>

        {/* Opción de resurrección */}
        <View style={styles.revivalOptions}>
          <Text style={styles.optionsTitle}>¿Cómo revivir?</Text>

          {/* Única opción: Reto de penitencia */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setRevivalMethod('challenge')}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconContainer}>
              <Icon name="target" size={40} color="#4ECDC4" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Completar Reto de Penitencia</Text>
              <Text style={styles.optionDescription}>
                Completa un reto asignado y envía pruebas (foto/texto) para ser validado
              </Text>
              <View style={styles.optionBadge}>
                <Icon name="camera" size={14} color="#4ECDC4" />
                <Text style={styles.optionBadgeText}>Requiere pruebas</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Consejo:</Text>
          <Text style={styles.tipsText}>
            Completa tus hábitos a tiempo para no perder vidas.
            Los Life Challenges te ayudan a recuperar vidas mientras estés vivo, ¡pero no pueden usarse para revivir!
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 30,
    position: 'relative',
  },
  brokenHeartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brokenHeart1: {
    position: 'absolute',
    left: screenWidth * 0.25,
    top: 20,
    transform: [{ rotate: '-15deg' }],
  },
  brokenHeart2: {
    position: 'absolute',
    right: screenWidth * 0.25,
    top: 20,
    transform: [{ rotate: '15deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFE6E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  revivalOptions: {
    marginTop: 10,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 8,
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  optionBadgeText: {
    fontSize: 11,
    color: '#6C757D',
    marginLeft: 4,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#E8F8F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
} as const;

export default GameOverScreen;