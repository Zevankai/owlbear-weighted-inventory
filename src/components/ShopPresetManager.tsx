/**
 * Shop Preset Manager Component
 * 
 * Provides UI for creating, editing, and managing shop presets for merchants.
 */

import React, { useState, useMemo } from 'react';
import type { ShopPreset, ShopPresetItem } from '../types';
import { useShopPresets } from '../hooks/useShopPresets';
import { useRepository } from '../context/RepositoryContext';

interface ShopPresetManagerProps {
  onClose: () => void;
}

export const ShopPresetManager: React.FC<ShopPresetManagerProps> = ({ onClose }) => {
  const { presets, loading, addPreset, updatePreset, deletePreset } = useShopPresets();
  const { itemRepository } = useRepository();
  
  const [editingPreset, setEditingPreset] = useState<ShopPreset | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Create a new preset
  const handleCreateNew = () => {
    const newPreset: ShopPreset = {
      id: crypto.randomUUID(),
      name: 'New Preset',
      description: '',
      items: [],
      priceModifier: 1.0,
      buybackRate: 0.5,
      stockRandomization: 100,
    };
    setEditingPreset(newPreset);
    setIsCreatingNew(true);
  };
  
  // Edit existing preset
  const handleEdit = (preset: ShopPreset) => {
    setEditingPreset(preset);
    setIsCreatingNew(false);
  };
  
  // Delete preset
  const handleDelete = async (presetId: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      await deletePreset(presetId);
    }
  };
  
  // Save preset (create or update)
  const handleSave = async () => {
    if (!editingPreset) return;
    
    const success = isCreatingNew
      ? await addPreset(editingPreset)
      : await updatePreset(editingPreset);
    
    if (success) {
      setEditingPreset(null);
      setIsCreatingNew(false);
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    setEditingPreset(null);
    setIsCreatingNew(false);
  };
  
  // Add item to preset
  const handleAddItem = (repositoryItemId: string) => {
    if (!editingPreset) return;
    
    const newItem: ShopPresetItem = {
      repositoryItemId,
      defaultQty: 1,
      qtyVariance: 0,
    };
    
    setEditingPreset({
      ...editingPreset,
      items: [...editingPreset.items, newItem],
    });
  };
  
  // Remove item from preset
  const handleRemoveItem = (index: number) => {
    if (!editingPreset) return;
    
    setEditingPreset({
      ...editingPreset,
      items: editingPreset.items.filter((_, i) => i !== index),
    });
  };
  
  // Update item quantity
  const handleUpdateItemQty = (index: number, defaultQty: number) => {
    if (!editingPreset) return;
    
    const updatedItems = [...editingPreset.items];
    updatedItems[index] = { ...updatedItems[index], defaultQty };
    
    setEditingPreset({
      ...editingPreset,
      items: updatedItems,
    });
  };
  
  // Update item variance
  const handleUpdateItemVariance = (index: number, qtyVariance: number) => {
    if (!editingPreset) return;
    
    const updatedItems = [...editingPreset.items];
    updatedItems[index] = { ...updatedItems[index], qtyVariance };
    
    setEditingPreset({
      ...editingPreset,
      items: updatedItems,
    });
  };
  
  // Get item name by repository ID
  const getItemName = (repositoryItemId?: string): string => {
    if (!repositoryItemId) return 'Custom Item';
    const item = itemRepository.find((i) => i.id === repositoryItemId);
    return item?.name ?? 'Unknown Item';
  };
  
  // Modal overlay styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };
  
  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-dark, #1a1a2e)',
    borderRadius: '8px',
    padding: '20px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid rgba(139, 195, 74, 0.3)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  };
  
  const greenButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, rgba(139, 195, 74, 0.8), rgba(104, 159, 56, 0.8))',
    color: '#fff',
  };
  
  const redButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.8), rgba(198, 40, 40, 0.8))',
    color: '#fff',
  };
  
  const grayButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, rgba(97, 97, 97, 0.8), rgba(66, 66, 66, 0.8))',
    color: '#fff',
  };
  
  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading presets...
          </div>
        </div>
      </div>
    );
  }
  
  // Render preset editor
  if (editingPreset) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h2 style={{ color: '#8BC34A', marginTop: 0 }}>
            {isCreatingNew ? 'Create New Preset' : 'Edit Preset'}
          </h2>
          
          {/* Preset Name */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Preset Name
            </label>
            <input
              type="text"
              value={editingPreset.name}
              onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(139, 195, 74, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#fff',
              }}
            />
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description (optional)
            </label>
            <textarea
              value={editingPreset.description || ''}
              onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(139, 195, 74, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#fff',
                minHeight: '60px',
              }}
            />
          </div>
          
          {/* Price Modifier */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Price Modifier: {(editingPreset.priceModifier * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={editingPreset.priceModifier}
              onChange={(e) => setEditingPreset({ ...editingPreset, priceModifier: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              0.5x (50% discount) to 2.0x (200% markup)
            </div>
          </div>
          
          {/* Buyback Rate */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Buyback Rate: {(editingPreset.buybackRate * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={editingPreset.buybackRate}
              onChange={(e) => setEditingPreset({ ...editingPreset, buybackRate: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              How much merchant pays for items (10% to 100% of value)
            </div>
          </div>
          
          {/* Stock Randomization */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Stock Randomization: {editingPreset.stockRandomization ?? 100}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={editingPreset.stockRandomization ?? 100}
              onChange={(e) => setEditingPreset({ ...editingPreset, stockRandomization: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              Probability that each item appears in generated stock
            </div>
          </div>
          
          {/* Item List */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Items ({editingPreset.items.length})
            </label>
            
            {/* Items */}
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid rgba(139, 195, 74, 0.2)',
              borderRadius: '4px',
              padding: '10px',
              marginBottom: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
            }}>
              {editingPreset.items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>
                  No items added yet
                </div>
              ) : (
                editingPreset.items.map((item, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px',
                      padding: '8px',
                      background: 'rgba(139, 195, 74, 0.1)',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ flex: 1, fontWeight: 'bold' }}>
                      {getItemName(item.repositoryItemId)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '12px' }}>Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.defaultQty}
                        onChange={(e) => handleUpdateItemQty(index, parseInt(e.target.value) || 1)}
                        style={{
                          width: '50px',
                          padding: '4px',
                          borderRadius: '4px',
                          border: '1px solid rgba(139, 195, 74, 0.3)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '12px' }}>±</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={item.qtyVariance ?? 0}
                        onChange={(e) => handleUpdateItemVariance(index, parseInt(e.target.value) || 0)}
                        style={{
                          width: '50px',
                          padding: '4px',
                          borderRadius: '4px',
                          border: '1px solid rgba(139, 195, 74, 0.3)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      style={{
                        ...redButtonStyle,
                        padding: '4px 8px',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Add Item Dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(139, 195, 74, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#fff',
              }}
            >
              <option value="">Add item from repository...</option>
              {itemRepository.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={grayButtonStyle}>
              Cancel
            </button>
            <button onClick={handleSave} style={greenButtonStyle}>
              {isCreatingNew ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render preset list
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#8BC34A', margin: 0 }}>
            Shop Presets
          </h2>
          <button onClick={onClose} style={grayButtonStyle}>
            Close
          </button>
        </div>
        
        {/* Preset List */}
        <div style={{ marginBottom: '20px' }}>
          {presets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#aaa',
              border: '1px dashed rgba(139, 195, 74, 0.3)',
              borderRadius: '4px',
            }}>
              No presets created yet. Click "Create New Preset" to get started.
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  background: 'rgba(139, 195, 74, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(139, 195, 74, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#8BC34A', marginBottom: '4px' }}>
                      {preset.name}
                    </div>
                    {preset.description && (
                      <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>
                        {preset.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(preset)} style={greenButtonStyle}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(preset.id)} style={redButtonStyle}>
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  📦 {preset.items.length} items • 
                  💰 {(preset.priceModifier * 100).toFixed(0)}% price • 
                  🤝 {(preset.buybackRate * 100).toFixed(0)}% buyback • 
                  🎲 {preset.stockRandomization ?? 100}% stock chance
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Create New Button */}
        <button onClick={handleCreateNew} style={greenButtonStyle}>
          + Create New Preset
        </button>
      </div>
    </div>
  );
};
