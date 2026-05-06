import { useEffect, useState, Component } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { C } from '../src/theme/colors';
import { initPurchases } from '../src/services/purchases';
import type { ReactNode } from 'react';

// Catch any JS error that escapes React — fires before the process crashes
(ErrorUtils as any).setGlobalHandler((error: Error, isFatal?: boolean) => {
  Alert.alert(
    isFatal ? 'Fatal Error' : 'Error',
    (error?.message ?? String(error)) + '\n\n' + (error?.stack ?? '').slice(0, 400),
    [{ text: 'OK' }],
  );
});

// Replace expo-router's default error screen so the error stays visible
export function ErrorBoundary({ error }: { error: Error; retry: () => void }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B1120', padding: 24 }}>
      <Text style={{ color: '#ff6b6b', fontSize: 16, fontWeight: 'bold', marginTop: 60, marginBottom: 12 }}>
        Crash — screenshot this and send to developer:
      </Text>
      <Text style={{ color: '#e8ecf4', fontSize: 13, marginBottom: 12 }}>
        {error?.message}
      </Text>
      <Text style={{ color: '#8a95ad', fontSize: 11, fontFamily: 'monospace' }}>
        {error?.stack}
      </Text>
    </ScrollView>
  );
}

class LocalErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0B1120', padding: 24 }}>
          <Text style={{ color: '#ff6b6b', fontSize: 16, fontWeight: 'bold', marginTop: 60, marginBottom: 12 }}>
            Crash caught — screenshot this:
          </Text>
          <Text style={{ color: '#e8ecf4', fontSize: 12, fontFamily: 'monospace' }}>
            {this.state.error}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    initPurchases();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  return (
    <LocalErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip-setup" />
        <Stack.Screen name="plan/[id]" />
        <Stack.Screen name="plan/day" />
        <Stack.Screen name="ask-claude" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
    </LocalErrorBoundary>
  );
}
