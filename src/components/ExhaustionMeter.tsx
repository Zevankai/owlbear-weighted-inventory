import React from 'react';
import type { ExhaustionState } from '../types';

interface ExhaustionMeterProps {
  exhaustion: ExhaustionState;
  onExhaustionChange: (level: number) => void;
  canEdit: boolean;
  customEffects?: string[]; // GM-defined effects per level
}

// Default D&D 5e exhaustion effects
const DEFAULT_EXHAUSTION_EFFECTS: string[] = [
  'No effect',
  'Disadvantage on ability checks',
  'Speed halved',
  'Disadvantage on attack rolls and saving throws',
  'Hit point maximum halved',
  'Speed reduced to 0',
  'Death',
];

export const ExhaustionMeter: React.FC<ExhaustionMeterProps> = ({
  exhaustion,
  onExhaustionChange,
  canEdit,
  customEffects,
}) => {
  const { currentLevel, maxLevels } = exhaustion;
  const effects = customEffects && customEffects.length > 0 ? customEffects : DEFAULT_EXHAUSTION_EFFECTS;
  
  // Get the current effect description
  const currentEffect = effects[currentLevel] || effects[0] || 'No effect';
  
  // Determine severity color
  const getSeverityColor = (level: number, max: number): string => {
    if (level === 0) return '#51cf66'; // Green - healthy
    const ratio = level / max;
    if (ratio <= 0.33) return '#fcc419'; // Yellow - mild
    if (ratio <= 0.66) return '#ff922b'; // Orange - moderate
    return '#ff6b6b'; // Red - severe
  };
  
  const severityColor = getSeverityColor(currentLevel, maxLevels);
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid var(--glass-border)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '11px',
          color: 'var(--accent-gold)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Exhaustion
        </h3>
        <span style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: severityColor,
        }}>
          Level {currentLevel}/{maxLevels}
        </span>
      </div>

      {/* Visual meter - clickable segments */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '10px',
      }}>
        {Array.from({ length: maxLevels }, (_, i) => {
          const level = i + 1;
          const isFilled = level <= currentLevel;
          const segmentColor = getSeverityColor(level, maxLevels);
          
          return (
            <button
              key={level}
              onClick={() => {
                if (!canEdit) return;
                // Click to toggle: if this level is filled, set to level-1, otherwise set to this level
                if (level === currentLevel) {
                  onExhaustionChange(level - 1);
                } else {
                  onExhaustionChange(level);
                }
              }}
              disabled={!canEdit}
              title={`Level ${level}: ${effects[level] || 'Unknown effect'}`}
              style={{
                flex: 1,
                height: '20px',
                border: `1px solid ${isFilled ? segmentColor : '#444'}`,
                borderRadius: '4px',
                background: isFilled 
                  ? `linear-gradient(to top, ${segmentColor}, ${segmentColor}88)`
                  : 'rgba(0, 0, 0, 0.3)',
                cursor: canEdit ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                opacity: canEdit ? 1 : 0.7,
              }}
            />
          );
        })}
      </div>

      {/* Current effect display */}
      <div style={{
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
        fontSize: '10px',
        color: currentLevel > 0 ? severityColor : 'var(--text-muted)',
        lineHeight: '1.4',
      }}>
        <strong>Current Effect:</strong> {currentEffect}
      </div>

      {/* Adjustment buttons for easy control */}
      {canEdit && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '10px',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => onExhaustionChange(Math.max(0, currentLevel - 1))}
            disabled={currentLevel === 0}
            style={{
              flex: 1,
              padding: '6px',
              background: currentLevel === 0 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(81, 207, 102, 0.2)',
              border: `1px solid ${currentLevel === 0 ? '#444' : '#51cf66'}`,
              borderRadius: '4px',
              color: currentLevel === 0 ? '#666' : '#51cf66',
              cursor: currentLevel === 0 ? 'not-allowed' : 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            − Reduce
          </button>
          <button
            onClick={() => onExhaustionChange(Math.min(maxLevels, currentLevel + 1))}
            disabled={currentLevel === maxLevels}
            style={{
              flex: 1,
              padding: '6px',
              background: currentLevel === maxLevels ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 107, 107, 0.2)',
              border: `1px solid ${currentLevel === maxLevels ? '#444' : '#ff6b6b'}`,
              borderRadius: '4px',
              color: currentLevel === maxLevels ? '#666' : '#ff6b6b',
              cursor: currentLevel === maxLevels ? 'not-allowed' : 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            + Increase
          </button>
        </div>
      )}

      {/* Help text */}
      <div style={{
        marginTop: '8px',
        fontSize: '9px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        textAlign: 'center',
      }}>
        {canEdit ? 'Click segments or buttons to adjust' : 'View only'}
      </div>
    </div>
  );
};
