import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export type { PurchasesOffering, PurchasesPackage };

const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

// Entitlement identifiers configured in RevenueCat dashboard
export const ENTITLEMENT_ANNUAL = 'annual';
export const ENTITLEMENT_LIFETIME = 'lifetime';

// Product identifiers — must match App Store Connect / Google Play
export const PRODUCT_TRIP = 'zoneshift_trip_single';    // consumable
export const PRODUCT_ANNUAL = 'zoneshift_annual';        // auto-renewable sub
export const PRODUCT_LIFETIME = 'zoneshift_lifetime';    // non-consumable

let initialized = false;

export function initPurchases(): void {
  try {
    const key = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    if (!key) {
      if (__DEV__) console.log('[RC] No API key — set EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY');
      return;
    }
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: key });
    initialized = true;
    if (__DEV__) console.log('[RC] initialized');
  } catch (e) {
    if (__DEV__) console.log('[RC] init failed (Expo Go? Need dev build):', e);
  }
}

export async function getActiveTier(): Promise<'free' | 'annual' | 'lifetime'> {
  if (!initialized) return 'free';
  try {
    const info = await Purchases.getCustomerInfo();
    if (info.entitlements.active[ENTITLEMENT_LIFETIME]) return 'lifetime';
    if (info.entitlements.active[ENTITLEMENT_ANNUAL]) return 'annual';
    return 'free';
  } catch {
    return 'free';
  }
}

export async function fetchOffering(): Promise<PurchasesOffering | null> {
  if (!initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function makePurchase(
  pkg: PurchasesPackage,
): Promise<{ result: 'success' | 'cancelled' | 'error'; error?: string }> {
  try {
    await Purchases.purchasePackage(pkg);
    return { result: 'success' };
  } catch (e: any) {
    if (e?.userCancelled) return { result: 'cancelled' };
    return { result: 'error', error: e?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<'free' | 'annual' | 'lifetime'> {
  if (!initialized) return 'free';
  try {
    const info = await Purchases.restorePurchases();
    if (info.entitlements.active[ENTITLEMENT_LIFETIME]) return 'lifetime';
    if (info.entitlements.active[ENTITLEMENT_ANNUAL]) return 'annual';
    return 'free';
  } catch {
    return 'free';
  }
}
