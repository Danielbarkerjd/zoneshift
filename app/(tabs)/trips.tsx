import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrips } from '../../src/storage/storage';
import type { TripPlan } from '../../src/types';

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripPlan[]>([]);

  useEffect(() => {
    getTrips().then(setTrips);
  }, []);

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
      <FlatList
        data={trips}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => router.push(`/plan/${item.id}`)}
          >
            <View style={styles.tripRoute}>
              <Text style={styles.tripRouteText}>
                {item.input.homeCity.name} → {item.input.destCity.name}
              </Text>
              <Text style={styles.tripMeta}>
                {item.input.departureDate} • {Math.abs(item.hourDiff)}h {item.direction === 'east' ? 'east' : 'west'}
              </Text>
            </View>
            <Text style={styles.tripArrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  newBtn: { fontSize: 16, color: '#38BDF8', fontWeight: '700' },
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#E2E8F0', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  newTripBtn: { backgroundColor: '#38BDF8', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  newTripBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
});
