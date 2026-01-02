
import { Concert, PriceSnapshot } from '../types';

/**
 * Calculates current ticket price based on time decay.
 * Price = Base + (Base * MaxMultiplier * DecayFactor)
 */
export function calculateCurrentPrice(
  basePrice: number,
  concert: Concert
): PriceSnapshot {
  const now = new Date().getTime();
  const launch = new Date(concert.launchDate).getTime();
  const floor = new Date(concert.floorDate).getTime();

  if (now < launch) {
    // Before launch, assume max price
    const donation = basePrice * concert.maxMultiplier;
    return { base: basePrice, donation, total: basePrice + donation };
  }

  if (now >= floor) {
    // After floor date, only base price remains
    return { base: basePrice, donation: 0, total: basePrice };
  }

  // Calculate decay factor (linear decay for this demo)
  const totalDuration = floor - launch;
  const elapsed = now - launch;
  const decayFactor = 1 - (elapsed / totalDuration);

  const initialDonation = basePrice * concert.maxMultiplier;
  const currentDonation = Math.max(0, initialDonation * decayFactor);

  return {
    base: basePrice,
    donation: Math.round(currentDonation),
    total: Math.round(basePrice + currentDonation)
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}
