import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppTheme, getTheme } from './index';

export const useTheme = (): AppTheme => {
  const { currentTheme } = useAppContext();

  return useMemo(() => getTheme(currentTheme), [currentTheme]);
};

export const useThemeName = () => {
  const { currentTheme } = useAppContext();
  return currentTheme;
};

