import { useState } from 'react';
import type { LoreEntry, LoreTabConfig, LoreTabId } from '../../types';
import { LORE_TAB_DEFINITIONS } from '../../constants/lore';
import { LoreEntryEditor } from '../LoreEntryEditor';
import { parseMarkdown } from '../../utils/markdown';

interface LoreTabProps {
  tabConfig: LoreTabConfig;
  playerRole: string;
  onUpdateEntries: (tabId: LoreTabId, entries: LoreEntry[]) => void;
}

export function LoreTab({ tabConfig, playerRole, onUpdateEntries }: LoreTabProps) {
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const isGM = playerRole === 'GM';
  const tabDef = LORE_TAB_DEFINITIONS[tabConfig.tabId];

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

  return (
    <div className="section" style={{ padding: '12px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <div>
          <h2 style={{ margin: 0, border: 'none' }}>
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
              background: 'var(--accent-gold, #f0e130)',
              border: 'none',
              color: 'black',
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
                border: `1px solid ${entry.visibleToPlayers ? 'var(--border, #333)' : 'rgba(255, 100, 100, 0.3)'}`,
                borderRadius: '6px',
                overflow: 'hidden',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    color: 'var(--text-main, #fff)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}>
                    {entry.title}
                  </span>
                  {isGM && !entry.visibleToPlayers && (
                    <span style={{
                      fontSize: '9px',
                      color: '#f66',
                      background: 'rgba(255, 100, 100, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '3px',
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
                  borderTop: '1px solid var(--border, #333)',
                  padding: '12px',
                }}>
                  {/* Rendered Markdown Content */}
                  <div
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: 'var(--text-main, #fff)',
                    }}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(entry.content) }}
                  />

                  {/* GM Actions */}
                  {isGM && (
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px dashed var(--border, #333)',
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
      />
    </div>
  );
}
