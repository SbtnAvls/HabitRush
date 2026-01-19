import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Frequency, ProgressType } from '../types';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { AuthModal } from './AuthModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    frequency: Frequency,
    progressType: ProgressType,
    activeByUser: boolean,
    description?: string,
    targetDate?: Date,
    targetValue?: number
  ) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'D', icon: 'weather-sunny' },
  { id: 1, name: 'Lunes', short: 'L', icon: 'briefcase' },
  { id: 2, name: 'Martes', short: 'M', icon: 'briefcase' },
  { id: 3, name: 'Miércoles', short: 'M', icon: 'briefcase' },
  { id: 4, name: 'Jueves', short: 'J', icon: 'briefcase' },
  { id: 5, name: 'Viernes', short: 'V', icon: 'briefcase' },
  { id: 6, name: 'Sábado', short: 'S', icon: 'weather-sunny' },
];

const FREQUENCY_OPTIONS = [
  {
    id: 'daily',
    apiType: 'daily' as const,
    title: 'Todos los días',
    subtitle: 'Repite cada día de la semana',
    icon: 'calendar-sync',
    color: '#4ECDC4',
    presetDays: null, // No necesita días
  },
  {
    id: 'weekdays',
    apiType: 'custom' as const,
    title: 'Entre semana',
    subtitle: 'Lunes a Viernes',
    icon: 'briefcase-outline',
    color: '#3498DB',
    presetDays: [1, 2, 3, 4, 5], // L, M, M, J, V
  },
  {
    id: 'weekends',
    apiType: 'custom' as const,
    title: 'Fines de semana',
    subtitle: 'Sábado y Domingo',
    icon: 'weather-sunny',
    color: '#FF6B6B',
    presetDays: [0, 6], // D, S
  },
  {
    id: 'custom',
    apiType: 'custom' as const,
    title: 'Personalizado',
    subtitle: 'Elige los días que quieras',
    icon: 'calendar-edit',
    color: '#9B59B6',
    presetDays: null, // Usuario elige
  },
];

const PROGRESS_OPTIONS = [
  {
    type: 'yes_no' as const,
    title: 'Sí / No',
    subtitle: '¿Lo hiciste hoy?',
    icon: 'check-circle-outline',
    color: '#4ECDC4',
    example: 'Meditar, Leer, Hacer ejercicio',
  },
  {
    type: 'time' as const,
    title: 'Tiempo',
    subtitle: 'Registra la duración',
    icon: 'clock-outline',
    color: '#F39C12',
    example: 'Estudiar 2h, Correr 30min',
  },
  {
    type: 'count' as const,
    title: 'Cantidad',
    subtitle: 'Cuenta las repeticiones',
    icon: 'counter',
    color: '#E74C3C',
    example: '10 flexiones, 8 vasos de agua',
  },
];

const HABIT_SUGGESTIONS = [
  { name: 'Meditar', icon: 'meditation', color: '#9B59B6' },
  { name: 'Ejercicio', icon: 'run', color: '#E74C3C' },
  { name: 'Leer', icon: 'book-open-variant', color: '#3498DB' },
  { name: 'Hidratarme', icon: 'water', color: '#00BCD4' },
  { name: 'Dormir temprano', icon: 'sleep', color: '#5C6BC0' },
  { name: 'Estudiar', icon: 'school', color: '#FF9800' },
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const { isAuthenticated, state, refreshState } = useAppContext();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFrequencyId, setSelectedFrequencyId] = useState<string>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [progressType, setProgressType] = useState<ProgressType>('yes_no');
  const [targetHours, setTargetHours] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');
  const [targetCount, setTargetCount] = useState('');
  const [activeByUser, setActiveByUser] = useState(true);
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 4;

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Card animations for options
  const cardAnims = useRef(
    Array.from({ length: 6 }, () => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  ).current;

  // Day button animations
  const dayAnims = useRef(
    DAYS_OF_WEEK.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset state
      setCurrentStep(0);
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      progressAnim.setValue(0);
      headerAnim.setValue(-50);

      // Animate entrance
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(headerAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate cards with stagger
      animateCards();
    }
  }, [visible]);

  useEffect(() => {
    // Animate progress bar
    Animated.spring(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();

    // Animate cards when step changes
    animateCards();

    // Animate day buttons when on frequency step
    if (currentStep === 1 && selectedFrequencyId === 'custom') {
      animateDayButtons();
    }
  }, [currentStep, selectedFrequencyId]);

  const animateCards = () => {
    cardAnims.forEach((anim, index) => {
      anim.opacity.setValue(0);
      anim.translateY.setValue(30);

      Animated.sequence([
        Animated.delay(index * 80),
        Animated.parallel([
          Animated.spring(anim.opacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(anim.translateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const animateDayButtons = () => {
    dayAnims.forEach((anim, index) => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.spring(anim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateCardPress = (index: number) => {
    Animated.sequence([
      Animated.timing(cardAnims[index].scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnims[index].scale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goToNextStep = () => {
    if (currentStep === 0 && !name.trim()) {
      Alert.alert('¡Espera!', 'Dale un nombre a tu hábito');
      return;
    }

    if (currentStep === 1 && selectedFrequencyId === 'custom' && selectedDays.length === 0) {
      Alert.alert('¡Espera!', 'Selecciona al menos un día');
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      // Slide out current content
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(prev => prev + 1);
        slideAnim.setValue(SCREEN_WIDTH);
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(prev => prev - 1);
        slideAnim.setValue(-SCREEN_WIDTH);
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleDayToggle = (dayId: number) => {
    // Animate the button
    Animated.sequence([
      Animated.timing(dayAnims[dayId], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(dayAnims[dayId], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSave = async () => {
    const isFirstHabit = state.habits.length === 0;

    if (isFirstHabit && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Validate target values
    let parsedTargetValue: number | undefined = undefined;
    if (progressType === 'time') {
      const hours = parseInt(targetHours, 10) || 0;
      const minutes = parseInt(targetMinutes, 10) || 0;
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes <= 0) {
        Alert.alert('¡Espera!', 'Define el tiempo mínimo para tu hábito');
        return;
      }
      parsedTargetValue = totalMinutes;
    } else if (progressType === 'count') {
      const numValue = parseInt(targetCount, 10);
      if (!targetCount.trim() || isNaN(numValue) || numValue <= 0) {
        Alert.alert('¡Espera!', 'Define la cantidad mínima para tu hábito');
        return;
      }
      parsedTargetValue = numValue;
    }

    // Build frequency based on selected option
    const selectedOption = FREQUENCY_OPTIONS.find(opt => opt.id === selectedFrequencyId);
    const frequencyDays = selectedOption?.presetDays ?? selectedDays;

    const frequency: Frequency = {
      type: selectedOption?.apiType || 'daily',
      daysOfWeek: selectedOption?.apiType !== 'daily' ? frequencyDays : undefined,
    };

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSave(
        name.trim(),
        frequency,
        progressType,
        activeByUser,
        description.trim() || undefined,
        targetDate,
        parsedTargetValue
      );

      // Reset form
      resetForm();
      onClose();
    });
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedFrequencyId('daily');
    setSelectedDays([]);
    setProgressType('yes_no');
    setTargetHours('');
    setTargetMinutes('');
    setTargetCount('');
    setActiveByUser(true);
    setTargetDate(undefined);
    setCurrentStep(0);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetForm();
      onClose();
    });
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await refreshState();
    Alert.alert('¡Bienvenido!', 'Ahora puedes crear tu hábito', [{ text: 'OK' }]);
  };

  const selectSuggestion = (suggestion: { name: string }) => {
    setName(suggestion.name);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return '¿Qué hábito quieres crear?';
      case 1:
        return '¿Con qué frecuencia?';
      case 2:
        return '¿Cómo lo medirás?';
      case 3:
        return 'Detalles finales';
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 0:
        return 'Elige un nombre que te inspire';
      case 1:
        return 'La consistencia es la clave del éxito';
      case 2:
        return 'Cada hábito se mide diferente';
      case 3:
        return 'Personaliza tu experiencia';
      default:
        return '';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 0:
        return 'lightbulb-outline';
      case 1:
        return 'calendar-check';
      case 2:
        return 'chart-line';
      case 3:
        return 'tune';
      default:
        return 'circle';
    }
  };

  // Render Step 1: Name & Description
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.suggestionsTitle, { color: theme.colors.textSecondary }]}>
          Ideas populares
        </Text>
        <View style={styles.suggestionsGrid}>
          {HABIT_SUGGESTIONS.map((suggestion, index) => (
            <Animated.View
              key={suggestion.name}
              style={{
                opacity: cardAnims[index]?.opacity || 1,
                transform: [
                  { translateY: cardAnims[index]?.translateY || 0 },
                  { scale: cardAnims[index]?.scale || 1 },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.suggestionChip,
                  { backgroundColor: theme.colors.surface },
                  name === suggestion.name && {
                    backgroundColor: suggestion.color + '20',
                    borderColor: suggestion.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => {
                  animateCardPress(index);
                  selectSuggestion(suggestion);
                }}
                activeOpacity={0.7}
              >
                <Icon name={suggestion.icon} size={20} color={suggestion.color} />
                <Text
                  style={[
                    styles.suggestionText,
                    { color: theme.colors.textPrimary },
                    name === suggestion.name && { color: suggestion.color, fontWeight: '600' },
                  ]}
                >
                  {suggestion.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
          O escribe el tuyo
        </Text>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="pencil" size={22} color={theme.colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: theme.colors.textPrimary }]}
            placeholder="Nombre del hábito..."
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
          Descripción (opcional)
        </Text>
        <View
          style={[
            styles.inputWrapper,
            styles.textAreaWrapper,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <TextInput
            style={[styles.textInput, styles.textArea, { color: theme.colors.textPrimary }]}
            placeholder="¿Por qué es importante este hábito?"
            placeholderTextColor={theme.colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </View>
  );

  // Render Step 2: Frequency
  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.optionsContainer}>
        {FREQUENCY_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.id}
            style={{
              opacity: cardAnims[index]?.opacity || 1,
              transform: [
                { translateY: cardAnims[index]?.translateY || 0 },
                { scale: cardAnims[index]?.scale || 1 },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: theme.colors.surface },
                selectedFrequencyId === option.id && {
                  backgroundColor: option.color + '15',
                  borderColor: option.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                animateCardPress(index);
                setSelectedFrequencyId(option.id);
                if (option.id === 'custom') {
                  setTimeout(animateDayButtons, 200);
                }
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: option.color + '20' },
                ]}
              >
                <Icon name={option.icon} size={28} color={option.color} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
                  {option.title}
                </Text>
                <Text style={[styles.optionSubtitle, { color: theme.colors.textMuted }]}>
                  {option.subtitle}
                </Text>
              </View>
              {selectedFrequencyId === option.id && (
                <Icon name="check-circle" size={24} color={option.color} />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Day selector only for custom frequency */}
      {selectedFrequencyId === 'custom' && (
        <Animated.View
          style={[
            styles.daysSection,
            {
              opacity: dayAnims[0],
            },
          ]}
        >
          <Text style={[styles.daysSectionTitle, { color: theme.colors.textSecondary }]}>
            Selecciona los días
          </Text>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((day, index) => (
              <Animated.View
                key={day.id}
                style={{
                  transform: [
                    {
                      scale: dayAnims[index].interpolate({
                        inputRange: [0, 1, 1.2],
                        outputRange: [0.5, 1, 1.1],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.dayButton,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    selectedDays.includes(day.id) && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => handleDayToggle(day.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      { color: theme.colors.textPrimary },
                      selectedDays.includes(day.id) && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // Render Step 3: Progress Type
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.optionsContainer}>
        {PROGRESS_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.type}
            style={{
              opacity: cardAnims[index]?.opacity || 1,
              transform: [
                { translateY: cardAnims[index]?.translateY || 0 },
                { scale: cardAnims[index]?.scale || 1 },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.progressCard,
                { backgroundColor: theme.colors.surface },
                progressType === option.type && {
                  backgroundColor: option.color + '15',
                  borderColor: option.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                animateCardPress(index);
                setProgressType(option.type);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.progressCardHeader}>
                <View
                  style={[
                    styles.progressIconContainer,
                    { backgroundColor: option.color + '20' },
                  ]}
                >
                  <Icon name={option.icon} size={32} color={option.color} />
                </View>
                {progressType === option.type && (
                  <Icon name="check-circle" size={24} color={option.color} />
                )}
              </View>
              <Text style={[styles.progressTitle, { color: theme.colors.textPrimary }]}>
                {option.title}
              </Text>
              <Text style={[styles.progressSubtitle, { color: theme.colors.textMuted }]}>
                {option.subtitle}
              </Text>
              <View style={[styles.exampleContainer, { backgroundColor: theme.colors.backgroundAlt }]}>
                <Icon name="information-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.exampleText, { color: theme.colors.textMuted }]}>
                  {option.example}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  // Render Step 4: Final Details
  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Target value for time habits */}
      {progressType === 'time' && (
        <Animated.View
          style={[
            styles.detailSection,
            {
              opacity: cardAnims[0]?.opacity || 1,
              transform: [{ translateY: cardAnims[0]?.translateY || 0 }],
            },
          ]}
        >
          <View style={styles.detailHeader}>
            <Icon name="clock-outline" size={24} color="#F39C12" />
            <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
              Tiempo mínimo diario
            </Text>
          </View>
          <Text style={[styles.detailSubtitle, { color: theme.colors.textMuted }]}>
            ¿Cuánto tiempo mínimo dedicarás?
          </Text>
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputGroup}>
              <TextInput
                style={[
                  styles.timeInput,
                  { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border },
                ]}
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                value={targetHours}
                onChangeText={text => setTargetHours(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>horas</Text>
            </View>
            <View style={styles.timeInputGroup}>
              <TextInput
                style={[
                  styles.timeInput,
                  { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border },
                ]}
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                value={targetMinutes}
                onChangeText={text => {
                  const num = text.replace(/[^0-9]/g, '');
                  if (parseInt(num, 10) > 59) {
                    setTargetMinutes('59');
                  } else {
                    setTargetMinutes(num);
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>min</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Target value for count habits */}
      {progressType === 'count' && (
        <Animated.View
          style={[
            styles.detailSection,
            {
              opacity: cardAnims[0]?.opacity || 1,
              transform: [{ translateY: cardAnims[0]?.translateY || 0 }],
            },
          ]}
        >
          <View style={styles.detailHeader}>
            <Icon name="counter" size={24} color="#E74C3C" />
            <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
              Cantidad mínima
            </Text>
          </View>
          <Text style={[styles.detailSubtitle, { color: theme.colors.textMuted }]}>
            ¿Cuántas repeticiones como mínimo?
          </Text>
          <TextInput
            style={[
              styles.countInput,
              { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.border },
            ]}
            placeholder="Ej: 10"
            placeholderTextColor={theme.colors.textMuted}
            value={targetCount}
            onChangeText={text => setTargetCount(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </Animated.View>
      )}

      {/* Active status */}
      <Animated.View
        style={[
          styles.detailSection,
          {
            opacity: cardAnims[1]?.opacity || 1,
            transform: [{ translateY: cardAnims[1]?.translateY || 0 }],
          },
        ]}
      >
        <View style={styles.detailHeader}>
          <Icon name="power" size={24} color={theme.colors.primary} />
          <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
            Estado inicial
          </Text>
        </View>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[
              styles.statusOption,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              activeByUser && {
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setActiveByUser(true)}
            activeOpacity={0.7}
          >
            <Icon
              name="check-circle"
              size={28}
              color={activeByUser ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.statusLabel,
                { color: activeByUser ? theme.colors.primary : theme.colors.textPrimary },
              ]}
            >
              Activo
            </Text>
            <Text style={[styles.statusDesc, { color: theme.colors.textMuted }]}>
              Empieza hoy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusOption,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              !activeByUser && {
                backgroundColor: '#FF6B6B20',
                borderColor: '#FF6B6B',
              },
            ]}
            onPress={() => setActiveByUser(false)}
            activeOpacity={0.7}
          >
            <Icon
              name="pause-circle"
              size={28}
              color={!activeByUser ? '#FF6B6B' : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.statusLabel,
                { color: !activeByUser ? '#FF6B6B' : theme.colors.textPrimary },
              ]}
            >
              Pausado
            </Text>
            <Text style={[styles.statusDesc, { color: theme.colors.textMuted }]}>
              Lo activo después
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Target date */}
      <Animated.View
        style={[
          styles.detailSection,
          {
            opacity: cardAnims[2]?.opacity || 1,
            transform: [{ translateY: cardAnims[2]?.translateY || 0 }],
          },
        ]}
      >
        <View style={styles.detailHeader}>
          <Icon name="flag-checkered" size={24} color="#9B59B6" />
          <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
            Fecha objetivo (opcional)
          </Text>
        </View>
        <Text style={[styles.detailSubtitle, { color: theme.colors.textMuted }]}>
          ¿Tienes una meta en mente?
        </Text>
        <TouchableOpacity
          style={[
            styles.dateButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            targetDate && { borderColor: '#9B59B6' },
          ]}
          onPress={() => setShowTargetDatePicker(true)}
          activeOpacity={0.7}
        >
          <Icon
            name="calendar"
            size={22}
            color={targetDate ? '#9B59B6' : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.dateButtonText,
              { color: targetDate ? '#9B59B6' : theme.colors.textMuted },
            ]}
          >
            {targetDate
              ? targetDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Seleccionar fecha'}
          </Text>
        </TouchableOpacity>
        {targetDate && (
          <TouchableOpacity
            style={styles.clearDateButton}
            onPress={() => setTargetDate(undefined)}
          >
            <Icon name="close-circle" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.clearDateText, { color: theme.colors.textMuted }]}>
              Quitar fecha
            </Text>
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
      </Animated.View>

      {/* Summary preview */}
      <Animated.View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            opacity: cardAnims[3]?.opacity || 1,
            transform: [{ translateY: cardAnims[3]?.translateY || 0 }],
          },
        ]}
      >
        <View style={styles.summaryHeader}>
          <Icon name="eye" size={20} color={theme.colors.primary} />
          <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
            Vista previa
          </Text>
        </View>
        <View style={styles.summaryContent}>
          <Text style={[styles.summaryName, { color: theme.colors.textPrimary }]}>
            {name || 'Mi nuevo hábito'}
          </Text>
          <View style={styles.summaryTags}>
            <View style={[styles.summaryTag, { backgroundColor: (FREQUENCY_OPTIONS.find(f => f.id === selectedFrequencyId)?.color || theme.colors.primary) + '20' }]}>
              <Text style={[styles.summaryTagText, { color: FREQUENCY_OPTIONS.find(f => f.id === selectedFrequencyId)?.color || theme.colors.primary }]}>
                {FREQUENCY_OPTIONS.find(f => f.id === selectedFrequencyId)?.title}
              </Text>
            </View>
            <View
              style={[
                styles.summaryTag,
                {
                  backgroundColor:
                    (PROGRESS_OPTIONS.find(p => p.type === progressType)?.color || '#4ECDC4') + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.summaryTagText,
                  { color: PROGRESS_OPTIONS.find(p => p.type === progressType)?.color },
                ]}
              >
                {PROGRESS_OPTIONS.find(p => p.type === progressType)?.title}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <Modal
        visible={visible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <Animated.View
          style={[
            styles.modalBackground,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.colors.background,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  backgroundColor: theme.colors.background,
                  transform: [{ translateY: headerAnim }],
                },
              ]}
            >
              {/* Close button */}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Icon name="close" size={22} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              {/* Progress bar */}
              <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: theme.colors.primary,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                {[0, 1, 2, 3].map(step => (
                  <View
                    key={step}
                    style={[
                      styles.stepDot,
                      { backgroundColor: theme.colors.border },
                      step <= currentStep && { backgroundColor: theme.colors.primary },
                    ]}
                  />
                ))}
              </View>

              {/* Title */}
              <View style={styles.headerContent}>
                <View
                  style={[
                    styles.stepIconContainer,
                    { backgroundColor: theme.colors.primary + '20' },
                  ]}
                >
                  <Icon name={getStepIcon()} size={28} color={theme.colors.primary} />
                </View>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                  {getStepTitle()}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                  {getStepSubtitle()}
                </Text>
              </View>
            </Animated.View>

            {/* Content */}
            <Animated.View
              style={[
                styles.content,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {renderStepContent()}
            </Animated.View>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
              {currentStep > 0 ? (
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                  onPress={goToPreviousStep}
                  activeOpacity={0.7}
                >
                  <Icon name="arrow-left" size={22} color={theme.colors.textPrimary} />
                  <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>
                    Atrás
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backButton} />
              )}

              {currentStep < TOTAL_STEPS - 1 ? (
                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
                  onPress={goToNextStep}
                  activeOpacity={0.7}
                >
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                  <Icon name="arrow-right" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSave}
                  activeOpacity={0.7}
                >
                  <Icon name="check" size={22} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Crear hábito</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  daysSection: {
    marginTop: 24,
  },
  daysSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  exampleText: {
    fontSize: 12,
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  detailSubtitle: {
    fontSize: 13,
    marginBottom: 14,
    marginLeft: 34,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  countInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  dateButtonText: {
    fontSize: 15,
    flex: 1,
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  clearDateText: {
    fontSize: 13,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContent: {},
  summaryName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryTags: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
