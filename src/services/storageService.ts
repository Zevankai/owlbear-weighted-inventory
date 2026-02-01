/**
 * Storage Service for Vercel Blob Storage
 * 
 * Provides functions to save/load character data and custom repositories
 * to/from Vercel Blob storage with graceful fallback to OBR metadata.
 */

import type { CharacterData } from '../types';
import type { RepoItem } from '../data/repository';
import type { RepositorySpell } from '../types';
import OBR from '@owlbear-rodeo/sdk';

const TOKEN_DATA_KEY = 'com.weighted-inventory/data';

// API base URL - will be the same origin in production
const getApiBaseUrl = (): string => {
  // In development, this might need to be configured
  // In production on Vercel, API routes are at /api
  return window.location.origin;
};

/**
 * Extract error message from API response
 */
const extractErrorMessage = async (response: Response): Promise<string> => {
  let errorMessage = `HTTP ${response.status}`;
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
    console.error('[StorageService] API error response:', errorData);
  } catch {
    // If response body isn't JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }
  return errorMessage;
};

/**
 * Get the campaign ID from OBR room ID
 */
export const getCampaignId = async (): Promise<string> => {
  return await OBR.room.id;
};

/**
 * Character Data Storage
 */

/**
 * Load character data from Vercel Blob storage
 * Falls back to OBR metadata if blob storage fails
 */
export const loadCharacterData = async (
  campaignId: string,
  tokenId: string
): Promise<CharacterData | null> => {
  try {
    const url = `${getApiBaseUrl()}/api/characters/${campaignId}/${tokenId}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      console.log('[StorageService] Loaded character data from Vercel Blob');
      return data as CharacterData;
    }

    if (response.status === 404) {
      console.log('[StorageService] No character data in Vercel Blob');
      return null;
    }

    throw new Error(`Failed to load character data: ${response.statusText}`);
  } catch (error) {
    console.error('[StorageService] Error loading from Vercel Blob, falling back to OBR metadata:', error);
    // Fallback to OBR metadata
    try {
      const items = await OBR.scene.items.getItems([tokenId]);
      if (items.length > 0) {
        const data = items[0].metadata[TOKEN_DATA_KEY] as CharacterData | undefined;
        if (data) {
          console.log('[StorageService] Loaded character data from OBR metadata (fallback)');
          return data;
        }
      }
    } catch (obrError) {
      console.error('[StorageService] Failed to load from OBR metadata:', obrError);
    }
    return null;
  }
};

/**
 * Save character data to Vercel Blob storage
 * Also updates OBR metadata as cache
 */
export const saveCharacterData = async (
  campaignId: string,
  tokenId: string,
  data: CharacterData
): Promise<boolean> => {
  let blobSaveSuccess = false;

  // Try to save to Vercel Blob
  try {
    const url = `${getApiBaseUrl()}/api/characters/${campaignId}/${tokenId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('[StorageService] Saved character data to Vercel Blob');
      blobSaveSuccess = true;
    } else {
      throw new Error(`Failed to save character data: ${response.statusText}`);
    }
  } catch (error) {
    console.error('[StorageService] Error saving to Vercel Blob:', error);
  }

  // Always update OBR metadata as cache (and fallback)
  try {
    await OBR.scene.items.updateItems([tokenId], (items) => {
      items[0].metadata[TOKEN_DATA_KEY] = data;
    });
    console.log('[StorageService] Saved character data to OBR metadata (cache)');
  } catch (error) {
    console.error('[StorageService] Failed to save to OBR metadata:', error);
    // If blob save failed AND OBR save failed, return false
    if (!blobSaveSuccess) {
      return false;
    }
  }

  return true;
};

/**
 * Delete character data from Vercel Blob storage
 * Also clears OBR metadata
 */
export const deleteCharacterData = async (
  campaignId: string,
  tokenId: string
): Promise<boolean> => {
  let success = true;

  // Try to delete from Vercel Blob
  try {
    const url = `${getApiBaseUrl()}/api/characters/${campaignId}/${tokenId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('[StorageService] Deleted character data from Vercel Blob');
    } else {
      throw new Error(`Failed to delete character data: ${response.statusText}`);
    }
  } catch (error) {
    console.error('[StorageService] Error deleting from Vercel Blob:', error);
    success = false;
  }

  // Clear OBR metadata
  try {
    await OBR.scene.items.updateItems([tokenId], (items) => {
      delete items[0].metadata[TOKEN_DATA_KEY];
    });
    console.log('[StorageService] Cleared character data from OBR metadata');
  } catch (error) {
    console.error('[StorageService] Failed to clear OBR metadata:', error);
    success = false;
  }

  return success;
};

/**
 * Custom Repository Storage
 */

/**
 * Load custom items for a campaign
 */
export const loadCustomItems = async (campaignId: string): Promise<RepoItem[]> => {
  const url = `${getApiBaseUrl()}/api/repositories/${campaignId}/items`;
  
  console.log('[StorageService] Loading custom items:', {
    campaignId,
    url,
  });

  try {
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      console.log('[StorageService] Loaded custom items from Vercel Blob:', data.length);
      return data as RepoItem[];
    }

    if (response.status === 404) {
      console.log('[StorageService] No custom items found');
      return [];
    }

    const errorMessage = await extractErrorMessage(response);
    throw new Error(`Failed to load custom items: ${errorMessage}`);
  } catch (error) {
    console.error('[StorageService] Error loading custom items:', error);
    return [];
  }
};

/**
 * Save custom items for a campaign
 */
export const saveCustomItems = async (
  campaignId: string,
  items: RepoItem[]
): Promise<boolean> => {
  const url = `${getApiBaseUrl()}/api/repositories/${campaignId}/items`;
  
  console.log('[StorageService] Saving custom items:', {
    campaignId,
    itemCount: items.length,
    payloadSize: JSON.stringify(items).length,
  });

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[StorageService] Saved custom items to Vercel Blob:', result);
      return true;
    }

    const errorMessage = await extractErrorMessage(response);
    throw new Error(`Failed to save custom items: ${errorMessage}`);
  } catch (error) {
    console.error('[StorageService] Error saving custom items:', error);
    return false;
  }
};

/**
 * Load custom spells for a campaign
 */
export const loadCustomSpells = async (campaignId: string): Promise<RepositorySpell[]> => {
  const url = `${getApiBaseUrl()}/api/repositories/${campaignId}/spells`;
  
  console.log('[StorageService] Loading custom spells:', {
    campaignId,
    url,
  });

  try {
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      console.log('[StorageService] Loaded custom spells from Vercel Blob:', data.length);
      return data as RepositorySpell[];
    }

    if (response.status === 404) {
      console.log('[StorageService] No custom spells found');
      return [];
    }

    const errorMessage = await extractErrorMessage(response);
    throw new Error(`Failed to load custom spells: ${errorMessage}`);
  } catch (error) {
    console.error('[StorageService] Error loading custom spells:', error);
    return [];
  }
};

/**
 * Save custom spells for a campaign
 */
export const saveCustomSpells = async (
  campaignId: string,
  spells: RepositorySpell[]
): Promise<boolean> => {
  const url = `${getApiBaseUrl()}/api/repositories/${campaignId}/spells`;
  
  console.log('[StorageService] Saving custom spells:', {
    campaignId,
    spellCount: spells.length,
    payloadSize: JSON.stringify(spells).length,
  });

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spells),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[StorageService] Saved custom spells to Vercel Blob:', result);
      return true;
    }

    const errorMessage = await extractErrorMessage(response);
    throw new Error(`Failed to save custom spells: ${errorMessage}`);
  } catch (error) {
    console.error('[StorageService] Error saving custom spells:', error);
    return false;
  }
};
