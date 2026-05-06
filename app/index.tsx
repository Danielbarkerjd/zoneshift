import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { isOnboardingDone } from '../src/storage/storage';
import { C } from '../src/theme/colors';

export default function Index() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingDone().then(setOnboarded);
  }, []);

  if (onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  return <Redirect href={onboarded ? '/(tabs)/' : '/(onboarding)/welcome'} />;
}
