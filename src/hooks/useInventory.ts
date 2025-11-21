import { useEffect, useState, useCallback } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk';
import type { CharacterData } from '../types';
import { DEFAULT_CHARACTER_DATA } from '../constants';

// Per-token storage key prefix (each token gets 16KB)
const TOKEN_KEY_PREFIX = 'com.weighted-inventory/token/';
// Legacy keys for migration
const LEGACY_ROOM_KEY = 'com.weighted-inventory/room-data';
const LEGACY_TOKEN_KEY = 'com.weighted-inventory/data';

const getTokenKey = (name: string) => `${TOKEN_KEY_PREFIX}${name}`;

export function useInventory() {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data for a specific token
  const fetchTokenData = async (name: string): Promise<CharacterData | null> => {
    const metadata = await OBR.room.getMetadata();
    return (metadata[getTokenKey(name)] as CharacterData) || null;
  };

  // Check for and migrate legacy data
  const migrateLegacyData = async (name: string, token: Item): Promise<CharacterData | null> => {
    const metadata = await OBR.room.getMetadata();

    // Check old room-data format first
    const legacyRoomData = metadata[LEGACY_ROOM_KEY] as Record<string, CharacterData> | undefined;
    if (legacyRoomData && legacyRoomData[name]) {
      console.log(`[Migration] Found ${name} in legacy room-data, migrating...`);
      const data = legacyRoomData[name];
      await OBR.room.setMetadata({ [getTokenKey(name)]: data });
      return data;
    }

    // Check token metadata (oldest format)
    const legacyTokenData = token.metadata[LEGACY_TOKEN_KEY] as CharacterData | undefined;
    if (legacyTokenData) {
      console.log(`[Migration] Found ${name} in token metadata, migrating...`);
      await OBR.room.setMetadata({ [getTokenKey(name)]: legacyTokenData });
      return legacyTokenData;
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

    // Listen for metadata changes (syncs between players)
    const roomSub = OBR.room.onMetadataChange(async (metadata) => {
      if (!tokenName) return;
      const newData = metadata[getTokenKey(tokenName)] as CharacterData | undefined;
      if (newData && mounted) {
        setCharacterData(newData);
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
      roomSub();
      playerSub();
    };
  }, [tokenName]);

  const handleSelection = async (token: Item) => {
    const name = token.name || 'Unnamed';
    console.log('[handleSelection] Selected token:', name);
    setTokenId(token.id);
    setTokenName(name);
    setTokenImage((token as any).image?.url || null);

    // Try to load existing data
    const key = getTokenKey(name);
    console.log('[handleSelection] Loading from key:', key);
    let data = await fetchTokenData(name);
    console.log('[handleSelection] Loaded data:', data ? `${data.inventory?.length || 0} items` : 'null');

    // If no data, check for legacy formats to migrate
    if (!data) {
      console.log('[handleSelection] No data found, checking legacy...');
      data = await migrateLegacyData(name, token);
    }

    setCharacterData(data || DEFAULT_CHARACTER_DATA);
    setLoading(false);
  };

  const updateData = useCallback(async (updates: Partial<CharacterData>) => {
    const nameToSave = tokenName;
    console.log('[updateData] Called for:', nameToSave);
    console.log('[updateData] Updates:', JSON.stringify(updates).slice(0, 200));
    if (!nameToSave) {
      console.warn('[updateData] ABORTED - tokenName is null');
      return;
    }

    // Optimistic update
    setCharacterData((prev) => {
      const current = prev || DEFAULT_CHARACTER_DATA;
      return { ...current, ...updates };
    });

    // Save to per-token key (no race conditions with other tokens!)
    try {
      const key = getTokenKey(nameToSave);
      console.log('[updateData] Fetching current data for key:', key);
      const currentData = await fetchTokenData(nameToSave) || DEFAULT_CHARACTER_DATA;
      const mergedData = { ...currentData, ...updates };
      console.log('[updateData] Saving merged data, size:', JSON.stringify(mergedData).length, 'bytes');
      await OBR.room.setMetadata({ [key]: mergedData });
      console.log('[updateData] SUCCESS - saved to:', key);
    } catch (err) {
      console.error('[updateData] FAILED:', err);
    }
  }, [tokenName]);

  return {
    tokenId,
    tokenName,
    tokenImage,
    characterData,
    updateData,
    loading
  };
}
