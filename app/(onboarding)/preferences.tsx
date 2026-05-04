import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveSleepProfile } from '../../src/storage/storage';
import type { Chronotype, SleepProfile } from '../../src/types';
import { useState } from 'react';

export default function PreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ wakeTime: string; bedTime: string; chronotype: Chronotype }>();

  const [hasMelatonin, setHasMelatonin] = useState(true);
  const [drinksCoffee, setDrinksCoffee] = useState(true);
  const [use24HourFormat, setUse24HourFormat] = useState(false);

  async function handleNext() {
    const profile: SleepProfile = {
      usualWakeTime: params.wakeTime ?? '07:00',
      usualBedTime: params.bedTime ?? '23:00',
      chronotype: (params.chronotype as Chronotype) ?? 'neutral',
      hasMelatonin,
      drinksCoffee,
      use24HourFormat,
    };
    await saveSleepProfile(profile);
    router.push('/(onboarding)/done');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Your Preferences</Text>
          <Text style={styles.sub}>These shape your personalized recovery plan.</Text>
        </View>

        <View style={styles.toggleList}>
          <ToggleRow
            label="I have melatonin available"
            desc="Get timed melatonin recommendations"
            value={hasMelatonin}
            onValueChange={setHasMelatonin}
          />
          <ToggleRow
            label="I drink coffee / caffeine"
            desc="Get caffeine cutoff times in your plan"
            value={drinksCoffee}
            onValueChange={setDrinksCoffee}
          />
          <ToggleRow
            label="Use 24-hour time format"
            desc="Display times as 14:00 instead of 2:00 PM"
            value={use24HourFormat}
            onValueChange={setUse24HourFormat}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ToggleRow({
  label, desc, value, onValueChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#0EA5E9' }}
        thumbColor={value ? '#F8FAFC' : '#94A3B8'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { marginBottom: 36 },
  step: { fontSize: 13, color: '#38BDF8', fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 },
  sub: { fontSize: 15, color: '#94A3B8', lineHeight: 22 },
  toggleList: { gap: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleText: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: '#E2E8F0', marginBottom: 3 },
  toggleDesc: { fontSize: 13, color: '#64748B' },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 16 },
  nextBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextText: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
});
