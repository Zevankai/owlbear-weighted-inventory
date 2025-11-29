import { useState } from 'react';
import type { LoreEntry, LoreTabId } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface LoreEntryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LoreEntry) => void;
  entry?: LoreEntry | null;  // If editing an existing entry
  tabId?: LoreTabId;         // Tab type for specialized fields
}

// Define which fields are shown for each tab type
const TAB_FIELD_CONFIG: Record<LoreTabId, string[]> = {
  overview: [],
  history: ['date'],
  rumors: ['heardFrom'],
  quests: ['isCompleted', 'reward', 'difficulty'],
  people: ['portraitUrl', 'role', 'relationship'],
  government: [],
  geography: [],
  economy: [],
  culture: [],
  dangers: ['threatLevel'],
  services: ['price', 'availability'],
  menu: ['price', 'quantity', 'availability'],
  secrets: ['isRevealed'],
  properties: [],
  legends: [],
  members: ['rank'],
  goals: ['progress', 'priority'],
  resources: [],
  relationships: ['relationship'],
  images: ['imageUrl', 'caption'],
  notes: [],
};

export function LoreEntryEditor({ isOpen, onClose, onSave, entry, tabId }: LoreEntryEditorProps) {
  // Initialize state from entry props - parent uses key prop to remount when entry changes
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [visibleToPlayers, setVisibleToPlayers] = useState(entry?.visibleToPlayers ?? true);
  
  // Specialized fields state
  const [heardFrom, setHeardFrom] = useState(entry?.heardFrom || '');
  const [isCompleted, setIsCompleted] = useState(entry?.isCompleted ?? false);
  const [reward, setReward] = useState(entry?.reward || '');
  const [difficulty, setDifficulty] = useState<LoreEntry['difficulty']>(entry?.difficulty);
  const [portraitUrl, setPortraitUrl] = useState(entry?.portraitUrl || '');
  const [role, setRole] = useState(entry?.role || '');
  const [relationship, setRelationship] = useState<LoreEntry['relationship']>(entry?.relationship);
  const [date, setDate] = useState(entry?.date || '');
  const [threatLevel, setThreatLevel] = useState<LoreEntry['threatLevel']>(entry?.threatLevel);
  const [price, setPrice] = useState(entry?.price || '');
  const [availability, setAvailability] = useState<LoreEntry['availability']>(entry?.availability);
  const [quantity, setQuantity] = useState(entry?.quantity || '');
  const [isRevealed, setIsRevealed] = useState(entry?.isRevealed ?? false);
  const [rank, setRank] = useState(entry?.rank || '');
  const [progress, setProgress] = useState(entry?.progress ?? 0);
  const [priority, setPriority] = useState<LoreEntry['priority']>(entry?.priority);
  
  // Images tab fields
  const [imageUrl, setImageUrl] = useState(entry?.imageUrl || '');
  const [caption, setCaption] = useState(entry?.caption || '');

  const showField = (fieldName: string) => {
    if (!tabId) return false;
    return TAB_FIELD_CONFIG[tabId]?.includes(fieldName) ?? false;
  };

  const handleSave = () => {
    // For images tab, require imageUrl instead of title
    const isImagesTab = tabId === 'images';
    if (isImagesTab) {
      if (!imageUrl.trim()) return;
    } else {
      if (!title.trim()) return;
    }

    const savedEntry: LoreEntry = {
      id: entry?.id || uuidv4(),
      title: isImagesTab ? (caption || 'Image') : title.trim(),
      content: content,
      visibleToPlayers,
      createdAt: entry?.createdAt || new Date().toISOString(),
      order: entry?.order ?? 0,
      // Specialized fields (only include if shown and has value)
      ...(showField('heardFrom') && heardFrom ? { heardFrom } : {}),
      ...(showField('isCompleted') ? { isCompleted } : {}),
      ...(showField('reward') && reward ? { reward } : {}),
      ...(showField('difficulty') && difficulty ? { difficulty } : {}),
      ...(showField('portraitUrl') && portraitUrl ? { portraitUrl } : {}),
      ...(showField('role') && role ? { role } : {}),
      ...(showField('relationship') && relationship ? { relationship } : {}),
      ...(showField('date') && date ? { date } : {}),
      ...(showField('threatLevel') && threatLevel ? { threatLevel } : {}),
      ...(showField('price') && price ? { price } : {}),
      ...(showField('availability') && availability ? { availability } : {}),
      ...(showField('quantity') && quantity ? { quantity } : {}),
      ...(showField('isRevealed') ? { isRevealed } : {}),
      ...(showField('rank') && rank ? { rank } : {}),
      ...(showField('progress') ? { progress } : {}),
      ...(showField('priority') && priority ? { priority } : {}),
      ...(showField('imageUrl') && imageUrl ? { imageUrl } : {}),
      ...(showField('caption') && caption ? { caption } : {}),
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

        {/* Title Input - Hidden for images tab */}
        {tabId !== 'images' && (
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
        )}

        {/* === IMAGES TAB FIELDS === */}
        
        {/* Images: Image URL */}
        {showField('imageUrl') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9c27b0',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              🖼️ Image URL *
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="search-input"
              placeholder="https://example.com/image.jpg"
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
            {/* Image Preview */}
            {imageUrl && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                textAlign: 'center',
              }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '4px',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Images: Caption */}
        {showField('caption') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9c27b0',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="search-input"
              placeholder="Image caption or description..."
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* === SPECIALIZED FIELDS === */}
        
        {/* People: Portrait URL */}
        {showField('portraitUrl') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#2196f3',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              👤 Portrait URL
            </label>
            <input
              type="text"
              value={portraitUrl}
              onChange={(e) => setPortraitUrl(e.target.value)}
              className="search-input"
              placeholder="https://example.com/portrait.jpg"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* People: Role */}
        {showField('role') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#2196f3',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="search-input"
              placeholder="e.g., Blacksmith, Mayor, Guard Captain"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Relationship */}
        {showField('relationship') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#03a9f4',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              Relationship
            </label>
            <select
              value={relationship || ''}
              onChange={(e) => setRelationship(e.target.value as LoreEntry['relationship'] || undefined)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select --</option>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="enemy">Enemy</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        )}

        {/* Rumors: Heard From */}
        {showField('heardFrom') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#607d8b',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              💬 Heard From
            </label>
            <input
              type="text"
              value={heardFrom}
              onChange={(e) => setHeardFrom(e.target.value)}
              className="search-input"
              placeholder="e.g., A traveling merchant, Local gossip"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Quests: Difficulty */}
        {showField('difficulty') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#ff9800',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              ⚔️ Difficulty
            </label>
            <select
              value={difficulty || ''}
              onChange={(e) => setDifficulty(e.target.value as LoreEntry['difficulty'] || undefined)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select --</option>
              <option value="trivial">Trivial</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>
        )}

        {/* Quests: Reward */}
        {showField('reward') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#ff9800',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              🏆 Reward
            </label>
            <input
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="search-input"
              placeholder="e.g., 100 gold, Magic sword"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Quests: Completed */}
        {showField('isCompleted') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#ff9800',
            }}>
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
              />
              Quest Completed
            </label>
          </div>
        )}

        {/* History: Date */}
        {showField('date') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#795548',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              📅 Date / Era
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="search-input"
              placeholder="e.g., 1042 AR, The Third Age, 50 years ago"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Dangers: Threat Level */}
        {showField('threatLevel') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#f44336',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              ⚠️ Threat Level
            </label>
            <select
              value={threatLevel || ''}
              onChange={(e) => setThreatLevel(e.target.value as LoreEntry['threatLevel'] || undefined)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select --</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>
        )}

        {/* Services/Menu: Price */}
        {showField('price') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#ffc107',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              💰 Price
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="search-input"
              placeholder="e.g., 5 gp, 2 sp per night"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Menu: Quantity */}
        {showField('quantity') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#8bc34a',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              📦 Quantity / Stock
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="search-input"
              placeholder="e.g., In stock, Limited (3 left)"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Services/Menu: Availability */}
        {showField('availability') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#00bcd4',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              Availability
            </label>
            <select
              value={availability || ''}
              onChange={(e) => setAvailability(e.target.value as LoreEntry['availability'] || undefined)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select --</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        )}

        {/* Secrets: Revealed */}
        {showField('isRevealed') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#9e9e9e',
            }}>
              <input
                type="checkbox"
                checked={isRevealed}
                onChange={(e) => setIsRevealed(e.target.checked)}
              />
              🔓 Secret Revealed to Players
            </label>
          </div>
        )}

        {/* Members: Rank */}
        {showField('rank') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#009688',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              🎖️ Rank / Position
            </label>
            <input
              type="text"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="search-input"
              placeholder="e.g., Captain, Initiate, Council Member"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Goals: Priority */}
        {showField('priority') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#cddc39',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              Priority
            </label>
            <select
              value={priority || ''}
              onChange={(e) => setPriority(e.target.value as LoreEntry['priority'] || undefined)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select --</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        )}

        {/* Goals: Progress */}
        {showField('progress') && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#cddc39',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}>
              🎯 Progress ({progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Content Textarea - Optional for images tab */}
        {tabId !== 'images' && (
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
        )}

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
            disabled={tabId === 'images' ? !imageUrl.trim() : !title.trim()}
            style={{
              background: (tabId === 'images' ? imageUrl.trim() : title.trim()) ? 'var(--accent-gold, #f0e130)' : '#555',
              border: 'none',
              color: (tabId === 'images' ? imageUrl.trim() : title.trim()) ? 'black' : '#888',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: (tabId === 'images' ? imageUrl.trim() : title.trim()) ? 'pointer' : 'not-allowed',
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
