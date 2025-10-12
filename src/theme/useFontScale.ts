import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const SCALE_MAP = {
  small: 0.9,
  medium: 1,
  large: 1.1,
} as const;

type ScaleKey = keyof typeof SCALE_MAP;

export const useFontScale = () => {
  const { state } = useAppContext();
  const preference = state.settings.fontSize as ScaleKey;
  const scale = SCALE_MAP[preference] ?? 1;

  return useMemo(
    () => ({
      scale,
      scaleValue: (size: number) => size * scale,
    }),
    [scale],
  );
};

