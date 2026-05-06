import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, CalendarDays, Map, Zap } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { markOnboardingDone } from '../../src/storage/storage';
import { C } from '../../src/theme/colors';

type IconComp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const HINTS: { Icon: IconComp; text: string }[] = [
  { Icon: CalendarDays, text: 'Enter departure & return dates' },
  { Icon: Map, text: 'Pick home and destination cities' },
  { Icon: Zap, text: 'Get your schedule instantly — no internet needed' },
];

export default function DoneScreen() {
  const router = useRouter();

  async function handleStart() {
    await markOnboardingDone();
    router.replace('/trip-setup');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Globe size={64} color={C.primary} strokeWidth={1} />
        </View>
        <Text style={styles.title}>{"You're all set."}</Text>
        <Text style={styles.sub}>
          {"Let's plan your first trip. Enter your departure and destination cities to generate your personalized jet lag recovery schedule."}
        </Text>
        <View style={styles.hints}>
          {HINTS.map(h => {
            const HintIcon = h.Icon;
            return (
              <View key={h.text} style={styles.hintRow}>
                <View style={styles.hintIconBox}>
                  <HintIcon size={20} color={C.textSec} strokeWidth={1.5} />
                </View>
                <Text style={styles.hintText}>{h.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={handleStart}>
          <Text style={styles.btnText}>Plan My First Trip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  iconBox: { marginBottom: 24 },
  title: { fontSize: 32, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 16, textAlign: 'center' },
  sub: { fontSize: 16, color: C.textSec, lineHeight: 26, textAlign: 'center', marginBottom: 40, fontFamily: 'Outfit_400Regular' },
  hints: { gap: 18, alignSelf: 'stretch' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hintIconBox: { width: 32, alignItems: 'center' },
  hintText: { fontSize: 15, color: C.textPrimary, fontFamily: 'Outfit_500Medium' },
  footer: { paddingHorizontal: 28, paddingBottom: 12 },
  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Outfit_700Bold' },
});
