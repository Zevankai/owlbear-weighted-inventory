import type { CharacterData } from '../types';
import type { TradePartner, OwnerType } from '../components/TradePartnerModal';

// Special constant for party token claimedBy field
const PARTY_TOKEN_MARKER = '__party__';

// Helper function to get trade partners from OBR items
export function mapItemsToTradePartners(
  items: Array<{ id: string; name: string; metadata: Record<string, unknown>; image?: { url: string } }>,
  currentTokenId: string,
  playerId: string,
  playerRole: 'GM' | 'PLAYER' = 'PLAYER'
): TradePartner[] {
  const partners: TradePartner[] = [];
  
  for (const item of items) {
    // Skip current token
    if (item.id === currentTokenId) continue;

    // Get character data from metadata
    const data = item.metadata?.['com.weighted-inventory/data'] as CharacterData | undefined;
    if (!data) continue;

    const tokenType = data.tokenType || 'player';
    
    // Handle different token types for trade partner visibility
    
    // NPC tokens: Only show as partners to GM
    if (tokenType === 'npc' && playerRole !== 'GM') continue;

    // Lore tokens: Cannot be traded with
    if (tokenType === 'lore') continue;

    // Party tokens: Show as partners to everyone (no claimedBy check needed)
    if (tokenType === 'party') {
      partners.push({
        tokenId: item.id,
        tokenName: item.name || 'Unknown',
        tokenImage: item.image?.url || null,
        claimedBy: PARTY_TOKEN_MARKER,  // Special marker for party tokens
        ownerType: 'party'
      });
      continue;
    }

    // Player and NPC tokens (tokenType !== 'party' and !== 'lore'): Must be claimed
    const claimedBy = data.claimedBy;
    if (!claimedBy) continue;

    let ownerType: OwnerType;
    if (claimedBy === playerId) {
      ownerType = 'self';
    } else if (tokenType === 'npc') {
      // NPC tokens use tokenType for consistency
      ownerType = 'npc';
    } else {
      ownerType = 'other-player';
    }

    partners.push({
      tokenId: item.id,
      tokenName: item.name || 'Unknown',
      tokenImage: item.image?.url || null,
      claimedBy,
      ownerType
    });
  }
  
  return partners;
}
