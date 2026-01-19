import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { FontSizePreset } from '../types';

const PRESET_SCALE_MAP: Record<FontSizePreset, number> = {
  small: 0.9,
  medium: 1,
  large: 1.1,
};

export const getFontScale = (fontSize: FontSizePreset | number): number => {
  if (typeof fontSize === 'number') {
    // Clamp entre 0.8 y 1.3
    return Math.min(1.3, Math.max(0.8, fontSize));
  }
  return PRESET_SCALE_MAP[fontSize] ?? 1;
};

export const useFontScale = () => {
  const { state } = useAppContext();
  const scale = getFontScale(state.settings.fontSize);

  return useMemo(
    () => ({
      scale,
      scaleValue: (size: number) => size * scale,
    }),
    [scale],
  );
};
