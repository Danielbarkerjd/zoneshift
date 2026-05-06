import { useCallback, useEffect, useState } from 'react';
import { getTier, setTierStorage, getPurchasedTripIds, getDevTierOverride } from '../storage/storage';
import { getActiveTier } from '../services/purchases';
import type { Tier } from '../types';

export function useTier(tripId?: string) {
  const [rcTier, setRcTier] = useState<'free' | 'annual' | 'lifetime'>('free');
  const [purchasedTripIds, setPurchasedTripIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    // DEV-only: local override wins before any RC call
    if (__DEV__) {
      const override = await getDevTierOverride();
      if (override !== null) {
        const base = override === 'per_trip' ? 'free' : override as 'free' | 'annual' | 'lifetime';
        setRcTier(base);
        getPurchasedTripIds().then(setPurchasedTripIds);
        return;
      }
    }

    // Load cached value immediately for instant UI
    const cached = await getTier();
    const cachedBase = cached === 'per_trip' ? 'free' : cached as 'free' | 'annual' | 'lifetime';
    setRcTier(cachedBase);

    // Authoritative check from RevenueCat (network — may be slower)
    const live = await getActiveTier();
    setRcTier(live);
    if (live !== 'free') {
      setTierStorage(live).catch(() => {});
    } else if (cached !== 'per_trip') {
      setTierStorage('free').catch(() => {});
    }

    // Per-trip unlocks (stored locally after consumable purchase)
    getPurchasedTripIds().then(setPurchasedTripIds);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isPaid = tripId
    ? (rcTier === 'annual' || rcTier === 'lifetime' || purchasedTripIds.includes(tripId))
    : (rcTier === 'annual' || rcTier === 'lifetime');

  const tier: Tier = (() => {
    if (rcTier === 'lifetime') return 'lifetime';
    if (rcTier === 'annual') return 'annual';
    if (tripId && purchasedTripIds.includes(tripId)) return 'per_trip';
    return 'free';
  })();

  return {
    tier,
    isPaid,
    isAnnualOrLifetime: rcTier === 'annual' || rcTier === 'lifetime',
    purchasedTripIds,
    refresh,
  };
}
