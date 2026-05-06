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
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../src/theme/colors';
import { initPurchases } from '../src/services/purchases';
import { CRASH_KEY } from '../src/earlySetup';
import type { ReactNode } from 'react';

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

  const [savedCrash, setSavedCrash] = useState<string | null>(null);

  useEffect(() => {
    initPurchases();
    // Check if a previous crash was saved — display it so we can diagnose
    AsyncStorage.getItem(CRASH_KEY).then(val => {
      if (val) {
        setSavedCrash(val);
        AsyncStorage.removeItem(CRASH_KEY).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // Show previous crash details if we have them (will be visible until user dismisses)
  if (savedCrash) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#0B1120', padding: 24 }}>
        <Text style={{ color: '#ff6b6b', fontSize: 16, fontWeight: 'bold', marginTop: 60, marginBottom: 12 }}>
          Previous startup crash — screenshot and send to developer:
        </Text>
        <Text style={{ color: '#e8ecf4', fontSize: 12, fontFamily: 'monospace', marginBottom: 24 }}>
          {savedCrash}
        </Text>
        <TouchableOpacity
          onPress={() => setSavedCrash(null)}
          style={{ backgroundColor: '#1A9E8F', borderRadius: 8, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Dismiss & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

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
