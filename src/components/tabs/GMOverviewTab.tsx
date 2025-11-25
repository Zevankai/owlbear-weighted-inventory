import type { ActiveTrade, TradeQueue, Tab } from '../../types';

interface GMOverviewTabProps {
  activeTrade: ActiveTrade | null;
  tradeQueues: Record<string, TradeQueue>;
  allMerchants: Array<{ id: string; name: string; itemCount: number }>;
  isExecutingTrade: boolean;
  handleApproveTrade: () => void;
  handleCancelTrade: () => void;
  loadTokenById: (tokenId: string) => void;
  setActiveTab: (tab: Tab) => void;
}

export function GMOverviewTab({
  activeTrade,
  tradeQueues,
  allMerchants,
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
              background: 'rgba(240,225,48,0.1)',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--accent-gold)',
            }}
          >
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
              <strong>Type:</strong>{' '}
              {activeTrade.type === 'merchant' ? 'Merchant Trade' : 'Player-to-Player'}
            </div>
            {activeTrade.type === 'merchant' && (
              <>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  <strong>Player:</strong> {activeTrade.player1Name}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  <strong>Merchant Token:</strong>{' '}
                  {(() => {
                    const merchant = allMerchants.find((m) => m.id === activeTrade.merchantTokenId);
                    return merchant?.name || 'Unknown';
                  })()}
                </div>
              </>
            )}
            {activeTrade.type === 'player-to-player' && (
              <>
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
              </>
            )}
            <div style={{ fontSize: '12px', marginBottom: '12px' }}>
              <strong>Status:</strong> {activeTrade.status}
            </div>
            {/* Trade Summary */}
            {activeTrade.type === 'merchant' && activeTrade.itemsToTrade.length > 0 && (
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
                {activeTrade.itemsToTrade.filter((t) => t.source === 'merchant').length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: '#0f0', fontSize: '10px' }}>Player Buying:</div>
                    {activeTrade.itemsToTrade
                      .filter((t) => t.source === 'merchant')
                      .map((t, i) => (
                        <div key={i} style={{ paddingLeft: '8px', color: '#aaa' }}>
                          • {t.item.name} x{t.item.qty}
                        </div>
                      ))}
                  </div>
                )}
                {activeTrade.itemsToTrade.filter((t) => t.source === 'player1').length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ color: '#f00', fontSize: '10px' }}>Player Selling:</div>
                    {activeTrade.itemsToTrade
                      .filter((t) => t.source === 'player1')
                      .map((t, i) => (
                        <div key={i} style={{ paddingLeft: '8px', color: '#aaa' }}>
                          • {t.item.name} x{t.item.qty}
                        </div>
                      ))}
                  </div>
                )}
                {activeTrade.netCost.owedTo !== 'even' && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <strong>Net Cost:</strong> {activeTrade.netCost.amount}{' '}
                    {activeTrade.netCost.currency.toUpperCase()}
                    {activeTrade.netCost.owedTo === 'merchant' ? (
                      <span style={{ color: '#f00' }}> (Player owes)</span>
                    ) : (
                      <span style={{ color: '#0f0' }}> (Merchant owes)</span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeTrade.type === 'merchant' && (
                <>
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
                    {isExecutingTrade ? 'EXECUTING...' : 'APPROVE TRADE'}
                  </button>
                  <button
                    onClick={() => {
                      if (activeTrade.merchantTokenId) {
                        loadTokenById(activeTrade.merchantTokenId);
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
                    VIEW DETAILS
                  </button>
                </>
              )}
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

      {/* Trade Queues Section */}
      {Object.keys(tradeQueues).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
            Trade Queues
          </h3>
          {Object.entries(tradeQueues).map(([merchantId, queue]) => {
            const merchant = allMerchants.find((m) => m.id === merchantId);
            return (
              <div
                key={merchantId}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {merchant?.name || 'Unknown Merchant'}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                  {queue.queue.length} player(s) waiting
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All Merchants Section */}
      <div>
        <h3 style={{ fontSize: '14px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Active Merchants ({allMerchants.length})
        </h3>
        {allMerchants.length === 0 && (
          <p style={{ fontSize: '11px', color: '#666' }}>No active merchants</p>
        )}
        {allMerchants.map((merchant) => (
          <div
            key={merchant.id}
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{merchant.name}</div>
              <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                {merchant.itemCount} items in shop
              </div>
            </div>
            <button
              onClick={() => {
                loadTokenById(merchant.id);
                setActiveTab('Home');
              }}
              style={{
                background: 'var(--accent-gold)',
                color: 'black',
                border: 'none',
                fontSize: '10px',
                padding: '6px 12px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              VIEW
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
