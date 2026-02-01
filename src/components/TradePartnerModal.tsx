export type OwnerType = 'self' | 'party' | 'other-player' | 'npc' | 'merchant';

export interface TradePartner {
  tokenId: string;
  tokenName: string;
  tokenImage: string | null;
  claimedBy: string;
  ownerType: OwnerType;
}

interface TradePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPartner: (partner: TradePartner) => void;
  partners: TradePartner[];
  loading?: boolean;
}

function getOwnerLabel(ownerType: OwnerType): string {
  switch (ownerType) {
    case 'self':
      return '(Your token)';
    case 'party':
      return '(Party)';
    case 'other-player':
      return '(Another player)';
    case 'npc':
      return '(NPC)';
    case 'merchant':
      return '(Merchant)';
  }
}

function getOwnerColor(ownerType: OwnerType): string {
  switch (ownerType) {
    case 'self':
      return '#4a9eff';
    case 'party':
      return 'var(--accent-gold)';
    case 'other-player':
      return '#888';
    case 'npc':
      return '#9b59b6';
    case 'merchant':
      return '#8BC34A';
  }
}

export function TradePartnerModal({
  isOpen,
  onClose,
  onSelectPartner,
  partners,
  loading
}: TradePartnerModalProps) {
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
          background: 'rgba(0,0,0,0.7)',
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
          width: 'min(400px, 90vw)',
          maxHeight: '80vh',
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
            fontSize: '16px',
            color: 'var(--accent-gold)',
            fontWeight: 'bold'
          }}>
            Select Trade Partner
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              color: '#aaa',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: '100px'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--text-muted)'
            }}>
              Loading trade partners...
            </div>
          ) : partners.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤷</div>
              <p style={{ margin: 0, fontSize: '13px' }}>No trade partners nearby</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#666' }}>
                Other claimed tokens must be near your character to trade
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {partners.map(partner => (
                <button
                  key={partner.tokenId}
                  onClick={() => onSelectPartner(partner)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {/* Token Image */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${getOwnerColor(partner.ownerType)}`,
                    background: 'rgba(0,0,0,0.3)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {partner.tokenImage ? (
                      <img
                        src={partner.tokenImage}
                        alt={partner.tokenName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '18px' }}>👤</span>
                    )}
                  </div>

                  {/* Token Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {partner.tokenName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: getOwnerColor(partner.ownerType)
                    }}>
                      {getOwnerLabel(partner.ownerType)}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div style={{ color: '#666', fontSize: '16px' }}>
                    →
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {partners.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            fontSize: '10px',
            color: '#666',
            textAlign: 'center'
          }}>
            <em>Trading with your own tokens or NPCs opens instantly</em>
          </div>
        )}
      </div>
    </>
  );
}
