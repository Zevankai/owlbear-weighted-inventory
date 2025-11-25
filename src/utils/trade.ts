import type { Item, Currency } from '../types';
import { parseCurrency, toCopperPieces, fromCopperPieces, getTotalCopperPieces } from './currency';

const DEFAULT_CURRENCY: Currency = { cp: 0, sp: 0, gp: 0, pp: 0 };

/**
 * Calculate net cost for player-to-player trade, considering both items and coins offered
 */
export function calculateP2PCost(
  player1GivesItems: Item[],
  player2GivesItems: Item[],
  player1CoinsOffered: Currency = DEFAULT_CURRENCY,
  player2CoinsOffered: Currency = DEFAULT_CURRENCY
): { amount: number; currency: 'cp' | 'sp' | 'gp' | 'pp'; owedTo: 'player1' | 'player2' | 'even' } {
  // Calculate value of items player1 is giving
  const player1ItemsTotal = player1GivesItems.reduce((sum, item) => {
    const { amount, type } = parseCurrency(item.value);
    return sum + (toCopperPieces(amount, type) * item.qty);
  }, 0);

  // Calculate value of items player2 is giving
  const player2ItemsTotal = player2GivesItems.reduce((sum, item) => {
    const { amount, type } = parseCurrency(item.value);
    return sum + (toCopperPieces(amount, type) * item.qty);
  }, 0);

  // Add coins offered by each player
  const player1CoinsTotal = getTotalCopperPieces(player1CoinsOffered);
  const player2CoinsTotal = getTotalCopperPieces(player2CoinsOffered);

  // Total value player1 is giving (items + coins)
  const player1Total = player1ItemsTotal + player1CoinsTotal;
  // Total value player2 is giving (items + coins)
  const player2Total = player2ItemsTotal + player2CoinsTotal;

  const netCp = player1Total - player2Total;
  const netAbs = Math.abs(netCp);
  const converted = fromCopperPieces(Math.ceil(netAbs));

  return {
    amount: converted.amount,
    currency: converted.type,
    owedTo: netCp > 0 ? 'player2' : netCp < 0 ? 'player1' : 'even'
  };
}
