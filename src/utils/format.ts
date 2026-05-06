export function formatHourDiff(diff: number): string {
  const rounded = Math.round(Math.abs(diff) * 4) / 4;
  const h = Math.floor(rounded);
  const m = Math.round((rounded - h) * 60);
  return m === 0 ? `${h} hrs` : `${h} hrs ${m} min`;
}

export function formatHourDiffCompact(diff: number): string {
  const abs = Math.round(Math.abs(diff) * 4) / 4;
  const h = Math.floor(abs);
  const frac = abs - h;
  if (frac === 0) return `${h} Hr`;
  if (frac === 0.5) return `${h}.5 Hr`;
  if (frac === 0.25) return `${h}.25 Hr`;
  return `${h}.75 Hr`;
}

// Fallback abbreviations for timezones that Hermes/React Native may render as "GMT+X:XX".
// Entry: { std: standard abbr, dst: DST abbr (if applicable), stdOffsetMin: standard UTC offset in minutes }
const TZ_ABBR_FALLBACK: Record<string, { std: string; dst?: string; stdOffsetMin: number }> = {
  // ── South Asia ──
  'Asia/Kolkata':         { std: 'IST',  stdOffsetMin: 330 },
  'Asia/Calcutta':        { std: 'IST',  stdOffsetMin: 330 },
  'Asia/Colombo':         { std: 'IST',  stdOffsetMin: 330 },
  'Asia/Kathmandu':       { std: 'NPT',  stdOffsetMin: 345 },
  'Asia/Kabul':           { std: 'AFT',  stdOffsetMin: 270 },
  'Asia/Karachi':         { std: 'PKT',  stdOffsetMin: 300 },
  'Asia/Dhaka':           { std: 'BST',  stdOffsetMin: 360 },
  // ── East/Southeast Asia ──
  'Asia/Tokyo':           { std: 'JST',  stdOffsetMin: 540 },
  'Asia/Seoul':           { std: 'KST',  stdOffsetMin: 540 },
  'Asia/Shanghai':        { std: 'CST',  stdOffsetMin: 480 },
  'Asia/Beijing':         { std: 'CST',  stdOffsetMin: 480 },
  'Asia/Hong_Kong':       { std: 'HKT',  stdOffsetMin: 480 },
  'Asia/Singapore':       { std: 'SGT',  stdOffsetMin: 480 },
  'Asia/Kuala_Lumpur':    { std: 'MYT',  stdOffsetMin: 480 },
  'Asia/Manila':          { std: 'PHT',  stdOffsetMin: 480 },
  'Asia/Taipei':          { std: 'CST',  stdOffsetMin: 480 },
  'Asia/Bangkok':         { std: 'ICT',  stdOffsetMin: 420 },
  'Asia/Ho_Chi_Minh':     { std: 'ICT',  stdOffsetMin: 420 },
  'Asia/Jakarta':         { std: 'WIB',  stdOffsetMin: 420 },
  'Asia/Yangon':          { std: 'MMT',  stdOffsetMin: 390 },
  // ── Middle East / Central Asia ──
  'Asia/Dubai':           { std: 'GST',  stdOffsetMin: 240 },
  'Asia/Muscat':          { std: 'GST',  stdOffsetMin: 240 },
  'Asia/Tehran':          { std: 'IRST', dst: 'IRDT', stdOffsetMin: 210 },
  'Asia/Riyadh':          { std: 'AST',  stdOffsetMin: 180 },
  'Asia/Kuwait':          { std: 'AST',  stdOffsetMin: 180 },
  'Asia/Baghdad':         { std: 'AST',  stdOffsetMin: 180 },
  'Asia/Beirut':          { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Asia/Tashkent':        { std: 'UZT',  stdOffsetMin: 300 },
  'Asia/Almaty':          { std: 'ALMT', stdOffsetMin: 360 },
  // ── Oceania ──
  'Australia/Sydney':     { std: 'AEST', dst: 'AEDT', stdOffsetMin: 600 },
  'Australia/Melbourne':  { std: 'AEST', dst: 'AEDT', stdOffsetMin: 600 },
  'Australia/Brisbane':   { std: 'AEST', stdOffsetMin: 600 },
  'Australia/Adelaide':   { std: 'ACST', dst: 'ACDT', stdOffsetMin: 570 },
  'Australia/Darwin':     { std: 'ACST', stdOffsetMin: 570 },
  'Australia/Perth':      { std: 'AWST', stdOffsetMin: 480 },
  'Pacific/Auckland':     { std: 'NZST', dst: 'NZDT', stdOffsetMin: 720 },
  'Pacific/Fiji':         { std: 'FJT',  dst: 'FJST', stdOffsetMin: 720 },
  // ── Africa ──
  'Africa/Cairo':         { std: 'EET',  stdOffsetMin: 120 },
  'Africa/Johannesburg':  { std: 'SAST', stdOffsetMin: 120 },
  'Africa/Nairobi':       { std: 'EAT',  stdOffsetMin: 180 },
  'Africa/Lagos':         { std: 'WAT',  stdOffsetMin: 60 },
  'Africa/Accra':         { std: 'GMT',  stdOffsetMin: 0 },
  'Africa/Casablanca':    { std: 'WET',  dst: 'WEST', stdOffsetMin: 0 },
  // ── Europe ──
  'Europe/Moscow':        { std: 'MSK',  stdOffsetMin: 180 },
  'Europe/Istanbul':      { std: 'TRT',  stdOffsetMin: 180 },
  'Europe/Athens':        { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Europe/Helsinki':      { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Europe/Bucharest':     { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Europe/Sofia':         { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Europe/Kiev':          { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Europe/Kyiv':          { std: 'EET',  dst: 'EEST', stdOffsetMin: 120 },
  'Europe/Warsaw':        { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Paris':         { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Berlin':        { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Zurich':        { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Vienna':        { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Rome':          { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Madrid':        { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Amsterdam':     { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Brussels':      { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Stockholm':     { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Oslo':          { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Copenhagen':    { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Prague':        { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Budapest':      { std: 'CET',  dst: 'CEST', stdOffsetMin: 60 },
  'Europe/Lisbon':        { std: 'WET',  dst: 'WEST', stdOffsetMin: 0 },
  'Europe/Dublin':        { std: 'GMT',  dst: 'IST',  stdOffsetMin: 0 },
  // ── Americas ──
  'America/Toronto':      { std: 'EST',  dst: 'EDT',  stdOffsetMin: -300 },
  'America/Vancouver':    { std: 'PST',  dst: 'PDT',  stdOffsetMin: -480 },
  'America/Edmonton':     { std: 'MST',  dst: 'MDT',  stdOffsetMin: -420 },
  'America/Winnipeg':     { std: 'CST',  dst: 'CDT',  stdOffsetMin: -360 },
  'America/Halifax':      { std: 'AST',  dst: 'ADT',  stdOffsetMin: -240 },
  'America/St_Johns':     { std: 'NST',  dst: 'NDT',  stdOffsetMin: -210 },
  'America/Mexico_City':  { std: 'CST',  dst: 'CDT',  stdOffsetMin: -360 },
  'America/Sao_Paulo':    { std: 'BRT',  dst: 'BRST', stdOffsetMin: -180 },
  'America/Buenos_Aires': { std: 'ART',  stdOffsetMin: -180 },
  'America/Bogota':       { std: 'COT',  stdOffsetMin: -300 },
  'America/Lima':         { std: 'PET',  stdOffsetMin: -300 },
  'America/Santiago':     { std: 'CLT',  dst: 'CLST', stdOffsetMin: -240 },
  'America/Caracas':      { std: 'VET',  stdOffsetMin: -270 },
};

function getActualOffsetMin(ianaTimezone: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? '0');
    let localH = get('hour');
    if (localH === 24) localH = 0;
    const localMin = localH * 60 + get('minute');
    const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();
    let offset = localMin - utcMin;
    if (offset > 720) offset -= 1440;
    if (offset < -720) offset += 1440;
    return offset;
  } catch {
    return 0;
  }
}

function fallbackTzAbbr(ianaTimezone: string, date: Date): string {
  const entry = TZ_ABBR_FALLBACK[ianaTimezone];
  if (!entry) return '';
  if (!entry.dst) return entry.std;
  const actualOffset = getActualOffsetMin(ianaTimezone, date);
  return actualOffset !== entry.stdOffsetMin ? entry.dst : entry.std;
}

export function tzAbbr(ianaTimezone: string, dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      timeZoneName: 'short',
    }).formatToParts(d);
    const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? '';

    // Hermes on some Android builds returns 'GMT+X:XX' for non-US timezones.
    // Also handle bare 'GMT' for timezones that aren't actually UTC/London.
    const looksLikeGmtOffset = /^GMT[+-]/.test(raw) || /^UTC[+-]/.test(raw);
    const unexpectedGmt = raw === 'GMT' && !/^(Europe\/London|Europe\/Dublin|Africa\/Accra|Atlantic\/Reykjavik|UTC|GMT)/.test(ianaTimezone);
    if (looksLikeGmtOffset || unexpectedGmt) {
      return fallbackTzAbbr(ianaTimezone, d) || raw;
    }
    return raw;
  } catch {
    return '';
  }
}

export function cityLabel(city: { name: string; iata?: string }): string {
  return city.iata ? `${city.name} (${city.iata})` : city.name;
}

// Returns "Seek sunlight" when the window starts in daylight hours (6 AM–7 PM),
// otherwise "Use bright light" (implying a lamp or light therapy box).
export function lightSeekLabel(seekStart: string): 'Seek sunlight' | 'Use bright light' {
  const [h] = seekStart.split(':').map(Number);
  return h >= 6 && h < 19 ? 'Seek sunlight' : 'Use bright light';
}

export function fmtTime(hhmm: string, use24h: boolean): string {
  if (use24h) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}
