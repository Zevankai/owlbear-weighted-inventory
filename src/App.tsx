import React, { useState, useEffect, Fragment } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

// Data & Types
import { useInventory } from './hooks/useInventory';
import { usePackLogic } from './hooks/usePackLogic';
import { ITEM_CATEGORIES, DEFAULT_CATEGORY_WEIGHTS, PACK_DEFINITIONS, STORAGE_DEFINITIONS } from './constants';
import { ITEM_REPOSITORY } from './data/repository';
import type { Item, ItemCategory, PackType, StorageType, CharacterData, Vault, Currency } from './types';

// Define the Tab types
type Tab = 'Home' | 'Pack' | 'Weapons' | 'Body' | 'Quick' | 'Coin' | 'Create' | 'External' | 'Search' | 'Transfer';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [ready, setReady] = useState(false);
  
  // State for External Storage Viewing
  const [viewingStorageId, setViewingStorageId] = useState<string | null>(null);

  // 1. Load Inventory Data
  const { tokenId, tokenName, tokenImage, characterData, updateData, loading } = useInventory();

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
        gmNotes: '', 
    };
  })();

  const stats = usePackLogic(currentDisplayData);

  // Form States
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '', category: 'Other', type: 'Gear', weight: 1, qty: 1, value: '', properties: '', requiresAttunement: false,
  });
  const [repoSearch, setRepoSearch] = useState('');
  const [showRepo, setShowRepo] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [globalSearch, setGlobalSearch] = useState(''); 

  const [newStorage, setNewStorage] = useState<{name: string; description: string; type: StorageType}>({
      name: '', description: '', type: 'Small Pet'
  });

  const [newVaultName, setNewVaultName] = useState('');

  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    OBR.onReady(() => setReady(true));
  }, []);

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
      id: uuidv4(), name: newItem.name, category: newItem.category as ItemCategory, type: newItem.type || 'Gear', weight: newItem.weight || 0, qty: newItem.qty || 1, value: newItem.value || '', properties: newItem.properties || '', requiresAttunement: newItem.requiresAttunement || false, isAttuned: false, notes: '', ac: newItem.ac, damage: newItem.damage, equippedSlot: null
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
  if (!tokenId || !characterData || !currentDisplayData) return <div className="loading">No Data</div>;

  const baseTabs: { id: Tab; label?: string; icon?: React.ReactNode }[] = [
    { id: 'Home', label: '||' }, { id: 'Pack', label: 'PACK' }, { id: 'Weapons', label: 'WEAPONS' }, { id: 'Body', label: 'BODY' }, { id: 'Quick', label: 'QUICK' },
    { id: 'Search', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> },
    { id: 'Create', label: 'CREATE' }, { id: 'External', label: 'STORAGE' }, { id: 'Coin', label: 'COIN' },
  ];

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

  const activeStorageDef = viewingStorageId ? STORAGE_DEFINITIONS[characterData.externalStorages.find(s => s.id === viewingStorageId)!.type] : null;

  return (
    <div className="app-container" style={viewingStorageId ? {border: '2px solid var(--accent-gold)'} : {}}>
      {viewingStorageId && (
          <div style={{background: 'var(--accent-gold)', color: 'black', padding: '4px 8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>VIEWING: {currentDisplayData.condition}</span>
              <button onClick={() => { setViewingStorageId(null); setActiveTab('External'); }} style={{background:'black', color:'white', border:'none', padding:'2px 6px', fontSize:'10px', cursor:'pointer'}}>EXIT</button>
          </div>
      )}
      <nav className="nav-bar">
        {visibleTabs.map((tab) => <button key={tab.id} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} title={tab.id}>{tab.icon ? tab.icon : tab.label}</button>)}
      </nav>

      <main className="content">
        {activeTab === 'Home' && stats && (
            <div className="section">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2>{viewingStorageId ? 'Storage Stats' : 'Dashboard'}</h2>
                    {/* Debug button - subtle and only on Home tab */}
                    <button
                        onClick={() => { setShowDebug(true); loadDebugInfo(); }}
                        style={{
                            background: 'transparent',
                            color: '#666',
                            border: '1px solid #333',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '9px',
                            fontWeight: 'normal'
                        }}
                        title="Storage Debug Info"
                    >
                        ⚙
                    </button>
                </div>
                
                {/* --- TOKEN PROFILE (Player Only) --- */}
                {!viewingStorageId && (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px'}}>
                        {tokenImage && (
                            <div style={{
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                overflow: 'hidden', 
                                border: '3px solid var(--accent-gold)',
                                background: 'transparent', // Clear background
                                marginBottom: '8px'
                            }}>
                                <img 
                                src={tokenImage} 
                                alt="Token" 
                                style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                                />
                            </div>
                        )}
                        <div style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)'}}>
                            {tokenName || 'Unknown Character'}
                        </div>
                    </div>
                )}

                {!viewingStorageId ? (
                    <div style={{marginBottom: '16px'}}>
                        <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>Current Pack</label>
                        <select value={characterData.packType} onChange={(e) => updateData({ packType: e.target.value as PackType })} className="search-input" style={{marginTop: '4px', fontWeight: 'bold', color: 'var(--accent-gold)'}}>
                            {Object.keys(PACK_DEFINITIONS).map(pack => <option key={pack} value={pack}>{pack} Pack</option>)}
                        </select>
                    </div>
                ) : (
                    <div style={{marginBottom: '16px'}}>
                         <div style={{color: '#888', fontSize: '12px'}}>Type: {characterData.externalStorages.find(s => s.id === viewingStorageId)?.type}</div>
                         <div style={{marginTop:'10px'}}>
                            <label style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px'}}>
                                <input type="checkbox" checked={characterData.externalStorages.find(s => s.id === viewingStorageId)?.isNearby} onChange={(e) => {
                                        const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? {...s, isNearby: e.target.checked} : s);
                                        updateData({ externalStorages: newStorages });
                                }} /> Is Nearby?
                            </label>
                         </div>
                    </div>
                )}
                <div className="totals-grid">
                    <div className="stat-box"><div className="stat-label">TOTAL WEIGHT</div><div className={`stat-value ${stats.totalWeight > (activeStorageDef?.capacity || stats.maxCapacity) ? 'danger' : ''}`}>{stats.totalWeight} <span style={{fontSize:'10px', color:'#666'}}>/ {activeStorageDef ? activeStorageDef.capacity : stats.maxCapacity}</span></div></div>
                    <div className="stat-box"><div className="stat-label">COIN WEIGHT</div><div className={`stat-value ${stats.coinWeight > 0 ? 'danger' : ''}`}>{stats.coinWeight}u</div></div>
                    <div className="stat-box"><div className="stat-label">ITEMS</div><div className="stat-value">{currentDisplayData.inventory.length}</div></div>
                </div>

                {!viewingStorageId && (
                    <>
                        <h2 style={{marginTop: '20px', border: 'none'}}>SLOT USAGE</h2>
                        <div className="totals-grid">
                            <div className="stat-box" style={{borderColor: stats.usedSlots.weapon > stats.maxSlots.weapon ? 'var(--danger)' : 'transparent', borderStyle:'solid', borderWidth:'1px'}}>
                                <div className="stat-label">WEAPONS</div>
                                <div className={`stat-value ${stats.usedSlots.weapon > stats.maxSlots.weapon ? 'danger' : ''}`}>{stats.usedSlots.weapon} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.weapon}</span></div>
                            </div>
                            <div className="stat-box" style={{borderColor: stats.usedSlots.armor > stats.maxSlots.armor ? 'var(--danger)' : 'transparent', borderStyle:'solid', borderWidth:'1px'}}>
                                <div className="stat-label">ARMOR</div>
                                <div className={`stat-value ${stats.usedSlots.armor > stats.maxSlots.armor ? 'danger' : ''}`}>{stats.usedSlots.armor} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.armor}</span></div>
                            </div>
                            <div className="stat-box"><div className="stat-label">CLOTHING</div><div className="stat-value">{stats.usedSlots.clothing} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.clothing}</span></div></div>
                            <div className="stat-box"><div className="stat-label">JEWELRY</div><div className="stat-value">{stats.usedSlots.jewelry} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.jewelry}</span></div></div>
                            <div className="stat-box" style={{gridColumn: 'span 2', background: 'rgba(240, 225, 48, 0.05)'}}><div className="stat-label" style={{color: 'var(--accent-gold)'}}>UTILITY / QUICK</div><div className="stat-value">{stats.usedSlots.utility} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.utility}</span></div></div>
                        </div>
                    </>
                )}
                
                <div style={{marginTop: '20px'}}>
                    <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>{viewingStorageId ? 'Description' : 'Condition'}</label>
                    <textarea value={currentDisplayData.condition} onChange={(e) => handleUpdateData({ condition: e.target.value })} className="search-input" rows={2} />
                </div>
                <div style={{marginTop: '10px'}}>
                    <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>{viewingStorageId ? 'Notes' : 'GM Notes'}</label>
                    <textarea value={viewingStorageId ? characterData.externalStorages.find(s => s.id === viewingStorageId)?.notes : currentDisplayData.gmNotes} onChange={(e) => {
                         if(viewingStorageId) {
                            const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? {...s, notes: e.target.value} : s);
                            updateData({ externalStorages: newStorages });
                         } else {
                             handleUpdateData({ gmNotes: e.target.value });
                         }
                    }} className="search-input" rows={3} />
                </div>
            </div>
        )}

        {activeTab === 'Pack' && (
            <div className="section" style={{padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%'}}>
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
                                <th style={{padding: '8px 4px', textAlign:'center'}}>WT</th>
                                <th style={{padding: '8px 4px', textAlign:'right'}}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDisplayData.inventory.filter(item => item.name.toLowerCase().includes(filterText.toLowerCase())).map((item) => (
                                <Fragment key={item.id}>
                                    <tr style={{borderTop: '1px solid #333'}}>
                                        <td style={{padding: '8px 4px', width: '50px'}}><input type="number" value={item.qty} min="1" onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, qty: parseInt(e.target.value)} : i); handleUpdateData({inventory: newInv}); }} style={{width: '40px', background: '#222', border: '1px solid #444', color: 'white', textAlign: 'center', padding: '4px'}} /></td>
                                        <td style={{padding: '8px 4px'}}><div style={{fontWeight: 'bold', color: item.equippedSlot ? 'var(--accent-gold)' : 'var(--text-main)'}}>{item.name}</div>{item.equippedSlot && <div style={{fontSize: '9px', textTransform:'uppercase', color:'var(--accent-gold)'}}>[EQ: {item.equippedSlot}]</div>}</td>
                                        <td style={{padding: '8px 4px', width: '100px'}}><select value={item.category} onChange={(e) => { const cat = e.target.value as ItemCategory; const newWeight = DEFAULT_CATEGORY_WEIGHTS[cat] || item.weight; const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, category: cat, weight: newWeight} : i); handleUpdateData({inventory: newInv}); }} style={{width: '100%', background: 'transparent', border: 'none', color: '#aaa', fontSize: '11px', textOverflow:'ellipsis'}}>{ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></td>
                                        <td style={{padding: '8px 4px', textAlign:'center', fontSize: '11px', color: '#888'}}>{item.weight * item.qty}</td>
                                        <td style={{padding: '8px 4px', textAlign:'right'}}>
                                            <button onClick={() => handleToggleEquip(item)} style={{background: 'none', border: 'none', cursor: 'pointer', color: item.equippedSlot ? 'var(--accent-gold)' : '#555', padding: 0, marginRight: 4}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></button>
                                            <button onClick={() => handleSell(item)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0, marginRight: 4}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></button>
                                            <button onClick={() => handleDelete(item.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                        </td>
                                    </tr>
                                    <tr style={{background: 'rgba(0,0,0,0.1)'}}>
                                        <td colSpan={5} style={{padding: '4px 8px 12px 8px', borderBottom: '1px solid #222'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <input placeholder="Notes / Properties..." value={item.properties || ''} onChange={(e) => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, properties: e.target.value} : i); handleUpdateData({inventory: newInv}); }} style={{flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#888', fontSize: '10px', padding: '0 4px'}} />
                                                {item.requiresAttunement && (<div onClick={() => { const newInv = currentDisplayData.inventory.map(i => i.id === item.id ? {...i, isAttuned: !i.isAttuned} : i); handleUpdateData({inventory: newInv}); }} style={{cursor: 'pointer', color: item.isAttuned ? 'cyan' : '#444', fontSize: '14px', marginLeft:'8px'}} title="Toggle Attunement">{item.isAttuned ? '★' : '☆'}</div>)}
                                            </div>
                                        </td>
                                    </tr>
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
                        <div><div style={{fontWeight:'bold', color: 'var(--text-main)'}}>{item.name}</div><div style={{fontSize:'11px', color:'var(--accent-gold)'}}>{item.damage || 'No Damage'}</div><div style={{fontSize:'10px', color:'#888', fontStyle:'italic'}}>{item.properties || 'No properties'}</div></div>
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
                        placeholder="Type to find item (e.g. 'Dagger')"
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
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 100,
                            borderRadius: '0 0 4px 4px'
                        }}>
                            {ITEM_REPOSITORY
                                .filter(i => i.name.toLowerCase().includes(repoSearch.toLowerCase()))
                                .map((repoItem, idx) => (
                                    <div 
                                        key={idx}
                                        style={{padding: '8px', cursor: 'pointer', borderBottom:'1px solid #333'}}
                                        onClick={() => {
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
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{fontWeight:'bold', color:'var(--text-main)'}}>{repoItem.name}</div>
                                        <div style={{fontSize:'10px', color:'#888'}}>
                                            {repoItem.type} | {repoItem.weight}u {repoItem.damage ? `| ${repoItem.damage}` : ''}
                                        </div>
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
                         <div>
                            <label style={{display:'block', fontSize:'11px', color:'var(--text-muted)'}}>Damage (Ex: 1d8)</label>
                            <input 
                              className="search-input" 
                              value={newItem.damage || ''}
                              onChange={e => setNewItem({...newItem, damage: e.target.value})}
                            />
                        </div>
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
                          style={{ 
                            width: '100%', 
                            background: 'transparent', 
                            border: 'none', 
                            borderBottom: '1px solid var(--border)', 
                            color: 'var(--text-main)', 
                            fontSize: '18px',
                            fontWeight: 'bold'
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
            width: '300px',
            maxHeight: '400px',
            overflow: 'auto',
            fontSize: '11px',
            color: 'white'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center'}}>
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
        </>
      )}
    </div>
  );
}

export default App;