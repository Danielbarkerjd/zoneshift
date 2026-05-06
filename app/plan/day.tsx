import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Plane, Globe, ChevronDown } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { getTripById, getSleepProfile, getTipsForTrip } from '../../src/storage/storage';
import { fmtTime, tzAbbr, cityLabel, lightSeekLabel } from '../../src/utils/format';
import { useTier } from '../../src/hooks/useTier';
import { C } from '../../src/theme/colors';
import type { DaySchedule, TripPlan, TravelLeg, City } from '../../src/types';

type IconComp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// ── Timeline bar ──────────────────────────────────────────────────────────────

function TimelineBar({ seekStart, seekEnd, avoidStart, avoidEnd }: {
  seekStart: string; seekEnd: string; avoidStart: string; avoidEnd: string;
}) {
  function pct(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return ((h * 60 + m) / 1440) * 100;
  }

  function renderBlock(start: string, end: string, blockStyle: object) {
    const s = pct(start);
    const e = pct(end);
    if (e > s) {
      return <View style={[tl.block, blockStyle, { left: `${s}%` as any, width: `${e - s}%` as any }]} />;
    }
    // Wraps midnight — two segments
    return (
      <>
        <View style={[tl.block, blockStyle, { left: `${s}%` as any, width: `${100 - s}%` as any }]} />
        {e > 0 && <View style={[tl.block, blockStyle, { left: '0%' as any, width: `${e}%` as any }]} />}
      </>
    );
  }

  return (
    <View style={tl.container}>
      {[0, 6, 12, 18, 24].map(h => (
        <View key={h} style={[tl.tick, { left: `${(h / 24) * 100}%` as any }]}>
          <View style={tl.tickLine} />
          <Text style={tl.tickLabel}>
            {h === 0 || h === 24 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`}
          </Text>
        </View>
      ))}
      {renderBlock(seekStart, seekEnd, tl.seekBlock)}
      {renderBlock(avoidStart, avoidEnd, tl.avoidBlock)}
    </View>
  );
}

// ── Flight timeline ───────────────────────────────────────────────────────────

type Waypoint =
  | { kind: 'dep'; city: City; time: string; tz: string; dateOffset: number }
  | { kind: 'arr'; city: City; time: string; tz: string; dateOffset: number }
  | { kind: 'transit'; city: City; arrTime: string; depTime: string; tz: string; arrOffset: number; depOffset: number; durationMinutes: number };

function FlightTimeline({ legs, baseDate, use24h }: { legs: TravelLeg[]; baseDate: string; use24h: boolean }) {
  const waypoints: Waypoint[] = [];
  let i = 0;
  while (i < legs.length) {
    const leg = legs[i];
    if (leg.type !== 'flight') { i++; continue; }

    if (waypoints.length === 0) {
      waypoints.push({ kind: 'dep', city: leg.fromCity, time: leg.departureTime, tz: leg.timezone, dateOffset: 0 });
    }

    const next = legs[i + 1];
    if (next?.type === 'layover') {
      const arrOff = leg.arrivalDateOffset ?? 0;
      const [ah, am] = next.arrival.split(':').map(Number);
      const [dh, dm] = next.departure.split(':').map(Number);
      const depOff = dh * 60 + dm < ah * 60 + am ? arrOff + 1 : arrOff;
      waypoints.push({ kind: 'transit', city: leg.toCity, arrTime: next.arrival, depTime: next.departure, tz: next.timezone, arrOffset: arrOff, depOffset: depOff, durationMinutes: next.durationMinutes });
      i += 2;
    } else {
      waypoints.push({ kind: 'arr', city: leg.toCity, time: leg.arrivalTime ?? '', tz: leg.toCity.timezone, dateOffset: leg.arrivalDateOffset ?? 0 });
      i++;
    }
  }

  function offsetDate(offset: number): string {
    const d = new Date(baseDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }

  function shortDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
  }

  function durStr(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  }

  return (
    <View style={it.container}>
      {waypoints.map((wp, idx) => {
        const isLast = idx === waypoints.length - 1;

        if (wp.kind === 'dep') {
          const ds = offsetDate(wp.dateOffset);
          return (
            <View key={idx} style={it.row}>
              <View style={it.dotCol}>
                <View style={it.dotTeal} />
                {!isLast && <View style={it.line} />}
              </View>
              <View style={it.content}>
                <Text style={it.cityName}>{cityLabel(wp.city)}</Text>
                <Text style={it.depLabel}>Departs</Text>
                <Text style={it.timeText}>{fmtTime(wp.time, use24h)}  {tzAbbr(wp.tz, ds)}</Text>
                <Text style={it.dateText}>{shortDate(ds)}</Text>
              </View>
            </View>
          );
        }

        if (wp.kind === 'arr') {
          const ds = offsetDate(wp.dateOffset);
          return (
            <View key={idx} style={it.row}>
              <View style={it.dotCol}>
                <View style={it.dotAmber} />
              </View>
              <View style={it.content}>
                <Text style={it.cityName}>{cityLabel(wp.city)}</Text>
                <Text style={it.arrLabel}>Arrives</Text>
                {wp.time ? (
                  <>
                    <Text style={it.timeText}>{fmtTime(wp.time, use24h)}  {tzAbbr(wp.tz, ds)}</Text>
                    <Text style={it.dateText}>{shortDate(ds)}</Text>
                  </>
                ) : null}
              </View>
            </View>
          );
        }

        // transit (layover stop)
        const arrDs = offsetDate(wp.arrOffset);
        const depDs = offsetDate(wp.depOffset);
        return (
          <View key={idx} style={it.row}>
            <View style={it.dotCol}>
              <View style={it.dotAmber} />
              {!isLast && <View style={it.line} />}
            </View>
            <View style={[it.content, it.transitContent]}>
              <Text style={it.cityName}>{cityLabel(wp.city)}</Text>
              <Text style={it.arrLabel}>Arrives  {fmtTime(wp.arrTime, use24h)}  {tzAbbr(wp.tz, arrDs)}  ·  {shortDate(arrDs)}</Text>
              <View style={it.layoverPill}>
                <Text style={it.layoverText}>{durStr(wp.durationMinutes)} layover</Text>
              </View>
              <Text style={it.depLabel}>
                Departs  {fmtTime(wp.depTime, use24h)}  {tzAbbr(wp.tz, depDs)}
                {wp.depOffset > wp.arrOffset ? `  ·  ${shortDate(depDs)}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DayDetailScreen() {
  const { tripId, date, leg } = useLocalSearchParams<{ tripId: string; date: string; leg?: string }>();
  const router = useRouter();
  const { isPaid } = useTier();

  const [day, setDay] = useState<DaySchedule | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [use24h, setUse24h] = useState(false);
  const [dayTip, setDayTip] = useState<string | null>(null);
  const [showSupplements, setShowSupplements] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!tripId || !date) return;
    getTripById(tripId).then(p => {
      if (!p) return;
      const effectivePlan = leg === 'return' && p.returnPlan ? p.returnPlan : p;
      setPlan(effectivePlan);
      const d = effectivePlan.schedule.find(s => s.date === date);
      if (d) setDay(d);
      getTipsForTrip(effectivePlan.id).then(tips => {
        const t = tips?.dayTips.find(dt => dt.date === date);
        if (t) setDayTip(t.tip);
      });
    });
    getSleepProfile().then(p => setUse24h(p.use24HourFormat));
  }, [tripId, date, leg]);

  useEffect(() => {
    intervalRef.current = setInterval(() => setClockTick(t => t + 1), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!day || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  // Core timing rows (always visible)
  const coreTimingRows: { label: string; value: string }[] = [];
  if (day.melatoninTime) {
    coreTimingRows.push({ label: 'Melatonin', value: fmtTime(day.melatoninTime, use24h) });
  }
  if (day.caffeineCutoff) {
    coreTimingRows.push({ label: 'Last Caffeine', value: fmtTime(day.caffeineCutoff, use24h) });
  }

  // Supplement rows (collapsible)
  const hasSuppRows = isPaid && (day.supplements ?? []).length > 0;
  const suppRows: { label: string; value: string }[] = hasSuppRows
    ? (day.supplements ?? []).map(s => ({ label: s.name, value: fmtTime(s.suggestedTime, use24h) }))
    : [];

  // Dual timezone helpers
  const hourDiffMin = Math.round(plan.hourDiff * 60);
  const otherCity = day.phase === 'post_arrival' ? plan.input.homeCity : plan.input.destCity;
  const isAtDest = day.phase === 'post_arrival';

  function dualTime(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const base = h * 60 + m;
    const offset = isAtDest ? -hourDiffMin : hourDiffMin;
    const norm = ((base + offset) % 1440 + 1440) % 1440;
    const oh = Math.floor(norm / 60);
    const om = norm % 60;
    return fmtTime(`${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`, use24h);
  }

  function nowInTz(tz: string): string {
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: !use24h,
      }).formatToParts(now);
      const time = parts.filter(p => p.type !== 'literal' || p.value === ':').map(p => p.value).join('');
      return time.replace(/\s/g, ' ').trim();
    } catch { return '--'; }
  }

  const homeCity = plan.input.homeCity;
  const destCity = plan.input.destCity;
  const homeLabel = homeCity.iata ?? homeCity.name.slice(0, 3).toUpperCase();
  const destLabel = destCity.iata ?? destCity.name.slice(0, 3).toUpperCase();
  const homeIsHere = day.phase !== 'post_arrival';
  void clockTick; // trigger re-render for live clock

  const PhaseIcon: IconComp =
    day.phase === 'pre_departure' ? Home
    : day.phase === 'travel_day' ? Plane
    : Globe;

  const phaseLabel =
    day.phase === 'pre_departure' ? 'Pre-departure (home timezone)'
    : day.phase === 'travel_day'  ? 'Travel Day'
    : 'At destination';

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

      {/* Live dual clock bar */}
      <View style={styles.clockBar}>
        <View style={styles.clockSide}>
          <Text style={[styles.clockCity, homeIsHere ? styles.clockCityHere : styles.clockCityThere]}>
            {homeLabel}
          </Text>
          <Text style={[styles.clockTime, homeIsHere ? styles.clockTimeHere : styles.clockTimeThere]}>
            {nowInTz(homeCity.timezone)}
          </Text>
        </View>
        <View style={styles.clockDivider} />
        <View style={[styles.clockSide, { alignItems: 'flex-end' }]}>
          <Text style={[styles.clockCity, !homeIsHere ? styles.clockCityHere : styles.clockCityThere]}>
            {destLabel}
          </Text>
          <Text style={[styles.clockTime, !homeIsHere ? styles.clockTimeHere : styles.clockTimeThere]}>
            {nowInTz(destCity.timezone)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Phase badge */}
        <View style={[styles.phaseBadge, day.phase === 'travel_day' && styles.phaseBadgeTravel]}>
          <PhaseIcon size={14} color={day.phase === 'travel_day' ? C.primary : C.textSec} strokeWidth={1.5} />
          <Text style={[styles.phaseText, day.phase === 'travel_day' && styles.phaseTextTravel]}>
            {' '}{phaseLabel}
          </Text>
        </View>

        {/* Flight itinerary — travel day only */}
        {day.phase === 'travel_day' && (day.legs ?? []).length > 0 && (
          <View style={styles.legsCard}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 14, marginLeft: 0 }]}>FLIGHT ITINERARY</Text>
            <FlightTimeline legs={day.legs ?? []} baseDate={day.date} use24h={use24h} />
            {(day.legs ?? []).some(l => l.type === 'layover' && l.durationMinutes >= 240) && (
              <Text style={styles.layoverTip}>Long layover — get outside for light if possible</Text>
            )}
          </View>
        )}

        {/* Section 1: TODAY'S TIP */}
        {isPaid && dayTip && (
          <>
            <Text style={styles.sectionLabel}>TODAY'S TIP</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>{dayTip}</Text>
            </View>
          </>
        )}

        {/* Section 2: SLEEP & LIGHT */}
        <Text style={styles.sectionLabel}>SLEEP & LIGHT</Text>
        <View style={styles.sleepLightCard}>
          {/* Wake / Bed split */}
          <View style={styles.wbRow}>
            <View style={styles.wbBlock}>
              <Text style={styles.wbLabel}>WAKE</Text>
              <Text style={styles.wbTime}>{fmtTime(day.wakeTime, use24h)}</Text>
              {day.phase !== 'travel_day' && (
                <Text style={styles.wbOtherTime}>{dualTime(day.wakeTime)} in {otherCity.name}</Text>
              )}
            </View>
            <View style={styles.wbDivider} />
            <View style={styles.wbBlock}>
              <Text style={styles.wbLabel}>BED</Text>
              <Text style={styles.wbTime}>{fmtTime(day.bedTime, use24h)}</Text>
              {day.phase !== 'travel_day' && (
                <Text style={styles.wbOtherTime}>{dualTime(day.bedTime)} in {otherCity.name}</Text>
              )}
            </View>
          </View>

          <View style={styles.slDivider} />

          {/* Timeline */}
          <TimelineBar
            seekStart={day.lightSeekStart}
            seekEnd={day.lightSeekEnd}
            avoidStart={day.lightAvoidStart}
            avoidEnd={day.lightAvoidEnd}
          />

          {/* Seek / Avoid labels */}
          <View style={styles.lightRangesRow}>
            <View style={styles.lightRangeItem}>
              <View style={[styles.lightDot, { backgroundColor: C.lightSeek }]} />
              <Text style={styles.lightRangeText}>
                {lightSeekLabel(day.lightSeekStart)} {fmtTime(day.lightSeekStart, use24h)} – {fmtTime(day.lightSeekEnd, use24h)}
              </Text>
            </View>
            <View style={styles.lightRangeItem}>
              <View style={[styles.lightDot, { backgroundColor: C.lightAvoid }]} />
              <Text style={styles.lightRangeText}>
                Avoid bright light {fmtTime(day.lightAvoidStart, use24h)} – {fmtTime(day.lightAvoidEnd, use24h)}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: TIMING */}
        {coreTimingRows.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>TIMING</Text>
            <View style={styles.timingCard}>
              {coreTimingRows.map((row, i) => (
                <View
                  key={row.label}
                  style={[styles.timingRow, i < coreTimingRows.length - 1 && styles.timingRowBorder]}
                >
                  <View style={styles.timingDot} />
                  <Text style={styles.timingLabel}>{row.label}</Text>
                  <Text style={styles.timingValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Section 4: SUPPLEMENTS — collapsible */}
        {hasSuppRows && (
          <>
            <TouchableOpacity
              style={styles.suppHeaderRow}
              onPress={() => setShowSupplements(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLabel}>SUPPLEMENTS</Text>
              <ChevronDown
                size={14}
                color={C.textMuted}
                strokeWidth={1.5}
                style={showSupplements ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            </TouchableOpacity>
            {showSupplements && (
              <>
                <View style={styles.timingCard}>
                  {suppRows.map((row, i) => (
                    <View
                      key={row.label}
                      style={[styles.timingRow, i < suppRows.length - 1 && styles.timingRowBorder]}
                    >
                      <View style={styles.timingDot} />
                      <Text style={styles.timingLabel}>{row.label}</Text>
                      <Text style={styles.timingValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.suppDisclaimer}>
                  Consult your doctor before starting any supplement.
                </Text>
              </>
            )}
          </>
        )}

        <View style={styles.tzNote}>
          <Text style={styles.tzNoteText}>All times in: {tzAbbr(day.timezone, day.date)} ({day.timezone})</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const tl = StyleSheet.create({
  container: { height: 52, backgroundColor: C.bg, borderRadius: 8, marginTop: 12, marginBottom: 4, position: 'relative', overflow: 'hidden' },
  tick: { position: 'absolute', top: 0, alignItems: 'center' },
  tickLine: { width: 1, height: 14, backgroundColor: C.border },
  tickLabel: { fontSize: 10, color: C.textMuted, marginTop: 2, fontFamily: 'Outfit_400Regular' },
  block: { position: 'absolute', height: 18, borderRadius: 4, opacity: 0.9 },
  seekBlock:  { backgroundColor: C.lightSeek, top: 26 },
  avoidBlock: { backgroundColor: C.lightAvoid, top: 26 },
});

const it = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingBottom: 12 },
  row: { flexDirection: 'row' },
  dotCol: { alignItems: 'center', width: 20, marginTop: 3 },
  dotTeal: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary },
  dotAmber: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.amber },
  line: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 3, minHeight: 20 },
  content: { flex: 1, marginLeft: 12, paddingBottom: 18 },
  transitContent: { paddingBottom: 14 },
  cityName: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 2 },
  depLabel: { fontSize: 12, color: C.primary, fontFamily: 'Outfit_500Medium', marginBottom: 2 },
  arrLabel: { fontSize: 12, color: C.amber, fontFamily: 'Outfit_500Medium', marginBottom: 2 },
  timeText: { fontSize: 14, color: C.textPrimary, fontFamily: 'Outfit_500Medium' },
  dateText: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  layoverPill: { backgroundColor: 'rgba(255,183,77,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginVertical: 6, borderWidth: 1, borderColor: 'rgba(255,183,77,0.3)' },
  layoverText: { fontSize: 12, color: C.amber, fontFamily: 'Outfit_700Bold' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, marginBottom: 8,
  },
  back: { fontSize: 16, color: C.primary, fontFamily: 'Outfit_500Medium', width: 60 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  headerDate: { fontSize: 12, color: C.textMuted, marginTop: 2, fontFamily: 'Outfit_400Regular' },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },

  // Phase badge
  phaseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18, borderWidth: 1, borderColor: C.border },
  phaseBadgeTravel: { borderColor: C.primary, backgroundColor: 'rgba(26,158,143,0.08)' },
  phaseText: { fontSize: 14, color: C.textSec, fontFamily: 'Outfit_500Medium' },
  phaseTextTravel: { color: C.primary },

  // Section label
  sectionLabel: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },

  // Flight itinerary
  legsCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 20, paddingTop: 14 },
  layoverTip: { fontSize: 12, color: C.amber, fontFamily: 'Outfit_500Medium', paddingHorizontal: 14, paddingBottom: 10 },

  // Tip card
  tipCard: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.primary },
  tipText: { fontSize: 14, color: C.textSec, fontFamily: 'Outfit_400Regular', lineHeight: 22 },

  // Sleep & Light card
  sleepLightCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  wbRow: { flexDirection: 'row', alignItems: 'center' },
  wbBlock: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  wbLabel: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  wbTime: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 4 },
  wbOtherTime: { fontSize: 11, color: '#4A5670', fontFamily: 'Outfit_400Regular', fontStyle: 'italic', marginTop: 4 },
  wbDivider: { width: 1, height: 72, backgroundColor: C.border },
  slDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  lightRangesRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  lightRangeItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  lightDot: { width: 8, height: 8, borderRadius: 4 },
  lightRangeText: { fontSize: 12, color: C.textSec, fontFamily: 'Outfit_400Regular', flex: 1 },

  // Timing card
  timingCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8, overflow: 'hidden' },
  timingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  timingRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  timingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  timingLabel: { flex: 1, fontSize: 15, color: C.textSec, fontFamily: 'Outfit_400Regular' },
  timingValue: { fontSize: 16, color: C.textPrimary, fontFamily: 'Outfit_700Bold' },
  suppHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginLeft: 2, paddingRight: 2 },
  suppDisclaimer: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', fontStyle: 'italic', textAlign: 'center', marginBottom: 20 },

  // TZ note
  tzNote: { backgroundColor: C.surface, borderRadius: 8, padding: 12, marginTop: 8 },
  tzNoteText: { fontSize: 12, color: C.textMuted, textAlign: 'center', fontFamily: 'Outfit_400Regular' },

  // Live clock bar
  clockBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131D33', borderBottomWidth: 0.5, borderBottomColor: '#1E2D4A', paddingHorizontal: 20, paddingVertical: 8 },
  clockSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  clockDivider: { width: 0.5, height: 20, backgroundColor: '#1E2D4A', marginHorizontal: 12 },
  clockCity: { fontSize: 11, fontFamily: 'Outfit_700Bold', letterSpacing: 0.5 },
  clockTime: { fontSize: 12, fontFamily: 'Outfit_500Medium' },
  clockCityHere: { color: '#1A9E8F' },
  clockCityThere: { color: '#6B7A99' },
  clockTimeHere: { color: '#1A9E8F' },
  clockTimeThere: { color: '#6B7A99' },
});
