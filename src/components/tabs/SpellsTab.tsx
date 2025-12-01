import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CharacterData, Spell, SpellManagement } from '../../types';
import { DebouncedInput, DebouncedTextarea } from '../DebouncedInput';
import { createDefaultSpellManagement, getDefaultSpellSlots } from '../../utils/characterSheet';
import { CollapsibleSection } from '../CollapsibleSection';

interface SpellsTabProps {
  characterData: CharacterData;
  canEdit: boolean;
  updateData: (updates: Partial<CharacterData>) => void;
}

// Group spells by level
const groupSpellsByLevel = (spells: Spell[]): Record<number, Spell[]> => {
  const grouped: Record<number, Spell[]> = {};
  for (let i = 0; i <= 9; i++) {
    grouped[i] = [];
  }
  spells.forEach(spell => {
    const level = Math.max(0, Math.min(9, spell.level));
    grouped[level].push(spell);
  });
  return grouped;
};

const SPELL_LEVEL_NAMES: Record<number, string> = {
  0: 'Cantrips',
  1: '1st Level',
  2: '2nd Level',
  3: '3rd Level',
  4: '4th Level',
  5: '5th Level',
  6: '6th Level',
  7: '7th Level',
  8: '8th Level',
  9: '9th Level',
};

export const SpellsTab: React.FC<SpellsTabProps> = ({
  characterData,
  canEdit,
  updateData,
}) => {
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [newSpellLevel, setNewSpellLevel] = useState<number>(0);

  const sheet = characterData.characterSheet;
  if (!sheet) return null;

  const level = sheet.level || 1;
  const spellManagement = sheet.spellManagement || createDefaultSpellManagement(level);

  const updateSpellManagement = (updates: Partial<SpellManagement>) => {
    updateData({
      characterSheet: {
        ...sheet,
        spellManagement: {
          ...spellManagement,
          ...updates,
        },
      },
    });
  };

  // Toggle custom slots mode
  const toggleCustomSlots = () => {
    if (!spellManagement.useCustomSlots) {
      // Switching to custom: keep current values
      updateSpellManagement({ useCustomSlots: true });
    } else {
      // Switching back to auto: reset to defaults
      updateSpellManagement({
        useCustomSlots: false,
        spellSlots: getDefaultSpellSlots(level),
      });
    }
  };

  // Update slot max value
  const updateSlotMax = (spellLevel: number, max: number) => {
    const currentSlots = spellManagement.spellSlots[spellLevel] || { max: 0, used: 0 };
    updateSpellManagement({
      spellSlots: {
        ...spellManagement.spellSlots,
        [spellLevel]: {
          ...currentSlots,
          max: Math.max(0, max),
          used: Math.min(currentSlots.used, max),
        },
      },
    });
  };

  // Toggle slot used
  const toggleSlotUsed = (spellLevel: number, slotIndex: number) => {
    const slots = spellManagement.spellSlots[spellLevel] || { max: 0, used: 0 };
    const newUsed = slotIndex < slots.used ? slotIndex : slotIndex + 1;
    updateSpellManagement({
      spellSlots: {
        ...spellManagement.spellSlots,
        [spellLevel]: {
          ...slots,
          used: Math.max(0, Math.min(slots.max, newUsed)),
        },
      },
    });
  };

  // Add new spell
  const addSpell = () => {
    const newSpell: Spell = {
      id: uuidv4(),
      name: 'New Spell',
      level: newSpellLevel,
      description: '',
      prepared: false,
    };
    updateSpellManagement({
      knownSpells: [...spellManagement.knownSpells, newSpell],
    });
    setEditingSpellId(newSpell.id);
  };

  // Update spell
  const updateSpell = (spellId: string, updates: Partial<Spell>) => {
    updateSpellManagement({
      knownSpells: spellManagement.knownSpells.map(s =>
        s.id === spellId ? { ...s, ...updates } : s
      ),
    });
  };

  // Delete spell
  const deleteSpell = (spellId: string) => {
    if (window.confirm('Delete this spell?')) {
      updateSpellManagement({
        knownSpells: spellManagement.knownSpells.filter(s => s.id !== spellId),
      });
      if (editingSpellId === spellId) {
        setEditingSpellId(null);
      }
    }
  };

  // Toggle prepared status
  const togglePrepared = (spellId: string) => {
    const spell = spellManagement.knownSpells.find(s => s.id === spellId);
    if (spell) {
      updateSpell(spellId, { prepared: !spell.prepared });
    }
  };

  const groupedSpells = groupSpellsByLevel(spellManagement.knownSpells);

  // Render slot circles
  const renderSlotCircles = (spellLevel: number) => {
    const slots = spellManagement.spellSlots[spellLevel] || { max: 0, used: 0 };
    if (slots.max === 0) return null;

    return (
      <div className="spell-slot-circles">
        {Array.from({ length: slots.max }).map((_, idx) => (
          <div
            key={idx}
            className={`spell-slot-circle ${idx < slots.used ? 'used' : ''}`}
            onClick={() => canEdit && toggleSlotUsed(spellLevel, idx)}
            title={idx < slots.used ? 'Click to restore slot' : 'Click to use slot'}
            style={{
              cursor: canEdit ? 'pointer' : 'default',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="section spells-tab">
      <h2>Spells</h2>

      {/* Header with level and custom slots toggle */}
      <div className="spells-header">
        <div className="spell-level-display">
          <span className="spell-header-label">Character Level:</span>
          <span className="spell-header-value">{level}</span>
        </div>
        {canEdit && (
          <label className="custom-slots-toggle">
            <input
              type="checkbox"
              checked={spellManagement.useCustomSlots}
              onChange={toggleCustomSlots}
            />
            <span>Custom Slots</span>
          </label>
        )}
      </div>

      {/* Spell Slots Section */}
      <div className="spell-slots-section">
        <h3 className="spell-section-title">Spell Slots</h3>
        <div className="spell-slots-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(spellLevel => {
            const slots = spellManagement.spellSlots[spellLevel] || { max: 0, used: 0 };
            const hasSlots = slots.max > 0;

            return (
              <div
                key={spellLevel}
                className={`spell-slot-row ${hasSlots ? 'active' : 'inactive'}`}
              >
                <span className="spell-slot-level">{SPELL_LEVEL_NAMES[spellLevel]}</span>
                {spellManagement.useCustomSlots && canEdit ? (
                  <div className="spell-slot-max-edit">
                    <label>Max:</label>
                    <input
                      type="number"
                      value={slots.max}
                      onChange={(e) => updateSlotMax(spellLevel, parseInt(e.target.value) || 0)}
                      min={0}
                      max={10}
                      className="search-input spell-slot-input"
                    />
                  </div>
                ) : (
                  renderSlotCircles(spellLevel)
                )}
                {hasSlots && !spellManagement.useCustomSlots && (
                  <span className="spell-slot-count">{slots.used}/{slots.max}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prepared Spells Section */}
      <CollapsibleSection title="Prepared Spells" defaultExpanded={true}>
        <div className="prepared-spells-section">
          {spellManagement.knownSpells.filter(s => s.prepared).length === 0 ? (
            <p className="no-spells-message">No spells prepared. Toggle spells in your spellbook below.</p>
          ) : (
            <div className="prepared-spells-list">
              {spellManagement.knownSpells.filter(s => s.prepared).map(spell => (
                <div key={spell.id} className="prepared-spell-item">
                  <span className="prepared-spell-level">{spell.level === 0 ? 'C' : spell.level}</span>
                  <span className="prepared-spell-name">{spell.name}</span>
                  {canEdit && (
                    <button
                      className="unprepare-btn"
                      onClick={() => togglePrepared(spell.id)}
                      title="Unprepare spell"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Spellbook Section */}
      <CollapsibleSection title="Spellbook" defaultExpanded={false}>
        <div className="spellbook-section">
          {/* Add Spell Controls */}
          {canEdit && (
            <div className="add-spell-controls">
              <select
                value={newSpellLevel}
                onChange={(e) => setNewSpellLevel(parseInt(e.target.value))}
                className="search-input add-spell-level-select"
              >
                {Object.entries(SPELL_LEVEL_NAMES).map(([lvl, name]) => (
                  <option key={lvl} value={lvl}>{name}</option>
                ))}
              </select>
              <button onClick={addSpell} className="add-spell-btn">
                + Add Spell
              </button>
            </div>
          )}

          {/* Spells by Level */}
          {Object.entries(groupedSpells).map(([levelStr, spells]) => {
            const lvl = parseInt(levelStr);
            if (spells.length === 0) return null;

            return (
              <div key={lvl} className="spellbook-level-group">
                <h4 className="spellbook-level-header">{SPELL_LEVEL_NAMES[lvl]}</h4>
                <div className="spellbook-spell-list">
                  {spells.map(spell => (
                    <div key={spell.id} className="spellbook-spell-item">
                      {editingSpellId === spell.id ? (
                        <div className="spell-edit-form">
                          <div className="spell-edit-row">
                            <DebouncedInput
                              value={spell.name}
                              onChange={(val) => updateSpell(spell.id, { name: val })}
                              className="search-input spell-name-input"
                              placeholder="Spell name..."
                            />
                            <select
                              value={spell.level}
                              onChange={(e) => updateSpell(spell.id, { level: parseInt(e.target.value) })}
                              className="search-input spell-level-select"
                            >
                              {Object.entries(SPELL_LEVEL_NAMES).map(([lvl, name]) => (
                                <option key={lvl} value={lvl}>{name}</option>
                              ))}
                            </select>
                          </div>
                          <DebouncedTextarea
                            value={spell.description}
                            onChange={(val) => updateSpell(spell.id, { description: val })}
                            className="search-input spell-description-input"
                            placeholder="Spell description..."
                            rows={3}
                          />
                          <div className="spell-edit-actions">
                            <button
                              onClick={() => setEditingSpellId(null)}
                              className="spell-done-btn"
                            >
                              Done
                            </button>
                            <button
                              onClick={() => deleteSpell(spell.id)}
                              className="spell-delete-btn"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="spell-display">
                          <div
                            className={`spell-prepared-toggle ${spell.prepared ? 'prepared' : ''}`}
                            onClick={() => canEdit && togglePrepared(spell.id)}
                            title={spell.prepared ? 'Click to unprepare' : 'Click to prepare'}
                          >
                            {spell.prepared ? '◆' : '◇'}
                          </div>
                          <div className="spell-info" onClick={() => canEdit && setEditingSpellId(spell.id)}>
                            <span className="spell-name">{spell.name}</span>
                            {spell.description && (
                              <span className="spell-description-preview">
                                {spell.description.substring(0, 50)}{spell.description.length > 50 ? '...' : ''}
                              </span>
                            )}
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => setEditingSpellId(spell.id)}
                              className="spell-edit-btn"
                              title="Edit spell"
                            >
                              ✎
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
};
