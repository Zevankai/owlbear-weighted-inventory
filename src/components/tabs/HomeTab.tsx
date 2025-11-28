import type { CharacterData, PackType, ActiveTrade } from '../../types';
import { ReputationDisplay } from '../ReputationDisplay';

// Token image sizing constants
const TOKEN_SIZE_EDITABLE = '160px';
const TOKEN_SIZE_READONLY = '160px';

// Description box width constants
const DESCRIPTION_WIDTH_EDITABLE = '100%';

interface Stats {
  totalWeight: number;
  maxCapacity: number;
  coinWeight: number;
  totalCoins: number;
  usedSlots: {
    weapon: number;
    armor: number;
    clothing: number;
    jewelry: number;
    utility: number;
  };
  maxSlots: {
    weapon: number;
    armor: number;
    clothing: number;
    jewelry: number;
    utility: number;
  };
}

interface StorageDef {
  capacity: number;
}

interface HomeTabProps {
  stats: Stats;
  viewingStorageId: string | null;
  setShowSettings: (show: boolean) => void;
  loadDebugInfo: () => void;
  characterData: CharacterData;
  playerRole: string;
  playerId: string | null;
  tokenImage: string | null;
  tokenName: string | null;
  toggleFavorite: () => void;
  isFavorited: boolean;
  favorites: Array<{ id: string; name: string }>;
  setViewingFavorites: (viewing: boolean) => void;
  activeTrade: ActiveTrade | null;
  tokenId: string | null;
  canEditToken: () => boolean;
  claimToken: () => Promise<boolean | undefined>;
  unclaimToken: () => void;
  handleUpdateData: (updates: Partial<CharacterData>) => void;
  handleStartP2PTrade: (tokenId: string) => void;
  updateData: (updates: Partial<CharacterData>) => void;
  PACK_DEFINITIONS: Record<string, { capacity: number; utilitySlots: number }>;
  currentDisplayData: CharacterData;
  activeStorageDef: StorageDef | null;
  hasClaimedToken?: boolean;
  showCoverPhoto?: boolean;
}

export function HomeTab({
  stats,
  viewingStorageId,
  setShowSettings,
  loadDebugInfo,
  characterData,
  playerRole,
  playerId,
  tokenImage,
  tokenName,
  toggleFavorite,
  isFavorited,
  favorites,
  setViewingFavorites,
  activeTrade,
  tokenId,
  canEditToken,
  claimToken,
  unclaimToken,
  handleUpdateData,
  handleStartP2PTrade,
  updateData,
  PACK_DEFINITIONS,
  currentDisplayData,
  activeStorageDef,
  hasClaimedToken,
  showCoverPhoto = true
}: HomeTabProps) {
  return (
    <div className="section" style={{flex: 1, display: 'flex', flexDirection: 'column', width: '100%', paddingRight: '8px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>{viewingStorageId ? 'Storage Stats' : 'Dashboard'}</h2>
        {/* Action buttons - star, list, and debug icons */}
        <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
          {!viewingStorageId && (
            <>
              {/* Favorite star button */}
              <button
                onClick={toggleFavorite}
                style={{
                  background: 'transparent',
                  color: isFavorited ? 'var(--accent-gold)' : '#666',
                  border: '1px solid #333',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorited ? '⭐' : '☆'}
              </button>
              {/* View favorites list button */}
              {(favorites.length > 0 || hasClaimedToken) && (
                <button
                  onClick={() => setViewingFavorites(true)}
                  style={{
                    background: 'transparent',
                    color: 'var(--accent-gold)',
                    border: '1px solid #333',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'normal'
                  }}
                  title="View all favorite tokens"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              )}
            </>
          )}
          {/* Settings button - only show for users who can edit the token */}
          {canEditToken() && (
            <button
              onClick={() => { setShowSettings(true); loadDebugInfo(); }}
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
              title="Settings"
            >
              ⚙
            </button>
          )}
        </div>
      </div>

      {/* --- TOKEN PROFILE WITH COVER PHOTO --- */}
      {!viewingStorageId && (
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          marginBottom: '12px',
          minHeight: showCoverPhoto && characterData.coverPhotoUrl ? '200px' : undefined
        }}>
          {/* Cover photo as background */}
          {showCoverPhoto && characterData.coverPhotoUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${characterData.coverPhotoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.7,
            }} />
          )}
          {/* Gradient overlay for readability */}
          {showCoverPhoto && characterData.coverPhotoUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
            }} />
          )}
          {/* Token image and info on top */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: showCoverPhoto && characterData.coverPhotoUrl ? '20px 16px 16px 16px' : '0',
            minHeight: showCoverPhoto && characterData.coverPhotoUrl ? '200px' : undefined
          }}>
            {tokenImage && (
              <div style={{
                width: canEditToken() ? TOKEN_SIZE_EDITABLE : TOKEN_SIZE_READONLY,
                height: canEditToken() ? TOKEN_SIZE_EDITABLE : TOKEN_SIZE_READONLY,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--accent-gold)',
                background: 'transparent',
                marginBottom: '8px',
                alignSelf: 'center',
                boxShadow: showCoverPhoto && characterData.coverPhotoUrl ? '0 4px 12px rgba(0,0,0,0.5)' : undefined
              }}>
                <img
                  src={tokenImage}
                  alt="Token"
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              </div>
            )}
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              textAlign: 'center',
              textShadow: showCoverPhoto && characterData.coverPhotoUrl ? '0 2px 4px rgba(0,0,0,0.8)' : undefined
            }}>
              {tokenName || 'Unknown Character'}
            </div>

            {/* Start P2P Trade Button */}
            {characterData && !activeTrade && tokenId &&
              characterData.claimedBy && characterData.claimedBy !== playerId && (
              <div style={{marginTop: '8px', textAlign: 'center'}}>
                <button
                  onClick={() => handleStartP2PTrade(tokenId)}
                  style={{
                    background: '#4a9eff',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  TRADE WITH PLAYER
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!viewingStorageId ? (
        <>
          {/* Only show edit controls if player is GM or owns this token */}
          {(playerRole === 'GM' || characterData.claimedBy === playerId) && (
            <>
              <div style={{marginBottom: '12px'}}>
                <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>Current Pack</label>
                <select value={characterData.packType} onChange={(e) => updateData({ packType: e.target.value as PackType })} className="search-input" style={{marginTop: '4px', fontWeight: 'bold', color: 'var(--accent-gold)'}}>
                  {Object.keys(PACK_DEFINITIONS).map(pack => <option key={pack} value={pack}>{pack} Pack</option>)}
                </select>
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{marginBottom: '12px'}}>
          <div style={{color: '#888', fontSize: '12px'}}>Type: {characterData.externalStorages.find(s => s.id === viewingStorageId)?.type}</div>
          <div style={{marginTop:'8px'}}>
            <label style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px'}}>
              <input type="checkbox" checked={characterData.externalStorages.find(s => s.id === viewingStorageId)?.isNearby} onChange={(e) => {
                const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? {...s, isNearby: e.target.checked} : s);
                updateData({ externalStorages: newStorages });
              }} /> Is Nearby?
            </label>
          </div>
        </div>
      )}

      {/* Show stats - only show to GM or token owner */}
      {(viewingStorageId || playerRole === 'GM' || characterData.claimedBy === playerId) && (
        <>
          <div className="totals-grid">
            <div className="stat-box"><div className="stat-label">TOTAL WEIGHT</div><div className={`stat-value ${stats.totalWeight > (activeStorageDef?.capacity || stats.maxCapacity) ? 'danger' : ''}`}>{stats.totalWeight} <span style={{fontSize:'10px', color:'#666'}}>/ {activeStorageDef ? activeStorageDef.capacity : stats.maxCapacity}</span></div></div>
            <div className="stat-box"><div className="stat-label">COIN WEIGHT</div><div className={`stat-value ${stats.coinWeight > 0 ? 'danger' : ''}`}>{stats.coinWeight}u</div></div>
            <div className="stat-box"><div className="stat-label">ITEMS</div><div className="stat-value">{currentDisplayData.inventory.length}</div></div>
          </div>

          {!viewingStorageId && (
            <>
              <h2 style={{marginTop: '12px', border: 'none'}}>SLOT USAGE</h2>
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
        </>
      )}

      {/* Show description - editable only if GM or owner */}
      <div style={{marginTop: '12px', width: DESCRIPTION_WIDTH_EDITABLE, alignSelf: 'stretch'}}>
        <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>
          Description
        </label>
        <textarea
          value={currentDisplayData.condition}
          onChange={(e) => (playerRole === 'GM' || characterData.claimedBy === playerId) && handleUpdateData({ condition: e.target.value })}
          className="search-input"
          rows={2}
          disabled={!(playerRole === 'GM' || characterData.claimedBy === playerId)}
          style={{
            width: '100%',
            minHeight: '50px',
            resize: 'vertical',
            boxSizing: 'border-box',
            opacity: 1,
            cursor: (playerRole === 'GM' || characterData.claimedBy === playerId) ? 'text' : 'default',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Storage Notes - only show when viewing storage and can edit */}
      {viewingStorageId && canEditToken() && (
        <div style={{marginTop: '8px', width: '100%', alignSelf: 'stretch'}}>
          <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>Notes</label>
          <textarea value={characterData.externalStorages.find(s => s.id === viewingStorageId)?.notes || ''} onChange={(e) => {
            const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? {...s, notes: e.target.value} : s);
            updateData({ externalStorages: newStorages });
          }} className="search-input" rows={3} />
        </div>
      )}

      {/* Reputation Display - show for NPC tokens with reputation data */}
      {!viewingStorageId &&
       characterData?.packType === 'NPC' &&
       characterData?.reputation &&
       (characterData.reputation.showPartyAverage || characterData.reputation.entries.some(e => e.visibleToPlayer)) && (
        <ReputationDisplay reputation={characterData.reputation} />
      )}

      {/* Token Claiming - at the bottom of the dashboard */}
      {!viewingStorageId && characterData && (
        <div style={{marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center'}}>
          {characterData.claimedBy && (
            <div style={{fontSize: '10px', color: '#aaa'}}>
              {characterData.claimedBy === playerId ? 'You claimed this token' : 'Claimed by another player'}
            </div>
          )}
          {!characterData.claimedBy && (
            <>
              {/* Show claiming status */}
              {!characterData.claimingEnabled && playerRole !== 'GM' && (
                <div style={{fontSize: '10px', color: '#888', fontStyle: 'italic'}}>
                  🔒 Claiming disabled (GM must enable)
                </div>
              )}
              {/* Claim button */}
              {canEditToken() && (
                <button
                  onClick={async () => {
                    const success = await claimToken();
                    if (success === false) {
                      alert('Claiming is not enabled for this token. Ask the GM to enable claiming first.');
                    }
                  }}
                  style={{
                    background: characterData.claimingEnabled ? 'rgba(0,255,0,0.1)' : 'rgba(128,128,128,0.1)',
                    border: '1px solid ' + (characterData.claimingEnabled ? '#0f0' : '#888'),
                    color: characterData.claimingEnabled ? '#0f0' : '#888',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    cursor: characterData.claimingEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    opacity: characterData.claimingEnabled ? 1 : 0.5
                  }}
                >
                  CLAIM TOKEN
                </button>
              )}
            </>
          )}
          {characterData.claimedBy === playerId && (
            <button
              onClick={unclaimToken}
              style={{
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid #f00',
                color: '#f00',
                padding: '6px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              UNCLAIM TOKEN
            </button>
          )}

          {/* GM Token Controls */}
          {playerRole === 'GM' && (
            <button
              onClick={() => handleUpdateData({ claimingEnabled: !characterData.claimingEnabled })}
              style={{
                background: characterData.claimingEnabled ? 'rgba(0,255,0,0.2)' : 'rgba(128,128,128,0.2)',
                border: '1px solid ' + (characterData.claimingEnabled ? '#0f0' : '#888'),
                color: characterData.claimingEnabled ? '#0f0' : '#888',
                padding: '6px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                width: '220px'
              }}
            >
              {characterData.claimingEnabled ? '🔓 CLAIMING ENABLED' : '🔒 CLAIMING DISABLED'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
