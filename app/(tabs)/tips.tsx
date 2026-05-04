import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TIPS_LIBRARY = [
  {
    category: 'Light Exposure',
    icon: '☀️',
    tips: [
      "Seek bright outdoor light within 1 hour of your target wake time -- it's the strongest clock signal.",
      "Avoid all screens and bright lights in the 2 hours before your target bedtime.",
      "On eastward flights, avoid light in the hours before landing if it's nighttime at the destination.",
      "Wearing sunglasses during light-avoid windows is just as effective as staying indoors.",
      "Even 10 minutes of outdoor light is significantly more powerful than indoor lighting.",
    ],
  },
  {
    category: 'Sleep Timing',
    icon: '😴',
    tips: [
      "Start shifting your bedtime 2-3 days before departure on long eastward trips.",
      "Use earplugs and an eye mask on the plane to sleep on destination schedule, not flight schedule.",
      "Short naps (20 min max) are fine -- they relieve fatigue without anchoring your clock to the wrong time.",
      "Your body shifts about 1-1.5 hours per day -- don't expect overnight adaptation.",
      "Going to bed hungry delays sleep. A small snack at target bedtime can help.",
    ],
  },
  {
    category: 'Melatonin',
    icon: '💊',
    tips: [
      "For eastward travel, take 0.5-1mg melatonin 5 hours before your target bedtime -- not at bedtime.",
      "Melatonin is a timing signal, not a sleeping pill. Lower doses (0.5mg) are often just as effective.",
      "For westward travel, take melatonin 30 minutes before your target bedtime at the destination.",
      "Don't take melatonin at the wrong time -- it can shift your clock in the wrong direction.",
      "The ideal window for melatonin is when your body is in DLMO (dim light melatonin onset) phase.",
    ],
  },
  {
    category: 'Caffeine & Food',
    icon: '☕',
    tips: [
      "Stop all caffeine 8 hours before your target bedtime -- caffeine has a 5-7 hour half-life.",
      "Eating at local meal times sends a powerful secondary clock signal to your gut.",
      "Fasting for 12-16 hours before your first local breakfast can accelerate clock resetting.",
      "Avoid alcohol on travel days -- it fragments sleep and blunts the clock-shifting benefits of rest.",
      "High-protein breakfasts support alertness. High-carb dinners can support sleep.",
    ],
  },
  {
    category: 'Exercise',
    icon: '🏃',
    tips: [
      "Morning exercise at your destination reinforces the early wake signal for eastward travel.",
      "Evening exercise (before 6pm destination time) helps westward travelers stay awake longer.",
      "Even a 20-minute outdoor walk counts -- the combination of light and movement is synergistic.",
      "Avoid intense exercise within 3 hours of your target bedtime -- it raises core body temperature.",
      "Exercise improves sleep quality and shortens time-to-sleep, even when your clock is off.",
    ],
  },
  {
    category: 'Short Trips',
    icon: '⚡',
    tips: [
      "For trips under 3 days, don't try to shift your clock -- the disruption isn't worth it.",
      "Stay on home time for short trips: schedule important meetings during your home daytime hours.",
      "Use caffeine strategically to maintain alertness during your home nighttime hours if needed.",
      "Bright light therapy (light box) can help maintain alertness without shifting your clock.",
      "Avoid melatonin on short trips -- you don't want to start shifting and then have to shift back.",
    ],
  },
  {
    category: 'On the Plane',
    icon: '✈️',
    tips: [
      "Set your watch to destination time the moment you board.",
      "Sleep on the plane only if it's nighttime at your destination.",
      "Stay hydrated -- aircraft cabins have very low humidity which worsens fatigue.",
      "Get up and walk every 2 hours to maintain circulation and reduce deep vein thrombosis risk.",
      "Wear an eye mask and earplugs to control your light environment regardless of cabin lights.",
      "Avoid alcohol on the plane -- it reduces sleep quality even if you fall asleep faster.",
    ],
  },
];

export default function TipsScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tips Library</Text>
        <Text style={styles.sub}>Science-backed jet lag advice</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {TIPS_LIBRARY.map(section => (
          <View key={section.category} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpanded(expanded === section.category ? null : section.category)}
            >
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.category}</Text>
              <Text style={styles.chevron}>{expanded === section.category ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded === section.category && (
              <View style={styles.tipsList}>
                {section.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.bullet}>{'•'}</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  sub: { fontSize: 14, color: '#475569', marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#E2E8F0' },
  chevron: { fontSize: 12, color: '#475569' },
  tipsList: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  bullet: { fontSize: 16, color: '#38BDF8', lineHeight: 22 },
  tipText: { flex: 1, fontSize: 14, color: '#CBD5E1', lineHeight: 22 },
});
