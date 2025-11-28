import { useState } from 'react';
import type { LoreEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface LoreEntryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LoreEntry) => void;
  entry?: LoreEntry | null;  // If editing an existing entry
}

export function LoreEntryEditor({ isOpen, onClose, onSave, entry }: LoreEntryEditorProps) {
  // Initialize state from entry props - parent uses key prop to remount when entry changes
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [visibleToPlayers, setVisibleToPlayers] = useState(entry?.visibleToPlayers ?? true);

  const handleSave = () => {
    if (!title.trim()) return;

    const savedEntry: LoreEntry = {
      id: entry?.id || uuidv4(),
      title: title.trim(),
      content: content,
      visibleToPlayers,
      createdAt: entry?.createdAt || new Date().toISOString(),
      order: entry?.order ?? 0,
    };

    onSave(savedEntry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-dark, #1a1a2e)',
        border: '1px solid var(--border, #333)',
        borderRadius: '8px',
        padding: '20px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h2 style={{
            margin: 0,
            color: 'var(--accent-gold, #f0e130)',
            fontSize: '16px',
          }}>
            {entry ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>

        {/* Title Input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: 'var(--text-muted, #888)',
            marginBottom: '4px',
            textTransform: 'uppercase',
          }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="search-input"
            placeholder="Entry title..."
            style={{ width: '100%', boxSizing: 'border-box' }}
            autoFocus
          />
        </div>

        {/* Content Textarea */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: 'var(--text-muted, #888)',
            marginBottom: '4px',
            textTransform: 'uppercase',
          }}>
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="search-input"
            placeholder="Enter content here... (Supports basic markdown: **bold**, *italic*, __underline__, ~~strikethrough~~, - lists)"
            rows={8}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: '120px',
            }}
          />
          <div style={{
            fontSize: '9px',
            color: 'var(--text-muted, #888)',
            marginTop: '4px',
          }}>
            Supports: **bold**, *italic*, __underline__, ~~strikethrough~~, - bullet lists, 1. numbered lists
          </div>
        </div>

        {/* Visibility Checkbox */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--text-main, #fff)',
          }}>
            <input
              type="checkbox"
              checked={visibleToPlayers}
              onChange={(e) => setVisibleToPlayers(e.target.checked)}
            />
            Visible to Players
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#333',
              border: 'none',
              color: '#888',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              background: title.trim() ? 'var(--accent-gold, #f0e130)' : '#555',
              border: 'none',
              color: title.trim() ? 'black' : '#888',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
