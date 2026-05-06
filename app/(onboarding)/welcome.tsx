import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lightbulb, Sun, Pill, Plane } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { C } from '../../src/theme/colors';
import { Wordmark } from '../../src/components/Wordmark';

type IconComp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const FEATURES: { Icon: IconComp; iconColor: string; text: string }[] = [
  { Icon: Lightbulb, iconColor: C.amber, text: 'Science-based schedule engine' },
  { Icon: Sun, iconColor: C.lightSeek, text: 'Light exposure timing guidance' },
  { Icon: Pill, iconColor: C.melatonin, text: 'Melatonin & caffeine timing' },
  { Icon: Plane, iconColor: C.textSec, text: 'Pre-departure shifting plan' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Wordmark fontSize={40} />
          <Text style={styles.tagline}>Jet Lag Recovery, Reimagined</Text>
        </View>
        <View style={styles.descContainer}>
          <Text style={styles.desc}>
            ZoneShift builds a personalized jet lag recovery plan for your next trip — combining
            sleep science with a day-by-day schedule tailored to your body clock.
          </Text>
        </View>
        <View style={styles.features}>
          {FEATURES.map(f => {
            const FeatureIcon = f.Icon;
            return (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  <FeatureIcon size={20} color={f.iconColor} strokeWidth={1.5} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/(onboarding)/sleep-basics')}
        >
          <Text style={styles.btnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logoContainer: { marginBottom: 40, alignItems: 'center' },
  tagline: { fontSize: 16, color: C.textSec, marginTop: 10, fontFamily: 'Outfit_500Medium' },
  descContainer: { marginBottom: 40 },
  desc: { fontSize: 16, color: C.textPrimary, lineHeight: 26, textAlign: 'center', fontFamily: 'Outfit_400Regular' },
  features: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconBox: { width: 32, alignItems: 'center' },
  featureText: { fontSize: 15, color: C.textPrimary, fontFamily: 'Outfit_500Medium' },
  footer: { paddingHorizontal: 28, paddingBottom: 12 },
  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Outfit_700Bold' },
});
