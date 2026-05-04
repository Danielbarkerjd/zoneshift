import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markOnboardingDone } from '../../src/storage/storage';

export default function DoneScreen() {
  const router = useRouter();

  async function handleStart() {
    await markOnboardingDone();
    router.replace('/trip-setup');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>You're all set.</Text>
        <Text style={styles.sub}>
          Let's plan your first trip. Enter your departure and destination cities to generate
          your personalized jet lag recovery schedule.
        </Text>
        <View style={styles.hints}>
          {[
            { icon: '📅', text: 'Enter departure & return dates' },
            { icon: '🗺️', text: 'Pick home and destination cities' },
            { icon: '⚡', text: 'Get your schedule instantly — no internet needed' },
          ].map(h => (
            <View key={h.text} style={styles.hintRow}>
              <Text style={styles.hintIcon}>{h.icon}</Text>
              <Text style={styles.hintText}>{h.text}</Text>
            </View>
          ))}
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#F8FAFC', marginBottom: 16, textAlign: 'center' },
  sub: { fontSize: 16, color: '#94A3B8', lineHeight: 26, textAlign: 'center', marginBottom: 40 },
  hints: { gap: 18, alignSelf: 'stretch' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hintIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  hintText: { fontSize: 15, color: '#E2E8F0', fontWeight: '500' },
  footer: { paddingHorizontal: 28, paddingBottom: 12 },
  btn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
});
