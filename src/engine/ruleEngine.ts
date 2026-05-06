import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { TripInput, TripPlan, DaySchedule, TripPhase, SupplementTiming, Supplements, Layover, TravelLeg, City } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number): string {
  const wrapped = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getUTCOffsetHours(ianaTimezone: string, date: string): number {
  try {
    const refUtc = new Date(`${date}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(refUtc);
    const get = (type: string): number =>
      parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);
    const localFakeMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), 0);
    const utcNoonMs   = Date.UTC(refUtc.getUTCFullYear(), refUtc.getUTCMonth(), refUtc.getUTCDate(), 12, 0, 0);
    return (localFakeMs - utcNoonMs) / 3_600_000;
  } catch {
    return dayjs.tz(`${date}T12:00:00`, ianaTimezone).utcOffset() / 60;
  }
}

function timeDiffMinutes(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  let diff = (th * 60 + tm) - (fh * 60 + fm);
  if (diff < 0) diff += 1440;
  return diff;
}

function computeLegs(
  homeCity: City,
  destCity: City,
  departureTime: string,
  layovers: Layover[],
  finalArrivalTime: string | undefined,
  departureDate: string,
): TravelLeg[] {
  const homeOffset = getUTCOffsetHours(homeCity.timezone, departureDate);
  let cumUTC = toMinutes(departureTime) - homeOffset * 60;

  function resolveOffset(time: string, tz: string): number {
    const tzOff = getUTCOffsetHours(tz, departureDate);
    let utc = toMinutes(time) - tzOff * 60;
    while (utc < cumUTC - 30) utc += 1440;
    cumUTC = utc;
    return Math.floor((utc + tzOff * 60) / 1440);
  }

  if (layovers.length === 0) {
    const arrOff = finalArrivalTime !== undefined ? resolveOffset(finalArrivalTime, destCity.timezone) : undefined;
    return [{ type: 'flight', fromCity: homeCity, toCity: destCity, departureTime, arrivalTime: finalArrivalTime, arrivalDateOffset: arrOff, timezone: homeCity.timezone }];
  }

  const legs: TravelLeg[] = [];
  let prevCity = homeCity;
  let prevDep = departureTime;

  for (const layover of layovers) {
    const arrOff = resolveOffset(layover.arrivalTime, layover.city.timezone);
    legs.push({ type: 'flight', fromCity: prevCity, toCity: layover.city, departureTime: prevDep, arrivalTime: layover.arrivalTime, arrivalDateOffset: arrOff, timezone: prevCity.timezone });
    resolveOffset(layover.departureTime, layover.city.timezone);
    legs.push({ type: 'layover', city: layover.city, timezone: layover.city.timezone, arrival: layover.arrivalTime, departure: layover.departureTime, durationMinutes: timeDiffMinutes(layover.arrivalTime, layover.departureTime) });
    prevCity = layover.city;
    prevDep = layover.departureTime;
  }

  const finalOff = finalArrivalTime !== undefined ? resolveOffset(finalArrivalTime, destCity.timezone) : undefined;
  legs.push({ type: 'flight', fromCity: prevCity, toCity: destCity, departureTime: prevDep, arrivalTime: finalArrivalTime, arrivalDateOffset: finalOff, timezone: prevCity.timezone });
  return legs;
}

export function computeSchedule(input: TripInput): TripPlan {
  const { homeCity, destCity, departureDate, returnDate, sleepProfile } = input;
  const layovers = input.layovers ?? [];
  const { usualWakeTime, usualBedTime, chronotype, hasMelatonin, drinksCoffee, supplements } = sleepProfile;

  // ── 1. UTC offset difference ──────────────────────────────────────────────
  const homeOffset = getUTCOffsetHours(homeCity.timezone, departureDate);
  const destOffset = getUTCOffsetHours(destCity.timezone, departureDate);
  let hourDiff = Math.round((destOffset - homeOffset) * 4) / 4;
  const geographicHourDiff = hourDiff;
  if (Math.abs(hourDiff) > 12) {
    hourDiff = hourDiff > 0 ? -(24 - hourDiff) : 24 + hourDiff;
  }

  const direction: 'east' | 'west' | 'none' =
    hourDiff > 0 ? 'east' : hourDiff < 0 ? 'west' : 'none';
  const absHourDiff = Math.abs(hourDiff);

  // ── 2. Strategy parameters ─────────────────────────────────────────────────
  let baseShiftRate: number;
  let maxPreDays: number;
  if (absHourDiff <= 3)      { baseShiftRate = 1.0; maxPreDays = 0; }
  else if (absHourDiff <= 6) { baseShiftRate = 1.0; maxPreDays = 0; }
  else if (absHourDiff <= 9) { baseShiftRate = 1.5; maxPreDays = 2; }
  else                       { baseShiftRate = 1.5; maxPreDays = 3; }

  let shiftRate = baseShiftRate;
  if (chronotype === 'morning') shiftRate += 0.25;
  if (chronotype === 'evening') shiftRate -= 0.25;
  shiftRate = Math.max(0.5, shiftRate); // floor

  // ── 3. Trip duration / short-trip detection ────────────────────────────────
  const departureDayjs = dayjs(departureDate);
  const returnDayjs = returnDate ? dayjs(returnDate) : null;
  const tripDays = returnDayjs ? returnDayjs.diff(departureDayjs, 'day') : null;
  const isShortTripMode = absHourDiff <= 2 || (tripDays !== null && tripDays < 3);

  if (isShortTripMode) {
    return {
      id: generateId(), input, hourDiff, direction,
      ...(geographicHourDiff !== hourDiff ? { rawHourDiff: geographicHourDiff } : {}),
      isShortTripMode: true, estimatedDaysToSync: 0, schedule: [],
      createdAt: new Date().toISOString(),
    };
  }

  // ── 4. Cap pre-departure days ──────────────────────────────────────────────
  const today = dayjs();
  const daysUntilDep = departureDayjs.diff(today, 'day');
  let actualPreDays = Math.min(maxPreDays, Math.max(0, daysUntilDep));

  // Prevent overlap with outbound plan's last date
  if (input.minPreDepartureDate) {
    const minDate = dayjs(input.minPreDepartureDate);
    const gap = departureDayjs.diff(minDate, 'day');
    actualPreDays = Math.min(actualPreDays, Math.max(0, gap - 1));
  }

  let scheduleNote: string | undefined;
  if (maxPreDays > 0 && actualPreDays < maxPreDays) {
    if (actualPreDays === 0) {
      scheduleNote = input.minPreDepartureDate
        ? 'Your return departs before outbound adjustment completes — returning you directly to your home schedule from travel day.'
        : 'Departure is imminent — pre-departure adjustment phase skipped. Your plan starts from the travel day.';
    } else {
      const reason = input.minPreDepartureDate ? 'to avoid overlap with your outbound schedule' : `departure is in ${daysUntilDep} day${daysUntilDep !== 1 ? 's' : ''}`;
      scheduleNote = `Pre-departure prep shortened to ${actualPreDays} day${actualPreDays !== 1 ? 's' : ''} (${reason}).`;
    }
  }

  // ── 5. Shift math ──────────────────────────────────────────────────────────
  const shiftSign = direction === 'east' ? -1 : 1; // -1 = shift earlier; +1 = shift later
  const shiftRateMin = shiftRate * 60;
  const MAX_PRE_SHIFT_MIN = 120; // ±2 hours relative clamp for pre-departure

  // Gradual first day: shift only 45 min on day 1 instead of a full shiftRate jump
  const firstDayShiftMag = Math.min(45, shiftRateMin);

  // Pre-departure shift magnitude for daysShifted days (unsigned):
  function preDeptShiftMag(d: number): number {
    if (d <= 0) return 0;
    return d === 1 ? firstDayShiftMag : firstDayShiftMag + (d - 1) * shiftRateMin;
  }

  // Achieved pre-departure shift (signed), clamped at ±MAX_PRE_SHIFT_MIN:
  const rawPreShiftMag = preDeptShiftMag(actualPreDays);
  const clampedPreShiftMag = Math.min(rawPreShiftMag, MAX_PRE_SHIFT_MIN);
  const achievedPreShiftMin = shiftSign * clampedPreShiftMag; // signed

  // Schedule flexibility clamps (needed for progression base below):
  const flex = input.scheduleFlexibility ?? 'balanced';
  const FLEX_CLAMPS = {
    strict:   { wakeFlexMin: 6 * 60, wakeFlexMax:  8 * 60, bedFlexMin: 21 * 60, bedFlexMax: 24 * 60 + 30 },
    balanced: { wakeFlexMin: 5 * 60, wakeFlexMax: 10 * 60, bedFlexMin: 21 * 60, bedFlexMax: 25 * 60      },
    flexible: { wakeFlexMin: 4 * 60, wakeFlexMax: 12 * 60, bedFlexMin: 20 * 60, bedFlexMax: 27 * 60      },
  };
  const { wakeFlexMin, wakeFlexMax, bedFlexMin, bedFlexMax } = FLEX_CLAMPS[flex];

  // Body clock at arrival, expressed in destination local time:
  const baseWakeMin = toMinutes(usualWakeTime);
  const baseBedMin  = toMinutes(usualBedTime);
  const arrivalBodyWakeMin = baseWakeMin + achievedPreShiftMin + hourDiff * 60;
  const arrivalBodyBedMin  = baseBedMin  + achievedPreShiftMin + hourDiff * 60;

  // For large shifts, arrivalBodyWakeMin can fall far outside the flex range (e.g. deeply
  // negative for a large westward shift). Clamp to the flex boundary so that progression
  // begins visibly from Day 1 rather than holding flat until raw math catches up.
  const loopArrivalWakeMin = direction === 'west'
    ? Math.max(wakeFlexMin, arrivalBodyWakeMin)
    : Math.min(wakeFlexMax, arrivalBodyWakeMin);
  const loopArrivalBedMin = direction === 'west'
    ? Math.max(bedFlexMin, arrivalBodyBedMin)
    : Math.min(bedFlexMax, arrivalBodyBedMin);

  // Remaining gap from destination-normal (how far body still needs to shift):
  const wakeGapMin = loopArrivalWakeMin - baseWakeMin; // positive = body is later than target

  // Estimated post-arrival days to fully sync:
  const fullDaysToSync = wakeGapMin === 0
    ? 0
    : Math.ceil(Math.abs(wakeGapMin) / shiftRateMin);

  // ── 5b. Partial adjustment for short trips ─────────────────────────────────
  const PARTIAL_TRIP_THRESHOLD = 0.7; // trigger when adjustment needs ≥70% of trip days
  const PARTIAL_FRACTION = 0.6;       // only target 60% of the full shift

  let isPartialAdjustment = false;
  let targetAdjustHours: number | undefined;
  let estimatedDaysToSync = fullDaysToSync;
  let wakeClampMin = baseWakeMin;
  let bedClampMin  = baseBedMin;

  if (tripDays !== null && fullDaysToSync >= tripDays * PARTIAL_TRIP_THRESHOLD && fullDaysToSync > 0) {
    isPartialAdjustment = true;
    const partialWakeGapMin = PARTIAL_FRACTION * wakeGapMin;
    wakeClampMin = baseWakeMin + (1 - PARTIAL_FRACTION) * wakeGapMin;
    bedClampMin  = baseBedMin  + (1 - PARTIAL_FRACTION) * (arrivalBodyBedMin - baseBedMin);
    estimatedDaysToSync = Math.ceil(Math.abs(partialWakeGapMin) / shiftRateMin);
    targetAdjustHours = Math.round(Math.abs(partialWakeGapMin) / 60 * 2) / 2;
  }

  // (flex clamps already defined above in section 5)

  // ── 6. Build schedule ──────────────────────────────────────────────────────
  const schedule: DaySchedule[] = [];

  // Pre-departure days (shifting at home)
  for (let i = actualPreDays; i >= 1; i--) {
    const daysShifted = actualPreDays - i + 1; // 1 on first day, actualPreDays on last
    const shiftMag = Math.min(preDeptShiftMag(daysShifted), MAX_PRE_SHIFT_MIN);
    const wakeMin = baseWakeMin + shiftSign * shiftMag;
    const bedMin  = baseBedMin  + shiftSign * shiftMag;
    const date    = departureDayjs.subtract(i, 'day').format('YYYY-MM-DD');
    const label   = actualPreDays === 1 ? 'Pre-departure Day' : `Pre-departure Day ${daysShifted}`;

    schedule.push(buildDaySchedule({
      date, dayLabel: label, phase: 'pre_departure',
      wakeMin, bedMin, direction, hasMelatonin, drinksCoffee,
      supplements: supplements ?? {}, timezone: homeCity.timezone,
    }));
  }

  // Travel day
  const travelLegs = computeLegs(homeCity, destCity, input.departureTime, layovers, input.arrivalTime, departureDate);
  schedule.push(buildDaySchedule({
    date: departureDate, dayLabel: 'Travel Day', phase: 'travel_day',
    wakeMin: baseWakeMin + Math.min(preDeptShiftMag(actualPreDays), MAX_PRE_SHIFT_MIN) * shiftSign,
    bedMin:  baseBedMin  + Math.min(preDeptShiftMag(actualPreDays), MAX_PRE_SHIFT_MIN) * shiftSign,
    direction, hasMelatonin, drinksCoffee,
    supplements: supplements ?? {}, timezone: destCity.timezone, legs: travelLegs,
  }));

  // Post-arrival days — progressive convergence from arrival body-clock toward destination-normal
  for (let postDay = 1; postDay <= estimatedDaysToSync; postDay++) {
    const date = departureDayjs.add(postDay, 'day').format('YYYY-MM-DD');
    const label = postDay === 1 ? 'Arrival Day' : `Day ${postDay}`;

    // Shift from the clamped arrival base (progression is visible from Day 1):
    const rawWakeMin = loopArrivalWakeMin + shiftSign * shiftRateMin * postDay;
    const rawBedMin  = loopArrivalBedMin  + shiftSign * shiftRateMin * postDay;

    // Apply flexibility clamp — keeps wake times in a practical range for the destination
    const flexedWakeMin = Math.max(wakeFlexMin, Math.min(wakeFlexMax, rawWakeMin));
    const wakeDelta = flexedWakeMin - rawWakeMin;
    let wakeMin = flexedWakeMin;
    let bedMin  = rawBedMin + wakeDelta;

    // Clamp: don't overshoot past sync target (full or partial)
    if (direction === 'east') {
      wakeMin = Math.max(wakeClampMin, wakeMin);
      bedMin  = Math.max(bedClampMin,  bedMin);
      bedMin  = Math.min(bedFlexMax,   bedMin); // flex bed cap applied last — e.g. no later than 1 AM for balanced
    } else {
      wakeMin = Math.min(wakeClampMin, wakeMin);
      bedMin  = Math.min(bedClampMin,  bedMin);
      bedMin  = Math.max(bedFlexMin,   bedMin); // flex bed floor applied last — e.g. no earlier than 9 PM for balanced
    }

    schedule.push(buildDaySchedule({
      date, dayLabel: label, phase: 'post_arrival',
      wakeMin, bedMin, direction, hasMelatonin, drinksCoffee,
      supplements: supplements ?? {}, timezone: destCity.timezone,
    }));
  }

  return {
    id: generateId(), input, hourDiff, direction,
    ...(geographicHourDiff !== hourDiff ? { rawHourDiff: geographicHourDiff } : {}),
    ...(scheduleNote ? { scheduleNote } : {}),
    ...(isPartialAdjustment ? { isPartialAdjustment: true, targetAdjustHours } : {}),
    isShortTripMode: false, estimatedDaysToSync, schedule,
    createdAt: new Date().toISOString(),
  };
}

// ── Day builder ───────────────────────────────────────────────────────────────

interface DayParams {
  date: string;
  dayLabel: string;
  phase: TripPhase;
  wakeMin: number;       // pre-computed by caller
  bedMin: number;        // pre-computed by caller
  direction: 'east' | 'west' | 'none';
  hasMelatonin: boolean;
  drinksCoffee: boolean;
  supplements: Partial<Supplements>;
  timezone: string;
  legs?: TravelLeg[];
}

function buildDaySchedule(p: DayParams): DaySchedule {
  const wakeMin = p.wakeMin;
  const bedMin  = p.bedMin;

  const wakeTime = fromMinutes(wakeMin);
  const bedTime  = fromMinutes(bedMin);

  let lightSeekStart: string;
  let lightSeekEnd: string;
  let lightAvoidStart: string;
  let lightAvoidEnd: string;

  if (p.direction === 'east') {
    lightSeekStart  = wakeTime;
    lightSeekEnd    = fromMinutes(wakeMin + 120);
    lightAvoidStart = fromMinutes(bedMin - 180);
    lightAvoidEnd   = bedTime;
  } else {
    lightSeekStart  = fromMinutes(bedMin - 120);
    lightSeekEnd    = bedTime;
    lightAvoidStart = wakeTime;
    lightAvoidEnd   = fromMinutes(wakeMin + 120);
  }

  let melatoninTime: string | null = null;
  if (p.hasMelatonin) {
    melatoninTime = p.direction === 'east'
      ? fromMinutes(bedMin - 300)
      : fromMinutes(bedMin - 30);
  }

  const caffeineCutoff: string | null = p.drinksCoffee
    ? fromMinutes(bedMin - 480)
    : null;

  const suppTimings: SupplementTiming[] = [];
  const s = p.supplements;
  if (s.magnesium) suppTimings.push({ name: 'Magnesium glycinate', suggestedTime: fromMinutes(bedMin - 45), relativeText: '30–60 min before bedtime', emoji: '', description: 'Supports muscle relaxation and sleep quality. Especially helpful in the first few nights when your body resists the new schedule.' });
  if (s.ltheanine) suppTimings.push({ name: 'L-theanine', suggestedTime: fromMinutes(wakeMin + 60), relativeText: 'Morning or early afternoon', emoji: '', description: 'Promotes calm focus without drowsiness, reducing the wired-but-tired feeling of jet lag. Pairs well with your morning coffee.' });
  if (s.vitaminD)  suppTimings.push({ name: 'Vitamin D', suggestedTime: fromMinutes(wakeMin + 30), relativeText: 'Within 1 hour of waking', emoji: '', description: 'Jet lag disrupts natural light-based vitamin D production. Morning dosing helps anchor your circadian rhythm.' });
  if (s.tartCherry) suppTimings.push({ name: 'Tart cherry extract', suggestedTime: fromMinutes(bedMin - 75), relativeText: '60–90 min before bedtime', emoji: '', description: 'Natural melatonin source plus anti-inflammatory compounds. A good alternative to synthetic melatonin.' });
  if (s.ashwagandha) suppTimings.push({ name: 'Ashwagandha', suggestedTime: fromMinutes(bedMin - 90), relativeText: '1–2 hours before bedtime', emoji: '', description: "Adaptogen that helps regulate cortisol — the stress hormone jet lag disrupts. Helps with the \"exhausted but can't sleep\" feeling." });

  return {
    date: p.date, dayLabel: p.dayLabel, phase: p.phase,
    wakeTime, bedTime,
    lightSeekStart, lightSeekEnd, lightAvoidStart, lightAvoidEnd,
    melatoninTime, caffeineCutoff, supplements: suppTimings,
    timezone: p.timezone,
    ...(p.legs !== undefined ? { legs: p.legs } : {}),
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
