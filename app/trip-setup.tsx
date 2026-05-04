import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  FlatList, Modal, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchCities } from '../src/data/cities';
import type { City } from '../src/types';
import { getSleepProfile, saveTrip } from '../src/storage/storage';
import { computeSchedule } from '../src/engine/ruleEngine';
import { TimePickerModal } from '../src/components/TimePickerModal';
import { DatePickerModal } from '../src/components/DatePickerModal';

export default function TripSetupScreen() {
  const router = useRouter();

  const [homeCity, setHomeCity] = useState<City | null>(null);
  const [destCity, setDestCity] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState('');

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [pickingFor, setPickingFor] = useState<'home' | 'dest' | null>(null);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDepDatePicker, setShowDepDatePicker] = useState(false);
  const [showRetDatePicker, setShowRetDatePicker] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  function openCityPicker(which: 'home' | 'dest') {
    setPickingFor(which);
    setCityQuery('');
    setCityResults([]);
  }

  function handleCitySearch(text: string) {
    setCityQuery(text);
    setCityResults(searchCities(text, 8));
  }

  function selectCity(city: City) {
    if (pickingFor === 'home') setHomeCity(city);
    else setDestCity(city);
    setPickingFor(null);
  }

  async function handleGenerate() {
    setError('');
    if (!homeCity) { setError('Please select your home city.'); return; }
    if (!destCity) { setError('Please select your destination city.'); return; }
    if (!departureDate) { setError('Please enter a departure date.'); return; }
    if (homeCity.timezone === destCity.timezone) {
      setError('Home and destination are in the same timezone.'); return;
    }

    setGenerating(true);
    try {
      const sleepProfile = await getSleepProfile();
      const plan = computeSchedule({
        homeCity,
        destCity,
        departureDate,
        departureTime,
        returnDate: returnDate || null,
        sleepProfile,
      });
      await saveTrip(plan);
      router.replace(`/plan/${plan.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate plan.');
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = !generating && !!homeCity && !!destCity && !!departureDate;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Plan Your Trip</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FormSection label="Home City">
          <TouchableOpacity style={styles.cityBtn} onPress={() => openCityPicker('home')}>
            {homeCity ? (
              <View>
                <Text style={styles.cityName}>{homeCity.name}</Text>
                <Text style={styles.cityTz}>{homeCity.timezone}</Text>
              </View>
            ) : (
              <Text style={styles.cityPlaceholder}>Search cities...</Text>
            )}
            <Text style={styles.cityArrow}>›</Text>
          </TouchableOpacity>
        </FormSection>

        <FormSection label="Destination City">
          <TouchableOpacity style={styles.cityBtn} onPress={() => openCityPicker('dest')}>
            {destCity ? (
              <View>
                <Text style={styles.cityName}>{destCity.name}</Text>
                <Text style={styles.cityTz}>{destCity.timezone}</Text>
              </View>
            ) : (
              <Text style={styles.cityPlaceholder}>Search cities...</Text>
            )}
            <Text style={styles.cityArrow}>›</Text>
          </TouchableOpacity>
        </FormSection>

        <FormSection label="Departure Date">
          <TouchableOpacity style={styles.cityBtn} onPress={() => setShowDepDatePicker(true)}>
            <Text style={departureDate ? styles.cityName : styles.cityPlaceholder}>
              {departureDate || 'Select date...'}
            </Text>
            <Text style={styles.cityArrow}>›</Text>
          </TouchableOpacity>
        </FormSection>

        <FormSection label="Departure Time">
          <TouchableOpacity style={styles.cityBtn} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.cityName}>{fmt12(departureTime)}</Text>
            <Text style={styles.cityArrow}>›</Text>
          </TouchableOpacity>
        </FormSection>

        <FormSection label="Return Date (optional)">
          <TouchableOpacity style={styles.cityBtn} onPress={() => setShowRetDatePicker(true)}>
            <Text style={returnDate ? styles.cityName : styles.cityPlaceholder}>
              {returnDate || 'One-way trip'}
            </Text>
            {returnDate ? (
              <TouchableOpacity onPress={() => setReturnDate('')}>
                <Text style={styles.clearBtn}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.cityArrow}>›</Text>
            )}
          </TouchableOpacity>
        </FormSection>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!canGenerate}
        >
          <Text style={styles.generateBtnText}>
            {generating ? 'Generating...' : 'Generate My Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* City search modal */}
      <Modal visible={!!pickingFor} animationType="slide" onRequestClose={() => setPickingFor(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPickingFor(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {pickingFor === 'home' ? 'Home City' : 'Destination'}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <TextInput
            style={styles.searchInput}
            value={cityQuery}
            onChangeText={handleCitySearch}
            placeholder="Type city name..."
            placeholderTextColor="#475569"
            autoFocus
            clearButtonMode="while-editing"
          />
          <FlatList
            data={cityResults}
            keyExtractor={c => `${c.name}|${c.country}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityResult} onPress={() => selectCity(item)}>
                <Text style={styles.cityResultName}>{item.name}</Text>
                <Text style={styles.cityResultMeta}>{item.country} • {item.timezone}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              cityQuery.length > 0 ? (
                <Text style={styles.noResults}>No cities found</Text>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>

      <TimePickerModal
        visible={showTimePicker}
        value={departureTime}
        title="Departure Time"
        onConfirm={v => { setDepartureTime(v); setShowTimePicker(false); }}
        onDismiss={() => setShowTimePicker(false)}
      />
      <DatePickerModal
        visible={showDepDatePicker}
        value={departureDate}
        title="Departure Date"
        onConfirm={v => { setDepartureDate(v); setShowDepDatePicker(false); }}
        onDismiss={() => setShowDepDatePicker(false)}
      />
      <DatePickerModal
        visible={showRetDatePicker}
        value={returnDate}
        title="Return Date"
        onConfirm={v => { setReturnDate(v); setShowRetDatePicker(false); }}
        onDismiss={() => setShowRetDatePicker(false)}
      />
    </SafeAreaView>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  back: { fontSize: 16, color: '#38BDF8', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  formSection: { marginBottom: 20 },
  formLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  cityBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cityName: { fontSize: 16, color: '#F8FAFC', fontWeight: '600' },
  cityTz: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cityPlaceholder: { fontSize: 16, color: '#475569' },
  cityArrow: { fontSize: 20, color: '#475569' },
  clearBtn: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  error: { color: '#EF4444', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  generateBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { color: '#0F172A', fontSize: 17, fontWeight: '800' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#0F172A' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  modalCancel: { fontSize: 16, color: '#94A3B8', width: 60 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#F8FAFC' },
  searchInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    margin: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cityResult: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cityResultName: { fontSize: 16, fontWeight: '600', color: '#E2E8F0', marginBottom: 2 },
  cityResultMeta: { fontSize: 13, color: '#64748B' },
  noResults: { textAlign: 'center', color: '#475569', marginTop: 40, fontSize: 15 },
});
