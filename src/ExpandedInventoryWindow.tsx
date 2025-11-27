import { useState, useEffect, Fragment } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

import { usePackLogic } from './hooks/usePackLogic';
import { ITEM_CATEGORIES, DEFAULT_CATEGORY_WEIGHTS, EXPANDED_POPOVER_ID } from './constants';
import { ITEM_REPOSITORY } from './data/repository';
import type { Item, ItemCategory, CharacterData } from './types';

export default function ExpandedInventoryWindow() {
  const [loading, setLoading] = useState(true);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<'GM' | 'PLAYER'>('PLAYER');

  // Form States
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '', category: 'Other', type: 'Gear', weight: 1, qty: 1, value: '', properties: '', requiresAttunement: false,
  });
  const [repoSearch, setRepoSearch] = useState('');
  const [showRepo, setShowRepo] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const stats = usePackLogic(characterData);

  // Initialize OBR and load data
  useEffect(() => {
    OBR.onReady(async () => {
      const id = await OBR.player.getId();
      const role = await OBR.player.getRole();
      setPlayerId(id);
      setPlayerRole(role);
      setLoading(false);
    });
  }, []);

  // Poll for token selection and data updates
  useEffect(() => {
    if (loading) return;

    const pollData = async () => {
      try {
        const selection = await OBR.player.getSelection();
        if (!selection || selection.length === 0) return;

        const selectedId = selection[0];
        const items = await OBR.scene.items.getItems([selectedId]);
        if (items.length === 0) return;

        const token = items[0];
        setTokenId(token.id);
        setTokenName(token.name || 'Unknown');
        setTokenImage((token as { image?: { url?: string } }).image?.url || null);

        const data = token.metadata['com.weighted-inventory/data'] as CharacterData | undefined;
        if (data) {
          setCharacterData(data);
        }
      } catch (err) {
        console.error('Error polling token data:', err);
      }
    };

    pollData();
    const interval = setInterval(pollData, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  // Update token data
  const updateData = async (updates: Partial<CharacterData>) => {
    if (!tokenId || !characterData) return;

    const newData = { ...characterData, ...updates };
    setCharacterData(newData);

    try {
      await OBR.scene.items.updateItems([tokenId], (items) => {
        for (const item of items) {
          item.metadata['com.weighted-inventory/data'] = newData;
        }
      });
    } catch (err) {
      console.error('Failed to update token data:', err);
    }
  };

  // Check if player can edit this token
  const canEditToken = () => {
    if (playerRole === 'GM') return true;
    if (characterData?.claimedBy === playerId) return true;
    return false;
  };

  // Handle creating a new item
  const handleCreateItem = () => {
    if (!newItem.name || !characterData) return;
    const createdItem: Item = {
      id: uuidv4(),
      name: newItem.name,
      category: newItem.category as ItemCategory,
      type: newItem.type || 'Gear',
      weight: newItem.weight || 0,
      qty: newItem.qty || 1,
      value: newItem.value || '',
      properties: newItem.properties || '',
      requiresAttunement: newItem.requiresAttunement || false,
      isAttuned: false,
      notes: '',
      ac: newItem.ac,
      damage: newItem.damage,
      equippedSlot: null,
      charges: newItem.charges,
      maxCharges: newItem.maxCharges,
      damageModifier: newItem.damageModifier,
      hitModifier: newItem.hitModifier
    };
    updateData({ inventory: [...characterData.inventory, createdItem] });
    setNewItem({ name: '', category: 'Other', type: 'Gear', weight: 1, qty: 1, value: '', properties: '', requiresAttunement: false });
  };

  // Handle deleting an item
  const handleDelete = (itemId: string) => {
    if (!characterData) return;
    if (window.confirm("Delete this item?")) {
      updateData({ inventory: characterData.inventory.filter(i => i.id !== itemId) });
    }
  };

  // Handle selling an item
  const handleSell = (item: Item) => {
    if (!characterData) return;
    const qtyToSellStr = window.prompt(`How many "${item.name}" to sell? (Max: ${item.qty})`, "1");
    if (!qtyToSellStr) return;
    const qtyToSell = parseInt(qtyToSellStr);
    if (isNaN(qtyToSell) || qtyToSell <= 0 || qtyToSell > item.qty) return;

    const valueStr = item.value.toLowerCase();
    let coinType: 'cp' | 'sp' | 'gp' | 'pp' = 'gp';
    if (valueStr.includes('pp')) coinType = 'pp';
    else if (valueStr.includes('sp')) coinType = 'sp';
    else if (valueStr.includes('cp')) coinType = 'cp';

    const unitValue = parseFloat(valueStr.replace(/[^0-9.]/g, '')) || 0;
    const finalPriceStr = window.prompt(`Selling ${qtyToSell} x ${item.name}.\nTotal Value (${coinType}):`, (unitValue * qtyToSell).toString());
    if (finalPriceStr === null) return;
    const finalPrice = parseFloat(finalPriceStr) || 0;

    const newInventory = characterData.inventory.map(i => i.id === item.id ? { ...i, qty: i.qty - qtyToSell } : i).filter(i => i.qty > 0);
    const newCurrency = { ...characterData.currency };
    newCurrency[coinType] = (newCurrency[coinType] || 0) + finalPrice;
    updateData({ inventory: newInventory, currency: newCurrency });
  };

  // Handle equipping/unequipping an item
  const handleToggleEquip = (item: Item) => {
    if (!characterData || !stats) return;

    if (item.equippedSlot) {
      // Unequip
      const matchingStack = characterData.inventory.find(i =>
        i.id !== item.id &&
        i.name === item.name &&
        i.category === item.category &&
        i.value === item.value &&
        !i.equippedSlot
      );

      if (matchingStack) {
        const newInventory = characterData.inventory
          .map(i => i.id === matchingStack.id ? { ...i, qty: i.qty + item.qty } : i)
          .filter(i => i.id !== item.id);
        updateData({ inventory: newInventory });
      } else {
        const newInventory = characterData.inventory.map(i => i.id === item.id ? { ...i, equippedSlot: null } : i);
        updateData({ inventory: newInventory });
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

    if (pack === 'Utility' && item.weight < 2) allowedInUtility = true;
    if (pack === 'Warrior' && cat === 'One-Handed Weapon') allowedInUtility = true;
    if ((pack === 'Explorer' || pack === 'Tinkerer') && cat === 'Tool/Kit') allowedInUtility = true;
    if (pack === 'Travel' && cat === 'Camp') allowedInUtility = true;
    if (pack === 'Shadow') { if (cat === 'One-Handed Weapon' || cat === 'Tool/Kit') allowedInUtility = true; }

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
      else { if (validSlots.includes(lower as Item['equippedSlot'])) chosenSlot = lower as Item['equippedSlot']; else return; }
    }

    if (chosenSlot) {
      let cost = 1;
      if (chosenSlot === 'weapon' && cat === 'Two-Handed Weapon') cost = 2;
      if (chosenSlot === 'armor' && cat === 'Medium Armor') cost = 2;
      if (chosenSlot === 'armor' && cat === 'Heavy Armor') cost = 3;
      const currentUsed = stats.usedSlots[chosenSlot];
      const maxAllowed = stats.maxSlots[chosenSlot];

      if (currentUsed + cost > maxAllowed) {
        alert(`Not enough space in ${chosenSlot.toUpperCase()}.\nCost: ${cost}\nAvailable: ${maxAllowed - currentUsed}`);
        return;
      }

      const isAmmo = ['Ammo', 'Light Ammo'].includes(item.category);
      if (!isAmmo && item.qty > 1) {
        const equippedItem = { ...item, id: uuidv4(), qty: 1, equippedSlot: chosenSlot };
        const remainingItem = { ...item, qty: item.qty - 1 };
        const newInventory = characterData.inventory.map(i =>
          i.id === item.id ? remainingItem : i
        );
        newInventory.push(equippedItem);
        updateData({ inventory: newInventory });
      } else {
        const newInventory = characterData.inventory.map(i => i.id === item.id ? { ...i, equippedSlot: chosenSlot } : i);
        updateData({ inventory: newInventory });
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetItemId: string) => {
    if (!characterData || !draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    const items = characterData.inventory;
    const draggedIndex = items.findIndex(i => i.id === draggedItemId);
    const targetIndex = items.findIndex(i => i.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    updateData({ inventory: newItems });
    setDraggedItemId(null);
  };

  // Close the expanded window
  const handleClose = () => {
    OBR.popover.close(EXPANDED_POPOVER_ID);
  };

  if (loading) {
    return (
      <div className="loading">
        Loading expanded inventory...
      </div>
    );
  }

  if (!tokenId || !characterData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-dark)',
        color: 'var(--text-main)'
      }}>
        <div style={{fontSize: '48px', marginBottom: '16px'}}>📦</div>
        <p style={{fontSize: '16px', marginBottom: '8px'}}>No token selected</p>
        <p style={{fontSize: '12px', color: 'var(--text-muted)'}}>Select a token on the map to view its inventory</p>
        <button
          onClick={handleClose}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'var(--border)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close Window
        </button>
      </div>
    );
  }

  const filteredInventory = characterData.inventory.filter(item =>
    item.name.toLowerCase().includes(filterText.toLowerCase())
  );

  // Group items by equipped slot for quick access
  const equippedWeapons = characterData.inventory.filter(i => i.equippedSlot === 'weapon');
  const equippedArmor = characterData.inventory.filter(i => i.equippedSlot === 'armor');
  const equippedUtility = characterData.inventory.filter(i => i.equippedSlot === 'utility');

  return (
    <div className="app-container" style={{background: 'var(--bg-dark)'}}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(0,0,0,0.3)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          {tokenImage && (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--accent-gold)'
            }}>
              <img src={tokenImage} alt={tokenName || ''} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          )}
          <div>
            <h1 style={{margin: 0, fontSize: '18px', color: 'var(--accent-gold)'}}>{tokenName}</h1>
            <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>
              {characterData.packType} Pack • {characterData.inventory.length} Items
              {stats && ` • ${stats.totalWeight}/${stats.maxCapacity}u`}
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'var(--border)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          CLOSE
        </button>
      </div>

      {/* Main Content */}
      <div style={{flex: 1, display: 'flex', overflow: 'hidden'}}>
        {/* Left Panel - Equipped Items & Quick Stats */}
        <div style={{
          width: '220px',
          borderRight: '1px solid var(--glass-border)',
          padding: '12px',
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {/* Stats */}
          {stats && (
            <div style={{marginBottom: '16px'}}>
              <h3 style={{margin: '0 0 8px 0', fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase'}}>Stats</h3>
              <div style={{display: 'grid', gap: '4px', fontSize: '11px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px'}}>
                  <span style={{color: 'var(--text-muted)'}}>Weight</span>
                  <span style={{color: stats.totalWeight > stats.maxCapacity ? 'var(--danger)' : 'var(--text-main)'}}>{stats.totalWeight}/{stats.maxCapacity}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px'}}>
                  <span style={{color: 'var(--text-muted)'}}>Weapons</span>
                  <span>{stats.usedSlots.weapon}/{stats.maxSlots.weapon}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px'}}>
                  <span style={{color: 'var(--text-muted)'}}>Armor</span>
                  <span>{stats.usedSlots.armor}/{stats.maxSlots.armor}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px'}}>
                  <span style={{color: 'var(--text-muted)'}}>Utility</span>
                  <span>{stats.usedSlots.utility}/{stats.maxSlots.utility}</span>
                </div>
              </div>
            </div>
          )}

          {/* Equipped Weapons */}
          <div style={{marginBottom: '16px'}}>
            <h3 style={{margin: '0 0 8px 0', fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase'}}>Equipped Weapons</h3>
            {equippedWeapons.length === 0 ? (
              <div style={{fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic'}}>None equipped</div>
            ) : (
              equippedWeapons.map(item => (
                <div key={item.id} style={{
                  padding: '6px 8px',
                  background: 'rgba(240, 225, 48, 0.1)',
                  border: '1px solid rgba(240, 225, 48, 0.3)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '11px'
                }}>
                  <div style={{fontWeight: 'bold', color: 'var(--text-main)'}}>{item.name}</div>
                  {item.damage && <div style={{fontSize: '10px', color: 'var(--accent-gold)'}}>{item.damage}</div>}
                </div>
              ))
            )}
          </div>

          {/* Equipped Armor */}
          <div style={{marginBottom: '16px'}}>
            <h3 style={{margin: '0 0 8px 0', fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase'}}>Equipped Armor</h3>
            {equippedArmor.length === 0 ? (
              <div style={{fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic'}}>None equipped</div>
            ) : (
              equippedArmor.map(item => (
                <div key={item.id} style={{
                  padding: '6px 8px',
                  background: 'rgba(100, 149, 237, 0.1)',
                  border: '1px solid rgba(100, 149, 237, 0.3)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '11px'
                }}>
                  <div style={{fontWeight: 'bold', color: 'var(--text-main)'}}>{item.name}</div>
                  {item.ac && <div style={{fontSize: '10px', color: '#6495ed'}}>AC +{item.ac}</div>}
                </div>
              ))
            )}
          </div>

          {/* Equipped Utility */}
          <div>
            <h3 style={{margin: '0 0 8px 0', fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase'}}>Quick Slots</h3>
            {equippedUtility.length === 0 ? (
              <div style={{fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic'}}>None equipped</div>
            ) : (
              equippedUtility.map(item => (
                <div key={item.id} style={{
                  padding: '6px 8px',
                  background: 'rgba(77, 255, 136, 0.1)',
                  border: '1px solid rgba(77, 255, 136, 0.3)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '11px'
                }}>
                  <div style={{fontWeight: 'bold', color: 'var(--text-main)'}}>{item.name}</div>
                  {item.qty > 1 && <div style={{fontSize: '10px', color: 'var(--success)'}}>x{item.qty}</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Panel - Full Inventory */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
          {/* Search Bar */}
          <div style={{padding: '12px', borderBottom: '1px solid var(--glass-border)'}}>
            <input
              type="text"
              placeholder="Search items..."
              className="search-input"
              style={{marginTop: 0}}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          {/* Inventory Table */}
          <div style={{flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid var(--border)', color: 'var(--accent-gold)', fontSize: '10px', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--bg-dark)'}}>
                  <th style={{padding: '8px 4px'}}>QTY</th>
                  <th style={{padding: '8px 4px'}}>ITEM</th>
                  <th style={{padding: '8px 4px'}}>TYPE</th>
                  <th style={{padding: '8px 4px'}}>VALUE</th>
                  <th style={{padding: '8px 4px', textAlign: 'center'}}>CHARGES</th>
                  <th style={{padding: '8px 4px', textAlign: 'center'}}>WT</th>
                  <th style={{padding: '8px 4px', textAlign: 'right'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <Fragment key={item.id}>
                    <tr
                      draggable={canEditToken()}
                      onDragStart={() => handleDragStart(item.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(item.id)}
                      style={{
                        borderTop: '1px solid #333',
                        cursor: canEditToken() ? 'grab' : 'default',
                        opacity: draggedItemId === item.id ? 0.5 : 1,
                        background: draggedItemId === item.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{padding: '8px 4px', width: '50px'}}>
                        <input
                          type="number"
                          value={item.qty}
                          min="1"
                          disabled={!canEditToken()}
                          onChange={(e) => {
                            const parsedQty = parseInt(e.target.value);
                            if (isNaN(parsedQty) || parsedQty < 1) return;
                            const newInv = characterData.inventory.map(i => i.id === item.id ? {...i, qty: parsedQty} : i);
                            updateData({inventory: newInv});
                          }}
                          style={{width: '40px', background: '#222', border: '1px solid #444', color: 'white', textAlign: 'center', padding: '4px'}}
                        />
                      </td>
                      <td style={{padding: '8px 4px'}}>
                        <div style={{fontWeight: 'bold', fontSize: '13px', color: item.equippedSlot ? 'var(--accent-gold)' : 'var(--text-main)'}}>{item.name}</div>
                        {item.equippedSlot && <div style={{fontSize: '9px', textTransform: 'uppercase', color: 'var(--accent-gold)'}}>[EQ: {item.equippedSlot}]</div>}
                      </td>
                      <td style={{padding: '8px 4px', width: '100px'}}>
                        <select
                          value={item.category}
                          disabled={!canEditToken()}
                          onChange={(e) => {
                            const cat = e.target.value as ItemCategory;
                            const newWeight = DEFAULT_CATEGORY_WEIGHTS[cat] || item.weight;
                            const newInv = characterData.inventory.map(i => i.id === item.id ? {...i, category: cat, weight: newWeight} : i);
                            updateData({inventory: newInv});
                          }}
                          style={{width: '100%', background: 'transparent', border: 'none', color: '#aaa', fontSize: '11px'}}
                        >
                          {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </td>
                      <td style={{padding: '8px 4px', fontSize: '11px', color: '#888'}}>{item.value || '-'}</td>
                      <td style={{padding: '8px 4px', textAlign: 'center', fontSize: '11px'}}>
                        {item.maxCharges !== undefined ? (
                          <span style={{color: (item.charges || 0) === 0 ? '#f44' : 'var(--text-main)'}}>
                            {item.charges || 0}/{item.maxCharges}
                          </span>
                        ) : <span style={{color: '#444'}}>-</span>}
                      </td>
                      <td style={{padding: '8px 4px', textAlign: 'center', fontSize: '11px', color: '#888'}}>{item.weight * item.qty}</td>
                      <td style={{padding: '8px 4px', textAlign: 'right'}}>
                        {canEditToken() && (
                          <>
                            <button onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: editingItemId === item.id ? 'var(--accent-gold)' : '#555', padding: '2px', marginRight: '4px'}} title="Edit">✎</button>
                            <button onClick={() => handleToggleEquip(item)} style={{background: 'none', border: 'none', cursor: 'pointer', color: item.equippedSlot ? 'var(--accent-gold)' : '#555', padding: '2px', marginRight: '4px'}} title="Equip/Unequip">⚔</button>
                            <button onClick={() => handleSell(item)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '2px', marginRight: '4px'}} title="Sell">$</button>
                            <button onClick={() => handleDelete(item.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '2px'}} title="Delete">✕</button>
                          </>
                        )}
                      </td>
                    </tr>
                    {editingItemId === item.id && canEditToken() && (
                      <tr style={{background: 'rgba(0,0,0,0.3)'}}>
                        <td colSpan={7} style={{padding: '12px'}}>
                          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px'}}>
                            <div>
                              <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Name</label>
                              <input className="search-input" style={{marginTop: 0}} value={item.name} onChange={(e) => { const newInv = characterData.inventory.map(i => i.id === item.id ? {...i, name: e.target.value} : i); updateData({inventory: newInv}); }} />
                            </div>
                            <div>
                              <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Weight</label>
                              <input type="number" className="search-input" style={{marginTop: 0}} value={item.weight} onChange={(e) => { const newInv = characterData.inventory.map(i => i.id === item.id ? {...i, weight: parseFloat(e.target.value)} : i); updateData({inventory: newInv}); }} />
                            </div>
                            <div>
                              <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Value</label>
                              <input className="search-input" style={{marginTop: 0}} value={item.value} onChange={(e) => { const newInv = characterData.inventory.map(i => i.id === item.id ? {...i, value: e.target.value} : i); updateData({inventory: newInv}); }} />
                            </div>
                            <div style={{gridColumn: 'span 3'}}>
                              <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Properties / Notes</label>
                              <textarea className="search-input" style={{marginTop: 0, minHeight: '50px'}} value={item.properties || ''} onChange={(e) => { const newInv = characterData.inventory.map(i => i.id === item.id ? {...i, properties: e.target.value} : i); updateData({inventory: newInv}); }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {editingItemId !== item.id && item.properties && (
                      <tr style={{background: 'rgba(0,0,0,0.1)'}}>
                        <td colSpan={7} style={{padding: '4px 8px 8px 8px', fontSize: '10px', color: '#888', fontStyle: 'italic'}}>
                          {item.properties}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Create Item */}
        {canEditToken() && (
          <div style={{
            width: '280px',
            borderLeft: '1px solid var(--glass-border)',
            padding: '12px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.2)'
          }}>
            <h3 style={{margin: '0 0 12px 0', fontSize: '12px', color: 'var(--accent-gold)', textTransform: 'uppercase'}}>Add Item</h3>

            {/* Repository Search */}
            <div style={{position: 'relative', marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Search Repository</label>
              <input
                className="search-input"
                style={{marginTop: 0}}
                placeholder="Search items..."
                value={repoSearch}
                onChange={(e) => {
                  setRepoSearch(e.target.value);
                  setShowRepo(e.target.value.length > 1);
                }}
              />
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
                    .filter(i => i.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
                                 i.category.toLowerCase().includes(repoSearch.toLowerCase()))
                    .slice(0, 10)
                    .map((repoItem, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
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
                            equippedSlot: null,
                            charges: undefined,
                            maxCharges: undefined,
                            damageModifier: '',
                            hitModifier: ''
                          };
                          updateData({ inventory: [...characterData.inventory, createdItem] });
                          setRepoSearch('');
                          setShowRepo(false);
                        }}
                        style={{padding: '8px', cursor: 'pointer', borderBottom: '1px solid #333', fontSize: '11px'}}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{fontWeight: 'bold'}}>{repoItem.name}</div>
                        <div style={{fontSize: '10px', color: '#888'}}>{repoItem.type} • {repoItem.weight}u</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <div style={{borderTop: '1px dashed var(--border)', paddingTop: '12px'}}>
              <label style={{display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px'}}>Or Create Custom</label>

              <input
                className="search-input"
                placeholder="Item Name"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                style={{marginBottom: '8px'}}
              />

              <select
                className="search-input"
                value={newItem.category}
                onChange={e => {
                  const cat = e.target.value as ItemCategory;
                  setNewItem({...newItem, category: cat, weight: DEFAULT_CATEGORY_WEIGHTS[cat] || 1});
                }}
                style={{marginBottom: '8px'}}
              >
                {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px'}}>
                <div>
                  <label style={{fontSize: '9px', color: 'var(--text-muted)'}}>Weight</label>
                  <input
                    type="number"
                    className="search-input"
                    value={newItem.weight}
                    onChange={e => setNewItem({...newItem, weight: parseFloat(e.target.value)})}
                    style={{marginTop: '2px'}}
                  />
                </div>
                <div>
                  <label style={{fontSize: '9px', color: 'var(--text-muted)'}}>Qty</label>
                  <input
                    type="number"
                    className="search-input"
                    value={newItem.qty}
                    onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value)})}
                    style={{marginTop: '2px'}}
                  />
                </div>
              </div>

              <input
                className="search-input"
                placeholder="Value (e.g. 10gp)"
                value={newItem.value}
                onChange={e => setNewItem({...newItem, value: e.target.value})}
                style={{marginBottom: '8px'}}
              />

              <button
                onClick={handleCreateItem}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--accent-gold)',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ADD ITEM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
