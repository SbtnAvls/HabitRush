import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Habit, HabitCompletion } from '../types';
import { HabitLogic } from '../services/habitLogic';
import { useTheme } from '../theme/useTheme';
import { useFontScale } from '../theme/useFontScale';
import { AppTheme } from '../theme';
import { useAppContext } from '../context/AppContext';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onComplete: (habitId: string) => void;
  onReactivate: (habitId: string) => void;
  onPress: (habitId: string) => void;
  availableChallenges: any[];
  completions: HabitCompletion[];
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompletedToday,
  onComplete,
  onReactivate,
  onPress,
  availableChallenges,
  completions,
}) => {
  const { activateHabit } = useAppContext()
  const theme = useTheme();
  const { scale } = useFontScale();
  const styles = useMemo(() => createStyles(theme, scale), [theme, scale]);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const streakPulseAnim = useRef(new Animated.Value(1)).current;

  const shouldCompleteToday = HabitLogic.shouldCompleteToday(habit);
  const isActive = habit.isActive;

  // Animación al presionar la tarjeta
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  // Animación del botón de completar
  const handleButtonPressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.9,
      friction: 8,
      tension: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.sequence([
      Animated.spring(buttonScaleAnim, {
        toValue: 1.1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getCurrentWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0);
      weekDays.push(date);
    }
    return weekDays;
  };

  const shouldShowBubble = (date: Date): boolean => {
    const dayOfWeek = date.getDay();

    if (habit.frequency.type === 'daily') {
      return true;
    }

    if (habit.frequency.daysOfWeek) {
      return habit.frequency.daysOfWeek.includes(dayOfWeek);
    }

    return false;
  };

  const isDayCompleted = (date: Date): boolean => {
    const completion = completions.find(
      (c) => c.habitId === habit.id && c.date.toDateString() === date.toDateString()
    );
    return completion?.completed || false;
  };

  const getFrequencyText = (): string => {
    if (habit.frequency.type === 'daily') {
      return 'Todos los dias';
    }

    if (habit.frequency.daysOfWeek && habit.frequency.daysOfWeek.length > 0) {
      const days = [...habit.frequency.daysOfWeek].sort((a, b) => a - b);
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

      const isWeekdays =
        days.length === 5 && days.every((d) => d >= 1 && d <= 5);
      const isWeekdaysPlusSat =
        days.length === 6 && days.every((d) => d >= 1 && d <= 6);

      if (isWeekdays) {
        return 'Lun-Vie';
      }

      if (isWeekdaysPlusSat) {
        return 'Lun-Sab';
      }

      return days.map((d) => dayNames[d]).join('-');
    }

    return 'Personalizado';
  };

  const renderWeekTimeline = () => {
    const weekDays = getCurrentWeekDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular estadísticas de la semana para hábitos no diarios
    const isDaily = habit.frequency.type === 'daily';
    const targetDays = isDaily ? 7 : (habit.frequency.daysOfWeek?.length || 7);

    // Contar completados y días restantes esta semana
    let completedThisWeek = 0;
    let remainingDays = 0; // días que todavía pueden completarse (hoy + futuros)

    weekDays.forEach((date) => {
      if (!shouldShowBubble(date)) return;

      const isDateToday = date.toDateString() === today.toDateString();
      const isDateFuture = date > today;

      if (isDayCompleted(date)) {
        completedThisWeek++;
      } else if (isDateToday || isDateFuture) {
        remainingDays++;
      }
    });

    // ¿Todavía se puede alcanzar el objetivo semanal?
    const canStillReachGoal = (completedThisWeek + remainingDays) >= targetDays;

    return (
      <View style={styles.timeline}>
        {weekDays.map((date, index) => {
          const dayApplies = shouldShowBubble(date);
          const completed = isDayCompleted(date);
          const isToday = date.toDateString() === today.toDateString();
          const isFuture = date > today;
          const isPast = date < today;

          // Si el día NO aplica a este hábito, mostrar estilo "no aplica"
          if (!dayApplies) {
            return (
              <View key={index} style={styles.bubbleContainer}>
                <View style={[styles.bubble, styles.bubbleNotApplicable]}>
                  <View style={styles.notApplicableLine} />
                </View>
                <Text style={[styles.bubbleLabel, styles.bubbleLabelMuted]}>
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()]}
                </Text>
              </View>
            );
          }

          let bubbleStyle = styles.bubbleFuture; // Por defecto gris

          if (completed) {
            bubbleStyle = styles.bubbleCompleted; // Verde
          } else if (isToday) {
            bubbleStyle = styles.bubblePending; // Naranja (pendiente hoy)
          } else if (isFuture) {
            bubbleStyle = styles.bubbleFuture; // Gris (futuro)
          } else if (isPast) {
            // Día pasado sin completar
            if (isDaily) {
              // Hábitos diarios: día pasado = fallido
              bubbleStyle = styles.bubbleMissed; // Rojo
            } else {
              // Hábitos semanales: solo rojo si ya no se puede alcanzar el objetivo
              bubbleStyle = canStillReachGoal ? styles.bubbleFuture : styles.bubbleMissed;
            }
          }

          return (
            <View key={index} style={styles.bubbleContainer}>
              <View style={[styles.bubble, bubbleStyle]} />
              <Text style={styles.bubbleLabel}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const handleComplete = () => {
    onComplete(habit.id);
  };

  const handleReactivate = () => {
    activateHabit(habit.id)
  }

  const isBlocked = habit.isBlocked;

  const getStatusColor = () => {
    if (isBlocked) return theme.colors.danger;
    if (!isActive) return theme.colors.danger;
    if (isCompletedToday) return theme.colors.primary;
    if (shouldCompleteToday) return theme.colors.warning;
    return theme.colors.textMuted;
  };

  const getStatusText = () => {
    if (isBlocked) return 'Bloqueado';
    if (!isActive) return 'Inactivo';
    if (isCompletedToday) return 'Completado';
    if (shouldCompleteToday) return 'Pendiente';
    return 'No requerido hoy';
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress(habit.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          { borderLeftColor: getStatusColor() },
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.name}>{habit.name}</Text>
          <View style={styles.streakContainer}>
            <Animated.View style={{ transform: [{ scale: streakPulseAnim }] }}>
              <Ionicons name="flame" size={16} color={theme.colors.danger} />
            </Animated.View>
            <Text style={styles.streak}>{habit.currentStreak}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.frequency}>{getFrequencyText()}</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {renderWeekTimeline()}

        <View style={styles.actions}>
          {/* Mostrar badge de bloqueado si el hábito está bloqueado */}
          {isBlocked && (
            <View style={styles.blockedBadge}>
              <View style={styles.blockedContainer}>
                <Ionicons name="lock-closed" size={16} color={theme.colors.textOnPrimary} />
                <Text style={styles.blockedText}>Bloqueado</Text>
              </View>
            </View>
          )}

          {/* Botón completar: solo si NO está bloqueado */}
          {!isBlocked && !!habit.activeByUser && shouldCompleteToday && !isCompletedToday && (
            <TouchableWithoutFeedback
              onPress={handleComplete}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Animated.View style={[styles.completeButton, { transform: [{ scale: buttonScaleAnim }] }]}>
                <Text style={styles.buttonText}>Completar</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          )}

          {!isBlocked && !habit.activeByUser && (
            <TouchableWithoutFeedback
              onPress={handleReactivate}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Animated.View style={[styles.reactivateButton, { transform: [{ scale: buttonScaleAnim }] }]}>
                <Text style={styles.buttonText}>Reactivar</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          )}

          {!isBlocked && !!habit.activeByUser && isCompletedToday && (
            <View style={styles.completedBadge}>
              <View style={styles.completedContainer}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.textOnPrimary} />
                <Text style={styles.completedText}>Completado</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const createStyles = (theme: AppTheme, scale: number) => {
  const shadowOpacity = theme.name === 'dark' ? 0.35 : 0.1;
  const streakBackground = theme.name === 'dark'
    ? 'rgba(248, 113, 113, 0.2)'
    : '#FFE6E6';
  const futureBubble = theme.name === 'dark'
    ? theme.colors.borderStrong
    : theme.colors.border;

  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    name: {
      fontSize: 18 * scale,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: streakBackground,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    streak: {
      fontSize: 16 * scale,
      fontWeight: '600',
      color: theme.colors.danger,
    },
    details: {
      marginBottom: 12,
    },
    frequency: {
      fontSize: 14 * scale,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    status: {
      fontSize: 14 * scale,
      fontWeight: '600',
    },
    actions: {
      alignItems: 'flex-end',
    },
    completeButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    reactivateButton: {
      backgroundColor: theme.colors.warning,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    completedBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    blockedBadge: {
      backgroundColor: theme.colors.danger,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    buttonText: {
      color: theme.colors.textOnPrimary,
      fontWeight: '600',
      fontSize: 14 * scale,
    },
    completedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    completedText: {
      color: theme.colors.textOnPrimary,
      fontWeight: '600',
      fontSize: 14 * scale,
    },
    blockedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    blockedText: {
      color: theme.colors.textOnPrimary,
      fontWeight: '600',
      fontSize: 14 * scale,
    },
    timeline: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 12,
      paddingHorizontal: 8,
    },
    bubbleContainer: {
      alignItems: 'center',
      flex: 1,
    },
    bubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      overflow: 'hidden',
    },
    bubbleCompleted: {
      backgroundColor: theme.colors.primary,
    },
    bubblePending: {
      backgroundColor: theme.colors.warning,
    },
    bubbleMissed: {
      backgroundColor: theme.colors.danger,
    },
    bubbleFuture: {
      backgroundColor: futureBubble,
    },
    bubbleNotApplicable: {
      backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1.5,
      borderColor: theme.name === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    notApplicableLine: {
      position: 'absolute',
      width: 18,
      height: 1.5,
      backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
      transform: [{ rotate: '-45deg' }],
    },
    emptyBubble: {
      width: 32,
      height: 32,
      flex: 1,
    },
    bubbleLabel: {
      fontSize: 10 * scale,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    bubbleLabelMuted: {
      opacity: 0.4,
    },
  });
};



