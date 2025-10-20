import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../context/AppContext';
import { ThemePreference } from '../types';
import { AppTheme } from '../theme';
import { useTheme } from '../theme/useTheme';

interface SettingsScreenProps {
  navigation?: any;
}

type FontSizeOption = {
  value: 'small' | 'medium' | 'large';
  label: string;
  example: number;
};

type ThemeOption = {
  value: ThemePreference;
  label: string;
  description: string;
  icon: string;
};

const FONT_SCALE: Record<FontSizeOption['value'], number> = {
  small: 0.9,
  medium: 1,
  large: 1.1,
};

const fontSizeOptions: FontSizeOption[] = [
  { value: 'small', label: 'Pequena', example: 14 },
  { value: 'medium', label: 'Mediana', example: 16 },
  { value: 'large', label: 'Grande', example: 18 },
];

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Tema claro',
    description: 'Colores luminosos ideales para entornos bien iluminados.',
    icon: 'sunny',
  },
  {
    value: 'dark',
    label: 'Tema oscuro',
    description: 'Colores profundos pensados para zonas con poca luz.',
    icon: 'moon',
  },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { state, updateSettings } = useAppContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scale = FONT_SCALE[state.settings.fontSize] ?? 1;
  const styles = useMemo(() => createStyles(theme, scale), [theme, scale]);

  const handleFontSizeChange = (fontSize: FontSizeOption['value']) => {
    if (state.settings.fontSize !== fontSize) {
      updateSettings({ fontSize });
    }
  };

  const handleThemeChange = (themePref: ThemePreference) => {
    if (state.settings.theme !== themePref) {
      updateSettings({ theme: themePref });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuraciones</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Tema de la app</Text>
            <Text style={styles.settingDescription}>
              Cambia entre modo claro u oscuro segun tus preferencias.
            </Text>

            <View style={styles.optionsContainer}>
              {themeOptions.map((option) => {
                const active = state.settings.theme === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      active && styles.optionCardActive,
                    ]}
                    onPress={() => handleThemeChange(option.value)}
                  >
                    <View style={styles.optionHeader}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={20 * scale} 
                        color={active ? theme.colors.primary : theme.colors.textMuted}
                        style={styles.optionIcon}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          active && styles.optionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Tamano de letra</Text>
            <Text style={styles.settingDescription}>
              Ajusta el tamano del texto en toda la aplicacion.
            </Text>

            <View style={styles.optionsContainer}>
              {fontSizeOptions.map((option) => {
                const active = state.settings.fontSize === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      active && styles.optionCardActive,
                    ]}
                    onPress={() => handleFontSizeChange(option.value)}
                  >
                    <View style={styles.optionHeader}>
                      <Text
                        style={[
                          styles.optionLabel,
                          active && styles.optionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {active && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20 * scale} 
                          color={theme.colors.primary}
                          style={styles.checkmark}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionExample,
                        { fontSize: option.example * scale },
                      ]}
                    >
                      Texto de ejemplo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Los cambios se aplican al instante y se guardan para tu siguiente inicio.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: AppTheme, scale: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      fontSize: 22 * scale,
      color: theme.colors.textSecondary,
    },
    headerTitle: {
      fontSize: 20 * scale,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    headerSpacer: {
      width: 44,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 32,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18 * scale,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    settingGroup: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    settingLabel: {
      fontSize: 16 * scale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    settingDescription: {
      fontSize: 14 * scale,
      color: theme.colors.textMuted,
      marginBottom: 16,
    },
    optionsContainer: {
      gap: 12,
    },
    optionCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    optionCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionIcon: {
      marginRight: 8,
    },
    optionLabel: {
      fontSize: 16 * scale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    optionLabelActive: {
      color: theme.colors.primary,
    },
    optionDescription: {
      fontSize: 13 * scale,
      color: theme.colors.textMuted,
      lineHeight: 18 * scale,
    },
    checkmark: {
      marginLeft: 8,
    },
    optionExample: {
      color: theme.colors.textMuted,
    },
    infoSection: {
      marginTop: 24,
      marginHorizontal: 16,
      padding: 16,
      backgroundColor: theme.colors.surfaceSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoText: {
      fontSize: 14 * scale,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

