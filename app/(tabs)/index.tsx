import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActiveTripId, getTripById } from '../../src/storage/storage';
import { formatHourDiff } from '../../src/utils/format';
import type { TripPlan } from '../../src/types';

const TIPS_OF_DAY = [
  "Morning light is the most powerful signal your brain uses to set your clock. Seek it.",
  "Eastward travel is harder than westward — you're asking your body to wake up before it's ready.",
  "Melatonin works best taken 5 hours before your target bedtime, not right at bedtime.",
  "Caffeine blocks adenosine — the sleep signal. Avoid it 8+ hours before your target bedtime.",
  "Even a short walk outside in the morning can anchor your circadian clock to local time.",
  "Blue light from screens delays melatonin production. Dim screens when avoiding evening light.",
  "Exercise helps shift the clock — morning workouts for eastward trips, evening for westward.",
];

export default function HomeScreen() {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<TripPlan | null>(null);
  const tipIndex = new Date().getDate() % TIPS_OF_DAY.length;

  useFocusEffect(useCallback(() => {
    getActiveTripId().then(id => {
      if (id) getTripById(id).then(setActivePlan);
      else setActivePlan(null);
    });
  }, []));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appName}>ZoneShift</Text>
          <Text style={styles.headerSub}>Jet Lag Recovery</Text>
        </View>

        {activePlan ? (
          <TouchableOpacity
            style={styles.activePlanCard}
            onPress={() => router.push(`/plan/${activePlan.id}`)}
          >
            <Text style={styles.activePlanLabel}>Active Plan</Text>
            <Text style={styles.activePlanRoute}>
              {activePlan.input.homeCity.name} → {activePlan.input.destCity.name}
            </Text>
            <Text style={styles.activePlanMeta}>
              {formatHourDiff(activePlan.hourDiff)} {activePlan.direction === 'east' ? 'east' : 'west'} •{' '}
              {activePlan.estimatedDaysToSync} days to sync
            </Text>
            <Text style={styles.activePlanView}>View Plan →</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/trip-setup')}>
          <Text style={styles.primaryBtnText}>Plan My Trip</Text>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipCardLabel}>Tip of the Day</Text>
          <Text style={styles.tipCardText}>{TIPS_OF_DAY[tipIndex]}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoCard icon="☀️" title="Light Exposure" desc="The #1 clock-shifter" />
          <InfoCard icon="💊" title="Melatonin" desc="Time it right" />
          <InfoCard icon="☕" title="Caffeine" desc="Cut it off early" />
          <InfoCard icon="😴" title="Pre-shift" desc="Start before you fly" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  header: { marginBottom: 24 },
  appName: { fontSize: 34, fontWeight: '800', color: '#38BDF8', letterSpacing: -0.5 },
  headerSub: { fontSize: 15, color: '#475569', fontWeight: '500', marginTop: 2 },
  activePlanCard: {
    backgroundColor: '#0C4A6E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0369A1',
  },
  activePlanLabel: { fontSize: 12, color: '#7DD3FC', fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  activePlanRoute: { fontSize: 22, fontWeight: '800', color: '#F0F9FF', marginBottom: 6 },
  activePlanMeta: { fontSize: 14, color: '#7DD3FC', marginBottom: 12 },
  activePlanView: { fontSize: 14, color: '#38BDF8', fontWeight: '700' },
  primaryBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { color: '#0F172A', fontSize: 17, fontWeight: '800' },
  tipCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipCardLabel: { fontSize: 11, color: '#F59E0B', fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  tipCardText: { fontSize: 15, color: '#CBD5E1', lineHeight: 23 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoIcon: { fontSize: 24, marginBottom: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#E2E8F0', marginBottom: 4 },
  infoDesc: { fontSize: 12, color: '#64748B' },
});
