import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Trash2, Map } from 'lucide-react-native';
import { getTrips, deleteTrip } from '../../src/storage/storage';
import { cancelPlanNotifications } from '../../src/utils/notifications';
import { cityLabel } from '../../src/utils/format';
import { DiffPill } from '../../src/components/DiffPill';
import { C } from '../../src/theme/colors';
import type { TripPlan } from '../../src/types';

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const rowRefs = useRef<Record<string, Swipeable | null>>({});

  useFocusEffect(useCallback(() => {
    getTrips().then(setTrips);
    return () => Object.values(rowRefs.current).forEach(r => r?.close());
  }, []));

  function handleDelete(trip: TripPlan) {
    rowRefs.current[trip.id]?.close();
    Alert.alert(
      'Delete Trip',
      `Remove ${cityLabel(trip.input.homeCity)} → ${cityLabel(trip.input.destCity)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(trip.id);
            cancelPlanNotifications(trip.id).catch(() => {});
            if (trip.returnPlan) cancelPlanNotifications(trip.returnPlan.id).catch(() => {});
            setTrips(prev => prev.filter(t => t.id !== trip.id));
          },
        },
      ],
    );
  }

  function renderDeleteAction(trip: TripPlan) {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(trip)}>
        <Trash2 size={20} color="#FFF" strokeWidth={1.5} />
        <Text style={styles.deleteLabel}>Delete</Text>
      </TouchableOpacity>
    );
  }

  if (trips.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Map size={48} color={C.border} strokeWidth={1} />
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
            ref={ref => { rowRefs.current[item.id] = ref; }}
            onSwipeableWillOpen={() => {
              Object.entries(rowRefs.current).forEach(([id, ref]) => {
                if (id !== item.id) ref?.close();
              });
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
                  {cityLabel(item.input.homeCity)} → {cityLabel(item.input.destCity)}
                </Text>
                <View style={styles.tripMetaRow}>
                  <Text style={styles.tripMeta}>
                    {item.returnPlan
                      ? `Round trip · ${fmtShortDate(item.input.departureDate)} – ${fmtShortDate(item.input.returnDate ?? '')}`
                      : item.input.departureDate}
                  </Text>
                  <DiffPill hourDiff={item.hourDiff} direction={item.direction} />
                </View>
              </View>
              <Text style={styles.tripArrow}>›</Text>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}

function fmtShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
  title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  newBtn: { fontSize: 16, color: C.primary, fontFamily: 'Outfit_700Bold' },
  hint: { fontSize: 12, color: C.border, paddingHorizontal: 20, marginBottom: 12, fontFamily: 'Outfit_400Regular' },
  list: { paddingHorizontal: 20 },
  tripCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  tripRoute: { flex: 1 },
  tripRouteText: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 4 },
  tripMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tripMeta: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  tripArrow: { fontSize: 22, color: C.textSec },
  deleteAction: {
    backgroundColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
  },
  deleteLabel: { fontSize: 12, color: '#FFF', fontFamily: 'Outfit_700Bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  emptySub: { fontSize: 15, color: C.textMuted, textAlign: 'center', marginBottom: 20, fontFamily: 'Outfit_400Regular' },
  newTripBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  newTripBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit_700Bold' },
});
