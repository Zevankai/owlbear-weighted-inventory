import { useEffect, useState, useCallback, useRef } from 'react';
import OBR, { buildShape, isImage } from '@owlbear-rodeo/sdk';
import type { Item as OBRItem } from '@owlbear-rodeo/sdk';
import type { CharacterData, TokenType, GMCustomizations } from '../types';
import { DEFAULT_CHARACTER_DATA } from '../constants';
import type { Vector2 } from '@owlbear-rodeo/sdk';
import { createDefaultExhaustionState, createDefaultRestHistory } from '../utils/characterStats';
import { loadCharacterData, saveCharacterData, getCampaignId } from '../services/storageService';

// Favorite entry type with token type for grouping
export interface FavoriteEntry {
  id: string;
  name: string;
  image?: string;
  tokenType?: TokenType;
}

// Store data on each token's own metadata (16KB per token, not shared!)
const TOKEN_DATA_KEY = 'com.weighted-inventory/data';
// Player favorites (stored in room metadata with player-specific keys)
const FAVORITES_KEY_PREFIX = 'com.weighted-inventory/favorites/';
// Over-encumbered visual effect attachment ID
const OVERBURDENED_ATTACHMENT_ID = 'com.weighted-inventory/overburdened-indicator';
// Legacy keys for migration
const LEGACY_ROOM_KEY = 'com.weighted-inventory/room-data';
const LEGACY_TOKEN_NAME_KEY_PREFIX = 'com.weighted-inventory/token/';
// GM customizations key (stored in room metadata)
const GM_CUSTOMIZATIONS_KEY = 'com.weighted-inventory/gm-customizations';

const getFavoritesKey = (playerId: string) => `${FAVORITES_KEY_PREFIX}${playerId}`;

// Helper to calculate the center position of a token (pure utility function)
const getTokenCenter = (token: OBRItem): Vector2 => {
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
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [theme, setTheme] = useState<ThemeColors>(DEFAULT_THEME);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<'GM' | 'PLAYER'>('PLAYER');
  const [playerClaimedTokenId, setPlayerClaimedTokenId] = useState<string | null>(null);
  const [playerClaimedTokenInfo, setPlayerClaimedTokenInfo] = useState<{name: string; image?: string} | null>(null);
  const [gmCustomizations, setGMCustomizations] = useState<GMCustomizations | null>(null);

  // Track auto-favorited tokens to avoid re-adding on every selection
  const autoFavoritedTokensRef = useRef<Set<string>>(new Set());

  // Helper to ensure tokenType exists (migration for existing tokens)
  const ensureTokenType = (data: CharacterData): CharacterData => {
    if (!data.tokenType) {
      return { ...data, tokenType: 'player' };
    }
    return data;
  };

  /**
   * Migrate character stats to ensure all new fields exist with proper defaults.
   * This is idempotent - running it multiple times produces the same result.
   * Returns the migrated data and a boolean indicating if changes were made.
   */
  const migrateCharacterStats = (data: CharacterData): { data: CharacterData; migrated: boolean } => {
    let migrated = false;
    let characterStats = data.characterStats;
    
    // Only migrate if characterStats exists (don't create it if not present)
    if (!characterStats) {
      return { data, migrated: false };
    }
    
    // Create a working copy of characterStats
    characterStats = { ...characterStats };
    
    // 1. Ensure exhaustion.maxLevels exists and is at least 10
    // Note: maxLevels of 0 is invalid (would mean no exhaustion levels), so we treat it as missing
    if (characterStats.exhaustion) {
      if (characterStats.exhaustion.maxLevels === undefined || 
          characterStats.exhaustion.maxLevels === null || 
          characterStats.exhaustion.maxLevels < 10) {
        characterStats.exhaustion = {
          ...characterStats.exhaustion,
          maxLevels: 10,
        };
        migrated = true;
        console.log('[Migration] Set exhaustion.maxLevels to 10');
      }
    } else {
      // Create default exhaustion state
      characterStats.exhaustion = createDefaultExhaustionState();
      migrated = true;
      console.log('[Migration] Created default exhaustion state');
    }
    
    // 2. Ensure restHistory exists with new fields
    if (characterStats.restHistory) {
      let restHistoryMigrated = false;
      const restHistory = { ...characterStats.restHistory };
      
      if (typeof restHistory.consecutiveWildernessRests !== 'number') {
        restHistory.consecutiveWildernessRests = 0;
        restHistoryMigrated = true;
        console.log('[Migration] Set restHistory.consecutiveWildernessRests to 0');
      }
      
      if (typeof restHistory.wildernessExhaustionBlocked !== 'boolean') {
        restHistory.wildernessExhaustionBlocked = false;
        restHistoryMigrated = true;
        console.log('[Migration] Set restHistory.wildernessExhaustionBlocked to false');
      }
      
      if (restHistoryMigrated) {
        characterStats.restHistory = restHistory;
        migrated = true;
      }
    } else {
      // Create default rest history
      characterStats.restHistory = createDefaultRestHistory();
      migrated = true;
      console.log('[Migration] Created default rest history');
    }
    
    // 3. Ensure superiorityDice exists with default { current: 0, max: 0 }
    // Note: We intentionally use 0/0 instead of createDefaultSuperiorityDice() which returns 4/4
    // because not all characters have superiority dice. 0/0 means the dice button won't show
    // in the UI until the GM/player sets a max value > 0. This is per the issue requirements.
    if (!characterStats.superiorityDice) {
      characterStats.superiorityDice = { current: 0, max: 0 };
      migrated = true;
      console.log('[Migration] Created default superiorityDice { current: 0, max: 0 }');
    }
    
    // Note: Do NOT force-create hitDice per requirements
    
    if (migrated) {
      return { data: { ...data, characterStats }, migrated: true };
    }
    
    return { data, migrated: false };
  };

  // Check for and migrate legacy data
  const migrateLegacyData = async (token: OBRItem): Promise<CharacterData | null> => {
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

  const handleSelection = useCallback(async (token: OBRItem) => {
    const name = token.name || 'Unnamed';
    console.log('[handleSelection] Selected token:', name, 'ID:', token.id);
    setTokenId(token.id);
    setTokenName(name);
    setTokenImage((token as any).image?.url || null);

    // Try to load from Vercel Blob storage (with OBR metadata fallback handled by storageService)
    let data: CharacterData | null = null;
    try {
      const campaignId = await getCampaignId();
      data = await loadCharacterData(campaignId, token.id);
      console.log('[handleSelection] Loaded from storage service:', data ? `${data.inventory?.length || 0} items` : 'null');
    } catch (error) {
      console.error('[handleSelection] Error loading from storage service:', error);
    }

    // If still no data, check for legacy formats to migrate
    if (!data) {
      console.log('[handleSelection] No data found, checking legacy...');
      data = await migrateLegacyData(token);
    }

    const finalData = data || DEFAULT_CHARACTER_DATA;
    
    // Migration: ensure tokenType exists (default to 'player' for existing tokens)
    let migratedData = ensureTokenType(finalData);
    let needsPersist = migratedData !== finalData;
    if (needsPersist) {
      console.log('[Migration] Added default tokenType "player" to token data');
    }
    
    // Migration: ensure characterStats has all required fields
    const { data: statsMigratedData, migrated: statsMigrated } = migrateCharacterStats(migratedData);
    if (statsMigrated) {
      migratedData = statsMigratedData;
      needsPersist = true;
    }
    
    // Migration: ensure migratedToBlob flag is set for tokens that have data
    // This handles existing tokens that haven't been marked yet
    // Only set the flag if we actually loaded data (not using default)
    if (data && !migratedData.migratedToBlob) {
      console.log('[Migration] Setting migratedToBlob flag for existing token');
      migratedData = { ...migratedData, migratedToBlob: true };
      needsPersist = true;
    }
    
    // Persist migration changes using storage service if any changes were made
    if (needsPersist) {
      console.log('[Migration] Persisting migration changes via storage service');
      try {
        const campaignId = await getCampaignId();
        await saveCharacterData(campaignId, token.id, migratedData);
        console.log('[Migration] Persisted successfully');
      } catch (err) {
        console.error('[Migration] Failed to persist changes:', err);
      }
    }
    
    setCharacterData(migratedData);

    // Load theme from token data (per-token theme, not per-player)
    if (migratedData.theme) {
      setTheme(migratedData.theme);
      console.log('[Theme] Loaded token theme:', migratedData.theme);
    } else {
      setTheme(DEFAULT_THEME);
      console.log('[Theme] Using default theme for this token');
    }

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

      // Load GM customizations from room metadata
      const savedGMCustomizations = roomMetadata[GM_CUSTOMIZATIONS_KEY] as GMCustomizations | undefined;
      if (savedGMCustomizations && mounted) {
        setGMCustomizations(savedGMCustomizations);
        console.log('[GM Customizations] Loaded from room metadata');
      }

      // Theme is now loaded from token metadata (per-token), not room metadata (per-player)
      // It will be set when a token is selected in handleSelection

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
          // Apply migrations for synced data (but don't persist - the owning player will handle that)
          const withTokenType = ensureTokenType(newData);
          const { data: statsMigratedData } = migrateCharacterStats(withTokenType);
          setCharacterData(statsMigratedData);
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

  // Auto-favorite Lore and NPC tokens for GM
  // Use a ref to track favorites for the check to avoid circular dependency
  const favoritesRef = useRef<FavoriteEntry[]>([]);
  favoritesRef.current = favorites;
  
  useEffect(() => {
    const autoFavorite = async () => {
      // Only auto-favorite for GMs viewing lore or NPC tokens
      if (playerRole !== 'GM' || !tokenId || !tokenName || !characterData) return;
      
      // Check if this is a lore or NPC token
      const tokenType = characterData.tokenType;
      if (tokenType !== 'lore' && tokenType !== 'npc') return;
      
      // Check if already favorited or already auto-favorited this session
      // Use ref to get current favorites without adding to dependencies
      const isAlreadyFavorited = favoritesRef.current.some(f => f.id === tokenId);
      if (isAlreadyFavorited) return;
      if (autoFavoritedTokensRef.current.has(tokenId)) return;
      
      // Auto-add to favorites
      console.log('[AutoFavorite] Auto-adding', tokenType, 'token:', tokenName);
      autoFavoritedTokensRef.current.add(tokenId);
      
      const newFavorite: FavoriteEntry = {
        id: tokenId,
        name: tokenName,
        image: tokenImage || undefined,
        tokenType: tokenType
      };
      
      const newFavorites = [...favoritesRef.current, newFavorite];
      setFavorites(newFavorites);
      
      // Save to room metadata
      const currentPlayerId = await OBR.player.getId();
      const favoritesKey = getFavoritesKey(currentPlayerId);
      await OBR.room.setMetadata({ [favoritesKey]: newFavorites });
      console.log('[AutoFavorite] Added to favorites');
    };
    
    autoFavorite();
  }, [tokenId, tokenName, tokenImage, characterData, playerRole]);

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

    // Save using storage service (hybrid approach: Vercel Blob + OBR metadata cache)
    try {
      const items = await OBR.scene.items.getItems([idToSave]);
      if (items.length === 0) {
        console.error('[updateData] Token not found');
        return;
      }

      const currentData = items[0].metadata[TOKEN_DATA_KEY] as CharacterData | undefined || DEFAULT_CHARACTER_DATA;
      const mergedData = { ...currentData, ...updates };
      console.log('[updateData] Saving merged data, size:', JSON.stringify(mergedData).length, 'bytes');

      const campaignId = await getCampaignId();
      const success = await saveCharacterData(campaignId, idToSave, mergedData);

      if (success) {
        console.log('[updateData] SUCCESS - saved via storage service');
      } else {
        console.error('[updateData] FAILED - storage service returned false');
      }
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
    let newFavorites: FavoriteEntry[];

    if (isFavorited) {
      // Remove from favorites
      console.log('[Favorites] Removing', tokenName, 'from favorites');
      newFavorites = favorites.filter(f => f.id !== tokenId);
    } else {
      // Add to favorites (include tokenType)
      console.log('[Favorites] Adding', tokenName, 'to favorites');
      newFavorites = [...favorites, { 
        id: tokenId, 
        name: tokenName, 
        image: tokenImage || undefined,
        tokenType: characterData?.tokenType || 'player'
      }];
    }

    console.log('[Favorites] New favorites list:', newFavorites);
    setFavorites(newFavorites);

    // Save to room metadata with player-specific key
    const currentPlayerId = await OBR.player.getId();
    const favoritesKey = getFavoritesKey(currentPlayerId);
    console.log('[Favorites] Saving to room metadata with key:', favoritesKey);
    await OBR.room.setMetadata({ [favoritesKey]: newFavorites });
    console.log('[Favorites] Save complete');
  }, [tokenId, tokenName, tokenImage, favorites, characterData?.tokenType]);

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

  // Update theme (now saved to token metadata, not room metadata)
  const updateTheme = useCallback(async (newTheme: ThemeColors) => {
    if (!tokenId) return;

    setTheme(newTheme);

    // Save theme to token's character data
    await updateData({ theme: newTheme });
    console.log('[Theme] Saved theme to token:', newTheme);
  }, [tokenId, updateData]);

  // Update GM customizations (stored in room metadata)
  const updateGMCustomizations = useCallback(async (updates: Partial<GMCustomizations>) => {
    const currentCustomizations = gmCustomizations || {
      customRaces: [],
      customClasses: [],
      customRestOptions: [],
      modifiedRestOptions: {},
      disabledRestOptions: [],
      exhaustionEffects: [],
      overencumberedText: '',
      restRulesMessage: ''
    };
    
    const newCustomizations = { ...currentCustomizations, ...updates };
    setGMCustomizations(newCustomizations);
    
    // Save to room metadata
    await OBR.room.setMetadata({ [GM_CUSTOMIZATIONS_KEY]: newCustomizations });
    console.log('[GM Customizations] Saved to room metadata');
  }, [gmCustomizations]);

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

    // NPC tokens: GM only (players cannot edit)
    if (characterData.tokenType === 'npc') return false;

    // Party tokens: everyone can edit
    if (characterData.tokenType === 'party') return true;

    // Lore tokens: GM only (players can view but not edit)
    if (characterData.tokenType === 'lore') return false;

    // Player tokens (default): must be claimed by this player, or unclaimed
    if (!characterData.claimedBy) return true;
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
    checkProximity,
    gmCustomizations,
    updateGMCustomizations
  };
}

export type { ThemeColors };
