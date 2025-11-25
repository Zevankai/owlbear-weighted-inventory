import type { ActiveTrade, Item, Currency } from '../types';
import { getTotalCopperPieces } from '../utils/currency';
import { calculateP2PCost } from '../utils/trade';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrade: ActiveTrade;
  playerId: string;
  playerInventory: Item[];
  playerCurrency: Currency;
  otherPlayerInventory: Item[];
  otherPlayerCurrency: Currency;
  myOfferedItems: Item[];
  myOfferedCoins: Currency;
  theirOfferedItems: Item[];
  theirOfferedCoins: Currency;
  onAddItem: (item: Item) => void;
  onRemoveItem: (item: Item) => void;
  onUpdateCoins: (coins: Currency) => void;
  onConfirm: () => void;
  onCancel: () => void;
  myConfirmed: boolean;
  theirConfirmed: boolean;
}

export function TradeModal({
  isOpen,
  onClose,
  activeTrade,
  playerId,
  playerInventory,
  playerCurrency,
  otherPlayerInventory,
  otherPlayerCurrency,
  myOfferedItems,
  myOfferedCoins,
  theirOfferedItems,
  theirOfferedCoins,
  onAddItem,
  onRemoveItem,
  onUpdateCoins,
  onConfirm,
  onCancel,
  myConfirmed,
  theirConfirmed
}: TradeModalProps) {
  if (!isOpen) return null;

  const isPlayer1 = activeTrade.player1Id === playerId;
  const otherPlayerName = isPlayer1 ? activeTrade.player2Name : activeTrade.player1Name;

  // Calculate trade value difference
  const netCost = calculateP2PCost(
    isPlayer1 ? myOfferedItems : theirOfferedItems,
    isPlayer1 ? theirOfferedItems : myOfferedItems,
    isPlayer1 ? myOfferedCoins : theirOfferedCoins,
    isPlayer1 ? theirOfferedCoins : myOfferedCoins
  );

  // Handle coin changes with validation
  const handleCoinChange = (coinType: keyof Currency, value: number) => {
    const newValue = Math.max(0, Math.min(value, playerCurrency[coinType]));
    onUpdateCoins({ ...myOfferedCoins, [coinType]: newValue });
  };

  // Check if item is already in my offered items
  const isItemOffered = (itemId: string) => myOfferedItems.some(i => i.id === itemId);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9998
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'rgba(20, 20, 35, 0.98)',
          border: '2px solid var(--accent-gold)',
          borderRadius: '12px',
          padding: '16px',
          width: 'min(900px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '12px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            color: 'var(--accent-gold)',
            fontWeight: 'bold'
          }}>
            🤝 TRADE WITH {otherPlayerName?.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              color: '#aaa',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Three Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Left Column: Your Inventory */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Your Inventory
            </h3>
            
            {/* Items list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '12px',
              minHeight: '100px',
              maxHeight: '200px'
            }}>
              {playerInventory.length === 0 ? (
                <p style={{fontSize: '11px', color: '#666', fontStyle: 'italic'}}>No items</p>
              ) : (
                playerInventory.map(item => {
                  const offered = isItemOffered(item.id);
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        marginBottom: '4px',
                        background: offered ? 'rgba(74,158,255,0.2)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        border: offered ? '1px solid #4a9eff' : '1px solid transparent'
                      }}
                    >
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: offered ? '#4a9eff' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name} {item.qty > 1 && `(x${item.qty})`}
                        </div>
                        <div style={{fontSize: '9px', color: '#888'}}>
                          {item.value || 'No value'}
                        </div>
                      </div>
                      {offered ? (
                        <button
                          onClick={() => onRemoveItem(item)}
                          style={{
                            background: 'rgba(255,100,100,0.3)',
                            border: 'none',
                            color: '#ff6666',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          −
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddItem(item)}
                          style={{
                            background: 'rgba(100,200,100,0.3)',
                            border: 'none',
                            color: '#66ff66',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Your Coins */}
            <div style={{borderTop: '1px solid var(--border)', paddingTop: '8px'}}>
              <div style={{fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase'}}>
                Your Coins (click to offer)
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px'}}>
                {(['cp', 'sp', 'gp', 'pp'] as const).map(coinType => (
                  <div key={coinType} style={{textAlign: 'center'}}>
                    <label style={{fontSize: '9px', color: '#888', display: 'block', textTransform: 'uppercase'}}>
                      {coinType}
                    </label>
                    <div style={{fontSize: '10px', color: '#666', marginBottom: '2px'}}>
                      Have: {playerCurrency[coinType]}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={playerCurrency[coinType]}
                      value={myOfferedCoins[coinType]}
                      onChange={(e) => handleCoinChange(coinType, parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '4px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid #444',
                        borderRadius: '3px',
                        color: 'white',
                        textAlign: 'center',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Trade Offer */}
          <div style={{
            background: 'rgba(74,158,255,0.1)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(74,158,255,0.3)'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              color: '#4a9eff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center'
            }}>
              Trade Offer
            </h3>

            {/* What you're offering */}
            <div style={{marginBottom: '12px', flex: 1, minHeight: 0}}>
              <div style={{fontSize: '10px', color: '#4a9eff', marginBottom: '4px', fontWeight: 'bold'}}>
                You're Offering:
              </div>
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                padding: '6px'
              }}>
                {myOfferedItems.length === 0 && getTotalCopperPieces(myOfferedCoins) === 0 ? (
                  <p style={{fontSize: '10px', color: '#666', fontStyle: 'italic', margin: 0}}>Nothing yet</p>
                ) : (
                  <>
                    {myOfferedItems.map(item => (
                      <div key={item.id} style={{fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>
                        • {item.name} x{item.qty}
                      </div>
                    ))}
                    {getTotalCopperPieces(myOfferedCoins) > 0 && (
                      <div style={{fontSize: '10px', color: 'var(--accent-gold)', marginTop: '4px'}}>
                        💰 {myOfferedCoins.cp > 0 ? `${myOfferedCoins.cp}cp ` : ''}
                        {myOfferedCoins.sp > 0 ? `${myOfferedCoins.sp}sp ` : ''}
                        {myOfferedCoins.gp > 0 ? `${myOfferedCoins.gp}gp ` : ''}
                        {myOfferedCoins.pp > 0 ? `${myOfferedCoins.pp}pp` : ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{
              borderTop: '1px dashed #4a9eff',
              margin: '8px 0'
            }} />

            {/* What they're offering */}
            <div style={{flex: 1, minHeight: 0}}>
              <div style={{fontSize: '10px', color: '#0c0', marginBottom: '4px', fontWeight: 'bold'}}>
                They're Offering:
              </div>
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                padding: '6px'
              }}>
                {theirOfferedItems.length === 0 && getTotalCopperPieces(theirOfferedCoins) === 0 ? (
                  <p style={{fontSize: '10px', color: '#666', fontStyle: 'italic', margin: 0}}>Nothing yet</p>
                ) : (
                  <>
                    {theirOfferedItems.map(item => (
                      <div key={item.id} style={{fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>
                        • {item.name} x{item.qty}
                      </div>
                    ))}
                    {getTotalCopperPieces(theirOfferedCoins) > 0 && (
                      <div style={{fontSize: '10px', color: 'var(--accent-gold)', marginTop: '4px'}}>
                        💰 {theirOfferedCoins.cp > 0 ? `${theirOfferedCoins.cp}cp ` : ''}
                        {theirOfferedCoins.sp > 0 ? `${theirOfferedCoins.sp}sp ` : ''}
                        {theirOfferedCoins.gp > 0 ? `${theirOfferedCoins.gp}gp ` : ''}
                        {theirOfferedCoins.pp > 0 ? `${theirOfferedCoins.pp}pp` : ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Trade Value Summary */}
            {(myOfferedItems.length > 0 || theirOfferedItems.length > 0 ||
              getTotalCopperPieces(myOfferedCoins) > 0 || getTotalCopperPieces(theirOfferedCoins) > 0) && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: netCost.owedTo === 'even' ? 'rgba(100,255,100,0.2)' : 'rgba(255,200,100,0.2)',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '11px', fontWeight: 'bold', color: netCost.owedTo === 'even' ? '#0f0' : 'var(--accent-gold)'}}>
                  {netCost.owedTo === 'even' ? '✓ Trade is Even!' : `${netCost.amount} ${netCost.currency.toUpperCase()} difference`}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Their Inventory */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {otherPlayerName}'s Inventory
            </h3>
            
            {/* Their items list (read-only) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '12px',
              minHeight: '100px',
              maxHeight: '200px'
            }}>
              {otherPlayerInventory.length === 0 ? (
                <p style={{fontSize: '11px', color: '#666', fontStyle: 'italic'}}>No items visible</p>
              ) : (
                otherPlayerInventory.map(item => {
                  const offered = theirOfferedItems.some(i => i.id === item.id);
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        marginBottom: '4px',
                        background: offered ? 'rgba(0,200,0,0.2)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        border: offered ? '1px solid #0c0' : '1px solid transparent'
                      }}
                    >
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: offered ? '#0c0' : '#888',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name} {item.qty > 1 && `(x${item.qty})`}
                        </div>
                        <div style={{fontSize: '9px', color: '#666'}}>
                          {item.value || 'No value'}
                        </div>
                      </div>
                      {offered && (
                        <span style={{fontSize: '9px', color: '#0c0'}}>OFFERED</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Their Coins (read-only display) */}
            <div style={{borderTop: '1px solid var(--border)', paddingTop: '8px'}}>
              <div style={{fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase'}}>
                Their Coins
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px'}}>
                {(['cp', 'sp', 'gp', 'pp'] as const).map(coinType => (
                  <div key={coinType} style={{textAlign: 'center'}}>
                    <label style={{fontSize: '9px', color: '#888', display: 'block', textTransform: 'uppercase'}}>
                      {coinType}
                    </label>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#888',
                      padding: '4px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '3px'
                    }}>
                      {otherPlayerCurrency[coinType]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)'
        }}>
          {/* Confirmation Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '12px',
            fontSize: '12px'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: myConfirmed ? '#0f0' : '#666'
              }} />
              <span style={{color: myConfirmed ? '#0f0' : '#aaa'}}>
                You: {myConfirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: theirConfirmed ? '#0f0' : '#666'
              }} />
              <span style={{color: theirConfirmed ? '#0f0' : '#aaa'}}>
                {otherPlayerName}: {theirConfirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
            <button
              onClick={onConfirm}
              disabled={myConfirmed}
              style={{
                flex: 1,
                maxWidth: '200px',
                background: myConfirmed ? '#555' : '#4a9eff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: myConfirmed ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {myConfirmed ? '✓ CONFIRMED' : 'CONFIRM TRADE'}
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                maxWidth: '200px',
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              CANCEL
            </button>
          </div>

          <p style={{
            fontSize: '10px',
            color: '#666',
            marginTop: '10px',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            * Both players must confirm for the trade to execute automatically
          </p>
        </div>
      </div>
    </>
  );
}
