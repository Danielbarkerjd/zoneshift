import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isOnboardingDone } from '../src/storage/storage';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    isOnboardingDone().then(done => {
      setReady(true);
      if (!done) {
        router.replace('/(onboarding)/welcome');
      }
    });
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip-setup" />
        <Stack.Screen name="plan/[id]" />
        <Stack.Screen name="plan/day" />
      </Stack>
    </>
  );
}
