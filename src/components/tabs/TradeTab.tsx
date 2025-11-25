import type { ActiveTrade, TradeQueue, MerchantItem, Item, CharacterData } from '../../types';
import { calculateBuyback } from '../../utils/currency';
import { calculateP2PCost, calculateTradeCost } from '../../utils/trade';

interface TradeTabProps {
  activeTrade: ActiveTrade;
  tradeQueues: Record<string, TradeQueue>;
  playerId: string | null;
  merchantShopData: MerchantItem[] | null;
  selectedMerchantItems: MerchantItem[];
  handleToggleMerchantItem: (item: MerchantItem) => void;
  playerOwnInventory: Item[];
  selectedPlayerItems: Item[];
  handleTogglePlayerItem: (item: Item) => void;
  characterData: CharacterData | null;
  player1Items: Item[];
  player2Items: Item[];
  setPlayer1Items: (items: Item[]) => void;
  setPlayer2Items: (items: Item[]) => void;
  player2Data: CharacterData | null;
  playerRole: string;
  isExecutingTrade: boolean;
  handleApproveTrade: () => void;
  handleCancelTrade: () => void;
}

export function TradeTab({
  activeTrade,
  tradeQueues,
  playerId,
  merchantShopData,
  selectedMerchantItems,
  handleToggleMerchantItem,
  playerOwnInventory,
  selectedPlayerItems,
  handleTogglePlayerItem,
  characterData,
  player1Items,
  player2Items,
  setPlayer1Items,
  setPlayer2Items,
  player2Data,
  playerRole,
  isExecutingTrade,
  handleApproveTrade,
  handleCancelTrade
}: TradeTabProps) {
  return (
    <div className="section">
      <h2>Trade Session</h2>

      {activeTrade.type === 'merchant' && (
        <div style={{background: 'rgba(240,225,48,0.1)', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
          <p style={{fontSize: '12px', margin: 0}}>
            <strong>Trading with:</strong> Merchant | <strong>Player:</strong> {activeTrade.player1Name}
          </p>
        </div>
      )}

      {activeTrade.type === 'player-to-player' && (
        <div style={{background: 'rgba(74,158,255,0.1)', padding: '12px', borderRadius: '6px', marginBottom: '16px'}}>
          <p style={{fontSize: '12px', margin: 0}}>
            <strong>{activeTrade.player1Name}</strong> ↔ <strong>{activeTrade.player2Name}</strong>
          </p>
          <div style={{fontSize: '11px', color: '#aaa', marginTop: '4px'}}>
            {activeTrade.player1Approved && <span style={{color: '#0f0'}}>✓ {activeTrade.player1Name} approved</span>}
            {!activeTrade.player1Approved && <span>○ {activeTrade.player1Name} pending</span>}
            <span style={{margin: '0 8px'}}>|</span>
            {activeTrade.player2Approved && <span style={{color: '#0f0'}}>✓ {activeTrade.player2Name} approved</span>}
            {!activeTrade.player2Approved && <span>○ {activeTrade.player2Name} pending</span>}
          </div>
        </div>
      )}

      {/* Queue indicator */}
      {activeTrade.merchantTokenId && tradeQueues[activeTrade.merchantTokenId] && (
        <div style={{background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', marginBottom: '16px', fontSize: '11px'}}>
          {tradeQueues[activeTrade.merchantTokenId].queue.length > 0 && (
            <p style={{margin: 0}}>
              <strong>{tradeQueues[activeTrade.merchantTokenId].queue.length}</strong> player(s) waiting in queue
            </p>
          )}
        </div>
      )}

      {/* Browse Merchant Shop (if player is trading) */}
      {activeTrade.type === 'merchant' && activeTrade.player1Id === playerId && merchantShopData && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Merchant's Wares</h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>Click items to add to your purchase cart</p>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {merchantShopData.map(item => {
              const isSelected = selectedMerchantItems.some(si => si.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleMerchantItem(item)}
                  style={{
                    background: isSelected ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #0f0' : '1px solid transparent',
                    fontSize: '11px'
                  }}
                >
                  <div style={{fontWeight: 'bold'}}>{item.name}</div>
                  <div style={{color: '#aaa', fontSize: '10px'}}>
                    Price: {item.sellPrice || item.value} | Qty: {item.qty}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Browse Player Inventory (if player is trading) */}
      {activeTrade.type === 'merchant' && activeTrade.player1Id === playerId && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Your Items to Sell</h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>Click items to add to your sell list (buyback at 80%)</p>
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
                    border: isSelected ? '1px solid #f00' : '1px solid transparent',
                    fontSize: '11px'
                  }}
                >
                  <div style={{fontWeight: 'bold'}}>{item.name}</div>
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

      {/* P2P Trade - Your inventory */}
      {activeTrade.type === 'player-to-player' && characterData && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Your Items to Offer</h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>Click items you want to give to the other player</p>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {characterData.inventory.map(item => {
              const isPlayer1 = activeTrade.player1Id === playerId;
              const selectedItems = isPlayer1 ? player1Items : player2Items;
              const setSelectedItems = isPlayer1 ? setPlayer1Items : setPlayer2Items;
              const isSelected = selectedItems.some(si => si.id === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
                    } else {
                      setSelectedItems([...selectedItems, item]);
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(74,158,255,0.3)' : 'rgba(0,0,0,0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #4a9eff' : '1px solid transparent',
                    fontSize: '11px'
                  }}
                >
                  <div style={{fontWeight: 'bold'}}>{item.name}</div>
                  <div style={{color: '#aaa', fontSize: '10px'}}>
                    Value: {item.value} | Qty: {item.qty}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* P2P Trade - Other player's inventory */}
      {activeTrade.type === 'player-to-player' && player2Data && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>
            {activeTrade.player1Id === playerId ? activeTrade.player2Name : activeTrade.player1Name}'s Items
          </h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>Items they are offering</p>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {(() => {
              const isPlayer1 = activeTrade.player1Id === playerId;
              const otherPlayerItems = isPlayer1 ? player2Items : player1Items;

              if (otherPlayerItems.length === 0) {
                return <p style={{fontSize: '10px', color: '#666'}}>No items offered yet</p>;
              }

              return otherPlayerItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(0,200,0,0.2)',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    border: '1px solid #0c0',
                    fontSize: '11px'
                  }}
                >
                  <div style={{fontWeight: 'bold'}}>{item.name}</div>
                  <div style={{color: '#aaa', fontSize: '10px'}}>
                    Value: {item.value} | Qty: {item.qty}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>
        {activeTrade.type === 'merchant' ? 'Selected Items' : 'Trade Summary'}
      </h3>

      {/* Merchant trade summary */}
      {activeTrade.type === 'merchant' && (
        <>
          <div style={{marginBottom: '16px'}}>
            <h4 style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>To Buy from Merchant:</h4>
            {selectedMerchantItems.length === 0 && (
              <p style={{fontSize: '10px', color: '#666'}}>No items selected</p>
            )}
            {selectedMerchantItems.map(item => (
              <div key={item.id} style={{background: 'rgba(0,255,0,0.1)', padding: '8px', borderRadius: '4px', marginBottom: '4px', fontSize: '11px'}}>
                {item.name} x{item.qty} - {item.sellPrice || item.value}
              </div>
            ))}
          </div>

          <div style={{marginBottom: '16px'}}>
            <h4 style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>To Sell to Merchant:</h4>
            {selectedPlayerItems.length === 0 && (
              <p style={{fontSize: '10px', color: '#666'}}>No items selected</p>
            )}
            {selectedPlayerItems.map(item => (
              <div key={item.id} style={{background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '4px', marginBottom: '4px', fontSize: '11px'}}>
                {item.name} x{item.qty} - {calculateBuyback(item.value)}
              </div>
            ))}
          </div>

          {/* Net cost calculation for merchant */}
          {(selectedMerchantItems.length > 0 || selectedPlayerItems.length > 0) && (() => {
            const cost = calculateTradeCost(selectedMerchantItems, selectedPlayerItems);
            return (
              <div style={{
                background: cost.owedTo === 'merchant' ? 'rgba(255,0,0,0.2)' : cost.owedTo === 'player' ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '4px'}}>
                  {cost.owedTo === 'even' ? 'Trade is Even' : `${cost.amount} ${cost.currency.toUpperCase()}`}
                </div>
                <div style={{fontSize: '11px', color: '#aaa'}}>
                  {cost.owedTo === 'merchant' && 'Owed to Merchant'}
                  {cost.owedTo === 'player' && 'Owed to Player'}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* P2P trade summary and net cost */}
      {activeTrade.type === 'player-to-player' && (player1Items.length > 0 || player2Items.length > 0) && (() => {
        const cost = calculateP2PCost(player1Items, player2Items);
        return (
          <div style={{
            background: cost.owedTo === 'player1' ? 'rgba(255,100,100,0.2)' : cost.owedTo === 'player2' ? 'rgba(100,255,100,0.2)' : 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '4px'}}>
              {cost.owedTo === 'even' ? 'Trade is Even!' : `${cost.amount} ${cost.currency.toUpperCase()}`}
            </div>
            <div style={{fontSize: '11px', color: '#aaa'}}>
              {cost.owedTo === 'player1' && `${activeTrade.player2Name} owes ${activeTrade.player1Name}`}
              {cost.owedTo === 'player2' && `${activeTrade.player1Name} owes ${activeTrade.player2Name}`}
            </div>
          </div>
        );
      })()}

      <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
        {activeTrade.type === 'merchant' && playerRole === 'GM' && (
          <button
            onClick={handleApproveTrade}
            disabled={isExecutingTrade}
            style={{
              flex: 1,
              background: isExecutingTrade ? '#555' : 'var(--accent-gold)',
              color: isExecutingTrade ? '#999' : 'black',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: isExecutingTrade ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isExecutingTrade ? 'EXECUTING...' : 'APPROVE TRADE'}
          </button>
        )}
        {activeTrade.type === 'player-to-player' && (
          <button
            onClick={handleApproveTrade}
            style={{
              flex: 1,
              background: (activeTrade.player1Id === playerId && activeTrade.player1Approved) || (activeTrade.player2Id === playerId && activeTrade.player2Approved)
                ? '#555'
                : '#4a9eff',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            disabled={(activeTrade.player1Id === playerId && activeTrade.player1Approved) || (activeTrade.player2Id === playerId && activeTrade.player2Approved)}
          >
            {(activeTrade.player1Id === playerId && activeTrade.player1Approved) || (activeTrade.player2Id === playerId && activeTrade.player2Approved)
              ? 'APPROVED ✓'
              : 'APPROVE TRADE'}
          </button>
        )}
        <button
          onClick={handleCancelTrade}
          style={{flex: 1, background: 'var(--danger)', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
        >
          CANCEL
        </button>
      </div>

      <p style={{fontSize: '10px', color: '#666', marginTop: '12px', fontStyle: 'italic'}}>
        {activeTrade.type === 'merchant' && '* GM must approve the trade for items and currency to transfer automatically.'}
        {activeTrade.type === 'player-to-player' && '* Both players must approve for the trade to execute automatically.'}
      </p>
    </div>
  );
}
