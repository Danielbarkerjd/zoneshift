import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { getTrips, deleteTrip } from '../../src/storage/storage';
import { formatHourDiff } from '../../src/utils/format';
import type { TripPlan } from '../../src/types';

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const openRowRef = useRef<Swipeable | null>(null);

  useFocusEffect(useCallback(() => {
    getTrips().then(setTrips);
    // Close any open swipe row when the tab re-focuses
    return () => openRowRef.current?.close();
  }, []));

  function handleDelete(trip: TripPlan) {
    openRowRef.current?.close();
    Alert.alert(
      'Delete Trip',
      `Remove ${trip.input.homeCity.name} → ${trip.input.destCity.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(trip.id);
            setTrips(prev => prev.filter(t => t.id !== trip.id));
          },
        },
      ],
    );
  }

  function renderDeleteAction(trip: TripPlan) {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(trip)}>
        <Text style={styles.deleteIcon}>🗑</Text>
        <Text style={styles.deleteLabel}>Delete</Text>
      </TouchableOpacity>
    );
  }

  if (trips.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Your trip history will appear here.</Text>
          <TouchableOpacity style={styles.newTripBtn} onPress={() => router.push('/trip-setup')}>
            <Text style={styles.newTripBtnText}>Plan a Trip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity onPress={() => router.push('/trip-setup')}>
          <Text style={styles.newBtn}>+ New</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Swipe left to delete</Text>
      <FlatList
        data={trips}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Swipeable
            ref={ref => {
              // Track the currently open row so we can close it when another opens
              if (ref) openRowRef.current = ref;
            }}
            onSwipeableWillOpen={() => {
              // Close any previously open row
              openRowRef.current?.close();
            }}
            renderRightActions={() => renderDeleteAction(item)}
            rightThreshold={60}
            overshootRight={false}
            friction={2}
          >
            <TouchableOpacity
              style={styles.tripCard}
              onPress={() => router.push(`/plan/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.tripRoute}>
                <Text style={styles.tripRouteText}>
                  {item.input.homeCity.name} → {item.input.destCity.name}
                </Text>
                <Text style={styles.tripMeta}>
                  {item.input.departureDate} • {formatHourDiff(item.hourDiff)} {item.direction === 'east' ? 'east' : 'west'}
                </Text>
              </View>
              <Text style={styles.tripArrow}>›</Text>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  newBtn: { fontSize: 16, color: '#38BDF8', fontWeight: '700' },
  hint: { fontSize: 12, color: '#334155', paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingHorizontal: 20 },
  tripCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tripRoute: { flex: 1 },
  tripRouteText: { fontSize: 16, fontWeight: '700', color: '#E2E8F0', marginBottom: 4 },
  tripMeta: { fontSize: 13, color: '#64748B' },
  tripArrow: { fontSize: 22, color: '#475569' },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
  },
  deleteIcon: { fontSize: 20 },
  deleteLabel: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#E2E8F0', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  newTripBtn: { backgroundColor: '#38BDF8', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  newTripBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
});
