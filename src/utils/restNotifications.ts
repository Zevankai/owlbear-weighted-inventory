import OBR from '@owlbear-rodeo/sdk';
import type { RestType } from '../types';

// Room metadata key for rest notifications
export const REST_NOTIFICATION_KEY = 'com.username.rest-notification';

export interface RestNotificationData {
  id: string;
  initiatorId: string;
  initiatorName: string;
  restType: RestType;
  timestamp: number;
  confirmations: Record<string, boolean>; // playerId -> confirmed
  allPlayerIds: string[]; // All players in the room at the time
}

/**
 * Utility function to initiate a rest notification
 * This should be called by the player initiating the rest
 */
export const initiateRestNotification = async (restType: RestType): Promise<void> => {
  await new Promise<void>(resolve => OBR.onReady(() => resolve()));

  const playerId = await OBR.player.getId();
  const playerName = await OBR.player.getName();
  
  // Get all players in the room
  const party = await OBR.party.getPlayers();
  const allPlayerIds = party.map((p) => p.id);

  // Create notification data
  const notificationData: RestNotificationData = {
    id: `rest-${Date.now()}`,
    initiatorId: playerId,
    initiatorName: playerName,
    restType,
    timestamp: Date.now(),
    confirmations: {
      [playerId]: true, // Initiator auto-confirms
    },
    allPlayerIds,
  };

  // Set in room metadata
  await OBR.room.setMetadata({
    [REST_NOTIFICATION_KEY]: notificationData,
  });
};
