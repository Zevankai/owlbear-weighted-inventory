import type { CharacterData } from '../types';
import type { TradePartner, OwnerType } from '../components/TradePartnerModal';

// Helper function to get trade partners from OBR items
export function mapItemsToTradePartners(
  items: Array<{ id: string; name: string; metadata: Record<string, unknown>; image?: { url: string } }>,
  currentTokenId: string,
  playerId: string
): TradePartner[] {
  const partners: TradePartner[] = [];
  
  for (const item of items) {
    // Skip current token
    if (item.id === currentTokenId) continue;

    // Get character data from metadata
    const data = item.metadata?.['com.weighted-inventory/data'] as CharacterData | undefined;
    if (!data) continue;

    // Must be claimed - guard ensures claimedBy is string
    const claimedBy = data.claimedBy;
    if (!claimedBy) continue;

    let ownerType: OwnerType;
    if (claimedBy === playerId) {
      ownerType = 'self';
    } else if (data.packType === 'NPC') {
      ownerType = 'npc';
    } else {
      // TODO: Add party token check when implemented
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
