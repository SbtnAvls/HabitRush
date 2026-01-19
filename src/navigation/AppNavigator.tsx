import React, { useMemo } from 'react';
import { NavigationContainer, Theme as NavigationTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';
import { LeaguesScreen } from '../screens/LeaguesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import { FollowListScreen } from '../screens/FollowListScreen';
import { useTheme } from '../theme/useTheme';
import { useFontScale } from '../theme/useFontScale';
import { AppTheme } from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const buildNavigationTheme = (theme: AppTheme): NavigationTheme => ({
  dark: theme.name === 'dark',
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.tabBarBackground,
    text: theme.colors.textPrimary,
    border: theme.colors.tabBarBorder,
    notification: theme.colors.warning,
  },
  fonts: {
    heavy: { fontFamily: "Poppins-Heavy", fontWeight: "bold" },
    regular: { fontFamily: "Poppins-Regular", fontWeight: "normal" },
    medium: { fontFamily: "Poppins-Medium", fontWeight: "normal" },
    bold: { fontFamily: "Poppins-Bold", fontWeight: "bold" },
  },
});

const HomeStackScreen: React.FC<{ theme: AppTheme }> = ({ theme }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      presentation: 'card',
      cardStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const ProfileStackScreen: React.FC<{ theme: AppTheme }> = ({ theme }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      presentation: 'card',
      cardStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
    <Stack.Screen name="FollowList" component={FollowListScreen} />
  </Stack.Navigator>
);

const LeaguesStackScreen: React.FC<{ theme: AppTheme }> = ({ theme }) => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      presentation: 'card',
      cardStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <Stack.Screen name="LeaguesMain" component={LeaguesScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const TabNavigatorComponent: React.FC<{ theme: AppTheme; scale: number }> = ({ theme, scale }) => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.colors.tabBarBackground,
        borderTopColor: theme.colors.tabBarBorder,
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 12 * scale,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="Home"
      options={{
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            name={focused ? 'home' : 'home-outline'}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: 'Inicio',
      }}
    >
      {() => <HomeStackScreen theme={theme} />}
    </Tab.Screen>
    <Tab.Screen
      name="Leagues"
      options={{
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            name={focused ? 'trophy' : 'trophy-outline'}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: 'Ligas',
      }}
    >
      {() => <LeaguesStackScreen theme={theme} />}
    </Tab.Screen>
    <Tab.Screen
      name="Profile"
      options={{
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            name={focused ? 'person' : 'person-outline'}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: 'Perfil',
      }}
    >
      {() => <ProfileStackScreen theme={theme} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export function AppNavigator() {
  const theme = useTheme();
  const { scale } = useFontScale();
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <TabNavigatorComponent theme={theme} scale={scale} />
    </NavigationContainer>
  );
}
