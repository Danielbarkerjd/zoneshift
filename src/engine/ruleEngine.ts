import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { TripInput, TripPlan, DaySchedule, TripPhase } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);

// Parse 'HH:MM' into total minutes from midnight.
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Format total minutes (0–1439) back to 'HH:MM'. Handles wrap-around.
function fromMinutes(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Clamp minutes between two 'HH:MM' boundaries.
function clampMinutes(mins: number, minHHMM: string, maxHHMM: string): number {
  const lo = toMinutes(minHHMM);
  const hi = toMinutes(maxHHMM);
  return Math.max(lo, Math.min(hi, mins));
}

// Compute UTC offset in hours for an IANA timezone on a specific date.
function getUTCOffsetHours(ianaTimezone: string, date: string): number {
  const dt = dayjs.tz(date + 'T12:00:00', ianaTimezone);
  return dt.utcOffset() / 60;
}

// "Destination wake time" in the home timezone during pre-departure days.
// Conceptually: what time is it at home when it's usualWakeTime at the destination?
function destWakeInHomeTime(usualWakeMin: number, hourDiff: number): number {
  return usualWakeMin - hourDiff * 60;
}

function destBedInHomeTime(usualBedMin: number, hourDiff: number): number {
  return usualBedMin - hourDiff * 60;
}

export function computeSchedule(input: TripInput): TripPlan {
  const { homeCity, destCity, departureDate, returnDate, sleepProfile } = input;
  const {
    usualWakeTime,
    usualBedTime,
    chronotype,
    hasMelatonin,
    drinksCoffee,
  } = sleepProfile;

  // ── Step 1: Compute UTC offset difference ──────────────────────────────────
  const homeOffset = getUTCOffsetHours(homeCity.timezone, departureDate);
  const destOffset = getUTCOffsetHours(destCity.timezone, departureDate);
  let hourDiff = destOffset - homeOffset; // positive = eastward

  // ── Step 2: >12hr flip — go the shorter way around ──────────────────────────
  if (Math.abs(hourDiff) > 12) {
    hourDiff = hourDiff > 0
      ? -(24 - hourDiff)
      : 24 + hourDiff;
  }

  const direction: 'east' | 'west' | 'none' =
    hourDiff > 0 ? 'east' : hourDiff < 0 ? 'west' : 'none';
  const absHourDiff = Math.abs(hourDiff);

  // ── Step 3: Strategy parameters ───────────────────────────────────────────
  let baseShiftRate: number;
  let preDepartureDays: number;

  if (absHourDiff <= 3) {
    baseShiftRate = 1.0;
    preDepartureDays = 0;
  } else if (absHourDiff <= 6) {
    baseShiftRate = 1.0;
    preDepartureDays = 0;
  } else if (absHourDiff <= 9) {
    baseShiftRate = 1.5;
    preDepartureDays = 2;
  } else {
    baseShiftRate = 1.5;
    preDepartureDays = 3;
  }

  // ── Step 4: Chronotype adjustment ─────────────────────────────────────────
  let shiftRate = baseShiftRate;
  if (chronotype === 'morning') shiftRate += 0.25;
  if (chronotype === 'evening') shiftRate -= 0.25;

  // ── Step 5: Trip duration and short-trip detection ────────────────────────
  const departureDayjs = dayjs(departureDate);
  const returnDayjs = returnDate ? dayjs(returnDate) : null;
  const tripDays = returnDayjs ? returnDayjs.diff(departureDayjs, 'day') : null;
  const isShortTripMode = absHourDiff <= 2 || (tripDays !== null && tripDays < 3);

  // Estimated days to fully sync (post-arrival)
  const estimatedDaysToSync = isShortTripMode
    ? 0
    : Math.ceil(absHourDiff / shiftRate);

  if (isShortTripMode) {
    return {
      id: generateId(),
      input,
      hourDiff,
      direction,
      isShortTripMode: true,
      estimatedDaysToSync: 0,
      schedule: [],
      createdAt: new Date().toISOString(),
    };
  }

  // ── Step 6: Generate daily schedule ───────────────────────────────────────
  const schedule: DaySchedule[] = [];
  const baseWakeMin = toMinutes(usualWakeTime);
  const baseBedMin = toMinutes(usualBedTime);

  // For eastward: target wake/bed shift EARLIER each day (negative direction in minutes)
  // For westward: target wake/bed shift LATER each day (positive direction)
  const shiftSign = direction === 'east' ? 1 : -1;
  const shiftMinPerDay = shiftRate * 60 * shiftSign;

  // Pre-departure days (shifting while still at home)
  for (let i = preDepartureDays; i >= 1; i--) {
    const daysShifted = preDepartureDays - i + 1;
    const date = departureDayjs.subtract(i, 'day').format('YYYY-MM-DD');
    const dayLabel = preDepartureDays === 1
      ? 'Pre-departure Day'
      : `Pre-departure Day ${daysShifted}`;

    const day = buildDaySchedule({
      date,
      dayLabel,
      phase: 'pre_departure',
      daysShifted,
      shiftMinPerDay,
      baseWakeMin,
      baseBedMin,
      hourDiff,
      direction,
      hasMelatonin,
      drinksCoffee,
      timezone: homeCity.timezone,
    });
    schedule.push(day);
  }

  // Travel day
  const travelDay = buildDaySchedule({
    date: departureDate,
    dayLabel: 'Travel Day',
    phase: 'travel_day',
    daysShifted: preDepartureDays,
    shiftMinPerDay,
    baseWakeMin,
    baseBedMin,
    hourDiff,
    direction,
    hasMelatonin,
    drinksCoffee,
    timezone: destCity.timezone,
  });
  schedule.push(travelDay);

  // Post-arrival days until fully synced
  for (let day = 1; day <= estimatedDaysToSync; day++) {
    const date = departureDayjs.add(day, 'day').format('YYYY-MM-DD');
    const totalShifted = preDepartureDays + day;
    const dayLabel = day === 1 ? 'Arrival Day' : `Day ${day}`;

    const daySchedule = buildDaySchedule({
      date,
      dayLabel,
      phase: 'post_arrival',
      daysShifted: totalShifted,
      shiftMinPerDay,
      baseWakeMin,
      baseBedMin,
      hourDiff,
      direction,
      hasMelatonin,
      drinksCoffee,
      timezone: destCity.timezone,
    });
    schedule.push(daySchedule);
  }

  return {
    id: generateId(),
    input,
    hourDiff,
    direction,
    isShortTripMode: false,
    estimatedDaysToSync,
    schedule,
    createdAt: new Date().toISOString(),
  };
}

interface DayParams {
  date: string;
  dayLabel: string;
  phase: TripPhase;
  daysShifted: number;
  shiftMinPerDay: number;
  baseWakeMin: number;
  baseBedMin: number;
  hourDiff: number;
  direction: 'east' | 'west' | 'none';
  hasMelatonin: boolean;
  drinksCoffee: boolean;
  timezone: string;
}

function buildDaySchedule(p: DayParams): DaySchedule {
  const totalShiftMin = p.shiftMinPerDay * p.daysShifted;

  // For eastward we shift wake/bed EARLIER (subtract), westward LATER (add)
  let rawWakeMin = p.baseWakeMin + totalShiftMin;
  let rawBedMin = p.baseBedMin + totalShiftMin;

  // Clamp wake: 04:00–10:00, bed: 20:00–02:00 (02:00 = 1440+120 = handled by wrap)
  const wakeMin = clampMinutes(rawWakeMin, '04:00', '10:00');

  // Bed clamp: 20:00 to 26:00 (02:00 next day = 1560 in extended space)
  // We use raw minutes and clamp in extended space
  const bedLo = toMinutes('20:00'); // 1200
  const bedHi = toMinutes('02:00') + 1440; // 120 + 1440 = 1560
  let bedMin = rawBedMin;
  // Normalize to extended space if needed
  if (bedMin < bedLo) bedMin = bedLo;
  if (bedMin > bedHi) bedMin = bedHi;

  const wakeTime = fromMinutes(wakeMin);
  const bedTime = fromMinutes(bedMin);

  // Light windows
  let lightSeekStart: string;
  let lightSeekEnd: string;
  let lightAvoidStart: string;
  let lightAvoidEnd: string;

  if (p.direction === 'east') {
    // Seek morning light: 2hr window starting at wake
    lightSeekStart = wakeTime;
    lightSeekEnd = fromMinutes(wakeMin + 120);
    // Avoid evening light: 3hrs before bed
    lightAvoidStart = fromMinutes(bedMin - 180);
    lightAvoidEnd = bedTime;
  } else {
    // Westward: seek evening light — 2hr window ending at bed
    lightSeekStart = fromMinutes(bedMin - 120);
    lightSeekEnd = bedTime;
    // Avoid morning light: 2hrs after wake
    lightAvoidStart = wakeTime;
    lightAvoidEnd = fromMinutes(wakeMin + 120);
  }

  // Melatonin
  let melatoninTime: string | null = null;
  if (p.hasMelatonin) {
    if (p.direction === 'east') {
      melatoninTime = fromMinutes(bedMin - 300); // bedTime - 5hr
    } else {
      melatoninTime = fromMinutes(bedMin - 30); // bedTime - 30min
    }
  }

  // Caffeine cutoff
  const caffeineCutoff: string | null = p.drinksCoffee
    ? fromMinutes(bedMin - 480) // bedTime - 8hr
    : null;

  return {
    date: p.date,
    dayLabel: p.dayLabel,
    phase: p.phase,
    wakeTime,
    bedTime,
    lightSeekStart,
    lightSeekEnd,
    lightAvoidStart,
    lightAvoidEnd,
    melatoninTime,
    caffeineCutoff,
    timezone: p.timezone,
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
