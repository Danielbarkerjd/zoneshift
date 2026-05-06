import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaf } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getSleepProfile, saveSleepProfile, getNotifPrefs, saveNotifPrefs, getPurchasedTripIds, setTierStorage, getDevTierOverride, setDevTierOverride } from '../../src/storage/storage';
import type { NotifPrefs } from '../../src/storage/storage';
import type { SleepProfile, Chronotype, Supplements } from '../../src/types';
import { TimePickerModal } from '../../src/components/TimePickerModal';
import { useTier } from '../../src/hooks/useTier';
import { restorePurchases } from '../../src/services/purchases';
import { C } from '../../src/theme/colors';

const CHRONOTYPE_OPTIONS: { value: Chronotype; label: string; desc: string }[] = [
  { value: 'morning', label: 'Early Bird', desc: 'Naturally up early' },
  { value: 'neutral', label: 'Neutral', desc: 'No strong preference' },
  { value: 'evening', label: 'Night Owl', desc: 'Energized at night' },
];

const SUPPLEMENT_OPTIONS: { key: keyof Supplements; label: string; desc: string }[] = [
  { key: 'magnesium', label: 'Magnesium glycinate', desc: '30–60 min before bedtime — supports sleep quality' },
  { key: 'ltheanine', label: 'L-theanine', desc: 'Morning or early afternoon — calm focus without drowsiness' },
  { key: 'vitaminD', label: 'Vitamin D', desc: 'Within 1 hour of waking — anchors circadian rhythm' },
  { key: 'tartCherry', label: 'Tart cherry extract', desc: '60–90 min before bedtime — natural melatonin source' },
  { key: 'ashwagandha', label: 'Ashwagandha', desc: '1–2 hours before bedtime — regulates cortisol' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { tier, isAnnualOrLifetime, purchasedTripIds, refresh: refreshTier } = useTier();
  const [profile, setProfile] = useState<SleepProfile | null>(null);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showBedPicker, setShowBedPicker] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [devOverride, setDevOverride] = useState<string | null>(null);

  useEffect(() => {
    if (__DEV__) getDevTierOverride().then(v => setDevOverride(v));
  }, []);

  useEffect(() => {
    getSleepProfile().then(setProfile);
    getNotifPrefs().then(setNotifPrefs);
  }, []);

  async function handleRestore() {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored !== 'free') {
        await setTierStorage(restored);
        refreshTier();
        Alert.alert('Restored', `Your ${restored} plan is active.`);
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases found for this Apple ID.');
      }
    } finally {
      setRestoring(false);
    }
  }

  async function update(patch: Partial<SleepProfile>) {
    if (!profile) return;
    const updated = { ...profile, ...patch };
    setProfile(updated);
    await saveSleepProfile(updated);
  }

  async function updateSupplement(key: keyof Supplements, value: boolean) {
    if (!profile) return;
    const updated = { ...profile, supplements: { ...profile.supplements, [key]: value } };
    setProfile(updated);
    await saveSleepProfile(updated);
  }

  async function updateNotif(patch: Partial<NotifPrefs>) {
    if (!notifPrefs) return;
    const updated = { ...notifPrefs, ...patch };
    setNotifPrefs(updated);
    await saveNotifPrefs(updated);
  }

  if (!profile || !notifPrefs) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>Sleep Profile</Text>
        <View style={styles.card}>
          <Row
            label="Usual Wake Time"
            value={fmt(profile.usualWakeTime)}
            onPress={() => setShowWakePicker(true)}
          />
          <Divider />
          <Row
            label="Usual Bedtime"
            value={fmt(profile.usualBedTime)}
            onPress={() => setShowBedPicker(true)}
          />
          <Divider />
          <View style={styles.chronoSection}>
            <Text style={styles.chronoSectionLabel}>Body Clock Type</Text>
            <View style={styles.chronoOptions}>
              {CHRONOTYPE_OPTIONS.map(opt => {
                const active = profile.chronotype === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chronoOption, active && styles.chronoOptionActive]}
                    onPress={() => update({ chronotype: opt.value })}
                  >
                    <Text style={[styles.chronoOptionLabel, active && styles.chronoOptionLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.chronoOptionDesc, active && styles.chronoOptionDescActive]}>
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <ToggleRow label="Has melatonin" value={profile.hasMelatonin} onValueChange={v => update({ hasMelatonin: v })} />
          <Divider />
          <ToggleRow label="Drinks caffeine" value={profile.drinksCoffee} onValueChange={v => update({ drinksCoffee: v })} />
          <Divider />
          <ToggleRow label="24-hour clock" value={profile.use24HourFormat} onValueChange={v => update({ use24HourFormat: v })} />
        </View>

        <Text style={styles.sectionLabel}>Supplements</Text>
        <Text style={styles.sectionHint}>Enable supplements you take for timing on your day plans.</Text>
        <View style={styles.card}>
          {SUPPLEMENT_OPTIONS.map((opt, idx) => (
            <View key={opt.key}>
              {idx > 0 && <Divider />}
              <View style={styles.row}>
                <Leaf size={20} color={C.primary} strokeWidth={1.5} style={styles.supplementIcon} />
                <View style={styles.supplementText}>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  <Text style={styles.supplementDesc}>{opt.desc}</Text>
                </View>
                <Switch
                  value={profile.supplements?.[opt.key] ?? false}
                  onValueChange={v => updateSupplement(opt.key, v)}
                  trackColor={{ false: C.border, true: C.primary }}
                  thumbColor={profile.supplements?.[opt.key] ? '#FFFFFF' : C.textSec}
                />
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.sectionHint}>Changes apply to new trips only. Regenerate a trip to see updated supplement timing.</Text>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <Text style={styles.sectionHint}>Choose which reminders to receive. Toggle reminders on from the plan screen.</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Reminders enabled"
            value={notifPrefs.remindersEnabled}
            onValueChange={v => updateNotif({ remindersEnabled: v })}
          />
          {notifPrefs.remindersEnabled && (
            <>
              <Divider />
              <ToggleRow label="Wake up" value={notifPrefs.wake} onValueChange={v => updateNotif({ wake: v })} />
              <Divider />
              <ToggleRow label="Seek light" value={notifPrefs.lightSeek} onValueChange={v => updateNotif({ lightSeek: v })} />
              <Divider />
              <ToggleRow label="Avoid light" value={notifPrefs.lightAvoid} onValueChange={v => updateNotif({ lightAvoid: v })} />
              <Divider />
              <ToggleRow label="Melatonin" value={notifPrefs.melatonin} onValueChange={v => updateNotif({ melatonin: v })} />
              <Divider />
              <ToggleRow label="Last caffeine" value={notifPrefs.caffeine} onValueChange={v => updateNotif({ caffeine: v })} />
              <Divider />
              <ToggleRow label="Bedtime reminder" value={notifPrefs.bedtime} onValueChange={v => updateNotif({ bedtime: v })} />
              {notifPrefs.bedtime && (
                <>
                  <Divider />
                  <View style={styles.leadRow}>
                    <Text style={styles.rowLabel}>Bedtime lead time</Text>
                    <View style={styles.leadSegment}>
                      {([15, 30, 60] as const).map(min => (
                        <TouchableOpacity
                          key={min}
                          style={[styles.leadOpt, notifPrefs.bedtimeLeadMin === min && styles.leadOptActive]}
                          onPress={() => updateNotif({ bedtimeLeadMin: min })}
                        >
                          <Text style={[styles.leadOptText, notifPrefs.bedtimeLeadMin === min && styles.leadOptTextActive]}>
                            {min === 60 ? '1 hr' : `${min}m`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
              <Divider />
              <ToggleRow label="Supplements" value={notifPrefs.supplements} onValueChange={v => updateNotif({ supplements: v })} />
            </>
          )}
        </View>

        {/* Subscription */}
        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current Plan</Text>
            <Text style={styles.rowValue}>
              {tier === 'lifetime' ? 'Lifetime' :
               tier === 'annual' ? 'Annual' :
               tier === 'per_trip' ? 'Per Trip' : 'Free'}
            </Text>
          </View>

          {tier === 'annual' && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => Linking.openURL('itms-apps://apps.apple.com/account/subscriptions')}
              >
                <Text style={styles.rowLabel}>Manage Subscription</Text>
                <Text style={styles.rowValue}>App Store →</Text>
              </TouchableOpacity>
            </>
          )}

          {tier === 'per_trip' && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Trips unlocked</Text>
                <Text style={styles.rowValue}>{purchasedTripIds.length}</Text>
              </View>
            </>
          )}

          {tier === 'lifetime' && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: C.textSec }]}>No renewal needed — lifetime access</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleRestore} disabled={restoring}>
            {restoring
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Text style={[styles.rowLabel, { color: C.primary }]}>Restore Purchases</Text>
            }
          </TouchableOpacity>

          {!isAnnualOrLifetime && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={() => router.push('/paywall')}>
                <Text style={[styles.rowLabel, { color: C.primary }]}>Upgrade Plan</Text>
                <Text style={styles.rowValue}>→</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        {__DEV__ && (
          <>
            <Text style={styles.devSectionLabel}>⚠ Developer Options</Text>
            <View style={[styles.card, styles.devCard]}>
              <View style={styles.row}>
                <Text style={styles.devRowLabel}>Tier override</Text>
                <Text style={styles.devOverrideValue}>
                  {devOverride ?? 'none (using RevenueCat)'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
                {(['free', 'per_trip', 'annual', 'lifetime'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.devTierBtn, devOverride === t && styles.devTierBtnActive]}
                    onPress={async () => {
                      await setDevTierOverride(t);
                      setDevOverride(t);
                      refreshTier();
                    }}
                  >
                    <Text style={[styles.devTierText, devOverride === t && styles.devTierTextActive]}>
                      {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.devClearBtn}
                  onPress={async () => {
                    await setDevTierOverride(null);
                    setDevOverride(null);
                    refreshTier();
                  }}
                >
                  <Text style={styles.devClearText}>clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Legal */}
        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://eagleridge.tech/zoneshift/privacy/')}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.rowValue}>↗</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://eagleridge.tech/zoneshift/terms/')}
          >
            <Text style={styles.rowLabel}>Terms of Use</Text>
            <Text style={styles.rowValue}>↗</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>ZoneShift v1.0  •  Eagle Ridge Tech LLC</Text>
      </ScrollView>

      <TimePickerModal
        visible={showWakePicker}
        value={profile.usualWakeTime}
        title="Wake Time"
        onConfirm={v => { update({ usualWakeTime: v }); setShowWakePicker(false); }}
        onDismiss={() => setShowWakePicker(false)}
      />
      <TimePickerModal
        visible={showBedPicker}
        value={profile.usualBedTime}
        title="Bedtime"
        onConfirm={v => { update({ usualBedTime: v }); setShowBedPicker(false); }}
        onDismiss={() => setShowBedPicker(false)}
      />
    </SafeAreaView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.border, true: C.primary }}
        thumbColor={value ? '#FFFFFF' : C.textSec}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function fmt(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 24 },
  sectionLabel: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_500Medium', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4, marginLeft: 4 },
  sectionHint: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: C.surface, borderRadius: 14, marginBottom: 24, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 15, color: C.textPrimary, fontFamily: 'Outfit_500Medium' },
  rowValue: { fontSize: 15, color: C.primary, fontFamily: 'Outfit_500Medium' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  chronoSection: { padding: 16 },
  chronoSectionLabel: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_500Medium', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  chronoOptions: { flexDirection: 'row', gap: 8 },
  chronoOption: { flex: 1, backgroundColor: C.bg, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  chronoOptionActive: { borderColor: C.primary, backgroundColor: 'rgba(26,158,143,0.12)' },
  chronoOptionLabel: { fontSize: 13, fontFamily: 'Outfit_700Bold', color: C.textSec, marginBottom: 3, textAlign: 'center' },
  chronoOptionLabelActive: { color: C.primary },
  chronoOptionDesc: { fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 15, fontFamily: 'Outfit_400Regular' },
  chronoOptionDescActive: { color: C.tealLight },
  supplementIcon: { marginRight: 10 },
  supplementText: { flex: 1, marginRight: 10 },
  supplementDesc: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 1 },
  version: { fontSize: 12, color: C.border, textAlign: 'center', marginTop: 8, fontFamily: 'Outfit_400Regular' },
  devSectionLabel: { fontSize: 12, fontFamily: 'Outfit_700Bold', color: '#000', backgroundColor: '#FFD600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4, marginLeft: 4, letterSpacing: 0.5, overflow: 'hidden' },
  devCard: { borderColor: '#FFD600', borderWidth: 1.5 },
  devRowLabel: { fontSize: 13, color: C.textMuted, fontFamily: 'Outfit_500Medium', flex: 1 },
  devOverrideValue: { fontSize: 13, color: '#FFD600', fontFamily: 'Outfit_700Bold' },
  devTierBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  devTierBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  devTierText: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
  devTierTextActive: { color: '#FFF' },
  devClearBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E87D5A' },
  devClearText: { fontSize: 12, color: '#E87D5A', fontFamily: 'Outfit_500Medium' },
  leadRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  leadSegment: { flexDirection: 'row', gap: 4 },
  leadOpt: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  leadOptActive: { backgroundColor: C.primary, borderColor: C.primary },
  leadOptText: { fontSize: 13, color: C.textSec, fontFamily: 'Outfit_700Bold' },
  leadOptTextActive: { color: '#FFFFFF' },
});
