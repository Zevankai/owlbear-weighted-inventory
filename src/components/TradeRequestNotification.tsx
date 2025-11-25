interface TradeRequestNotificationProps {
  isOpen: boolean;
  fromPlayerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function TradeRequestNotification({
  isOpen,
  fromPlayerName,
  onAccept,
  onDecline
}: TradeRequestNotificationProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
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
      {/* Notification Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'rgba(30, 30, 50, 0.98)',
          border: '2px solid var(--accent-gold)',
          borderRadius: '12px',
          padding: '24px',
          width: 'min(350px, 90vw)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}
      >
        <div style={{fontSize: '32px', marginBottom: '12px'}}>🤝</div>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          color: 'var(--accent-gold)',
          fontWeight: 'bold'
        }}>
          Trade Request
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-main)',
          marginBottom: '24px',
          lineHeight: 1.5
        }}>
          <strong>{fromPlayerName}</strong> would like to trade with you
        </p>
        <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              background: '#4a9eff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#3a8eef'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4a9eff'}
          >
            Accept
          </button>
          <button
            onClick={onDecline}
            style={{
              flex: 1,
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e03030'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--danger)'}
          >
            Decline
          </button>
        </div>
      </div>
    </>
  );
}
