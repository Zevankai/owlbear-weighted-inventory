import { useState } from 'react';
import type { LoreEntry, LoreTabConfig, LoreTabId } from '../../types';
import { LORE_TAB_DEFINITIONS } from '../../constants/lore';
import { LoreEntryEditor } from '../LoreEntryEditor';
import { parseMarkdown } from '../../utils/markdown';

// Tab-specific styling configuration
const TAB_STYLES: Record<LoreTabId, {
  accentColor: string;
  icon: string;
  headerStyle?: React.CSSProperties;
}> = {
  overview: { accentColor: '#9c27b0', icon: '📜' },
  history: { accentColor: '#795548', icon: '📅' },
  rumors: { accentColor: '#607d8b', icon: '💬' },
  quests: { accentColor: '#ff9800', icon: '⚔️' },
  people: { accentColor: '#2196f3', icon: '👤' },
  government: { accentColor: '#673ab7', icon: '🏛️' },
  geography: { accentColor: '#4caf50', icon: '🗺️' },
  economy: { accentColor: '#ffc107', icon: '💰' },
  culture: { accentColor: '#e91e63', icon: '🎭' },
  dangers: { accentColor: '#f44336', icon: '⚠️' },
  services: { accentColor: '#00bcd4', icon: '🛠️' },
  menu: { accentColor: '#8bc34a', icon: '📋' },
  secrets: { accentColor: '#9e9e9e', icon: '🔒' },
  properties: { accentColor: '#3f51b5', icon: '📊' },
  legends: { accentColor: '#ff5722', icon: '📖' },
  members: { accentColor: '#009688', icon: '👥' },
  goals: { accentColor: '#cddc39', icon: '🎯' },
  resources: { accentColor: '#ffeb3b', icon: '📦' },
  relationships: { accentColor: '#03a9f4', icon: '🤝' },
  images: { accentColor: '#9c27b0', icon: '🖼️' },
  notes: { accentColor: '#607d8b', icon: '📝' },
};

interface LoreTabProps {
  tabConfig: LoreTabConfig;
  playerRole: string;
  onUpdateEntries: (tabId: LoreTabId, entries: LoreEntry[]) => void;
}

// Specialized field renderers for different tab types
function RumorFields({ entry }: { entry: LoreEntry }) {
  if (!entry.heardFrom) return null;
  return (
    <div style={{
      fontSize: '10px',
      color: '#607d8b',
      fontStyle: 'italic',
      marginTop: '4px',
    }}>
      — Heard from: {entry.heardFrom}
    </div>
  );
}

function QuestFields({ entry }: { entry: LoreEntry }) {
  const difficultyColors: Record<string, string> = {
    trivial: '#4caf50',
    easy: '#8bc34a',
    medium: '#ff9800',
    hard: '#f44336',
    deadly: '#9c27b0',
  };
  
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
      {entry.isCompleted !== undefined && (
        <span style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '3px',
          background: entry.isCompleted ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
          color: entry.isCompleted ? '#4caf50' : '#ff9800',
          fontWeight: 'bold',
        }}>
          {entry.isCompleted ? '✓ COMPLETED' : '○ IN PROGRESS'}
        </span>
      )}
      {entry.difficulty && (
        <span style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '3px',
          background: `${difficultyColors[entry.difficulty]}20`,
          color: difficultyColors[entry.difficulty],
        }}>
          {entry.difficulty.toUpperCase()}
        </span>
      )}
      {entry.reward && (
        <span style={{
          fontSize: '10px',
          color: '#ffc107',
        }}>
          🏆 {entry.reward}
        </span>
      )}
    </div>
  );
}

function PeopleFields({ entry }: { entry: LoreEntry }) {
  const relationshipColors: Record<string, string> = {
    ally: '#4caf50',
    neutral: '#9e9e9e',
    enemy: '#f44336',
    unknown: '#607d8b',
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
      {entry.role && (
        <span style={{
          fontSize: '10px',
          color: '#2196f3',
          fontStyle: 'italic',
        }}>
          {entry.role}
        </span>
      )}
      {entry.relationship && (
        <span style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '3px',
          background: `${relationshipColors[entry.relationship]}20`,
          color: relationshipColors[entry.relationship],
        }}>
          {entry.relationship.toUpperCase()}
        </span>
      )}
    </div>
  );
}

function HistoryFields({ entry }: { entry: LoreEntry }) {
  if (!entry.date) return null;
  return (
    <div style={{
      fontSize: '10px',
      color: '#795548',
      fontStyle: 'italic',
      marginTop: '4px',
    }}>
      📅 {entry.date}
    </div>
  );
}

function DangersFields({ entry }: { entry: LoreEntry }) {
  const threatColors: Record<string, string> = {
    low: '#4caf50',
    moderate: '#ff9800',
    high: '#f44336',
    extreme: '#9c27b0',
  };
  
  if (!entry.threatLevel) return null;
  return (
    <span style={{
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '3px',
      background: `${threatColors[entry.threatLevel]}20`,
      color: threatColors[entry.threatLevel],
      fontWeight: 'bold',
    }}>
      ⚠️ {entry.threatLevel.toUpperCase()} THREAT
    </span>
  );
}

function ServiceMenuFields({ entry }: { entry: LoreEntry }) {
  const availabilityColors: Record<string, string> = {
    available: '#4caf50',
    limited: '#ff9800',
    unavailable: '#f44336',
  };
  
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
      {entry.price && (
        <span style={{
          fontSize: '10px',
          color: '#ffc107',
          fontWeight: 'bold',
        }}>
          💰 {entry.price}
        </span>
      )}
      {entry.quantity && (
        <span style={{
          fontSize: '10px',
          color: '#9e9e9e',
        }}>
          📦 {entry.quantity}
        </span>
      )}
      {entry.availability && (
        <span style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '3px',
          background: `${availabilityColors[entry.availability]}20`,
          color: availabilityColors[entry.availability],
        }}>
          {entry.availability.toUpperCase()}
        </span>
      )}
    </div>
  );
}

function SecretsFields({ entry, isGM }: { entry: LoreEntry; isGM: boolean }) {
  if (!isGM || entry.isRevealed === undefined) return null;
  return (
    <span style={{
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '3px',
      background: entry.isRevealed ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
      color: entry.isRevealed ? '#4caf50' : '#9e9e9e',
    }}>
      {entry.isRevealed ? '🔓 REVEALED' : '🔒 HIDDEN'}
    </span>
  );
}

function MembersFields({ entry }: { entry: LoreEntry }) {
  if (!entry.rank) return null;
  return (
    <span style={{
      fontSize: '10px',
      color: '#009688',
      fontStyle: 'italic',
    }}>
      🎖️ {entry.rank}
    </span>
  );
}

function GoalsFields({ entry }: { entry: LoreEntry }) {
  const priorityColors: Record<string, string> = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {entry.priority && (
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '3px',
            background: `${priorityColors[entry.priority]}20`,
            color: priorityColors[entry.priority],
          }}>
            {entry.priority.toUpperCase()} PRIORITY
          </span>
        )}
      </div>
      {entry.progress !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            flex: 1,
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${entry.progress}%`,
              height: '100%',
              background: entry.progress >= 100 ? '#4caf50' : '#cddc39',
              borderRadius: '3px',
            }} />
          </div>
          <span style={{ fontSize: '10px', color: '#cddc39' }}>
            {entry.progress}%
          </span>
        </div>
      )}
    </div>
  );
}

function RelationshipsFields({ entry }: { entry: LoreEntry }) {
  const relationshipColors: Record<string, string> = {
    ally: '#4caf50',
    neutral: '#9e9e9e',
    enemy: '#f44336',
    unknown: '#607d8b',
  };
  
  if (!entry.relationship) return null;
  return (
    <span style={{
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '3px',
      background: `${relationshipColors[entry.relationship]}20`,
      color: relationshipColors[entry.relationship],
    }}>
      {entry.relationship === 'ally' ? '💚' : entry.relationship === 'enemy' ? '💔' : '💛'} {entry.relationship.toUpperCase()}
    </span>
  );
}

// Render specialized fields based on tab type
function SpecializedFields({ tabId, entry, isGM }: { tabId: LoreTabId; entry: LoreEntry; isGM: boolean }) {
  switch (tabId) {
    case 'rumors':
      return <RumorFields entry={entry} />;
    case 'quests':
      return <QuestFields entry={entry} />;
    case 'people':
      return <PeopleFields entry={entry} />;
    case 'history':
      return <HistoryFields entry={entry} />;
    case 'dangers':
      return <DangersFields entry={entry} />;
    case 'services':
    case 'menu':
      return <ServiceMenuFields entry={entry} />;
    case 'secrets':
      return <SecretsFields entry={entry} isGM={isGM} />;
    case 'members':
      return <MembersFields entry={entry} />;
    case 'goals':
      return <GoalsFields entry={entry} />;
    case 'relationships':
      return <RelationshipsFields entry={entry} />;
    default:
      return null;
  }
}

export function LoreTab({ tabConfig, playerRole, onUpdateEntries }: LoreTabProps) {
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const isGM = playerRole === 'GM';
  const tabDef = LORE_TAB_DEFINITIONS[tabConfig.tabId];
  const tabStyle = TAB_STYLES[tabConfig.tabId] || TAB_STYLES.notes;

  // Filter entries based on visibility for players
  const visibleEntries = isGM 
    ? tabConfig.entries 
    : tabConfig.entries.filter(e => e.visibleToPlayers);

  // Sort entries by order
  const sortedEntries = [...visibleEntries].sort((a, b) => a.order - b.order);

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsEditorOpen(true);
  };

  const handleEditEntry = (entry: LoreEntry) => {
    setEditingEntry(entry);
    setIsEditorOpen(true);
  };

  const handleSaveEntry = (savedEntry: LoreEntry) => {
    const existingIndex = tabConfig.entries.findIndex(e => e.id === savedEntry.id);
    let newEntries: LoreEntry[];

    if (existingIndex >= 0) {
      // Update existing entry
      newEntries = tabConfig.entries.map(e => 
        e.id === savedEntry.id ? savedEntry : e
      );
    } else {
      // Add new entry with order at the end
      savedEntry.order = tabConfig.entries.length;
      newEntries = [...tabConfig.entries, savedEntry];
    }

    onUpdateEntries(tabConfig.tabId, newEntries);
    setEditingEntry(null);
    setIsEditorOpen(false);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Delete this entry?')) {
      const newEntries = tabConfig.entries.filter(e => e.id !== entryId);
      onUpdateEntries(tabConfig.tabId, newEntries);
    }
  };

  const handleToggleVisibility = (entryId: string) => {
    const newEntries = tabConfig.entries.map(e => 
      e.id === entryId ? { ...e, visibleToPlayers: !e.visibleToPlayers } : e
    );
    onUpdateEntries(tabConfig.tabId, newEntries);
  };

  const handleMoveEntry = (entryId: string, direction: 'up' | 'down') => {
    const sortedAll = [...tabConfig.entries].sort((a, b) => a.order - b.order);
    const currentIndex = sortedAll.findIndex(e => e.id === entryId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newEntries = [...sortedAll];
      const temp = newEntries[currentIndex].order;
      newEntries[currentIndex].order = newEntries[currentIndex - 1].order;
      newEntries[currentIndex - 1].order = temp;
      onUpdateEntries(tabConfig.tabId, newEntries);
    } else if (direction === 'down' && currentIndex < sortedAll.length - 1) {
      const newEntries = [...sortedAll];
      const temp = newEntries[currentIndex].order;
      newEntries[currentIndex].order = newEntries[currentIndex + 1].order;
      newEntries[currentIndex + 1].order = temp;
      onUpdateEntries(tabConfig.tabId, newEntries);
    }
  };

  // Render entry header with tab-specific styling
  const renderEntryHeader = (entry: LoreEntry) => {
    // Special handling for people tab - show portrait
    if (tabConfig.tabId === 'people' && entry.portraitUrl) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${tabStyle.accentColor}`,
            flexShrink: 0,
          }}>
            <img 
              src={entry.portraitUrl} 
              alt={entry.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <span style={{
              color: 'var(--text-main, #fff)',
              fontWeight: 'bold',
              fontSize: '13px',
            }}>
              {entry.title}
            </span>
            <PeopleFields entry={entry} />
          </div>
        </div>
      );
    }

    // Special handling for rumors tab - italic styling
    if (tabConfig.tabId === 'rumors') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>💬</span>
          <span style={{
            color: 'var(--text-main, #fff)',
            fontWeight: 'bold',
            fontSize: '13px',
            fontStyle: 'italic',
          }}>
            "{entry.title}"
          </span>
        </div>
      );
    }

    // Default header
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          color: 'var(--text-main, #fff)',
          fontWeight: 'bold',
          fontSize: '13px',
        }}>
          {entry.title}
        </span>
        {/* Show inline specialized fields for certain types */}
        {['dangers', 'secrets', 'members', 'relationships'].includes(tabConfig.tabId) && (
          <SpecializedFields tabId={tabConfig.tabId} entry={entry} isGM={isGM} />
        )}
      </div>
    );
  };

  return (
    <div className="section" style={{ padding: '12px' }}>
      {/* Header with tab-specific styling */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `2px solid ${tabStyle.accentColor}40`,
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: tabStyle.accentColor,
          }}>
            <span>{tabStyle.icon}</span>
            {tabDef?.label || tabConfig.tabId}
          </h2>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted, #888)',
            marginTop: '2px',
          }}>
            {tabDef?.description}
          </div>
        </div>
        {isGM && (
          <button
            onClick={handleAddEntry}
            style={{
              background: tabStyle.accentColor,
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            + Add Entry
          </button>
        )}
      </div>

      {/* Entries List */}
      {sortedEntries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-muted, #888)',
          fontStyle: 'italic',
        }}>
          {isGM ? 'No entries yet. Click "+ Add Entry" to create one.' : 'No information available.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${entry.visibleToPlayers ? `${tabStyle.accentColor}40` : 'rgba(255, 100, 100, 0.3)'}`,
                borderRadius: '6px',
                overflow: 'hidden',
                borderLeft: `3px solid ${tabStyle.accentColor}`,
              }}
            >
              {/* Entry Header */}
              <div
                onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: expandedEntryId === entry.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                }}
              >
                <div style={{ flex: 1 }}>
                  {renderEntryHeader(entry)}
                  {isGM && !entry.visibleToPlayers && (
                    <span style={{
                      fontSize: '9px',
                      color: '#f66',
                      background: 'rgba(255, 100, 100, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      marginLeft: '8px',
                    }}>
                      HIDDEN
                    </span>
                  )}
                </div>
                <span style={{
                  color: 'var(--text-muted, #888)',
                  fontSize: '14px',
                  transform: expandedEntryId === entry.id ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  ▼
                </span>
              </div>

              {/* Entry Content (Expanded) */}
              {expandedEntryId === entry.id && (
                <div style={{
                  borderTop: `1px solid ${tabStyle.accentColor}40`,
                  padding: '12px',
                }}>
                  {/* Specialized fields at top (for certain tabs) */}
                  {['quests', 'history', 'services', 'menu', 'goals'].includes(tabConfig.tabId) && (
                    <div style={{ marginBottom: '8px' }}>
                      <SpecializedFields tabId={tabConfig.tabId} entry={entry} isGM={isGM} />
                    </div>
                  )}

                  {/* Rendered Markdown Content */}
                  <div
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: 'var(--text-main, #fff)',
                      fontStyle: tabConfig.tabId === 'rumors' ? 'italic' : 'normal',
                    }}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(entry.content) }}
                  />

                  {/* Attribution for rumors */}
                  {tabConfig.tabId === 'rumors' && <RumorFields entry={entry} />}

                  {/* GM Actions */}
                  {isGM && (
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px dashed ${tabStyle.accentColor}40`,
                      flexWrap: 'wrap',
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleVisibility(entry.id); }}
                        style={{
                          background: entry.visibleToPlayers ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                          border: `1px solid ${entry.visibleToPlayers ? '#0f0' : '#f00'}`,
                          color: entry.visibleToPlayers ? '#0f0' : '#f00',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        {entry.visibleToPlayers ? '👁 Visible' : '🚫 Hidden'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditEntry(entry); }}
                        style={{
                          background: '#333',
                          border: 'none',
                          color: '#888',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveEntry(entry.id, 'up'); }}
                        disabled={index === 0}
                        style={{
                          background: '#333',
                          border: 'none',
                          color: index === 0 ? '#555' : '#888',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveEntry(entry.id, 'down'); }}
                        disabled={index === sortedEntries.length - 1}
                        style={{
                          background: '#333',
                          border: 'none',
                          color: index === sortedEntries.length - 1 ? '#555' : '#888',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: index === sortedEntries.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                        style={{
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: '1px solid #f00',
                          color: '#f00',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Entry Editor Modal */}
      <LoreEntryEditor
        key={editingEntry?.id || 'new'}
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setEditingEntry(null); }}
        onSave={handleSaveEntry}
        entry={editingEntry}
        tabId={tabConfig.tabId}
      />
    </div>
  );
}
