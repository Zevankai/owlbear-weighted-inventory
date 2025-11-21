import { useEffect, useState, useCallback } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk'; 
import type { CharacterData } from '../types';
import { DEFAULT_CHARACTER_DATA } from '../constants';

const ROOM_DATA_KEY = 'com.weighted-inventory/room-data'; // Global Room Storage
const LEGACY_TOKEN_KEY = 'com.weighted-inventory/data'; // Old Token Storage (for migration)

// Save queue to prevent race conditions - saves execute one at a time
let saveQueue: Promise<void> = Promise.resolve();

export function useInventory() {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null); 
  
  // We store the entire room's inventory database here
  const [allRoomData, setAllRoomData] = useState<Record<string, CharacterData>>({});
  
  const [loading, setLoading] = useState(true);

  // 1. Helper to fetch latest room data
  const fetchRoomData = async () => {
    const metadata = await OBR.room.getMetadata();
    return (metadata[ROOM_DATA_KEY] as Record<string, CharacterData>) || {};
  };

  useEffect(() => {
    let mounted = true;

    // 2. Initial Load & Listeners
    const init = async () => {
      // Load Room Data
      const initialRoomData = await fetchRoomData();
      if (mounted) setAllRoomData(initialRoomData);

      // Check Selection
      const selection = await OBR.player.getSelection();
      if (selection && selection.length > 0) {
        const items = await OBR.scene.items.getItems(selection);
        if (items.length > 0) handleSelection(items[0], initialRoomData);
      } else {
        setLoading(false);
      }
    };

    init();

    // 3. Listen for Room Metadata Changes (Syncs data between players instantly)
    const roomSub = OBR.room.onMetadataChange((metadata) => {
      const newData = (metadata[ROOM_DATA_KEY] as Record<string, CharacterData>) || {};
      setAllRoomData(newData);
    });

    // 4. Listen for Selection Changes (Sticky Logic)
    const playerSub = OBR.player.onChange(async (player) => {
      const selection = player.selection;
      if (selection && selection.length > 0) {
        const items = await OBR.scene.items.getItems(selection);
        if (items.length > 0) {
           // We need the LATEST room data here to check for migration
           const currentRoomData = await fetchRoomData(); 
           handleSelection(items[0], currentRoomData);
        }
      }
    });

    return () => {
      mounted = false;
      roomSub();
      playerSub();
    };
  }, []);

  // 5. Handle Logic: Name Matching & Migration
  const handleSelection = async (token: Item, currentRoomData: Record<string, CharacterData>) => {
    const name = token.name || 'Unnamed';
    setTokenId(token.id);
    setTokenName(name);

    // Extract Image
    // We safely check if 'image' property exists (Standard for Character tokens)
    const imgUrl = (token as any).image?.url || null;
    setTokenImage(imgUrl);

    // MIGRATION CHECK:
    // If this name doesn't exist in Room Data yet...
    // BUT the specific token has "Legacy" data on it...
    // We copy the Legacy data to the Room Data automatically.
    if (!currentRoomData[name]) {
      const legacyData = token.metadata[LEGACY_TOKEN_KEY] as CharacterData | undefined;
      if (legacyData) {
        console.log(`Migrating data for ${name} to Room Storage...`);
        const newData = { ...currentRoomData, [name]: legacyData };
        await OBR.room.setMetadata({ [ROOM_DATA_KEY]: newData });
        // (Local state update happens via the onMetadataChange listener)
      }
    }
    
    setLoading(false);
  };

  // 6. Update Data (Writes to Room Metadata keyed by Name)
  const updateData = useCallback(async (updates: Partial<CharacterData>) => {
    // Capture tokenName at call time to prevent stale closure issues
    const nameToSave = tokenName;
    console.log('[updateData] Called with tokenName:', nameToSave, 'updates:', Object.keys(updates));
    if (!nameToSave) {
      console.warn('[updateData] ABORTED - tokenName is null/empty');
      return;
    }

    // Optimistic Update for UI responsiveness
    setAllRoomData((prev) => {
        const currentData = prev[nameToSave] || DEFAULT_CHARACTER_DATA;
        return {
            ...prev,
            [nameToSave]: { ...currentData, ...updates }
        };
    });

    // Queue the save to prevent race conditions
    saveQueue = saveQueue.then(async () => {
      console.log('[updateData] Executing save for:', nameToSave);
      const latestRoomData = await fetchRoomData();
      console.log('[updateData] Fetched room data keys:', Object.keys(latestRoomData));
      const currentData = latestRoomData[nameToSave] || DEFAULT_CHARACTER_DATA;
      const mergedData = { ...currentData, ...updates };

      await OBR.room.setMetadata({
        [ROOM_DATA_KEY]: {
          ...latestRoomData,
          [nameToSave]: mergedData
        }
      });
      console.log('[updateData] Save completed for:', nameToSave);
    }).catch(err => {
      console.error('[updateData] Failed to save inventory:', err);
    });

    return saveQueue;
  }, [tokenName]);

  // 7. Derived Data for the UI
  // If we have a name selected, grab that name's data. Else null.
  const characterData = tokenName ? (allRoomData[tokenName] || DEFAULT_CHARACTER_DATA) : null;

  return {
    tokenId,
    tokenName,  // <--- New Export
    tokenImage, // <--- New Export
    characterData,
    updateData,
    loading
  };
}