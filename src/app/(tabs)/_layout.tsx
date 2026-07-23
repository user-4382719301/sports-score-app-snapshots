import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

interface TabIconProps {
  color: ColorValue;
  size: number;
  focused: boolean;
}

function iconFor(active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color, size, focused }: TabIconProps) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBright,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: iconFor('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="relay"
        options={{ title: 'Relay', tabBarIcon: iconFor('flash', 'flash-outline') }}
      />
      <Tabs.Screen
        name="games"
        options={{ title: 'Games', tabBarIcon: iconFor('podium', 'podium-outline') }}
      />
      <Tabs.Screen
        name="collection"
        options={{ title: 'Collection', tabBarIcon: iconFor('albums', 'albums-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: iconFor('person', 'person-outline') }}
      />
    </Tabs>
  );
}
