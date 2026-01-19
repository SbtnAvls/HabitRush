import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce' | 'fadeSlideUp';

interface AnimatedViewProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  index?: number; // Para animaciones escalonadas
  staggerDelay?: number; // Delay entre cada elemento en animaciones escalonadas
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  animation = 'fadeSlideUp',
  delay = 0,
  duration = 400,
  style,
  index = 0,
  staggerDelay = 100,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.3)).current;
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalDelay = delay + (index * staggerDelay);

    if (animation === 'bounce') {
      Animated.sequence([
        Animated.delay(totalDelay),
        Animated.spring(bounceValue, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (animation === 'scale') {
      Animated.sequence([
        Animated.delay(totalDelay),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.delay(totalDelay),
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const getAnimatedStyle = (): Animated.AnimatedProps<ViewStyle> => {
    switch (animation) {
      case 'fadeIn':
        return {
          opacity: animValue,
        };

      case 'slideUp':
        return {
          opacity: animValue,
          transform: [{
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        };

      case 'slideDown':
        return {
          opacity: animValue,
          transform: [{
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0],
            }),
          }],
        };

      case 'slideLeft':
        return {
          opacity: animValue,
          transform: [{
            translateX: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        };

      case 'slideRight':
        return {
          opacity: animValue,
          transform: [{
            translateX: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0],
            }),
          }],
        };

      case 'scale':
        return {
          opacity: scaleValue,
          transform: [{ scale: scaleValue }],
        };

      case 'bounce':
        return {
          opacity: bounceValue,
          transform: [{
            scale: bounceValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 1.1, 1],
            }),
          }],
        };

      case 'fadeSlideUp':
      default:
        return {
          opacity: animValue,
          transform: [{
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        };
    }
  };

  return (
    <Animated.View style={[style, getAnimatedStyle() as any]}>
      {children}
    </Animated.View>
  );
};

// Hook para crear animaciones manuales
export const useEntranceAnimation = (delay: number = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const animate = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const reset = () => {
    opacity.setValue(0);
    translateY.setValue(30);
    scale.setValue(0.9);
  };

  return {
    opacity,
    translateY,
    scale,
    animate,
    reset,
    style: {
      opacity,
      transform: [{ translateY }, { scale }],
    },
  };
};

// Componente para número animado (contador)
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.setValue(0);

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);

  return (
    <Animated.Text style={style}>
      {displayValue}
    </Animated.Text>
  );
};
