import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SummaryScreen } from '../screens/SummaryScreen';
import { SharingScreen } from '../screens/SharingScreen';
import { CompetitionsScreen } from '../screens/CompetitionsScreen';
import { AwardsScreen } from '../screens/AwardsScreen';
import { FriendDetailScreen } from '../screens/FriendDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function tabIcon(glyph: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.separator },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="Summary" component={SummaryScreen} options={{ tabBarIcon: tabIcon('⭕️') }} />
      <Tab.Screen name="Sharing" component={SharingScreen} options={{ tabBarIcon: tabIcon('👥') }} />
      <Tab.Screen name="Compete" component={CompetitionsScreen} options={{ tabBarIcon: tabIcon('🏆') }} />
      <Tab.Screen name="Awards" component={AwardsScreen} options={{ tabBarIcon: tabIcon('🏅') }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="FriendDetail" component={FriendDetailScreen} options={{ title: 'Friend' }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
