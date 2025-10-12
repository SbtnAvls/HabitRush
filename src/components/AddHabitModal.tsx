import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Frequency, ProgressType } from '../types';
import { useThemedStyles } from '../theme/useThemedStyles';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    frequency: Frequency,
    progressType: ProgressType,
    activeByUser: boolean,
    description?: string,
    targetDate?: Date
  ) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miercoles', short: 'Mie' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sabado', short: 'Sab' },
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const styles = useThemedStyles(baseStyles);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [progressType, setProgressType] = useState<ProgressType>('yes_no');
  const [activeByUser, setActiveByUser] = useState(true);
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);

  const handleDayToggle = (dayId: number) => {
    setSelectedDays(prev => (
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    ));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el habito');
      return;
    }

    if (frequencyType === 'custom' && selectedDays.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un dia de la semana');
      return;
    }

    const frequency: Frequency = {
      type: frequencyType,
      daysOfWeek: frequencyType !== 'daily' ? selectedDays : undefined,
    };

    onSave(
      name.trim(),
      frequency,
      progressType,
      activeByUser,
      description.trim() || undefined,
      targetDate
    );

    setName('');
    setDescription('');
    setFrequencyType('daily');
    setSelectedDays([]);
    setProgressType('yes_no');
    setActiveByUser(true);
    setTargetDate(undefined);
    onClose();
  };

  const renderFrequencyOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Frecuencia</Text>

      <TouchableOpacity
        style={[styles.option, frequencyType === 'daily' && styles.selectedOption]}
        onPress={() => setFrequencyType('daily')}
      >
        <Text style={[styles.optionText, frequencyType === 'daily' && styles.selectedOptionText]}>
          Diario
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, frequencyType === 'weekly' && styles.selectedOption]}
        onPress={() => setFrequencyType('weekly')}
      >
        <Text style={[styles.optionText, frequencyType === 'weekly' && styles.selectedOptionText]}>
          Semanal
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, frequencyType === 'custom' && styles.selectedOption]}
        onPress={() => setFrequencyType('custom')}
      >
        <Text style={[styles.optionText, frequencyType === 'custom' && styles.selectedOptionText]}>
          Personalizado
        </Text>
      </TouchableOpacity>

      {frequencyType !== 'daily' && (
        <View style={styles.daysContainer}>
          <Text style={styles.daysTitle}>Selecciona los dias</Text>
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.id) && styles.selectedDay,
                ]}
                onPress={() => handleDayToggle(day.id)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDays.includes(day.id) && styles.selectedDayText,
                  ]}
                >
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderProgressOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tipo de seguimiento</Text>

      <TouchableOpacity
        style={[styles.option, progressType === 'yes_no' && styles.selectedOption]}
        onPress={() => setProgressType('yes_no')}
      >
        <Text
          style={[styles.optionText, progressType === 'yes_no' && styles.selectedOptionText]}
        >
          Si / No
        </Text>
        <Text style={styles.optionDescription}>
          Marca el habito como completado o no
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, progressType === 'time' && styles.selectedOption]}
        onPress={() => setProgressType('time')}
      >
        <Text
          style={[styles.optionText, progressType === 'time' && styles.selectedOptionText]}
        >
          Tiempo dedicado
        </Text>
        <Text style={styles.optionDescription}>
          Registra horas o minutos dedicados al habito
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, progressType === 'count' && styles.selectedOption]}
        onPress={() => setProgressType('count')}
      >
        <Text
          style={[styles.optionText, progressType === 'count' && styles.selectedOptionText]}
        >
          Cantidad
        </Text>
        <Text style={styles.optionDescription}>
          Cuenta repeticiones o unidades completadas
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Crear nuevo habito</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informacion general</Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Meditar"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe brevemente el habito"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {renderFrequencyOptions()}
            {renderProgressOptions()}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activacion manual</Text>

              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    activeByUser && styles.statusActive,
                  ]}
                  onPress={() => setActiveByUser(true)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      activeByUser && styles.statusTextActive,
                    ]}
                  >
                    Activo
                  </Text>
                  <Text style={styles.statusDescription}>
                    El habito estara activo desde el inicio
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    !activeByUser && styles.statusInactive,
                  ]}
                  onPress={() => setActiveByUser(false)}
                >
                  <Text style={styles.statusText}>Inactivo</Text>
                  <Text style={styles.statusDescription}>
                  Lo activaras manualmente mas adelante
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Objetivo (opcional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTargetDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {targetDate
                    ? `Objetivo: ${targetDate.toLocaleDateString('es-ES')}`
                    : 'Seleccionar fecha meta'}
                </Text>
              </TouchableOpacity>

              {targetDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setTargetDate(undefined)}
                >
                  <Text style={styles.clearDateText}>Eliminar fecha</Text>
                </TouchableOpacity>
              )}

              {showTargetDatePicker && (
                <DateTimePicker
                  value={targetDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowTargetDatePicker(false);
                    if (date) setTargetDate(date);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const baseStyles = {
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '95%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  daysContainer: {
    marginTop: 12,
  },
  daysTitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  dayText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  clearDateButton: {
    marginTop: 8,
  },
  clearDateText: {
    fontSize: 14,
    color: '#6C757D',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#E8F8F7',
    borderColor: '#4ECDC4',
  },
  statusInactive: {
    backgroundColor: '#FFE6E6',
    borderColor: '#FF6B6B',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statusTextActive: {
    color: '#2C3E50',
  },
  statusDescription: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
} as const;

