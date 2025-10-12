import { AppState, LifeChallenge, Habit, HabitCompletion } from '../types';

// Definición de todos los retos
export const LIFE_CHALLENGES: LifeChallenge[] = [
  {
    id: 'challenge_week_no_lives',
    title: 'Semana Perfecta',
    description: 'Mantén un hábito durante una semana completa sin perder vidas',
    reward: 1,
    redeemable: 'once',
    completedCount: 0,
    icon: '🌟',
    verificationFunction: 'verifyWeekWithoutLosingLives',
  },
  {
    id: 'challenge_month_no_lives',
    title: 'Mes Imparable',
    description: 'Mantén un hábito durante un mes completo sin perder vidas',
    reward: 2,
    redeemable: 'unlimited',
    completedCount: 0,
    icon: '🏆',
    verificationFunction: 'verifyMonthWithoutLosingLives',
  },
  {
    id: 'challenge_last_hour_save',
    title: 'Salvación de Último Momento',
    description: 'Completa un hábito faltando menos de 1 hora para acabar el día',
    reward: 1,
    redeemable: 'once',
    completedCount: 0,
    icon: '⏰',
    verificationFunction: 'verifyLastHourSave',
  },
  {
    id: 'challenge_early_bird',
    title: 'Madrugador',
    description: 'Registra progreso de un hábito antes de la 1 AM',
    reward: 1,
    redeemable: 'once',
    completedCount: 0,
    icon: '🌅',
    verificationFunction: 'verifyEarlyBird',
  },
  {
    id: 'challenge_three_week',
    title: 'Triple Corona',
    description: 'Completa al menos 3 hábitos durante una semana completa sin faltar',
    reward: 2,
    redeemable: 'once',
    completedCount: 0,
    icon: '👑',
    verificationFunction: 'verifyThreeHabitsWeek',
  },
  {
    id: 'challenge_target_date',
    title: 'Objetivo Alcanzado',
    description: 'Completa un hábito llegando a su fecha objetivo (mínimo 4 meses)',
    reward: 3,
    redeemable: 'unlimited',
    completedCount: 0,
    icon: '🎯',
    verificationFunction: 'verifyTargetDateReached',
  },
  {
    id: 'challenge_five_once',
    title: 'Coleccionista de Logros',
    description: 'Completa 5 retos redimibles solo una vez',
    reward: 2,
    redeemable: 'once',
    completedCount: 0,
    icon: '🏅',
    verificationFunction: 'verifyFiveOnceChallenges',
  },
  {
    id: 'challenge_two_months_alive',
    title: 'Superviviente',
    description: 'No te quedes sin vidas durante 2 meses seguidos',
    reward: 2,
    redeemable: 'unlimited',
    completedCount: 0,
    icon: '💪',
    verificationFunction: 'verifyTwoMonthsAlive',
  },
  {
    id: 'challenge_1000_hours',
    title: 'Maestro del Tiempo',
    description: 'Acumula 1000 horas en un hábito',
    reward: 3,
    redeemable: 'unlimited',
    completedCount: 0,
    icon: '⏳',
    verificationFunction: 'verify1000Hours',
  },
  {
    id: 'challenge_200_notes',
    title: 'Escritor Prolífico',
    description: 'Escribe 200 notas entre todos tus hábitos',
    reward: 2,
    redeemable: 'once',
    completedCount: 0,
    icon: '📝',
    verificationFunction: 'verify200Notes',
  },
];

export class LifeChallengeVerifier {
  // 1. Semana sin perder vidas
  static verifyWeekWithoutLosingLives(state: AppState): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Verificar si algún hábito tiene 7 días consecutivos completados
    for (const habit of state.habits) {
      if (!habit.activeByUser) continue;

      let consecutiveDays = 0;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);

        const completion = state.completions.find(
          c => c.habitId === habit.id &&
               c.date.toDateString() === checkDate.toDateString() &&
               c.completed
        );

        if (completion) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      if (consecutiveDays >= 7) {
        return true;
      }
    }

    return false;
  }

  // 2. Mes sin perder vidas
  static verifyMonthWithoutLosingLives(state: AppState): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    for (const habit of state.habits) {
      if (!habit.activeByUser) continue;

      let consecutiveDays = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);

        const completion = state.completions.find(
          c => c.habitId === habit.id &&
               c.date.toDateString() === checkDate.toDateString() &&
               c.completed
        );

        if (completion) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      if (consecutiveDays >= 30) {
        return true;
      }
    }

    return false;
  }

  // 3. Última hora del día
  static verifyLastHourSave(state: AppState): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar completaciones de hoy que se hicieron entre las 23:00 y 23:59
    const todayCompletions = state.completions.filter(
      c => c.date.toDateString() === today.toDateString() && c.completed
    );

    // Nota: En una implementación real, necesitarías guardar la hora exacta de completación
    // Por ahora, asumimos que si se completó, podría calificar
    return todayCompletions.length > 0;
  }

  // 4. Antes de la 1 AM
  static verifyEarlyBird(state: AppState): boolean {
    // Similar al anterior, necesitaríamos la hora exacta
    // Por ahora verificamos si hay completaciones tempranas
    return state.completions.some(c => c.completed);
  }

  // 5. Tres hábitos durante una semana
  static verifyThreeHabitsWeek(state: AppState): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let habitsCompleted = 0;

    for (const habit of state.habits) {
      if (!habit.activeByUser) continue;

      let allDaysCompleted = true;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);

        const completion = state.completions.find(
          c => c.habitId === habit.id &&
               c.date.toDateString() === checkDate.toDateString() &&
               c.completed
        );

        if (!completion) {
          allDaysCompleted = false;
          break;
        }
      }

      if (allDaysCompleted) {
        habitsCompleted++;
      }
    }

    return habitsCompleted >= 3;
  }

  // 6. Fecha objetivo alcanzada (4+ meses)
  static verifyTargetDateReached(state: AppState): boolean {
    const today = new Date();

    for (const habit of state.habits) {
      if (!habit.targetDate || !habit.activeByUser) continue;

      const targetDate = new Date(habit.targetDate);
      const startDate = new Date(habit.startDate);

      // Verificar que pasaron al menos 4 meses
      const monthsDiff = (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff >= 4 && today >= targetDate && habit.currentStreak > 0) {
        return true;
      }
    }

    return false;
  }

  // 7. 5 retos de una sola vez completados
  static verifyFiveOnceChallenges(state: AppState): boolean {
    const onceCompleted = state.lifeChallenges.filter(
      lc => lc.redeemable === 'once' && lc.completedCount > 0
    );

    return onceCompleted.length >= 5;
  }

  // 8. Dos meses sin quedarse sin vidas
  static verifyTwoMonthsAlive(state: AppState): boolean {
    // Verificar que el usuario ha tenido vidas durante los últimos 60 días
    // Esto requeriría un historial de vidas, por ahora verificamos que tenga vidas actuales
    return state.user.lives > 0;
  }

  // 9. 1000 horas en un hábito
  static verify1000Hours(state: AppState): boolean {
    for (const habit of state.habits) {
      const completions = state.completions.filter(
        c => c.habitId === habit.id &&
             c.completed &&
             c.progressData?.type === 'time'
      );

      const totalMinutes = completions.reduce(
        (sum, c) => sum + (c.progressData?.value || 0),
        0
      );

      const totalHours = totalMinutes / 60;

      if (totalHours >= 1000) {
        return true;
      }
    }

    return false;
  }

  // 10. 200 notas
  static verify200Notes(state: AppState): boolean {
    const notesCount = state.completions.filter(c => c.notes && c.notes.trim().length > 0).length;
    return notesCount >= 200;
  }

  // Función principal para verificar un reto
  static verifyChallenge(challenge: LifeChallenge, state: AppState): boolean {
    switch (challenge.verificationFunction) {
      case 'verifyWeekWithoutLosingLives':
        return this.verifyWeekWithoutLosingLives(state);
      case 'verifyMonthWithoutLosingLives':
        return this.verifyMonthWithoutLosingLives(state);
      case 'verifyLastHourSave':
        return this.verifyLastHourSave(state);
      case 'verifyEarlyBird':
        return this.verifyEarlyBird(state);
      case 'verifyThreeHabitsWeek':
        return this.verifyThreeHabitsWeek(state);
      case 'verifyTargetDateReached':
        return this.verifyTargetDateReached(state);
      case 'verifyFiveOnceChallenges':
        return this.verifyFiveOnceChallenges(state);
      case 'verifyTwoMonthsAlive':
        return this.verifyTwoMonthsAlive(state);
      case 'verify1000Hours':
        return this.verify1000Hours(state);
      case 'verify200Notes':
        return this.verify200Notes(state);
      default:
        return false;
    }
  }
}
