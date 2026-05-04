import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepProfile, TripPlan } from '../types';

const KEYS = {
  SLEEP_PROFILE: 'zoneshift:sleep_profile',
  ONBOARDING_DONE: 'zoneshift:onboarding_done',
  TRIPS: 'zoneshift:trips',
  ACTIVE_TRIP: 'zoneshift:active_trip',
} as const;

const DEFAULT_SLEEP_PROFILE: SleepProfile = {
  usualWakeTime: '07:00',
  usualBedTime: '23:00',
  chronotype: 'neutral',
  hasMelatonin: true,
  drinksCoffee: true,
  use24HourFormat: false,
};

export async function getSleepProfile(): Promise<SleepProfile> {
  const raw = await AsyncStorage.getItem(KEYS.SLEEP_PROFILE);
  if (!raw) return { ...DEFAULT_SLEEP_PROFILE };
  try {
    return { ...DEFAULT_SLEEP_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SLEEP_PROFILE };
  }
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
