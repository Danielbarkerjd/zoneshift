import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Chronotype } from '../../src/types';
import { TimePickerModal } from '../../src/components/TimePickerModal';

const CHRONOTYPES: { value: Chronotype; label: string; desc: string }[] = [
  { value: 'morning', label: 'Early Bird', desc: 'Naturally wake early, tired by 9pm' },
  { value: 'neutral', label: 'Neutral', desc: 'No strong preference either way' },
  { value: 'evening', label: 'Night Owl', desc: 'Energized at night, hate early alarms' },
];

export default function SleepBasicsScreen() {
  const router = useRouter();
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('23:00');
  const [chronotype, setChronotype] = useState<Chronotype>('neutral');
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showBedPicker, setShowBedPicker] = useState(false);

  function handleNext() {
    router.push({
      pathname: '/(onboarding)/preferences',
      params: { wakeTime, bedTime, chronotype },
    });
  }

  function handleSkip() {
    router.push({
      pathname: '/(onboarding)/preferences',
      params: { wakeTime: '07:00', bedTime: '23:00', chronotype: 'neutral' },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 3</Text>
          <Text style={styles.title}>Your Sleep Schedule</Text>
          <Text style={styles.sub}>This helps us build a plan matched to your body clock.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Usual Wake Time</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowWakePicker(true)}>
            <Text style={styles.timeBtnText}>{formatTime12(wakeTime)}</Text>
            <Text style={styles.timeBtnEdit}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Usual Bedtime</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowBedPicker(true)}>
            <Text style={styles.timeBtnText}>{formatTime12(bedTime)}</Text>
            <Text style={styles.timeBtnEdit}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Your Body Clock</Text>
          <Text style={styles.labelHint}>When does your energy naturally peak?</Text>
          {CHRONOTYPES.map(ct => (
            <TouchableOpacity
              key={ct.value}
              style={[styles.chronoCard, chronotype === ct.value && styles.chronoCardActive]}
              onPress={() => setChronotype(ct.value)}
            >
              <View style={styles.chronoInner}>
                <Text style={[styles.chronoLabel, chronotype === ct.value && styles.chronoLabelActive]}>
                  {ct.label}
                </Text>
                <Text style={styles.chronoDesc}>{ct.desc}</Text>
              </View>
              {chronotype === ct.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip — use defaults</Text>
        </TouchableOpacity>
      </View>

      <TimePickerModal
        visible={showWakePicker}
        value={wakeTime}
        title="Wake Time"
        onConfirm={v => { setWakeTime(v); setShowWakePicker(false); }}
        onDismiss={() => setShowWakePicker(false)}
      />
      <TimePickerModal
        visible={showBedPicker}
        value={bedTime}
        title="Bedtime"
        onConfirm={v => { setBedTime(v); setShowBedPicker(false); }}
        onDismiss={() => setShowBedPicker(false)}
      />
    </SafeAreaView>
  );
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  header: { marginBottom: 32 },
  step: { fontSize: 13, color: '#38BDF8', fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 },
  sub: { fontSize: 15, color: '#94A3B8', lineHeight: 22 },
  section: { marginBottom: 28 },
  label: { fontSize: 13, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  labelHint: { fontSize: 13, color: '#475569', marginBottom: 10 },
  timeBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeBtnText: { fontSize: 20, color: '#F8FAFC', fontWeight: '600' },
  timeBtnEdit: { fontSize: 14, color: '#38BDF8', fontWeight: '600' },
  chronoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chronoCardActive: { borderColor: '#38BDF8', backgroundColor: '#0F3151' },
  chronoInner: { flex: 1 },
  chronoLabel: { fontSize: 16, fontWeight: '700', color: '#E2E8F0', marginBottom: 2 },
  chronoLabelActive: { color: '#38BDF8' },
  chronoDesc: { fontSize: 13, color: '#64748B' },
  checkmark: { fontSize: 18, color: '#38BDF8', fontWeight: '700' },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  nextBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextText: { color: '#0F172A', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: { color: '#475569', fontSize: 14, fontWeight: '500' },
});
