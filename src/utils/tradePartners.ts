import type { CharacterData } from '../types';
import type { TradePartner, OwnerType } from '../components/TradePartnerModal';

// Helper function to get trade partners from OBR items
export function mapItemsToTradePartners(
  items: Array<{ id: string; name: string; metadata: Record<string, unknown>; image?: { url: string } }>,
  currentTokenId: string,
  playerId: string
): TradePartner[] {
  return items
    .filter(item => {
      // Skip current token
      if (item.id === currentTokenId) return false;

      // Get character data from metadata
      const data = item.metadata?.['com.weighted-inventory/data'] as CharacterData | undefined;
      if (!data) return false;

      // Must be claimed
      if (!data.claimedBy) return false;

      return true;
    })
    .map(item => {
      const data = item.metadata['com.weighted-inventory/data'] as CharacterData;

      let ownerType: OwnerType;
      if (data.claimedBy === playerId) {
        ownerType = 'self';
      } else if (data.packType === 'NPC') {
        ownerType = 'npc';
      } else {
        // TODO: Add party token check when implemented
        ownerType = 'other-player';
      }

      return {
        tokenId: item.id,
        tokenName: item.name || 'Unknown',
        tokenImage: item.image?.url || null,
        claimedBy: data.claimedBy!, // Non-null assertion since we filtered above
        ownerType
      };
    });
}
