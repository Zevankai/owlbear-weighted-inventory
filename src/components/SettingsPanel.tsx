import type { CharacterData, Theme } from '../types';

interface DebugInfo {
  roomKeys: string[];
  roomSize: number;
  tokenSize: number;
  tokenDataSize: number;
  hasLegacyRoomData: boolean;
  hasLegacyNameKeys: boolean;
  legacyNameKeys: string[];
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  updateTheme: (theme: Theme) => void;
  characterData: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
  debugInfo: DebugInfo | null;
  loadDebugInfo: () => void;
  cleanupLegacyData: () => void;
  tokenId: string | null;
}

export function SettingsPanel({
  isOpen,
  onClose,
  theme,
  updateTheme,
  characterData,
  updateData,
  debugInfo,
  loadDebugInfo,
  cleanupLegacyData,
  tokenId
}: SettingsPanelProps) {
  if (!isOpen) return null;

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
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'rgba(15, 15, 30, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0',
        width: 'min(500px, 90vw)',
        maxHeight: 'min(600px, 80vh)',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        color: 'var(--text-main)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px 8px 0 0',
          flexShrink: 0
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent-gold)' }}>
            ⚙ Settings
          </span>
          <button
            onClick={onClose}
            style={{
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content - scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Theme Colors Section */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              🎨 Theme Colors
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Accent
                </label>
                <input
                  type="color"
                  value={theme.accent}
                  onChange={(e) => updateTheme({ ...theme, accent: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Background
                </label>
                <input
                  type="color"
                  value={theme.background}
                  onChange={(e) => updateTheme({ ...theme, background: e.target.value })}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => updateTheme({ accent: '#f0e130', background: '#0f0f1e' })}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              Reset to Default
            </button>
          </div>

          {/* Cover Photo Section */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              🖼️ Cover Photo
            </label>
            <input
              type="text"
              value={characterData.coverPhotoUrl || ''}
              onChange={(e) => updateData({ coverPhotoUrl: e.target.value || undefined })}
              placeholder="Paste image URL here..."
              className="search-input"
              style={{ marginTop: 0, marginBottom: '8px' }}
            />
            {characterData.coverPhotoUrl && (
              <>
                {/* Preview */}
                <div style={{
                  width: '100%',
                  height: '100px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <img
                    src={characterData.coverPhotoUrl}
                    alt="Cover preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                {/* Remove button */}
                <button
                  onClick={() => updateData({ coverPhotoUrl: undefined })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255,0,0,0.1)',
                    border: '1px solid rgba(255,0,0,0.3)',
                    borderRadius: '4px',
                    color: '#f66',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
                >
                  Remove Cover Photo
                </button>
              </>
            )}
          </div>

          {/* Debug Info Section */}
          <div style={{
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              🔧 Debug Info
            </label>

            {debugInfo && (
              <>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#4dabf7', marginBottom: '4px', fontSize: '11px' }}>✨ Current Token Storage:</div>
                  {tokenId ? (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: debugInfo.tokenDataSize > 15000 ? '#ff6b6b' : '#51cf66' }}>
                        {debugInfo.tokenDataSize} bytes / 16384 bytes
                      </div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                        {((debugInfo.tokenDataSize / 16384) * 100).toFixed(1)}% used (this token only)
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#aaa', fontSize: '10px' }}>No token selected</div>
                  )}
                </div>

                <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#4dabf7', marginBottom: '4px', fontSize: '11px' }}>Room Metadata (shared):</div>
                  <div style={{ fontSize: '12px', color: debugInfo.roomSize > 15000 ? '#ff6b6b' : '#51cf66' }}>
                    {debugInfo.roomSize} bytes / 16384 bytes
                  </div>
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                    Used by all extensions ({debugInfo.roomKeys.length} keys)
                  </div>
                </div>

                <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  <div style={{ color: '#4dabf7', marginBottom: '4px', fontSize: '11px' }}>Legacy Data:</div>
                  {(debugInfo.hasLegacyRoomData || debugInfo.hasLegacyNameKeys) ? (
                    <>
                      <div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '11px' }}>
                        ⚠️ FOUND {debugInfo.hasLegacyNameKeys ? `(${debugInfo.legacyNameKeys.length} old keys)` : ''}
                      </div>
                      <button
                        onClick={cleanupLegacyData}
                        style={{
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginTop: '6px',
                          width: '100%'
                        }}
                      >
                        CLEANUP LEGACY DATA
                      </button>
                    </>
                  ) : (
                    <div style={{ color: '#51cf66', fontSize: '11px' }}>✓ Clean (using token storage)</div>
                  )}
                </div>

                <button
                  onClick={loadDebugInfo}
                  style={{
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    width: '100%'
                  }}
                >
                  REFRESH
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
