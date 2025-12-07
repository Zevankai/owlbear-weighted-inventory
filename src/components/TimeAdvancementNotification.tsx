import React from 'react';
import type { RestType } from '../types';

interface TimeAdvancementNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  restType: RestType;
  hoursAdvanced: number;
  newDateTime: string; // Formatted date/time string from calendar
}

export const TimeAdvancementNotification: React.FC<TimeAdvancementNotificationProps> = ({
  isVisible,
  onClose,
  restType,
  hoursAdvanced,
  newDateTime,
}) => {
  if (!isVisible) {
    return null;
  }

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
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Notification Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(40, 40, 60, 0.98))',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${restType === 'short' ? '#4dabf7' : '#c084fc'}`,
            borderRadius: '16px',
            padding: '32px',
            minWidth: '360px',
            maxWidth: '500px',
            boxShadow: `0 8px 32px ${
              restType === 'short' ? 'rgba(77, 171, 247, 0.4)' : 'rgba(192, 132, 252, 0.4)'
            }`,
            animation: 'slideIn 0.3s ease-out',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {restType === 'short' ? '☀️' : '🌙'}
          </div>

          {/* Title */}
          <h3
            style={{
              margin: '0 0 8px',
              color: restType === 'short' ? '#4dabf7' : '#c084fc',
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
            Time Has Advanced!
          </h3>

          {/* Description */}
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-main)',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}
          >
            The party has completed their{' '}
            <strong style={{ color: restType === 'short' ? '#4dabf7' : '#c084fc' }}>
              {restType} rest
            </strong>
            .
          </p>

          {/* Time Advanced */}
          <div
            style={{
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Time Advanced
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: restType === 'short' ? '#4dabf7' : '#c084fc',
              }}
            >
              +{hoursAdvanced} Hours
            </div>
          </div>

          {/* Current Date/Time */}
          <div
            style={{
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Current Date & Time
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--accent-gold)',
                lineHeight: 1.4,
              }}
            >
              {newDateTime}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: `linear-gradient(135deg, ${
                restType === 'short' ? '#4dabf7, #228be6' : '#c084fc, #9333ea'
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
            ✓ Continue
          </button>
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
