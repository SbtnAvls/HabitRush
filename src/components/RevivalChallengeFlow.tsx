import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useThemedStyles } from '../theme/useThemedStyles';
import { useTheme } from '../theme/useTheme';
import { RevivalService, RevivalChallenge } from '../services/revivalService';

interface RevivalChallengeFlowProps {
  onSuccess: () => void;
  onBack?: () => void;
}

type FlowStep = 'list' | 'proof' | 'validating' | 'success' | 'failed';

export const RevivalChallengeFlow: React.FC<RevivalChallengeFlowProps> = ({
  onSuccess,
  onBack,
}) => {
  const styles = useThemedStyles(baseStyles);
  const theme = useTheme();

  const [step, setStep] = useState<FlowStep>('list');
  const [challenges, setChallenges] = useState<RevivalChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<RevivalChallenge | null>(null);
  const [proofText, setProofText] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Cargar challenges disponibles
  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await RevivalService.getAvailableChallenges();
      if (response.challenges.length === 0) {
        setError('No tienes retos asignados. Primero asigna retos a tus hábitos.');
      } else {
        setChallenges(response.challenges);
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar los retos');
    } finally {
      setLoading(false);
    }
  };

  const selectChallenge = (challenge: RevivalChallenge) => {
    setSelectedChallenge(challenge);
    setStep('proof');
    setProofText('');
    setProofImage(null);
  };

  const pickImage = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProofImage(asset.uri || null);
      }
    });
  };

  const submitProof = async () => {
    if (!selectedChallenge) return;

    // Validar pruebas localmente primero
    const validationError = RevivalService.validateProof(proofText, proofImage ? 1000000 : 0);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setStep('validating');
    setLoading(true);
    setError(null);

    try {
      // TODO: Subir imagen a CDN si existe
      let imageUrl: string | undefined;
      if (proofImage) {
        // Aquí deberías implementar la subida a Cloudinary u otro CDN
        imageUrl = proofImage; // Por ahora usamos la URI local
      }

      const result = await RevivalService.submitProof(
        selectedChallenge.user_challenge_id,
        proofText,
        imageUrl
      );

      setValidationResult(result.validationResult);

      if (result.success) {
        setStep('success');
        // Esperar un momento para mostrar el éxito antes de navegar
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setStep('failed');
      }
    } catch (error: any) {
      setError(error.message || 'Error al enviar las pruebas');
      setStep('proof');
    } finally {
      setLoading(false);
    }
  };

  const renderChallengesList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Completa un Reto para Revivir</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadChallenges}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.challengesList}>
          <Text style={styles.subtitle}>
            Completa uno de estos retos y envía pruebas para recuperar todas tus vidas
          </Text>

          {challenges.map(challenge => (
            <TouchableOpacity
              key={challenge.user_challenge_id}
              style={styles.challengeCard}
              onPress={() => selectChallenge(challenge)}
              activeOpacity={0.8}
            >
              <View style={styles.challengeHeader}>
                <View style={[
                  styles.difficultyBadge,
                  challenge.difficulty === 'easy' && { backgroundColor: '#D4EDDA' },
                  challenge.difficulty === 'medium' && { backgroundColor: '#FFF3CD' },
                  challenge.difficulty === 'hard' && { backgroundColor: '#FFE6E6' },
                ]}>
                  <Text style={[
                    styles.difficultyText,
                    challenge.difficulty === 'easy' && { color: '#155724' },
                    challenge.difficulty === 'medium' && { color: '#856404' },
                    challenge.difficulty === 'hard' && { color: '#721C24' },
                  ]}>
                    {challenge.difficulty === 'easy' ? 'Fácil' :
                     challenge.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                  </Text>
                </View>
                <Text style={styles.habitName}>{challenge.habit_name}</Text>
              </View>

              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>

              <View style={styles.challengeFooter}>
                <Icon name="camera" size={16} color="#6C757D" />
                <Text style={styles.challengeFooterText}>Requiere pruebas</Text>
                <Icon name="chevron-right" size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderProofForm = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.proofContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('list')} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Enviar Pruebas</Text>
        </View>

        {selectedChallenge && (
          <View style={styles.selectedChallengeInfo}>
            <Text style={styles.selectedChallengeTitle}>{selectedChallenge.title}</Text>
            <Text style={styles.selectedChallengeDescription}>{selectedChallenge.description}</Text>
          </View>
        )}

        <View style={styles.proofSection}>
          <Text style={styles.sectionTitle}>📝 Descripción (requerida)</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={6}
            placeholder="Describe detalladamente cómo completaste el reto. Incluye detalles específicos: ¿Qué hiciste? ¿Dónde? ¿Por cuánto tiempo? ¿Qué lograste?"
            placeholderTextColor="#94A3B8"
            value={proofText}
            onChangeText={setProofText}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {proofText.length} caracteres (mínimo 20)
          </Text>
        </View>

        <View style={styles.proofSection}>
          <Text style={styles.sectionTitle}>📷 Foto (opcional pero recomendada)</Text>

          {proofImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: proofImage }} style={styles.proofImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setProofImage(null)}
              >
                <Icon name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Icon name="camera-plus" size={40} color="#4ECDC4" />
              <Text style={styles.imagePickerText}>Agregar foto como prueba</Text>
              <Text style={styles.imagePickerHint}>
                Una foto aumenta la credibilidad de tu prueba
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!proofText || proofText.length < 20) && styles.submitButtonDisabled,
          ]}
          onPress={submitProof}
          disabled={!proofText || proofText.length < 20}
        >
          <Icon name="send" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitButtonText}>Enviar Pruebas para Validación</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Icon name="information" size={20} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Tus pruebas serán validadas por IA. Sé específico y honesto.
            Si las pruebas son aprobadas, recuperarás todas tus vidas.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderValidating = () => (
    <View style={styles.validatingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.validatingTitle}>Validando tus pruebas...</Text>
      <Text style={styles.validatingSubtitle}>
        La IA está analizando tu evidencia
      </Text>
      <View style={styles.validatingSteps}>
        <View style={styles.validatingStep}>
          <Icon name="check-circle" size={24} color="#4ECDC4" />
          <Text style={styles.validatingStepText}>Pruebas recibidas</Text>
        </View>
        <View style={styles.validatingStep}>
          <ActivityIndicator size="small" color="#4ECDC4" />
          <Text style={styles.validatingStepText}>Analizando contenido...</Text>
        </View>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.resultContainer}>
      <Icon name="check-decagram" size={100} color="#4ECDC4" />
      <Text style={styles.successTitle}>¡Felicidades!</Text>
      <Text style={styles.successSubtitle}>Has sido revivido con todas tus vidas</Text>

      {validationResult && (
        <View style={styles.validationResultCard}>
          <Text style={styles.validationScore}>
            Puntuación: {Math.round(validationResult.confidence_score * 100)}%
          </Text>
          <Text style={styles.validationReason}>{validationResult.reasoning}</Text>
        </View>
      )}

      <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
      <Text style={styles.redirectText}>Redirigiendo...</Text>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.resultContainer}>
      <Icon name="close-octagon" size={100} color="#FF6B6B" />
      <Text style={styles.failedTitle}>Pruebas Insuficientes</Text>
      <Text style={styles.failedSubtitle}>
        La validación no fue exitosa. Intenta con más detalles o una foto.
      </Text>

      {validationResult && (
        <View style={styles.validationResultCard}>
          <Text style={styles.validationScore}>
            Puntuación: {Math.round(validationResult.confidence_score * 100)}%
          </Text>
          <Text style={styles.validationReason}>{validationResult.reasoning}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => setStep('proof')}
      >
        <Text style={styles.retryButtonText}>Intentar Nuevamente</Text>
      </TouchableOpacity>
    </View>
  );

  switch (step) {
    case 'list':
      return renderChallengesList();
    case 'proof':
      return renderProofForm();
    case 'validating':
      return renderValidating();
    case 'success':
      return renderSuccess();
    case 'failed':
      return renderFailed();
    default:
      return null;
  }
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  challengesList: {
    flex: 1,
    padding: 20,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  habitName: {
    fontSize: 12,
    color: '#6C757D',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  challengeFooterText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  proofContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  selectedChallengeInfo: {
    backgroundColor: '#E8F8F7',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  selectedChallengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  selectedChallengeDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  proofSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#2C3E50',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 6,
    textAlign: 'right',
  },
  imagePickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 12,
    fontWeight: '500',
  },
  imagePickerHint: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F8F7',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  validatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  validatingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 24,
  },
  validatingSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
  },
  validatingSteps: {
    marginTop: 40,
    alignItems: 'flex-start',
  },
  validatingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  validatingStepText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 12,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginTop: 20,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 20,
  },
  failedSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  validationResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  validationScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  validationReason: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    textAlign: 'center',
  },
  redirectText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
  },
} as const;