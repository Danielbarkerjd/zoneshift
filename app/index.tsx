import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { isOnboardingDone } from '../src/storage/storage';

export default function Index() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingDone().then(setOnboarded);
  }, []);

  if (onboarded === null) {
    // Still reading AsyncStorage — hold on the dark background
    return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
  }

  return <Redirect href={onboarded ? '/(tabs)/' : '/(onboarding)/welcome'} />;
}
