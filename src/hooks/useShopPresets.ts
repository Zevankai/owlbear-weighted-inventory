/**
 * Shop Presets Hook
 * 
 * Manages shop preset state and provides CRUD operations.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ShopPreset } from '../types';
import { loadShopPresets, saveShopPresets, getCampaignId } from '../services/storageService';

interface UseShopPresetsResult {
  presets: ShopPreset[];
  loading: boolean;
  error: string | null;
  addPreset: (preset: ShopPreset) => Promise<boolean>;
  updatePreset: (preset: ShopPreset) => Promise<boolean>;
  deletePreset: (presetId: string) => Promise<boolean>;
  refreshPresets: () => Promise<void>;
}

export function useShopPresets(): UseShopPresetsResult {
  const [presets, setPresets] = useState<ShopPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Load campaign ID and presets on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const id = await getCampaignId();
        setCampaignId(id);
        
        const loadedPresets = await loadShopPresets(id);
        setPresets(loadedPresets);
        
        console.log('[useShopPresets] Loaded presets:', loadedPresets.length);
      } catch (err) {
        console.error('[useShopPresets] Error loading presets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load presets');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh presets from storage
  const refreshPresets = useCallback(async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const loadedPresets = await loadShopPresets(campaignId);
      setPresets(loadedPresets);
      
      console.log('[useShopPresets] Refreshed presets:', loadedPresets.length);
    } catch (err) {
      console.error('[useShopPresets] Error refreshing presets:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh presets');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Add a new preset
  const addPreset = useCallback(async (preset: ShopPreset): Promise<boolean> => {
    if (!campaignId) {
      console.error('[useShopPresets] No campaign ID available');
      return false;
    }

    try {
      const updatedPresets = [...presets, preset];
      const success = await saveShopPresets(campaignId, updatedPresets);
      
      if (success) {
        setPresets(updatedPresets);
        console.log('[useShopPresets] Added preset:', preset.name);
      }
      
      return success;
    } catch (err) {
      console.error('[useShopPresets] Error adding preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to add preset');
      return false;
    }
  }, [campaignId, presets]);

  // Update an existing preset
  const updatePreset = useCallback(async (preset: ShopPreset): Promise<boolean> => {
    if (!campaignId) {
      console.error('[useShopPresets] No campaign ID available');
      return false;
    }

    try {
      const updatedPresets = presets.map((p) => 
        p.id === preset.id ? preset : p
      );
      const success = await saveShopPresets(campaignId, updatedPresets);
      
      if (success) {
        setPresets(updatedPresets);
        console.log('[useShopPresets] Updated preset:', preset.name);
      }
      
      return success;
    } catch (err) {
      console.error('[useShopPresets] Error updating preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preset');
      return false;
    }
  }, [campaignId, presets]);

  // Delete a preset
  const deletePreset = useCallback(async (presetId: string): Promise<boolean> => {
    if (!campaignId) {
      console.error('[useShopPresets] No campaign ID available');
      return false;
    }

    try {
      const updatedPresets = presets.filter((p) => p.id !== presetId);
      const success = await saveShopPresets(campaignId, updatedPresets);
      
      if (success) {
        setPresets(updatedPresets);
        console.log('[useShopPresets] Deleted preset:', presetId);
      }
      
      return success;
    } catch (err) {
      console.error('[useShopPresets] Error deleting preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
      return false;
    }
  }, [campaignId, presets]);

  return {
    presets,
    loading,
    error,
    addPreset,
    updatePreset,
    deletePreset,
    refreshPresets,
  };
}
