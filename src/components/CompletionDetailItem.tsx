import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { HabitCompletion } from '../types';
import { useThemedStyles } from '../theme/useThemedStyles';

interface CompletionDetailItemProps {
  completion: HabitCompletion;
}

export const CompletionDetailItem: React.FC<CompletionDetailItemProps> = ({ completion }) => {
  const styles = useThemedStyles(baseStyles);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatProgressValue = () => {
    if (!completion.progressData) return null;

    switch (completion.progressData.type) {
      case 'time': {
        const minutesValue = completion.progressData.value || 0;
        const hours = Math.floor(minutesValue / 60);
        const minutes = minutesValue % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
      case 'count':
        return `${completion.progressData.value} veces`;
      case 'yes_no':
      default:
        return null;
    }
  };

  const progressValue = formatProgressValue();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(completion.date)}</Text>
          {progressValue && <Text style={styles.progressValue}>{progressValue}</Text>}
        </View>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>?</Text>
        </View>
      </View>

      {completion.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notas:</Text>
          <Text style={styles.notesText}>{completion.notes}</Text>
        </View>
      )}

      {completion.images && completion.images.length > 0 && (
        <View style={styles.imagesContainer}>
          <Text style={styles.imagesLabel}>Imagenes:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
          >
            {completion.images.map((uri, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(uri)}
                style={styles.imageWrapper}
              >
                <Image source={{ uri }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const baseStyles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textTransform: 'capitalize',
  },
  progressValue: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginTop: 4,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  imagesContainer: {
    marginTop: 8,
  },
  imagesLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagesScroll: {
    marginHorizontal: -4,
  },
  imageWrapper: {
    marginHorizontal: 4,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width - 40,
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
} as const;



