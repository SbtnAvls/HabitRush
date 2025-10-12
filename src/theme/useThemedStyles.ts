import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppTheme } from './index';
import { useTheme } from './useTheme';
import { useFontScale } from './useFontScale';

const COLOR_MAP: Record<string, (theme: AppTheme) => string> = {
  '#FFFFFF': (theme) => theme.colors.surface,
  '#F8F9FA': (theme) => theme.colors.background,
  '#F5F7FA': (theme) => theme.colors.background,
  '#EEF1F7': (theme) => theme.colors.backgroundAlt,
  '#F1F3F5': (theme) => theme.colors.surfaceSecondary,
  '#E7F3FF': (theme) => theme.colors.surfaceSecondary,
  '#E3F2FD': (theme) => theme.colors.surfaceSecondary,
  '#F8FAFC': (theme) => theme.colors.backgroundAlt,
  '#F0FFFE': (theme) => theme.colors.primarySoft,
  '#E8F8F7': (theme) => theme.colors.primarySoft,
  '#FFE6F0': (theme) => (theme.name === 'dark' ? 'rgba(78, 205, 196, 0.15)' : theme.colors.primarySoft),
  '#FFE6FF': (theme) => theme.colors.primarySoft,
  '#2C3E50': (theme) => theme.colors.textPrimary,
  '#212529': (theme) => theme.colors.textPrimary,
  '#004085': (theme) => theme.colors.textSecondary,
  '#155724': (theme) => theme.colors.success,
  '#28A745': (theme) => theme.colors.success,
  '#475569': (theme) => theme.colors.textSecondary,
  '#6C757D': (theme) => theme.colors.textMuted,
  '#7F8C8D': (theme) => theme.colors.textMuted,
  '#856404': (theme) => theme.colors.warning,
  '#90EE90': (theme) => theme.colors.success,
  '#95A5A6': (theme) => theme.colors.textMuted,
  '#A0AEC0': (theme) => theme.colors.textMuted,
  '#C3E6CB': (theme) => theme.colors.success,
  '#D4EDDA': (theme) => theme.colors.surfaceSecondary,
  '#E9ECEF': (theme) => theme.colors.border,
  '#4ECDC4': (theme) => theme.colors.primary,
  '#E74C3C': (theme) => theme.colors.danger,
  '#FF6B6B': (theme) => theme.colors.danger,
  '#FFE6E6': (theme) => (theme.name === 'dark' ? 'rgba(248, 113, 113, 0.2)' : '#FFE6E6'),
  '#FFE66D': (theme) => theme.colors.warning,
  '#FFE69C': (theme) => theme.colors.warning,
  '#FFF3CD': (theme) => theme.colors.warning,
};

const normalizeColorKey = (value: string) => value.trim().toUpperCase();

const isOverlay = (value: string) =>
  /^RGBA\(0,\s*0,\s*0,\s*0\.\d+\)$/.test(value);

const transformStyleValue = (
  key: string,
  value: any,
  theme: AppTheme,
  scale: number,
): any => {
  if (typeof value === 'string') {
    const normalized = normalizeColorKey(value);
    if (COLOR_MAP[normalized]) {
      return COLOR_MAP[normalized](theme);
    }
    if (isOverlay(normalized)) {
      return theme.colors.overlay;
    }
    return value;
  }

  if (typeof value === 'number' && key === 'fontSize') {
    return value * scale;
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformNestedStyle(item, theme, scale));
  }

  if (value && typeof value === 'object') {
    return transformNestedStyle(value, theme, scale);
  }

  return value;
};

const transformNestedStyle = (style: any, theme: AppTheme, scale: number) => {
  if (!style || typeof style !== 'object') {
    return style;
  }

  const result: Record<string, any> = {};

  Object.entries(style).forEach(([key, value]) => {
    result[key] = transformStyleValue(key, value, theme, scale);
  });

  return result;
};

export const useThemedStyles = <T extends Record<string, any>>(baseStyles: T) => {
  const theme = useTheme();
  const { scale } = useFontScale();

  return useMemo(() => {
    const themedStyles: Record<string, any> = {};

    Object.entries(baseStyles).forEach(([key, style]) => {
      themedStyles[key] = transformNestedStyle(style, theme, scale);
    });

    return StyleSheet.create(themedStyles) as { [K in keyof T]: any };
  }, [baseStyles, theme, scale]);
};

