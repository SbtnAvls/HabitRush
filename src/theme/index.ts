import { ThemePreference } from '../types';

export interface AppTheme {
  name: ThemePreference;
  statusBarStyle: 'light-content' | 'dark-content';
  colors: {
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceSecondary: string;
    primary: string;
    primarySoft: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    border: string;
    borderStrong: string;
    success: string;
    warning: string;
    danger: string;
    overlay: string;
    tabBarBackground: string;
    tabBarBorder: string;
    chipBackground: string;
  };
}

export const lightTheme: AppTheme = {
  name: 'light',
  statusBarStyle: 'dark-content',
  colors: {
    background: '#F5F7FA',
    backgroundAlt: '#EEF1F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F3F5',
    primary: '#4ECDC4',
    primarySoft: '#E6FFFB',
    textPrimary: '#1F2933',
    textSecondary: '#475569',
    textMuted: '#6C757D',
    textOnPrimary: '#FFFFFF',
    border: '#E5E7EB',
    borderStrong: '#CBD5E1',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.2)',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    chipBackground: '#F8FAFC',
  },
};

export const darkTheme: AppTheme = {
  name: 'dark',
  statusBarStyle: 'light-content',
  colors: {
    background: '#111827',
    backgroundAlt: '#161F2F',
    surface: '#1F2937',
    surfaceSecondary: '#273245',
    primary: '#4ECDC4',
    primarySoft: '#144D49',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5F5',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    border: '#27303F',
    borderStrong: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    overlay: 'rgba(15, 23, 42, 0.65)',
    tabBarBackground: '#1F2937',
    tabBarBorder: '#27303F',
    chipBackground: '#1E293B',
  },
};

export const getTheme = (preference: ThemePreference): AppTheme =>
  preference === 'dark' ? darkTheme : lightTheme;


