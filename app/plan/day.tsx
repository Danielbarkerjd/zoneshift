import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTripById } from '../../src/storage/storage';
import type { DaySchedule, TripPlan } from '../../src/types';

// 24-hour timeline bar — shows colored windows on a 24hr axis.
function TimelineBar({
  seekStart, seekEnd, avoidStart, avoidEnd,
}: {
  seekStart: string; seekEnd: string;
  avoidStart: string; avoidEnd: string;
}) {
  function pct(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return ((h * 60 + m) / 1440) * 100;
  }
  const seekLeft = pct(seekStart);
  const seekWidth = Math.max(pct(seekEnd) - pct(seekStart), 0);
  const avoidLeft = pct(avoidStart);
  const avoidWidth = Math.max(pct(avoidEnd) - pct(avoidStart), 0);

  return (
    <View style={tl.container}>
      {/* Hour ticks */}
      {[0, 6, 12, 18, 24].map(h => (
        <View key={h} style={[tl.tick, { left: `${(h / 24) * 100}%` as any }]}>
          <View style={tl.tickLine} />
          <Text style={tl.tickLabel}>{h === 0 || h === 24 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`}</Text>
        </View>
      ))}
      {/* Light seek window (green) */}
      {seekWidth > 0 && (
        <View style={[tl.block, tl.seekBlock, { left: `${seekLeft}%` as any, width: `${seekWidth}%` as any }]} />
      )}
      {/* Light avoid window (red) */}
      {avoidWidth > 0 && (
        <View style={[tl.block, tl.avoidBlock, { left: `${avoidLeft}%` as any, width: `${avoidWidth}%` as any }]} />
      )}
    </View>
  );
}

export default function DayDetailScreen() {
  const { tripId, date } = useLocalSearchParams<{ tripId: string; date: string }>();
  const router = useRouter();
  const [day, setDay] = useState<DaySchedule | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);

  useEffect(() => {
    if (!tripId || !date) return;
    getTripById(tripId).then(p => {
      if (!p) return;
      setPlan(p);
      const d = p.schedule.find(s => s.date === date);
      if (d) setDay(d);
    });
  }, [tripId, date]);

  if (!day || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#38BDF8" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const items = [
    { icon: '⏰', label: 'Target Wake Time', value: day.wakeTime, desc: 'Set an alarm to anchor your clock to local time.' },
    { icon: '🌙', label: 'Target Bedtime', value: day.bedTime, desc: 'Try to sleep at this time even if you feel alert.' },
    { icon: '☀️', label: 'Seek Light', value: `${day.lightSeekStart} – ${day.lightSeekEnd}`, desc: plan.direction === 'east' ? 'Get outdoor morning light — the strongest clock signal for eastward travel.' : 'Get outdoor evening light to delay your clock for westward travel.' },
    { icon: '🕶️', label: 'Avoid Bright Light', value: `${day.lightAvoidStart} – ${day.lightAvoidEnd}`, desc: plan.direction === 'east' ? 'Wear sunglasses or stay indoors to avoid evening light delaying your clock.' : 'Avoid morning light — it would advance your clock the wrong direction.' },
    ...(day.melatoninTime ? [{ icon: '💊', label: 'Melatonin', value: day.melatoninTime, desc: plan.direction === 'east' ? 'Take 0.5–1mg now. Melatonin acts as a timing signal — 5 hours before bedtime is the sweet spot eastward.' : 'Take 0.5–1mg 30 minutes before bedtime to help initiate sleep at the destination time.' }] : []),
    ...(day.caffeineCutoff ? [{ icon: '☕', label: 'Last Caffeine', value: day.caffeineCutoff, desc: 'Caffeine has a 5–7 hour half-life. Stop here so it doesn\'t prevent sleep at your target bedtime.' }] : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{day.dayLabel}</Text>
          <Text style={styles.headerDate}>{formatDate(day.date)}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Phase badge */}
        <View style={[styles.phaseBadge, day.phase === 'travel_day' && styles.phaseBadgeTravel]}>
          <Text style={[styles.phaseText, day.phase === 'travel_day' && styles.phaseTextTravel]}>
            {day.phase === 'pre_departure' ? '🏠 Pre-departure (home timezone)' : day.phase === 'travel_day' ? '✈️ Travel Day' : '🌍 At destination'}
          </Text>
        </View>

        {/* 24-hour timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionLabel}>24-Hour Light Window Timeline</Text>
          <TimelineBar
            seekStart={day.lightSeekStart}
            seekEnd={day.lightSeekEnd}
            avoidStart={day.lightAvoidStart}
            avoidEnd={day.lightAvoidEnd}
          />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Seek light</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Avoid light</Text>
            </View>
          </View>
        </View>

        {/* Schedule items */}
        {items.map(item => (
          <View key={item.label} style={styles.scheduleItem}>
            <View style={styles.scheduleItemTop}>
              <Text style={styles.scheduleIcon}>{item.icon}</Text>
              <View style={styles.scheduleItemInner}>
                <Text style={styles.scheduleLabel}>{item.label}</Text>
                <Text style={styles.scheduleValue}>{item.value}</Text>
              </View>
            </View>
            <Text style={styles.scheduleDesc}>{item.desc}</Text>
          </View>
        ))}

        <View style={styles.tzNote}>
          <Text style={styles.tzNoteText}>All times in: {day.timezone}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const tl = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  tick: { position: 'absolute', top: 0, alignItems: 'center' },
  tickLine: { width: 1, height: 16, backgroundColor: '#334155' },
  tickLabel: { fontSize: 10, color: '#475569', marginTop: 2 },
  block: { position: 'absolute', top: 0, height: 24, borderRadius: 4, opacity: 0.85 },
  seekBlock: { backgroundColor: '#22C55E', top: 30 },
  avoidBlock: { backgroundColor: '#EF4444', top: 30 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  back: { fontSize: 16, color: '#38BDF8', fontWeight: '600', width: 60 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
  headerDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  phaseBadge: { backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  phaseBadgeTravel: { borderColor: '#38BDF8', backgroundColor: '#0F2A42' },
  phaseText: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  phaseTextTravel: { color: '#38BDF8' },
  timelineSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  legendRow: { flexDirection: 'row', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: '#64748B' },
  scheduleItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scheduleItemTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  scheduleIcon: { fontSize: 24 },
  scheduleItemInner: { flex: 1 },
  scheduleLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  scheduleValue: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  scheduleDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  tzNote: { backgroundColor: '#1E293B', borderRadius: 8, padding: 12, marginTop: 4 },
  tzNoteText: { fontSize: 12, color: '#475569', textAlign: 'center' },
});
