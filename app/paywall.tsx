import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import {
  fetchOffering, makePurchase, restorePurchases,
  getActiveTier, PRODUCT_TRIP, PRODUCT_ANNUAL, PRODUCT_LIFETIME,
} from '../src/services/purchases';
import { addPurchasedTripId, setTierStorage } from '../src/storage/storage';
import type { PurchasesOffering, PurchasesPackage } from '../src/services/purchases';
import { C } from '../src/theme/colors';

// ── Static fallback content ──────────────────────────────────────────────────

const PLANS = [
  {
    productId: PRODUCT_TRIP,
    title: 'Per Trip',
    price: '$2.99',
    desc: 'Perfect for occasional travelers',
    cta: 'Unlock This Trip',
    popular: false,
    features: [
      'Full day-by-day schedule',
      'AI-powered daily tips',
      'Supplement timing',
      'Push reminders',
      'PDF export',
    ],
  },
  {
    productId: PRODUCT_ANNUAL,
    title: 'Annual',
    price: '$14.99 / year',
    desc: 'Best value for frequent travelers',
    cta: 'Start Annual Plan',
    popular: true,
    features: [
      'Everything in Per Trip',
      'Unlimited trip history',
      'Ask ZoneShift chat',
      'All future trips included',
    ],
  },
  {
    productId: PRODUCT_LIFETIME,
    title: 'Lifetime',
    price: '$49.99',
    desc: 'One payment, travel forever',
    cta: 'Get Lifetime Access',
    popular: false,
    features: [
      'Everything in Annual',
      'Never pay again',
      'All future features included',
      'Priority support',
    ],
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringLoaded, setOfferingLoaded] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null); // productId being purchased
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchOffering().then(o => {
      setOffering(o);
      setOfferingLoaded(true);
    });
  }, []);

  function findPackage(productId: string): PurchasesPackage | null {
    if (!offering) return null;
    return offering.availablePackages.find(
      p => p.product.identifier === productId
    ) ?? null;
  }

  async function handlePurchase(productId: string) {
    setPurchasing(productId);
    try {
      const pkg = findPackage(productId);

      if (__DEV__ && !pkg) {
        // DEV bypass when RC not configured
        if (productId === PRODUCT_TRIP && tripId) {
          await addPurchasedTripId(tripId);
        } else if (productId === PRODUCT_ANNUAL) {
          await setTierStorage('annual');
        } else if (productId === PRODUCT_LIFETIME) {
          await setTierStorage('lifetime');
        }
        router.back();
        return;
      }

      if (!pkg) {
        Alert.alert('Unavailable', 'This product is not available right now. Please try again later.');
        return;
      }

      const { result, error } = await makePurchase(pkg);
      if (result === 'success') {
        // Update local state after successful purchase
        if (productId === PRODUCT_TRIP && tripId) {
          await addPurchasedTripId(tripId);
        } else {
          const live = await getActiveTier();
          if (live !== 'free') await setTierStorage(live);
        }
        router.back();
      } else if (result === 'error') {
        Alert.alert('Purchase Failed', error ?? 'Something went wrong. Please try again.');
      }
      // 'cancelled' — user dismissed, do nothing
    } finally {
      setPurchasing(null);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const tier = await restorePurchases();
      if (tier !== 'free') {
        await setTierStorage(tier);
        Alert.alert('Restored!', `Your ${tier} plan has been restored.`, [
          { text: 'Done', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No purchases found', 'No previous purchases were found for this Apple ID.');
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
        <X size={20} color={C.textSec} strokeWidth={2} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Unlock ZoneShift</Text>
        <Text style={styles.subheading}>
          {tripId ? 'Unlock this trip or go unlimited with a plan.' : 'Choose the right plan for you.'}
        </Text>

        {!offeringLoaded && (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
        )}

        {PLANS.map(plan => {
          const pkg = offeringLoaded ? findPackage(plan.productId) : undefined;
          const displayPrice = pkg?.product.priceString ?? plan.price;
          const isBuying = purchasing === plan.productId;

          // Hide per-trip card if no tripId context
          if (plan.productId === PRODUCT_TRIP && !tripId) return null;

          return (
            <View key={plan.productId} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planTitle, plan.popular && styles.planTitlePopular]}>
                    {plan.title}
                  </Text>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                </View>
                <Text style={[styles.planPrice, plan.popular && styles.planPricePopular]}>
                  {displayPrice}
                </Text>
              </View>

              <View style={styles.featureList}>
                {plan.features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <Check size={14} color={plan.popular ? C.primary : C.textSec} strokeWidth={2.5} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.planBtn, plan.popular && styles.planBtnPopular]}
                onPress={() => handlePurchase(plan.productId)}
                disabled={isBuying || restoring}
                activeOpacity={0.8}
              >
                {isBuying
                  ? <ActivityIndicator size="small" color={plan.popular ? '#FFF' : C.primary} />
                  : <Text style={[styles.planBtnText, plan.popular && styles.planBtnTextPopular]}>
                      {plan.cta}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring || purchasing != null}
        >
          {restoring
            ? <ActivityIndicator size="small" color={C.textMuted} />
            : <Text style={styles.restoreText}>Restore purchases</Text>
          }
        </TouchableOpacity>

        <Text style={styles.purchaseAgreement}>
          By purchasing, you agree to our Terms of Use and Privacy Policy.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://eagleridge.tech/zoneshift/privacy/')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}> · </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://eagleridge.tech/zoneshift/terms/')}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Payment charged to your Apple ID. Subscriptions auto-renew unless cancelled 24 hours before period ends.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  closeBtn: { position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40 },
  heading: { fontSize: 28, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 8 },
  subheading: { fontSize: 15, color: C.textSec, fontFamily: 'Outfit_400Regular', marginBottom: 28, lineHeight: 22 },

  // Plan cards
  planCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 14,
  },
  planCardPopular: {
    borderColor: C.primary,
    borderWidth: 1.5,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  popularBadgeText: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#FFF', letterSpacing: 0.4 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: C.textPrimary, marginBottom: 2 },
  planTitlePopular: { color: C.primary },
  planDesc: { fontSize: 13, color: C.textSec, fontFamily: 'Outfit_400Regular' },
  planPrice: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  planPricePopular: { color: C.primary },
  featureList: { gap: 8, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: C.textSec, fontFamily: 'Outfit_400Regular', flex: 1 },
  planBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  planBtnPopular: { backgroundColor: C.primary, borderColor: C.primary },
  planBtnText: { fontSize: 15, fontFamily: 'Outfit_700Bold', color: C.primary },
  planBtnTextPopular: { color: '#FFF' },

  // Restore / legal
  restoreBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  restoreText: { fontSize: 14, color: C.textMuted, fontFamily: 'Outfit_500Medium' },
  purchaseAgreement: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_400Regular', textAlign: 'center', marginBottom: 8 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  legalLink: { fontSize: 12, color: C.textSec, fontFamily: 'Outfit_500Medium' },
  legalDot: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular' },
  legal: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_400Regular', textAlign: 'center', lineHeight: 17, marginTop: 4 },
});
