import { AIRPORT_COORDS } from '../data/cityCoords';
import type { City } from '../types';

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getUTCOffsetMinutes(ianaTimezone: string, dateStr: string): number {
  try {
    const base = new Date(`${dateStr}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ianaTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(base);
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? '0');
    const localH = get('hour') + get('minute') / 60;
    const utcH = 12;
    return (localH - utcH) * 60;
  } catch {
    return 0;
  }
}

export interface ArrivalEstimate {
  arrDate: string; // 'YYYY-MM-DD'
  arrTime: string; // 'HH:MM'
  flightMinutes: number;
}

export function estimateArrival(
  fromCity: City,
  toCity: City,
  depDate: string,
  depTime: string,
): ArrivalEstimate | null {
  const fromCoords = fromCity.iata ? AIRPORT_COORDS[fromCity.iata] : null;
  const toCoords = toCity.iata ? AIRPORT_COORDS[toCity.iata] : null;

  if (!fromCoords || !toCoords) return null;

  const distMiles = haversineMiles(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
  const flightMinutes = Math.round((distMiles / 550) * 60 + 40);

  // Convert departure local time → UTC
  const fromOffsetMin = getUTCOffsetMinutes(fromCity.timezone, depDate);
  const [depH, depM] = depTime.split(':').map(Number);
  const depLocalMin = depH * 60 + depM;
  const depUTCMin = depLocalMin - fromOffsetMin;

  // Add flight time in UTC
  const arrUTCMin = depUTCMin + flightMinutes;

  // Convert arrival UTC → destination local time
  const toOffsetMin = getUTCOffsetMinutes(toCity.timezone, depDate);
  const arrLocalMin = arrUTCMin + toOffsetMin;

  const dayOffset = Math.floor(arrLocalMin / (24 * 60));

  const arrLocalMinNorm = ((arrLocalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const arrH = Math.floor(arrLocalMinNorm / 60);
  const arrM = arrLocalMinNorm % 60;

  const depDateObj = new Date(`${depDate}T12:00:00Z`);
  depDateObj.setUTCDate(depDateObj.getUTCDate() + dayOffset);
  const arrDate = depDateObj.toISOString().split('T')[0];

  return {
    arrDate,
    arrTime: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
    flightMinutes,
  };
}
