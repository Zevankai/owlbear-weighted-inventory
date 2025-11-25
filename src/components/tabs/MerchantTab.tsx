import type { CharacterData, ActiveTrade, MerchantItem, Item, ItemCategory } from '../../types';
import type { RepoItem } from '../../data/repository';
import { calculateBuyback } from '../../utils/currency';
import { calculateTradeCost } from '../../utils/trade';
import OBR from '@owlbear-rodeo/sdk';
import { v4 as uuidv4 } from 'uuid';

interface MerchantTabProps {
  characterData: CharacterData;
  playerRole: string;
  tokenImage: string | null;
  tokenName: string | null;
  currentDisplayData: CharacterData;
  toggleFavorite: () => void;
  isFavorited: boolean;
  favorites: Array<{ id: string; name: string }>;
  setViewingFavorites: (viewing: boolean) => void;
  activeTrade: ActiveTrade | null;
  playerId: string | null;
  handleStartTrade: (tokenId: string) => void;
  tokenId: string | null;
  selectedMerchantItems: MerchantItem[];
  handleToggleMerchantItem: (item: MerchantItem) => void;
  playerOwnInventory: Item[];
  selectedPlayerItems: Item[];
  handleTogglePlayerItem: (item: Item) => void;
  handleCancelTrade: () => void;
  ACTIVE_TRADE_KEY: string;
  newItem: Partial<Item>;
  setNewItem: (item: Partial<Item>) => void;
  ITEM_CATEGORIES: readonly string[];
  handleUpdateData: (updates: Partial<CharacterData>) => void;
  repoSearch: string;
  setRepoSearch: (search: string) => void;
  ITEM_REPOSITORY: RepoItem[];
  handleAddToMerchantShop: (item: RepoItem) => void;
  handleUpdateMerchantPrice: (itemId: string, newPrice: string) => void;
  handleRemoveFromMerchantShop: (itemId: string) => void;
}

export function MerchantTab({
  characterData,
  playerRole,
  tokenImage,
  tokenName,
  currentDisplayData,
  toggleFavorite,
  isFavorited,
  favorites,
  setViewingFavorites,
  activeTrade,
  playerId,
  handleStartTrade,
  tokenId,
  selectedMerchantItems,
  handleToggleMerchantItem,
  playerOwnInventory,
  selectedPlayerItems,
  handleTogglePlayerItem,
  handleCancelTrade,
  ACTIVE_TRADE_KEY,
  newItem,
  setNewItem,
  ITEM_CATEGORIES,
  handleUpdateData,
  repoSearch,
  setRepoSearch,
  ITEM_REPOSITORY,
  handleAddToMerchantShop,
  handleUpdateMerchantPrice,
  handleRemoveFromMerchantShop
}: MerchantTabProps) {
  return (
    <div className="section">
      <h2>{playerRole === 'GM' ? 'Merchant Shop Management' : 'Merchant Shop'}</h2>

      {/* Player: Merchant Profile */}
      {playerRole !== 'GM' && (
        <div style={{marginBottom: '20px', width: '100%'}}>
          {tokenImage && (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--accent-gold)',
              background: 'transparent',
              margin: '0 auto 8px auto'
            }}>
              <img
                src={tokenImage}
                alt="Merchant"
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </div>
          )}
          <div style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center', marginBottom: '8px'}}>
            {tokenName || 'Unknown Merchant'}
          </div>
          {currentDisplayData.condition && (
            <div style={{marginTop: '12px'}}>
              <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase', marginBottom: '4px'}}>
                Description
              </label>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#ccc',
                lineHeight: '1.5',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {currentDisplayData.condition}
              </div>
            </div>
          )}
          <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
            <button
              onClick={toggleFavorite}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid ' + (isFavorited ? 'var(--accent-gold)' : '#666'),
                color: isFavorited ? 'var(--accent-gold)' : '#666',
                padding: '6px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? '⭐' : '☆'} {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </button>
            {favorites.length > 0 && (
              <button
                onClick={() => setViewingFavorites(true)}
                style={{
                  flex: 1,
                  background: 'rgba(240, 225, 48, 0.1)',
                  border: '1px solid var(--accent-gold)',
                  color: 'var(--accent-gold)',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
                title="View all favorite tokens"
              >
                ⭐ View Favorites
              </button>
            )}
          </div>
        </div>
      )}

      {/* GM Only: Buyback rate info */}
      {playerRole === 'GM' && (
        <div style={{background: 'rgba(240,225,48,0.1)', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
          <p style={{fontSize: '12px', margin: 0}}>
            <strong>Buyback Rate:</strong> {(characterData.merchantShop!.buybackRate * 100).toFixed(0)}% (Players sell items for {(characterData.merchantShop!.buybackRate * 100).toFixed(0)}% of their value)
          </p>
        </div>
      )}

      {/* Player: Trading interface or info */}
      {playerRole !== 'GM' && (
        <>
          {activeTrade && activeTrade.type === 'merchant' && activeTrade.player1Id === playerId ? (
            // Active trading interface
            <div style={{background: 'rgba(240,225,48,0.1)', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
              <p style={{fontSize: '12px', margin: 0, marginBottom: '8px'}}>
                <strong>Trading Session Active</strong>
              </p>
              <p style={{fontSize: '10px', color: '#aaa', margin: 0}}>
                Select items below to buy or sell. Your cart is shown at the bottom.
              </p>
            </div>
          ) : (
            // Not trading - show button to start trade
            <div style={{marginBottom: '16px'}}>
              <button
                onClick={() => {
                  console.log('[START TRADE] Button clicked, merchantTokenId:', tokenId);
                  if (tokenId) handleStartTrade(tokenId);
                }}
                style={{
                  width: '100%',
                  background: 'var(--accent-gold)',
                  border: 'none',
                  color: 'black',
                  padding: '12px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                TRADE WITH MERCHANT
              </button>
            </div>
          )}
        </>
      )}

      <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>
        {playerRole === 'GM' ? 'Shop Inventory' : 'Available Items'}
      </h3>
      {characterData.merchantShop!.inventory.length === 0 && (
        <p style={{fontSize: '11px', color: '#666', marginBottom: '16px'}}>
          {playerRole === 'GM' ? 'No items in shop. Add items from the repository below.' : 'This shop has no items for sale.'}
        </p>
      )}

      <div style={{marginBottom: '24px', width: '100%'}}>
        {characterData.merchantShop!.inventory.map(item => {
          const isTrading = activeTrade && activeTrade.type === 'merchant' && activeTrade.player1Id === playerId;
          const isSelected = isTrading && selectedMerchantItems.some(si => si.id === item.id);

          return (
            <div
              key={item.id}
              onClick={() => isTrading && handleToggleMerchantItem(item)}
              style={{
                background: isSelected ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: isTrading ? 'pointer' : 'default',
                border: isSelected ? '2px solid #0f0' : '2px solid transparent'
              }}
            >
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold', fontSize: '13px'}}>
                  {isSelected && '✓ '}{item.name}
                </div>
                <div style={{fontSize: '10px', color: '#aaa', marginTop: '2px'}}>
                  Qty: {item.qty} | Category: {item.category}
                  {item.weight && ` | Weight: ${item.weight}u`}
                </div>
              </div>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '11px', color: 'var(--accent-gold)'}}>
                    {playerRole === 'GM' ? 'Sell: ' : ''}{item.sellPrice || item.value}
                  </div>
                  {playerRole === 'GM' && (
                    <div style={{fontSize: '10px', color: '#aaa'}}>
                      Buy: {item.buyPrice}
                    </div>
                  )}
                </div>
                {/* GM-only edit/remove buttons */}
                {playerRole === 'GM' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newPrice = prompt('Enter new sell price (e.g., "50 gp"):', item.sellPrice || item.value);
                        if (newPrice) handleUpdateMerchantPrice(item.id, newPrice);
                      }}
                      style={{background: '#333', border: 'none', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '2px', cursor: 'pointer'}}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromMerchantShop(item.id);
                      }}
                      style={{background: '#333', border: 'none', color: 'var(--danger)', fontSize: '10px', padding: '4px 8px', borderRadius: '2px', cursor: 'pointer'}}
                    >
                      X
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Player's Inventory (if actively trading) */}
      {activeTrade && activeTrade.type === 'merchant' && activeTrade.player1Id === playerId && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Your Items to Sell</h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>
            Click items you want to sell to the merchant (buyback at 80%)
          </p>
          {playerOwnInventory.length === 0 ? (
            <p style={{fontSize: '10px', color: '#666'}}>Your inventory is empty</p>
          ) : (
            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
              {playerOwnInventory.map(item => {
                const isSelected = selectedPlayerItems.some(si => si.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleTogglePlayerItem(item)}
                    style={{
                      background: isSelected ? 'rgba(255,0,0,0.2)' : 'rgba(0,0,0,0.2)',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #f00' : '2px solid transparent',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{fontWeight: 'bold'}}>
                      {isSelected && '✓ '}{item.name}
                    </div>
                    <div style={{color: '#aaa', fontSize: '10px'}}>
                      Value: {item.value} | Buyback: {calculateBuyback(item.value)} | Qty: {item.qty}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cart Summary (if actively trading) */}
      {activeTrade && activeTrade.type === 'merchant' && activeTrade.player1Id === playerId && (
        <div style={{background: 'rgba(240,225,48,0.1)', padding: '16px', borderRadius: '6px', marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Your Cart</h3>

          <div style={{marginBottom: '12px'}}>
            <h4 style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>Buying:</h4>
            {selectedMerchantItems.length === 0 ? (
              <p style={{fontSize: '10px', color: '#666'}}>No items selected</p>
            ) : (
              selectedMerchantItems.map(item => (
                <div key={item.id} style={{background: 'rgba(0,255,0,0.1)', padding: '6px', borderRadius: '3px', marginBottom: '4px', fontSize: '10px'}}>
                  {item.name} x{item.qty} - {item.sellPrice || item.value}
                </div>
              ))
            )}
          </div>

          <div style={{marginBottom: '12px'}}>
            <h4 style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>Selling:</h4>
            {selectedPlayerItems.length === 0 ? (
              <p style={{fontSize: '10px', color: '#666'}}>No items selected</p>
            ) : (
              selectedPlayerItems.map(item => (
                <div key={item.id} style={{background: 'rgba(255,0,0,0.1)', padding: '6px', borderRadius: '3px', marginBottom: '4px', fontSize: '10px'}}>
                  {item.name} x{item.qty} - {calculateBuyback(item.value)}
                </div>
              ))
            )}
          </div>

          {/* Net cost */}
          {(selectedMerchantItems.length > 0 || selectedPlayerItems.length > 0) && (() => {
            const cost = calculateTradeCost(selectedMerchantItems, selectedPlayerItems);
            return (
              <div style={{
                background: cost.owedTo === 'merchant' ? 'rgba(255,0,0,0.2)' : cost.owedTo === 'player' ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '4px'}}>
                  {cost.owedTo === 'even' ? 'Trade is Even' : `${cost.amount} ${cost.currency.toUpperCase()}`}
                </div>
                <div style={{fontSize: '11px', color: '#aaa'}}>
                  {cost.owedTo === 'merchant' && 'You owe the merchant'}
                  {cost.owedTo === 'player' && 'Merchant owes you'}
                </div>
              </div>
            );
          })()}

          {/* Submit for approval button */}
          <button
            onClick={() => {
              if (selectedMerchantItems.length === 0 && selectedPlayerItems.length === 0) {
                alert('Please select at least one item to trade.');
                return;
              }
              // Change status to pending approval
              const updatedTrade = { ...activeTrade, status: 'pending' as const };
              OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });
              alert('Trade submitted! Waiting for GM approval.');
            }}
            disabled={activeTrade.status === 'pending'}
            style={{
              width: '100%',
              background: activeTrade.status === 'pending' ? '#555' : 'var(--accent-gold)',
              color: 'black',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: activeTrade.status === 'pending' ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            {activeTrade.status === 'pending' ? 'WAITING FOR GM APPROVAL...' : 'SUBMIT FOR APPROVAL'}
          </button>

          <button
            onClick={handleCancelTrade}
            style={{
              width: '100%',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px',
              marginTop: '8px'
            }}
          >
            CANCEL TRADE
          </button>

          <p style={{fontSize: '10px', color: '#666', marginTop: '8px', fontStyle: 'italic', margin: '8px 0 0 0'}}>
            * GM must approve the trade for items and currency to transfer automatically.
          </p>
        </div>
      )}

      {/* GM Only: Create Custom Item */}
      {playerRole === 'GM' && (
        <>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px', marginTop: '24px'}}>Create Custom Item</h3>
          <div style={{background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px'}}>
              <input
                className="search-input"
                placeholder="Item Name"
                value={newItem.name || ''}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                style={{margin: 0}}
              />
              <select
                className="search-input"
                value={newItem.category || 'Other'}
                onChange={(e) => setNewItem({...newItem, category: e.target.value as ItemCategory})}
                style={{margin: 0}}
              >
                {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px'}}>
              <input
                className="search-input"
                placeholder="Sell Price (e.g., 10 gp)"
                value={newItem.value || ''}
                onChange={(e) => setNewItem({...newItem, value: e.target.value})}
                style={{margin: 0}}
              />
              <input
                className="search-input"
                type="number"
                placeholder="Weight"
                value={newItem.weight || 1}
                onChange={(e) => setNewItem({...newItem, weight: parseFloat(e.target.value)})}
                style={{margin: 0}}
              />
              <input
                className="search-input"
                type="number"
                placeholder="Qty"
                value={newItem.qty || 1}
                onChange={(e) => setNewItem({...newItem, qty: parseInt(e.target.value)})}
                style={{margin: 0}}
              />
            </div>
            <input
              className="search-input"
              placeholder="Properties (optional)"
              value={newItem.properties || ''}
              onChange={(e) => setNewItem({...newItem, properties: e.target.value})}
              style={{margin: 0, marginBottom: '8px'}}
            />
            <button
              onClick={() => {
                if (!newItem.name || !newItem.value) {
                  alert('Please provide at least a name and sell price.');
                  return;
                }
                const merchantItem: MerchantItem = {
                  id: uuidv4(),
                  name: newItem.name,
                  category: newItem.category || 'Other',
                  type: newItem.type || 'Gear',
                  weight: newItem.weight || 1,
                  qty: newItem.qty || 1,
                  value: newItem.value || '',
                  sellPrice: newItem.value || '',
                  buyPrice: calculateBuyback(newItem.value || ''),
                  properties: newItem.properties || '',
                  requiresAttunement: newItem.requiresAttunement || false,
                  isAttuned: false
                };

                const updatedShop = {
                  ...characterData.merchantShop!,
                  inventory: [...characterData.merchantShop!.inventory, merchantItem]
                };
                handleUpdateData({ merchantShop: updatedShop });
                setNewItem({ name: '', category: 'Other', type: 'Gear', weight: 1, qty: 1, value: '', properties: '', requiresAttunement: false });
              }}
              style={{
                width: '100%',
                background: 'var(--accent-gold)',
                color: 'black',
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px'
              }}
            >
              ADD CUSTOM ITEM TO SHOP
            </button>
          </div>
        </>
      )}

      {/* GM Only: Add items from repository */}
      {playerRole === 'GM' && (
        <>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Add Items from Repository</h3>
          <input
            className="search-input"
            placeholder="Search repository..."
            value={repoSearch}
            onChange={(e) => setRepoSearch(e.target.value)}
            style={{marginBottom: '12px'}}
          />

          <div style={{maxHeight: '300px', overflowY: 'auto'}}>
            {ITEM_REPOSITORY
              .filter(item => !repoSearch || item.name.toLowerCase().includes(repoSearch.toLowerCase()) || item.category.toLowerCase().includes(repoSearch.toLowerCase()))
              .slice(0, 20)
              .map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{fontSize: '12px', fontWeight: 'bold'}}>{item.name}</div>
                    <div style={{fontSize: '10px', color: '#aaa'}}>
                      {item.category} | {item.value} | {item.weight}u
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToMerchantShop(item)}
                    style={{background: 'var(--accent-gold)', color: 'black', border: 'none', fontSize: '10px', padding: '4px 8px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold'}}
                  >
                    ADD
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
