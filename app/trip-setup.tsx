import { useState, useRef, useEffect, Fragment } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  Animated, Easing, Dimensions, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react-native';
import { searchCities, getCityKey } from '../src/data/cities';
import { estimateArrival } from '../src/utils/flightEstimate';
import { tzAbbr } from '../src/utils/format';
import { ItWaypoint, ItConnector } from '../src/components/ItineraryTimeline';
import type { City, Layover, ScheduleFlexibility } from '../src/types';
import {
  getSleepProfile, saveTrip, getTier, saveTipsForTrip, saveDestFacts, getTripById, deleteTrip,
} from '../src/storage/storage';
import { computeSchedule } from '../src/engine/ruleEngine';
import { fetchTripTips, fetchDestFacts } from '../src/api/claudeTips';
import { schedulePlanNotifications } from '../src/utils/notifications';
import { TimePickerModal } from '../src/components/TimePickerModal';
import { DatePickerModal } from '../src/components/DatePickerModal';
import { C } from '../src/theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

const STEP_FROM               = 0;
const STEP_TO                 = 1;
const STEP_DEP_DATE           = 2;
const STEP_DEP_TIME           = 3;
const STEP_OUT_LAYOVERS       = 4;
const STEP_ARR_TIME           = 5;
const STEP_RETURN_DATE        = 6;
const STEP_RETURN_TIME        = 7;
const STEP_RETURN_LAYOVERS    = 8;
const STEP_RETURN_ARR_TIME    = 9;
const STEP_FLEXIBILITY        = 10;
const STEP_REVIEW             = 11;
const TOTAL_STEPS             = 12;

type LayoverMode = 'choose' | 'citySearch' | 'times';
type TimeFor = 'depart' | 'layoverArr' | 'layoverDep' | 'return' | 'arrival' | 'returnArrival';
type DateFor = 'departure' | 'return' | 'layoverArr' | 'layoverDep' | 'arrival' | 'returnArrival';

export default function TripSetupScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  // ── Navigation ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const slideX = useRef(new Animated.Value(0)).current;

  // ── Trip data ─────────────────────────────────────────────────────────────
  const [homeCity, setHomeCity] = useState<City | null>(null);
  const [destCity, setDestCity] = useState<City | null>(null);
  const [layovers, setLayovers] = useState<Layover[]>([]);
  const [returnLayovers, setReturnLayovers] = useState<Layover[]>([]);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [returnTime, setReturnTime] = useState('09:00');
  const [arrivalTime, setArrivalTime] = useState('14:00');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrEstimated, setArrEstimated] = useState(false);
  const [returnArrivalTime, setReturnArrivalTime] = useState('14:00');
  const [returnArrivalDate, setReturnArrivalDate] = useState('');
  const [retArrEstimated, setRetArrEstimated] = useState(false);
  const [scheduleFlexibility, setScheduleFlexibility] = useState<ScheduleFlexibility>('balanced');
  const [origDepDate, setOrigDepDate] = useState('');
  const [origRetDate, setOrigRetDate] = useState<string | null>(null);

  // ── City search (steps 0, 1) ───────────────────────────────────────────────
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<City[]>([]);

  // ── Layover builder ────────────────────────────────────────────────────────
  const [layoverMode, setLayoverMode] = useState<LayoverMode>('choose');
  const [layoverDraftCity, setLayoverDraftCity] = useState<City | null>(null);
  const [layoverDraftArrival, setLayoverDraftArrival] = useState('14:00');
  const [layoverDraftDeparture, setLayoverDraftDeparture] = useState('17:00');
  const [layoverDraftArrivalDate, setLayoverDraftArrivalDate] = useState('');
  const [layoverDraftDepartureDate, setLayoverDraftDepartureDate] = useState('');
  const [layoverDraftArrEstimated, setLayoverDraftArrEstimated] = useState(false);
  const [layoverCityQuery, setLayoverCityQuery] = useState('');
  const [layoverCityResults, setLayoverCityResults] = useState<City[]>([]);

  // ── Pickers ───────────────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFor, setDateFor] = useState<DateFor>('departure');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeFor, setTimeFor] = useState<TimeFor>('depart');

  // ── Generation ────────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // ── Pre-fill when editing existing trip ───────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    getTripById(tripId).then(plan => {
      if (!plan) return;
      const { input } = plan;
      setHomeCity(input.homeCity);
      setDestCity(input.destCity);
      setLayovers(input.layovers ?? []);
      setReturnLayovers(input.returnLayovers ?? []);
      setDepartureDate(input.departureDate);
      setDepartureTime(input.departureTime);
      setArrivalTime(input.arrivalTime ?? '14:00');
      setArrivalDate(input.arrivalDate ?? '');
      setReturnDate(input.returnDate);
      setReturnTime(input.returnTime ?? '09:00');
      setReturnArrivalTime(input.returnArrivalTime ?? '14:00');
      setReturnArrivalDate(input.returnArrivalDate ?? '');
      setScheduleFlexibility(input.scheduleFlexibility ?? 'balanced');
      setOrigDepDate(plan.originalDepartureDate ?? input.departureDate);
      setOrigRetDate(plan.originalReturnDate !== undefined ? plan.originalReturnDate : input.returnDate);
      setStep(STEP_REVIEW);
    });
  }, [tripId]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  function goTo(target: number, dir: 'fwd' | 'back') {
    const out = dir === 'fwd' ? -SCREEN_W : SCREEN_W;
    Animated.timing(slideX, {
      toValue: out,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setCityQuery('');
      setCityResults([]);
      setStep(target);
      slideX.setValue(-out);
      Animated.timing(slideX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }

  function advance() {
    if (step === STEP_RETURN_DATE) {
      setEditingFromReview(false);
      goTo(returnDate ? STEP_RETURN_TIME : STEP_FLEXIBILITY, 'fwd');
      return;
    }
    if (editingFromReview) {
      setEditingFromReview(false);
      goTo(STEP_REVIEW, 'fwd');
      return;
    }
    if (step === STEP_OUT_LAYOVERS && homeCity && destCity && departureDate) {
      const lastL = layovers.length > 0 ? layovers[layovers.length - 1] : null;
      const fromCity = lastL ? lastL.city : homeCity;
      const fromDate = lastL ? (lastL.departureDate ?? departureDate) : departureDate;
      const fromTime = lastL ? lastL.departureTime : departureTime;
      const est = estimateArrival(fromCity, destCity, fromDate, fromTime);
      if (est) { setArrivalTime(est.arrTime); setArrivalDate(est.arrDate); setArrEstimated(true); }
    }
    if (step === STEP_RETURN_LAYOVERS && destCity && homeCity && returnDate) {
      const lastL = returnLayovers.length > 0 ? returnLayovers[returnLayovers.length - 1] : null;
      const fromCity = lastL ? lastL.city : destCity;
      const fromDate = lastL ? (lastL.departureDate ?? returnDate) : returnDate;
      const fromTime = lastL ? lastL.departureTime : returnTime;
      const est = estimateArrival(fromCity, homeCity, fromDate, fromTime);
      if (est) { setReturnArrivalTime(est.arrTime); setReturnArrivalDate(est.arrDate); setRetArrEstimated(true); }
    }
    goTo(step + 1, 'fwd');
  }

  function back() {
    if (editingFromReview) {
      setEditingFromReview(false);
      goTo(STEP_REVIEW, 'fwd');
      return;
    }
    if (step === 0) { router.back(); return; }
    if (step === STEP_REVIEW) {
      goTo(STEP_FLEXIBILITY, 'back');
      return;
    }
    if (step === STEP_FLEXIBILITY) {
      goTo(returnDate ? STEP_RETURN_ARR_TIME : STEP_RETURN_DATE, 'back');
      return;
    }
    goTo(step - 1, 'back');
  }

  function editStep(s: number) {
    setEditingFromReview(true);
    goTo(s, 'back');
  }

  // ── City search ───────────────────────────────────────────────────────────
  function handleCitySearch(q: string) {
    setCityQuery(q);
    setCityResults(searchCities(q, 8));
  }

  function selectCity(city: City) {
    if (step === STEP_FROM) setHomeCity(city);
    else setDestCity(city);
    if (editingFromReview) {
      setEditingFromReview(false);
      goTo(STEP_REVIEW, 'fwd');
    } else {
      goTo(step + 1, 'fwd');
    }
  }

  // ── Layover helpers ───────────────────────────────────────────────────────
  function handleLayoverCitySearch(q: string) {
    setLayoverCityQuery(q);
    setLayoverCityResults(searchCities(q, 6));
  }

  function selectLayoverCity(city: City) {
    setLayoverDraftCity(city);
    setLayoverCityQuery(city.name);
    setLayoverCityResults([]);

    const isReturn = step === STEP_RETURN_LAYOVERS;
    const currentLayovers = isReturn ? returnLayovers : layovers;
    const lastL = currentLayovers.length > 0 ? currentLayovers[currentLayovers.length - 1] : null;
    const fromCity = lastL ? lastL.city : (isReturn ? destCity : homeCity);
    const fromDate = lastL ? (lastL.departureDate ?? (isReturn ? (returnDate ?? '') : departureDate)) : (isReturn ? (returnDate ?? '') : departureDate);
    const fromTime = lastL ? lastL.departureTime : (isReturn ? returnTime : departureTime);

    if (fromCity && fromDate) {
      const est = estimateArrival(fromCity, city, fromDate, fromTime);
      if (est) {
        setLayoverDraftArrival(est.arrTime);
        setLayoverDraftArrivalDate(est.arrDate);
        setLayoverDraftDepartureDate(est.arrDate);
        setLayoverDraftArrEstimated(true);
      } else {
        setLayoverDraftArrivalDate(fromDate);
        setLayoverDraftDepartureDate(fromDate);
        setLayoverDraftArrEstimated(false);
      }
    }

    setLayoverMode('times');
  }

  function commitLayover() {
    if (!layoverDraftCity) return;
    const newLayover: Layover = {
      city: layoverDraftCity,
      arrivalTime: layoverDraftArrival,
      departureTime: layoverDraftDeparture,
      ...(layoverDraftArrivalDate ? { arrivalDate: layoverDraftArrivalDate } : {}),
      ...(layoverDraftDepartureDate ? { departureDate: layoverDraftDepartureDate } : {}),
    };
    if (step === STEP_RETURN_LAYOVERS) {
      setReturnLayovers(prev => [...prev, newLayover]);
    } else {
      setLayovers(prev => [...prev, newLayover]);
    }
    resetLayoverDraft();
  }

  function resetLayoverDraft() {
    setLayoverMode('choose');
    setLayoverDraftCity(null);
    setLayoverDraftArrival('14:00');
    setLayoverDraftDeparture('17:00');
    setLayoverDraftArrivalDate('');
    setLayoverDraftDepartureDate('');
    setLayoverDraftArrEstimated(false);
    setLayoverCityQuery('');
    setLayoverCityResults([]);
  }

  function removeLayover(idx: number, from: 'outbound' | 'return') {
    if (from === 'return') {
      setReturnLayovers(prev => prev.filter((_, i) => i !== idx));
    } else {
      setLayovers(prev => prev.filter((_, i) => i !== idx));
    }
  }

  // ── Picker confirms ───────────────────────────────────────────────────────
  function handleTimeConfirm(v: string) {
    setShowTimePicker(false);
    if (timeFor === 'depart') setDepartureTime(v);
    else if (timeFor === 'return') setReturnTime(v);
    else if (timeFor === 'arrival') { setArrivalTime(v); setArrEstimated(false); }
    else if (timeFor === 'returnArrival') { setReturnArrivalTime(v); setRetArrEstimated(false); }
    else if (timeFor === 'layoverArr') { setLayoverDraftArrival(v); setLayoverDraftArrEstimated(false); }
    else setLayoverDraftDeparture(v);
  }

  function handleDateConfirm(v: string) {
    setShowDatePicker(false);
    if (dateFor === 'departure')       setDepartureDate(v);
    else if (dateFor === 'return')     setReturnDate(v);
    else if (dateFor === 'arrival')    setArrivalDate(v);
    else if (dateFor === 'returnArrival') setReturnArrivalDate(v);
    else if (dateFor === 'layoverArr') { setLayoverDraftArrivalDate(v); setLayoverDraftArrEstimated(false); }
    else                               setLayoverDraftDepartureDate(v);
  }

  // ── Plan generation ───────────────────────────────────────────────────────
  async function handleGenerate() {
    setError('');
    if (!homeCity || !destCity || !departureDate) {
      setError('Please complete all required fields.');
      return;
    }
    if (homeCity.timezone === destCity.timezone) {
      setError('Home and destination are in the same timezone.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (departureDate < todayStr) {
      setError('Departure date has already passed.');
      return;
    }
    setGenerating(true);
    try {
      const sleepProfile = await getSleepProfile();
      const outboundPlan = computeSchedule({
        homeCity,
        destCity,
        departureDate,
        departureTime,
        arrivalTime,
        arrivalDate: arrivalDate || undefined,
        returnDate,
        layovers,
        returnLayovers,
        returnTime,
        sleepProfile,
        scheduleFlexibility,
      });

      const originalDepartureDate = tripId ? (origDepDate || departureDate) : departureDate;
      const originalReturnDate = tripId ? origRetDate : returnDate;

      let finalPlan = {
        ...outboundPlan,
        originalDepartureDate,
        originalReturnDate,
      };
      if (returnDate) {
        const outboundLastDate = outboundPlan.schedule.length > 0
          ? outboundPlan.schedule[outboundPlan.schedule.length - 1].date
          : undefined;
        const returnPlan = computeSchedule({
          homeCity: destCity,
          destCity: homeCity,
          departureDate: returnDate,
          departureTime: returnTime,
          arrivalTime: returnArrivalTime,
          arrivalDate: returnArrivalDate || undefined,
          returnDate: null,
          layovers: returnLayovers,
          sleepProfile,
          scheduleFlexibility,
          minPreDepartureDate: outboundLastDate,
        });
        finalPlan = { ...finalPlan, returnPlan };
      }

      if (tripId) await deleteTrip(tripId);
      await saveTrip(finalPlan);

      getTier().then(tier => {
        if (tier !== 'free' && !finalPlan.isShortTripMode) {
          fetchTripTips(finalPlan).then(tips => saveTipsForTrip(tips)).catch(() => {});
        }
        if (finalPlan.returnPlan && tier !== 'free' && !finalPlan.returnPlan.isShortTripMode) {
          fetchTripTips(finalPlan.returnPlan).then(tips => saveTipsForTrip(tips)).catch(() => {});
        }
        if (tier !== 'free') {
          schedulePlanNotifications(finalPlan).catch(() => {});
          fetchDestFacts(finalPlan).then(facts => saveDestFacts(finalPlan.id, facts)).catch(() => {});
        }
      });

      router.replace(`/plan/${finalPlan.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate plan.');
      setGenerating(false);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const timePickerValue =
    timeFor === 'layoverArr'      ? layoverDraftArrival
    : timeFor === 'layoverDep'    ? layoverDraftDeparture
    : timeFor === 'return'        ? returnTime
    : timeFor === 'arrival'       ? arrivalTime
    : timeFor === 'returnArrival' ? returnArrivalTime
    : departureTime;

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;
  const showBack = step > 0 || editingFromReview;

  function renderStep() {
    switch (step) {
      case STEP_FROM:               return renderCitySearch('Where are you flying from?', homeCity);
      case STEP_TO:                 return renderCitySearch('Where are you going?', destCity);
      case STEP_DEP_DATE:           return renderDepartureDateStep();
      case STEP_DEP_TIME:           return renderFlightTimeStep();
      case STEP_OUT_LAYOVERS:       return renderLayoverStep(layovers, 'Any layovers on the way there?', 'outbound');
      case STEP_ARR_TIME:           return renderArrivalTimeStep();
      case STEP_RETURN_DATE:        return renderReturnDateStep();
      case STEP_RETURN_TIME:        return renderReturnTimeStep();
      case STEP_RETURN_LAYOVERS:    return renderLayoverStep(returnLayovers, 'Any layovers on the way back?', 'return');
      case STEP_RETURN_ARR_TIME:    return renderReturnArrivalTimeStep();
      case STEP_FLEXIBILITY:        return renderFlexibilityStep();
      case STEP_REVIEW:             return renderReview();
      default:                      return null;
    }
  }

  function renderCitySearch(question: string, selected: City | null) {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.stepQuestion}>{question}</Text>
        {selected && (
          <View style={styles.selectedBadge}>
            <Check size={13} color={C.primary} strokeWidth={2.5} />
            <Text style={styles.selectedBadgeText}>{selected.name}</Text>
          </View>
        )}
        <TextInput
          style={styles.searchInput}
          value={cityQuery}
          onChangeText={handleCitySearch}
          placeholder="Search cities…"
          placeholderTextColor={C.textMuted}
          autoFocus
          clearButtonMode="while-editing"
        />
        <FlatList
          data={cityResults}
          keyExtractor={c => getCityKey(c)}
          style={styles.resultList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cityResult} onPress={() => selectCity(item)}>
              <Text style={styles.cityResultName}>{item.displayName ?? item.name}</Text>
              <Text style={styles.cityResultMeta}>{item.state ? `${item.state}, ${item.country}` : item.country} · {item.timezone}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={cityQuery.length > 1 ? <Text style={styles.noResults}>No cities found</Text> : null}
        />
      </View>
    );
  }

  function renderLayoverStep(currentLayovers: Layover[], question: string, from: 'outbound' | 'return') {
    if (layoverMode === 'citySearch') {
      return (
        <View style={styles.stepWrap}>
          <Text style={styles.stepQuestion}>Which city is your layover in?</Text>
          <TextInput
            style={styles.searchInput}
            value={layoverCityQuery}
            onChangeText={handleLayoverCitySearch}
            placeholder="Search cities…"
            placeholderTextColor={C.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
          <FlatList
            data={layoverCityResults}
            keyExtractor={c => getCityKey(c)}
            style={styles.resultList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityResult} onPress={() => selectLayoverCity(item)}>
                <Text style={styles.cityResultName}>{item.displayName ?? item.name}</Text>
                <Text style={styles.cityResultMeta}>{item.state ? `${item.state}, ${item.country}` : item.country} · {item.timezone}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.cancelBtn} onPress={resetLayoverDraft}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (layoverMode === 'times') {
      return (
        <ScrollView contentContainerStyle={styles.stepScroll}>
          <Text style={styles.stepQuestion}>Layover in {layoverDraftCity?.name}</Text>

          <Text style={styles.sectionLabel}>Arrival</Text>
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => { setTimeFor('layoverArr'); setShowTimePicker(true); }}
          >
            <Text style={styles.timeRowLabel}>Time</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {layoverDraftArrEstimated && <Text style={styles.estBadge}>Est.</Text>}
              <Text style={styles.timeRowValue}>{fmt12(layoverDraftArrival)}</Text>
            </View>
          </TouchableOpacity>
          {layoverDraftArrivalDate ? (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => { setDateFor('layoverArr'); setShowDatePicker(true); }}
            >
              <Text style={styles.timeRowLabel}>Date</Text>
              <Text style={styles.timeRowValue}>{formatShortDate(layoverDraftArrivalDate)}</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Departure</Text>
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => { setTimeFor('layoverDep'); setShowTimePicker(true); }}
          >
            <Text style={styles.timeRowLabel}>Time</Text>
            <Text style={styles.timeRowValue}>{fmt12(layoverDraftDeparture)}</Text>
          </TouchableOpacity>
          {layoverDraftDepartureDate ? (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => { setDateFor('layoverDep'); setShowDatePicker(true); }}
            >
              <Text style={styles.timeRowLabel}>Date</Text>
              <Text style={styles.timeRowValue}>{formatShortDate(layoverDraftDepartureDate)}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 28 }]} onPress={commitLayover}>
            <Text style={styles.primaryBtnText}>Add to Itinerary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={resetLayoverDraft}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.stepScroll}>
        <Text style={styles.stepQuestion}>{question}</Text>
        {currentLayovers.map((l, i) => (
          <View key={i} style={styles.layoverItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.layoverItemName}>{l.city.name}</Text>
              <Text style={styles.layoverItemMeta}>
                Arrive {fmt12(l.arrivalTime)} · Depart {fmt12(l.departureTime)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeLayover(i, from)}>
              <Trash2 size={18} color={C.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        ))}
        {currentLayovers.length === 0 && (
          <TouchableOpacity style={styles.choiceCard} onPress={advance}>
            <Text style={styles.choiceCardTitle}>Nonstop</Text>
            <Text style={styles.choiceCardSub}>No layovers on this leg</Text>
          </TouchableOpacity>
        )}
        {currentLayovers.length < 3 && (
          <TouchableOpacity
            style={[styles.choiceCard, styles.choiceCardOutline]}
            onPress={() => setLayoverMode('citySearch')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color={C.primary} strokeWidth={2} />
              <Text style={[styles.choiceCardTitle, { color: C.primary }]}>
                {currentLayovers.length === 0 ? 'Add a layover' : 'Add another layover'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {currentLayovers.length > 0 && (
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={advance}>
            <Text style={styles.primaryBtnText}>Done →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  function renderDepartureDateStep() {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.stepQuestion}>When do you depart?</Text>
        {departureDate ? (
          <View style={styles.bigValueWrap}>
            <Text style={styles.bigValueText}>{formatDisplayDate(departureDate)}</Text>
            <TouchableOpacity onPress={() => { setDateFor('departure'); setShowDatePicker(true); }}>
              <Text style={styles.changeLink}>Change date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.tapPlaceholder}
            onPress={() => { setDateFor('departure'); setShowDatePicker(true); }}
          >
            <Text style={styles.tapPlaceholderText}>Select a date</Text>
          </TouchableOpacity>
        )}
        {departureDate && (
          <TouchableOpacity style={styles.fixedBottomBtn} onPress={advance}>
            <Text style={styles.primaryBtnText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function renderFlightTimeStep() {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.stepQuestion}>What time does your flight depart?</Text>
        {departureDate ? (
          <Text style={styles.stepSubtitle}>{formatDisplayDate(departureDate)}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.bigTimeBtn}
          onPress={() => { setTimeFor('depart'); setShowTimePicker(true); }}
        >
          <Text style={styles.bigTimeText}>{fmt12(departureTime)}</Text>
          <Text style={styles.changeLink}>Tap to change</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fixedBottomBtn} onPress={advance}>
          <Text style={styles.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderArrivalTimeStep() {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.stepQuestion}>
          What time do you arrive in {destCity?.name ?? 'your destination'}?
        </Text>
        <TouchableOpacity
          style={styles.bigTimeBtn}
          onPress={() => { setTimeFor('arrival'); setShowTimePicker(true); }}
        >
          <Text style={styles.bigTimeText}>{fmt12(arrivalTime)}</Text>
          <Text style={styles.changeLink}>Tap to change</Text>
        </TouchableOpacity>
        {arrEstimated && (
          <Text style={styles.estimatedNote}>Estimated · adjust to match your itinerary</Text>
        )}
        {arrivalDate ? (
          <TouchableOpacity
            style={[styles.timeRow, { marginTop: 8 }]}
            onPress={() => { setDateFor('arrival'); setShowDatePicker(true); }}
          >
            <Text style={styles.timeRowLabel}>Date</Text>
            <Text style={styles.timeRowValue}>{formatShortDate(arrivalDate)}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.fixedBottomBtn} onPress={advance}>
          <Text style={styles.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderReturnArrivalTimeStep() {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.stepQuestion}>
          What time do you arrive in {homeCity?.name ?? 'home'}?
        </Text>
        <TouchableOpacity
          style={styles.bigTimeBtn}
          onPress={() => { setTimeFor('returnArrival'); setShowTimePicker(true); }}
        >
          <Text style={styles.bigTimeText}>{fmt12(returnArrivalTime)}</Text>
          <Text style={styles.changeLink}>Tap to change</Text>
        </TouchableOpacity>
        {retArrEstimated && (
          <Text style={styles.estimatedNote}>Estimated · adjust to match your itinerary</Text>
        )}
        {returnArrivalDate ? (
          <TouchableOpacity
            style={[styles.timeRow, { marginTop: 8 }]}
            onPress={() => { setDateFor('returnArrival'); setShowDatePicker(true); }}
          >
            <Text style={styles.timeRowLabel}>Date</Text>
            <Text style={styles.timeRowValue}>{formatShortDate(returnArrivalDate)}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.fixedBottomBtn} onPress={advance}>
          <Text style={styles.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderReturnDateStep() {
    return (
      <ScrollView contentContainerStyle={styles.stepScroll}>
        <Text style={styles.stepQuestion}>Coming back?</Text>
        <TouchableOpacity
          style={styles.choiceCard}
          onPress={() => { setReturnDate(null); goTo(STEP_REVIEW, 'fwd'); }}
        >
          <Text style={styles.choiceCardTitle}>One-way trip</Text>
          <Text style={styles.choiceCardSub}>No return date</Text>
        </TouchableOpacity>
        {returnDate ? (
          <>
            <View style={styles.bigValueWrapCenter}>
              <Text style={styles.bigValueText}>{formatDisplayDate(returnDate)}</Text>
              <TouchableOpacity onPress={() => { setDateFor('return'); setShowDatePicker(true); }}>
                <Text style={styles.changeLink}>Change date</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={advance}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.choiceCard, styles.choiceCardOutline]}
            onPress={() => { setDateFor('return'); setShowDatePicker(true); }}
          >
            <Text style={[styles.choiceCardTitle, { color: C.primary }]}>Pick a return date</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  function renderReturnTimeStep() {
    return (
      <View style={styles.stepWrap}>
        <Text style={styles.stepQuestion}>What time does your return flight depart?</Text>
        {returnDate ? (
          <Text style={styles.stepSubtitle}>{formatDisplayDate(returnDate)}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.bigTimeBtn}
          onPress={() => { setTimeFor('return'); setShowTimePicker(true); }}
        >
          <Text style={styles.bigTimeText}>{fmt12(returnTime)}</Text>
          <Text style={styles.changeLink}>Tap to change</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fixedBottomBtn} onPress={advance}>
          <Text style={styles.primaryBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderFlexibilityStep() {
    const options: Array<{ value: ScheduleFlexibility; title: string; sub: string; detail: string }> = [
      { value: 'strict',   title: 'Strict',   sub: 'Wake 6–8 AM',    detail: 'Fixed work schedule or early commitments' },
      { value: 'balanced', title: 'Balanced', sub: 'Wake 5–10 AM',   detail: 'Good for most travelers (default)' },
      { value: 'flexible', title: 'Flexible', sub: 'Wake 4 AM–noon', detail: 'Open itinerary, no hard start times' },
    ];
    return (
      <ScrollView contentContainerStyle={styles.stepScroll}>
        <Text style={styles.stepQuestion}>How flexible is your schedule?</Text>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.choiceCard, scheduleFlexibility === opt.value && styles.choiceCardSelected]}
            onPress={() => { setScheduleFlexibility(opt.value); advance(); }}
          >
            <View style={styles.choiceCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceCardTitle}>{opt.title}</Text>
                <Text style={styles.choiceCardSub}>{opt.sub}</Text>
                <Text style={styles.choiceCardDetail}>{opt.detail}</Text>
              </View>
              {scheduleFlexibility === opt.value && (
                <Check size={18} color={C.primary} strokeWidth={2.5} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function renderReview() {
    const canGenerate = !generating && !!homeCity && !!destCity && !!departureDate;

    const outArrEst = !arrivalDate && homeCity && destCity && departureDate
      ? estimateArrival(homeCity, destCity, departureDate, departureTime)
      : null;
    const outArrDateStr = arrivalDate || outArrEst?.arrDate || departureDate;

    const retArrEst = !returnArrivalDate && returnDate && destCity && homeCity
      ? estimateArrival(destCity, homeCity, returnDate, returnTime)
      : null;
    const retArrDateStr = returnArrivalDate || retArrEst?.arrDate || returnDate || '';

    const homeTz = homeCity && departureDate ? tzAbbr(homeCity.timezone, departureDate) : '';
    const destTz = destCity && outArrDateStr ? tzAbbr(destCity.timezone, outArrDateStr) : '';
    const retDepTz = destCity && returnDate ? tzAbbr(destCity.timezone, returnDate) : '';
    const homeTzRet = homeCity && retArrDateStr ? tzAbbr(homeCity.timezone, retArrDateStr) : '';

    return (
      <ScrollView contentContainerStyle={styles.stepScroll}>
        <Text style={styles.stepQuestion}>Ready to go?</Text>

        <Text style={styles.reviewSectionHeader}>Outbound</Text>
        <View style={styles.timelineCard}>
          <ItWaypoint
            kind="dep"
            city={homeCity ? (homeCity.iata ? `${homeCity.name} (${homeCity.iata})` : homeCity.name) : '—'}
            date={departureDate ? formatShortDate(departureDate) : undefined}
            time={fmt12(departureTime)}
            tz={homeTz}
            onEdit={() => editStep(STEP_FROM)}
          />
          {layovers.length === 0 ? (
            <ItConnector label="Nonstop" onEdit={() => editStep(STEP_OUT_LAYOVERS)} />
          ) : (
            layovers.flatMap((l, i) => [
              <ItConnector
                key={`oc-${i}`}
                label=""
                onEdit={i === 0 ? () => editStep(STEP_OUT_LAYOVERS) : undefined}
              />,
              <ItWaypoint
                key={`ow-${i}`}
                kind="transit"
                city={l.city.iata ? `${l.city.name} (${l.city.iata})` : l.city.name}
                date={l.arrivalDate ? formatShortDate(l.arrivalDate) : undefined}
                time={`Arr ${fmt12(l.arrivalTime)} · Dep ${fmt12(l.departureTime)}`}
                tz={tzAbbr(l.city.timezone, l.arrivalDate ?? departureDate)}
              />,
            ])
          )}
          {layovers.length > 0 && <ItConnector label="" />}
          <ItWaypoint
            kind="arr"
            city={destCity ? (destCity.iata ? `${destCity.name} (${destCity.iata})` : destCity.name) : '—'}
            date={outArrDateStr ? formatShortDate(outArrDateStr) : undefined}
            time={fmt12(arrivalTime)}
            tz={destTz}
            isEstimated={arrEstimated}
            onEdit={() => editStep(STEP_ARR_TIME)}
            isLast
          />
        </View>

        {returnDate ? (
          <>
            <Text style={styles.reviewSectionHeader}>Return</Text>
            <View style={styles.timelineCard}>
              <ItWaypoint
                kind="dep"
                city={destCity ? (destCity.iata ? `${destCity.name} (${destCity.iata})` : destCity.name) : '—'}
                date={formatShortDate(returnDate)}
                time={fmt12(returnTime)}
                tz={retDepTz}
                onEdit={() => editStep(STEP_RETURN_DATE)}
              />
              {returnLayovers.length === 0 ? (
                <ItConnector label="Nonstop" onEdit={() => editStep(STEP_RETURN_LAYOVERS)} />
              ) : (
                returnLayovers.flatMap((l, i) => [
                  <ItConnector
                    key={`rc-${i}`}
                    label=""
                    onEdit={i === 0 ? () => editStep(STEP_RETURN_LAYOVERS) : undefined}
                  />,
                  <ItWaypoint
                    key={`rw-${i}`}
                    kind="transit"
                    city={l.city.iata ? `${l.city.name} (${l.city.iata})` : l.city.name}
                    date={l.arrivalDate ? formatShortDate(l.arrivalDate) : undefined}
                    time={`Arr ${fmt12(l.arrivalTime)} · Dep ${fmt12(l.departureTime)}`}
                    tz={tzAbbr(l.city.timezone, l.arrivalDate ?? returnDate ?? '')}
                  />,
                ])
              )}
              {returnLayovers.length > 0 && <ItConnector label="" />}
              <ItWaypoint
                kind="arr"
                city={homeCity ? (homeCity.iata ? `${homeCity.name} (${homeCity.iata})` : homeCity.name) : '—'}
                date={retArrDateStr ? formatShortDate(retArrDateStr) : undefined}
                time={fmt12(returnArrivalTime)}
                tz={homeTzRet}
                isEstimated={retArrEstimated}
                onEdit={() => editStep(STEP_RETURN_ARR_TIME)}
                isLast
              />
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.choiceCard, styles.choiceCardOutline, { marginBottom: 20 }]}
            onPress={() => editStep(STEP_RETURN_DATE)}
          >
            <Text style={[styles.choiceCardTitle, { color: C.primary }]}>+ Add return date</Text>
            <Text style={styles.choiceCardSub}>Currently one-way</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, !canGenerate && styles.primaryBtnDisabled]}
          onPress={handleGenerate}
          disabled={!canGenerate}
        >
          <Text style={styles.primaryBtnText}>
            {generating ? 'Generating…' : 'Generate My Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
      </View>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={back} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft
            size={22}
            color={showBack ? C.textSec : 'transparent'}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Animated.View style={[styles.flex, { transform: [{ translateX: slideX }] }]}>
          {renderStep()}
        </Animated.View>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={showTimePicker}
        value={timePickerValue}
        title={
          timeFor === 'depart'          ? 'Departure Time'
          : timeFor === 'return'        ? 'Return Flight Time'
          : timeFor === 'arrival'       ? `Arrival in ${destCity?.name ?? 'Destination'}`
          : timeFor === 'returnArrival' ? `Arrival in ${homeCity?.name ?? 'Home'}`
          : timeFor === 'layoverArr'    ? 'Layover Arrival'
          : 'Layover Departure'
        }
        onConfirm={handleTimeConfirm}
        onDismiss={() => setShowTimePicker(false)}
      />
      <DatePickerModal
        visible={showDatePicker}
        value={
          dateFor === 'departure'      ? departureDate
          : dateFor === 'return'       ? (returnDate ?? '')
          : dateFor === 'arrival'      ? arrivalDate
          : dateFor === 'returnArrival'? returnArrivalDate
          : dateFor === 'layoverArr'   ? layoverDraftArrivalDate
          : layoverDraftDepartureDate
        }
        title={
          dateFor === 'departure'      ? 'Departure Date'
          : dateFor === 'return'       ? 'Return Date'
          : dateFor === 'arrival'      ? `Arrival in ${destCity?.name ?? 'Destination'}`
          : dateFor === 'returnArrival'? `Arrival in ${homeCity?.name ?? 'Home'}`
          : dateFor === 'layoverArr'   ? `Layover Arrival — ${layoverDraftCity?.name ?? 'City'}`
          : `Layover Departure — ${layoverDraftCity?.name ?? 'City'}`
        }
        onConfirm={handleDateConfirm}
        onDismiss={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt12(hhmm: string): string {
  const [h, m] = (hhmm || '09:00').split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1, overflow: 'hidden' },

  progressTrack: { height: 3, backgroundColor: C.border },
  progressFill: { height: 3, backgroundColor: C.primary },

  topBar: { height: 52, paddingHorizontal: 16, justifyContent: 'center' },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },

  stepWrap: { flex: 1, paddingHorizontal: 28, paddingTop: 28 },
  stepScroll: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 56 },

  stepQuestion: {
    fontSize: 22,
    fontFamily: 'Outfit_500Medium',
    color: C.textPrimary,
    marginBottom: 28,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    color: C.textMuted,
    fontFamily: 'Outfit_400Regular',
    marginTop: -20,
    marginBottom: 24,
  },

  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,158,143,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  selectedBadgeText: { fontSize: 13, color: C.primary, fontFamily: 'Outfit_500Medium' },
  searchInput: {
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.textPrimary,
    fontFamily: 'Outfit_400Regular',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  resultList: { flex: 1 },
  cityResult: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cityResultName: { fontSize: 16, fontFamily: 'Outfit_500Medium', color: C.textPrimary, marginBottom: 2 },
  cityResultMeta: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  noResults: { textAlign: 'center', color: C.textSec, marginTop: 40, fontSize: 15, fontFamily: 'Outfit_400Regular' },

  choiceCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  choiceCardOutline: {
    borderColor: C.primary,
    backgroundColor: 'rgba(26,158,143,0.06)',
  },
  choiceCardTitle: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 4 },
  choiceCardSub: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular' },

  layoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  layoverItemName: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 2 },
  layoverItemMeta: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular' },

  cancelBtn: { alignItems: 'center', paddingVertical: 16 },
  cancelBtnText: { fontSize: 15, color: C.textMuted, fontFamily: 'Outfit_400Regular' },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  timeRowLabel: { fontSize: 15, color: C.textSec, fontFamily: 'Outfit_400Regular' },
  timeRowValue: { fontSize: 17, color: C.primary, fontFamily: 'Outfit_700Bold' },

  bigValueWrap: { paddingVertical: 32, alignItems: 'center' },
  bigValueWrapCenter: { paddingVertical: 24, alignItems: 'center' },
  bigValueText: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: C.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  changeLink: { fontSize: 14, color: C.textMuted, fontFamily: 'Outfit_400Regular' },

  tapPlaceholder: {
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
  },
  tapPlaceholderText: { fontSize: 17, color: C.textSec, fontFamily: 'Outfit_500Medium' },

  bigTimeBtn: { alignItems: 'center', paddingVertical: 32 },
  bigTimeText: { fontSize: 52, fontFamily: 'Outfit_700Bold', color: C.primary, marginBottom: 6 },
  estimatedNote: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginTop: -16,
    marginBottom: 12,
  },

  timelineCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  reviewSectionHeader: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  reviewLabel: { width: 72, fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
  reviewValue: { flex: 1, fontSize: 15, color: C.textPrimary, fontFamily: 'Outfit_500Medium', paddingRight: 8 },
  reviewEdit: { fontSize: 14, color: C.primary, fontFamily: 'Outfit_700Bold' },

  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Outfit_700Bold' },
  primaryBtnDisabled: { opacity: 0.4 },

  fixedBottomBtn: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    right: 28,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },

  error: { color: '#C0392B', fontSize: 14, marginBottom: 12, textAlign: 'center', fontFamily: 'Outfit_400Regular' },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  estBadge: {
    fontSize: 11,
    fontFamily: 'Outfit_700Bold',
    color: C.primary,
    backgroundColor: 'rgba(26,158,143,0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  choiceCardSelected: {
    borderColor: C.primary,
    backgroundColor: 'rgba(26,158,143,0.08)',
  },
  choiceCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceCardDetail: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
});
