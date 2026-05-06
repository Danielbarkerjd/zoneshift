import type { TripPlan, DaySchedule, TripTips } from '../types';
import { tzAbbr, lightSeekLabel } from './format';

function fmtT(hhmm: string, use24h: boolean): string {
  if (!hhmm) return '—';
  if (use24h) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function cityL(city: { name: string; iata?: string }): string {
  return city.iata ? `${city.name} (${city.iata})` : city.name;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function flexLabel(f: string | undefined): string {
  if (f === 'strict') return 'Strict';
  if (f === 'flexible') return 'Flexible';
  return 'Balanced';
}

function otherCityTime(hhmm: string, phase: string, hourDiffMin: number, use24h: boolean): string {
  const [h, m] = hhmm.split(':').map(Number);
  const base = h * 60 + m;
  const offset = phase === 'post_arrival' ? -hourDiffMin : hourDiffMin;
  const norm = ((base + offset) % 1440 + 1440) % 1440;
  const oh = Math.floor(norm / 60);
  const om = norm % 60;
  return fmtT(`${String(oh).padStart(2, '0')}:${String(om).padStart(2, '0')}`, use24h);
}

function buildDayCard(
  day: DaySchedule,
  use24h: boolean,
  hourDiff: number,
  otherCityName: string,
  tip?: string,
): string {
  const isPreDep = day.phase === 'pre_departure';
  const isTravel = day.phase === 'travel_day';
  const T = (t: string) => fmtT(t, use24h);
  const hourDiffMin = Math.round(hourDiff * 60);

  const borderColor = isPreDep ? '#E8A838' : isTravel ? '#aaa' : '#1A9E8F';
  const bgColor     = isPreDep ? '#fffbf3' : isTravel ? '#f9f9f9' : '#f8fafb';
  const labelColor  = isPreDep ? '#9a6100' : '#1a1a1a';

  const melaRow = day.melatoninTime
    ? `<div class="ti"><span class="tl">Melatonin</span><span class="tv">${T(day.melatoninTime)}</span></div>`
    : '';
  const cafRow = day.caffeineCutoff
    ? `<div class="ti"><span class="tl">Last caffeine</span><span class="tv" style="color:#C97A00">${T(day.caffeineCutoff)}</span></div>`
    : '';

  const schedRows = isTravel
    ? `<div style="margin-top:8px;font-size:11px;color:#1A9E8F;font-weight:600">Travel day — light/supplement reminders not shown</div>`
    : `<div class="tg" style="margin-top:10px">
        <div class="ti"><span class="tl">${lightSeekLabel(day.lightSeekStart)}</span><span class="tv" style="font-size:12px">${T(day.lightSeekStart)}–${T(day.lightSeekEnd)}</span></div>
        <div class="ti"><span class="tl">Avoid light</span><span class="tv" style="font-size:12px">${T(day.lightAvoidStart)}–${T(day.lightAvoidEnd)}</span></div>
        ${melaRow}
        ${cafRow}
      </div>
      ${day.supplements.length > 0 ? `<div class="supps">${day.supplements.map(s =>
        `<div class="supp-row">• ${esc(s.name)} &nbsp;<span style="color:#1A9E8F">${T(s.suggestedTime)}</span></div>`
      ).join('')}</div>` : ''}`;

  const tipHtml = tip
    ? `<div class="tip">${esc(tip)}</div>`
    : '';

  return `<div class="dc" style="border-left-color:${borderColor};background:${bgColor}">
    <div class="dh">
      <div>
        <div class="dl" style="color:${labelColor}">${esc(day.dayLabel)}</div>
        <div class="dd">${fmtDateShort(day.date)}</div>
      </div>
      <div class="dtz">${esc(tzAbbr(day.timezone, day.date))}</div>
    </div>
    <div class="tg">
      <div class="ti"><span class="tl">Wake</span><span class="tv">${T(day.wakeTime)}</span>${!isTravel ? `<span class="dtz2">${otherCityTime(day.wakeTime, day.phase, hourDiffMin, use24h)} in ${esc(otherCityName)}</span>` : ''}</div>
      <div class="ti"><span class="tl">Bedtime</span><span class="tv">${T(day.bedTime)}</span>${!isTravel ? `<span class="dtz2">${otherCityTime(day.bedTime, day.phase, hourDiffMin, use24h)} in ${esc(otherCityName)}</span>` : ''}</div>
    </div>
    ${schedRows}
    ${tipHtml}
  </div>`;
}

function buildPlanSection(
  plan: TripPlan,
  tips: TripTips | null,
  use24h: boolean,
  heading: string,
  isReturn: boolean,
): string {
  const { input, schedule, hourDiff, direction, estimatedDaysToSync, isPartialAdjustment } = plan;

  const travelSched = schedule.find(d => d.phase === 'travel_day');
  const lastFlight  = travelSched?.legs
    ? [...travelSched.legs].reverse().find(l => l.type === 'flight')
    : undefined;
  const arrOffset = (lastFlight?.type === 'flight' ? lastFlight.arrivalDateOffset : undefined) ?? 0;
  const arrDateObj = new Date(input.departureDate + 'T12:00:00');
  arrDateObj.setDate(arrDateObj.getDate() + arrOffset);
  const arrDate = input.arrivalDate ?? arrDateObj.toISOString().split('T')[0];

  const homeTz = tzAbbr(input.homeCity.timezone, input.departureDate);
  const destTz = tzAbbr(input.destCity.timezone, arrDate);
  const diffAbs = Math.abs(hourDiff);
  const diffDir = direction === 'east' ? 'ahead' : direction === 'west' ? 'behind' : 'same zone';
  const adjStr  = isPartialAdjustment ? `~${estimatedDaysToSync} days (partial)` : `~${estimatedDaysToSync} days`;

  const routeStr = [input.homeCity, ...(input.layovers ?? []).map(l => l.city), input.destCity]
    .map(cityL).join(' → ');

  const layoverRows = (input.layovers ?? []).map(l =>
    `<tr><td class="sl">Layover</td><td class="sv">${esc(cityL(l.city))} &mdash; Arr ${fmtT(l.arrivalTime, use24h)}${l.arrivalDate ? ` (${fmtDateShort(l.arrivalDate)})` : ''}, Dep ${fmtT(l.departureTime, use24h)}${l.departureDate ? ` (${fmtDateShort(l.departureDate)})` : ''}</td></tr>`
  ).join('');

  const strategy = tips?.summary ?? '';
  const strategyHtml = strategy
    ? `<div class="sh">Strategy</div><p class="strat">${esc(strategy)}</p>`
    : '';

  const preDep  = schedule.filter(d => d.phase === 'pre_departure');
  const travel  = schedule.filter(d => d.phase === 'travel_day');
  const postArr = schedule.filter(d => d.phase === 'post_arrival');

  const otherCityForPhase = (phase: string) =>
    phase === 'post_arrival' ? input.homeCity.name : input.destCity.name;

  function phase(days: DaySchedule[], label: string, color: string): string {
    if (days.length === 0) return '';
    return `<div class="ph" style="color:${color}">${label}</div>`
      + days.map(d => buildDayCard(
          d, use24h, hourDiff,
          otherCityForPhase(d.phase),
          tips?.dayTips.find(t => t.date === d.date)?.tip,
        )).join('');
  }

  return `<div class="sh" ${isReturn ? 'style="page-break-before:always;padding-top:8px"' : ''}>${esc(heading)}</div>

<div class="sub">Trip Summary</div>
<table class="st">
  <tr><td class="sl">Route</td><td class="sv">${esc(routeStr)}</td></tr>
  <tr><td class="sl">Departs</td><td class="sv">${fmtT(input.departureTime, use24h)} ${esc(homeTz)} &middot; ${esc(fmtDateShort(input.departureDate))}</td></tr>
  ${layoverRows}
  <tr><td class="sl">Arrives</td><td class="sv">${input.arrivalTime ? fmtT(input.arrivalTime, use24h) + ' ' + esc(destTz) : '—'} &middot; ${esc(fmtDateShort(arrDate))}</td></tr>
  <tr><td class="sl">Time difference</td><td class="sv">${diffAbs}h ${diffDir}</td></tr>
  <tr><td class="sl">Adjustment</td><td class="sv">${adjStr}</td></tr>
  <tr><td class="sl">Schedule mode</td><td class="sv">${flexLabel(input.scheduleFlexibility)}</td></tr>
</table>

${strategyHtml}

<div class="sh">Day-by-Day Schedule</div>
${phase(preDep,  'PRE-DEPARTURE', '#b37a00')}
${phase(travel,  'TRAVEL',        '#888')}
${phase(postArr, 'POST-ARRIVAL',  '#1A9E8F')}`;
}

function buildSleepSection(plan: TripPlan, use24h: boolean): string {
  const { usualWakeTime, usualBedTime, chronotype, hasMelatonin, drinksCoffee, supplements } = plan.input.sleepProfile;

  const SUPP_NAMES: Record<string, string> = {
    magnesium: 'Magnesium glycinate', ltheanine: 'L-theanine',
    vitaminD: 'Vitamin D', tartCherry: 'Tart cherry extract', ashwagandha: 'Ashwagandha',
  };
  const activeSupps = Object.entries(supplements ?? {}).filter(([, v]) => v).map(([k]) => SUPP_NAMES[k] ?? k);
  const chronoLabel = chronotype === 'morning' ? 'Early Bird' : chronotype === 'evening' ? 'Night Owl' : 'Neutral';

  const suppHtml = activeSupps.length > 0
    ? activeSupps.map(s => `<span class="badge">${esc(s)}</span>`).join('')
    : '<span style="color:#aaa;font-size:12px">None</span>';

  return `<div class="sh">Sleep Profile</div>
<div class="pg">
  <div class="pi"><div class="pl">Wake Time</div><div class="pv">${fmtT(usualWakeTime, use24h)}</div></div>
  <div class="pi"><div class="pl">Bedtime</div><div class="pv">${fmtT(usualBedTime, use24h)}</div></div>
  <div class="pi"><div class="pl">Chronotype</div><div class="pv">${chronoLabel}</div></div>
  <div class="pi"><div class="pl">Sleep Aids</div><div class="pv">${[hasMelatonin && 'Melatonin', drinksCoffee && 'Caffeine'].filter(Boolean).join(', ') || 'None'}</div></div>
</div>
<div style="margin-top:14px"><div class="pl">Supplements</div><div style="margin-top:6px">${suppHtml}</div></div>`;
}

export function buildPlanHtml(
  plan: TripPlan,
  tips: TripTips | null,
  returnTips: TripTips | null,
  use24h: boolean,
): string {
  const genDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const outbound = buildPlanSection(plan, tips, use24h, 'Outbound Plan', false);
  const ret      = plan.returnPlan
    ? buildPlanSection(plan.returnPlan, returnTips, use24h, 'Return Plan', true)
    : '';
  const sleep    = buildSleepSection(plan, use24h);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:48px 56px;max-width:800px;margin:0 auto}
.header{border-bottom:3px solid #1A9E8F;padding-bottom:18px;margin-bottom:28px}
.wm{font-size:28px;font-weight:800;color:#1A9E8F;letter-spacing:-0.5px}
.ht{font-size:18px;font-weight:600;color:#1a1a1a;margin-top:4px}
.gd{font-size:11px;color:#aaa;margin-top:3px}
.sh{font-size:11px;color:#1A9E8F;border-bottom:1px solid #e8e8e8;padding-bottom:7px;margin:32px 0 14px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700}
.sub{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin-bottom:8px;margin-top:4px}
.st{width:100%;border-collapse:collapse;margin-bottom:2px}
.sl{font-size:12px;color:#888;font-weight:500;padding:4px 12px 4px 0;width:130px;vertical-align:top}
.sv{font-size:13px;color:#1a1a1a;padding:4px 0}
.strat{font-size:13px;line-height:1.75;color:#333;margin-top:10px}
.ph{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:18px 0 8px 2px}
.dc{border-left:3px solid #1A9E8F;padding:13px 15px;margin-bottom:10px;border-radius:0 5px 5px 0;page-break-inside:avoid}
.dh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px}
.dl{font-size:14px;font-weight:700}
.dd{font-size:11px;color:#888;margin-top:2px}
.dtz{font-size:10px;color:#aaa;text-align:right;max-width:120px}
.dtz2{font-size:10px;color:#888;font-style:italic;margin-top:2px;display:block}
.tg{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px}
.ti{display:flex;flex-direction:column}
.tl{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.6px;font-weight:600;margin-bottom:2px}
.tv{font-size:13px;color:#1A9E8F;font-weight:700}
.supps{margin-top:8px;padding-top:8px;border-top:1px dashed #eee}
.supp-row{font-size:11px;color:#555;padding:2px 0}
.tip{margin-top:9px;padding:9px 11px;background:rgba(26,158,143,.05);border-radius:4px;font-size:12px;color:#444;line-height:1.65;border-left:2px solid #1A9E8F;font-style:italic}
.pg{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.pi{background:#f8fafb;border-radius:5px;padding:10px 13px}
.pl{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.6px;font-weight:600;margin-bottom:3px}
.pv{font-size:13px;color:#1a1a1a;font-weight:600}
.badge{display:inline-block;background:rgba(26,158,143,.1);color:#1A9E8F;border-radius:9px;padding:2px 9px;font-size:11px;margin:2px 2px 2px 0;font-weight:600}
.footer{margin-top:48px;padding-top:14px;border-top:1px solid #e8e8e8;font-size:10px;color:#bbb;text-align:center;line-height:2}
@media print{body{padding:24px 32px}}
</style>
</head>
<body>
<div class="header">
  <div class="wm">ZoneShift</div>
  <div class="ht">Jet Lag Recovery Plan</div>
  <div class="gd">Generated ${esc(genDate)}</div>
</div>

${outbound}
${ret}
${sleep}

<div class="footer">
  Generated by ZoneShift &nbsp;&middot;&nbsp; Eagle Ridge Tech LLC<br>
  Consult your doctor before starting any supplement or making significant changes to your sleep schedule.
</div>
</body>
</html>`;
}
