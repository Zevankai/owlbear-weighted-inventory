import type { Reputation } from '../types';

interface ReputationDisplayProps {
  reputation: Reputation;
}

// Calculate party average reputation (rounded to nearest 5)
function calculatePartyAverage(entries: any[]): number {
  if (entries.length === 0) return 50;
  const sum = entries.reduce((acc: number, e: any) => acc + e.value, 0);
  const average = sum / entries.length;
  return Math.round(average / 5) * 5;
}

// Get descriptive label based on reputation value
function getReputationLabel(value: number): string {
  if (value <= 15) return 'Hostile';
  if (value <= 35) return 'Unfriendly';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Friendly';
  return 'Allied';
}

// Get color based on reputation value
function getReputationColor(value: number): string {
  if (value < 50) {
    const intensity = Math.max(0, 50 - value) / 50;
    return `hsl(0, ${70 * intensity}%, ${50 + intensity * 10}%)`;
  } else if (value > 50) {
    const intensity = (value - 50) / 50;
    return `hsl(120, ${70 * intensity}%, ${50 - intensity * 10}%)`;
  }
  return 'hsl(0, 0%, 50%)';
}

export function ReputationDisplay({ reputation }: ReputationDisplayProps) {
  const partyAverage = calculatePartyAverage(reputation.entries);
  const partyLabel = getReputationLabel(partyAverage);
  const partyColor = getReputationColor(partyAverage);

  const visibleEntries = reputation.entries.filter(e => e.visibleToPlayer);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      padding: '12px',
      borderRadius: '4px',
      border: '1px solid var(--border)',
      marginTop: '12px'
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '12px',
        color: 'var(--accent-gold)',
        textTransform: 'uppercase'
      }}>
        Party Reputation
      </h3>

      {/* Show party average if enabled */}
      {reputation.showPartyAverage && (
        <div style={{ marginBottom: visibleEntries.length > 0 ? '16px' : '0' }}>
          {/* Current Value Display */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: partyColor }}>
              {partyAverage}
            </div>
            <div style={{ fontSize: '11px', color: partyColor, fontWeight: 'bold' }}>
              {partyLabel}
            </div>
          </div>

          {/* Slider Track */}
          <div style={{
            position: 'relative',
            height: '30px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            marginBottom: '6px'
          }}>
            {/* Tick marks */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex'
            }}>
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: '1',
                    borderRight: i < 20 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Current value indicator */}
            <div style={{
              position: 'absolute',
              left: `${partyAverage}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: partyColor,
              border: '2px solid white',
              boxShadow: '0 0 8px rgba(0,0,0,0.5)',
              zIndex: 10
            }} />
          </div>

          {/* Labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: 'var(--text-muted)',
            paddingTop: '4px'
          }}>
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>

          {/* Descriptive Labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '8px',
            color: 'var(--text-muted)',
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border)'
          }}>
            <span style={{ color: 'hsl(0, 70%, 60%)' }}>Hostile</span>
            <span style={{ color: 'hsl(0, 0%, 50%)' }}>Neutral</span>
            <span style={{ color: 'hsl(120, 70%, 40%)' }}>Allied</span>
          </div>
        </div>
      )}

      {/* Show individual scores if any are visible */}
      {visibleEntries.length > 0 && (
        <div style={{
          paddingTop: reputation.showPartyAverage ? '12px' : '0',
          borderTop: reputation.showPartyAverage ? '1px solid var(--border)' : 'none'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            Individual Scores:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visibleEntries.map(entry => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
              >
                <span style={{ color: 'white' }}>{entry.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: getReputationColor(entry.value) }}>
                    {entry.value}
                  </span>
                  <span style={{ fontSize: '10px', color: getReputationColor(entry.value) }}>
                    ({getReputationLabel(entry.value)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
