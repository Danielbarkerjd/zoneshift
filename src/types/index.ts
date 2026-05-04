export type Chronotype = 'morning' | 'neutral' | 'evening';
export type TripPhase = 'pre_departure' | 'travel_day' | 'post_arrival';

export interface SleepProfile {
  usualWakeTime: string; // 'HH:MM'
  usualBedTime: string;  // 'HH:MM'
  chronotype: Chronotype;
  hasMelatonin: boolean;
  drinksCoffee: boolean;
  use24HourFormat: boolean;
}

export interface TripInput {
  homeCity: City;
  destCity: City;
  departureDate: string;  // 'YYYY-MM-DD'
  departureTime: string;  // 'HH:MM'
  returnDate: string | null;
  sleepProfile: SleepProfile;
}

export interface DaySchedule {
  date: string;           // 'YYYY-MM-DD'
  dayLabel: string;
  phase: TripPhase;
  wakeTime: string;       // 'HH:MM'
  bedTime: string;        // 'HH:MM'
  lightSeekStart: string; // 'HH:MM'
  lightSeekEnd: string;   // 'HH:MM'
  lightAvoidStart: string; // 'HH:MM'
  lightAvoidEnd: string;   // 'HH:MM'
  melatoninTime: string | null; // 'HH:MM' or null
  caffeineCutoff: string | null; // 'HH:MM' or null
  timezone: string;       // IANA string
}

export interface TripPlan {
  id: string;
  input: TripInput;
  hourDiff: number;
  direction: 'east' | 'west' | 'none';
  isShortTripMode: boolean;
  estimatedDaysToSync: number;
  schedule: DaySchedule[];
  createdAt: string;
}

export interface City {
  name: string;
  country: string;
  timezone: string; // IANA string
  lat?: number;
  lng?: number;
}
