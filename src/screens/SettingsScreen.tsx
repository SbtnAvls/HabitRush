import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { ThemePreference } from '../types';
import { AppTheme } from '../theme';
import { useTheme } from '../theme/useTheme';
import { getFontScale } from '../theme/useFontScale';
import { AnimatedView, Skeleton } from '../components/animations';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  navigation?: any;
}

type ThemeOption = {
  value: ThemePreference;
  label: string;
  icon: string;
};

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'Claro', icon: 'sunny' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
];

const MIN_FONT_SCALE = 0.8;
const MAX_FONT_SCALE = 1.3;
const STEP = 0.05;

// Animated Theme Option with press feedback
interface AnimatedThemeOptionProps {
  option: ThemeOption;
  isActive: boolean;
  onPress: () => void;
  theme: AppTheme;
  styles: any;
  index: number;
}

const AnimatedThemeOption: React.FC<AnimatedThemeOptionProps> = ({
  option,
  isActive,
  onPress,
  theme,
  styles,
  index,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isActive ? 1 : 0,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

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
  };

  return (
    <AnimatedView animation="scale" delay={300 + (index * 100)}>
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.themeOption,
            isActive && styles.themeOptionActive,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[
            styles.themeIconContainer,
            isActive && { backgroundColor: theme.colors.primary + '20' }
          ]}>
            <Ionicons
              name={option.icon as any}
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
          <Text style={[
            styles.themeLabel,
            isActive && styles.themeLabelActive
          ]}>
            {option.label}
          </Text>
          <Animated.View
            style={[
              styles.checkCircle,
              {
                transform: [{ scale: checkAnim }],
                opacity: checkAnim,
              },
            ]}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </AnimatedView>
  );
};

// Animated Button with press feedback
interface AnimatedSettingsButtonProps {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
}

const AnimatedSettingsButton: React.FC<AnimatedSettingsButtonProps> = ({
  onPress,
  style,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Custom Slider Component
interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor: string;
  maximumTrackTintColor: string;
  thumbTintColor: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
}) => {
  const SLIDER_WIDTH = width - 80;
  const THUMB_SIZE = 32;
  const TRACK_HEIGHT = 6;
  const TRACK_TOUCHABLE_HEIGHT = 50;

  // Convertir valor a porcentaje (0-1)
  const valueToPercent = (val: number) => {
    return (val - minimumValue) / (maximumValue - minimumValue);
  };

  // Convertir posición X a valor
  const positionToValue = (x: number) => {
    const percent = Math.max(0, Math.min(1, x / SLIDER_WIDTH));
    const rawValue = minimumValue + percent * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const percent = valueToPercent(value);
  const thumbLeft = percent * (SLIDER_WIDTH - THUMB_SIZE);
  const filledWidth = percent * SLIDER_WIDTH;

  const handleTouch = (pageX: number, containerX: number) => {
    const x = pageX - containerX;
    const newValue = positionToValue(x);
    onValueChange(newValue);
  };

  const containerRef = useRef<View>(null);
  const containerXRef = useRef(0);
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        containerRef.current?.measure((x, y, w, h, pageX, pageY) => {
          containerXRef.current = pageX;
          handleTouch(evt.nativeEvent.pageX, pageX);
        });
      },
      onPanResponderMove: (evt) => {
        if (isDragging.current) {
          handleTouch(evt.nativeEvent.pageX, containerXRef.current);
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    })
  ).current;

  return (
    <View
      ref={containerRef}
      style={{
        height: TRACK_TOUCHABLE_HEIGHT,
        justifyContent: 'center',
        width: SLIDER_WIDTH,
      }}
      {...panResponder.panHandlers}
    >
      {/* Track background */}
      <View
        style={{
          height: TRACK_HEIGHT,
          backgroundColor: maximumTrackTintColor,
          borderRadius: TRACK_HEIGHT / 2,
          width: '100%',
          position: 'absolute',
        }}
      />

      {/* Track filled */}
      <View
        style={{
          height: TRACK_HEIGHT,
          backgroundColor: minimumTrackTintColor,
          borderRadius: TRACK_HEIGHT / 2,
          width: filledWidth,
          position: 'absolute',
        }}
      />

      {/* Thumb */}
      <View
        style={{
          position: 'absolute',
          left: thumbLeft,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: thumbTintColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: THUMB_SIZE - 8,
            height: THUMB_SIZE - 8,
            borderRadius: (THUMB_SIZE - 8) / 2,
            backgroundColor: 'rgba(255,255,255,0.3)',
          }}
        />
      </View>
    </View>
  );
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { state, updateSettings } = useAppContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const currentScale = getFontScale(state.settings.fontSize);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [previewScale, setPreviewScale] = useState(currentScale);
  const [hasChanges, setHasChanges] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const newScale = getFontScale(state.settings.fontSize);
    setPreviewScale(newScale);
    setHasChanges(false);
  }, [state.settings.fontSize]);

  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value / STEP) * STEP;
    const clamped = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, rounded));
    setPreviewScale(clamped);
    setHasChanges(Math.abs(clamped - currentScale) > 0.01);
  };

  const handleApplyFontSize = () => {
    updateSettings({ fontSize: previewScale });
    setHasChanges(false);
  };

  const handleCancelFontSize = () => {
    setPreviewScale(currentScale);
    setHasChanges(false);
  };

  const handleThemeChange = (themePref: ThemePreference) => {
    if (state.settings.theme !== themePref) {
      updateSettings({ theme: themePref });
    }
  };

  const getScalePercentage = (scale: number) => {
    return Math.round(scale * 100);
  };

  const getScaleLabel = (scale: number) => {
    if (scale <= 0.85) return 'Muy pequeno';
    if (scale <= 0.95) return 'Pequeno';
    if (scale <= 1.05) return 'Normal';
    if (scale <= 1.15) return 'Grande';
    return 'Muy grande';
  };

  // Back button animation
  const backButtonScale = useRef(new Animated.Value(1)).current;

  const handleBackPressIn = () => {
    Animated.spring(backButtonScale, {
      toValue: 0.9,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleBackPressOut = () => {
    Animated.spring(backButtonScale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AnimatedView animation="fadeIn" delay={100}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableWithoutFeedback
            onPress={() => navigation?.goBack()}
            onPressIn={handleBackPressIn}
            onPressOut={handleBackPressOut}
          >
            <Animated.View style={[styles.backButton, { transform: [{ scale: backButtonScale }] }]}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.textPrimary} />
            </Animated.View>
          </TouchableWithoutFeedback>
          <Text style={styles.headerTitle}>Configuracion</Text>
          <View style={styles.headerSpacer} />
        </View>
      </AnimatedView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Theme Section */}
        <AnimatedView animation="fadeSlideUp" delay={200}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AnimatedView animation="bounce" delay={250}>
                <Ionicons name="color-palette-outline" size={22} color={theme.colors.textPrimary} />
              </AnimatedView>
              <Text style={styles.sectionTitle}>Tema</Text>
            </View>

            <View style={styles.themeCard}>
              <Text style={styles.settingDescription}>
                Elige el tema que prefieras para la aplicacion
              </Text>

              <View style={styles.themeOptions}>
                {themeOptions.map((option, index) => (
                  <AnimatedThemeOption
                    key={option.value}
                    option={option}
                    isActive={state.settings.theme === option.value}
                    onPress={() => handleThemeChange(option.value)}
                    theme={theme}
                    styles={styles}
                    index={index}
                  />
                ))}
              </View>
            </View>
          </View>
        </AnimatedView>

        {/* Font Size Section */}
        <AnimatedView animation="fadeSlideUp" delay={400}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AnimatedView animation="bounce" delay={450}>
                <Ionicons name="text-outline" size={22} color={theme.colors.textPrimary} />
              </AnimatedView>
              <Text style={styles.sectionTitle}>Tamano de letra</Text>
            </View>

            <View style={styles.fontCard}>
              <Text style={styles.settingDescription}>
                Arrastra el control para ajustar el tamano del texto
              </Text>

              {/* Scale indicator */}
              <AnimatedView animation="scale" delay={500}>
                <View style={styles.scaleIndicator}>
                  <Text style={styles.scalePercentage}>{getScalePercentage(previewScale)}%</Text>
                  <Text style={styles.scaleLabel}>{getScaleLabel(previewScale)}</Text>
                </View>
              </AnimatedView>

              {/* Slider */}
              <AnimatedView animation="fadeIn" delay={550}>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderMinLabel}>A</Text>
                    <Text style={styles.sliderMaxLabel}>A</Text>
                  </View>
                  <CustomSlider
                    minimumValue={MIN_FONT_SCALE}
                    maximumValue={MAX_FONT_SCALE}
                    step={STEP}
                    value={previewScale}
                    onValueChange={handleSliderChange}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                  />
                </View>
              </AnimatedView>

              {/* Preview Card */}
              <AnimatedView animation="fadeSlideUp" delay={600}>
                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Ionicons name="eye-outline" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.previewTitle}>Vista previa</Text>
                  </View>
                  <View style={styles.previewContent}>
                    <Text style={[styles.previewTextTitle, { fontSize: 18 * previewScale }]}>
                      Titulo de ejemplo
                    </Text>
                    <Text style={[styles.previewTextBody, { fontSize: 14 * previewScale }]}>
                      Este es un texto de ejemplo para que puedas ver como se vera el tamano de la letra en la aplicacion antes de aplicar los cambios.
                    </Text>
                    <View style={styles.previewMeta}>
                      <View style={styles.previewBadge}>
                        <Text style={[styles.previewBadgeText, { fontSize: 12 * previewScale }]}>
                          Etiqueta
                        </Text>
                      </View>
                      <Text style={[styles.previewSmallText, { fontSize: 12 * previewScale }]}>
                        Texto secundario
                      </Text>
                    </View>
                  </View>
                </View>
              </AnimatedView>

              {/* Action Buttons */}
              {hasChanges && (
                <AnimatedView animation="fadeSlideUp" delay={0}>
                  <View style={styles.actionButtons}>
                    <AnimatedSettingsButton
                      style={styles.cancelButton}
                      onPress={handleCancelFontSize}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </AnimatedSettingsButton>
                    <AnimatedSettingsButton
                      style={styles.applyButton}
                      onPress={handleApplyFontSize}
                    >
                      <View style={styles.applyButtonContent}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.applyButtonText}>Aplicar</Text>
                      </View>
                    </AnimatedSettingsButton>
                  </View>
                </AnimatedView>
              )}
            </View>
          </View>
        </AnimatedView>

        {/* Info Section */}
        <AnimatedView animation="fadeSlideUp" delay={700}>
          <View style={styles.infoSection}>
            <AnimatedView animation="bounce" delay={750}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.textMuted} />
            </AnimatedView>
            <Text style={styles.infoText}>
              El tema se aplica al instante. El tamano de letra requiere confirmacion.
            </Text>
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const isDark = theme.name === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: theme.colors.background,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    headerSpacer: {
      width: 44,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    themeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginBottom: 20,
      lineHeight: 20,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    themeOption: {
      flex: 1,
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    themeIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    themeLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    themeLabelActive: {
      color: theme.colors.primary,
    },
    checkCircle: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fontCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    scaleIndicator: {
      alignItems: 'center',
      marginBottom: 20,
    },
    scalePercentage: {
      fontSize: 42,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    scaleLabel: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginTop: -4,
    },
    sliderContainer: {
      marginBottom: 24,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    sliderMinLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    sliderMaxLabel: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    previewCard: {
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 16,
      overflow: 'hidden',
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    previewTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    previewContent: {
      padding: 16,
    },
    previewTextTitle: {
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    previewTextBody: {
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    previewMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    previewBadge: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    previewBadgeText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    previewSmallText: {
      color: theme.colors.textMuted,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    applyButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    infoSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginHorizontal: 20,
      padding: 16,
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 14,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
  });
};
