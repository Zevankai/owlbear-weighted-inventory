import type { Item } from '../types';
import { parseCurrency, toCopperPieces, fromCopperPieces } from './currency';

/**
 * Calculate net cost for player-to-player trade
 */
export function calculateP2PCost(
  player1GivesItems: Item[],
  player2GivesItems: Item[]
): { amount: number; currency: 'cp' | 'sp' | 'gp' | 'pp'; owedTo: 'player1' | 'player2' | 'even' } {
  // Calculate value of items player1 is giving
  const player1Total = player1GivesItems.reduce((sum, item) => {
    const { amount, type } = parseCurrency(item.value);
    return sum + (toCopperPieces(amount, type) * item.qty);
  }, 0);

  // Calculate value of items player2 is giving
  const player2Total = player2GivesItems.reduce((sum, item) => {
    const { amount, type } = parseCurrency(item.value);
    return sum + (toCopperPieces(amount, type) * item.qty);
  }, 0);

  const netCp = player1Total - player2Total;
  const netAbs = Math.abs(netCp);
  const converted = fromCopperPieces(Math.ceil(netAbs));

  return {
    amount: converted.amount,
    currency: converted.type,
    owedTo: netCp > 0 ? 'player2' : netCp < 0 ? 'player1' : 'even'
  };
}
