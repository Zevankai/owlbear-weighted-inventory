import React, { useState, useEffect } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import type { RestType } from '../types';
import { REST_NOTIFICATION_KEY, type RestNotificationData } from '../utils/restNotifications';

interface RestNotificationProps {
  onConfirm: (restType: RestType) => void;
  onAllConfirmed: (restType: RestType, hoursToAdvance: number) => void;
  isVisible: boolean;
}

export const RestNotification: React.FC<RestNotificationProps> = ({
  onConfirm,
  onAllConfirmed,
  isVisible,
}) => {
  const [notification, setNotification] = useState<RestNotificationData | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      await new Promise<void>(resolve => OBR.onReady(() => resolve()));
      if (!active) return;

      const id = await OBR.player.getId();
      setPlayerId(id);

      // Subscribe to room metadata changes for rest notifications
      unsubscribe = OBR.room.onMetadataChange((metadata) => {
        if (!active) return;

        const notificationData = metadata[REST_NOTIFICATION_KEY] as RestNotificationData | undefined;
        
        if (notificationData) {
          // Check if this is a new notification (different ID)
          if (!notification || notification.id !== notificationData.id) {
            setNotification(notificationData);
            setHasResponded(false);
            
            // If this player is the initiator, auto-redirect them to rest tab
            if (notificationData.initiatorId === id) {
              onConfirm(notificationData.restType);
            }
          } else {
            // Update existing notification (confirmations may have changed)
            setNotification(notificationData);
            
            // Check if all players have confirmed
            const allConfirmed = notificationData.allPlayerIds.every(
              (pid) => notificationData.confirmations[pid] === true
            );
            
            if (allConfirmed && notificationData.allPlayerIds.length > 0) {
              // All players confirmed - advance time and clear notification
              const hoursToAdvance = notificationData.restType === 'short' ? 2 : 8;
              onAllConfirmed(notificationData.restType, hoursToAdvance);
              
              // Clear the notification from room metadata
              OBR.room.setMetadata({
                [REST_NOTIFICATION_KEY]: undefined,
              });
            }
          }
        } else {
          // Notification was cleared
          setNotification(null);
          setHasResponded(false);
        }
      });
    };

    if (OBR.isAvailable) {
      setup();
    }

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [onAllConfirmed, onConfirm, notification]);

  const handleConfirm = async () => {
    if (!notification || hasResponded) return;

    setHasResponded(true);

    // Update confirmations in room metadata
    const updatedConfirmations = {
      ...notification.confirmations,
      [playerId]: true,
    };

    await OBR.room.setMetadata({
      [REST_NOTIFICATION_KEY]: {
        ...notification,
        confirmations: updatedConfirmations,
      },
    });

    // Trigger local confirmation handler
    onConfirm(notification.restType);
  };

  const handleIgnore = async () => {
    if (!notification || hasResponded) return;

    setHasResponded(true);

    // Mark as ignored (false) in confirmations
    const updatedConfirmations = {
      ...notification.confirmations,
      [playerId]: false,
    };

    await OBR.room.setMetadata({
      [REST_NOTIFICATION_KEY]: {
        ...notification,
        confirmations: updatedConfirmations,
      },
    });
  };

  // Don't show if no notification, already responded, or not visible
  if (!notification || hasResponded || !isVisible) {
    return null;
  }

  // Check if this is the initiator - they should not see the popup
  const isInitiator = notification.initiatorId === playerId;
  
  // If initiator, don't show notification (they're already redirected via useEffect)
  if (isInitiator) {
    return null;
  }

  // Calculate how many players have confirmed
  const confirmedCount = Object.values(notification.confirmations).filter((c) => c === true).length;
  const totalCount = notification.allPlayerIds.length;

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
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Notification Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(40, 40, 60, 0.98))',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${notification.restType === 'short' ? '#4dabf7' : '#c084fc'}`,
            borderRadius: '16px',
            padding: '24px',
            minWidth: '360px',
            maxWidth: '500px',
            boxShadow: `0 8px 32px ${
              notification.restType === 'short' ? 'rgba(77, 171, 247, 0.4)' : 'rgba(192, 132, 252, 0.4)'
            }`,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>
              {notification.restType === 'short' ? '☀️' : '🌙'}
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  color: notification.restType === 'short' ? '#4dabf7' : '#c084fc',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                {notification.restType === 'short' ? 'Short Rest' : 'Long Rest'} Initiated
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                by {notification.initiatorName}
              </p>
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-main)',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
          >
            Would you like to rest with the party? If all players confirm, the calendar will
            automatically advance by{' '}
            <strong style={{ color: notification.restType === 'short' ? '#4dabf7' : '#c084fc' }}>
              {notification.restType === 'short' ? '2 hours' : '8 hours'}
            </strong>
            , and you'll be directed to the Rest tab.
          </p>

          {/* Confirmation Status */}
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <strong>Status:</strong> {confirmedCount} of {totalCount} player
            {totalCount !== 1 ? 's' : ''} confirmed
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${
                  notification.restType === 'short' ? '#4dabf7, #228be6' : '#c084fc, #9333ea'
                })`,
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
            >
              ✓ Confirm Rest
            </button>
            <button
              onClick={handleIgnore}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'rgba(255, 107, 107, 0.2)',
                border: '1px solid rgba(255, 107, 107, 0.4)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
              }}
            >
              ✕ Ignore
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};
