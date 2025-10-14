export interface Habit {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  targetDate?: Date;
  currentStreak: number;
  frequency: Frequency;
  progressType: ProgressType;
  isActive: boolean; // Activo por el sistema (por vidas)
  activeByUser: boolean; // Activo/inactivo por decision del usuario
  lastCompletedDate?: Date;
  createdAt: Date;
}

export type ProgressType = 'yes_no' | 'time' | 'count';

export interface ProgressData {
  type: ProgressType;
  value?: number; // minutos para 'time', cantidad para 'count'
  targetValue?: number; // objetivo opcional
}

export interface Frequency {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sabado
}

export interface User {
  id: string;
  name: string;
  lives: number;
  maxLives: number;
  totalHabits: number;
  completedChallenges: string[];
  createdAt: Date;
  xp: number;
  league: number; // 1 (mejor) a 5 (inicial)
  weeklyXp: number; // XP acumulado en la semana actual
  leagueWeekStart: Date; // Inicio de la semana de la liga
  email?: string; // Email del usuario autenticado (opcional para compatibilidad)
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  theme?: 'light' | 'dark';
  font_size?: 'small' | 'medium' | 'large';
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'exercise' | 'learning' | 'mindfulness' | 'creative';
  estimatedTime: number; // en minutos
  isCompleted?: boolean;
}

export interface LifeChallenge {
  id: string;
  title: string;
  description: string;
  reward: number; // Vidas que otorga
  redeemable: 'once' | 'unlimited'; // Si se puede completar una sola vez o ilimitadamente
  completedCount: number; // Cuantas veces se ha completado
  icon: string; // Emoji para el reto
  verificationFunction: string; // Nombre de la funcion que verifica el reto
}

export interface HabitCompletion {
  habitId: string;
  date: Date;
  completed: boolean;
  progressData?: ProgressData; // datos de progreso segun el tipo
  notes?: string; // notas opcionales del dia
  images?: string[]; // URIs de imagenes opcionales
}

export interface LeagueCompetitor {
  id: string;
  name: string;
  weeklyXp: number;
  league: number;
  position: number;
}

export type ThemePreference = 'light' | 'dark';

export interface Settings {
  fontSize: 'small' | 'medium' | 'large';
  theme: ThemePreference;
}

export interface AppState {
  habits: Habit[];
  user: User;
  completions: HabitCompletion[];
  challenges: Challenge[];
  lifeChallenges: LifeChallenge[];
  settings: Settings;
}
