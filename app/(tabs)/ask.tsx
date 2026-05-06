import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { getActiveTripId, getTripById, getSleepProfile } from '../../src/storage/storage';
import { askClaude } from '../../src/api/claudeTips';
import { fmtTime } from '../../src/utils/format';
import { useTier } from '../../src/hooks/useTier';
import { C } from '../../src/theme/colors';
import type { TripPlan, SleepProfile, ChatMessage } from '../../src/types';

const STARTERS = [
  "What if I can't fall asleep at my target bedtime?",
  "Should I nap on arrival day?",
  "Can I have coffee if I really need it?",
  "What about alcohol on the flight?",
];

export default function AskScreen() {
  const router = useRouter();
  const { isAnnualOrLifetime, refresh: refreshTier } = useTier();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    refreshTier();
    getActiveTripId().then(id => {
      if (id) getTripById(id).then(setPlan);
    });
    getSleepProfile().then(setProfile);
  }, []));

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(nextMessages);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const use24h = profile?.use24HourFormat ?? false;
      const fmt = (t: string | null | undefined) => t ? fmtTime(t, use24h) : null;

      const planContext = plan
        ? `Route: ${plan.input.homeCity.name} → ${plan.input.destCity.name}, ${Math.abs(plan.hourDiff)} hrs ${plan.direction}ward. Schedule: ${JSON.stringify(plan.schedule.map(d => ({ date: d.date, label: d.dayLabel, wakeTime: fmt(d.wakeTime), bedTime: fmt(d.bedTime), lightSeekStart: fmt(d.lightSeekStart), lightSeekEnd: fmt(d.lightSeekEnd), melatoninTime: fmt(d.melatoninTime), caffeineCutoff: fmt(d.caffeineCutoff) })))}`
        : 'No active plan.';

      const profileContext = profile
        ? `Wake: ${fmt(profile.usualWakeTime)}, Bed: ${fmt(profile.usualBedTime)}, chronotype: ${profile.chronotype}, melatonin: ${profile.hasMelatonin}, caffeine: ${profile.drinksCoffee}`
        : 'No profile.';

      const reply = await askClaude(nextMessages, planContext, profileContext, use24h);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      if (__DEV__) console.log('[Ask] error:', err?.message, err);
      const msg = __DEV__
        ? `Debug: ${err?.message ?? String(err)}`
        : "Sorry, I couldn't connect right now. Check your connection and try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleUpgrade() {
    router.push('/paywall');
  }

  // Gate: must be annual/lifetime
  if (!isAnnualOrLifetime) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateHeader}>
          <Text style={styles.title}>Ask ZoneShift</Text>
        </View>
        <View style={styles.gate}>
          <View style={styles.gateIconBox}>
            <MessageCircle size={56} color={C.primary} strokeWidth={1} />
          </View>
          <Text style={styles.gateTitle}>Ask anything about your plan</Text>
          <Text style={styles.gateSub}>
            Get personalized answers about your jet lag recovery — what to do if you can't sleep, whether to nap, how to handle the travel day, and more.
          </Text>
          <View style={styles.gateFeatures}>
            {[
              'Your full plan pre-loaded as context',
              'Specific advice referencing your times',
              'Unlimited questions per trip',
            ].map(f => (
              <View key={f} style={styles.gateFeatureRow}>
                <Text style={styles.gateFeatureDot}>✓</Text>
                <Text style={styles.gateFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.gateBtn} onPress={handleUpgrade}>
            <Text style={styles.gateBtnText}>Unlock with Annual Plan — $14.99/yr</Text>
          </TouchableOpacity>
          <Text style={styles.gateTierNote}>Also available with Lifetime plan ($49.99)</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.chatHeader}>
          <Text style={styles.title}>Ask ZoneShift</Text>
          {plan && (
            <Text style={styles.chatContext}>
              {plan.input.homeCity.name} → {plan.input.destCity.name}
            </Text>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <>
              <Text style={styles.starterLabel}>Try asking…</Text>
              {STARTERS.map(q => (
                <TouchableOpacity key={q} style={styles.starterChip} onPress={() => send(q)}>
                  <Text style={styles.starterText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              {m.role === 'assistant' && <Text style={styles.bubbleFrom}>✦ ZoneShift</Text>}
              <Text style={[styles.bubbleText, m.role === 'user' && styles.userText]}>{m.content}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={styles.bubbleFrom}>✦ ZoneShift</Text>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your plan…"
            placeholderTextColor={C.textMuted}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  gateHeader: { paddingHorizontal: 20, paddingTop: 12 },
  gate: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  gateIconBox: { marginBottom: 20 },
  gateTitle: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: C.textPrimary, textAlign: 'center', marginBottom: 12 },
  gateSub: { fontSize: 15, color: C.textSec, lineHeight: 24, textAlign: 'center', marginBottom: 28, fontFamily: 'Outfit_400Regular' },
  gateFeatures: { alignSelf: 'stretch', gap: 10, marginBottom: 32 },
  gateFeatureRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  gateFeatureDot: { color: C.primary, fontFamily: 'Outfit_700Bold', fontSize: 15 },
  gateFeatureText: { flex: 1, fontSize: 15, color: C.textPrimary, fontFamily: 'Outfit_400Regular' },
  gateBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', alignSelf: 'stretch', marginBottom: 12 },
  gateBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Outfit_700Bold' },
  gateTierNote: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  chatHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  chatContext: { fontSize: 13, color: C.primary, fontFamily: 'Outfit_500Medium', marginTop: 2 },
  messageList: { flex: 1 },
  messageContent: { padding: 16, gap: 12, flexGrow: 1 },
  starterLabel: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  starterChip: { backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  starterText: { fontSize: 14, color: C.textPrimary, fontFamily: 'Outfit_400Regular' },
  bubble: { borderRadius: 16, padding: 14, maxWidth: '92%' },
  userBubble: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: C.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border },
  bubbleFrom: { fontSize: 11, color: C.primary, fontFamily: 'Outfit_700Bold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  bubbleText: { fontSize: 15, color: C.textPrimary, fontFamily: 'Outfit_400Regular', lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  input: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
    fontFamily: 'Outfit_400Regular',
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Outfit_700Bold' },
});
