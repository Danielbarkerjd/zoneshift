import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepProfile, TripPlan, Tier, TripTips } from '../types';

const KEYS = {
  SLEEP_PROFILE: 'zoneshift:sleep_profile',
  ONBOARDING_DONE: 'zoneshift:onboarding_done',
  TRIPS: 'zoneshift:trips',
  ACTIVE_TRIP: 'zoneshift:active_trip',
  TIER: 'zoneshift:tier',
  TRIP_TIPS: 'zoneshift:trip_tips',
} as const;

const DEFAULT_SLEEP_PROFILE: SleepProfile = {
  usualWakeTime: '07:00',
  usualBedTime: '23:00',
  chronotype: 'neutral',
  hasMelatonin: true,
  drinksCoffee: true,
  use24HourFormat: false,
  supplements: {
    magnesium: false,
    ltheanine: false,
    vitaminD: false,
    tartCherry: false,
    ashwagandha: false,
  },
};

export async function getSleepProfile(): Promise<SleepProfile> {
  const raw = await AsyncStorage.getItem(KEYS.SLEEP_PROFILE);
  if (!raw) return { ...DEFAULT_SLEEP_PROFILE };
  let profile: SleepProfile;
  try {
    const parsed = JSON.parse(raw);
    profile = {
      ...DEFAULT_SLEEP_PROFILE,
      ...parsed,
      supplements: { ...DEFAULT_SLEEP_PROFILE.supplements, ...(parsed.supplements ?? {}) },
    };
  } catch {
    return { ...DEFAULT_SLEEP_PROFILE };
  }
  // Migrate bedtime stored by old 24h picker — AM hours (5–11) are almost certainly PM for a bedtime
  const bedH = parseInt((profile.usualBedTime || '23:00').split(':')[0], 10);
  if (bedH >= 5 && bedH < 12) {
    profile.usualBedTime = `${String(bedH + 12).padStart(2, '0')}:${profile.usualBedTime.split(':')[1]}`;
    await AsyncStorage.setItem(KEYS.SLEEP_PROFILE, JSON.stringify(profile));
  }
  return profile;
}

export async function saveSleepProfile(profile: SleepProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.SLEEP_PROFILE, JSON.stringify(profile));
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export async function getTrips(): Promise<TripPlan[]> {
  const raw = await AsyncStorage.getItem(KEYS.TRIPS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveTrip(plan: TripPlan): Promise<void> {
  const trips = await getTrips();
  const idx = trips.findIndex(t => t.id === plan.id);
  if (idx >= 0) {
    trips[idx] = plan;
  } else {
    trips.unshift(plan);
  }
  await AsyncStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
  await AsyncStorage.setItem(KEYS.ACTIVE_TRIP, plan.id);
}

export async function deleteTrip(id: string): Promise<void> {
  const trips = await getTrips();
  const remaining = trips.filter(t => t.id !== id);
  await AsyncStorage.setItem(KEYS.TRIPS, JSON.stringify(remaining));

  const activeId = await AsyncStorage.getItem(KEYS.ACTIVE_TRIP);
  if (activeId === id) {
    const next = remaining[0];
    if (next) {
      await AsyncStorage.setItem(KEYS.ACTIVE_TRIP, next.id);
    } else {
      await AsyncStorage.removeItem(KEYS.ACTIVE_TRIP);
    }
  }
}

export async function getActiveTripId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACTIVE_TRIP);
}

export async function getTripById(id: string): Promise<TripPlan | null> {
  const trips = await getTrips();
  return trips.find(t => t.id === id) ?? null;
}

// ── Tier management ──────────────────────────────────────────────────────────

export async function getTier(): Promise<Tier> {
  const val = await AsyncStorage.getItem(KEYS.TIER);
  if (val === 'per_trip' || val === 'annual' || val === 'lifetime') return val;
  return 'free';
}

export async function setTierStorage(tier: Tier): Promise<void> {
  await AsyncStorage.setItem(KEYS.TIER, tier);
}

// ── Claude tips cache ─────────────────────────────────────────────────────────

export async function getTipsForTrip(tripId: string): Promise<TripTips | null> {
  const raw = await AsyncStorage.getItem(`${KEYS.TRIP_TIPS}:${tripId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveTipsForTrip(tips: TripTips): Promise<void> {
  await AsyncStorage.setItem(`${KEYS.TRIP_TIPS}:${tips.tripId}`, JSON.stringify(tips));
}

export async function getTripsWithoutTips(): Promise<TripPlan[]> {
  const trips = await getTrips();
  const results: TripPlan[] = [];
  for (const trip of trips) {
    if (trip.isShortTripMode) continue;
    const tips = await getTipsForTrip(trip.id);
    if (!tips) results.push(trip);
  }
  return results;
}

// ── Notification IDs ──────────────────────────────────────────────────────────

export async function getNotifIds(planId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(`zs:notif_ids:${planId}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function saveNotifIds(planId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) {
    await AsyncStorage.removeItem(`zs:notif_ids:${planId}`);
  } else {
    await AsyncStorage.setItem(`zs:notif_ids:${planId}`, JSON.stringify(ids));
  }
}

// ── Notification preferences ──────────────────────────────────────────────────

export interface NotifPrefs {
  remindersEnabled: boolean;
  wake: boolean;
  lightSeek: boolean;
  lightAvoid: boolean;
  melatonin: boolean;
  caffeine: boolean;
  bedtime: boolean;
  supplements: boolean;
  bedtimeLeadMin: 15 | 30 | 60;
}

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  remindersEnabled: true,
  wake: true,
  lightSeek: true,
  lightAvoid: true,
  melatonin: true,
  caffeine: true,
  bedtime: true,
  supplements: true,
  bedtimeLeadMin: 30,
};

export async function getNotifPrefs(): Promise<NotifPrefs> {
  const raw = await AsyncStorage.getItem('zs:notif_prefs');
  if (!raw) return { ...DEFAULT_NOTIF_PREFS };
  try { return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) }; }
  catch { return { ...DEFAULT_NOTIF_PREFS }; }
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem('zs:notif_prefs', JSON.stringify(prefs));
}

// ── Destination facts ─────────────────────────────────────────────────────────

export async function getDestFacts(tripId: string): Promise<import('../types').DestFact[] | null> {
  const raw = await AsyncStorage.getItem(`zs:dest_facts:${tripId}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function saveDestFacts(tripId: string, facts: import('../types').DestFact[]): Promise<void> {
  await AsyncStorage.setItem(`zs:dest_facts:${tripId}`, JSON.stringify(facts));
}

// ── DEV-only tier override (bypasses RevenueCat in __DEV__ builds) ────────────

export async function getDevTierOverride(): Promise<Tier | null> {
  const val = await AsyncStorage.getItem('zs:dev_tier_override');
  if (val === 'per_trip' || val === 'annual' || val === 'lifetime' || val === 'free') return val;
  return null;
}

export async function setDevTierOverride(tier: Tier | null): Promise<void> {
  if (tier === null) {
    await AsyncStorage.removeItem('zs:dev_tier_override');
  } else {
    await AsyncStorage.setItem('zs:dev_tier_override', tier);
  }
}

// ── Per-trip purchase IDs ──────────────────────────────────────────────────────

export async function getPurchasedTripIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem('zs:purchased_trips');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addPurchasedTripId(tripId: string): Promise<void> {
  const ids = await getPurchasedTripIds();
  if (!ids.includes(tripId)) {
    await AsyncStorage.setItem('zs:purchased_trips', JSON.stringify([...ids, tripId]));
  }
}
