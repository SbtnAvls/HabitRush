import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Habit, HabitCompletion } from '../types';
import { HabitLogic } from '../services/habitLogic';
import { useTheme } from '../theme/useTheme';
import { useFontScale } from '../theme/useFontScale';
import { AppTheme } from '../theme';

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
  const theme = useTheme();
  const { scale } = useFontScale();
  const styles = useMemo(() => createStyles(theme, scale), [theme, scale]);

  const shouldCompleteToday = HabitLogic.shouldCompleteToday(habit);
  const isActive = habit.isActive;

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

    return (
      <View style={styles.timeline}>
        {weekDays.map((date, index) => {
          if (!shouldShowBubble(date)) {
            return <View key={index} style={styles.emptyBubble} />;
          }

          const completed = isDayCompleted(date);
          const isToday = date.toDateString() === today.toDateString();
          const isFuture = date > today;

          let bubbleStyle = styles.bubbleMissed;
          if (completed) {
            bubbleStyle = styles.bubbleCompleted;
          } else if (isFuture) {
            bubbleStyle = styles.bubbleFuture;
          }

          return (
            <View key={index} style={styles.bubbleContainer}>
              <View style={[styles.bubble, bubbleStyle]}>
                {isToday && <View style={styles.todayIndicator} />}
              </View>
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
    if (!isActive && availableChallenges.length > 0) {
      const randomChallenge = HabitLogic.getRandomChallenges(availableChallenges, 1)[0];
      Alert.alert(
        'Reactivar habito',
        `Para reactivar "${habit.name}" completa el reto:` +
          `\n\n${randomChallenge.title}\n\n${randomChallenge.description}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Completar reto',
            onPress: () => {
              Alert.alert(
                'Reto completado',
                'Has completado el reto?',
                [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Si',
                    onPress: () => onReactivate(habit.id),
                  },
                ]
              );
            },
          },
        ]
      );
    }
  };

  const getStatusColor = () => {
    if (!isActive) return theme.colors.danger;
    if (isCompletedToday) return theme.colors.primary;
    if (shouldCompleteToday) return theme.colors.warning;
    return theme.colors.textMuted;
  };

  const getStatusText = () => {
    if (!isActive) return 'Inactivo';
    if (isCompletedToday) return 'Completado';
    if (shouldCompleteToday) return 'Pendiente';
    return 'No requerido hoy';
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getStatusColor() }]}
      onPress={() => onPress(habit.id)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{habit.name}</Text>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={16} color={theme.colors.danger} />
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
        {isActive && shouldCompleteToday && !isCompletedToday && (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.buttonText}>Completar</Text>
          </TouchableOpacity>
        )}

        {!isActive && (
          <TouchableOpacity style={styles.reactivateButton} onPress={handleReactivate}>
            <Text style={styles.buttonText}>Reactivar</Text>
          </TouchableOpacity>
        )}

        {isActive && isCompletedToday && (
          <View style={styles.completedBadge}>
            <View style={styles.completedContainer}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.textOnPrimary} />
              <Text style={styles.completedText}>Completado</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
      position: 'relative',
    },
    bubbleCompleted: {
      backgroundColor: theme.colors.primary,
    },
    bubbleMissed: {
      backgroundColor: theme.colors.danger,
    },
    bubbleFuture: {
      backgroundColor: futureBubble,
    },
    emptyBubble: {
      width: 32,
      height: 32,
      flex: 1,
    },
    todayIndicator: {
      position: 'absolute',
      bottom: -2,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.warning,
    },
    bubbleLabel: {
      fontSize: 10 * scale,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
  });
};



