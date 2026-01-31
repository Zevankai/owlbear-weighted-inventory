import { useState } from 'react';
import type { ActiveTrade, Tab, ItemCategory } from '../../types';
import { useRepository } from '../../context/RepositoryContext';
import type { RepoItem } from '../../data/repository';
import { ITEM_CATEGORIES, DEFAULT_CATEGORY_WEIGHTS } from '../../constants';

interface GMOverviewTabProps {
  activeTrade: ActiveTrade | null;
  isExecutingTrade: boolean;
  handleCancelTrade: () => void;
  loadTokenById: (tokenId: string) => void;
  setActiveTab: (tab: Tab) => void;
}

export function GMOverviewTab({
  activeTrade,
  isExecutingTrade,
  handleCancelTrade,
  loadTokenById,
  setActiveTab,
}: GMOverviewTabProps) {
  // Repository context
  const { itemRepository, customItems, addCustomItem, updateCustomItems } = useRepository();

  // State for new repository item form
  const [newRepoItem, setNewRepoItem] = useState<Partial<RepoItem>>({
    name: '',
    category: 'Other' as ItemCategory,
    type: '',
    weight: 1,
    value: '',
    damage: '',
    ac: undefined,
    properties: '',
    requiresAttunement: false,
  });

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // State for editing
  const [editingItem, setEditingItem] = useState<RepoItem | null>(null);

  // Handler to create repository item
  const handleCreateRepoItem = async () => {
    if (!newRepoItem.name) {
      alert('Item name is required');
      return;
    }

    const repoItem: RepoItem = {
      name: newRepoItem.name,
      category: newRepoItem.category as ItemCategory,
      type: newRepoItem.type || 'Gear',
      weight: newRepoItem.weight || 0,
      value: newRepoItem.value || '0 gp',
      damage: newRepoItem.damage,
      ac: newRepoItem.ac,
      properties: newRepoItem.properties,
      requiresAttunement: newRepoItem.requiresAttunement || false,
    };

    const success = await addCustomItem(repoItem);
    
    if (success) {
      // Reset form
      setNewRepoItem({
        name: '',
        category: 'Other' as ItemCategory,
        type: '',
        weight: 1,
        value: '',
        damage: '',
        ac: undefined,
        properties: '',
        requiresAttunement: false,
      });
      alert(`Item "${repoItem.name}" added to repository!`);
    } else {
      alert('Failed to add item to repository');
    }
  };

  // Handler to edit repository item
  const handleEditRepoItem = async () => {
    if (!editingItem) return;

    const updatedCustomItems = customItems.map(item =>
      item.name === editingItem.name ? editingItem : item
    );

    const success = await updateCustomItems(updatedCustomItems);
    
    if (success) {
      setEditingItem(null);
      alert(`Item "${editingItem.name}" updated!`);
    } else {
      alert('Failed to update item');
    }
  };

  // Handler to delete repository item
  const handleDeleteRepoItem = async (itemToDelete: RepoItem) => {
    if (!confirm(`Are you sure you want to delete "${itemToDelete.name}" from the repository?`)) {
      return;
    }

    const updatedCustomItems = customItems.filter(item => item.name !== itemToDelete.name);
    const success = await updateCustomItems(updatedCustomItems);
    
    if (success) {
      alert(`Item "${itemToDelete.name}" deleted from repository`);
    } else {
      alert('Failed to delete item');
    }
  };

  // Check if an item is custom (editable)
  const isCustomItem = (item: RepoItem) => {
    return customItems.some(custom => custom.name === item.name);
  };

  // Filter items based on search
  const searchResults = searchQuery.length > 1
    ? itemRepository.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div className="section">
      <h2>GM Overview</h2>

      {/* Active Trade Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Active Trade
        </h3>
        {activeTrade ? (
          <div
            style={{
              background: 'rgba(74,158,255,0.1)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #4a9eff',
            }}
          >
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
              <strong>Type:</strong> Player-to-Player
            </div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>
              <strong>{activeTrade.player1Name}</strong> ↔{' '}
              <strong>{activeTrade.player2Name}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
              {activeTrade.player1Confirmed && (
                <span style={{ color: '#0f0' }}>✓ {activeTrade.player1Name}</span>
              )}
              {!activeTrade.player1Confirmed && <span>○ {activeTrade.player1Name}</span>}
              <span style={{ margin: '0 8px' }}>|</span>
              {activeTrade.player2Confirmed && (
                <span style={{ color: '#0f0' }}>✓ {activeTrade.player2Name}</span>
              )}
              {!activeTrade.player2Confirmed && <span>○ {activeTrade.player2Name}</span>}
            </div>
            <div style={{ fontSize: '12px', marginBottom: '12px' }}>
              <strong>Status:</strong> {activeTrade.status}
            </div>
            {/* Trade Summary */}
            {(activeTrade.player1OfferedItems.length > 0 || activeTrade.player2OfferedItems.length > 0) && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  fontSize: '11px',
                }}
              >
                <div style={{ marginBottom: '6px' }}>
                  <strong>Items Trading:</strong>
                </div>
                {activeTrade.player1OfferedItems.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: '#4a9eff', fontSize: '10px' }}>{activeTrade.player1Name} gives:</div>
                    {activeTrade.player1OfferedItems.map((item, i) => (
                      <div key={i} style={{ paddingLeft: '8px', color: '#aaa' }}>
                        • {item.name} x{item.qty}
                      </div>
                    ))}
                  </div>
                )}
                {activeTrade.player2OfferedItems.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: '#4a9eff', fontSize: '10px' }}>{activeTrade.player2Name} gives:</div>
                    {activeTrade.player2OfferedItems.map((item, i) => (
                      <div key={i} style={{ paddingLeft: '8px', color: '#aaa' }}>
                        • {item.name} x{item.qty}
                      </div>
                    ))}
                  </div>
                )}
                {/* Show coins being traded */}
                {activeTrade.player1OfferedCoins && (
                  activeTrade.player1OfferedCoins.cp > 0 || 
                  activeTrade.player1OfferedCoins.sp > 0 || 
                  activeTrade.player1OfferedCoins.gp > 0 || 
                  activeTrade.player1OfferedCoins.pp > 0
                ) && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontSize: '10px' }}>{activeTrade.player1Name}'s coins:</div>
                    <div style={{ paddingLeft: '8px', color: '#aaa' }}>
                      {activeTrade.player1OfferedCoins.cp > 0 && `${activeTrade.player1OfferedCoins.cp}cp `}
                      {activeTrade.player1OfferedCoins.sp > 0 && `${activeTrade.player1OfferedCoins.sp}sp `}
                      {activeTrade.player1OfferedCoins.gp > 0 && `${activeTrade.player1OfferedCoins.gp}gp `}
                      {activeTrade.player1OfferedCoins.pp > 0 && `${activeTrade.player1OfferedCoins.pp}pp`}
                    </div>
                  </div>
                )}
                {activeTrade.player2OfferedCoins && (
                  activeTrade.player2OfferedCoins.cp > 0 || 
                  activeTrade.player2OfferedCoins.sp > 0 || 
                  activeTrade.player2OfferedCoins.gp > 0 || 
                  activeTrade.player2OfferedCoins.pp > 0
                ) && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontSize: '10px' }}>{activeTrade.player2Name}'s coins:</div>
                    <div style={{ paddingLeft: '8px', color: '#aaa' }}>
                      {activeTrade.player2OfferedCoins.cp > 0 && `${activeTrade.player2OfferedCoins.cp}cp `}
                      {activeTrade.player2OfferedCoins.sp > 0 && `${activeTrade.player2OfferedCoins.sp}sp `}
                      {activeTrade.player2OfferedCoins.gp > 0 && `${activeTrade.player2OfferedCoins.gp}gp `}
                      {activeTrade.player2OfferedCoins.pp > 0 && `${activeTrade.player2OfferedCoins.pp}pp`}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (activeTrade.player1TokenId) {
                    loadTokenById(activeTrade.player1TokenId);
                    setActiveTab('Home');
                  }
                }}
                style={{
                  background: '#4a9eff',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                VIEW PLAYER 1
              </button>
              <button
                onClick={handleCancelTrade}
                disabled={isExecutingTrade}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: isExecutingTrade ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                CANCEL TRADE
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '11px', color: '#666' }}>No active trade</p>
        )}
      </div>

      {/* Create Repository Item Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Create Repository Item
        </h3>
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Item Name *
              </label>
              <input
                className="search-input"
                value={newRepoItem.name}
                onChange={e => setNewRepoItem({ ...newRepoItem, name: e.target.value })}
                placeholder="Ex: Longsword +1"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Category
              </label>
              <select
                className="search-input"
                value={newRepoItem.category}
                onChange={e => {
                  const cat = e.target.value as ItemCategory;
                  setNewRepoItem({
                    ...newRepoItem,
                    category: cat,
                    weight: DEFAULT_CATEGORY_WEIGHTS[cat] || 1
                  });
                }}
              >
                {ITEM_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Type
              </label>
              <input
                className="search-input"
                value={newRepoItem.type}
                onChange={e => setNewRepoItem({ ...newRepoItem, type: e.target.value })}
                placeholder="Ex: Martial Melee Weapons"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Weight (Units)
              </label>
              <input
                type="number"
                className="search-input"
                value={newRepoItem.weight}
                onChange={e => setNewRepoItem({ ...newRepoItem, weight: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Value
              </label>
              <input
                className="search-input"
                value={newRepoItem.value}
                onChange={e => setNewRepoItem({ ...newRepoItem, value: e.target.value })}
                placeholder="10gp"
              />
            </div>

            {(newRepoItem.category?.includes('Weapon') || newRepoItem.category === 'Shield') && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Damage
                </label>
                <input
                  className="search-input"
                  value={newRepoItem.damage || ''}
                  onChange={e => setNewRepoItem({ ...newRepoItem, damage: e.target.value })}
                  placeholder="1d8 Slashing"
                />
              </div>
            )}

            {(newRepoItem.category?.includes('Armor') || newRepoItem.category === 'Shield') && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  AC
                </label>
                <input
                  type="number"
                  className="search-input"
                  value={newRepoItem.ac || ''}
                  onChange={e => setNewRepoItem({ ...newRepoItem, ac: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Properties
              </label>
              <input
                className="search-input"
                value={newRepoItem.properties || ''}
                onChange={e => setNewRepoItem({ ...newRepoItem, properties: e.target.value })}
                placeholder="Ex: Versatile (1d10), Finesse"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="repo-attunement"
                checked={newRepoItem.requiresAttunement}
                onChange={e => setNewRepoItem({ ...newRepoItem, requiresAttunement: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="repo-attunement" style={{ color: 'var(--text-main)', fontSize: '12px' }}>
                Requires Attunement
              </label>
            </div>
          </div>

          <button
            onClick={handleCreateRepoItem}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              background: 'var(--accent-gold)',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ADD TO REPOSITORY
          </button>
        </div>
      </div>

      {/* Manage Repository Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Manage Repository
        </h3>
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Search Items
            </label>
            <input
              className="search-input"
              placeholder="Search by name, category, or type"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 1);
              }}
              onFocus={() => {
                if (searchQuery.length > 1) setShowSearchResults(true);
              }}
            />
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #444',
              borderRadius: '4px',
            }}>
              {searchResults.map((item, idx) => {
                const isCustom = isCustomItem(item);
                const isEditing = editingItem?.name === item.name;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      borderBottom: idx < searchResults.length - 1 ? '1px solid #333' : 'none',
                      background: isCustom ? 'rgba(240, 225, 48, 0.05)' : 'transparent',
                      border: isCustom ? '1px solid rgba(240, 225, 48, 0.3)' : 'none',
                      borderRadius: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    {isEditing ? (
                      // Edit Form
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Name</label>
                            <input
                              className="search-input"
                              value={editingItem.name}
                              onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Category</label>
                            <select
                              className="search-input"
                              value={editingItem.category}
                              onChange={e => setEditingItem({ ...editingItem, category: e.target.value as ItemCategory })}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              {ITEM_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Type</label>
                            <input
                              className="search-input"
                              value={editingItem.type}
                              onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Weight</label>
                            <input
                              type="number"
                              className="search-input"
                              value={editingItem.weight}
                              onChange={e => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) })}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Value</label>
                            <input
                              className="search-input"
                              value={editingItem.value}
                              onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            />
                          </div>
                          {(editingItem.category?.includes('Weapon') || editingItem.category === 'Shield') && (
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Damage</label>
                              <input
                                className="search-input"
                                value={editingItem.damage || ''}
                                onChange={e => setEditingItem({ ...editingItem, damage: e.target.value })}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              />
                            </div>
                          )}
                          {(editingItem.category?.includes('Armor') || editingItem.category === 'Shield') && (
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>AC</label>
                              <input
                                type="number"
                                className="search-input"
                                value={editingItem.ac || ''}
                                onChange={e => setEditingItem({ ...editingItem, ac: parseInt(e.target.value) })}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              />
                            </div>
                          )}
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '2px' }}>Properties</label>
                            <input
                              className="search-input"
                              value={editingItem.properties || ''}
                              onChange={e => setEditingItem({ ...editingItem, properties: e.target.value })}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              id={`edit-attunement-${idx}`}
                              checked={editingItem.requiresAttunement || false}
                              onChange={e => setEditingItem({ ...editingItem, requiresAttunement: e.target.checked })}
                              style={{ marginRight: '6px' }}
                            />
                            <label htmlFor={`edit-attunement-${idx}`} style={{ fontSize: '11px' }}>Requires Attunement</label>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={handleEditRepoItem}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              background: 'var(--accent-gold)',
                              color: 'black',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            SAVE
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              background: '#555',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '13px' }}>
                                {item.name}
                              </span>
                              {isCustom && (
                                <span style={{
                                  fontSize: '9px',
                                  padding: '2px 6px',
                                  background: 'var(--accent-gold)',
                                  color: 'black',
                                  borderRadius: '3px',
                                  fontWeight: 'bold',
                                }}>
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                              <span>{item.category}</span>
                              <span style={{ margin: '0 6px', color: '#555' }}>|</span>
                              <span>{item.type}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                              Weight: {item.weight}u
                              <span style={{ margin: '0 6px', color: '#555' }}>|</span>
                              Value: {item.value}
                              {item.damage && (
                                <>
                                  <span style={{ margin: '0 6px', color: '#555' }}>|</span>
                                  Damage: {item.damage}
                                </>
                              )}
                              {item.ac !== undefined && (
                                <>
                                  <span style={{ margin: '0 6px', color: '#555' }}>|</span>
                                  AC: {item.ac}
                                </>
                              )}
                            </div>
                            {item.properties && (
                              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                                {item.properties}
                              </div>
                            )}
                            {item.requiresAttunement && (
                              <div style={{ fontSize: '10px', color: 'var(--accent-gold)', marginTop: '2px' }}>
                                ⚡ Requires Attunement
                              </div>
                            )}
                          </div>
                          {isCustom && (
                            <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                              <button
                                onClick={() => setEditingItem({ ...item })}
                                style={{
                                  padding: '4px 10px',
                                  background: '#4a9eff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                }}
                              >
                                EDIT
                              </button>
                              <button
                                onClick={() => handleDeleteRepoItem(item)}
                                style={{
                                  padding: '4px 10px',
                                  background: 'var(--danger)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                }}
                              >
                                DELETE
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && (
            <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', padding: '12px' }}>
              No items found matching "{searchQuery}"
            </p>
          )}

          {!showSearchResults && (
            <p style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
              Enter at least 2 characters to search the repository
            </p>
          )}
        </div>
      </div>

      {/* Info section */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#888'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Player-to-Player Trading:</strong> Players can initiate trades by clicking on another player's claimed token and selecting "TRADE WITH PLAYER".
          Both players must confirm the trade for it to execute.
        </p>
      </div>
    </div>
  );
}
