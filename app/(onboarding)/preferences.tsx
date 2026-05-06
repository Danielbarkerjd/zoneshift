import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaf } from 'lucide-react-native';
import { saveSleepProfile } from '../../src/storage/storage';
import type { Chronotype, SleepProfile, Supplements } from '../../src/types';
import { useState } from 'react';
import { C } from '../../src/theme/colors';

const SUPPLEMENT_OPTIONS: { key: keyof Supplements; label: string }[] = [
  { key: 'magnesium', label: 'Magnesium glycinate' },
  { key: 'ltheanine', label: 'L-theanine' },
  { key: 'vitaminD', label: 'Vitamin D' },
  { key: 'tartCherry', label: 'Tart cherry extract' },
  { key: 'ashwagandha', label: 'Ashwagandha' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ wakeTime: string; bedTime: string; chronotype: Chronotype }>();

  const [hasMelatonin, setHasMelatonin] = useState(true);
  const [drinksCoffee, setDrinksCoffee] = useState(true);
  const [use24HourFormat, setUse24HourFormat] = useState(false);
  const [supplements, setSupplements] = useState<Supplements>({
    magnesium: false,
    ltheanine: false,
    vitaminD: false,
    tartCherry: false,
    ashwagandha: false,
  });

  async function handleNext() {
    const profile: SleepProfile = {
      usualWakeTime: params.wakeTime ?? '07:00',
      usualBedTime: params.bedTime ?? '23:00',
      chronotype: (params.chronotype as Chronotype) ?? 'neutral',
      hasMelatonin,
      drinksCoffee,
      use24HourFormat,
      supplements,
    };
    await saveSleepProfile(profile);
    router.push('/(onboarding)/done');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.suppLabel}>Supplements (optional)</Text>
        <Text style={styles.suppHint}>Enable any you use — we'll add timing to your day plans.</Text>
        <View style={styles.toggleList}>
          {SUPPLEMENT_OPTIONS.map(opt => (
            <View key={opt.key} style={styles.toggleRow}>
              <Leaf size={18} color={C.primary} strokeWidth={1.5} style={styles.suppIcon} />
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>{opt.label}</Text>
              </View>
              <Switch
                value={supplements[opt.key]}
                onValueChange={v => setSupplements(prev => ({ ...prev, [opt.key]: v }))}
                trackColor={{ false: C.border, true: C.primary }}
                thumbColor={supplements[opt.key] ? '#FFFFFF' : C.textSec}
              />
            </View>
          ))}
        </View>
      </ScrollView>

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
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.border, true: C.primary }}
        thumbColor={value ? '#FFFFFF' : C.textSec}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  header: { marginBottom: 28 },
  step: { fontSize: 13, color: C.primary, fontFamily: 'Outfit_500Medium', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 8 },
  sub: { fontSize: 15, color: C.textSec, lineHeight: 22, fontFamily: 'Outfit_400Regular' },
  toggleList: { gap: 4, marginBottom: 24 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  toggleText: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontFamily: 'Outfit_500Medium', color: C.textPrimary },
  toggleDesc: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  suppLabel: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  suppHint: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginBottom: 12 },
  suppIcon: { marginRight: 10 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  nextBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Outfit_700Bold' },
});
