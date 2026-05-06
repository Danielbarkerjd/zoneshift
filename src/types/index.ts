export type Chronotype = 'morning' | 'neutral' | 'evening';
export type TripPhase = 'pre_departure' | 'travel_day' | 'post_arrival';
export type Tier = 'free' | 'per_trip' | 'annual' | 'lifetime';
export type ScheduleFlexibility = 'strict' | 'balanced' | 'flexible';

export interface Supplements {
  magnesium: boolean;
  ltheanine: boolean;
  vitaminD: boolean;
  tartCherry: boolean;
  ashwagandha: boolean;
}

export interface SupplementTiming {
  name: string;
  suggestedTime: string;  // 'HH:MM'
  relativeText: string;
  emoji: string;
  description: string;
}

export interface SleepProfile {
  usualWakeTime: string; // 'HH:MM'
  usualBedTime: string;  // 'HH:MM'
  chronotype: Chronotype;
  hasMelatonin: boolean;
  drinksCoffee: boolean;
  use24HourFormat: boolean;
  supplements: Supplements;
}

export interface City {
  name: string;
  country: string;
  timezone: string; // IANA string
  iata?: string;        // primary airport IATA code
  state?: string;       // US/CA state abbreviation
  displayName?: string; // override for search result display
  aliases?: string[];   // alt names, additional codes, accent variants
  lat?: number;
  lng?: number;
}

export interface Layover {
  city: City;
  arrivalTime: string;    // 'HH:MM' local to layover city
  departureTime: string;  // 'HH:MM' local to layover city
  arrivalDate?: string;   // 'YYYY-MM-DD' (may be next day from origin departure)
  departureDate?: string; // 'YYYY-MM-DD'
}

export type TravelLeg =
  | { type: 'flight'; fromCity: City; toCity: City; departureTime: string; arrivalTime?: string; arrivalDateOffset?: number; timezone: string }
  | { type: 'layover'; city: City; timezone: string; arrival: string; departure: string; durationMinutes: number };

export interface TripInput {
  homeCity: City;
  destCity: City;
  departureDate: string;  // 'YYYY-MM-DD'
  departureTime: string;  // 'HH:MM'
  arrivalTime?: string;   // 'HH:MM' local to destCity
  arrivalDate?: string;   // 'YYYY-MM-DD' local to destCity (may be next day)
  returnDate: string | null;
  returnTime?: string;          // 'HH:MM' — departure time for return flight
  returnArrivalTime?: string;   // 'HH:MM' local to homeCity
  returnArrivalDate?: string;   // 'YYYY-MM-DD' local to homeCity
  layovers?: Layover[];
  returnLayovers?: Layover[];
  sleepProfile: SleepProfile;
  scheduleFlexibility?: ScheduleFlexibility;
  minPreDepartureDate?: string; // 'YYYY-MM-DD' — no pre-departure days on or before this date
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
  supplements: SupplementTiming[];
  timezone: string;       // IANA string
  legs?: TravelLeg[];     // populated on travel_day only
}

export interface TripPlan {
  id: string;
  input: TripInput;
  hourDiff: number;
  direction: 'east' | 'west' | 'none';
  rawHourDiff?: number;          // pre-flip geographic diff; only set when >12h flip applied
  isShortTripMode: boolean;
  estimatedDaysToSync: number;
  isPartialAdjustment?: boolean; // true when trip is too short for full sync
  targetAdjustHours?: number;    // target adjustment in partial mode (hours)
  schedule: DaySchedule[];
  scheduleNote?: string;         // set when pre-departure days were capped due to proximity
  createdAt: string;
  returnPlan?: TripPlan;
  originalDepartureDate?: string;
  originalReturnDate?: string | null;
}

export interface TripTips {
  tripId: string;
  summary: string;
  dayTips: Array<{ date: string; tip: string }>;
  fetchedAt: string;
}

export interface DestFact {
  text: string;
  category: 'culture' | 'food' | 'practical' | 'surprise';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
