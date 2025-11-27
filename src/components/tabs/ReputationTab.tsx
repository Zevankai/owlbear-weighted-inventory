import type { CharacterData, ReputationEntry } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ReputationTabProps {
  characterData: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
  playerRole: string;
}

// Calculate party average reputation (rounded to nearest 5)
function calculatePartyAverage(entries: ReputationEntry[]): number {
  if (entries.length === 0) return 50; // Neutral default
  const sum = entries.reduce((acc, e) => acc + e.value, 0);
  const average = sum / entries.length;
  return Math.round(average / 5) * 5; // Round to nearest 5
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
    // Red for below neutral
    const intensity = Math.max(0, 50 - value) / 50;
    return `hsl(0, ${70 * intensity}%, ${50 + intensity * 10}%)`;
  } else if (value > 50) {
    // Green for above neutral
    const intensity = (value - 50) / 50;
    return `hsl(120, ${70 * intensity}%, ${50 - intensity * 10}%)`;
  }
  // Gray for neutral (50)
  return 'hsl(0, 0%, 50%)';
}

export function ReputationTab({ characterData, updateData, playerRole }: ReputationTabProps) {
  // Initialize reputation if not exists
  const reputation = characterData.reputation || {
    entries: [],
    showPartyAverage: false
  };

  const handleAddEntry = () => {
    const label = window.prompt('Enter character name:');
    if (!label || label.trim() === '') return;

    const newEntry: ReputationEntry = {
      id: uuidv4(),
      label: label.trim(),
      value: 50, // Default neutral
      visibleToPlayer: false
    };

    updateData({
      reputation: {
        ...reputation,
        entries: [...reputation.entries, newEntry]
      }
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (!window.confirm('Delete this reputation entry?')) return;

    updateData({
      reputation: {
        ...reputation,
        entries: reputation.entries.filter(e => e.id !== id)
      }
    });
  };

  const handleUpdateEntry = (id: string, updates: Partial<ReputationEntry>) => {
    updateData({
      reputation: {
        ...reputation,
        entries: reputation.entries.map(e =>
          e.id === id ? { ...e, ...updates } : e
        )
      }
    });
  };

  const handleValueChange = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    // Clamp to 0-100
    const clampedValue = Math.max(0, Math.min(100, numValue));
    handleUpdateEntry(id, { value: clampedValue });
  };

  const handleToggleVisibility = (id: string) => {
    const entry = reputation.entries.find(e => e.id === id);
    if (!entry) return;
    handleUpdateEntry(id, { visibleToPlayer: !entry.visibleToPlayer });
  };

  const handleToggleShowAverage = () => {
    updateData({
      reputation: {
        ...reputation,
        showPartyAverage: !reputation.showPartyAverage
      }
    });
  };

  const partyAverage = calculatePartyAverage(reputation.entries);
  const partyLabel = getReputationLabel(partyAverage);
  const partyColor = getReputationColor(partyAverage);

  // Only GM can edit reputation
  if (playerRole !== 'GM') {
    return (
      <div className="section">
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Only the GM can manage NPC reputation.
        </p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>NPC Reputation</h2>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', color: 'var(--accent-gold)', marginBottom: '12px', textTransform: 'uppercase' }}>
          Individual Scores
        </h3>

        {reputation.entries.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '4px',
            border: '1px dashed var(--border)'
          }}>
            No reputation entries yet. Click "Add Character" to start.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reputation.entries.map(entry => (
              <div
                key={entry.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '10px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid var(--border)'
                }}
              >
                {/* Label */}
                <input
                  type="text"
                  value={entry.label}
                  onChange={(e) => handleUpdateEntry(entry.id, { label: e.target.value })}
                  style={{
                    flex: '1',
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  placeholder="Character name"
                />

                {/* Value Input */}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={entry.value}
                  onChange={(e) => handleValueChange(entry.id, e.target.value)}
                  style={{
                    width: '60px',
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    color: 'white',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}
                />

                {/* Mini Preview */}
                <div style={{
                  fontSize: '10px',
                  color: getReputationColor(entry.value),
                  fontWeight: 'bold',
                  width: '70px',
                  textAlign: 'center'
                }}>
                  {getReputationLabel(entry.value)}
                </div>

                {/* Visibility Toggle */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  <input
                    type="checkbox"
                    checked={entry.visibleToPlayer}
                    onChange={() => handleToggleVisibility(entry.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  Visible
                </label>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(255,0,0,0.2)',
                    border: '1px solid rgba(255,0,0,0.4)',
                    borderRadius: '3px',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={handleAddEntry}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(240, 225, 48, 0.1)',
            border: '1px solid var(--accent-gold)',
            borderRadius: '4px',
            color: 'var(--accent-gold)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          + Add Character
        </button>
      </div>

      {/* Party Average Preview */}
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '13px', color: 'var(--accent-gold)', marginBottom: '12px', textTransform: 'uppercase' }}>
          Party Average Preview
        </h3>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '16px',
          borderRadius: '4px',
          border: '1px solid var(--border)'
        }}>
          {/* Current Value Display */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: partyColor }}>
              {partyAverage}
            </div>
            <div style={{ fontSize: '12px', color: partyColor, fontWeight: 'bold' }}>
              {partyLabel}
            </div>
          </div>

          {/* Slider Track */}
          <div style={{
            position: 'relative',
            height: '40px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            marginBottom: '8px'
          }}>
            {/* Tick marks (every 5 points, 20 ticks total) */}
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
              width: '12px',
              height: '12px',
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
            fontSize: '10px',
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
            fontSize: '9px',
            color: 'var(--text-muted)',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border)'
          }}>
            <span style={{ color: 'hsl(0, 70%, 60%)' }}>Hostile</span>
            <span style={{ color: 'hsl(0, 0%, 50%)' }}>Neutral</span>
            <span style={{ color: 'hsl(120, 70%, 40%)' }}>Allied</span>
          </div>
        </div>

        {/* Show to Players Toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(240, 225, 48, 0.05)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none'
        }}>
          <input
            type="checkbox"
            checked={reputation.showPartyAverage}
            onChange={handleToggleShowAverage}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
            Show party average to players
          </span>
        </label>
      </div>
    </div>
  );
}
