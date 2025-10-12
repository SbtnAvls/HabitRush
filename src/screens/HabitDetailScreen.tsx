import React, { useMemo } from 'react';
import {
  View,
  Text,

  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Habit, HabitCompletion } from '../types';
import { CompletionDetailItem } from '../components/CompletionDetailItem';
import { useThemedStyles } from '../theme/useThemedStyles';

interface MetricData {
  period: 'week' | 'month' | 'year';
  completed: number;
  total: number;
  percentage: number;
  totalTime?: number; // para tipo 'time' en minutos
  totalCount?: number; // para tipo 'count'
  average?: number;
}

export const HabitDetailScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const styles = useThemedStyles(baseStyles);
  const { state, activateHabit, deactivateHabit } = useAppContext();
  const { habitId } = route?.params || {};

  const habit = useMemo(
    () => state.habits.find((h) => h.id === habitId),
    [state.habits, habitId]
  );

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text>Hábito no encontrado</Text>
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
    
    // Calcular días totales esperados basado en frecuencia
    let totalExpectedDays = 0;
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (habit.frequency.type === 'daily') {
      totalExpectedDays = daysDiff;
    } else if (habit.frequency.daysOfWeek) {
      // Contar cuántos días de la semana seleccionados hay en el período
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

    // Calcular métricas específicas según el tipo de progreso
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
      // Confirmar desactivación
      Alert.alert(
        'Desactivar Hábito',
        'Al desactivar este hábito:\n\n• Se borrará todo tu progreso y racha\n• Se mantendrán las notas e imágenes que agregaste\n• Podrás reactivarlo cuando quieras\n\n¿Estás seguro?',
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
      // Activar sin confirmación
      activateHabit(habit.id);
      navigation.goBack();
    }
  };

  // Obtener completaciones recientes con detalles
  const recentCompletions = useMemo(() => {
    return state.completions
      .filter(c => c.habitId === habit.id && c.completed)
      .filter(c => c.notes || (c.images && c.images.length > 0))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10); // Últimas 10 con detalles
  }, [state.completions, habit.id]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressTypeLabel = (type: string): string => {
    switch (type) {
      case 'yes_no':
        return 'Sí/No';
      case 'time':
        return 'Tiempo';
      case 'count':
        return 'Cantidad';
      default:
        return type;
    }
  };

  const renderMetricCard = (metric: MetricData) => {
    const periodLabel =
      metric.period === 'week' ? 'Semanal' : metric.period === 'month' ? 'Mensual' : 'Anual';

    return (
      <View key={metric.period} style={styles.metricCard}>
        <Text style={styles.metricPeriod}>{periodLabel}</Text>
        
        <View style={styles.metricContent}>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{metric.percentage}%</Text>
            <Text style={styles.percentageLabel}>Completado</Text>
          </View>

          <View style={styles.metricDetails}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Días completados:</Text>
              <Text style={styles.metricValue}>
                {metric.completed} / {metric.total}
              </Text>
            </View>

            {habit.progressType === 'time' && metric.totalTime !== undefined && (
              <>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Tiempo total:</Text>
                  <Text style={styles.metricValue}>{formatTime(metric.totalTime)}</Text>
                </View>
                {metric.average !== undefined && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Promedio por día:</Text>
                    <Text style={styles.metricValue}>{formatTime(metric.average)}</Text>
                  </View>
                )}
              </>
            )}

            {habit.progressType === 'count' && metric.totalCount !== undefined && (
              <>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Total:</Text>
                  <Text style={styles.metricValue}>{metric.totalCount}</Text>
                </View>
                {metric.average !== undefined && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Promedio por día:</Text>
                    <Text style={styles.metricValue}>{metric.average}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleStatus} style={styles.statusButton}>
          <Text style={[
            styles.statusButtonText,
            { color: habit.activeByUser ? '#FF6B6B' : '#4ECDC4' }
          ]}>
            {habit.activeByUser ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Información del hábito */}
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{habit.name}</Text>
          
          {habit.description && (
            <Text style={styles.habitDescription}>{habit.description}</Text>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha de inicio</Text>
              <Text style={styles.infoValue}>
                {new Date(habit.startDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {habit.targetDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha objetivo</Text>
                <Text style={styles.infoValue}>
                  {new Date(habit.targetDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tipo de progreso</Text>
              <Text style={styles.infoValue}>{getProgressTypeLabel(habit.progressType)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Racha actual</Text>
              <Text style={[styles.infoValue, styles.streakValue]}>
                {habit.currentStreak} días
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Estado</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: habit.isActive ? '#4ECDC4' : '#FF6B6B' },
                ]}
              >
                <Text style={styles.statusText}>
                  {habit.isActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Métricas */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          {renderMetricCard(weekMetrics)}
          {renderMetricCard(monthMetrics)}
          {renderMetricCard(yearMetrics)}
        </View>

        {/* Historial de completaciones con detalles */}
        {recentCompletions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historial con Detalles</Text>
            <Text style={styles.sectionSubtitle}>
              Días donde agregaste notas o imágenes
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

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  habitInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  habitName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  habitDescription: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  infoItem: {
    width: '50%',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  streakValue: {
    color: '#E74C3C',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricPeriod: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  metricContent: {
    flexDirection: 'row',
  },
  percentageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    minWidth: 80,
  },
  percentageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  metricDetails: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
} as const;



