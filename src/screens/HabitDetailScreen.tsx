import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { Habit, HabitCompletion } from '../types';
import { CompletionDetailItem } from '../components/CompletionDetailItem';
import { useTheme } from '../theme/useTheme';
import { AppTheme } from '../theme';

const { width } = Dimensions.get('window');

interface MetricData {
  period: 'week' | 'month' | 'year';
  completed: number;
  total: number;
  percentage: number;
  totalTime?: number;
  totalCount?: number;
  average?: number;
}

export const HabitDetailScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { state, activateHabit, deactivateHabit } = useAppContext();
  const { habitId } = route?.params || {};

  // Animations
  const streakScale = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  const habit = useMemo(
    () => state.habits.find((h) => h.id === habitId),
    [state.habits, habitId]
  );

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.spring(streakScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress after a delay
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 300);
  }, []);

  if (!habit) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.errorText}>Habito no encontrado</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const calculateMetrics = (
    habit: Habit,
    completions: HabitCompletion[],
    period: 'week' | 'month' | 'year'
  ): MetricData => {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const relevantCompletions = completions.filter(
      (c) => c.habitId === habit.id && c.date >= startDate && c.date <= now
    );

    const completedDays = relevantCompletions.filter((c) => c.completed).length;

    let totalExpectedDays = 0;
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (habit.frequency.type === 'daily') {
      totalExpectedDays = daysDiff;
    } else if (habit.frequency.daysOfWeek) {
      for (let i = 0; i < daysDiff; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);
        if (habit.frequency.daysOfWeek.includes(checkDate.getDay())) {
          totalExpectedDays++;
        }
      }
    }

    const percentage = totalExpectedDays > 0 ? (completedDays / totalExpectedDays) * 100 : 0;

    const result: MetricData = {
      period,
      completed: completedDays,
      total: totalExpectedDays,
      percentage: Math.round(percentage),
    };

    if (habit.progressType === 'time') {
      const totalMinutes = relevantCompletions
        .filter((c) => c.completed && c.progressData?.value)
        .reduce((sum, c) => sum + (c.progressData?.value || 0), 0);
      result.totalTime = totalMinutes;
      result.average = completedDays > 0 ? Math.round(totalMinutes / completedDays) : 0;
    } else if (habit.progressType === 'count') {
      const totalCount = relevantCompletions
        .filter((c) => c.completed && c.progressData?.value)
        .reduce((sum, c) => sum + (c.progressData?.value || 0), 0);
      result.totalCount = totalCount;
      result.average = completedDays > 0 ? Math.round(totalCount / completedDays) : 0;
    }

    return result;
  };

  const weekMetrics = calculateMetrics(habit, state.completions, 'week');
  const monthMetrics = calculateMetrics(habit, state.completions, 'month');
  const yearMetrics = calculateMetrics(habit, state.completions, 'year');

  const handleToggleStatus = () => {
    if (habit.activeByUser) {
      Alert.alert(
        'Desactivar Habito',
        'Al desactivar este habito:\n\n• Se borrara todo tu progreso y racha\n• Se mantendran las notas e imagenes\n• Podras reactivarlo cuando quieras\n\n⚠️ IMPORTANTE: Si el habito permanece inactivo durante mas de una semana, sera eliminado automaticamente junto con todos sus datos.\n\n¿Estas seguro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: async () => {
              await deactivateHabit(habit.id);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      activateHabit(habit.id);
      navigation.goBack();
    }
  };

  const recentCompletions = useMemo(() => {
    return state.completions
      .filter(c => c.habitId === habit.id && c.completed)
      .filter(c => c.notes || (c.images && c.images.length > 0))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [state.completions, habit.id]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getFrequencyText = (): string => {
    if (habit.frequency.type === 'daily') {
      return 'Todos los dias';
    }
    if (habit.frequency.daysOfWeek && habit.frequency.daysOfWeek.length > 0) {
      const days = [...habit.frequency.daysOfWeek].sort((a, b) => a - b);
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      return days.map((d) => dayNames[d]).join(', ');
    }
    return 'Personalizado';
  };

  const getProgressTypeInfo = () => {
    switch (habit.progressType) {
      case 'time':
        return { icon: 'time-outline', label: 'Tiempo' };
      case 'count':
        return { icon: 'repeat-outline', label: 'Cantidad' };
      default:
        return { icon: 'checkbox-outline', label: 'Si/No' };
    }
  };

  const getDaysSinceStart = () => {
    const start = new Date(habit.startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Weekly timeline
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
    if (habit.frequency.type === 'daily') return true;
    if (habit.frequency.daysOfWeek) {
      return habit.frequency.daysOfWeek.includes(date.getDay());
    }
    return false;
  };

  const isDayCompleted = (date: Date): boolean => {
    const completion = state.completions.find(
      (c) => c.habitId === habit.id && c.date.toDateString() === date.toDateString()
    );
    return completion?.completed || false;
  };

  const renderWeekTimeline = () => {
    const weekDays = getCurrentWeekDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return (
      <View style={styles.weekContainer}>
        <Text style={styles.sectionLabel}>Esta semana</Text>
        <View style={styles.weekRow}>
          {weekDays.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            const dayApplies = shouldShowBubble(date);
            const isCompleted = isDayCompleted(date);
            const isPast = date < today;
            const isFuture = date > today;

            // Si el día NO aplica a este hábito
            if (!dayApplies) {
              return (
                <View key={index} style={styles.dayColumn}>
                  <View style={[styles.dayBubble, styles.dayBubbleNotApplicable]}>
                    <View style={styles.notApplicableLine} />
                  </View>
                  <Text style={[styles.dayLabel, styles.dayLabelMuted]}>
                    {dayLabels[(date.getDay() + 6) % 7]}
                  </Text>
                </View>
              );
            }

            let bubbleStyle = styles.dayBubbleInactive;
            let iconName: string | null = null;

            if (isCompleted) {
              bubbleStyle = styles.dayBubbleCompleted;
              iconName = 'checkmark';
            } else if (isToday) {
              bubbleStyle = styles.dayBubblePending;
            } else if (isPast) {
              bubbleStyle = styles.dayBubbleMissed;
              iconName = 'close';
            } else if (isFuture) {
              bubbleStyle = styles.dayBubbleFuture;
            }

            return (
              <View key={index} style={styles.dayColumn}>
                <View style={[styles.dayBubble, bubbleStyle, isToday && styles.dayBubbleToday]}>
                  {iconName ? (
                    <Ionicons
                      name={iconName as any}
                      size={16}
                      color={isCompleted ? '#FFFFFF' : theme.colors.danger}
                    />
                  ) : (
                    <View style={styles.dayDot} />
                  )}
                </View>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {dayLabels[(date.getDay() + 6) % 7]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderProgressRing = (percentage: number, size: number = 80) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={[styles.progressRingBg, { width: size, height: size, borderRadius: size / 2 }]} />
        <Animated.View
          style={[
            styles.progressRingFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: theme.colors.primary,
              borderRightColor: 'transparent',
              borderBottomColor: percentage > 25 ? theme.colors.primary : 'transparent',
              borderLeftColor: percentage > 50 ? theme.colors.primary : 'transparent',
              borderTopColor: percentage > 75 ? theme.colors.primary : 'transparent',
              transform: [{ rotate: '-45deg' }],
            }
          ]}
        />
        <View style={styles.progressRingCenter}>
          <Text style={styles.progressRingText}>{percentage}%</Text>
        </View>
      </View>
    );
  };

  const renderMetricCard = (metric: MetricData, index: number) => {
    const periodLabels = {
      week: { short: '7D', long: 'Ultima semana' },
      month: { short: '30D', long: 'Ultimo mes' },
      year: { short: '1A', long: 'Ultimo a\u00f1o' },
    };
    const label = periodLabels[metric.period];
    const colors = [theme.colors.primary, theme.colors.success, theme.colors.warning];

    return (
      <Animated.View
        key={metric.period}
        style={[
          styles.metricCard,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }
        ]}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricBadge, { backgroundColor: colors[index] + '20' }]}>
            <Text style={[styles.metricBadgeText, { color: colors[index] }]}>{label.short}</Text>
          </View>
          <Text style={styles.metricTitle}>{label.long}</Text>
        </View>

        <View style={styles.metricBody}>
          <View style={styles.metricProgress}>
            {renderProgressRing(metric.percentage, 70)}
          </View>

          <View style={styles.metricStats}>
            <View style={styles.metricStatRow}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.metricStatLabel}>Completados</Text>
              <Text style={styles.metricStatValue}>{metric.completed}/{metric.total}</Text>
            </View>

            {habit.progressType === 'time' && metric.totalTime !== undefined && (
              <>
                <View style={styles.metricStatRow}>
                  <Ionicons name="time" size={16} color={theme.colors.primary} />
                  <Text style={styles.metricStatLabel}>Total</Text>
                  <Text style={styles.metricStatValue}>{formatTime(metric.totalTime)}</Text>
                </View>
                {metric.average !== undefined && metric.average > 0 && (
                  <View style={styles.metricStatRow}>
                    <Ionicons name="analytics" size={16} color={theme.colors.warning} />
                    <Text style={styles.metricStatLabel}>Promedio</Text>
                    <Text style={styles.metricStatValue}>{formatTime(metric.average)}</Text>
                  </View>
                )}
              </>
            )}

            {habit.progressType === 'count' && metric.totalCount !== undefined && (
              <>
                <View style={styles.metricStatRow}>
                  <Ionicons name="repeat" size={16} color={theme.colors.primary} />
                  <Text style={styles.metricStatLabel}>Total</Text>
                  <Text style={styles.metricStatValue}>{metric.totalCount}</Text>
                </View>
                {metric.average !== undefined && metric.average > 0 && (
                  <View style={styles.metricStatRow}>
                    <Ionicons name="analytics" size={16} color={theme.colors.warning} />
                    <Text style={styles.metricStatLabel}>Promedio</Text>
                    <Text style={styles.metricStatValue}>{metric.average}/dia</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const progressInfo = getProgressTypeInfo();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleStatus}
          style={[
            styles.statusToggle,
            { backgroundColor: habit.activeByUser ? theme.colors.danger + '15' : theme.colors.success + '15' }
          ]}
        >
          <Ionicons
            name={habit.activeByUser ? 'pause-circle-outline' : 'play-circle-outline'}
            size={20}
            color={habit.activeByUser ? theme.colors.danger : theme.colors.success}
          />
          <Text style={[
            styles.statusToggleText,
            { color: habit.activeByUser ? theme.colors.danger : theme.colors.success }
          ]}>
            {habit.activeByUser ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.heroCard, { transform: [{ scale: streakScale }] }]}>
            {/* Habit Name & Status */}
            <View style={styles.heroHeader}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: habit.isActive ? theme.colors.success : theme.colors.danger }
              ]} />
              <Text style={styles.heroTitle}>{habit.name}</Text>
            </View>

            {habit.description && (
              <Text style={styles.heroDescription}>{habit.description}</Text>
            )}

            {/* Streak Display */}
            <View style={styles.streakDisplay}>
              <View style={styles.streakIconContainer}>
                <Ionicons name="flame" size={48} color={theme.colors.danger} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakNumber}>{habit.currentStreak}</Text>
                <Text style={styles.streakLabel}>dias de racha</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.quickStatValue}>{getDaysSinceStart()}</Text>
                <Text style={styles.quickStatLabel}>dias activo</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Ionicons name={progressInfo.icon as any} size={20} color={theme.colors.primary} />
                <Text style={styles.quickStatValue}>{progressInfo.label}</Text>
                <Text style={styles.quickStatLabel}>tipo</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Ionicons name="repeat-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.quickStatValue}>{habit.frequency.daysOfWeek?.length || 7}</Text>
                <Text style={styles.quickStatLabel}>dias/sem</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Inactive Warning Banner */}
        {!habit.activeByUser && (
          <View style={styles.inactiveWarningBanner}>
            <View style={styles.inactiveWarningIconContainer}>
              <Ionicons name="warning" size={24} color={theme.colors.warning} />
            </View>
            <View style={styles.inactiveWarningContent}>
              <Text style={styles.inactiveWarningTitle}>Habito inactivo</Text>
              <Text style={styles.inactiveWarningText}>
                Si este habito permanece inactivo durante mas de una semana, sera eliminado automaticamente junto con todos sus datos.
              </Text>
            </View>
          </View>
        )}

        {/* Week Timeline */}
        {renderWeekTimeline()}

        {/* Frequency Info */}
        <View style={styles.frequencyContainer}>
          <View style={styles.frequencyRow}>
            <Ionicons name="calendar" size={18} color={theme.colors.textMuted} />
            <Text style={styles.frequencyText}>{getFrequencyText()}</Text>
          </View>
          {habit.targetDate && (
            <View style={styles.frequencyRow}>
              <Ionicons name="flag" size={18} color={theme.colors.warning} />
              <Text style={styles.frequencyText}>
                Meta: {new Date(habit.targetDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Estadisticas</Text>
          {renderMetricCard(weekMetrics, 0)}
          {renderMetricCard(monthMetrics, 1)}
          {renderMetricCard(yearMetrics, 2)}
        </View>

        {/* History Section */}
        {recentCompletions.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={22} color={theme.colors.textPrimary} />
              <Text style={styles.sectionTitle}>Historial con detalles</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Dias donde agregaste notas o imagenes
            </Text>
            {recentCompletions.map((completion, index) => (
              <CompletionDetailItem key={index} completion={completion} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const isDark = theme.name === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      color: theme.colors.textMuted,
      marginTop: 16,
      marginBottom: 24,
    },
    errorButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    errorButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: theme.colors.background,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statusToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 6,
    },
    statusToggleText: {
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    heroSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    heroDescription: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    streakDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : '#FFF5F5',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    streakIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : '#FFECEC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    streakInfo: {
      marginLeft: 16,
      flex: 1,
    },
    streakNumber: {
      fontSize: 42,
      fontWeight: 'bold',
      color: theme.colors.danger,
    },
    streakLabel: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: -4,
    },
    quickStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    quickStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    quickStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
    },
    quickStatValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 6,
    },
    quickStatLabel: {
      fontSize: 11,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    weekContainer: {
      marginHorizontal: 16,
      marginTop: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 16,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayColumn: {
      alignItems: 'center',
    },
    dayBubble: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    dayBubbleCompleted: {
      backgroundColor: theme.colors.success,
    },
    dayBubblePending: {
      backgroundColor: theme.colors.warning,
    },
    dayBubbleMissed: {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : '#FFECEC',
    },
    dayBubbleFuture: {
      backgroundColor: theme.colors.surfaceSecondary,
    },
    dayBubbleInactive: {
      backgroundColor: theme.colors.surfaceSecondary,
    },
    dayBubbleDisabled: {
      backgroundColor: 'transparent',
    },
    dayBubbleNotApplicable: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
    notApplicableLine: {
      position: 'absolute',
      width: 20,
      height: 1.5,
      backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
      transform: [{ rotate: '-45deg' }],
    },
    dayBubbleToday: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    dayDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textMuted,
    },
    dayLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    dayLabelToday: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    dayLabelMuted: {
      opacity: 0.4,
    },
    frequencyContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    frequencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    frequencyText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    metricsSection: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    metricCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    metricBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 10,
    },
    metricBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    metricTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    metricBody: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metricProgress: {
      marginRight: 20,
    },
    progressRingBg: {
      position: 'absolute',
      borderWidth: 8,
      borderColor: theme.colors.surfaceSecondary,
    },
    progressRingFill: {
      position: 'absolute',
    },
    progressRingCenter: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressRingText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    metricStats: {
      flex: 1,
      gap: 10,
    },
    metricStatRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metricStatLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    metricStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    historySection: {
      marginTop: 24,
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginBottom: 16,
      marginTop: -8,
    },
    inactiveWarningBanner: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.3)' : '#FDE68A',
    },
    inactiveWarningIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FDE68A',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    inactiveWarningContent: {
      flex: 1,
    },
    inactiveWarningTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#FBBF24' : '#B45309',
      marginBottom: 4,
    },
    inactiveWarningText: {
      fontSize: 13,
      color: isDark ? 'rgba(251, 191, 36, 0.9)' : '#92400E',
      lineHeight: 18,
    },
  });
};
