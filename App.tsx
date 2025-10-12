/**
 * HabitRush - App de Habitos
 * Una aplicacion para crear y mantener habitos con sistema de vidas y retos
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useTheme } from './src/theme/useTheme';

const AppContent = () => {
  const theme = useTheme();

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.colors.background}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
