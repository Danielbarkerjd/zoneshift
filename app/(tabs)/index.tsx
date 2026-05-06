import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getActiveTripId, getTripById, getSleepProfile, getTrips, getDestFacts } from '../../src/storage/storage';
import { cityLabel, fmtTime, lightSeekLabel } from '../../src/utils/format';
import { DiffPill } from '../../src/components/DiffPill';
import { C } from '../../src/theme/colors';
import { Wordmark } from '../../src/components/Wordmark';
import { RefreshCw } from 'lucide-react-native';
import type { TripPlan, DaySchedule, SleepProfile, DestFact } from '../../src/types';

const TIPS_OF_DAY = [
  "Morning light is the most powerful signal your brain uses to set your clock. Seek it.",
  "Eastward travel is harder than westward — you're asking your body to wake up before it's ready.",
  "Melatonin works best taken 5 hours before your target bedtime, not right at bedtime.",
  "Caffeine blocks adenosine — the sleep signal. Avoid it 8+ hours before your target bedtime.",
  "Even a short walk outside in the morning can anchor your circadian clock to local time.",
  "Blue light from screens delays melatonin production. Dim screens when avoiding evening light.",
  "Exercise helps shift the clock — morning workouts for eastward trips, evening for westward.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function nowMinInTz(tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    let h = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
    if (h === 24) h = 0;
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
    return h * 60 + m;
  } catch {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }
}

function liveTimeInTz(tz: string, use24h: boolean): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: !use24h,
    }).format(new Date());
  } catch {
    return '--:--';
  }
}

function fmtCountdown(diffMin: number): string {
  if (diffMin <= 0) return 'now';
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

type ActionItem = { label: string; time: string; endTime?: string };

function buildActions(day: DaySchedule): ActionItem[] {
  return [
    { label: 'Wake up', time: day.wakeTime },
    { label: lightSeekLabel(day.lightSeekStart), time: day.lightSeekStart, endTime: day.lightSeekEnd },
    { label: 'Avoid bright light', time: day.lightAvoidStart, endTime: day.lightAvoidEnd },
    ...(day.melatoninTime ? [{ label: 'Take melatonin', time: day.melatoninTime }] : []),
    ...(day.caffeineCutoff ? [{ label: 'Caffeine cutoff', time: day.caffeineCutoff }] : []),
    { label: 'Bedtime', time: day.bedTime },
  ].sort((a, b) => toMin(a.time) - toMin(b.time));
}

function getNextAction(
  day: DaySchedule,
  nowMin: number,
  use24h: boolean,
): { label: string; timeStr: string; diffMin: number; isActive: boolean } | null {
  const actions = buildActions(day);

  for (const a of actions) {
    if (a.endTime) {
      const start = toMin(a.time);
      const end = toMin(a.endTime);
      if (nowMin >= start && nowMin < end) {
        return { label: a.label, timeStr: `until ${fmtTime(a.endTime, use24h)}`, diffMin: end - nowMin, isActive: true };
      }
    }
  }

  const next = actions.find(a => toMin(a.time) > nowMin);
  if (!next) return null;
  return { label: next.label, timeStr: fmtTime(next.time, use24h), diffMin: toMin(next.time) - nowMin, isActive: false };
}

function calcAdjustmentPct(plan: TripPlan, todayDay: DaySchedule): number {
  const postDays = plan.schedule.filter(d => d.phase === 'post_arrival');
  if (postDays.length < 2) return 100;
  const firstWake = toMin(postDays[0].wakeTime);
  const lastWake = toMin(postDays[postDays.length - 1].wakeTime);
  if (firstWake === lastWake) return 100;
  const pct = Math.abs(toMin(todayDay.wakeTime) - firstWake) / Math.abs(lastWake - firstWake);
  return Math.min(100, Math.max(0, Math.round(pct * 100)));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<TripPlan | null>(null);
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [recentTrips, setRecentTrips] = useState<TripPlan[]>([]);
  const [destFacts, setDestFacts] = useState<DestFact[] | null>(null);
  const [factOffset, setFactOffset] = useState(0);
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(useCallback(() => {
    getActiveTripId().then(id => {
      if (id) {
        getTripById(id).then(p => {
          setActivePlan(p);
          if (p) getDestFacts(p.id).then(setDestFacts);
        });
      } else {
        setActivePlan(null);
        setDestFacts(null);
      }
    });
    getSleepProfile().then(setProfile);
    getTrips().then(trips => setRecentTrips(trips.slice(0, 3)));
  }, []));

  useEffect(() => {
    intervalRef.current = setInterval(() => forceUpdate(n => n + 1), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const use24h = profile?.use24HourFormat ?? false;
  const tipIndex = new Date().getDate() % TIPS_OF_DAY.length;

  // Resolve which fact to show (cycles by day, offset by tap)
  const activeFact: DestFact | null = (() => {
    if (!destFacts || destFacts.length === 0 || !activePlan) return null;
    const daysSince = Math.floor((Date.now() - new Date(activePlan.createdAt).getTime()) / 86400000);
    const idx = ((daysSince % destFacts.length) + factOffset) % destFacts.length;
    return destFacts[idx];
  })();

  const CATEGORY_LABEL: Record<DestFact['category'], string> = {
    culture: 'Culture',
    food: 'Food & Dining',
    practical: 'Practical',
    surprise: 'Surprise',
  };

  // Find today's day in schedule (outbound first, then return)
  let today: DaySchedule | null = null;
  let planForToday: TripPlan | null = activePlan;
  if (activePlan) {
    today = activePlan.schedule.find(d => d.date === todayStr) ?? null;
    if (!today && activePlan.returnPlan) {
      today = activePlan.returnPlan.schedule.find(d => d.date === todayStr) ?? null;
      if (today) planForToday = activePlan.returnPlan;
    }
  }

  const nowMin = today ? nowMinInTz(today.timezone) : 0;
  const nextAction = today ? getNextAction(today, nowMin, use24h) : null;

  // Pre-departure / travel day references (needed for all states)
  const travelDay = activePlan?.schedule.find(d => d.phase === 'travel_day');
  const preDays = activePlan?.schedule.filter(d => d.phase === 'pre_departure') ?? [];
  const firstPreDay = preDays[0] ?? null;

  const daysUntilTravel = travelDay ? Math.max(0, Math.round(
    (new Date(travelDay.date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000
  )) : 0;

  // STATE 0: plan exists but today is before first pre-departure day
  const isFutureTrip = activePlan != null && today === null &&
    firstPreDay != null && todayStr < firstPreDay.date;

  const dashState: 'future' | 'pre_departure' | 'active' | 'none' =
    isFutureTrip ? 'future' :
    today?.phase === 'pre_departure' ? 'pre_departure' :
    (today?.phase === 'travel_day' || today?.phase === 'post_arrival') ? 'active' :
    'none';

  const preDaysDone = today ? preDays.findIndex(d => d.date === todayStr) : preDays.length;
  const preTotal = preDays.length;
  const preBarPct = preTotal > 0 ? Math.round((preDaysDone / preTotal) * 100) : 0;

  // STATE 0: days until adjustment starts
  const daysUntilAdjStart = firstPreDay ? Math.max(0, Math.round(
    (new Date(firstPreDay.date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000
  )) : null;
  const adjStartSoon = daysUntilAdjStart !== null && daysUntilAdjStart <= 7;

  // Adjustment progress
  const adjPct = (today && planForToday && today.phase === 'post_arrival')
    ? calcAdjustmentPct(planForToday, today)
    : 0;

  // Clock bar cities
  const homeTz = activePlan?.input.homeCity.timezone ?? '';
  const destTz = activePlan?.input.destCity.timezone ?? '';
  const homeCity = activePlan?.input.homeCity.name ?? '';
  const destCity = activePlan?.input.destCity.name ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Wordmark fontSize={32} />
          <Text style={styles.headerSub}>Jet Lag Recovery</Text>
        </View>

        {/* Active Plan Card */}
        {activePlan && (
          <TouchableOpacity onPress={() => router.push(`/plan/${activePlan.id}`)} activeOpacity={0.9}>
            <LinearGradient
              colors={['#0F6E56', '#1A9E8F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activePlanCard}
            >
              <Text style={styles.activePlanLabel}>Active Plan</Text>
              <Text style={styles.activePlanRoute}>
                {cityLabel(activePlan.input.homeCity)} → {cityLabel(activePlan.input.destCity)}
              </Text>
              <View style={styles.activePlanMetaRow}>
                <DiffPill hourDiff={activePlan.hourDiff} direction={activePlan.direction} variant="onTeal" />
                <Text style={styles.activePlanMetaDot}>·</Text>
                <Text style={styles.activePlanMeta}>~{activePlan.estimatedDaysToSync} day{activePlan.estimatedDaysToSync !== 1 ? 's' : ''} adjustment</Text>
              </View>
              <Text style={styles.activePlanView}>View Plan →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── STATE 0: Future trip — before pre-departure phase begins ── */}
        {dashState === 'future' && activePlan && (
          <>
            <View style={styles.dashCard}>
              <Text style={styles.dashCardLabel}>Departure Countdown</Text>
              <Text style={styles.countdownNum}>{daysUntilTravel} day{daysUntilTravel !== 1 ? 's' : ''}</Text>
              {travelDay && (
                <Text style={styles.countdownSub}>
                  Departs {new Date(travelDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
              {daysUntilAdjStart !== null && firstPreDay && (
                <Text style={[styles.adjStartNote, adjStartSoon && styles.adjStartNoteSoon]}>
                  {adjStartSoon
                    ? `Adjustment starts in ${daysUntilAdjStart} day${daysUntilAdjStart !== 1 ? 's' : ''} — get ready`
                    : `Adjustment starts ${new Date(firstPreDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </Text>
              )}
            </View>

            {activeFact ? (
              <View style={styles.tipCard}>
                <View style={styles.factCardHeader}>
                  <Text style={styles.tipCardLabel}>Did You Know?</Text>
                  <View style={styles.factHeaderRight}>
                    <Text style={styles.factCategory}>{CATEGORY_LABEL[activeFact.category]}</Text>
                    <TouchableOpacity
                      onPress={() => setFactOffset(o => o + 1)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <RefreshCw size={14} color={C.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.tipCardText}>{activeFact.text}</Text>
              </View>
            ) : (
              <View style={styles.tipCard}>
                <Text style={styles.tipCardLabel}>Tip of the Day</Text>
                <Text style={styles.tipCardText}>{TIPS_OF_DAY[tipIndex]}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/trip-setup')}>
              <Text style={styles.secondaryBtnText}>Plan a new trip</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STATE 1: Pre-departure ── */}
        {dashState === 'pre_departure' && today && (
          <>
            <View style={styles.dashCard}>
              <Text style={styles.dashCardLabel}>Departure Countdown</Text>
              <Text style={styles.countdownNum}>{daysUntilTravel} day{daysUntilTravel !== 1 ? 's' : ''}</Text>
              {travelDay && (
                <Text style={styles.countdownSub}>
                  until {new Date(travelDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
              {preTotal > 0 && (
                <>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${preBarPct}%` as any }]} />
                  </View>
                  <Text style={styles.progressLabel}>
                    {preDaysDone} of {preTotal} pre-shift day{preTotal !== 1 ? 's' : ''} complete
                  </Text>
                </>
              )}
            </View>

            {nextAction && (
              <View style={styles.dashCard}>
                <Text style={styles.dashCardLabel}>Next Action Today</Text>
                <Text style={styles.nextActionName}>{nextAction.label}</Text>
                <Text style={styles.nextActionMeta}>
                  {nextAction.isActive
                    ? `Active now — ${nextAction.timeStr}`
                    : `in ${fmtCountdown(nextAction.diffMin)} — at ${nextAction.timeStr}`}
                </Text>
              </View>
            )}

            {activeFact ? (
              <View style={styles.tipCard}>
                <View style={styles.factCardHeader}>
                  <Text style={styles.tipCardLabel}>Did You Know?</Text>
                  <View style={styles.factHeaderRight}>
                    <Text style={styles.factCategory}>{CATEGORY_LABEL[activeFact.category]}</Text>
                    <TouchableOpacity
                      onPress={() => setFactOffset(o => o + 1)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <RefreshCw size={14} color={C.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.tipCardText}>{activeFact.text}</Text>
              </View>
            ) : (
              <View style={styles.tipCard}>
                <Text style={styles.tipCardLabel}>Tip of the Day</Text>
                <Text style={styles.tipCardText}>{TIPS_OF_DAY[tipIndex]}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/trip-setup')}>
              <Text style={styles.secondaryBtnText}>Plan a new trip</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STATE 2: Travel / Post-arrival ── */}
        {dashState === 'active' && today && activePlan && (
          <>
            {/* Live dual clock */}
            <View style={styles.clockBar}>
              <View style={styles.clockSide}>
                <Text style={styles.clockCity}>{homeCity}</Text>
                <Text style={[styles.clockTime, today.phase === 'post_arrival' ? styles.clockTimeThere : styles.clockTimeHere]}>
                  {liveTimeInTz(homeTz, use24h)}
                </Text>
              </View>
              <View style={styles.clockDivider} />
              <View style={styles.clockSide}>
                <Text style={styles.clockCity}>
                  {destCity}{today.phase === 'post_arrival' ? ' · here' : ''}
                </Text>
                <Text style={[styles.clockTime, today.phase === 'post_arrival' ? styles.clockTimeHere : styles.clockTimeThere]}>
                  {liveTimeInTz(destTz, use24h)}
                </Text>
              </View>
            </View>

            <View style={styles.dashCard}>
              <Text style={styles.dashCardLabel}>
                {today.phase === 'travel_day' ? 'Travel Day' : `In ${destCity}`}
              </Text>
              <Text style={styles.dayLabelText}>{today.dayLabel}</Text>
              {today.phase === 'post_arrival' && (
                <>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${adjPct}%` as any }]} />
                  </View>
                  <Text style={styles.progressLabel}>
                    {adjPct >= 100 ? 'Fully adjusted!' : `Clock adjustment: ${adjPct}%`}
                  </Text>
                </>
              )}
            </View>

            {nextAction && (
              <View style={styles.dashCard}>
                <Text style={styles.dashCardLabel}>Next Action Today</Text>
                <Text style={styles.nextActionName}>{nextAction.label}</Text>
                <Text style={styles.nextActionMeta}>
                  {nextAction.isActive
                    ? `Active now — ${nextAction.timeStr}`
                    : `in ${fmtCountdown(nextAction.diffMin)} — at ${nextAction.timeStr}`}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/trip-setup')}>
              <Text style={styles.secondaryBtnText}>Plan a new trip</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STATE 3: No active today ── */}
        {dashState === 'none' && (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/trip-setup')}>
              <Text style={styles.primaryBtnText}>Plan My Trip</Text>
            </TouchableOpacity>

            <View style={styles.tipCard}>
              <Text style={styles.tipCardLabel}>Tip of the Day</Text>
              <Text style={styles.tipCardText}>{TIPS_OF_DAY[tipIndex]}</Text>
            </View>

            {recentTrips.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Recent Trips</Text>
                {recentTrips.map(trip => (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.recentRow}
                    onPress={() => router.push(`/plan/${trip.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentRowLeft}>
                      <Text style={styles.recentRoute}>
                        {trip.input.homeCity.name} → {trip.input.destCity.name}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {trip.input.departureDate} · {Math.abs(trip.hourDiff)}h {trip.direction}
                      </Text>
                    </View>
                    <Text style={styles.recentArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerSub: { fontSize: 14, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 4 },

  // Active plan card
  activePlanCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  activePlanLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit_500Medium', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  activePlanRoute: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: '#FFFFFF', marginBottom: 6 },
  activePlanMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  activePlanMetaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  activePlanMeta: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontFamily: 'Outfit_400Regular' },
  activePlanView: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Outfit_700Bold' },

  // Shared dashboard card
  dashCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  dashCardLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Countdown
  countdownNum: { fontSize: 40, fontFamily: 'Outfit_700Bold', color: C.textPrimary, lineHeight: 44 },
  countdownSub: { fontSize: 14, color: C.textSec, fontFamily: 'Outfit_400Regular', marginTop: 2, marginBottom: 14 },
  adjStartNote: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 10 },
  adjStartNoteSoon: { color: C.amber, fontFamily: 'Outfit_600SemiBold' },

  // Progress bar
  progressBarBg: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    marginTop: 14,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular' },

  // Next action
  nextActionName: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 4 },
  nextActionMeta: { fontSize: 14, color: C.primary, fontFamily: 'Outfit_500Medium' },

  // Day label
  dayLabelText: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: C.textPrimary, marginBottom: 4 },

  // Dual clock bar
  clockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  clockSide: { flex: 1, alignItems: 'center' },
  clockDivider: { width: 1, height: 44, backgroundColor: C.border, marginHorizontal: 12 },
  clockCity: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_500Medium', letterSpacing: 0.4, marginBottom: 4, textTransform: 'uppercase' },
  clockTime: { fontSize: 24, fontFamily: 'Outfit_700Bold' },
  clockTimeHere: { color: C.primary },
  clockTimeThere: { color: C.textSec },

  // Primary button
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Outfit_700Bold' },

  // Secondary button
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  secondaryBtnText: { fontSize: 14, color: C.textMuted, fontFamily: 'Outfit_500Medium' },

  // Tip card
  tipCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  tipCardLabel: { fontSize: 11, color: C.amber, fontFamily: 'Outfit_700Bold', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  tipCardText: { fontSize: 15, color: C.textPrimary, lineHeight: 23, fontFamily: 'Outfit_400Regular' },
  factCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  factHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factCategory: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_500Medium', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Recent trips
  recentSection: { gap: 10 },
  recentTitle: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_700Bold', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  recentRowLeft: { flex: 1 },
  recentRoute: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: C.textPrimary, marginBottom: 2 },
  recentMeta: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  recentArrow: { fontSize: 16, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
});
