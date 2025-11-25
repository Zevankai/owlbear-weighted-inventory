import type { Currency } from '../types';

/**
 * Parse currency value from string (e.g., "50 gp" -> {amount: 50, type: 'gp'})
 */
export function parseCurrency(valueStr: string): { amount: number; type: 'cp' | 'sp' | 'gp' | 'pp' } {
  const lower = valueStr.toLowerCase().trim();
  let type: 'cp' | 'sp' | 'gp' | 'pp' = 'gp';

  if (lower.includes('pp')) type = 'pp';
  else if (lower.includes('sp')) type = 'sp';
  else if (lower.includes('cp')) type = 'cp';
  else if (lower.includes('gp')) type = 'gp';

  const amount = parseFloat(lower.replace(/[^0-9.]/g, '')) || 0;
  return { amount, type };
}

/**
 * Convert currency amount to copper pieces
 */
export function toCopperPieces(amount: number, type: 'cp' | 'sp' | 'gp' | 'pp'): number {
  const rates = { cp: 1, sp: 10, gp: 100, pp: 1000 };
  return amount * rates[type];
}

/**
 * Convert copper pieces to best currency denomination
 */
export function fromCopperPieces(cp: number): { amount: number; type: 'cp' | 'sp' | 'gp' | 'pp' } {
  if (cp >= 1000 && cp % 1000 === 0) return { amount: cp / 1000, type: 'pp' };
  if (cp >= 100 && cp % 100 === 0) return { amount: cp / 100, type: 'gp' };
  if (cp >= 10 && cp % 10 === 0) return { amount: cp / 10, type: 'sp' };
  return { amount: cp, type: 'cp' };
}

/**
 * Calculate total value of a currency object in copper pieces
 */
export function getTotalCopperPieces(currency: Currency): number {
  return (
    (currency.cp || 0) * 1 +
    (currency.sp || 0) * 10 +
    (currency.gp || 0) * 100 +
    (currency.pp || 0) * 1000
  );
}

/**
 * Convert copper pieces to optimal coin breakdown (fewest coins)
 */
export function breakdownCopperToCoins(cp: number): Currency {
  let remaining = cp;
  const result: Currency = { cp: 0, sp: 0, gp: 0, pp: 0 };

  result.pp = Math.floor(remaining / 1000);
  remaining = remaining % 1000;

  result.gp = Math.floor(remaining / 100);
  remaining = remaining % 100;

  result.sp = Math.floor(remaining / 10);
  remaining = remaining % 10;

  result.cp = remaining;

  return result;
}

/**
 * Deduct copper pieces from a currency object, modifying it in place
 * @returns true if successful, false if not enough coins
 */
export function deductCopperPieces(currency: Currency, cpToDeduct: number): boolean {
  const totalCp = getTotalCopperPieces(currency);

  if (totalCp < cpToDeduct) {
    return false; // Not enough coins
  }

  // Convert all to copper, deduct, then break down optimally
  const remainingCp = totalCp - cpToDeduct;
  const breakdown = breakdownCopperToCoins(remainingCp);

  // Update currency object
  currency.cp = breakdown.cp;
  currency.sp = breakdown.sp;
  currency.gp = breakdown.gp;
  currency.pp = breakdown.pp;

  return true;
}

/**
 * Add copper pieces to a currency object, converting to optimal breakdown
 */
export function addCopperPieces(currency: Currency, cpToAdd: number): void {
  const totalCp = getTotalCopperPieces(currency) + cpToAdd;
  const breakdown = breakdownCopperToCoins(totalCp);

  currency.cp = breakdown.cp;
  currency.sp = breakdown.sp;
  currency.gp = breakdown.gp;
  currency.pp = breakdown.pp;
}

