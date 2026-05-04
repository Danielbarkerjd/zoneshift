// Rounds to nearest 0.5h then formats as "11h 30m" or "6h"
export function formatHourDiff(diff: number): string {
  const rounded = Math.round(Math.abs(diff) * 2) / 2;
  const h = Math.floor(rounded);
  const m = Math.round((rounded - h) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
