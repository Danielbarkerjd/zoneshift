import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ZoneShift</Text>
          <Text style={styles.tagline}>Jet Lag Recovery, Reimagined</Text>
        </View>
        <View style={styles.descContainer}>
          <Text style={styles.desc}>
            ZoneShift builds a personalized jet lag recovery plan for your next trip — combining
            sleep science with a day-by-day schedule tailored to your body clock.
          </Text>
        </View>
        <View style={styles.features}>
          {[
            { icon: '🧠', text: 'Science-based schedule engine' },
            { icon: '☀️', text: 'Light exposure timing guidance' },
            { icon: '💊', text: 'Melatonin & caffeine timing' },
            { icon: '✈️', text: 'Pre-departure shifting plan' },
          ].map(f => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logoContainer: { marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: '#38BDF8', letterSpacing: -1 },
  tagline: { fontSize: 16, color: '#94A3B8', marginTop: 6, fontWeight: '500' },
  descContainer: { marginBottom: 40 },
  desc: { fontSize: 16, color: '#CBD5E1', lineHeight: 26, textAlign: 'center' },
  features: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  featureText: { fontSize: 15, color: '#E2E8F0', fontWeight: '500' },
  footer: { paddingHorizontal: 28, paddingBottom: 12 },
  btn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
});
