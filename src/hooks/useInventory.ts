import { useEffect, useState, useCallback } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk';
import type { CharacterData } from '../types';
import { DEFAULT_CHARACTER_DATA } from '../constants';

// Store data on each token's own metadata (16KB per token, not shared!)
const TOKEN_DATA_KEY = 'com.weighted-inventory/data';
// Player favorites (stored in room metadata with player-specific keys)
const FAVORITES_KEY_PREFIX = 'com.weighted-inventory/favorites/';
// Player theme (stored in room metadata with player-specific keys)
const THEME_KEY_PREFIX = 'com.weighted-inventory/theme/';
// Legacy keys for migration
const LEGACY_ROOM_KEY = 'com.weighted-inventory/room-data';
const LEGACY_TOKEN_NAME_KEY_PREFIX = 'com.weighted-inventory/token/';

const getFavoritesKey = (playerId: string) => `${FAVORITES_KEY_PREFIX}${playerId}`;
const getThemeKey = (playerId: string) => `${THEME_KEY_PREFIX}${playerId}`;

interface ThemeColors {
  accent: string;
  background: string;
}

const DEFAULT_THEME: ThemeColors = {
  accent: '#f0e130',
  background: '#0f0f1e'
};

export function useInventory() {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Array<{id: string; name: string; image?: string}>>([]);
  const [theme, setTheme] = useState<ThemeColors>(DEFAULT_THEME);

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

  const handleSelection = useCallback(async (token: Item) => {
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
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Load player favorites and theme from room metadata (using player-specific keys)
      console.log('[Init] Loading player data...');
      const playerId = await OBR.player.getId();
      console.log('[Init] Player ID:', playerId);

      const roomMetadata = await OBR.room.getMetadata();

      // Load favorites
      const favoritesKey = getFavoritesKey(playerId);
      const savedFavorites = roomMetadata[favoritesKey] as Array<{id: string; name: string; image?: string}> | undefined;
      if (savedFavorites && mounted) {
        setFavorites(savedFavorites);
        console.log('[Favorites] Loaded', savedFavorites.length, 'favorites');
      }

      // Load theme
      const themeKey = getThemeKey(playerId);
      const savedTheme = roomMetadata[themeKey] as ThemeColors | undefined;
      if (savedTheme && mounted) {
        setTheme(savedTheme);
        console.log('[Theme] Loaded theme:', savedTheme);
      } else {
        console.log('[Theme] Using default theme');
      }

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
  }, [tokenId, handleSelection]);

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

  // Load token by ID (for favorites)
  const loadTokenById = useCallback(async (id: string) => {
    try {
      const items = await OBR.scene.items.getItems([id]);
      if (items.length > 0) {
        await handleSelection(items[0]);
      }
    } catch (err) {
      console.error('[loadTokenById] Failed:', err);
    }
  }, [handleSelection]);

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    if (!tokenId || !tokenName) return;

    const isFavorited = favorites.some(f => f.id === tokenId);
    let newFavorites: Array<{id: string; name: string; image?: string}>;

    if (isFavorited) {
      // Remove from favorites
      console.log('[Favorites] Removing', tokenName, 'from favorites');
      newFavorites = favorites.filter(f => f.id !== tokenId);
    } else {
      // Add to favorites
      console.log('[Favorites] Adding', tokenName, 'to favorites');
      newFavorites = [...favorites, { id: tokenId, name: tokenName, image: tokenImage || undefined }];
    }

    console.log('[Favorites] New favorites list:', newFavorites);
    setFavorites(newFavorites);

    // Save to room metadata with player-specific key
    const playerId = await OBR.player.getId();
    const favoritesKey = getFavoritesKey(playerId);
    console.log('[Favorites] Saving to room metadata with key:', favoritesKey);
    await OBR.room.setMetadata({ [favoritesKey]: newFavorites });
    console.log('[Favorites] Save complete');
  }, [tokenId, tokenName, tokenImage, favorites]);

  const isFavorited = tokenId ? favorites.some(f => f.id === tokenId) : false;

  // Update theme
  const updateTheme = useCallback(async (newTheme: ThemeColors) => {
    setTheme(newTheme);
    const playerId = await OBR.player.getId();
    const themeKey = getThemeKey(playerId);
    await OBR.room.setMetadata({ [themeKey]: newTheme });
    console.log('[Theme] Saved theme:', newTheme);
  }, []);

  return {
    tokenId,
    tokenName,
    tokenImage,
    characterData,
    updateData,
    loading,
    favorites,
    isFavorited,
    toggleFavorite,
    loadTokenById,
    theme,
    updateTheme
  };
}

export type { ThemeColors };
