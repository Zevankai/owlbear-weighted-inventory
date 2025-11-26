import { useEffect, useState, useCallback } from 'react';
import OBR, { buildShape, isImage } from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk';
import type { CharacterData } from '../types';
import { DEFAULT_CHARACTER_DATA } from '../constants';
import type { Vector2 } from '@owlbear-rodeo/sdk';

// Store data on each token's own metadata (16KB per token, not shared!)
const TOKEN_DATA_KEY = 'com.weighted-inventory/data';
// Player favorites (stored in room metadata with player-specific keys)
const FAVORITES_KEY_PREFIX = 'com.weighted-inventory/favorites/';
// Player theme (stored in room metadata with player-specific keys)
const THEME_KEY_PREFIX = 'com.weighted-inventory/theme/';
// Over-encumbered visual effect attachment ID
const OVERBURDENED_ATTACHMENT_ID = 'com.weighted-inventory/overburdened-indicator';
// Legacy keys for migration
const LEGACY_ROOM_KEY = 'com.weighted-inventory/room-data';
const LEGACY_TOKEN_NAME_KEY_PREFIX = 'com.weighted-inventory/token/';

const getFavoritesKey = (playerId: string) => `${FAVORITES_KEY_PREFIX}${playerId}`;
const getThemeKey = (playerId: string) => `${THEME_KEY_PREFIX}${playerId}`;

// Helper to calculate the center position of a token (pure utility function)
const getTokenCenter = (token: Item): Vector2 => {
  // For Image items (tokens), calculate center based on image dimensions and scale
  if (isImage(token)) {
    // Use Math.abs to handle any unusual negative scale values
    const width = token.image.width * Math.abs(token.scale.x);
    const height = token.image.height * Math.abs(token.scale.y);
    return {
      x: token.position.x + width / 2,
      y: token.position.y + height / 2
    };
  }
  // Fallback: just use the position (top-left) for non-image items
  return token.position;
};

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
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<'GM' | 'PLAYER'>('PLAYER');
  const [playerClaimedTokenId, setPlayerClaimedTokenId] = useState<string | null>(null);
  const [playerClaimedTokenInfo, setPlayerClaimedTokenInfo] = useState<{name: string; image?: string} | null>(null);

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
      const currentPlayerId = await OBR.player.getId();
      const currentPlayerRole = await OBR.player.getRole();
      console.log('[Init] Player ID:', currentPlayerId);
      console.log('[Init] Player Role:', currentPlayerRole);

      setPlayerId(currentPlayerId);
      setPlayerRole(currentPlayerRole === 'GM' ? 'GM' : 'PLAYER');

      // Find the player's claimed token (if any)
      try {
        const allTokens = await OBR.scene.items.getItems();
        const claimedToken = allTokens.find(token => {
          const data = token.metadata[TOKEN_DATA_KEY] as CharacterData | undefined;
          return data?.claimedBy === currentPlayerId;
        });
        if (claimedToken && mounted) {
          setPlayerClaimedTokenId(claimedToken.id);
          setPlayerClaimedTokenInfo({
            name: claimedToken.name || 'Unknown',
            image: (claimedToken as any).image?.url || undefined
          });
          console.log('[Init] Found player claimed token:', claimedToken.name);
        }
      } catch (err) {
        console.error('[Init] Failed to find claimed token:', err);
      }

      const roomMetadata = await OBR.room.getMetadata();

      // Load favorites
      const favoritesKey = getFavoritesKey(currentPlayerId);
      const savedFavorites = roomMetadata[favoritesKey] as Array<{id: string; name: string; image?: string}> | undefined;
      if (savedFavorites && mounted) {
        setFavorites(savedFavorites);
        console.log('[Favorites] Loaded', savedFavorites.length, 'favorites');
      }

      // Load theme
      const themeKey = getThemeKey(currentPlayerId);
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

  // Remove a favorite by ID (for removing from favorites menu)
  const removeFavoriteById = useCallback(async (targetTokenId: string) => {
    console.log('[Favorites] Removing token by ID:', targetTokenId);
    const newFavorites = favorites.filter(f => f.id !== targetTokenId);

    setFavorites(newFavorites);

    // Save to room metadata with player-specific key
    const currentPlayerId = await OBR.player.getId();
    const favoritesKey = getFavoritesKey(currentPlayerId);
    await OBR.room.setMetadata({ [favoritesKey]: newFavorites });
    console.log('[Favorites] Removed from favorites');
  }, [favorites]);

  const isFavorited = tokenId ? favorites.some(f => f.id === tokenId) : false;

  // Update theme
  const updateTheme = useCallback(async (newTheme: ThemeColors) => {
    setTheme(newTheme);
    const playerId = await OBR.player.getId();
    const themeKey = getThemeKey(playerId);
    await OBR.room.setMetadata({ [themeKey]: newTheme });
    console.log('[Theme] Saved theme:', newTheme);
  }, []);

  // Update over-encumbered visual effect
  const updateOverburdenedEffect = useCallback(async (isOverburdened: boolean) => {
    if (!tokenId) return;

    try {
      // Check if effect already exists
      const allItems = await OBR.scene.items.getItems();
      const hasEffect = allItems.some(item => item.id === OVERBURDENED_ATTACHMENT_ID);

      if (isOverburdened && !hasEffect) {
        // Add red ring effect
        console.log('[Overburdened] Adding red ring effect to token');

        const items = await OBR.scene.items.getItems([tokenId]);
        if (items.length === 0) return;

        const token = items[0] as any;
        const tokenWidth = token.image?.width || 10;
        const tokenHeight = token.image?.height || 10;

        const ring = buildShape()
          .id(OVERBURDENED_ATTACHMENT_ID)
          .shapeType("CIRCLE")
          .width(tokenWidth * 1.2) // 20% larger than token
          .height(tokenHeight * 1.2)
          .position({ x: token.position.x, y: token.position.y })
          .strokeColor("#ff0000") // Red
          .strokeWidth(8)
          .strokeOpacity(0.8)
          .fillOpacity(0)
          .layer("ATTACHMENT")
          .attachedTo(tokenId)
          .locked(true)
          .disableHit(true)
          .build();

        await OBR.scene.items.addItems([ring]);
      } else if (!isOverburdened && hasEffect) {
        // Remove red ring effect
        console.log('[Overburdened] Removing red ring effect from token');
        await OBR.scene.items.deleteItems([OVERBURDENED_ATTACHMENT_ID]);
      }
    } catch (err) {
      console.error('[Overburdened] Failed to update effect:', err);
    }
  }, [tokenId]);

  // Claim a token (binds it to current player)
  const claimToken = useCallback(async () => {
    if (!tokenId || !playerId || !characterData) return;

    // Check if claiming is enabled (GM must enable it first)
    if (!characterData.claimingEnabled) {
      console.log('[Claim] Claiming is not enabled for this token');
      return false;
    }

    await updateData({ claimedBy: playerId });
    setPlayerClaimedTokenId(tokenId);
    console.log('[Claim] Token claimed by player:', playerId);
    return true;
  }, [tokenId, playerId, characterData, updateData]);

  // Unclaim a token (removes claim)
  const unclaimToken = useCallback(async () => {
    if (!tokenId) return;

    await updateData({ claimedBy: undefined });
    setPlayerClaimedTokenId(null);
    setPlayerClaimedTokenInfo(null);
    console.log('[Claim] Token unclaimed');
  }, [tokenId, updateData]);

  // Unclaim a token by ID (for unclaiming from favorites menu without selecting the token)
  const unclaimTokenById = useCallback(async (targetTokenId: string) => {
    if (!targetTokenId) return;

    try {
      const items = await OBR.scene.items.getItems([targetTokenId]);
      if (items.length === 0) {
        console.error('[unclaimTokenById] Token not found');
        return;
      }

      const currentData = items[0].metadata[TOKEN_DATA_KEY] as CharacterData | undefined || DEFAULT_CHARACTER_DATA;
      const updatedData = { ...currentData, claimedBy: undefined };

      await OBR.scene.items.updateItems([targetTokenId], (items) => {
        items[0].metadata[TOKEN_DATA_KEY] = updatedData;
      });

      // Update local state if this was the player's claimed token
      if (targetTokenId === playerClaimedTokenId) {
        setPlayerClaimedTokenId(null);
        setPlayerClaimedTokenInfo(null);
      }

      console.log('[unclaimTokenById] Token unclaimed:', targetTokenId);
    } catch (err) {
      console.error('[unclaimTokenById] Failed:', err);
    }
  }, [playerClaimedTokenId]);

  // Check if current player can edit the token
  const canEditToken = useCallback(() => {
    if (!characterData || !playerId) return false;

    // GM can always edit
    if (playerRole === 'GM') return true;

    // If token is unclaimed, anyone can edit
    if (!characterData.claimedBy) return true;

    // If claimed, only the claiming player can edit
    return characterData.claimedBy === playerId;
  }, [characterData, playerId, playerRole]);

  // Check proximity between two tokens (within 5 grid units)
  const checkProximity = useCallback(async (token1Id: string, token2Id: string): Promise<boolean> => {
    try {
      const items = await OBR.scene.items.getItems([token1Id, token2Id]);
      if (items.length !== 2) return false;

      // Find tokens by ID to ensure correct matching
      const token1 = items.find(item => item.id === token1Id);
      const token2 = items.find(item => item.id === token2Id);

      if (!token1 || !token2) return false;

      // Calculate center positions of both tokens
      // Token positions are top-left corners, so we need to offset by half the token size
      // to get the actual center where the character is visually located
      const center1 = getTokenCenter(token1);
      const center2 = getTokenCenter(token2);

      // Use OBR's grid distance calculation which automatically handles different
      // map DPI settings and returns distance in grid units (not pixels).
      const distance = await OBR.scene.grid.getDistance(center1, center2);

      // Maximum allowed distance is 5 grid units
      const maxDistance = 5;

      console.log('[Proximity] Distance between token centers:', distance, 'grid units. Max:', maxDistance);
      return distance <= maxDistance;
    } catch (err) {
      console.error('[Proximity] Failed to check:', err);
      return false;
    }
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
    updateTheme,
    updateOverburdenedEffect,
    playerId,
    playerRole,
    playerClaimedTokenId,
    playerClaimedTokenInfo,
    claimToken,
    unclaimToken,
    unclaimTokenById,
    removeFavoriteById,
    canEditToken,
    checkProximity
  };
}

export type { ThemeColors };
