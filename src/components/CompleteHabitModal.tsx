import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { Habit, ProgressData } from '../types';
import { useThemedStyles } from '../theme/useThemedStyles';

interface CompleteHabitModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onComplete: (progressData?: ProgressData, notes?: string, images?: string[]) => void;
}

export const CompleteHabitModal: React.FC<CompleteHabitModalProps> = ({
  visible,
  habit,
  onClose,
  onComplete,
}) => {
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Para tipo 'time'
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  
  // Para tipo 'count'
  const [count, setCount] = useState('');

  const styles = useThemedStyles(baseStyles);

  const resetForm = () => {
    setNotes('');
    setImages([]);
    setHours('');
    setMinutes('');
    setCount('');
  };

  const handleSelectImage = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción',
      [
        {
          text: 'Tomar foto',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
              },
              handleImageResponse
            );
          },
        },
        {
          text: 'Elegir de galería',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
                selectionLimit: 5,
              },
              handleImageResponse
            );
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Error al seleccionar imagen');
      return;
    }

    if (response.assets) {
      const newImages = response.assets
        .filter(asset => asset.uri)
        .map(asset => asset.uri as string);
      setImages(prev => [...prev, ...newImages].slice(0, 5)); // Máximo 5 imágenes
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (!habit) return;

    let progressData: ProgressData | undefined;

    // Validar y crear progressData según el tipo
    if (habit.progressType === 'time') {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      
      if (h === 0 && m === 0) {
        Alert.alert('Error', 'Por favor ingresa el tiempo dedicado');
        return;
      }

      const totalMinutes = h * 60 + m;
      progressData = {
        type: 'time',
        value: totalMinutes,
      };
    } else if (habit.progressType === 'count') {
      const countValue = parseInt(count);
      
      if (!countValue || countValue <= 0) {
        Alert.alert('Error', 'Por favor ingresa una cantidad válida');
        return;
      }

      progressData = {
        type: 'count',
        value: countValue,
      };
    } else {
      // Para 'yes_no' no necesitamos progressData específico
      progressData = {
        type: 'yes_no',
      };
    }

    onComplete(
      progressData,
      notes.trim() || undefined,
      images.length > 0 ? images : undefined
    );

    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const renderProgressInput = () => {
    if (!habit) return null;

    switch (habit.progressType) {
      case 'time':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Cuánto tiempo dedicaste?</Text>
            <View style={styles.timeInputContainer}>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0"
                  placeholderTextColor="#95A5A6"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.timeLabel}>horas</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.input}
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="0"
                  placeholderTextColor="#95A5A6"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.timeLabel}>minutos</Text>
              </View>
            </View>
          </View>
        );

      case 'count':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Cuántas veces lo hiciste?</Text>
            <TextInput
              style={styles.input}
              value={count}
              onChangeText={setCount}
              placeholder="Ej: 20"
              placeholderTextColor="#95A5A6"
              keyboardType="number-pad"
            />
          </View>
        );

      case 'yes_no':
        return (
          <View style={styles.section}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.checkmarkText}>¡Genial! Vas a marcar este hábito como completado</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!habit) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Completar Hábito</Text>
          <TouchableOpacity onPress={handleComplete} style={styles.saveButton}>
            <Text style={styles.saveText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{habit.name}</Text>
            {habit.description && (
              <Text style={styles.habitDescription}>{habit.description}</Text>
            )}
          </View>

          {renderProgressInput()}

          {/* Notas opcionales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="¿Cómo te fue? Agrega tus pensamientos..."
              placeholderTextColor="#95A5A6"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Imágenes opcionales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imágenes (opcional)</Text>
            
            {images.length > 0 && (
              <ScrollView 
                horizontal 
                style={styles.imagesContainer}
                showsHorizontalScrollIndicator={false}
              >
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImage}
              >
                <Text style={styles.addImageText}>+ Agregar imagen</Text>
                <Text style={styles.addImageSubtext}>
                  {images.length > 0
                    ? `${images.length}/5 imágenes`
                    : 'Máximo 5 imágenes'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    color: '#6C757D',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  habitInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  habitName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    alignItems: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginHorizontal: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  checkmarkContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  checkmark: {
    fontSize: 64,
    color: '#4ECDC4',
    marginBottom: 12,
  },
  checkmarkText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
  },
  imagesContainer: {
    marginBottom: 12,
  },
  imageWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addImageButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 4,
  },
  addImageSubtext: {
    fontSize: 12,
    color: '#6C757D',
  },
} as const;







