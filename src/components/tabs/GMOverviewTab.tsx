import type { ActiveTrade, Tab } from '../../types';

interface GMOverviewTabProps {
  activeTrade: ActiveTrade | null;
  isExecutingTrade: boolean;
  handleApproveTrade: () => void;
  handleCancelTrade: () => void;
  loadTokenById: (tokenId: string) => void;
  setActiveTab: (tab: Tab) => void;
}

export function GMOverviewTab({
  activeTrade,
  isExecutingTrade,
  handleApproveTrade,
  handleCancelTrade,
  loadTokenById,
  setActiveTab,
}: GMOverviewTabProps) {
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
              {activeTrade.player1Approved && (
                <span style={{ color: '#0f0' }}>✓ {activeTrade.player1Name}</span>
              )}
              {!activeTrade.player1Approved && <span>○ {activeTrade.player1Name}</span>}
              <span style={{ margin: '0 8px' }}>|</span>
              {activeTrade.player2Approved && (
                <span style={{ color: '#0f0' }}>✓ {activeTrade.player2Name}</span>
              )}
              {!activeTrade.player2Approved && <span>○ {activeTrade.player2Name}</span>}
            </div>
            <div style={{ fontSize: '12px', marginBottom: '12px' }}>
              <strong>Status:</strong> {activeTrade.status}
            </div>
            {/* Trade Summary */}
            {activeTrade.itemsToTrade.length > 0 && (
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
                {activeTrade.itemsToTrade.filter((t) => t.source === 'player1').length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: '#4a9eff', fontSize: '10px' }}>{activeTrade.player1Name} gives:</div>
                    {activeTrade.itemsToTrade
                      .filter((t) => t.source === 'player1')
                      .map((t, i) => (
                        <div key={i} style={{ paddingLeft: '8px', color: '#aaa' }}>
                          • {t.item.name} x{t.item.qty}
                        </div>
                      ))}
                  </div>
                )}
                {activeTrade.itemsToTrade.filter((t) => t.source === 'player2').length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: '#4a9eff', fontSize: '10px' }}>{activeTrade.player2Name} gives:</div>
                    {activeTrade.itemsToTrade
                      .filter((t) => t.source === 'player2')
                      .map((t, i) => (
                        <div key={i} style={{ paddingLeft: '8px', color: '#aaa' }}>
                          • {t.item.name} x{t.item.qty}
                        </div>
                      ))}
                  </div>
                )}
                {/* Show coins being traded */}
                {activeTrade.player1CoinsOffered && (
                  activeTrade.player1CoinsOffered.cp > 0 || 
                  activeTrade.player1CoinsOffered.sp > 0 || 
                  activeTrade.player1CoinsOffered.gp > 0 || 
                  activeTrade.player1CoinsOffered.pp > 0
                ) && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontSize: '10px' }}>{activeTrade.player1Name}'s coins:</div>
                    <div style={{ paddingLeft: '8px', color: '#aaa' }}>
                      {activeTrade.player1CoinsOffered.cp > 0 && `${activeTrade.player1CoinsOffered.cp}cp `}
                      {activeTrade.player1CoinsOffered.sp > 0 && `${activeTrade.player1CoinsOffered.sp}sp `}
                      {activeTrade.player1CoinsOffered.gp > 0 && `${activeTrade.player1CoinsOffered.gp}gp `}
                      {activeTrade.player1CoinsOffered.pp > 0 && `${activeTrade.player1CoinsOffered.pp}pp`}
                    </div>
                  </div>
                )}
                {activeTrade.player2CoinsOffered && (
                  activeTrade.player2CoinsOffered.cp > 0 || 
                  activeTrade.player2CoinsOffered.sp > 0 || 
                  activeTrade.player2CoinsOffered.gp > 0 || 
                  activeTrade.player2CoinsOffered.pp > 0
                ) && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontSize: '10px' }}>{activeTrade.player2Name}'s coins:</div>
                    <div style={{ paddingLeft: '8px', color: '#aaa' }}>
                      {activeTrade.player2CoinsOffered.cp > 0 && `${activeTrade.player2CoinsOffered.cp}cp `}
                      {activeTrade.player2CoinsOffered.sp > 0 && `${activeTrade.player2CoinsOffered.sp}sp `}
                      {activeTrade.player2CoinsOffered.gp > 0 && `${activeTrade.player2CoinsOffered.gp}gp `}
                      {activeTrade.player2CoinsOffered.pp > 0 && `${activeTrade.player2CoinsOffered.pp}pp`}
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
                    setActiveTab('Trade');
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
                VIEW TRADE
              </button>
              <button
                onClick={handleApproveTrade}
                disabled={isExecutingTrade}
                style={{
                  flex: 1,
                  background: isExecutingTrade ? '#555' : 'var(--accent-gold)',
                  color: isExecutingTrade ? '#999' : 'black',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: isExecutingTrade ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                {isExecutingTrade ? 'EXECUTING...' : 'FORCE EXECUTE'}
              </button>
              <button
                onClick={handleCancelTrade}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '11px', color: '#666' }}>No active trade</p>
        )}
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
          Both players must approve the trade for it to execute.
        </p>
      </div>
    </div>
  );
}
