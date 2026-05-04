import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSleepProfile, saveSleepProfile } from '../../src/storage/storage';
import type { SleepProfile, Chronotype } from '../../src/types';
import { TimePickerModal } from '../../src/components/TimePickerModal';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showBedPicker, setShowBedPicker] = useState(false);

  useEffect(() => {
    getSleepProfile().then(setProfile);
  }, []);

  async function update(patch: Partial<SleepProfile>) {
    if (!profile) return;
    const updated = { ...profile, ...patch };
    setProfile(updated);
    await saveSleepProfile(updated);
  }

  if (!profile) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>Sleep Profile</Text>
        <View style={styles.card}>
          <Row
            label="Usual Wake Time"
            value={fmt(profile.usualWakeTime)}
            onPress={() => setShowWakePicker(true)}
          />
          <Divider />
          <Row
            label="Usual Bedtime"
            value={fmt(profile.usualBedTime)}
            onPress={() => setShowBedPicker(true)}
          />
          <Divider />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Chronotype</Text>
            <View style={styles.chronoGroup}>
              {(['morning', 'neutral', 'evening'] as Chronotype[]).map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chronoChip, profile.chronotype === c && styles.chronoChipActive]}
                  onPress={() => update({ chronotype: c })}
                >
                  <Text style={[styles.chronoChipText, profile.chronotype === c && styles.chronoChipTextActive]}>
                    {c === 'morning' ? '🌅' : c === 'evening' ? '🌙' : '😐'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <ToggleRow label="Has melatonin" value={profile.hasMelatonin} onValueChange={v => update({ hasMelatonin: v })} />
          <Divider />
          <ToggleRow label="Drinks caffeine" value={profile.drinksCoffee} onValueChange={v => update({ drinksCoffee: v })} />
          <Divider />
          <ToggleRow label="24-hour clock" value={profile.use24HourFormat} onValueChange={v => update({ use24HourFormat: v })} />
        </View>

        <Text style={styles.version}>ZoneShift v1.0  •  Eagle Ridge Tech LLC</Text>
      </ScrollView>

      <TimePickerModal
        visible={showWakePicker}
        value={profile.usualWakeTime}
        title="Wake Time"
        onConfirm={v => { update({ usualWakeTime: v }); setShowWakePicker(false); }}
        onDismiss={() => setShowWakePicker(false)}
      />
      <TimePickerModal
        visible={showBedPicker}
        value={profile.usualBedTime}
        title="Bedtime"
        onConfirm={v => { update({ usualBedTime: v }); setShowBedPicker(false); }}
        onDismiss={() => setShowBedPicker(false)}
      />
    </SafeAreaView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#0EA5E9' }}
        thumbColor={value ? '#F8FAFC' : '#94A3B8'}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function fmt(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 24 },
  sectionLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { fontSize: 15, color: '#E2E8F0', fontWeight: '500' },
  rowValue: { fontSize: 15, color: '#38BDF8', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#334155', marginHorizontal: 16 },
  chronoGroup: { flexDirection: 'row', gap: 8 },
  chronoChip: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  chronoChipActive: { backgroundColor: '#0369A1' },
  chronoChipText: { fontSize: 18 },
  chronoChipTextActive: {},
  version: { fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 8 },
});
