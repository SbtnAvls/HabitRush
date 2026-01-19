import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet, View } from 'react-native';

interface AnimatedFABProps {
  onPress: () => void;
  backgroundColor?: string;
  size?: number;
  children: React.ReactNode;
  pulseOnMount?: boolean;
  glowColor?: string;
}

export const AnimatedFAB: React.FC<AnimatedFABProps> = ({
  onPress,
  backgroundColor = '#4ECDC4',
  size = 56,
  children,
  pulseOnMount = true,
  glowColor = 'rgba(78, 205, 196, 0.4)',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    // Animación de entrada con bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Pulso sutil continuo para llamar la atención
    if (pulseOnMount) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      // Iniciar pulso después de la animación de entrada
      setTimeout(() => pulseAnimation.start(), 800);

      return () => pulseAnimation.stop();
    }
  }, []);

  // Animación de glow continuo
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0.85,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <View style={[styles.container, { bottom: 24, right: 24 }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: glowColor,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.fab,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
              transform: [
                { scale: Animated.multiply(scaleAnim, Animated.multiply(pressAnim, pulseAnim)) },
                { rotate: rotation },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

// Variante con ripple effect
export const AnimatedFABWithRipple: React.FC<AnimatedFABProps> = ({
  onPress,
  backgroundColor = '#4ECDC4',
  size = 56,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    setShowRipple(true);
    rippleAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pressAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(pressAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      setShowRipple(false);
      onPress();
    });
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.5],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.3, 0],
  });

  return (
    <View style={[styles.container, { bottom: 24, right: 24 }]}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View
          style={[
            styles.fab,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
              transform: [
                { scale: Animated.multiply(scaleAnim, pressAnim) },
              ],
              overflow: 'hidden',
            },
          ]}
        >
          {showRipple && (
            <Animated.View
              style={[
                styles.ripple,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />
          )}
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
  },
  ripple: {
    position: 'absolute',
  },
});
