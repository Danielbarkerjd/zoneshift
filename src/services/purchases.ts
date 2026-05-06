// react-native-purchases is stubbed until RevenueCat is connected to App Store Connect.
// All functions return safe no-op values. Wire up the real SDK once RC is configured.

export const ENTITLEMENT_ANNUAL = 'annual';
export const ENTITLEMENT_LIFETIME = 'lifetime';

export const PRODUCT_TRIP = 'zoneshift_trip_single';
export const PRODUCT_ANNUAL = 'zoneshift_annual';
export const PRODUCT_LIFETIME = 'zoneshift_lifetime';

// Minimal type stubs so paywall.tsx compiles without changes
export interface PurchasesPackage {
  product: { identifier: string; priceString: string };
}
export interface PurchasesOffering {
  availablePackages: PurchasesPackage[];
}

export function initPurchases(): void {}

export async function getActiveTier(): Promise<'free' | 'annual' | 'lifetime'> {
  return 'free';
}

export async function fetchOffering(): Promise<PurchasesOffering | null> {
  return null;
}

export async function makePurchase(
  _pkg: PurchasesPackage,
): Promise<{ result: 'success' | 'cancelled' | 'error'; error?: string }> {
  return { result: 'error', error: 'Purchases not configured yet.' };
}

export async function restorePurchases(): Promise<'free' | 'annual' | 'lifetime'> {
  return 'free';
}
