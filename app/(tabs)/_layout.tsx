import { Tabs } from 'expo-router';
import { Plane, Map, Lightbulb, MessageCircle, Settings as SettingsIcon } from 'lucide-react-native';
import { C } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Outfit_500Medium' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Plan', tabBarIcon: ({ color }) => <Plane size={22} color={color} strokeWidth={1.5} /> }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: 'My Trips', tabBarIcon: ({ color }) => <Map size={22} color={color} strokeWidth={1.5} /> }}
      />
      <Tabs.Screen
        name="tips"
        options={{ title: 'Tips', tabBarIcon: ({ color }) => <Lightbulb size={22} color={color} strokeWidth={1.5} /> }}
      />
      <Tabs.Screen
        name="ask"
        options={{ title: 'Ask ZoneShift', tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} strokeWidth={1.5} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <SettingsIcon size={22} color={color} strokeWidth={1.5} /> }}
      />
    </Tabs>
  );
}
