import React, { useState, useEffect, Fragment } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

// Data & Types
import { useInventory } from './hooks/useInventory';
import { usePackLogic } from './hooks/usePackLogic';
import { ITEM_CATEGORIES, DEFAULT_CATEGORY_WEIGHTS, PACK_DEFINITIONS, STORAGE_DEFINITIONS } from './constants';
import { ITEM_REPOSITORY } from './data/repository';
import type { Item, ItemCategory, StorageType, CharacterData, Vault, Currency, ActiveTrade, Tab } from './types';
import { ACTIVE_TRADE_KEY } from './constants';

// Utilities
import { hexToRgb } from './utils/color';
import {
  getTotalCopperPieces,
  deductCopperPieces,
  addCopperPieces,
} from './utils/currency';
import { calculateP2PCost } from './utils/trade';

// Components
import { GMOverviewTab } from './components/tabs/GMOverviewTab';
import { TradeTab } from './components/tabs/TradeTab';
import { HomeTab } from './components/tabs/HomeTab';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [ready, setReady] = useState(false);

  // State for External Storage Viewing
  const [viewingStorageId, setViewingStorageId] = useState<string | null>(null);

  // State for viewing favorites
  const [viewingFavorites, setViewingFavorites] = useState(false);

  // 1. Load Inventory Data
  const {
    tokenId, tokenName, tokenImage, characterData, updateData, loading,
    favorites, isFavorited, toggleFavorite, loadTokenById, theme, updateTheme,
    updateOverburdenedEffect, playerId, playerRole, playerClaimedTokenId,
    claimToken, unclaimToken, canEditToken, checkProximity
  } = useInventory();

  // Apply theme colors to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-gold', theme.accent);
    document.documentElement.style.setProperty('--bg-dark', theme.background);
    // Calculate lighter/darker variants
    const accentRgb = hexToRgb(theme.accent);
    const bgRgb = hexToRgb(theme.background);
    if (accentRgb) {
      document.documentElement.style.setProperty('--border-bright', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.3)`);
    }
    if (bgRgb) {
      document.documentElement.style.setProperty('--bg-panel', `rgba(${Math.min(bgRgb.r + 20, 255)}, ${Math.min(bgRgb.g + 20, 255)}, ${Math.min(bgRgb.b + 20, 255)}, 0.7)`);
      // Set navbar background based on theme background
      document.documentElement.style.setProperty('--nav-bg', `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.8)`);
    }
  }, [theme]);

  // --- VIRTUAL CONTEXT SWITCHING ---
  // Determine which data object we are currently viewing (Player or a specific Storage)
  const currentDisplayData: CharacterData | null = (() => {
    if (!characterData) return null;
    
    // FIX: Define defaults for safety against old data
    const safeCurrency = characterData.currency || { cp: 0, sp: 0, gp: 0, pp: 0 };
    const safeInventory = characterData.inventory || [];

    if (!viewingStorageId) {
        return { ...characterData, inventory: safeInventory, currency: safeCurrency };
    }

    const storage = characterData.externalStorages.find(s => s.id === viewingStorageId);
    if (!storage) return { ...characterData, inventory: safeInventory, currency: safeCurrency };

    return {
        ...characterData, 
        packType: 'NPC', 
        inventory: storage.inventory || [],
        currency: storage.currency || { cp: 0, sp: 0, gp: 0, pp: 0 },
        condition: storage.description || '', 
    };
  })();

  const stats = usePackLogic(currentDisplayData);

  // Update over-encumbered visual effect when weight changes
  useEffect(() => {
    if (stats?.isOverburdened !== undefined) {
      updateOverburdenedEffect(stats.isOverburdened);
    }
  }, [stats?.isOverburdened, updateOverburdenedEffect]);

  // Form States
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '', category: 'Other', type: 'Gear', weight: 1, qty: 1, value: '', properties: '', requiresAttunement: false,
  });
  const [repoSearch, setRepoSearch] = useState('');
  const [showRepo, setShowRepo] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const [newStorage, setNewStorage] = useState<{name: string; description: string; type: StorageType}>({
      name: '', description: '', type: 'Small Pet'
  });

  const [newVaultName, setNewVaultName] = useState('');

  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Edit item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Trading state
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false); // Prevent duplicate trade execution
  // P2P trading state
  const [player1Items, setPlayer1Items] = useState<Item[]>([]);
  const [player2Items, setPlayer2Items] = useState<Item[]>([]);
  const [otherPlayerData, setOtherPlayerData] = useState<CharacterData | null>(null);
  // Coin offers for P2P trading
  const [player1CoinsOffered, setPlayer1CoinsOffered] = useState<Currency>({ cp: 0, sp: 0, gp: 0, pp: 0 });
  const [player2CoinsOffered, setPlayer2CoinsOffered] = useState<Currency>({ cp: 0, sp: 0, gp: 0, pp: 0 });
  // Player's claimed token info
  const [playerClaimedTokenName, setPlayerClaimedTokenName] = useState<string | null>(null);

  useEffect(() => {
    OBR.onReady(() => setReady(true));
  }, []);

  // Load active trade from room metadata
  useEffect(() => {
    if (!ready) return;

    const loadTradeData = async () => {
      const metadata = await OBR.room.getMetadata();
      const trade = metadata[ACTIVE_TRADE_KEY] as ActiveTrade | undefined;

      console.log('[TRADE POLL] Active trade:', trade ? `P2P (${trade.status})` : 'null');
      
      if (trade) {
        setActiveTrade(trade);
        // Load coin offers from the trade
        setPlayer1CoinsOffered(trade.player1CoinsOffered || { cp: 0, sp: 0, gp: 0, pp: 0 });
        setPlayer2CoinsOffered(trade.player2CoinsOffered || { cp: 0, sp: 0, gp: 0, pp: 0 });
        
        // Load items from trade
        const p1Items: Item[] = [];
        const p2Items: Item[] = [];
        trade.itemsToTrade.forEach(tradeItem => {
          if (tradeItem.source === 'player1') {
            p1Items.push(tradeItem.item);
          } else if (tradeItem.source === 'player2') {
            p2Items.push(tradeItem.item);
          }
        });
        setPlayer1Items(p1Items);
        setPlayer2Items(p2Items);
      } else {
        setActiveTrade(null);
        setPlayer1Items([]);
        setPlayer2Items([]);
        setPlayer1CoinsOffered({ cp: 0, sp: 0, gp: 0, pp: 0 });
        setPlayer2CoinsOffered({ cp: 0, sp: 0, gp: 0, pp: 0 });
      }
    };

    loadTradeData();

    // Poll for changes to trade data every 2 seconds
    const interval = setInterval(loadTradeData, 2000);

    return () => clearInterval(interval);
  }, [ready]);

  // Load player's claimed token name
  useEffect(() => {
    if (!playerClaimedTokenId) {
      setPlayerClaimedTokenName(null);
      return;
    }

    const loadClaimedTokenData = async () => {
      try {
        const tokens = await OBR.scene.items.getItems([playerClaimedTokenId]);
        if (tokens.length > 0) {
          setPlayerClaimedTokenName(tokens[0].name || 'My Token');
        }
      } catch (err) {
        console.error('Failed to load claimed token data:', err);
      }
    };

    loadClaimedTokenData();

    // Refresh every 2 seconds to catch changes
    const interval = setInterval(loadClaimedTokenData, 2000);
    return () => clearInterval(interval);
  }, [playerClaimedTokenId]);

  // Load other player's data for P2P trades (relative to current player)
  useEffect(() => {
    if (!activeTrade || !playerId) {
      setOtherPlayerData(null);
      return;
    }

    const loadOtherPlayerData = async () => {
      try {
        // Determine which token ID belongs to the "other" player
        const isPlayer1 = activeTrade.player1Id === playerId;
        const otherTokenId = isPlayer1 ? activeTrade.player2TokenId : activeTrade.player1TokenId;
        
        if (!otherTokenId) {
          setOtherPlayerData(null);
          return;
        }

        const tokens = await OBR.scene.items.getItems([otherTokenId]);
        if (tokens.length > 0) {
          const data = tokens[0].metadata['com.weighted-inventory/data'] as CharacterData;
          setOtherPlayerData(data);
        }
      } catch (err) {
        console.error('Failed to load other player data:', err);
      }
    };

    loadOtherPlayerData();
  }, [activeTrade, playerId]);

  // Debug functions
  const loadDebugInfo = async () => {
    // Get room metadata
    const roomMetadata = await OBR.room.getMetadata();
    const roomKeys = Object.keys(roomMetadata);
    const roomSize = JSON.stringify(roomMetadata).length;

    // Get current token metadata if selected
    let tokenSize = 0;
    let tokenDataSize = 0;
    let hasLegacyRoomData = false;
    let hasLegacyNameKeys = false;

    if (tokenId) {
      const items = await OBR.scene.items.getItems([tokenId]);
      if (items.length > 0) {
        tokenSize = JSON.stringify(items[0].metadata).length;
        const tokenData = items[0].metadata['com.weighted-inventory/data'];
        if (tokenData) {
          tokenDataSize = JSON.stringify(tokenData).length;
        }
      }
    }

    // Check for legacy data
    const legacyKey = 'com.weighted-inventory/room-data';
    hasLegacyRoomData = !!roomMetadata[legacyKey];

    // Check for legacy per-name keys
    const legacyNameKeys = roomKeys.filter(k => k.startsWith('com.weighted-inventory/token/'));
    hasLegacyNameKeys = legacyNameKeys.length > 0;

    setDebugInfo({
      roomKeys,
      roomSize,
      tokenSize,
      tokenDataSize,
      hasLegacyRoomData,
      hasLegacyNameKeys,
      legacyNameKeys
    });
  };

  const cleanupLegacyData = async () => {
    if (!debugInfo?.hasLegacyRoomData && !debugInfo?.hasLegacyNameKeys) {
      alert('No legacy data to clean up!');
      return;
    }

    const confirmed = window.confirm('This will delete old room-based storage keys. Token data has already been migrated. Continue?');
    if (!confirmed) return;

    const updates: Record<string, undefined> = {};

    // Remove old shared key
    if (debugInfo.hasLegacyRoomData) {
      updates['com.weighted-inventory/room-data'] = undefined;
    }

    // Remove old per-name keys
    if (debugInfo.hasLegacyNameKeys && debugInfo.legacyNameKeys) {
      debugInfo.legacyNameKeys.forEach((key: string) => {
        updates[key] = undefined;
      });
    }

    await OBR.room.setMetadata(updates);
    alert('Legacy data cleaned up! Room metadata freed.');
    loadDebugInfo();
  };

  // --- CORE UPDATE HANDLER ---
  const handleUpdateData = (updates: Partial<CharacterData>) => {
      if (!characterData) return;

      if (viewingStorageId) {
          const newStorages = characterData.externalStorages.map(s => {
              if (s.id !== viewingStorageId) return s;
              return {
                  ...s,
                  inventory: updates.inventory !== undefined ? updates.inventory : s.inventory,
                  currency: updates.currency !== undefined ? updates.currency : (s.currency || {cp:0, sp:0, gp:0, pp:0}),
                  description: updates.condition !== undefined ? updates.condition : s.description,
              };
          });
          updateData({ externalStorages: newStorages });

      } else {
          const safeUpdates = { ...updates };
          if (!safeUpdates.currency && !characterData.currency) {
              safeUpdates.currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
          }
          updateData(safeUpdates);
      }
  };

  // --- HELPER ACTIONS ---
  const handleCreateItem = () => {
    if (!newItem.name || !currentDisplayData) return;
    const createdItem: Item = {
      id: uuidv4(), name: newItem.name, category: newItem.category as ItemCategory, type: newItem.type || 'Gear', weight: newItem.weight || 0, qty: newItem.qty || 1, value: newItem.value || '', properties: newItem.properties || '', requiresAttunement: newItem.requiresAttunement || false, isAttuned: false, notes: '', ac: newItem.ac, damage: newItem.damage, equippedSlot: null, charges: newItem.charges, maxCharges: newItem.maxCharges, damageModifier: newItem.damageModifier, hitModifier: newItem.hitModifier
    };
    handleUpdateData({ inventory: [...currentDisplayData.inventory, createdItem] });
    setNewItem({ name: '', category: 'Other', type: 'Gear', weight: 1, qty: 1, value: '', properties: '', requiresAttunement: false });
    alert("Item Created in " + (viewingStorageId ? "Storage" : "Player Inventory"));
  };

  const handleDelete = (itemId: string) => {
    if (!currentDisplayData) return;
    if (window.confirm("Delete this item?")) {
      handleUpdateData({ inventory: currentDisplayData.inventory.filter(i => i.id !== itemId) });
    }
  };

  const handleSell = (item: Item) => {
    if (!currentDisplayData) return;
    const qtyToSellStr = window.prompt(`How many "${item.name}" to sell? (Max: ${item.qty})`, "1");
    if (!qtyToSellStr) return;
    const qtyToSell = parseInt(qtyToSellStr);
    if (isNaN(qtyToSell) || qtyToSell <= 0 || qtyToSell > item.qty) return;

    const valueStr = item.value.toLowerCase();
    let coinType: 'cp' | 'sp' | 'gp' | 'pp' = 'gp';
    if (valueStr.includes('pp')) coinType = 'pp'; else if (valueStr.includes('sp')) coinType = 'sp'; else if (valueStr.includes('cp')) coinType = 'cp';

    const unitValue = parseFloat(valueStr.replace(/[^0-9.]/g, '')) || 0;
    const finalPriceStr = window.prompt(`Selling ${qtyToSell} x ${item.name}.\nTotal Value (${coinType}):`, (unitValue * qtyToSell).toString());
    if (finalPriceStr === null) return;
    const finalPrice = parseFloat(finalPriceStr) || 0;

    const newInventory = currentDisplayData.inventory.map(i => i.id === item.id ? { ...i, qty: i.qty - qtyToSell } : i).filter(i => i.qty > 0);
    const newCurrency = { ...currentDisplayData.currency };
    newCurrency[coinType] = (newCurrency[coinType] || 0) + finalPrice;
    handleUpdateData({ inventory: newInventory, currency: newCurrency });
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (targetItemId: string) => {
    if (!currentDisplayData || !draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    const items = currentDisplayData.inventory;
    const draggedIndex = items.findIndex(i => i.id === draggedItemId);
    const targetIndex = items.findIndex(i => i.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null);
      return;
    }

    // Reorder the array
    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    handleUpdateData({ inventory: newItems });
    setDraggedItemId(null);
  };

  const handleToggleEquip = (item: Item) => {
    if (!currentDisplayData || !stats) return;

    // UNEQUIP: Merge back into existing stack if possible
    if (item.equippedSlot) {
        // Find matching unequipped item (same name, category, value, not equipped)
        const matchingStack = currentDisplayData.inventory.find(i =>
            i.id !== item.id &&
            i.name === item.name &&
            i.category === item.category &&
            i.value === item.value &&
            !i.equippedSlot
        );

        if (matchingStack) {
            // Merge into existing stack and remove this item
            const newInventory = currentDisplayData.inventory
                .map(i => i.id === matchingStack.id ? { ...i, qty: i.qty + item.qty } : i)
                .filter(i => i.id !== item.id);
            handleUpdateData({ inventory: newInventory });
        } else {
            // Just unequip (no stack to merge into)
            const newInventory = currentDisplayData.inventory.map(i => i.id === item.id ? { ...i, equippedSlot: null } : i);
            handleUpdateData({ inventory: newInventory });
        }
        return;
    }

    const validSlots: Item['equippedSlot'][] = [];
    const cat = item.category;
    const pack = characterData?.packType || 'Standard'; 

    if (cat.includes('Weapon') || cat === 'Shield' || cat === 'Instrument') validSlots.push('weapon');
    if (cat.includes('Armor')) validSlots.push('armor');
    if (cat === 'Clothing') validSlots.push('clothing');
    if (cat === 'Jewelry' || cat.includes('Symbol')) validSlots.push('jewelry');

    let allowedInUtility = false;
    const STANDARD_UTILITY_CATEGORIES = ['Consumable', 'Literature', 'Ammo', 'Light Ammo', 'Magic Item', 'Ammunition'];
    if (STANDARD_UTILITY_CATEGORIES.includes(cat)) allowedInUtility = true;

    if (!viewingStorageId) {
        if (pack === 'Utility' && item.weight < 2) allowedInUtility = true;
        if (pack === 'Warrior' && cat === 'One-Handed Weapon') allowedInUtility = true;
        if ((pack === 'Explorer' || pack === 'Tinkerer') && cat === 'Tool/Kit') allowedInUtility = true;
        if (pack === 'Travel' && cat === 'Camp') allowedInUtility = true;
        if (pack === 'Shadow') { if (cat === 'One-Handed Weapon' || cat === 'Tool/Kit') allowedInUtility = true; }
    }
    if (allowedInUtility) { if (!validSlots.includes('utility')) validSlots.push('utility'); }

    if (validSlots.length === 0) { alert(`This item cannot be equipped in any slot.`); return; }
    let chosenSlot: Item['equippedSlot'] = validSlots[0];
    if (validSlots.length > 1) {
        const userChoice = window.prompt(`Equip to which slot?\n${validSlots.map(s => s?.toUpperCase()).join(' or ')}?\n(Type 'w' for weapon, 'u' for utility, 'a' for armor)`);
        if (!userChoice) return;
        const lower = userChoice.toLowerCase();
        if (lower.startsWith('u') && validSlots.includes('utility')) chosenSlot = 'utility';
        else if (lower.startsWith('w') && validSlots.includes('weapon')) chosenSlot = 'weapon';
        else if (lower.startsWith('a') && validSlots.includes('armor')) chosenSlot = 'armor';
        else { if (validSlots.includes(lower as any)) chosenSlot = lower as any; else return; }
    }

    if (chosenSlot) {
        let cost = 1;
        if (chosenSlot === 'weapon' && cat === 'Two-Handed Weapon') cost = 2;
        if (chosenSlot === 'armor' && cat === 'Medium Armor') cost = 2;
        if (chosenSlot === 'armor' && cat === 'Heavy Armor') cost = 3;
        const currentUsed = stats.usedSlots[chosenSlot];
        let maxAllowed = stats.maxSlots[chosenSlot];
        if (viewingStorageId && characterData) {
             const sType = characterData.externalStorages.find(s => s.id === viewingStorageId)?.type;
             if (sType && STORAGE_DEFINITIONS[sType]) {
                 const sDef = STORAGE_DEFINITIONS[sType];
                 if (chosenSlot === 'weapon') maxAllowed = sDef.slots.weapon;
                 else if (chosenSlot === 'armor') maxAllowed = sDef.slots.armor;
                 else maxAllowed = 99; 
             }
        }
        if (currentUsed + cost > maxAllowed) { alert(`Not enough space in ${chosenSlot.toUpperCase()}.\nCost: ${cost}\nAvailable: ${maxAllowed - currentUsed}`); return; }

        // Ammo equips full stack, everything else equips only 1
        const isAmmo = ['Ammo', 'Light Ammo'].includes(item.category);
        if (!isAmmo && item.qty > 1) {
            // Split the stack: equip 1, leave qty-1 in pack
            const equippedItem = { ...item, id: uuidv4(), qty: 1, equippedSlot: chosenSlot };
            const remainingItem = { ...item, qty: item.qty - 1 };
            const newInventory = currentDisplayData.inventory.map(i =>
                i.id === item.id ? remainingItem : i
            );
            newInventory.push(equippedItem);
            handleUpdateData({ inventory: newInventory });
        } else {
            // Ammo or qty=1: equip the entire item/stack
            const newInventory = currentDisplayData.inventory.map(i => i.id === item.id ? { ...i, equippedSlot: chosenSlot } : i);
            handleUpdateData({ inventory: newInventory });
        }
    }
  };

  // --- STORAGE & VAULT ACTIONS ---

  const createStorage = () => {
      if (!newStorage.name) return;
      const storage = {
          id: uuidv4(),
          name: newStorage.name,
          description: newStorage.description,
          notes: '',
          type: newStorage.type,
          inventory: [],
          currency: {cp:0, sp:0, gp:0, pp:0},
          isNearby: true
      };
      updateData({ externalStorages: [...characterData!.externalStorages, storage] });
      setNewStorage({ name: '', description: '', type: 'Small Pet' });
  };

  const deleteStorage = (id: string) => {
      if(window.confirm("Delete this storage unit and all items inside?")) {
          updateData({ externalStorages: characterData!.externalStorages.filter(s => s.id !== id) });
          if (viewingStorageId === id) setViewingStorageId(null);
      }
  };

  const createVault = () => {
      if (!newVaultName) return;
      const vault: Vault = { id: uuidv4(), name: newVaultName, currency: {cp:0, sp:0, gp:0, pp:0}, isNearby: true };
      updateData({ vaults: [...characterData!.vaults, vault] });
      setNewVaultName('');
  };

  const deleteVault = (id: string) => {
      if(window.confirm("Delete this vault?")) {
          updateData({ vaults: characterData!.vaults.filter(v => v.id !== id) });
      }
  };

  const transferVaultFunds = (vaultId: string, action: 'deposit' | 'withdraw') => {
      if (!currentDisplayData || !characterData) return;
      const vault = characterData.vaults.find(v => v.id === vaultId);
      if (!vault) return;

      // FIX: Fallback for old vaults
      const vaultCurrency = vault.currency || { cp: 0, sp: 0, gp: (vault as any).amount || 0, pp: 0 };

      const coinType = window.prompt("Which coin? (cp, sp, gp, pp)", "gp")?.toLowerCase() as keyof Currency;
      if (!coinType || !['cp','sp','gp','pp'].includes(coinType)) return;

      const amountStr = window.prompt(`${action.toUpperCase()} ${coinType.toUpperCase()}:\nVault: ${vaultCurrency[coinType]}\nWallet: ${currentDisplayData.currency[coinType]}`);
      if (!amountStr) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) return;

      const newCurrency = { ...currentDisplayData.currency };
      const newVaultCurrency = { ...vaultCurrency };

      if (action === 'deposit') {
          if (newCurrency[coinType] < amount) { alert("Not enough coins."); return; }
          newCurrency[coinType] -= amount;
          newVaultCurrency[coinType] += amount;
      } else {
          if (newVaultCurrency[coinType] < amount) { alert("Not enough coins in vault."); return; }
          newVaultCurrency[coinType] -= amount;
          newCurrency[coinType] += amount;
      }

      const newVaults = characterData.vaults.map(v => v.id === vaultId ? { ...v, currency: newVaultCurrency, amount: undefined } as any : v);
      
      if (viewingStorageId) {
          const newStorages = characterData.externalStorages.map(s => 
              s.id === viewingStorageId ? { ...s, currency: newCurrency } : s
          );
          updateData({ externalStorages: newStorages, vaults: newVaults });
      } else {
          updateData({ currency: newCurrency, vaults: newVaults });
      }
  };

  const transferNearbyCoins = (targetStorageId: string, direction: 'give' | 'take') => {
      if (!characterData || !currentDisplayData) return;
      
      const targetStorage = characterData.externalStorages.find(s => s.id === targetStorageId);
      if (!targetStorage) return;

      const coinType = window.prompt("Which coin? (cp, sp, gp, pp)", "gp")?.toLowerCase() as keyof Currency;
      if (!coinType || !['cp','sp','gp','pp'].includes(coinType)) return;
      
      const amountStr = window.prompt(`Amount?`);
      if (!amountStr) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount) || amount <= 0) return;

      const targetCurrency = targetStorage.currency || { cp: 0, sp: 0, gp: 0, pp: 0 };
      const sourceWallet = direction === 'give' ? currentDisplayData.currency : targetCurrency;
      const targetWallet = direction === 'give' ? targetCurrency : currentDisplayData.currency;
      
      if (sourceWallet[coinType] < amount) { alert("Not enough coins."); return; }

      const newSourceWallet = { ...sourceWallet, [coinType]: sourceWallet[coinType] - amount };
      const newTargetWallet = { ...targetWallet, [coinType]: targetWallet[coinType] + amount };

      let newStorages = [...characterData.externalStorages];
      newStorages = newStorages.map(s => s.id === targetStorageId ? { ...s, currency: direction === 'give' ? newTargetWallet : newSourceWallet } : s);

      if (viewingStorageId) {
          newStorages = newStorages.map(s => s.id === viewingStorageId ? { ...s, currency: direction === 'give' ? newSourceWallet : newTargetWallet } : s);
          updateData({ externalStorages: newStorages });
      } else {
          updateData({ 
              currency: direction === 'give' ? newSourceWallet : newTargetWallet,
              externalStorages: newStorages 
          });
      }
  };

  const transferItem = (item: Item, direction: 'ToStorage' | 'ToPlayer') => {
      if (!characterData || !viewingStorageId) return;
      const storage = characterData.externalStorages.find(s => s.id === viewingStorageId);
      if (!storage || !storage.isNearby) { alert("Storage not nearby."); return; }

      const itemToMove = { ...item, isAttuned: false, equippedSlot: null };
      
      let newPlayerInv = [...characterData.inventory];
      let newStorageInv = [...storage.inventory];

      if (direction === 'ToStorage') {
          newPlayerInv = newPlayerInv.filter(i => i.id !== item.id);
          newStorageInv.push(itemToMove);
      } else {
          newStorageInv = newStorageInv.filter(i => i.id !== item.id);
          newPlayerInv.push(itemToMove);
      }

      const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? { ...s, inventory: newStorageInv } : s);
      updateData({ inventory: newPlayerInv, externalStorages: newStorages });
  };

  // --- GLOBAL SEARCH ACTIONS ---

  const handleGlobalTake = (item: Item, storageId: string) => {
    if (!characterData) return;
    const storage = characterData.externalStorages.find(s => s.id === storageId);
    if (!storage) return;
    
    if (!storage.isNearby) {
        alert(`${storage.name} is not nearby. Cannot take item.`);
        return;
    }

    // Remove from Storage
    const newStorageInv = storage.inventory.filter(i => i.id !== item.id);
    
    // Add to Player
    const itemToMove = { ...item, isAttuned: false, equippedSlot: null };
    const newPlayerInv = [...characterData.inventory, itemToMove];

    // Update
    const newStorages = characterData.externalStorages.map(s => s.id === storageId ? { ...s, inventory: newStorageInv } : s);
    
    updateData({
        inventory: newPlayerInv,
        externalStorages: newStorages
    });
    alert(`Took ${item.name} from ${storage.name}.`);
  };

  const handleJumpTo = (storageId: string | null) => {
      setViewingStorageId(storageId);
      setActiveTab('Pack');
      setFilterText(''); // Clear any existing pack filter so they can see the item
  };

  // --- RENDER ---

  if (!ready || loading) return <div className="loading">Loading...</div>;

  // Show favorites menu when viewing favorites OR no token selected
  if (viewingFavorites || !tokenId || !characterData || !currentDisplayData) {
    return (
      <div className="app-container" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <h2 style={{margin: 0, fontSize: '18px'}}>Inventory Manager</h2>
          {tokenId && (
            <button
              onClick={() => setViewingFavorites(false)}
              style={{
                background: 'var(--border)',
                color: 'white',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              BACK
            </button>
          )}
        </div>

        <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
          {!tokenId && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{fontSize: '48px', marginBottom: '12px'}}>📦</div>
              <p style={{color: 'var(--text-main)', fontSize: '16px', marginBottom: '8px'}}>
                Welcome to Inventory Manager
              </p>
              <p style={{color: 'var(--text-muted)', fontSize: '13px'}}>
                Select a token on the map to view its inventory
              </p>
            </div>
          )}

          {/* Current Token (if viewing from an active session) */}
          {tokenId && tokenName && (
            <div style={{marginBottom: '24px'}}>
              <h3 style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 'bold'
              }}>
                Current Token
              </h3>
              <button
                onClick={() => setViewingFavorites(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: 'rgba(240, 225, 48, 0.15)',
                  border: '2px solid var(--accent-gold)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(240, 225, 48, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(240, 225, 48, 0.15)'}
              >
                {tokenImage && (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid var(--accent-gold)',
                    flexShrink: 0,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  }}>
                    <img src={tokenImage} alt={tokenName} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  </div>
                )}
                <div>
                  <div style={{fontWeight: 'bold', fontSize: '18px', color: 'var(--accent-gold)'}}>{tokenName}</div>
                  <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>Click to return</div>
                </div>
              </button>
            </div>
          )}

          {favorites.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 'bold'
              }}>
                <span style={{color: 'var(--accent-gold)'}}>⭐</span> Favorite Tokens
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {favorites.map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => {
                      loadTokenById(fav.id);
                      setViewingFavorites(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'var(--accent-gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {fav.image && (
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid var(--accent-gold)',
                        flexShrink: 0
                      }}>
                        <img src={fav.image} alt={fav.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      </div>
                    )}
                    <div style={{fontWeight: 'bold', fontSize: '15px', flex: 1}}>{fav.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {favorites.length === 0 && !tokenId && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <div style={{fontSize: '64px', marginBottom: '16px', opacity: 0.3}}>⭐</div>
              <p style={{fontSize: '14px', marginBottom: '8px'}}>No favorites yet</p>
              <p style={{fontSize: '12px', opacity: 0.7}}>
                Select a token and add it to favorites from the Home tab
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== P2P TRADING FUNCTIONS =====

  // Start player-to-player trade
  const handleStartP2PTrade = async (otherPlayerTokenId: string) => {
    // Check if player has a claimed token
    if (!playerClaimedTokenId || !playerId || !playerClaimedTokenName) {
      alert('You must claim a token before you can trade! Select your character token and click "CLAIM TOKEN".');
      return;
    }

    // Check proximity between player's claimed token and other player's token
    const isNear = await checkProximity(playerClaimedTokenId, otherPlayerTokenId);
    if (!isNear) {
      alert('Your character must be near the other player to trade!');
      return;
    }

    // Check if a trade is already active
    if (activeTrade) {
      alert('A trade is already in progress!');
      return;
    }

    // Get other player's info
    const tokens = await OBR.scene.items.getItems([otherPlayerTokenId]);
    if (tokens.length === 0) return;

    const otherTokenName = tokens[0].name || 'Unknown Player';
    const otherTokenData = tokens[0].metadata['com.weighted-inventory/data'] as CharacterData;
    const otherPlayerId = otherTokenData?.claimedBy;

    if (!otherPlayerId) {
      alert('The other token must be claimed by a player to trade!');
      return;
    }

    // Start P2P trade (using player's claimed token, not the currently viewed token)
    const trade: ActiveTrade = {
      id: uuidv4(),
      type: 'player-to-player',
      player1TokenId: playerClaimedTokenId,
      player1Id: playerId,
      player1Name: playerClaimedTokenName,
      player2TokenId: otherPlayerTokenId,
      player2Id: otherPlayerId,
      player2Name: otherTokenName,
      player1CoinsOffered: { cp: 0, sp: 0, gp: 0, pp: 0 },
      player2CoinsOffered: { cp: 0, sp: 0, gp: 0, pp: 0 },
      itemsToTrade: [],
      netCost: { amount: 0, currency: 'gp', owedTo: 'even' },
      status: 'proposing',
      player1Approved: false,
      player2Approved: false,
      timestamp: Date.now()
    };

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: trade });
    
    // Redirect to player's own claimed token to show Trade tab from their perspective
    await loadTokenById(playerClaimedTokenId);
    setActiveTab('Trade');
  };

  // Cancel active trade
  const handleCancelTrade = async () => {
    if (!activeTrade) return;

    // Check if current player can cancel
    const canCancel =
      activeTrade.player1Id === playerId ||
      activeTrade.player2Id === playerId ||
      playerRole === 'GM';

    if (!canCancel) {
      alert('Only involved players or GM can cancel this trade.');
      return;
    }

    console.log('[TRADE] Clearing active trade from room metadata');
    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: undefined });
    console.log('[TRADE] Active trade cleared');

    // Reset local state
    setPlayer1Items([]);
    setPlayer2Items([]);
    setPlayer1CoinsOffered({ cp: 0, sp: 0, gp: 0, pp: 0 });
    setPlayer2CoinsOffered({ cp: 0, sp: 0, gp: 0, pp: 0 });
  };

  // Sync item selection to room metadata for P2P trades
  const syncP2PTradeToMetadata = async (
    p1Items: Item[],
    p2Items: Item[],
    p1Coins: Currency,
    p2Coins: Currency
  ) => {
    if (!activeTrade) return;

    // Build itemsToTrade
    const tradeItems: typeof activeTrade.itemsToTrade = [];

    // Items player1 is giving to player2
    p1Items.forEach(item => {
      tradeItems.push({
        item,
        source: 'player1',
        destination: 'player2'
      });
    });

    // Items player2 is giving to player1
    p2Items.forEach(item => {
      tradeItems.push({
        item,
        source: 'player2',
        destination: 'player1'
      });
    });

    const netCost = calculateP2PCost(p1Items, p2Items, p1Coins, p2Coins);

    // Update trade in room metadata
    const updatedTrade: ActiveTrade = {
      ...activeTrade,
      itemsToTrade: tradeItems,
      player1CoinsOffered: p1Coins,
      player2CoinsOffered: p2Coins,
      netCost
    };
    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });
  };

  // Handle player1 item selection changes
  const handleSetPlayer1Items = (items: Item[]) => {
    setPlayer1Items(items);
    syncP2PTradeToMetadata(items, player2Items, player1CoinsOffered, player2CoinsOffered);
  };

  // Handle player2 item selection changes
  const handleSetPlayer2Items = (items: Item[]) => {
    setPlayer2Items(items);
    syncP2PTradeToMetadata(player1Items, items, player1CoinsOffered, player2CoinsOffered);
  };

  // Handle player1 coins offered changes
  const handleSetPlayer1CoinsOffered = (coins: Currency) => {
    setPlayer1CoinsOffered(coins);
    syncP2PTradeToMetadata(player1Items, player2Items, coins, player2CoinsOffered);
  };

  // Handle player2 coins offered changes
  const handleSetPlayer2CoinsOffered = (coins: Currency) => {
    setPlayer2CoinsOffered(coins);
    syncP2PTradeToMetadata(player1Items, player2Items, player1CoinsOffered, coins);
  };

  // Approve and execute P2P trade
  const handleApproveTrade = async () => {
    if (!activeTrade || isExecutingTrade) return;

    const isPlayer1 = activeTrade.player1Id === playerId;
    const isPlayer2 = activeTrade.player2Id === playerId;
    const isGM = playerRole === 'GM';

    if (!isPlayer1 && !isPlayer2 && !isGM) {
      alert('Only the trading players or GM can approve this trade.');
      return;
    }

    // Verify this player is trading from their claimed token
    if (isPlayer1 && activeTrade.player1TokenId !== playerClaimedTokenId) {
      alert('You can only trade from your claimed token!');
      return;
    }
    if (isPlayer2 && activeTrade.player2TokenId !== playerClaimedTokenId) {
      alert('You can only trade from your claimed token!');
      return;
    }

    // Build itemsToTrade and netCost
    const tradeItems: typeof activeTrade.itemsToTrade = [];

    // Items player1 is giving to player2
    player1Items.forEach(item => {
      tradeItems.push({
        item,
        source: 'player1',
        destination: 'player2'
      });
    });

    // Items player2 is giving to player1
    player2Items.forEach(item => {
      tradeItems.push({
        item,
        source: 'player2',
        destination: 'player1'
      });
    });

    const netCost = calculateP2PCost(player1Items, player2Items, player1CoinsOffered, player2CoinsOffered);

    // Update approval status and trade details
    const updatedTrade: ActiveTrade = {
      ...activeTrade,
      itemsToTrade: tradeItems,
      player1CoinsOffered: player1CoinsOffered,
      player2CoinsOffered: player2CoinsOffered,
      netCost,
      player1Approved: isPlayer1 ? true : activeTrade.player1Approved,
      player2Approved: isPlayer2 ? true : activeTrade.player2Approved
    };

    // GM can force execute
    if (isGM && !isPlayer1 && !isPlayer2) {
      updatedTrade.player1Approved = true;
      updatedTrade.player2Approved = true;
    }

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });

    // Check if both players approved
    if (updatedTrade.player1Approved && updatedTrade.player2Approved) {
      // Both approved - execute trade
      setIsExecutingTrade(true);
      try {
        await executeTrade();
      } finally {
        setIsExecutingTrade(false);
      }
    } else {
      alert('Waiting for other player to approve...');
    }
  };

  // Execute the P2P trade - transfer items and currency between tokens
  const executeTrade = async () => {
    if (!activeTrade || isExecutingTrade) return;
    try {
      // Get all involved tokens
      const tokenIds = [activeTrade.player1TokenId];
      if (activeTrade.player2TokenId) tokenIds.push(activeTrade.player2TokenId);

      // Update tokens with new inventories and currency
      await OBR.scene.items.updateItems(tokenIds, (items) => {
        // Transfer items
        activeTrade.itemsToTrade.forEach(tradeItem => {
          const sourceToken = items.find(t => {
            if (tradeItem.source === 'player1') return t.id === activeTrade.player1TokenId;
            if (tradeItem.source === 'player2') return t.id === activeTrade.player2TokenId;
            return false;
          });

          const destToken = items.find(t => {
            if (tradeItem.destination === 'player1') return t.id === activeTrade.player1TokenId;
            if (tradeItem.destination === 'player2') return t.id === activeTrade.player2TokenId;
            return false;
          });

          if (sourceToken && destToken) {
            const sourceData = sourceToken.metadata['com.weighted-inventory/data'] as CharacterData;
            const destData = destToken.metadata['com.weighted-inventory/data'] as CharacterData;

            // Remove from source
            sourceData.inventory = sourceData.inventory.filter(i => i.id !== tradeItem.item.id);

            // Add to destination
            destData.inventory.push({ ...tradeItem.item, equippedSlot: null, isAttuned: false });

            sourceToken.metadata['com.weighted-inventory/data'] = sourceData;
            destToken.metadata['com.weighted-inventory/data'] = destData;
          }
        });

        // Transfer coins offered by each player
        const player1Token = items.find(t => t.id === activeTrade.player1TokenId);
        const player2Token = items.find(t => t.id === activeTrade.player2TokenId);

        if (player1Token && player2Token) {
          const player1Data = player1Token.metadata['com.weighted-inventory/data'] as CharacterData;
          const player2Data = player2Token.metadata['com.weighted-inventory/data'] as CharacterData;

          // Ensure currency objects exist
          if (!player1Data.currency) player1Data.currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
          if (!player2Data.currency) player2Data.currency = { cp: 0, sp: 0, gp: 0, pp: 0 };

          // Get coin offers
          const p1CoinsOffered = activeTrade.player1CoinsOffered || { cp: 0, sp: 0, gp: 0, pp: 0 };
          const p2CoinsOffered = activeTrade.player2CoinsOffered || { cp: 0, sp: 0, gp: 0, pp: 0 };

          // Convert to copper for transfer
          const p1CoinsCp = getTotalCopperPieces(p1CoinsOffered);
          const p2CoinsCp = getTotalCopperPieces(p2CoinsOffered);

          // Deduct player1's offered coins and give to player2
          if (p1CoinsCp > 0) {
            const success = deductCopperPieces(player1Data.currency, p1CoinsCp);
            if (!success) {
              throw new Error(`${activeTrade.player1Name} does not have enough coins!`);
            }
            addCopperPieces(player2Data.currency, p1CoinsCp);
          }

          // Deduct player2's offered coins and give to player1
          if (p2CoinsCp > 0) {
            const success = deductCopperPieces(player2Data.currency, p2CoinsCp);
            if (!success) {
              throw new Error(`${activeTrade.player2Name} does not have enough coins!`);
            }
            addCopperPieces(player1Data.currency, p2CoinsCp);
          }

          player1Token.metadata['com.weighted-inventory/data'] = player1Data;
          player2Token.metadata['com.weighted-inventory/data'] = player2Data;
        }
      });

      console.log('[TRADE] Trade execution complete, clearing trade metadata...');
      // Clear trade
      await handleCancelTrade();
      console.log('[TRADE] Trade cleared, showing success alert');
      alert('Trade completed successfully!');
    } catch (err) {
      console.error('Failed to execute trade:', err);
      alert(`Trade failed! ${err instanceof Error ? err.message : 'Check console for details.'}`);
    }
  };

  const baseTabs: { id: Tab; label?: string; icon?: React.ReactNode }[] = [
    { id: 'Home', label: '||' }, { id: 'Pack', label: 'PACK' }, { id: 'Weapons', label: 'WEAPONS' }, { id: 'Body', label: 'BODY' }, { id: 'Quick', label: 'QUICK' },
    { id: 'Search', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> },
    { id: 'Create', label: 'CREATE' }, { id: 'External', label: 'STORAGE' }, { id: 'Coin', label: 'COIN' },
  ];

  // Add GM tab (always visible to GMs)
  if (playerRole === 'GM') {
    baseTabs.push({ id: 'GM', label: 'GM' });
  }

  // Show Trade tab when there's an active P2P trade for relevant players
  if (activeTrade && (activeTrade.player1Id === playerId || activeTrade.player2Id === playerId || playerRole === 'GM')) {
    baseTabs.push({ id: 'Trade', label: 'TRADE' });
  }

  let visibleTabs = baseTabs;

  if (viewingStorageId) {
      visibleTabs = visibleTabs.filter(t => t.id !== 'External');
      const activeStorageType = characterData.externalStorages.find(s => s.id === viewingStorageId)?.type;
      const typesWithEquip = ['Small Pet', 'Large Pet', 'Standard Mount', 'Large Mount'];
      if (!activeStorageType || !typesWithEquip.includes(activeStorageType)) {
          visibleTabs = visibleTabs.filter(t => !['Weapons', 'Body', 'Quick'].includes(t.id));
      }
      const searchIdx = visibleTabs.findIndex(t => t.id === 'Search');
      visibleTabs.splice(searchIdx, 0, { id: 'Transfer', label: 'TRANSFER' });
  }

  // Hide tabs for non-owners when viewing another player's claimed token
  const isOwnerOrGM = playerRole === 'GM' || characterData?.claimedBy === playerId || !characterData?.claimedBy;
  if (!isOwnerOrGM && !viewingStorageId) {
    // Non-owners can only see Home and Trade tabs
    visibleTabs = visibleTabs.filter(t => ['Home', 'Trade'].includes(t.id));
  }

  const activeStorageDef = viewingStorageId ? STORAGE_DEFINITIONS[characterData.externalStorages.find(s => s.id === viewingStorageId)!.type] : null;

  return (
    <div className="app-container" style={viewingStorageId ? {border: '2px solid var(--accent-gold)'} : {}}>
      {viewingStorageId && (
          <div style={{background: 'var(--accent-gold)', color: 'black', padding: '4px 8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>VIEWING: {currentDisplayData.condition}</span>
              <button onClick={() => { setViewingStorageId(null); setActiveTab('External'); }} style={{background:'black', color:'white', border:'none', padding:'2px 6px', fontSize:'10px', cursor:'pointer'}}>EXIT</button>
          </div>
      )}
      {/* Read-only indicator when viewing another player's claimed token */}
      {!isOwnerOrGM && !viewingStorageId && characterData?.claimedBy && (
          <div style={{background: 'rgba(255,100,100,0.2)', color: '#ff6666', padding: '4px 8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '11px'}}>
              <span>👁 Viewing {tokenName}'s inventory (Read Only)</span>
          </div>
      )}
      <nav className="nav-bar">
        {visibleTabs.map((tab) => <button key={tab.id} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} title={tab.id}>{tab.icon ? tab.icon : tab.label}</button>)}
      </nav>

      <main className="content">
        {activeTab === 'Home' && stats && (
          <HomeTab
            stats={stats}
            viewingStorageId={viewingStorageId}
            setShowDebug={setShowDebug}
            loadDebugInfo={loadDebugInfo}
            characterData={characterData}
            playerRole={playerRole}
            playerId={playerId}
            tokenImage={tokenImage}
            tokenName={tokenName}
            toggleFavorite={toggleFavorite}
            isFavorited={isFavorited}
            favorites={favorites}
            setViewingFavorites={setViewingFavorites}
            activeTrade={activeTrade}
            tokenId={tokenId}
            canEditToken={canEditToken}
            claimToken={claimToken}
            unclaimToken={unclaimToken}
            handleUpdateData={handleUpdateData}
            handleStartP2PTrade={handleStartP2PTrade}
            updateData={updateData}
            PACK_DEFINITIONS={PACK_DEFINITIONS}
            theme={theme}
            updateTheme={updateTheme}
            currentDisplayData={currentDisplayData}
            activeStorageDef={activeStorageDef}
          />
        )}

        {activeTab === 'Pack' && (
            <div className="section" style={{padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                <div style={{padding: '12px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                        <h2 style={{margin: 0, border: 'none'}}>INVENTORY ({viewingStorageId ? 'STORAGE' : 'PLAYER'})</h2>
                        <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>{currentDisplayData.inventory.length} Items</span>
                    </div>
                    <input type="text" placeholder="Filter items..." className="search-input" style={{marginTop: 0}} value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                </div>
                <div style={{flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                        <thead>
                            <tr style={{borderBottom: '2px solid var(--border)', color: 'var(--accent-gold)', fontSize: '10px', textAlign: 'left'}}>
                                <th style={{padding: '8px 4px'}}>QTY</th>
                                <th style={{padding: '8px 4px'}}>ITEM</th>
                                <th style={{padding: '8px 4px'}}>TYPE</th>
                                <th style={{padding: '8px 4px'}}>VALUE</th>
                                <th style={{padding: '8px 4px', textAlign:'center'}}>CHARGES</th>
                                <th style={{padding: '8px 4px', textAlign:'center'}}>WT</th>
                                <th style={{padding: '8px 4px', textAlign:'right'}}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDisplayData.inventory.filter(item => item.name.toLowerCase().includes(filterText.toLowerCase())).map((item) => (
                                <Fragment key={item.id}>
                                    <tr
                                        draggable
                                        onDragStart={() => handleDragStart(item.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(item.id)}
                                        style={{
                                            borderTop: '1px solid #333',
                                            cursor: 'grab',
                                            opacity: draggedItemId === item.id ? 0.5 : 1,
                                            background: draggedItemId === item.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                                        }}
                                    >
                                        <td style={{padding: '8px 4px', width: '50px'}}><input type="number" value={item.qty} min="1" onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, qty: parseInt(e.target.value)} : i); handleUpdateData({inventory: newInv}); }} style={{width: '40px', background: '#222', border: '1px solid #444', color: 'white', textAlign: 'center', padding: '4px'}} /></td>
                                        <td style={{padding: '8px 4px'}}><div style={{fontWeight: 'bold', color: item.equippedSlot ? 'var(--accent-gold)' : 'var(--text-main)'}}>{item.name}</div>{item.equippedSlot && <div style={{fontSize: '9px', textTransform:'uppercase', color:'var(--accent-gold)'}}>[EQ: {item.equippedSlot}]</div>}</td>
                                        <td style={{padding: '8px 4px', width: '100px'}}><select value={item.category} onChange={(e) => { const cat = e.target.value as ItemCategory; const newWeight = DEFAULT_CATEGORY_WEIGHTS[cat] || item.weight; const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, category: cat, weight: newWeight} : i); handleUpdateData({inventory: newInv}); }} style={{width: '100%', background: 'transparent', border: 'none', color: '#aaa', fontSize: '11px', textOverflow:'ellipsis'}}>{ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></td>
                                        <td style={{padding: '8px 4px', fontSize: '11px', color: '#888'}}>{item.value || '-'}</td>
                                        <td style={{padding: '8px 4px', textAlign:'center', fontSize: '11px'}}>
                                            {item.maxCharges !== undefined ? (
                                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}>
                                                    <button
                                                        onClick={() => {
                                                            const newCharges = Math.max(0, (item.charges || 0) - 1);
                                                            const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, charges: newCharges} : i);
                                                            handleUpdateData({inventory: newInv});
                                                        }}
                                                        style={{background: '#333', border: 'none', color: '#888', cursor: 'pointer', padding: '2px 6px', fontSize: '10px', borderRadius: '2px'}}
                                                        title="Decrease charge"
                                                    >−</button>
                                                    <span style={{color: (item.charges || 0) === 0 ? '#f44' : 'var(--text-main)', fontWeight: 'bold', minWidth: '40px', textAlign: 'center'}}>
                                                        {item.charges || 0}/{item.maxCharges}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const newCharges = Math.min(item.maxCharges || 0, (item.charges || 0) + 1);
                                                            const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, charges: newCharges} : i);
                                                            handleUpdateData({inventory: newInv});
                                                        }}
                                                        style={{background: '#333', border: 'none', color: '#888', cursor: 'pointer', padding: '2px 6px', fontSize: '10px', borderRadius: '2px'}}
                                                        title="Increase charge"
                                                    >+</button>
                                                </div>
                                            ) : <span style={{color: '#444'}}>-</span>}
                                        </td>
                                        <td style={{padding: '8px 4px', textAlign:'center', fontSize: '11px', color: '#888'}}>{item.weight * item.qty}</td>
                                        <td style={{padding: '8px 4px', textAlign:'right'}}>
                                            <button onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: editingItemId === item.id ? 'var(--accent-gold)' : '#555', padding: 0, marginRight: 4}} title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                            <button onClick={() => handleToggleEquip(item)} style={{background: 'none', border: 'none', cursor: 'pointer', color: item.equippedSlot ? 'var(--accent-gold)' : '#555', padding: 0, marginRight: 4}} title="Equip/Unequip"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></button>
                                            <button onClick={() => handleSell(item)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0, marginRight: 4}} title="Sell"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></button>
                                            <button onClick={() => handleDelete(item.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0}} title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                        </td>
                                    </tr>
                                    {editingItemId === item.id ? (
                                        <tr style={{background: 'rgba(0,0,0,0.2)'}}>
                                            <td colSpan={7} style={{padding: '12px', borderBottom: '1px solid #222'}}>
                                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                                    <div>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Name</label>
                                                        <input className="search-input" style={{marginTop: 0}} value={item.name} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, name: e.target.value} : i); handleUpdateData({inventory: newInv}); }} />
                                                    </div>
                                                    <div>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Type</label>
                                                        <input className="search-input" style={{marginTop: 0}} value={item.type} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, type: e.target.value} : i); handleUpdateData({inventory: newInv}); }} />
                                                    </div>
                                                    <div>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Weight</label>
                                                        <input type="number" className="search-input" style={{marginTop: 0}} value={item.weight} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, weight: parseFloat(e.target.value)} : i); handleUpdateData({inventory: newInv}); }} />
                                                    </div>
                                                    <div>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Value</label>
                                                        <input className="search-input" style={{marginTop: 0}} value={item.value} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, value: e.target.value} : i); handleUpdateData({inventory: newInv}); }} />
                                                    </div>
                                                    {(item.category?.includes('Weapon') || item.category === 'Shield') && (
                                                        <>
                                                            <div>
                                                                <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Damage</label>
                                                                <input className="search-input" style={{marginTop: 0}} value={item.damage || ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, damage: e.target.value} : i); handleUpdateData({inventory: newInv}); }} />
                                                            </div>
                                                            <div>
                                                                <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Hit Modifier</label>
                                                                <input className="search-input" style={{marginTop: 0}} value={item.hitModifier || ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, hitModifier: e.target.value} : i); handleUpdateData({inventory: newInv}); }} placeholder="+0" />
                                                            </div>
                                                            <div>
                                                                <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Damage Modifier</label>
                                                                <input className="search-input" style={{marginTop: 0}} value={item.damageModifier || ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, damageModifier: e.target.value} : i); handleUpdateData({inventory: newInv}); }} placeholder="+0" />
                                                            </div>
                                                        </>
                                                    )}
                                                    {(item.category?.includes('Armor') || item.category === 'Shield') && (
                                                        <div>
                                                            <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>AC</label>
                                                            <input type="number" className="search-input" style={{marginTop: 0}} value={item.ac || ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, ac: parseInt(e.target.value)} : i); handleUpdateData({inventory: newInv}); }} />
                                                        </div>
                                                    )}
                                                    <div style={{gridColumn: 'span 2'}}>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Properties / Notes</label>
                                                        <textarea
                                                            className="search-input"
                                                            style={{marginTop: 0, minHeight: '60px', resize: 'vertical'}}
                                                            value={item.properties || ''}
                                                            onChange={(e) => {
                                                                const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, properties: e.target.value} : i);
                                                                handleUpdateData({inventory: newInv});
                                                                // Auto-resize
                                                                e.target.style.height = 'auto';
                                                                e.target.style.height = e.target.scrollHeight + 'px';
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                        <input type="checkbox" id={`attune-${item.id}`} checked={item.requiresAttunement} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, requiresAttunement: e.target.checked} : i); handleUpdateData({inventory: newInv}); }} />
                                                        <label htmlFor={`attune-${item.id}`} style={{fontSize: '11px', color: 'var(--text-muted)'}}>Requires Attunement</label>
                                                    </div>
                                                    {item.requiresAttunement && (
                                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                            <input type="checkbox" id={`attuned-${item.id}`} checked={item.isAttuned} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, isAttuned: e.target.checked} : i); handleUpdateData({inventory: newInv}); }} />
                                                            <label htmlFor={`attuned-${item.id}`} style={{fontSize: '11px', color: item.isAttuned ? 'cyan' : 'var(--text-muted)'}}>Is Attuned</label>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Current Charges</label>
                                                        <input type="number" className="search-input" style={{marginTop: 0}} value={item.charges ?? ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, charges: e.target.value ? parseInt(e.target.value) : undefined} : i); handleUpdateData({inventory: newInv}); }} placeholder="None" />
                                                    </div>
                                                    <div>
                                                        <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Max Charges</label>
                                                        <input type="number" className="search-input" style={{marginTop: 0}} value={item.maxCharges ?? ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, maxCharges: e.target.value ? parseInt(e.target.value) : undefined} : i); handleUpdateData({inventory: newInv}); }} placeholder="None" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr style={{background: 'rgba(0,0,0,0.1)'}}>
                                            <td colSpan={7} style={{padding: '4px 8px 12px 8px', borderBottom: '1px solid #222'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                    <div style={{flex: 1, fontSize: '10px', color: '#888'}}>{item.properties || 'No notes'}</div>
                                                    {item.requiresAttunement && (<div onClick={() => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, isAttuned: !i.isAttuned} : i); handleUpdateData({inventory: newInv}); }} style={{cursor: 'pointer', color: item.isAttuned ? 'cyan' : '#444', fontSize: '14px', marginLeft:'8px'}} title="Toggle Attunement">{item.isAttuned ? '★' : '☆'}</div>)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- EQUIPMENT TABS (HIDDEN FOR STORAGE) --- */}
        {activeTab === 'Weapons' && (
            <div className="section">
                <h2>Equipped Weapons</h2>
                 {currentDisplayData.inventory.filter(i => i.equippedSlot === 'weapon').map(item => (
                    <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                        <div>
                            <div style={{fontWeight:'bold', color: 'var(--text-main)'}}>{item.name}</div>
                            <div style={{fontSize:'11px', color:'var(--accent-gold)'}}>
                                {item.damage || 'No Damage'}
                                {item.hitModifier && <span style={{marginLeft: '8px'}}>Hit: {item.hitModifier}</span>}
                                {item.damageModifier && <span style={{marginLeft: '8px'}}>Dmg: {item.damageModifier}</span>}
                            </div>
                            <div style={{fontSize:'10px', color:'#888', fontStyle:'italic'}}>{item.properties || 'No properties'}</div>
                        </div>
                        <button onClick={() => handleToggleEquip(item)} style={{background: '#333', color: '#888', border:'none', padding:'4px 8px', borderRadius:'4px', fontSize:'10px', cursor:'pointer'}}>UNEQUIP</button>
                    </div>
                 ))}
                 {currentDisplayData.inventory.filter(i => i.equippedSlot === 'weapon').length === 0 && <p style={{color:'#666', fontStyle:'italic'}}>No weapons equipped.</p>}
            </div>
        )}

        {activeTab === 'Body' && (
            <div className="section">
                <h2>Body Slots</h2>
                <div style={{marginBottom: '16px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', marginBottom:'8px'}}><span style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:'bold'}}>ARMOR</span></div>
                    {currentDisplayData.inventory.filter(i => i.equippedSlot === 'armor').map(item => (
                        <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', padding: '8px', marginBottom: '4px', borderRadius: '4px', display:'flex', justifyContent:'space-between'}}>
                             <div><div style={{fontWeight:'bold'}}>{item.name}</div>{item.ac && <div style={{fontSize:'10px', color:'var(--accent-gold)'}}>AC Bonus: +{item.ac}</div>}</div>
                             <button onClick={() => handleToggleEquip(item)} style={{background:'none', border:'none', color:'#555', cursor:'pointer'}}>X</button>
                        </div>
                    ))}
                </div>
                <div style={{marginBottom: '16px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', marginBottom:'8px'}}><span style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:'bold'}}>CLOTHING</span></div>
                    {currentDisplayData.inventory.filter(i => i.equippedSlot === 'clothing').map(item => (
                        <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', padding: '8px', marginBottom: '4px', borderRadius: '4px', display:'flex', justifyContent:'space-between'}}>
                             <div style={{fontWeight:'bold'}}>{item.name}</div>
                             <button onClick={() => handleToggleEquip(item)} style={{background:'none', border:'none', color:'#555', cursor:'pointer'}}>X</button>
                        </div>
                    ))}
                </div>
                 <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', marginBottom:'8px'}}><span style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:'bold'}}>JEWELRY</span></div>
                    {currentDisplayData.inventory.filter(i => i.equippedSlot === 'jewelry').map(item => (
                        <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', padding: '8px', marginBottom: '4px', borderRadius: '4px', display:'flex', justifyContent:'space-between'}}>
                             <div><div style={{fontWeight:'bold'}}>{item.name}</div><div style={{fontSize:'10px', color:'#888'}}>{item.properties}</div></div>
                             <button onClick={() => handleToggleEquip(item)} style={{background:'none', border:'none', color:'#555', cursor:'pointer'}}>X</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'Quick' && (
            <div className="section">
                <h2>Quick Slots / Utility</h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px'}}>
                    {currentDisplayData.inventory.filter(i => i.equippedSlot === 'utility').map(item => (
                        <div key={item.id} style={{background: 'rgba(240, 225, 48, 0.05)', border:'1px solid rgba(240, 225, 48, 0.2)', padding: '8px', borderRadius: '4px', position:'relative'}}>
                            <div style={{fontWeight:'bold', fontSize:'12px', paddingRight:'20px'}}>{item.name}</div>
                            <div style={{fontSize:'10px', color:'#888'}}>{item.qty > 1 ? `Qty: ${item.qty}` : ''}</div>
                            {item.properties && <div style={{fontSize:'10px', color:'var(--accent-gold)', marginTop: '4px', fontStyle:'italic'}}>{item.properties}</div>}
                            <button onClick={() => handleToggleEquip(item)} style={{position:'absolute', top:2, right:2, background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'10px'}}>X</button>
                        </div>
                    ))}
                </div>
                {currentDisplayData.inventory.filter(i => i.equippedSlot === 'utility').length === 0 && <p style={{color:'#666', fontStyle:'italic', textAlign:'center', marginTop:'20px'}}>No utility items equipped.</p>}
            </div>
        )}

        {activeTab === 'Search' && (
            <div className="section">
                <h2>Global Search</h2>
                <input 
                    className="search-input" 
                    placeholder="Search items (min 2 chars)..." 
                    value={globalSearch} 
                    onChange={e => setGlobalSearch(e.target.value)} 
                    autoFocus
                />
                <div style={{marginTop: '16px'}}>
                    {(() => {
                        if (!characterData || globalSearch.length < 2) return <p style={{color:'#666', fontStyle:'italic'}}>Type to search...</p>;
                        const term = globalSearch.toLowerCase();
                        const results: { item: Item, source: string, storageId: string | null, isNearby: boolean }[] = [];

                        // 1. Search Player
                        characterData.inventory.forEach(item => {
                            if (item.name.toLowerCase().includes(term)) {
                                results.push({ item, source: 'Player', storageId: null, isNearby: true });
                            }
                        });

                        // 2. Search External Storage
                        characterData.externalStorages.forEach(storage => {
                            storage.inventory.forEach(item => {
                                if (item.name.toLowerCase().includes(term)) {
                                    results.push({ item, source: storage.name, storageId: storage.id, isNearby: storage.isNearby });
                                }
                            });
                        });

                        if (results.length === 0) return <p style={{color:'#666'}}>No items found.</p>;

                        return (
                            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                {results.map((res, idx) => (
                                    <div key={`${res.item.id}-${idx}`} style={{background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:'4px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <div>
                                            <div style={{fontWeight:'bold', color:'var(--text-main)'}}>{res.item.name}</div>
                                            <div style={{fontSize:'11px', color: res.storageId ? 'var(--accent-gold)' : '#888'}}>
                                                {res.source} {res.item.qty > 1 ? `(x${res.item.qty})` : ''}
                                                {res.storageId && !res.isNearby && <span style={{color:'var(--danger)', marginLeft:'4px'}}>(Not Nearby)</span>}
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap:'8px'}}>
                                            {res.storageId && (
                                                <button 
                                                    onClick={() => handleGlobalTake(res.item, res.storageId!)}
                                                    disabled={!res.isNearby}
                                                    style={{
                                                        background: res.isNearby ? '#333' : '#222', 
                                                        color: res.isNearby ? 'white' : '#555', 
                                                        border:'none', padding:'4px 8px', borderRadius:'4px', fontSize:'10px', cursor: res.isNearby ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    TAKE
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleJumpTo(res.storageId)}
                                                style={{background:'var(--border)', color:'white', border:'none', padding:'4px 8px', borderRadius:'4px', fontSize:'10px', cursor:'pointer'}}
                                            >
                                                JUMP
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        )}

        {activeTab === 'Create' && (
             <div className="section">
                <h2>Forge New Item</h2>

                {/* REPOSITORY SEARCH BAR */}
                <div style={{ position: 'relative', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed var(--border)' }}>
                    <label style={{display:'block', fontSize:'11px', color:'var(--accent-gold)', fontWeight:'bold'}}>SEARCH REPOSITORY</label>
                    <input
                        className="search-input"
                        placeholder="Search by name, category, or type (e.g. 'Dagger', 'Consumable', 'Weapon')"
                        value={repoSearch}
                        onChange={(e) => {
                            setRepoSearch(e.target.value);
                            setShowRepo(e.target.value.length > 1);
                        }}
                        onFocus={() => {
                            if (repoSearch.length > 1) setShowRepo(true);
                        }}
                    />

                    {/* Dropdown Results */}
                    {showRepo && repoSearch.length > 1 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#222',
                            border: '1px solid var(--accent-gold)',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 100,
                            borderRadius: '0 0 4px 4px'
                        }}>
                            {ITEM_REPOSITORY
                                .filter(i => {
                                    const search = repoSearch.toLowerCase();
                                    return i.name.toLowerCase().includes(search) ||
                                           i.category.toLowerCase().includes(search) ||
                                           i.type.toLowerCase().includes(search);
                                })
                                .map((repoItem, idx) => (
                                    <div
                                        key={idx}
                                        style={{padding: '8px', cursor: 'pointer', borderBottom:'1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{flex: 1}} onClick={() => {
                                            // Auto-fill the form
                                            setNewItem({
                                                name: repoItem.name,
                                                category: repoItem.category,
                                                type: repoItem.type,
                                                weight: repoItem.weight,
                                                value: repoItem.value,
                                                damage: repoItem.damage || '',
                                                ac: repoItem.ac,
                                                properties: repoItem.properties || '',
                                                requiresAttunement: repoItem.requiresAttunement || false,
                                                qty: 1
                                            });
                                            setRepoSearch('');
                                            setShowRepo(false);
                                        }}>
                                            <div style={{fontWeight:'bold', color:'var(--text-main)'}}>{repoItem.name}</div>
                                            <div style={{fontSize:'10px', color:'#888'}}>
                                                {repoItem.type} | {repoItem.weight}u {repoItem.damage ? `| ${repoItem.damage}` : ''}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!currentDisplayData) return;
                                                const createdItem: Item = {
                                                    id: uuidv4(),
                                                    name: repoItem.name,
                                                    category: repoItem.category,
                                                    type: repoItem.type,
                                                    weight: repoItem.weight,
                                                    qty: 1,
                                                    value: repoItem.value,
                                                    properties: repoItem.properties || '',
                                                    requiresAttunement: repoItem.requiresAttunement || false,
                                                    isAttuned: false,
                                                    notes: '',
                                                    ac: repoItem.ac,
                                                    damage: repoItem.damage,
                                                    damageModifier: '',
                                                    hitModifier: '',
                                                    equippedSlot: null,
                                                    charges: undefined,
                                                    maxCharges: undefined
                                                };
                                                handleUpdateData({ inventory: [...currentDisplayData.inventory, createdItem] });
                                            }}
                                            style={{
                                                background: 'var(--accent-gold)',
                                                color: 'black',
                                                border: 'none',
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginLeft: '8px'
                                            }}
                                        >
                                            ADD
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                {/* MANUAL FORM */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                    <div style={{gridColumn: 'span 2'}}>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Item Name</label>
                        <input 
                          className="search-input" 
                          value={newItem.name}
                          onChange={e => setNewItem({...newItem, name: e.target.value})}
                          placeholder="Ex: Longsword +1"
                        />
                    </div>

                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Category</label>
                        <select 
                          className="search-input"
                          value={newItem.category}
                          onChange={e => {
                             const cat = e.target.value as ItemCategory;
                             setNewItem({
                               ...newItem, 
                               category: cat, 
                               weight: DEFAULT_CATEGORY_WEIGHTS[cat] || 1
                             })
                          }}
                        >
                            {ITEM_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Type / Subtype</label>
                        <input 
                          className="search-input" 
                          value={newItem.type}
                          onChange={e => setNewItem({...newItem, type: e.target.value})}
                        />
                    </div>

                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Weight (Units)</label>
                        <input 
                          type="number"
                          className="search-input" 
                          value={newItem.weight}
                          onChange={e => setNewItem({...newItem, weight: parseFloat(e.target.value)})}
                        />
                    </div>

                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Quantity</label>
                        <input 
                          type="number"
                          className="search-input" 
                          value={newItem.qty}
                          onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value)})}
                        />
                    </div>

                    {(newItem.category?.includes('Weapon') || newItem.category === 'Shield') && (
                         <>
                            <div>
                                <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Damage (Ex: 1d8)</label>
                                <input
                                  className="search-input"
                                  value={newItem.damage || ''}
                                  onChange={e => setNewItem({...newItem, damage: e.target.value})}
                                />
                            </div>
                            <div>
                                <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Hit Modifier (Ex: +2)</label>
                                <input
                                  className="search-input"
                                  value={newItem.hitModifier || ''}
                                  onChange={e => setNewItem({...newItem, hitModifier: e.target.value})}
                                  placeholder="+0"
                                />
                            </div>
                            <div>
                                <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Damage Modifier (Ex: +1)</label>
                                <input
                                  className="search-input"
                                  value={newItem.damageModifier || ''}
                                  onChange={e => setNewItem({...newItem, damageModifier: e.target.value})}
                                  placeholder="+0"
                                />
                            </div>
                        </>
                    )}

                    {(newItem.category?.includes('Armor') || newItem.category === 'Shield') && (
                         <div>
                            <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>AC Bonus</label>
                            <input 
                              type="number"
                              className="search-input" 
                              value={newItem.ac || ''}
                              onChange={e => setNewItem({...newItem, ac: parseInt(e.target.value)})}
                            />
                        </div>
                    )}
                    
                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Value</label>
                        <input 
                          className="search-input" 
                          value={newItem.value}
                          onChange={e => setNewItem({...newItem, value: e.target.value})}
                          placeholder="10gp"
                        />
                    </div>

                    <div style={{display:'flex', alignItems:'center', marginTop: '10px'}}>
                         <input
                            type="checkbox"
                            id="attunement"
                            checked={newItem.requiresAttunement}
                            onChange={e => setNewItem({...newItem, requiresAttunement: e.target.checked})}
                            style={{marginRight: '8px'}}
                         />
                         <label htmlFor="attunement" style={{color:'var(--text-main)', fontSize:'12px'}}>Requires Attunement</label>
                    </div>

                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Current Charges</label>
                        <input
                          type="number"
                          className="search-input"
                          value={newItem.charges ?? ''}
                          onChange={e => setNewItem({...newItem, charges: e.target.value ? parseInt(e.target.value) : undefined})}
                          placeholder="Leave empty if no charges"
                        />
                    </div>

                    <div>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Max Charges</label>
                        <input
                          type="number"
                          className="search-input"
                          value={newItem.maxCharges ?? ''}
                          onChange={e => setNewItem({...newItem, maxCharges: e.target.value ? parseInt(e.target.value) : undefined})}
                          placeholder="Leave empty if no charges"
                        />
                    </div>

                    <div style={{gridColumn: 'span 2'}}>
                        <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Properties / Notes</label>
                        <textarea
                          className="search-input"
                          rows={3}
                          value={newItem.properties}
                          onChange={e => setNewItem({...newItem, properties: e.target.value})}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleCreateItem}
                    style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--accent-gold)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    FORGE ITEM
                </button>
             </div>
        )}

        {activeTab === 'External' && !viewingStorageId && (
            <div className="section">
                <h2>External Storage</h2>
                <div style={{marginBottom: '20px'}}>
                    {characterData.externalStorages.length === 0 ? <p style={{color:'#666', fontStyle:'italic'}}>No external storage created.</p> : (
                        characterData.externalStorages.map(storage => (
                            <div key={storage.id} style={{background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', marginBottom: '8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight:'bold'}}>{storage.name}</div>
                                    <div style={{fontSize:'11px', color:'#888'}}>{storage.type} | {storage.inventory.length} Items</div>
                                </div>
                                <div>
                                    <button onClick={() => { setViewingStorageId(storage.id); setActiveTab('Home'); }} style={{background: 'var(--accent-gold)', color: 'black', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginRight:'8px'}}>VIEW</button>
                                    <button onClick={() => deleteStorage(storage.id)} style={{background: '#333', color: '#888', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer'}}>X</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <h3>Add New Storage</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                    <input className="search-input" placeholder="Name (e.g. Shadowfax)" value={newStorage.name} onChange={e => setNewStorage({...newStorage, name: e.target.value})} />
                    <select className="search-input" value={newStorage.type} onChange={e => setNewStorage({...newStorage, type: e.target.value as StorageType})}>
                        {Object.keys(STORAGE_DEFINITIONS).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input className="search-input" placeholder="Description / Notes" value={newStorage.description} onChange={e => setNewStorage({...newStorage, description: e.target.value})} style={{gridColumn:'span 2'}} />
                </div>
                <button onClick={createStorage} style={{width:'100%', marginTop:'10px', padding:'10px', background:'var(--border)', color:'white', border:'none', cursor:'pointer'}}>CREATE STORAGE</button>
            </div>
        )}

        {activeTab === 'Transfer' && viewingStorageId && (
            <div className="section">
                <h2>Transfer Items</h2>
                {!characterData.externalStorages.find(s => s.id === viewingStorageId)?.isNearby ? (
                     <div style={{color: 'var(--danger)', textAlign:'center', padding:'20px'}}>
                         Storage is NOT Nearby.<br/>Cannot transfer items.
                     </div>
                ) : (
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '400px'}}>
                        <div style={{border: '1px solid #333', borderRadius: '4px', padding: '8px', overflowY: 'auto'}}>
                            <h3 style={{marginTop:0, fontSize:'12px', color:'var(--accent-gold)'}}>PLAYER</h3>
                            {characterData.inventory.map(item => (
                                <div key={item.id} style={{fontSize:'11px', borderBottom:'1px solid #333', padding:'4px', display:'flex', justifyContent:'space-between'}}>
                                    <span>{item.name} ({item.qty}) {item.equippedSlot && <span style={{color:'var(--accent-gold)'}}>[EQ]</span>}</span>
                                    <button onClick={() => transferItem(item, 'ToStorage')} style={{cursor:'pointer'}}>→</button>
                                </div>
                            ))}
                        </div>

                        <div style={{border: '1px solid #333', borderRadius: '4px', padding: '8px', overflowY: 'auto'}}>
                            <h3 style={{marginTop:0, fontSize:'12px', color:'var(--accent-gold)'}}>STORAGE</h3>
                            {currentDisplayData.inventory.map(item => (
                                <div key={item.id} style={{fontSize:'11px', borderBottom:'1px solid #333', padding:'4px', display:'flex', justifyContent:'space-between'}}>
                                    <button onClick={() => transferItem(item, 'ToPlayer')} style={{cursor:'pointer'}}>←</button>
                                    <span>{item.name} ({item.qty}) {item.equippedSlot && <span style={{color:'var(--accent-gold)'}}>[EQ]</span>}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'Coin' && stats && (
            <div className="section">
                <h2>Currency ({viewingStorageId ? 'Storage' : 'Player'})</h2>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {(['cp', 'sp', 'gp', 'pp'] as const).map((key) => {
                    const labels = { cp: 'Copper', sp: 'Silver', gp: 'Gold', pp: 'Platinum' };
                    // Fallback safe currency for display
                    const displayCurrency = currentDisplayData.currency || { cp: 0, sp: 0, gp: 0, pp: 0 };
                    return (
                      <div key={key} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
                        <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>{labels[key]}</label>
                        <input
                          type="number"
                          min="0"
                          value={displayCurrency[key]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateData({
                              currency: { ...displayCurrency, [key]: val }
                            });
                          }}
                          onFocus={(e) => e.target.select()}
                          disabled={!canEditToken()}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: canEditToken() ? 'text' : 'not-allowed',
                            opacity: canEditToken() ? 1 : 0.5
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="totals-grid">
                    <div className="stat-box"><div className="stat-label">Total Coins</div><div className={`stat-value ${stats.totalCoins > 30 ? 'warning' : ''}`}>{stats.totalCoins}</div></div>
                    {/* HIDE coin penalty limits/displays for storage as requested (or if logic dictates) but keep total count */}
                    {!viewingStorageId && <div className="stat-box"><div className="stat-label">Limit w/o Penalty</div><div className="stat-value">30</div></div>}
                    <div className="stat-box" style={{ border: stats.coinWeight > 0 ? '1px solid var(--danger)' : 'none' }}><div className="stat-label">Added Weight</div><div className={`stat-value ${stats.coinWeight > 0 ? 'danger' : ''}`}>+{stats.coinWeight}u</div></div>
                </div>
                {!viewingStorageId && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>* Penalized +1 Weight for every 10 coins over the limit of 30.</p>}

                {/* --- NEARBY STORAGE TRANSFERS --- */}
                {!viewingStorageId && characterData.externalStorages.some(s => s.isNearby) && (
                    <div style={{marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px'}}>
                        <h3 style={{fontSize:'14px', color:'var(--accent-gold)', marginTop:0}}>NEARBY STORAGE WALLETS</h3>
                        {characterData.externalStorages.filter(s => s.isNearby).map(storage => (
                             <div key={storage.id} style={{background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:'4px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                 <div>
                                     <div style={{fontWeight:'bold', fontSize:'12px'}}>{storage.name}</div>
                                     <div style={{fontSize:'10px', color:'#aaa'}}>
                                         {(storage.currency || {cp:0,sp:0,gp:0,pp:0}).gp} GP (Total)
                                     </div>
                                 </div>
                                 <div style={{display:'flex', gap:'4px'}}>
                                     <button onClick={() => transferNearbyCoins(storage.id, 'give')} style={{background:'#333', border:'none', color:'white', fontSize:'10px', padding:'4px 8px', borderRadius:'2px', cursor:'pointer'}}>GIVE</button>
                                     <button onClick={() => transferNearbyCoins(storage.id, 'take')} style={{background:'#333', border:'none', color:'white', fontSize:'10px', padding:'4px 8px', borderRadius:'2px', cursor:'pointer'}}>TAKE</button>
                                 </div>
                             </div>
                        ))}
                    </div>
                )}

                {/* --- VAULTS SECTION --- */}
                <div style={{marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px'}}>
                    <h3 style={{fontSize:'14px', color:'var(--accent-gold)', marginTop:0}}>VAULTS (BANKS)</h3>
                    {characterData.vaults.length === 0 && <p style={{fontSize:'11px', color:'#666'}}>No vaults created.</p>}
                    {characterData.vaults.map(vault => {
                        // Fallback for legacy vaults
                        const vCurrency = vault.currency || { cp: 0, sp: 0, gp: (vault as any).amount || 0, pp: 0 };
                        return (
                        <div key={vault.id} style={{background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:'4px', marginBottom:'8px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                                <div style={{fontWeight:'bold', color:'var(--text-main)'}}>{vault.name}</div>
                                <div style={{fontWeight:'bold', color:'var(--accent-gold)'}}>
                                    {vCurrency.gp > 0 ? `${vCurrency.gp} GP ` : ''}
                                    {vCurrency.sp > 0 ? `${vCurrency.sp} SP ` : ''}
                                    {vCurrency.cp > 0 ? `${vCurrency.cp} CP ` : ''}
                                    {vCurrency.pp > 0 ? `${vCurrency.pp} PP` : ''}
                                    {Object.values(vCurrency).every(v => v===0) ? 'Empty' : ''}
                                </div>
                            </div>
                            <div style={{display:'flex', gap:'4px'}}>
                                <button onClick={() => transferVaultFunds(vault.id, 'deposit')} style={{flex:1, background:'#333', border:'none', color:'white', fontSize:'10px', padding:'4px', borderRadius:'2px', cursor:'pointer'}}>DEPOSIT</button>
                                <button onClick={() => transferVaultFunds(vault.id, 'withdraw')} style={{flex:1, background:'#333', border:'none', color:'white', fontSize:'10px', padding:'4px', borderRadius:'2px', cursor:'pointer'}}>WITHDRAW</button>
                                <button onClick={() => deleteVault(vault.id)} style={{background:'#333', border:'none', color:'var(--danger)', fontSize:'10px', padding:'4px 8px', borderRadius:'2px', cursor:'pointer'}}>X</button>
                            </div>
                        </div>
                    )})}
                    <div style={{marginTop:'12px', display:'flex', gap:'8px'}}>
                        <input className="search-input" placeholder="New Vault Name" value={newVaultName} onChange={e => setNewVaultName(e.target.value)} style={{marginTop:0}} />
                        <button onClick={createVault} style={{background:'var(--border)', color:'white', border:'none', padding:'0 12px', borderRadius:'4px', cursor:'pointer'}}>ADD</button>
                    </div>
                </div>
            </div>
        )}

        {/* === TRADE TAB === */}
        {activeTab === 'Trade' && activeTrade && (
          <TradeTab
            activeTrade={activeTrade}
            playerId={playerId}
            characterData={characterData}
            player1Items={player1Items}
            player2Items={player2Items}
            setPlayer1Items={handleSetPlayer1Items}
            setPlayer2Items={handleSetPlayer2Items}
            otherPlayerData={otherPlayerData}
            playerRole={playerRole}
            isExecutingTrade={isExecutingTrade}
            handleApproveTrade={handleApproveTrade}
            handleCancelTrade={handleCancelTrade}
            player1CoinsOffered={player1CoinsOffered}
            player2CoinsOffered={player2CoinsOffered}
            setPlayer1CoinsOffered={handleSetPlayer1CoinsOffered}
            setPlayer2CoinsOffered={handleSetPlayer2CoinsOffered}
          />
        )}

        {/* === GM OVERVIEW TAB === */}
        {activeTab === 'GM' && playerRole === 'GM' && (
          <GMOverviewTab
            activeTrade={activeTrade}
            isExecutingTrade={isExecutingTrade}
            handleApproveTrade={handleApproveTrade}
            handleCancelTrade={handleCancelTrade}
            loadTokenById={loadTokenById}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Debug Panel Modal */}
      {showDebug && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowDebug(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            padding: '12px',
            width: 'min(500px, 90vw)',
            height: 'min(600px, 80vh)',
            display: 'flex',
            flexDirection: 'column',
            fontSize: '11px',
            color: 'white'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center', flexShrink: 0}}>
              <strong style={{color: '#ff6b6b'}}>Storage Debug</strong>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                CLOSE
              </button>
            </div>

            <div style={{flex: 1, overflowY: 'auto'}}>
            {debugInfo && (
              <>
                <div style={{marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                  <div style={{color: '#4dabf7', marginBottom: '4px'}}>✨ Current Token Storage:</div>
                  {tokenId ? (
                    <>
                      <div style={{fontSize: '14px', fontWeight: 'bold', color: debugInfo.tokenDataSize > 15000 ? '#ff6b6b' : '#51cf66'}}>
                        {debugInfo.tokenDataSize} bytes / 16384 bytes
                      </div>
                      <div style={{fontSize: '10px', color: '#aaa', marginTop: '2px'}}>
                        {((debugInfo.tokenDataSize / 16384) * 100).toFixed(1)}% used (this token only)
                      </div>
                    </>
                  ) : (
                    <div style={{color: '#aaa', fontSize: '10px'}}>No token selected</div>
                  )}
                </div>

                <div style={{marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                  <div style={{color: '#4dabf7', marginBottom: '4px'}}>Room Metadata (shared):</div>
                  <div style={{fontSize: '12px', color: debugInfo.roomSize > 15000 ? '#ff6b6b' : '#51cf66'}}>
                    {debugInfo.roomSize} bytes / 16384 bytes
                  </div>
                  <div style={{fontSize: '10px', color: '#aaa', marginTop: '2px'}}>
                    Used by all extensions ({debugInfo.roomKeys.length} keys)
                  </div>
                </div>

                <div style={{marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                  <div style={{color: '#4dabf7', marginBottom: '4px'}}>Legacy Data:</div>
                  {(debugInfo.hasLegacyRoomData || debugInfo.hasLegacyNameKeys) ? (
                    <>
                      <div style={{color: '#ff6b6b', fontWeight: 'bold'}}>
                        ⚠️ FOUND {debugInfo.hasLegacyNameKeys ? `(${debugInfo.legacyNameKeys.length} old keys)` : ''}
                      </div>
                      <button
                        onClick={cleanupLegacyData}
                        style={{
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginTop: '6px',
                          width: '100%'
                        }}
                      >
                        CLEANUP LEGACY DATA
                      </button>
                    </>
                  ) : (
                    <div style={{color: '#51cf66'}}>✓ Clean (using token storage)</div>
                  )}
                </div>

                <button
                  onClick={loadDebugInfo}
                  style={{
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    width: '100%'
                  }}
                >
                  REFRESH
                </button>
              </>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;