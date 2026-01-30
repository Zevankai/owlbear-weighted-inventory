import { v4 as uuidv4 } from 'uuid';
import type { MonsterLootEntry, MonsterSettings } from '../../types';
import { DebouncedTextarea } from '../DebouncedInput';

interface MonsterLootTabProps {
  monsterSettings: MonsterSettings;
  onUpdate: (updates: Partial<MonsterSettings>) => void;
  canEdit: boolean;
}

export function MonsterLootTab({ monsterSettings, onUpdate, canEdit }: MonsterLootTabProps) {
  const addEntry = () => {
    const newEntry: MonsterLootEntry = {
      id: uuidv4(),
      content: '',
      order: monsterSettings.lootEntries.length,
    };
    onUpdate({
      lootEntries: [...monsterSettings.lootEntries, newEntry],
    });
  };

  const updateEntry = (id: string, content: string) => {
    onUpdate({
      lootEntries: monsterSettings.lootEntries.map(entry =>
        entry.id === id ? { ...entry, content } : entry
      ),
    });
  };

  const deleteEntry = (id: string) => {
    onUpdate({
      lootEntries: monsterSettings.lootEntries
        .filter(entry => entry.id !== id)
        .map((entry, index) => ({ ...entry, order: index })),
    });
  };

  const moveEntry = (id: string, direction: 'up' | 'down') => {
    const currentIndex = monsterSettings.lootEntries.findIndex(e => e.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= monsterSettings.lootEntries.length) return;

    const newEntries = [...monsterSettings.lootEntries];
    [newEntries[currentIndex], newEntries[newIndex]] = [newEntries[newIndex], newEntries[currentIndex]];
    
    // Update order values
    const reorderedEntries = newEntries.map((entry, index) => ({ ...entry, order: index }));
    onUpdate({ lootEntries: reorderedEntries });
  };

  const toggleVisibility = () => {
    onUpdate({ lootVisibleToPlayers: !monsterSettings.lootVisibleToPlayers });
  };

  const sortedEntries = [...monsterSettings.lootEntries].sort((a, b) => a.order - b.order);

  return (
    <div className="section" style={{ padding: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '18px',
          color: '#e53935',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Monster Loot
        </h2>
        {canEdit && (
          <button
            onClick={toggleVisibility}
            style={{
              padding: '6px 12px',
              background: monsterSettings.lootVisibleToPlayers 
                ? 'rgba(76, 175, 80, 0.3)' 
                : 'rgba(244, 67, 54, 0.3)',
              border: `1px solid ${monsterSettings.lootVisibleToPlayers ? '#4caf50' : '#f44336'}`,
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {monsterSettings.lootVisibleToPlayers ? '👁️ Visible to Players' : '🔒 Hidden from Players'}
          </button>
        )}
      </div>

      {canEdit && (
        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#999' }}>
          Loot is automatically visible to players when the monster dies (HP = 0). 
          Use the toggle above to manually make it visible earlier.
        </div>
      )}

      {sortedEntries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#666',
          fontSize: '14px',
        }}>
          No loot entries yet. {canEdit && 'Click "Add Loot Entry" to start.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                background: 'rgba(229, 57, 53, 0.1)',
                border: '1px solid rgba(229, 57, 53, 0.3)',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#e53935', 
                  fontWeight: 'bold',
                  textTransform: 'uppercase' 
                }}>
                  Loot Item {index + 1}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => moveEntry(entry.id, 'up')}
                      disabled={index === 0}
                      style={{
                        padding: '2px 6px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.3 : 1,
                        fontSize: '10px',
                      }}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveEntry(entry.id, 'down')}
                      disabled={index === sortedEntries.length - 1}
                      style={{
                        padding: '2px 6px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: index === sortedEntries.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === sortedEntries.length - 1 ? 0.3 : 1,
                        fontSize: '10px',
                      }}
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      style={{
                        padding: '2px 6px',
                        background: 'rgba(244, 67, 54, 0.3)',
                        border: '1px solid #f44336',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              {canEdit ? (
                <DebouncedTextarea
                  value={entry.content}
                  onChange={(value) => updateEntry(entry.id, value)}
                  placeholder="Describe this loot item..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '8px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              ) : (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#ddd', 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5' 
                }}>
                  {entry.content || <span style={{ color: '#666', fontStyle: 'italic' }}>No description</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <button
          onClick={addEntry}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '10px',
            background: 'rgba(229, 57, 53, 0.2)',
            border: '1px solid #e53935',
            borderRadius: '6px',
            color: '#e53935',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          + Add Loot Entry
        </button>
      )}
    </div>
  );
}
