import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Plan', tabBarIcon: ({ color }) => <TabIcon icon="✈️" color={color} /> }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: 'My Trips', tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="tips"
        options={{ title: 'Tips', tabBarIcon: ({ color }) => <TabIcon icon="💡" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}
