import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, ChevronRight, Lock, LockOpen, Bell } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  getTripById, getSleepProfile, getTipsForTrip, saveTipsForTrip, saveTrip,
  getNotifIds,
} from '../../src/storage/storage';
import { fmtTime, tzAbbr, cityLabel, formatHourDiffCompact } from '../../src/utils/format';
import { buildPlanHtml } from '../../src/utils/planPdf';
import { requestNotifPermissions, schedulePlanNotifications, cancelPlanNotifications } from '../../src/utils/notifications';
import { DiffPill } from '../../src/components/DiffPill';
import { ItWaypoint, ItConnector } from '../../src/components/ItineraryTimeline';
import { useTier } from '../../src/hooks/useTier';
import { fetchTripTips } from '../../src/api/claudeTips';
import { computeSchedule } from '../../src/engine/ruleEngine';
import { C } from '../../src/theme/colors';
import type { TripPlan, DaySchedule, TripTips, Supplements } from '../../src/types';

const FREE_DAYS_VISIBLE = 2;

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isPaid, isAnnualOrLifetime, refresh: refreshTier } = useTier(id ?? undefined);

  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [use24h, setUse24h] = useState(false);
  const [tips, setTips] = useState<TripTips | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [returnTips, setReturnTips] = useState<TripTips | null>(null);
  const [returnTipsLoading, setReturnTipsLoading] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound');
  const [supplementsChanged, setSupplementsChanged] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const [remindersLoading, setRemindersLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTripById(id).then(setPlan);
    getSleepProfile().then(p => setUse24h(p.use24HourFormat));
    getNotifIds(id).then(ids => setRemindersOn(ids.length > 0));
  }, [id]);

  useEffect(() => {
    if (!plan || !isPaid || plan.isShortTripMode) return;
    getTipsForTrip(plan.id).then(async cached => {
      if (cached) { setTips(cached); return; }
      setTipsLoading(true);
      try {
        const fetched = await fetchTripTips(plan, use24h);
        await saveTipsForTrip(fetched);
        setTips(fetched);
      } catch {} finally { setTipsLoading(false); }
    });
  }, [plan?.id, isPaid]);

  useEffect(() => {
    if (!plan?.returnPlan || !isPaid || plan.returnPlan.isShortTripMode) return;
    getTipsForTrip(plan.returnPlan.id).then(async cached => {
      if (cached) { setReturnTips(cached); return; }
      setReturnTipsLoading(true);
      try {
        const fetched = await fetchTripTips(plan.returnPlan!, use24h);
        await saveTipsForTrip(fetched);
        setReturnTips(fetched);
      } catch {} finally { setReturnTipsLoading(false); }
    });
  }, [plan?.returnPlan?.id, isPaid]);

  useFocusEffect(useCallback(() => {
    // Re-check tier when returning from paywall
    refreshTier();
    if (!plan) return;
    getSleepProfile().then(current => {
      const planS = plan.input.sleepProfile.supplements ?? {};
      const currS = current.supplements ?? {};
      const keys = Object.keys({ ...planS, ...currS }) as (keyof Supplements)[];
      setSupplementsChanged(keys.some(k => planS[k] !== currS[k]));
    });
  }, [plan?.id, refreshTier]));

  function handleUpgrade() {
    router.push(`/paywall?tripId=${plan?.id ?? ''}`);
  }

  async function handleRegenerate() {
    if (!plan || regenerating) return;
    setRegenerating(true);
    try {
      const sleepProfile = await getSleepProfile();
      const newOutbound = computeSchedule({ ...plan.input, sleepProfile });
      let finalPlan: TripPlan = {
        ...newOutbound,
        id: plan.id,
        createdAt: plan.createdAt,
        originalDepartureDate: plan.originalDepartureDate,
        originalReturnDate: plan.originalReturnDate,
      };
      if (plan.returnPlan) {
        const outboundLastDate = newOutbound.schedule.length > 0
          ? newOutbound.schedule[newOutbound.schedule.length - 1].date
          : undefined;
        const newReturn = computeSchedule({ ...plan.returnPlan.input, sleepProfile, minPreDepartureDate: outboundLastDate });
        finalPlan = {
          ...finalPlan,
          returnPlan: { ...newReturn, id: plan.returnPlan.id, createdAt: plan.returnPlan.createdAt },
        };
      }
      await saveTrip(finalPlan);
      setPlan(finalPlan);
      setSupplementsChanged(false);
      setTips(null);
      setReturnTips(null);
      if (isPaid && !finalPlan.isShortTripMode) {
        fetchTripTips(finalPlan, use24h).then(async t => { await saveTipsForTrip(t); setTips(t); }).catch(() => {});
        if (finalPlan.returnPlan && !finalPlan.returnPlan.isShortTripMode) {
          fetchTripTips(finalPlan.returnPlan, use24h).then(async t => { await saveTipsForTrip(t); setReturnTips(t); }).catch(() => {});
        }
      }
      if (isPaid && remindersOn) {
        await cancelPlanNotifications(plan.id);
        await schedulePlanNotifications(finalPlan);
      }
      Alert.alert('Plan updated', 'Your recovery plan has been regenerated with your current sleep settings.');
    } catch {
      Alert.alert('Error', 'Failed to regenerate. Please try again.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleExportPDF() {
    if (!plan || exporting) return;
    setExporting(true);
    try {
      const html = buildPlanHtml(plan, tips, returnTips, use24h);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch {
      Alert.alert('Export failed', 'Could not generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleToggleReminders(value: boolean) {
    if (!plan || remindersLoading) return;
    if (value) {
      setRemindersLoading(true);
      try {
        const granted = await requestNotifPermissions();
        if (!granted) {
          Alert.alert('Permission required', 'Enable notifications in your device settings to use reminders.');
          return;
        }
        await schedulePlanNotifications(plan);
        setRemindersOn(true);
      } catch {
        Alert.alert('Error', 'Could not schedule reminders. Please try again.');
      } finally {
        setRemindersLoading(false);
      }
    } else {
      setRemindersLoading(true);
      try {
        await cancelPlanNotifications(plan.id);
        setRemindersOn(false);
      } finally {
        setRemindersLoading(false);
      }
    }
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const displayPlan = activeTab === 'return' && plan.returnPlan ? plan.returnPlan : plan;
  const displayTips = activeTab === 'return' ? returnTips : tips;
  const displayTipsLoading = activeTab === 'return' ? returnTipsLoading : tipsLoading;
  const { hourDiff, direction, estimatedDaysToSync, isShortTripMode, schedule } = displayPlan;
  const input = plan.input;

  // Compute arrival date for routeTimes / travel card
  const travelDaySched = displayPlan.schedule.find(d => d.phase === 'travel_day');
  const travelLegsAll = travelDaySched?.legs ?? [];
  const lastFlightLeg = [...travelLegsAll].reverse().find(l => l.type === 'flight');
  const arrDateOffset = (lastFlightLeg?.type === 'flight' ? lastFlightLeg.arrivalDateOffset : undefined) ?? 0;
  const depDateStr = displayPlan.input.departureDate;
  const arrDateStr = (() => {
    const d = new Date(depDateStr + 'T12:00:00');
    d.setDate(d.getDate() + arrDateOffset);
    return d.toISOString().split('T')[0];
  })();

  // Compute outbound and return arrival dates for trip details timeline
  const outboundTravelSched = plan.schedule.find(d => d.phase === 'travel_day');
  const outboundLastFlight = [...(outboundTravelSched?.legs ?? [])].reverse().find(l => l.type === 'flight');
  const outArrOffset = (outboundLastFlight?.type === 'flight' ? outboundLastFlight.arrivalDateOffset : undefined) ?? 0;
  const outArrDate = (() => {
    const d = new Date(plan.input.departureDate + 'T12:00:00');
    d.setDate(d.getDate() + outArrOffset);
    return d.toISOString().split('T')[0];
  })();
  const retArrDate = (() => {
    if (!plan.returnPlan || !plan.input.returnDate) return '';
    const retTravelSched = plan.returnPlan.schedule.find(dd => dd.phase === 'travel_day');
    const retLastFlight = [...(retTravelSched?.legs ?? [])].reverse().find(l => l.type === 'flight');
    const retArrOffset = (retLastFlight?.type === 'flight' ? retLastFlight.arrivalDateOffset : undefined) ?? 0;
    const d = new Date(plan.input.returnDate + 'T12:00:00');
    d.setDate(d.getDate() + retArrOffset);
    return d.toISOString().split('T')[0];
  })();

  const strategyText = displayTips?.summary ?? buildStrategyText(displayPlan);

  const preDepartureDays = schedule.filter(d => d.phase === 'pre_departure');
  const travelDays = schedule.filter(d => d.phase === 'travel_day');
  const postArrivalDays = schedule.filter(d => d.phase === 'post_arrival');
  const todayStr = new Date().toISOString().split('T')[0];

  function renderDayCard(day: DaySchedule) {
    const globalIdx = schedule.indexOf(day);
    const isLocked = !isPaid && globalIdx >= FREE_DAYS_VISIBLE;

    const borderColor =
      day.phase === 'pre_departure' ? C.amber
      : day.phase === 'travel_day' ? C.border
      : C.primary;

    const tzLabel =
      day.phase === 'pre_departure'
        ? tzAbbr(displayPlan.input.homeCity.timezone, day.date)
        : day.phase === 'travel_day'
        ? `${tzAbbr(displayPlan.input.homeCity.timezone, day.date)} → ${tzAbbr(displayPlan.input.destCity.timezone, day.date)}`
        : tzAbbr(displayPlan.input.destCity.timezone, day.date);

    if (isLocked) {
      return (
        <TouchableOpacity
          key={day.date}
          style={[styles.dayCard, { borderLeftColor: borderColor }]}
          onPress={handleUpgrade}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dayCardLabel}>{day.dayLabel}</Text>
            <Text style={styles.dayCardDate}>{formatDate(day.date)}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={styles.lockedBar} />
              <View style={[styles.lockedBar, { width: 44 }]} />
            </View>
            <View style={[styles.lockedBar, { width: '100%' as any, height: 8, borderRadius: 4, marginTop: 8 }]} />
          </View>
          <View style={styles.unlockPill}>
            <Lock size={11} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.unlockPillText}>Unlock — $2.99</Text>
          </View>
        </TouchableOpacity>
      );
    }

    const isPast = day.date < todayStr;
    const isToday = day.date === todayStr;

    return (
      <TouchableOpacity
        key={day.date}
        style={[styles.dayCard, { borderLeftColor: isToday ? C.primary : borderColor }, isPast && { opacity: 0.45 }]}
        onPress={() => router.push({ pathname: '/plan/day', params: { tripId: plan!.id, date: day.date, leg: activeTab } })}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.dayCardTopRow}>
            <View style={styles.dayCardLabelRow}>
              <Text style={[styles.dayCardLabel, day.phase === 'pre_departure' && { color: C.amber }]}>
                {day.dayLabel}
              </Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
              {isPast && <Text style={styles.pastLabel}>Past</Text>}
            </View>
            <Text style={styles.dayCardTz}>{tzLabel}</Text>
          </View>
          <Text style={styles.dayCardDate}>{formatDate(day.date)}</Text>
          <View style={styles.dayCardTimesRow}>
            <Text style={styles.dayCardTimeItem}>
              Wake <Text style={styles.dayCardTimeVal}>{fmtTime(day.wakeTime, use24h)}</Text>
            </Text>
            <Text style={styles.dayCardTimeSep}>·</Text>
            <Text style={styles.dayCardTimeItem}>
              Bed <Text style={styles.dayCardTimeVal}>{fmtTime(day.bedTime, use24h)}</Text>
            </Text>
          </View>
          {day.phase !== 'travel_day' && (() => {
            const usualMin = toMin(displayPlan.input.sleepProfile.usualWakeTime);
            const wakeMin = toMin(day.wakeTime);
            if (usualMin - wakeMin > 120) {
              return (
                <Text style={styles.aggressiveNote}>
                  Aggressive target — aim for the earliest you can manage if you can't hit this time
                </Text>
              );
            }
            return null;
          })()}
          {day.phase === 'travel_day' && (() => {
            const legs = day.legs ?? [];
            const firstFlight = legs.find(l => l.type === 'flight');
            const lastFlight = [...legs].reverse().find(l => l.type === 'flight');
            if (!firstFlight || firstFlight.type !== 'flight') return null;
            const depTz = tzAbbr(firstFlight.timezone, day.date);
            const depTime = fmtTime(firstFlight.departureTime, use24h);
            const aOff = (lastFlight?.type === 'flight' ? lastFlight.arrivalDateOffset : undefined) ?? 0;
            const aDate = (() => { const d = new Date(day.date + 'T12:00:00'); d.setDate(d.getDate() + aOff); return d.toISOString().split('T')[0]; })();
            const arrTz = lastFlight?.type === 'flight' ? tzAbbr(lastFlight.toCity.timezone, aDate) : '';
            const arrTime = lastFlight?.type === 'flight' && lastFlight.arrivalTime ? fmtTime(lastFlight.arrivalTime, use24h) : null;
            const layovers = legs.filter(l => l.type === 'layover');
            return (
              <>
                <Text style={styles.dayCardArrival}>
                  {depTime} {depTz} → {arrTime ?? '—'} {arrTz}{aOff > 0 ? ` (+${aOff}d)` : ''}
                </Text>
                {layovers.length > 0 && (
                  <Text style={styles.dayCardLayover}>
                    via {layovers.map(l => l.type === 'layover' ? cityLabel(l.city) : '').join(', ')}
                  </Text>
                )}
              </>
            );
          })()}
        </View>
        <ChevronRight size={15} color={C.textMuted} strokeWidth={1.5} style={{ alignSelf: 'center', marginLeft: 8 }} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/')}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Trip details */}
        <TouchableOpacity
          style={styles.tripDetailsToggle}
          onPress={() => setShowTripDetails(v => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.tripDetailsToggleText}>Trip details</Text>
          {showTripDetails
            ? <ChevronUp size={16} color={C.textMuted} strokeWidth={1.5} />
            : <ChevronDown size={16} color={C.textMuted} strokeWidth={1.5} />}
        </TouchableOpacity>
        {showTripDetails && (
          <View style={styles.tripDetailsCard}>
            {/* Outbound itinerary */}
            <View style={styles.tdSection}>
              <Text style={styles.tdSectionLabel}>Outbound</Text>
              <ItWaypoint
                kind="dep"
                city={cityLabel(input.homeCity)}
                date={formatDate(input.departureDate)}
                time={fmt12(input.departureTime)}
                tz={tzAbbr(input.homeCity.timezone, input.departureDate)}
              />
              {(input.layovers ?? []).length === 0 ? (
                <ItConnector label="Nonstop" />
              ) : (
                (input.layovers ?? []).flatMap((l, i) => [
                  <ItConnector key={`olc-${i}`} label="" />,
                  <ItWaypoint
                    key={`olw-${i}`}
                    kind="transit"
                    city={cityLabel(l.city)}
                    time={`Arr ${fmt12(l.arrivalTime)} · Dep ${fmt12(l.departureTime)}`}
                    tz={tzAbbr(l.city.timezone, input.departureDate)}
                  />,
                ])
              )}
              {(input.layovers ?? []).length > 0 && <ItConnector label="" />}
              <ItWaypoint
                kind="arr"
                city={cityLabel(input.destCity)}
                date={outArrDate ? formatDate(outArrDate) : undefined}
                time={input.arrivalTime ? fmt12(input.arrivalTime) : '—'}
                tz={outArrDate ? tzAbbr(input.destCity.timezone, outArrDate) : ''}
                isLast
              />
            </View>

            {/* Return itinerary */}
            {input.returnDate ? (
              <View style={[styles.tdSection, styles.tdSectionBorder]}>
                <Text style={styles.tdSectionLabel}>Return</Text>
                <ItWaypoint
                  kind="dep"
                  city={cityLabel(input.destCity)}
                  date={formatDate(input.returnDate)}
                  time={fmt12(input.returnTime ?? '09:00')}
                  tz={tzAbbr(input.destCity.timezone, input.returnDate)}
                />
                {(input.returnLayovers ?? []).length === 0 ? (
                  <ItConnector label="Nonstop" />
                ) : (
                  (input.returnLayovers ?? []).flatMap((l, i) => [
                    <ItConnector key={`rlc-${i}`} label="" />,
                    <ItWaypoint
                      key={`rlw-${i}`}
                      kind="transit"
                      city={cityLabel(l.city)}
                      time={`Arr ${fmt12(l.arrivalTime)} · Dep ${fmt12(l.departureTime)}`}
                      tz={tzAbbr(l.city.timezone, input.returnDate!)}
                    />,
                  ])
                )}
                {(input.returnLayovers ?? []).length > 0 && <ItConnector label="" />}
                <ItWaypoint
                  kind="arr"
                  city={cityLabel(input.homeCity)}
                  date={retArrDate ? formatDate(retArrDate) : undefined}
                  time={input.returnArrivalTime ? fmt12(input.returnArrivalTime) : '—'}
                  tz={retArrDate ? tzAbbr(input.homeCity.timezone, retArrDate) : ''}
                  isLast
                />
              </View>
            ) : (
              <View style={[styles.tdSection, styles.tdSectionBorder]}>
                <Text style={styles.tdReturnOneWay}>One-way trip</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editTripBtn}
              onPress={() => router.push({ pathname: '/trip-setup', params: { tripId: plan.id } })}
            >
              <Text style={styles.editTripBtnText}>Edit trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Outbound / Return tab bar */}
        {plan.returnPlan && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'outbound' && styles.tabActive]}
              onPress={() => setActiveTab('outbound')}
            >
              <Text style={[styles.tabText, activeTab === 'outbound' && styles.tabTextActive]}>Outbound</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'return' && styles.tabActive]}
              onPress={() => setActiveTab('return')}
            >
              <Text style={[styles.tabText, activeTab === 'return' && styles.tabTextActive]}>Return</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.routeText}>
            {[displayPlan.input.homeCity, ...(displayPlan.input.layovers ?? []).map(l => l.city), displayPlan.input.destCity].map(cityLabel).join(' → ')}
          </Text>
          {(displayPlan.input.departureTime || displayPlan.input.arrivalTime) && (
            <Text style={styles.routeTimes}>
              {`Departs ${fmt12(displayPlan.input.departureTime)} ${tzAbbr(displayPlan.input.homeCity.timezone, depDateStr)}, ${fmtRouteDate(depDateStr)}`}
              {displayPlan.input.arrivalTime
                ? ` → Arrives ${fmt12(displayPlan.input.arrivalTime)} ${tzAbbr(displayPlan.input.destCity.timezone, arrDateStr)}, ${fmtRouteDate(arrDateStr)}`
                : ''}
            </Text>
          )}
          <View style={styles.summaryRow}>
            <DiffPill hourDiff={hourDiff} direction={direction} />
            {isShortTripMode ? (
              <SummaryPill label="Mode" value="Short trip" color={C.amber} />
            ) : displayPlan.isPartialAdjustment ? (
              <SummaryPill label="Adjustment" value={`~${estimatedDaysToSync} days (partial)`} color={C.amber} />
            ) : (
              <SummaryPill label="Adjustment" value={`~${estimatedDaysToSync} days`} />
            )}
          </View>
          {isShortTripMode ? (
            <View style={styles.shortTripBox}>
              <Text style={styles.shortTripTitle}>Short Trip Mode</Text>
              <Text style={styles.shortTripText}>
                With only a small time difference and a short trip, shifting your clock isn't worth it. Focus on alertness strategies instead:
              </Text>
              {[
                'Use caffeine strategically during your home nighttime hours.',
                'Seek bright light to stay alert — not to shift your clock.',
                'Keep naps under 20 minutes and before 3pm local time.',
                "Avoid melatonin — you don't want to start shifting.",
                'Schedule important meetings during your home daytime hours when possible.',
              ].map(t => (
                <View key={t} style={styles.shortTripTipRow}>
                  <Text style={styles.shortTripBullet}>•</Text>
                  <Text style={styles.shortTripTipText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View>
              {displayTipsLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={styles.tipsLoadingText}>Generating your personalized tips…</Text>
                </View>
              ) : (
                <Text style={styles.summaryStrategy}>{strategyText}</Text>
              )}
            </View>
          )}
        </View>

        {/* Regenerate */}
        <TouchableOpacity style={styles.regenBtn} onPress={handleRegenerate} disabled={regenerating}>
          <Text style={styles.regenBtnText}>{regenerating ? 'Updating…' : '↺  Regenerate plan'}</Text>
        </TouchableOpacity>

        {/* PDF Export + Reminders (paid only) */}
        {isPaid ? (
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={[styles.pdfBtn, exporting && { opacity: 0.6 }]}
              onPress={handleExportPDF}
              disabled={exporting}
              activeOpacity={0.8}
            >
              {exporting
                ? <ActivityIndicator size="small" color={C.primary} />
                : <Text style={styles.pdfBtnText}>Save as PDF</Text>}
            </TouchableOpacity>
            <View style={styles.actionsDiv} />
            <View style={styles.reminderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Bell size={16} color={remindersOn ? C.primary : C.textMuted} strokeWidth={1.5} />
                <Text style={[styles.reminderLabel, remindersOn && { color: C.textPrimary }]}>
                  Daily reminders
                </Text>
              </View>
              {remindersLoading
                ? <ActivityIndicator size="small" color={C.primary} />
                : (
                  <Switch
                    value={remindersOn}
                    onValueChange={handleToggleReminders}
                    trackColor={{ false: C.border, true: C.primary }}
                    thumbColor={remindersOn ? '#FFFFFF' : C.textSec}
                  />
                )}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionsCardLocked} onPress={handleUpgrade} activeOpacity={0.8}>
            <Lock size={13} color={C.textMuted} strokeWidth={2} />
            <Text style={styles.actionsLockedText}>PDF export &amp; reminders — unlock full plan</Text>
          </TouchableOpacity>
        )}

        {/* Supplement change banner */}
        {supplementsChanged && !regenerating && (
          <TouchableOpacity style={styles.supplementBanner} onPress={handleRegenerate}>
            <Text style={styles.supplementBannerText}>
              Supplement settings changed — tap to update your plan
            </Text>
          </TouchableOpacity>
        )}

        {/* Schedule note banner (compressed pre-departure) */}
        {displayPlan.scheduleNote && (
          <View style={styles.scheduleNoteBanner}>
            <Text style={styles.scheduleNoteBannerText}>{displayPlan.scheduleNote}</Text>
          </View>
        )}

        {/* Upgrade banner */}
        {!isPaid && !isShortTripMode && schedule.length > FREE_DAYS_VISIBLE && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={handleUpgrade}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LockOpen size={18} color={C.textPrimary} strokeWidth={1.5} />
              <Text style={styles.upgradeBannerTitle}>
                Unlock {schedule.length - FREE_DAYS_VISIBLE} more day{schedule.length - FREE_DAYS_VISIBLE !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.upgradeBannerSub}>Plus personalized AI tips, supplement timing, and more</Text>
            <Text style={styles.upgradeBannerCta}>Unlock full plan — $2.99 →</Text>
          </TouchableOpacity>
        )}

        {/* Day cards grouped by phase */}
        {!isShortTripMode && (
          <>
            {preDepartureDays.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>PRE-DEPARTURE</Text>
                {preDepartureDays.map(d => renderDayCard(d))}
              </>
            )}
            {travelDays.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>TRAVEL</Text>
                {travelDays.map(d => renderDayCard(d))}
              </>
            )}
            {postArrivalDays.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>POST-ARRIVAL</Text>
                {postArrivalDays.map(d => renderDayCard(d))}
              </>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────


function SummaryPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={[styles.pill, color ? { borderColor: color } : null]}>
      <Text style={[styles.pillText, color ? { color } : null]}>
        {label}: <Text style={styles.pillBold}>{value}</Text>
      </Text>
    </View>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toMin(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  return h * 60 + m;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmt12(hhmm: string): string {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtRouteDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
}

function buildStrategyText(plan: TripPlan): string {
  const { direction, hourDiff, schedule, rawHourDiff, input, isPartialAdjustment, targetAdjustHours } = plan;
  const preDepartureDays = schedule.filter(d => d.phase === 'pre_departure').length;
  const postDays = schedule.filter(d => d.phase === 'post_arrival').length;

  const flipNote = rawHourDiff !== undefined
    ? `${input.destCity.name} is ${Math.abs(rawHourDiff)} hours ${rawHourDiff > 0 ? 'ahead of' : 'behind'} ${input.homeCity.name}, but your body adjusts faster by shifting ${Math.abs(hourDiff)} hours ${direction}ward rather than ${Math.abs(rawHourDiff)} hours ${rawHourDiff > 0 ? 'east' : 'west'}ward. `
    : '';

  const partialNote = isPartialAdjustment && targetAdjustHours
    ? `Since your trip is short relative to the time difference, this plan targets a partial ~${formatHourDiffCompact(targetAdjustHours)} shift rather than a full adjustment — reducing fatigue without over-adjusting. `
    : '';

  if (direction === 'east') {
    const preNote = preDepartureDays > 0 ? `Your plan includes ${preDepartureDays} pre-departure day${preDepartureDays > 1 ? 's' : ''} to start shifting before you fly. ` : '';
    const syncNote = isPartialAdjustment
      ? `Expect noticeable improvement in ${postDays} day${postDays !== 1 ? 's' : ''}.`
      : `Expect full adjustment in about ${postDays} day${postDays !== 1 ? 's' : ''} at your destination.`;
    return `${flipNote}${partialNote}${preNote}Each day, wake and go to bed progressively earlier. Seek bright morning light — it's the strongest signal to advance your clock. Avoid bright light in the evening and take melatonin early. ${syncNote}`;
  }
  if (direction === 'west') {
    const preNote = preDepartureDays > 0 ? `Your plan includes ${preDepartureDays} pre-departure day${preDepartureDays > 1 ? 's' : ''} to start shifting before you fly. ` : '';
    const syncNote = isPartialAdjustment
      ? `Expect noticeable improvement in ${postDays} day${postDays !== 1 ? 's' : ''}.`
      : `Expect full adjustment in about ${postDays} day${postDays !== 1 ? 's' : ''} at your destination.`;
    return `${flipNote}${partialNote}${preNote}Each day, push your wake time and bedtime progressively later. Seek evening light to stay awake longer. Avoid bright morning light and take melatonin near bedtime. ${syncNote}`;
  }
  return 'No significant time zone shift needed.';
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  back: { fontSize: 16, color: C.primary, fontFamily: 'Outfit_500Medium', width: 60 },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  // Trip details
  tripDetailsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  tripDetailsToggleText: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
  tripDetailsCard: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  tdSection: { padding: 14, paddingBottom: 6 },
  tdSectionBorder: { borderTopWidth: 1, borderTopColor: C.border },
  tdSectionLabel: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  tdReturnOneWay: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular', fontStyle: 'italic' },
  editTripBtn: { margin: 14, marginTop: 4, backgroundColor: 'rgba(26,158,143,0.12)', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.primary },
  editTripBtnText: { fontSize: 14, color: C.primary, fontFamily: 'Outfit_700Bold' },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: C.primary },
  tabText: { fontSize: 14, fontFamily: 'Outfit_700Bold', color: C.textMuted },
  tabTextActive: { color: '#FFFFFF' },

  // Summary card
  summaryCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, borderLeftColor: C.primary },
  routeText: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 4 },
  routeTimes: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pill: { backgroundColor: 'rgba(26,158,143,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.primary, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, color: C.primary, fontFamily: 'Outfit_500Medium' },
  pillBold: { fontSize: 12, fontFamily: 'Outfit_700Bold' },
  tipsLoadingText: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular', fontStyle: 'italic' },
  summaryStrategy: { fontSize: 14, color: C.textSec, lineHeight: 22, fontFamily: 'Outfit_400Regular' },

  // Short trip
  shortTripBox: { backgroundColor: C.bg, borderRadius: 10, padding: 14, marginTop: 4 },
  shortTripTitle: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: C.amber, marginBottom: 6 },
  shortTripText: { fontSize: 13, color: C.textSec, lineHeight: 20, marginBottom: 10, fontFamily: 'Outfit_400Regular' },
  shortTripTipRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  shortTripBullet: { color: C.amber, fontSize: 14 },
  shortTripTipText: { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 20, fontFamily: 'Outfit_400Regular' },

  // Regenerate
  regenBtn: { alignSelf: 'center', marginBottom: 10, paddingVertical: 8, paddingHorizontal: 16 },
  regenBtnText: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium' },

  // Supplement banner
  supplementBanner: { backgroundColor: 'rgba(26,158,143,0.12)', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.primary, borderStyle: 'dashed' },
  supplementBannerText: { fontSize: 13, color: C.primary, fontFamily: 'Outfit_500Medium', textAlign: 'center' },

  // Schedule note banner
  scheduleNoteBanner: { backgroundColor: 'rgba(255,183,77,0.10)', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.amber },
  scheduleNoteBannerText: { fontSize: 13, color: C.amber, fontFamily: 'Outfit_500Medium' },

  // Upgrade banner
  upgradeBanner: { backgroundColor: 'rgba(26,158,143,0.12)', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: C.primary, alignItems: 'center', marginBottom: 10, gap: 4 },
  upgradeBannerTitle: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  upgradeBannerSub: { fontSize: 13, color: C.textSec, fontFamily: 'Outfit_400Regular', textAlign: 'center' },
  upgradeBannerCta: { fontSize: 15, color: C.primary, fontFamily: 'Outfit_700Bold', marginTop: 8 },

  // Section headers
  sectionHeader: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 8, marginLeft: 4 },

  // Compact day cards
  dayCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dayCardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  dayCardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayCardLabel: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  todayBadge: { backgroundColor: C.primary, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  todayBadgeText: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Outfit_700Bold', letterSpacing: 0.5 },
  pastLabel: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
  dayCardTz: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  dayCardDate: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginBottom: 8 },
  dayCardTimesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 0 },
  dayCardTimeItem: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  dayCardTimeVal: { fontSize: 13, color: C.textPrimary, fontFamily: 'Outfit_700Bold' },
  dayCardTimeSep: { fontSize: 12, color: C.border, fontFamily: 'Outfit_400Regular' },
  dayCardArrival: { fontSize: 12, color: C.primary, fontFamily: 'Outfit_500Medium', marginTop: 6 },
  dayCardLayover: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  aggressiveNote: { fontSize: 11, color: C.amber, fontFamily: 'Outfit_400Regular', fontStyle: 'italic', marginTop: 4 },

  // Locked day
  lockedBar: { height: 12, width: 72, backgroundColor: C.border, borderRadius: 6, opacity: 0.5 },
  unlockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'center', marginLeft: 10 },
  unlockPillText: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Outfit_700Bold' },

  // PDF + Reminders
  actionsCard: { backgroundColor: C.surface, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  pdfBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  pdfBtnText: { fontSize: 15, color: C.primary, fontFamily: 'Outfit_700Bold' },
  actionsDiv: { height: 1, backgroundColor: C.border },
  reminderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  reminderLabel: { fontSize: 15, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
  actionsCardLocked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  actionsLockedText: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
});
