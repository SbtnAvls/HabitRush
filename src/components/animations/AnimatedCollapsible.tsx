import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet, LayoutChangeEvent, ViewStyle, TouchableWithoutFeedback, Text } from 'react-native';

interface AnimatedCollapsibleProps {
  expanded: boolean;
  collapsedHeight: number;
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export const AnimatedCollapsible: React.FC<AnimatedCollapsibleProps> = ({
  expanded,
  collapsedHeight,
  children,
  duration = 400,
  style,
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const isFirstRender = useRef(true);

  const onContentLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      animatedHeight.setValue(expanded ? contentHeight || collapsedHeight : collapsedHeight);
      return;
    }

    const targetHeight = expanded ? contentHeight : collapsedHeight;

    Animated.spring(animatedHeight, {
      toValue: targetHeight,
      friction: 10,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [expanded, contentHeight]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          height: contentHeight > 0 ? animatedHeight : undefined,
          overflow: 'hidden',
        },
      ]}
    >
      <View onLayout={onContentLayout} style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

// Componente para el botón de toggle animado
interface AnimatedToggleButtonProps {
  expanded: boolean;
  onPress: () => void;
  expandedText: string;
  collapsedText: string;
  style?: ViewStyle;
  textStyle?: any;
}

export const AnimatedToggleButton: React.FC<AnimatedToggleButtonProps> = ({
  expanded,
  onPress,
  expandedText,
  collapsedText,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: expanded ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.toggleButton,
          style,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.toggleContent}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Text style={[styles.arrow, textStyle]}>▼</Text>
          </Animated.View>
          <Text style={[styles.toggleText, textStyle]}>
            {expanded ? expandedText : collapsedText}
          </Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Componente para el overlay de fade animado
interface AnimatedFadeOverlayProps {
  visible: boolean;
  height?: number;
  color?: string;
}

export const AnimatedFadeOverlay: React.FC<AnimatedFadeOverlayProps> = ({
  visible,
  height = 150,
  color = '#F8F9FA',
}) => {
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.fadeOverlay,
        {
          height,
          opacity: opacityAnim,
          pointerEvents: visible ? 'none' : 'none',
        },
      ]}
    >
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((opacity, index) => (
        <View
          key={index}
          style={[
            styles.fadeLayer,
            { backgroundColor: color, opacity },
          ]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  toggleButton: {
    alignSelf: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
  fadeLayer: {
    flex: 1,
  },
});
