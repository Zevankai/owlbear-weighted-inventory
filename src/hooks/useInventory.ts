import { useEffect, useState, useCallback } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk';
import type { CharacterData } from '../types';
import { DEFAULT_CHARACTER_DATA } from '../constants';

// Store data on each token's own metadata (16KB per token, not shared!)
const TOKEN_DATA_KEY = 'com.weighted-inventory/data';
// Legacy keys for migration
const LEGACY_ROOM_KEY = 'com.weighted-inventory/room-data';
const LEGACY_TOKEN_NAME_KEY_PREFIX = 'com.weighted-inventory/token/';

export function useInventory() {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for and migrate legacy data
  const migrateLegacyData = async (token: Item): Promise<CharacterData | null> => {
    const name = token.name || 'Unnamed';
    const roomMetadata = await OBR.room.getMetadata();

    // Check old room-data format (shared storage by name)
    const legacyRoomData = roomMetadata[LEGACY_ROOM_KEY] as Record<string, CharacterData> | undefined;
    if (legacyRoomData && legacyRoomData[name]) {
      console.log(`[Migration] Found ${name} in legacy room-data, migrating to token metadata...`);
      const data = legacyRoomData[name];

      // Save to token's own metadata
      await OBR.scene.items.updateItems([token.id], (items) => {
        items[0].metadata[TOKEN_DATA_KEY] = data;
      });

      console.log(`[Migration] Migrated ${name} successfully`);
      return data;
    }

    // Check per-name room keys (intermediate format)
    const legacyNameKey = `${LEGACY_TOKEN_NAME_KEY_PREFIX}${name}`;
    const legacyNameData = roomMetadata[legacyNameKey] as CharacterData | undefined;
    if (legacyNameData) {
      console.log(`[Migration] Found ${name} in legacy per-name key, migrating to token metadata...`);

      // Save to token's own metadata
      await OBR.scene.items.updateItems([token.id], (items) => {
        items[0].metadata[TOKEN_DATA_KEY] = legacyNameData;
      });

      console.log(`[Migration] Migrated ${name} successfully`);
      return legacyNameData;
    }

    return null;
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const selection = await OBR.player.getSelection();
      if (selection && selection.length > 0) {
        const items = await OBR.scene.items.getItems(selection);
        if (items.length > 0) await handleSelection(items[0]);
      } else {
        setLoading(false);
      }
    };

    init();

    // Listen for item metadata changes (syncs between players)
    const itemsSub = OBR.scene.items.onChange(async (items) => {
      if (!tokenId || !mounted) return;
      const updatedToken = items.find(item => item.id === tokenId);
      if (updatedToken) {
        const newData = updatedToken.metadata[TOKEN_DATA_KEY] as CharacterData | undefined;
        if (newData) {
          setCharacterData(newData);
        }
      }
    });

    // Listen for selection changes
    const playerSub = OBR.player.onChange(async (player) => {
      const selection = player.selection;
      if (selection && selection.length > 0) {
        const items = await OBR.scene.items.getItems(selection);
        if (items.length > 0) await handleSelection(items[0]);
      }
    });

    return () => {
      mounted = false;
      itemsSub();
      playerSub();
    };
  }, [tokenId]);

  const handleSelection = async (token: Item) => {
    const name = token.name || 'Unnamed';
    console.log('[handleSelection] Selected token:', name, 'ID:', token.id);
    setTokenId(token.id);
    setTokenName(name);
    setTokenImage((token as any).image?.url || null);

    // Try to load existing data from token metadata
    let data = token.metadata[TOKEN_DATA_KEY] as CharacterData | undefined || null;
    console.log('[handleSelection] Token metadata:', data ? `${data.inventory?.length || 0} items` : 'null');

    // If no data, check for legacy formats to migrate
    if (!data) {
      console.log('[handleSelection] No data found, checking legacy...');
      data = await migrateLegacyData(token);
    }

    setCharacterData(data || DEFAULT_CHARACTER_DATA);
    setLoading(false);
  };

  const updateData = useCallback(async (updates: Partial<CharacterData>) => {
    const idToSave = tokenId;
    console.log('[updateData] Called for token:', idToSave);
    console.log('[updateData] Updates:', JSON.stringify(updates).slice(0, 200));
    if (!idToSave) {
      console.warn('[updateData] ABORTED - tokenId is null');
      return;
    }

    // Optimistic update
    setCharacterData((prev) => {
      const current = prev || DEFAULT_CHARACTER_DATA;
      return { ...current, ...updates };
    });

    // Save to token's own metadata (16KB per token!)
    try {
      const items = await OBR.scene.items.getItems([idToSave]);
      if (items.length === 0) {
        console.error('[updateData] Token not found');
        return;
      }

      const currentData = items[0].metadata[TOKEN_DATA_KEY] as CharacterData | undefined || DEFAULT_CHARACTER_DATA;
      const mergedData = { ...currentData, ...updates };
      console.log('[updateData] Saving merged data, size:', JSON.stringify(mergedData).length, 'bytes');

      await OBR.scene.items.updateItems([idToSave], (items) => {
        items[0].metadata[TOKEN_DATA_KEY] = mergedData;
      });

      console.log('[updateData] SUCCESS - saved to token metadata');
    } catch (err) {
      console.error('[updateData] FAILED:', err);
    }
  }, [tokenId]);

  return {
    tokenId,
    tokenName,
    tokenImage,
    characterData,
    updateData,
    loading
  };
}
