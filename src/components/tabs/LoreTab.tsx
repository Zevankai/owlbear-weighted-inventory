import { useState } from 'react';
import type { LoreEntry, LoreTabConfig, LoreTabId, LoreSettings } from '../../types';
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
  menu: { accentColor: '#8bc34a', icon: '📋' },
  secrets: { accentColor: '#9e9e9e', icon: '🔒' },
  properties: { accentColor: '#3f51b5', icon: '📊' },
  legends: { accentColor: '#ff5722', icon: '📖' },
  members: { accentColor: '#009688', icon: '👥' },
  goals: { accentColor: '#cddc39', icon: '🎯' },
  resources: { accentColor: '#ffeb3b', icon: '📦' },
  images: { accentColor: '#9c27b0', icon: '🖼️' },
  notes: { accentColor: '#607d8b', icon: '📝' },
};

interface LoreTabProps {
  tabConfig: LoreTabConfig;
  playerRole: string;
  onUpdateEntries: (tabId: LoreTabId, entries: LoreEntry[]) => void;
  loreSettings?: LoreSettings;
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
    case 'menu':
      return <ServiceMenuFields entry={entry} />;
    case 'secrets':
      return <SecretsFields entry={entry} isGM={isGM} />;
    case 'members':
      return <MembersFields entry={entry} />;
    case 'goals':
      return <GoalsFields entry={entry} />;
    default:
      return null;
  }
}

export function LoreTab({ tabConfig, playerRole, onUpdateEntries, loreSettings }: LoreTabProps) {
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  // Track which image entries have failed to load
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const isGM = playerRole === 'GM';
  // Determine if user can edit: GM always can, players can if allowPlayerEditing is enabled
  const canEdit = isGM || (loreSettings?.allowPlayerEditing ?? false);
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
        {['dangers', 'secrets', 'members'].includes(tabConfig.tabId) && (
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
        {canEdit && (
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
            {tabConfig.tabId === 'images' ? '+ Add Image' : '+ Add Entry'}
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
          {isGM ? (tabConfig.tabId === 'images' ? 'No images yet. Click "+ Add Image" to add one.' : 'No entries yet. Click "+ Add Entry" to create one.') : 'No information available.'}
        </div>
      ) : tabConfig.tabId === 'images' ? (
        /* === IMAGES GALLERY VIEW === */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          {sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${entry.visibleToPlayers ? `${tabStyle.accentColor}40` : 'rgba(255, 100, 100, 0.3)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Hidden indicator for GM */}
              {isGM && !entry.visibleToPlayers && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(255, 0, 0, 0.8)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  zIndex: 1,
                }}>
                  HIDDEN
                </div>
              )}
              
              {/* Image */}
              <div style={{
                width: '100%',
                aspectRatio: '16/10',
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {entry.imageUrl && !failedImageIds.has(entry.id) ? (
                  <img
                    src={entry.imageUrl}
                    alt={entry.caption || entry.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                    onError={() => {
                      setFailedImageIds(prev => new Set(prev).add(entry.id));
                    }}
                  />
                ) : (
                  <span style={{ color: '#888', fontSize: '11px' }}>
                    {entry.imageUrl ? 'Image failed to load' : 'No image URL'}
                  </span>
                )}
              </div>
              
              {/* Caption */}
              <div style={{
                padding: '8px',
                borderTop: `1px solid ${tabStyle.accentColor}20`,
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-main, #fff)',
                  marginBottom: isGM ? '8px' : '0',
                }}>
                  {entry.caption || entry.title || 'Untitled'}
                </div>
                
                {/* Actions - GM gets visibility toggle, canEdit gets edit/delete */}
                {canEdit && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                  }}>
                    {/* Visibility toggle - GM only */}
                    {isGM && (
                      <button
                        onClick={() => handleToggleVisibility(entry.id)}
                        style={{
                          background: entry.visibleToPlayers ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                          border: `1px solid ${entry.visibleToPlayers ? '#0f0' : '#f00'}`,
                          color: entry.visibleToPlayers ? '#0f0' : '#f00',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '9px',
                        }}
                        title={entry.visibleToPlayers ? 'Hide from players' : 'Show to players'}
                      >
                        {entry.visibleToPlayers ? '👁' : '🔒'}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditEntry(entry)}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: '#888',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleMoveEntry(entry.id, 'up')}
                      disabled={index === 0}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: index === 0 ? '#555' : '#888',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '9px',
                      }}
                      title="Move left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleMoveEntry(entry.id, 'down')}
                      disabled={index === sortedEntries.length - 1}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: index === sortedEntries.length - 1 ? '#555' : '#888',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: index === sortedEntries.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '9px',
                      }}
                      title="Move right"
                    >
                      →
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      style={{
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid #f00',
                        color: '#f00',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              
              {/* Expanded Image View (Lightbox) */}
              {expandedEntryId === entry.id && entry.imageUrl && (
                <div
                  onClick={() => setExpandedEntryId(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    cursor: 'pointer',
                    padding: '20px',
                  }}
                >
                  <img
                    src={entry.imageUrl}
                    alt={entry.caption || entry.title}
                    style={{
                      maxWidth: '90%',
                      maxHeight: '80%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {(entry.caption || entry.title) && (
                    <div style={{
                      marginTop: '12px',
                      color: 'var(--text-main, #fff)',
                      fontSize: '14px',
                      textAlign: 'center',
                    }}>
                      {entry.caption || entry.title}
                    </div>
                  )}
                  <div style={{
                    marginTop: '12px',
                    color: 'var(--text-muted, #888)',
                    fontSize: '11px',
                  }}>
                    Click anywhere to close
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : tabConfig.tabId === 'people' ? (
        /* === PEOPLE CARD VIEW === */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${entry.visibleToPlayers ? `${tabStyle.accentColor}40` : 'rgba(255, 100, 100, 0.3)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Hidden indicator for GM */}
              {isGM && !entry.visibleToPlayers && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(255, 0, 0, 0.8)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  zIndex: 1,
                }}>
                  HIDDEN
                </div>
              )}
              
              {/* Portrait Image - Large */}
              <div 
                onClick={() => entry.portraitUrl && setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                style={{
                  width: '100%',
                  height: '150px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: entry.portraitUrl ? 'pointer' : 'default',
                }}
              >
                {entry.portraitUrl ? (
                  <img
                    src={entry.portraitUrl}
                    alt={entry.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `${tabStyle.accentColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                  }}>
                    👤
                  </div>
                )}
              </div>
              
              {/* Person Info */}
              <div style={{
                padding: '12px',
                borderTop: `1px solid ${tabStyle.accentColor}20`,
              }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: 'var(--text-main, #fff)',
                  marginBottom: '4px',
                }}>
                  {entry.title}
                </div>
                
                {entry.role && (
                  <div style={{
                    fontSize: '11px',
                    color: tabStyle.accentColor,
                    fontStyle: 'italic',
                    marginBottom: '4px',
                  }}>
                    {entry.role}
                  </div>
                )}
                
                {entry.relationship && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: entry.relationship === 'ally' ? 'rgba(76, 175, 80, 0.2)' :
                               entry.relationship === 'enemy' ? 'rgba(244, 67, 54, 0.2)' :
                               entry.relationship === 'neutral' ? 'rgba(158, 158, 158, 0.2)' :
                               'rgba(96, 125, 139, 0.2)',
                    color: entry.relationship === 'ally' ? '#4caf50' :
                           entry.relationship === 'enemy' ? '#f44336' :
                           entry.relationship === 'neutral' ? '#9e9e9e' :
                           '#607d8b',
                  }}>
                    {entry.relationship.toUpperCase()}
                  </span>
                )}
                
                {/* Content preview (if exists) */}
                {entry.content && (
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted, #888)',
                    marginTop: '8px',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {entry.content.substring(0, 100)}{entry.content.length > 100 ? '...' : ''}
                  </div>
                )}
                
                {/* Actions - GM gets visibility toggle, canEdit gets edit/delete */}
                {canEdit && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: `1px dashed ${tabStyle.accentColor}30`,
                  }}>
                    {/* Visibility toggle - GM only */}
                    {isGM && (
                      <button
                        onClick={() => handleToggleVisibility(entry.id)}
                        style={{
                          background: entry.visibleToPlayers ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                          border: `1px solid ${entry.visibleToPlayers ? '#0f0' : '#f00'}`,
                          color: entry.visibleToPlayers ? '#0f0' : '#f00',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '9px',
                        }}
                        title={entry.visibleToPlayers ? 'Hide from players' : 'Show to players'}
                      >
                        {entry.visibleToPlayers ? '👁' : '🔒'}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditEntry(entry)}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: '#888',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleMoveEntry(entry.id, 'up')}
                      disabled={index === 0}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: index === 0 ? '#555' : '#888',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '9px',
                      }}
                      title="Move left"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleMoveEntry(entry.id, 'down')}
                      disabled={index === sortedEntries.length - 1}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: index === sortedEntries.length - 1 ? '#555' : '#888',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: index === sortedEntries.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '9px',
                      }}
                      title="Move right"
                    >
                      →
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      style={{
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid #f00',
                        color: '#f00',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              
              {/* Expanded View (Lightbox) for portrait */}
              {expandedEntryId === entry.id && entry.portraitUrl && (
                <div
                  onClick={() => setExpandedEntryId(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    cursor: 'pointer',
                    padding: '20px',
                  }}
                >
                  <img
                    src={entry.portraitUrl}
                    alt={entry.title}
                    style={{
                      maxWidth: '90%',
                      maxHeight: '70%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{
                    marginTop: '12px',
                    color: 'var(--text-main, #fff)',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                    {entry.title}
                  </div>
                  {entry.role && (
                    <div style={{
                      marginTop: '4px',
                      color: tabStyle.accentColor,
                      fontSize: '14px',
                      fontStyle: 'italic',
                    }}>
                      {entry.role}
                    </div>
                  )}
                  {entry.content && (
                    <div 
                      style={{
                        marginTop: '12px',
                        color: 'var(--text-main, #fff)',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        maxWidth: '600px',
                        textAlign: 'center',
                      }}
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(entry.content) }}
                    />
                  )}
                  <div style={{
                    marginTop: '16px',
                    color: 'var(--text-muted, #888)',
                    fontSize: '11px',
                  }}>
                    Click anywhere to close
                  </div>
                </div>
              )}
            </div>
          ))}
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
                  {['quests', 'history', 'menu', 'goals'].includes(tabConfig.tabId) && (
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

                  {/* Actions - GM gets visibility toggle, canEdit gets edit/delete */}
                  {canEdit && (
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px dashed ${tabStyle.accentColor}40`,
                      flexWrap: 'wrap',
                    }}>
                      {/* Visibility toggle - GM only */}
                      {isGM && (
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
                      )}
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
