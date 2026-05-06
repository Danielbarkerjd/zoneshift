import type { TripPlan, TripTips, ChatMessage, DestFact } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';
const MODEL = 'claude-haiku-4-5-20251001';
const BASE_URL = 'https://api.anthropic.com/v1/messages';

if (__DEV__) {
  console.log('[ZoneShift API] key present:', API_KEY.length > 0, '| prefix:', API_KEY.slice(0, 10));
}

function headers() {
  return {
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
}

function enabledSupplementNames(plan: TripPlan): string[] {
  const s = plan.input.sleepProfile.supplements ?? {};
  const map: Record<string, string> = {
    magnesium: 'Magnesium glycinate',
    ltheanine: 'L-theanine',
    vitaminD: 'Vitamin D',
    tartCherry: 'Tart cherry extract',
    ashwagandha: 'Ashwagandha',
  };
  return Object.entries(s)
    .filter(([, v]) => v)
    .map(([k]) => map[k] ?? k);
}

// use24h overrides the stored profile preference — pass the CURRENT preference from the UI
export async function fetchTripTips(plan: TripPlan, use24h?: boolean): Promise<TripTips> {
  const { input, schedule, hourDiff, direction, rawHourDiff, isPartialAdjustment, targetAdjustHours } = plan;
  const tripDays = schedule.length;
  const supp = enabledSupplementNames(plan);
  const { usualWakeTime, usualBedTime } = input.sleepProfile;
  const resolvedUse24h = use24h !== undefined ? use24h : input.sleepProfile.use24HourFormat;

  function fmtT(hhmm: string): string {
    if (!hhmm) return '—';
    if (resolvedUse24h) return hhmm;
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  // Compute actual arrival date from schedule legs
  const travelDaySched = schedule.find(d => d.phase === 'travel_day');
  const lastFlight = travelDaySched?.legs
    ? [...travelDaySched.legs].reverse().find(l => l.type === 'flight')
    : undefined;
  const arrDateOffset = (lastFlight?.type === 'flight' ? lastFlight.arrivalDateOffset : undefined) ?? 0;
  const arrDateObj = new Date(input.departureDate + 'T12:00:00');
  arrDateObj.setDate(arrDateObj.getDate() + arrDateOffset);
  const arrDateStr = input.arrivalDate ?? arrDateObj.toISOString().split('T')[0];

  // Build human-readable itinerary
  const layoverLines = (input.layovers ?? []).map((l, i) =>
    `  Layover ${i + 1}: ${l.city.name} — arrive ${fmtT(l.arrivalTime)}${l.arrivalDate ? ` (${l.arrivalDate})` : ''}, depart ${fmtT(l.departureTime)}${l.departureDate ? ` (${l.departureDate})` : ''}`
  ).join('\n');
  const itinerary = [
    `Departs ${input.homeCity.name} at ${fmtT(input.departureTime)} on ${input.departureDate}`,
    ...(layoverLines ? [layoverLines] : []),
    `Arrives ${input.destCity.name} at ${fmtT(input.arrivalTime ?? '—')} on ${arrDateStr}`,
  ].join('\n');

  const timeFormatNote = resolvedUse24h
    ? 'Use 24-hour format (e.g., "14:30") for all times in your tips.'
    : 'Use 12-hour format with AM/PM (e.g., "2:30 PM") for all times in your tips.';

  const flexLabel = input.scheduleFlexibility === 'strict'
    ? 'strict (wake window 6–8 AM)'
    : input.scheduleFlexibility === 'flexible'
    ? 'flexible (wake window 4 AM–noon)'
    : 'balanced (wake window 5–10 AM)';

  // Direction semantics to prevent Claude from giving contradictory advice
  const directionGuide = direction === 'east'
    ? `EASTWARD = ADVANCING the clock. Goal: wake EARLIER, bed EARLIER each day. Morning bright light (advances clock), evening light avoidance, EARLY melatonin (~5h before target bedtime). The traveler's usual wake is ${fmtT(usualWakeTime)} and usual bedtime is ${fmtT(usualBedTime)} at home.`
    : direction === 'west'
    ? `WESTWARD = DELAYING the clock. Goal: wake LATER, bed LATER each day. Evening bright light (delays clock), morning light avoidance, LATE melatonin (30 min before target bedtime). The traveler's usual wake is ${fmtT(usualWakeTime)} and usual bedtime is ${fmtT(usualBedTime)} at home.`
    : 'No significant direction shift needed.';

  const flipNote = rawHourDiff !== undefined
    ? `\nIMPORTANT: The geographic difference is ${Math.abs(rawHourDiff)} hours ${rawHourDiff > 0 ? 'east' : 'west'}ward, but the body adjusts faster using the shorter ${Math.abs(hourDiff)}-hour ${direction}ward path. Use ONLY ${direction}ward advice as described above.`
    : '';

  const partialNote = isPartialAdjustment && targetAdjustHours
    ? `\nThis is a SHORT TRIP mode: the plan only targets a partial ~${targetAdjustHours}h adjustment (not a full adjustment) to avoid over-adjusting for a brief stay.`
    : '';

  // Build per-day light-seek label (sunlight vs bright artificial)
  function seekLabel(seekStart: string): string {
    const h = parseInt(seekStart.split(':')[0], 10);
    return h >= 6 && h < 19 ? 'Seek sunlight' : 'Use bright light (lamp or light therapy box)';
  }

  // Find the arrival day (first post_arrival) to provide landing-time context
  const arrivalDayDate = schedule.find(d => d.phase === 'post_arrival')?.date ?? arrDateStr;

  const prompt = `You are a jet lag and sleep science expert who explains complex concepts in plain, practical language — like a knowledgeable friend, not a textbook.

TRIP DIRECTION: The traveler is flying FROM ${input.homeCity.name} TO ${input.destCity.name}.
- Pre-departure days: the traveler is AT HOME in ${input.homeCity.name}, preparing to travel.
- Travel day: the traveler is in transit.
- Post-arrival days: the traveler has ARRIVED in ${input.destCity.name} and is there for their stay. They are NOT leaving ${input.destCity.name} — they are settling in. Do NOT say things like "ready to leave ${input.destCity.name}" on post-arrival days.

Time zone shift: ${Math.abs(hourDiff)} hours ${direction}ward.
Direction guide: ${directionGuide}${flipNote}${partialNote}
Trip duration: ${tripDays} days.
Their chronotype: ${input.sleepProfile.chronotype}.
Their supplements: ${supp.length > 0 ? supp.join(', ') : 'none'}.
Schedule flexibility: ${flexLabel}.

Actual flight itinerary (reference these exact times — do not guess or estimate):
${itinerary}

ARRIVAL DAY CONTEXT (date: ${arrivalDayDate}): The traveler lands at ${fmtT(input.arrivalTime ?? '—')} ${input.destCity.name} time. Any light/supplement windows shown before the landing time are irrelevant — the traveler is still on the plane. Tips for the Arrival Day must reference what to do FROM ${fmtT(input.arrivalTime ?? '—')} onward, not from midnight. If the avoid-light window is entirely before the landing time, note that the avoid window is moot and focus the tip on what to do after landing.

${timeFormatNote}

Here is their computed day-by-day schedule (all times local to the timezone in effect that day):
${JSON.stringify(schedule.map(d => ({
  date: d.date, label: d.dayLabel, phase: d.phase,
  wakeTime: fmtT(d.wakeTime), bedTime: fmtT(d.bedTime),
  lightSeek: `${seekLabel(d.lightSeekStart)} ${fmtT(d.lightSeekStart)}–${fmtT(d.lightSeekEnd)}`,
  lightAvoid: `Avoid bright light ${fmtT(d.lightAvoidStart)}–${fmtT(d.lightAvoidEnd)}`,
  melatoninTime: d.melatoninTime ? fmtT(d.melatoninTime) : null,
  caffeineCutoff: d.caffeineCutoff ? fmtT(d.caffeineCutoff) : null,
})))}

For each day in the schedule, write one short practical tip (2-3 sentences max) explaining WHY that day's recommendations make sense in plain language. Reference specific times from the schedule. Focus on what the traveler should DO and WHY it helps — no jargon.

Also write a 2-sentence overall strategy summary for this trip.

Return ONLY valid JSON:
{
  "summary": "string",
  "day_tips": [
    { "date": "YYYY-MM-DD", "tip": "string" }
  ]
}`;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (__DEV__) console.log('[ZoneShift API] fetchTripTips error', res.status, body);
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '{}';

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    tripId: plan.id,
    summary: parsed.summary ?? '',
    dayTips: parsed.day_tips ?? [],
    fetchedAt: new Date().toISOString(),
  };
}

export async function askClaude(
  messages: ChatMessage[],
  planContext: string,
  profileContext: string,
  use24h = false,
): Promise<string> {
  const formatNote = use24h
    ? 'IMPORTANT: Always use 24-hour format (e.g., "14:30") when referencing any times. Never mix formats.'
    : 'IMPORTANT: Always use 12-hour format with AM/PM (e.g., "2:30 PM") when referencing any times. Never mix formats.';

  const system = `You are a jet lag and sleep science expert. The user has this recovery plan:

${planContext}

Their sleep profile: ${profileContext}

${formatNote}

Answer their questions about their plan. Reference specific times when relevant. Keep answers concise (2-4 sentences). Be practical and friendly.`;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (__DEV__) console.log('[ZoneShift API] askZoneShift error', res.status, body);
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  return json.content?.[0]?.text ?? 'No response received.';
}

function sortFactsByPriority(facts: DestFact[], daysUntilDep: number): DestFact[] {
  const culture = facts.filter(f => f.category === 'culture');
  const food = facts.filter(f => f.category === 'food');
  const practical = facts.filter(f => f.category === 'practical');
  const surprise = facts.filter(f => f.category === 'surprise');

  if (daysUntilDep < 7) {
    return [...practical, ...culture, ...food, ...surprise];
  }
  if (daysUntilDep < 30) {
    return [...culture, ...food, ...practical, ...surprise];
  }
  // 30+ days: interleave all categories
  const pools = [culture, food, surprise, practical];
  const result: DestFact[] = [];
  let i = 0;
  while (result.length < facts.length) {
    for (const pool of pools) {
      if (i < pool.length) result.push(pool[i]);
    }
    i++;
  }
  return result;
}

export async function fetchDestFacts(plan: TripPlan): Promise<DestFact[]> {
  const destCity = plan.input.destCity.name;
  const travelDay = plan.schedule.find(d => d.phase === 'travel_day');
  const daysUntilDep = travelDay
    ? Math.max(0, Math.round((new Date(travelDay.date + 'T00:00:00').getTime() - Date.now()) / 86400000))
    : 30;

  const prompt = `Generate 15 fun facts about ${destCity} for a first-time visitor. Mix: 5 culture/history facts, 4 food/dining facts, 3 practical travel tips, 3 surprising statistics. Keep each to 1-2 sentences max. Make them genuinely interesting, not generic. Return ONLY valid JSON: { "facts": [{ "text": "string", "category": "culture" | "food" | "practical" | "surprise" }] }`;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (__DEV__) console.log('[ZoneShift API] fetchDestFacts error', res.status, body);
    throw new Error(`API error: ${res.status}`);
  }

  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '{}';
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  const facts: DestFact[] = (parsed.facts ?? []).filter(
    (f: unknown): f is DestFact =>
      typeof (f as any)?.text === 'string' &&
      ['culture', 'food', 'practical', 'surprise'].includes((f as any)?.category),
  );
  return sortFactsByPriority(facts, daysUntilDep);
}
