import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

interface ChallengeProofFormProps {
  onSubmit: (proofText: string, proofImageUrls: string[]) => Promise<void>;
  loading: boolean;
  challengeTitle?: string;
  resetKey?: string; // Cambiar para resetear el formulario
}

interface ProofImage {
  uri: string;
  base64: string;
}

const MIN_TEXT_LENGTH = 20;
const MAX_IMAGES = 2;

/**
 * Formulario para enviar pruebas de un challenge completado
 * Requiere: texto (mín 20 chars) + 1-2 imágenes
 */
export const ChallengeProofForm: React.FC<ChallengeProofFormProps> = ({
  onSubmit,
  loading,
  // challengeTitle - disponible para uso futuro si se quiere mostrar
  resetKey,
}) => {
  const [proofText, setProofText] = useState('');
  const [images, setImages] = useState<ProofImage[]>([]);

  // Resetear formulario cuando cambia resetKey
  React.useEffect(() => {
    setProofText('');
    setImages([]);
  }, [resetKey]);

  const pickImage = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Límite alcanzado', `Máximo ${MAX_IMAGES} imágenes permitidas.`);
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 0.7 as const,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', 'No se pudo seleccionar la imagen');
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri && asset.base64) {
          setImages(prev => [...prev, { uri: asset.uri!, base64: asset.base64! }]);
        } else {
          Alert.alert('Error', 'No se pudo procesar la imagen. Intenta con otra.');
        }
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validar texto obligatorio
    if (!proofText.trim() || proofText.trim().length < MIN_TEXT_LENGTH) {
      Alert.alert(
        'Descripción requerida',
        `Describe cómo completaste el reto (mínimo ${MIN_TEXT_LENGTH} caracteres).`
      );
      return;
    }

    // Validar imágenes obligatorias
    if (images.length === 0) {
      Alert.alert(
        'Imagen requerida',
        'Debes adjuntar al menos 1 foto como prueba.'
      );
      return;
    }

    try {
      // Convertir imágenes a data URLs
      const imageUrls = images.map(img => `data:image/jpeg;base64,${img.base64}`);
      await onSubmit(proofText.trim(), imageUrls);
    } catch (error) {
      // Error manejado en el hook
    }
  };

  const canSubmit = proofText.trim().length >= MIN_TEXT_LENGTH && images.length >= 1 && !loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Info */}
      <View style={styles.infoBox}>
        <Icon name="information-outline" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Para validar tu prueba necesitas: una descripción detallada y 1-2 fotos como evidencia.
        </Text>
      </View>

      {/* Text Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="text" size={16} color="#374151" /> Descripción{' '}
          <Text style={styles.requiredBadge}>Obligatorio</Text>
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Describe cómo completaste el reto..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          maxLength={500}
          value={proofText}
          onChangeText={setProofText}
          editable={!loading}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {proofText.length} / 500 caracteres
          {proofText.length > 0 && proofText.length < MIN_TEXT_LENGTH && (
            <Text style={styles.charCountWarning}> (mínimo {MIN_TEXT_LENGTH})</Text>
          )}
        </Text>
      </View>

      {/* Image Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="camera" size={16} color="#374151" /> Fotos ({images.length}/{MAX_IMAGES}){' '}
          <Text style={styles.requiredBadge}>Obligatorio</Text>
        </Text>

        {/* Grid de imágenes */}
        <View style={styles.imagesGrid}>
          {images.map((img, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri: img.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
                disabled={loading}
              >
                <Icon name="close-circle" size={28} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Botón agregar si hay espacio */}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              style={[styles.imagePickerButton, images.length > 0 && styles.imagePickerButtonSmall]}
              onPress={pickImage}
              disabled={loading}
            >
              <Icon name="camera-plus" size={images.length > 0 ? 24 : 32} color="#6B7280" />
              <Text style={styles.imagePickerText}>
                {images.length === 0 ? 'Agregar foto' : 'Otra foto'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {images.length === 0 && (
          <Text style={styles.imageHint}>Mínimo 1 foto requerida</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !canSubmit && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Icon name="send" size={20} color="#FFF" />
            <Text style={styles.submitButtonText}>Enviar pruebas</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        <Icon name="clock-outline" size={12} color="#9CA3AF" /> La prueba será revisada en máximo 1 hora
      </Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  requiredBadge: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },
  charCountWarning: {
    color: '#F59E0B',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imagePickerButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: '100%',
  },
  imagePickerButtonSmall: {
    minWidth: 100,
    width: 100,
    height: 120,
    padding: 10,
    flex: 0,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  imageHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ChallengeProofForm;
