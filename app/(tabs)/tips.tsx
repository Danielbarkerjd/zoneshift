import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Clock, Pill, Coffee, Dumbbell, Briefcase, Plane, Leaf, ChevronUp, ChevronDown } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { C } from '../../src/theme/colors';

type TipsSection = {
  category: string;
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tips: string[];
};

const TIPS_LIBRARY: TipsSection[] = [
  {
    category: 'Light Exposure',
    Icon: Sun,
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
    Icon: Clock,
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
    Icon: Pill,
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
    Icon: Coffee,
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
    Icon: Dumbbell,
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
    Icon: Briefcase,
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
    Icon: Plane,
    tips: [
      "Set your watch to destination time the moment you board.",
      "Sleep on the plane only if it's nighttime at your destination.",
      "Stay hydrated -- aircraft cabins have very low humidity which worsens fatigue.",
      "Get up and walk every 2 hours to maintain circulation and reduce deep vein thrombosis risk.",
      "Wear an eye mask and earplugs to control your light environment regardless of cabin lights.",
      "Avoid alcohol on the plane -- it reduces sleep quality even if you fall asleep faster.",
    ],
  },
  {
    category: 'Supplements & Wellness',
    Icon: Leaf,
    tips: [
      "Magnesium glycinate (200–400mg) supports muscle relaxation and sleep quality. Take 30–60 minutes before your target bedtime. Especially helpful in the first few nights when your body resists the new schedule.",
      "L-theanine (100–200mg) promotes calm focus without drowsiness, reducing the wired-but-tired feeling of jet lag. Take in the morning or early afternoon. Pairs well with your morning coffee.",
      "Vitamin D (2000–4000 IU) — jet lag disrupts your natural light-based vitamin D production. Take within an hour of waking, especially arriving at a low-light destination or during winter months.",
      "Tart cherry extract is a natural melatonin source plus anti-inflammatory compounds. Take 60–90 minutes before your target bedtime. A good alternative to synthetic melatonin.",
      "Ashwagandha (300–600mg) helps regulate cortisol — the stress hormone jet lag throws off. Take 1–2 hours before bedtime. Helps with the 'exhausted but can't sleep' feeling.",
      "These supplements are widely available and generally well-tolerated, but everyone's body is different. Always consult your healthcare provider before starting any new supplement, especially if you take medications or have existing health conditions.",
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
        {TIPS_LIBRARY.map(section => {
          const isOpen = expanded === section.category;
          const SectionIcon = section.Icon;
          return (
            <View key={section.category} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExpanded(isOpen ? null : section.category)}
              >
                <SectionIcon
                  size={20}
                  color={isOpen ? C.primary : C.textSec}
                  strokeWidth={1.5}
                />
                <Text style={[styles.sectionTitle, isOpen && styles.sectionTitleOpen]}>
                  {section.category}
                </Text>
                {isOpen
                  ? <ChevronUp size={16} color={C.textMuted} strokeWidth={1.5} />
                  : <ChevronDown size={16} color={C.textMuted} strokeWidth={1.5} />
                }
              </TouchableOpacity>
              {isOpen && (
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
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  sub: { fontSize: 14, color: C.textMuted, marginTop: 2, fontFamily: 'Outfit_400Regular' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  sectionTitle: { flex: 1, fontSize: 16, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  sectionTitleOpen: { color: C.primary },
  tipsList: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  bullet: { fontSize: 16, color: C.primary, lineHeight: 22 },
  tipText: { flex: 1, fontSize: 14, color: C.textPrimary, lineHeight: 22, fontFamily: 'Outfit_400Regular' },
});
