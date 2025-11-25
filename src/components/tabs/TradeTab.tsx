import type { ActiveTrade, Item, CharacterData, Currency } from '../../types';
import { calculateP2PCost } from '../../utils/trade';
import { getTotalCopperPieces } from '../../utils/currency';

interface TradeTabProps {
  activeTrade: ActiveTrade;
  playerId: string | null;
  characterData: CharacterData | null;
  player1Items: Item[];
  player2Items: Item[];
  setPlayer1Items: (items: Item[]) => void;
  setPlayer2Items: (items: Item[]) => void;
  otherPlayerData: CharacterData | null;
  playerRole: string;
  isExecutingTrade: boolean;
  handleApproveTrade: () => void;
  handleCancelTrade: () => void;
  player1CoinsOffered: Currency;
  player2CoinsOffered: Currency;
  setPlayer1CoinsOffered: (coins: Currency) => void;
  setPlayer2CoinsOffered: (coins: Currency) => void;
}

export function TradeTab({
  activeTrade,
  playerId,
  characterData,
  player1Items,
  player2Items,
  setPlayer1Items,
  setPlayer2Items,
  otherPlayerData,
  playerRole,
  isExecutingTrade,
  handleApproveTrade,
  handleCancelTrade,
  player1CoinsOffered,
  player2CoinsOffered,
  setPlayer1CoinsOffered,
  setPlayer2CoinsOffered
}: TradeTabProps) {
  const isPlayer1 = activeTrade.player1Id === playerId;
  const isPlayer2 = activeTrade.player2Id === playerId;
  const isParticipant = isPlayer1 || isPlayer2;
  
  // Determine which coin state to use for current player
  const myCoinsOffered = isPlayer1 ? player1CoinsOffered : player2CoinsOffered;
  const setMyCoinsOffered = isPlayer1 ? setPlayer1CoinsOffered : setPlayer2CoinsOffered;
  const otherCoinsOffered = isPlayer1 ? player2CoinsOffered : player1CoinsOffered;
  
  // Get my currency (to validate coin offers)
  const myCurrency = characterData?.currency || { cp: 0, sp: 0, gp: 0, pp: 0 };
  
  // Determine which player's items are "mine" and which are "theirs"
  const myItems = isPlayer1 ? player1Items : player2Items;
  const setMyItems = isPlayer1 ? setPlayer1Items : setPlayer2Items;
  const otherItems = isPlayer1 ? player2Items : player1Items;
  
  // Determine the other player's name
  const otherPlayerName = isPlayer1 ? activeTrade.player2Name : activeTrade.player1Name;
  
  // Function to update coin offers with validation
  const handleCoinChange = (coinType: keyof Currency, value: number) => {
    const newValue = Math.max(0, Math.min(value, myCurrency[coinType]));
    setMyCoinsOffered({ ...myCoinsOffered, [coinType]: newValue });
  };

  return (
    <div className="section">
      <h2>Player Trade</h2>

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

      {/* P2P Trade - Your inventory */}
      {characterData && isParticipant && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Your Items to Offer</h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>Click items you want to give to the other player</p>
          <div style={{maxHeight: '200px', overflowY: 'auto'}}>
            {characterData.inventory.map(item => {
              const isSelected = myItems.some(si => si.id === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      setMyItems(myItems.filter(i => i.id !== item.id));
                    } else {
                      setMyItems([...myItems, item]);
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

      {/* Coins to Offer */}
      {isParticipant && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Coins to Offer</h3>
          <p style={{fontSize: '10px', color: '#aaa', marginBottom: '8px'}}>
            Enter coins you want to give. Your wallet: {myCurrency.cp}cp, {myCurrency.sp}sp, {myCurrency.gp}gp, {myCurrency.pp}pp
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px'}}>
            {(['cp', 'sp', 'gp', 'pp'] as const).map(coinType => (
              <div key={coinType} style={{textAlign: 'center'}}>
                <label style={{fontSize: '10px', color: '#aaa', display: 'block', marginBottom: '4px', textTransform: 'uppercase'}}>
                  {coinType}
                </label>
                <input
                  type="number"
                  min="0"
                  max={myCurrency[coinType]}
                  value={myCoinsOffered[coinType]}
                  onChange={(e) => handleCoinChange(coinType, parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: '14px'
                  }}
                />
                <div style={{fontSize: '9px', color: '#666', marginTop: '2px'}}>
                  max: {myCurrency[coinType]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* P2P Trade - Other player's items and coins */}
      {otherPlayerData && (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>
            {otherPlayerName}'s Offer
          </h3>
          
          {/* Other player's items */}
          <h4 style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>Items:</h4>
          <div style={{maxHeight: '150px', overflowY: 'auto', marginBottom: '12px'}}>
            {(() => {
              if (otherItems.length === 0) {
                return <p style={{fontSize: '10px', color: '#666'}}>No items offered yet</p>;
              }

              return otherItems.map(item => (
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

          {/* Other player's coins */}
          <h4 style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>Coins:</h4>
          {getTotalCopperPieces(otherCoinsOffered) > 0 ? (
            <div style={{
              background: 'rgba(0,200,0,0.2)',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #0c0',
              fontSize: '12px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {otherCoinsOffered.cp > 0 && <span>{otherCoinsOffered.cp} CP</span>}
              {otherCoinsOffered.sp > 0 && <span>{otherCoinsOffered.sp} SP</span>}
              {otherCoinsOffered.gp > 0 && <span>{otherCoinsOffered.gp} GP</span>}
              {otherCoinsOffered.pp > 0 && <span>{otherCoinsOffered.pp} PP</span>}
            </div>
          ) : (
            <p style={{fontSize: '10px', color: '#666'}}>No coins offered</p>
          )}
        </div>
      )}

      {/* Trade Summary */}
      <h3 style={{fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px'}}>Trade Summary</h3>

      {/* Summary of what each player is giving */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px'}}>
        {/* Player 1's offer */}
        <div style={{background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px'}}>
          <h4 style={{fontSize: '11px', color: '#aaa', marginBottom: '8px'}}>{activeTrade.player1Name} gives:</h4>
          {player1Items.length === 0 && getTotalCopperPieces(player1CoinsOffered) === 0 ? (
            <p style={{fontSize: '10px', color: '#666'}}>Nothing</p>
          ) : (
            <>
              {player1Items.map(item => (
                <div key={item.id} style={{fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>
                  • {item.name} x{item.qty}
                </div>
              ))}
              {getTotalCopperPieces(player1CoinsOffered) > 0 && (
                <div style={{fontSize: '10px', color: 'var(--accent-gold)', marginTop: '4px'}}>
                  💰 {player1CoinsOffered.cp > 0 ? `${player1CoinsOffered.cp}cp ` : ''}
                  {player1CoinsOffered.sp > 0 ? `${player1CoinsOffered.sp}sp ` : ''}
                  {player1CoinsOffered.gp > 0 ? `${player1CoinsOffered.gp}gp ` : ''}
                  {player1CoinsOffered.pp > 0 ? `${player1CoinsOffered.pp}pp` : ''}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Player 2's offer */}
        <div style={{background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px'}}>
          <h4 style={{fontSize: '11px', color: '#aaa', marginBottom: '8px'}}>{activeTrade.player2Name} gives:</h4>
          {player2Items.length === 0 && getTotalCopperPieces(player2CoinsOffered) === 0 ? (
            <p style={{fontSize: '10px', color: '#666'}}>Nothing</p>
          ) : (
            <>
              {player2Items.map(item => (
                <div key={item.id} style={{fontSize: '10px', color: '#ccc', marginBottom: '2px'}}>
                  • {item.name} x{item.qty}
                </div>
              ))}
              {getTotalCopperPieces(player2CoinsOffered) > 0 && (
                <div style={{fontSize: '10px', color: 'var(--accent-gold)', marginTop: '4px'}}>
                  💰 {player2CoinsOffered.cp > 0 ? `${player2CoinsOffered.cp}cp ` : ''}
                  {player2CoinsOffered.sp > 0 ? `${player2CoinsOffered.sp}sp ` : ''}
                  {player2CoinsOffered.gp > 0 ? `${player2CoinsOffered.gp}gp ` : ''}
                  {player2CoinsOffered.pp > 0 ? `${player2CoinsOffered.pp}pp` : ''}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* P2P trade net cost */}
      {(player1Items.length > 0 || player2Items.length > 0 || 
        getTotalCopperPieces(player1CoinsOffered) > 0 || getTotalCopperPieces(player2CoinsOffered) > 0) && (() => {
        const cost = calculateP2PCost(player1Items, player2Items, player1CoinsOffered, player2CoinsOffered);
        return (
          <div style={{
            background: cost.owedTo === 'player1' ? 'rgba(255,100,100,0.2)' : cost.owedTo === 'player2' ? 'rgba(100,255,100,0.2)' : 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '4px'}}>
              {cost.owedTo === 'even' ? 'Trade is Even!' : `${cost.amount} ${cost.currency.toUpperCase()} difference`}
            </div>
            <div style={{fontSize: '11px', color: '#aaa'}}>
              {cost.owedTo === 'player1' && `${activeTrade.player2Name}'s offer is worth more`}
              {cost.owedTo === 'player2' && `${activeTrade.player1Name}'s offer is worth more`}
            </div>
          </div>
        );
      })()}

      <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
        {isParticipant && (
          <button
            onClick={handleApproveTrade}
            disabled={isExecutingTrade || (isPlayer1 && activeTrade.player1Approved) || (isPlayer2 && activeTrade.player2Approved)}
            style={{
              flex: 1,
              background: (isPlayer1 && activeTrade.player1Approved) || (isPlayer2 && activeTrade.player2Approved)
                ? '#555'
                : '#4a9eff',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: isExecutingTrade || (isPlayer1 && activeTrade.player1Approved) || (isPlayer2 && activeTrade.player2Approved) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isExecutingTrade ? 'EXECUTING...' :
              (isPlayer1 && activeTrade.player1Approved) || (isPlayer2 && activeTrade.player2Approved)
              ? 'APPROVED ✓'
              : 'APPROVE TRADE'}
          </button>
        )}
        {/* GM can also approve for debugging */}
        {playerRole === 'GM' && !isParticipant && (
          <button
            onClick={handleApproveTrade}
            disabled={isExecutingTrade}
            style={{
              flex: 1,
              background: isExecutingTrade ? '#555' : 'var(--accent-gold)',
              color: 'black',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              cursor: isExecutingTrade ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isExecutingTrade ? 'EXECUTING...' : 'GM: FORCE EXECUTE'}
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
        * Both players must approve for the trade to execute automatically. Items and coins will transfer when both approve.
      </p>
    </div>
  );
}
