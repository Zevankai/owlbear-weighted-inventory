/**
 * Repository Context Provider
 * 
 * Manages custom items and spells that are merged with built-in repositories.
 * Loads custom repositories on initialization and provides them to the app.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ITEM_REPOSITORY } from '../data/repository';
import type { RepoItem } from '../data/repository';
import { SPELL_REPOSITORY } from '../data/spellRepository';
import { loadCustomItems, loadCustomSpells, saveCustomItems, saveCustomSpells, getCampaignId } from '../services/storageService';
import type { RepositorySpell } from '../types';

interface RepositoryContextType {
  // Merged repositories (built-in + custom)
  itemRepository: RepoItem[];
  spellRepository: RepositorySpell[];
  
  // Custom items/spells only
  customItems: RepoItem[];
  customSpells: RepositorySpell[];
  
  // Functions to add custom items/spells
  addCustomItem: (item: RepoItem) => Promise<boolean>;
  addCustomSpell: (spell: RepositorySpell) => Promise<boolean>;
  
  // Functions to update custom items/spells
  updateCustomItems: (items: RepoItem[]) => Promise<boolean>;
  updateCustomSpells: (spells: RepositorySpell[]) => Promise<boolean>;
  
  // Loading state
  loading: boolean;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const useRepository = () => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};

interface RepositoryProviderProps {
  children: ReactNode;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ children }) => {
  const [customItems, setCustomItems] = useState<RepoItem[]>([]);
  const [customSpells, setCustomSpells] = useState<RepositorySpell[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Load custom repositories on mount
  useEffect(() => {
    const loadCustomRepositories = async () => {
      try {
        const id = await getCampaignId();
        setCampaignId(id);
        
        const [items, spells] = await Promise.all([
          loadCustomItems(id),
          loadCustomSpells(id)
        ]);
        
        setCustomItems(items);
        setCustomSpells(spells);
        console.log('[RepositoryProvider] Loaded custom repositories:', {
          items: items.length,
          spells: spells.length
        });
      } catch (error) {
        console.error('[RepositoryProvider] Error loading custom repositories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomRepositories();
  }, []);

  // Merge built-in and custom repositories
  const itemRepository = [...ITEM_REPOSITORY, ...customItems];
  const spellRepository = [...SPELL_REPOSITORY, ...customSpells];

  const addCustomItem = async (item: RepoItem): Promise<boolean> => {
    if (!campaignId) return false;
    
    const newCustomItems = [...customItems, item];
    const success = await saveCustomItems(campaignId, newCustomItems);
    
    if (success) {
      setCustomItems(newCustomItems);
      console.log('[RepositoryProvider] Added custom item:', item.name);
    }
    
    return success;
  };

  const addCustomSpell = async (spell: RepositorySpell): Promise<boolean> => {
    if (!campaignId) return false;
    
    const newCustomSpells = [...customSpells, spell];
    const success = await saveCustomSpells(campaignId, newCustomSpells);
    
    if (success) {
      setCustomSpells(newCustomSpells);
      console.log('[RepositoryProvider] Added custom spell:', spell.name);
    }
    
    return success;
  };

  const updateCustomItems = async (items: RepoItem[]): Promise<boolean> => {
    if (!campaignId) return false;
    
    const success = await saveCustomItems(campaignId, items);
    
    if (success) {
      setCustomItems(items);
      console.log('[RepositoryProvider] Updated custom items');
    }
    
    return success;
  };

  const updateCustomSpells = async (spells: RepositorySpell[]): Promise<boolean> => {
    if (!campaignId) return false;
    
    const success = await saveCustomSpells(campaignId, spells);
    
    if (success) {
      setCustomSpells(spells);
      console.log('[RepositoryProvider] Updated custom spells');
    }
    
    return success;
  };

  return (
    <RepositoryContext.Provider
      value={{
        itemRepository,
        spellRepository,
        customItems,
        customSpells,
        addCustomItem,
        addCustomSpell,
        updateCustomItems,
        updateCustomSpells,
        loading,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};
