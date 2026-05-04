import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTripById } from '../../src/storage/storage';
import type { TripPlan, DaySchedule } from '../../src/types';

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<TripPlan | null>(null);

  useEffect(() => {
    if (id) getTripById(id).then(setPlan);
  }, [id]);

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#38BDF8" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const { hourDiff, direction, estimatedDaysToSync, isShortTripMode, schedule, input } = plan;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.routeText}>
            {input.homeCity.name} → {input.destCity.name}
          </Text>
          <View style={styles.summaryRow}>
            <SummaryPill label="Time diff" value={`${Math.abs(hourDiff)}h ${direction === 'east' ? 'east' : direction === 'west' ? 'west' : ''}`} />
            {isShortTripMode ? (
              <SummaryPill label="Mode" value="Short trip" color="#F59E0B" />
            ) : (
              <SummaryPill label="Days to sync" value={`~${estimatedDaysToSync} days`} />
            )}
          </View>
          {isShortTripMode ? (
            <View style={styles.shortTripBox}>
              <Text style={styles.shortTripTitle}>Short Trip Mode</Text>
              <Text style={styles.shortTripText}>
                With {Math.abs(hourDiff)} hour{Math.abs(hourDiff) !== 1 ? 's' : ''} difference and a short trip, shifting your clock isn't worth it.
                Focus on alertness strategies instead:
              </Text>
              <ShortTripTip text="Use caffeine strategically during your home nighttime hours." />
              <ShortTripTip text="Seek bright light to stay alert — not to shift your clock." />
              <ShortTripTip text="Keep naps under 20 minutes and before 3pm local time." />
              <ShortTripTip text="Avoid melatonin — you don't want to start shifting." />
              <ShortTripTip text="Schedule important meetings during your home daytime hours when possible." />
            </View>
          ) : (
            <Text style={styles.summaryStrategy}>
              {direction === 'east'
                ? `Advance your clock ${Math.abs(hourDiff)} hours east. Seek morning light, avoid evening light, and take melatonin early evening at destination time.`
                : `Delay your clock ${Math.abs(hourDiff)} hours west. Seek evening light, avoid morning light, and take melatonin near destination bedtime.`}
            </Text>
          )}
        </View>

        {/* Day Cards */}
        {!isShortTripMode && schedule.map(day => (
          <TouchableOpacity
            key={day.date}
            style={[styles.dayCard, day.phase === 'travel_day' && styles.dayCardTravel]}
            onPress={() => router.push({ pathname: '/plan/day', params: { tripId: plan.id, date: day.date } })}
          >
            <View style={styles.dayCardHeader}>
              <View>
                <Text style={[styles.dayLabel, day.phase === 'travel_day' && styles.dayLabelTravel]}>
                  {day.dayLabel}
                </Text>
                <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
              </View>
              <Text style={styles.phaseTag}>{phaseLabel(day.phase)}</Text>
            </View>

            <View style={styles.dayGrid}>
              <TimeCell icon="⏰" label="Wake" value={day.wakeTime} />
              <TimeCell icon="🌙" label="Bed" value={day.bedTime} />
              <TimeCell icon="☀️" label="Seek Light" value={`${day.lightSeekStart}–${day.lightSeekEnd}`} />
              <TimeCell icon="🕶️" label="Avoid Light" value={`${day.lightAvoidStart}–${day.lightAvoidEnd}`} />
              {day.melatoninTime && <TimeCell icon="💊" label="Melatonin" value={day.melatoninTime} />}
              {day.caffeineCutoff && <TimeCell icon="☕" label="Last Caffeine" value={day.caffeineCutoff} />}
            </View>
            <Text style={styles.detailLink}>View day detail →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function ShortTripTip({ text }: { text: string }) {
  return (
    <View style={styles.shortTripTipRow}>
      <Text style={styles.shortTripBullet}>•</Text>
      <Text style={styles.shortTripTipText}>{text}</Text>
    </View>
  );
}

function TimeCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.timeCell}>
      <Text style={styles.timeCellIcon}>{icon}</Text>
      <Text style={styles.timeCellLabel}>{label}</Text>
      <Text style={styles.timeCellValue}>{value}</Text>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function phaseLabel(phase: DaySchedule['phase']): string {
  if (phase === 'pre_departure') return 'Pre-departure';
  if (phase === 'travel_day') return 'Travel ✈️';
  return 'At destination';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  back: { fontSize: 16, color: '#38BDF8', fontWeight: '600', width: 60 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#0C4A6E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0369A1',
  },
  routeText: { fontSize: 22, fontWeight: '800', color: '#F0F9FF', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pill: { backgroundColor: '#075985', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pillLabel: { fontSize: 11, color: '#7DD3FC', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  pillValue: { fontSize: 15, color: '#F0F9FF', fontWeight: '700' },
  summaryStrategy: { fontSize: 14, color: '#BAE6FD', lineHeight: 22 },
  shortTripBox: { backgroundColor: '#1C1917', borderRadius: 10, padding: 14, marginTop: 4 },
  shortTripTitle: { fontSize: 15, fontWeight: '800', color: '#F59E0B', marginBottom: 6 },
  shortTripText: { fontSize: 13, color: '#CBD5E1', lineHeight: 20, marginBottom: 10 },
  shortTripTipRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  shortTripBullet: { color: '#F59E0B', fontSize: 14 },
  shortTripTipText: { flex: 1, fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  dayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayCardTravel: { borderColor: '#38BDF8', backgroundColor: '#0F2A42' },
  dayCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  dayLabel: { fontSize: 17, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
  dayLabelTravel: { color: '#38BDF8' },
  dayDate: { fontSize: 13, color: '#64748B' },
  phaseTag: { fontSize: 12, color: '#475569', fontWeight: '600', backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  timeCell: { backgroundColor: '#0F172A', borderRadius: 10, padding: 10, minWidth: '45%', flex: 1 },
  timeCellIcon: { fontSize: 16, marginBottom: 4 },
  timeCellLabel: { fontSize: 11, color: '#475569', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  timeCellValue: { fontSize: 15, color: '#E2E8F0', fontWeight: '700' },
  detailLink: { fontSize: 13, color: '#38BDF8', fontWeight: '600', textAlign: 'right' },
});
