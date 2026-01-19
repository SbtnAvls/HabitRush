export interface Habit {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  targetDate?: Date;
  currentStreak: number;
  frequency: Frequency;
  progressType: ProgressType;
  targetValue?: number; // Obligatorio para time (minutos) y count (cantidad), null para yes_no
  isActive: boolean; // Activo por el sistema (por vidas)
  activeByUser: boolean; // Activo/inactivo por decision del usuario
  isBlocked: boolean; // Bloqueado por fallo - requiere resolver pending redemption
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

// Estado de un Life Challenge según el backend
export type LifeChallengeStatus = 'pending' | 'obtained' | 'redeemed';

export interface LifeChallenge {
  id: string;
  title: string;
  description: string;
  reward: number; // Vidas que otorga
  redeemable: 'once' | 'unlimited'; // Si se puede completar una sola vez o ilimitadamente
  icon: string; // Icono del reto
  // Campos del backend (estado evaluado por el servidor)
  status: LifeChallengeStatus; // Estado actual del reto para el usuario
  canRedeem: boolean; // TRUE si el usuario puede canjear AHORA (evaluado por backend)
  obtainedAt?: string | null; // Fecha cuando se obtuvo (si aplica)
  redeemedAt?: string | null; // Ultima fecha de canje (si aplica)
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

export type FontSizePreset = 'small' | 'medium' | 'large';

export interface Settings {
  fontSize: FontSizePreset | number; // Puede ser preset o valor numerico (0.8 - 1.3)
  theme: ThemePreference;
}

export interface AppState {
  habits: Habit[];
  user: User;
  completions: HabitCompletion[];
  challenges: Challenge[];
  lifeChallenges: LifeChallenge[];
  settings: Settings;
  pendingRedemptions: PendingRedemption[];
}

// ============================================
// Pending Redemptions (24h grace period)
// ============================================

export type PendingRedemptionStatus =
  | 'pending'           // Tiene 24h para decidir
  | 'challenge_assigned' // Eligió hacer un challenge, debe completarlo
  | 'redeemed_challenge' // Completó el challenge exitosamente
  | 'redeemed_life'      // Aceptó perder la vida
  | 'expired';           // No decidió a tiempo (perdió vida automáticamente)

export interface AvailableChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AssignedChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  proof_text?: string;
  proof_image_url?: string;
  validation_status?: 'pending' | 'approved' | 'rejected';
}

// ============================================
// Challenge Validation (Async System)
// ============================================

export type ChallengeValidationStatus =
  | 'pending_review'    // En espera de revisión
  | 'approved_manual'   // Aprobado por admin
  | 'approved_ai'       // Aprobado por IA
  | 'rejected_manual'   // Rechazado por admin
  | 'rejected_ai';      // Rechazado por IA

export interface ChallengeValidation {
  id: string;
  status: ChallengeValidationStatus;
  created_at: string;
  expires_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  ai_result: {
    reasoning: string;
    confidence_score?: number;
  } | null;
}

export interface SubmitChallengeProofResponse {
  success: boolean;
  validation_id: string;
  status: 'pending_review';
  estimated_review_time: string;
}

export interface ValidationStatusResponse {
  success: boolean;
  has_validation: boolean;
  validation: ChallengeValidation | null;
}

// Error codes del backend para validación de challenges
export type ChallengeValidationErrorCode =
  | 'VALIDATION_PENDING'
  | 'MAX_RETRIES_EXCEEDED'
  | 'REDEMPTION_TIME_EXPIRED'
  | 'REDEMPTION_EXPIRED'
  | 'IMAGE_TOO_LARGE'
  | 'INVALID_IMAGE_FORMAT'
  | 'NO_CHALLENGE_ASSIGNED'
  | 'ALREADY_COMPLETED';

export interface PendingRedemption {
  id: string;
  habit_id: string;
  habit_name: string;
  failed_date: string;
  expires_at: string;
  status: PendingRedemptionStatus;
  has_challenge_assigned: boolean;
  assigned_challenge: AssignedChallenge | null;
  available_challenges: AvailableChallenge[];
  time_remaining_ms: number;
}
