import { useState } from 'react';
import type { CharacterData, Spell, SpellSlotLevels, SpellManagement } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { CollapsibleSection } from '../CollapsibleSection';

// Spell slot progression based on character level (D&D 5e Full Caster)
const SPELL_SLOT_PROGRESSION: Record<number, Partial<SpellSlotLevels>> = {
  1: { 1: 2 },
  2: { 1: 3 },
  3: { 1: 4, 2: 2 },
  4: { 1: 4, 2: 3 },
  5: { 1: 4, 2: 3, 3: 2 },
  6: { 1: 4, 2: 3, 3: 3 },
  7: { 1: 4, 2: 3, 3: 3, 4: 1 },
  8: { 1: 4, 2: 3, 3: 3, 4: 2 },
  9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

// Get default spell slots for a given level
function getDefaultSlotsForLevel(level: number): SpellSlotLevels {
  const defaultSlots: SpellSlotLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  const clampedLevel = Math.max(1, Math.min(20, level));
  const progression = SPELL_SLOT_PROGRESSION[clampedLevel] || {};
  return { ...defaultSlots, ...progression };
}

// Create default spell management object
function createDefaultSpellManagement(level: number = 1): SpellManagement {
  const defaultMax = getDefaultSlotsForLevel(level);
  return {
    spellSlots: {
      max: defaultMax,
      used: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      useCustomSlots: false,
    },
    knownSpells: [],
    preparedSpellIds: [],
  };
}

// Get spell level label
function getSpellLevelLabel(level: number): string {
  if (level === 0) return 'Cantrip';
  if (level === 1) return '1st Level';
  if (level === 2) return '2nd Level';
  if (level === 3) return '3rd Level';
  return `${level}th Level`;
}

interface SpellsTabProps {
  characterData: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
  canEdit: boolean;
}

export function SpellsTab({ characterData, updateData, canEdit }: SpellsTabProps) {
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [newSpell, setNewSpell] = useState<Partial<Spell>>({
    name: '',
    level: 0,
    description: '',
  });
  const [showAddSpell, setShowAddSpell] = useState(false);

  // Get character level from character sheet
  const characterLevel = characterData.characterSheet?.level || 1;

  // Initialize spell management if not present
  const spellMgmt = characterData.characterSheet?.spellManagement || createDefaultSpellManagement(characterLevel);

  // Get effective max slots (either custom or auto-calculated)
  const getEffectiveMaxSlots = (): SpellSlotLevels => {
    if (spellMgmt.spellSlots.useCustomSlots) {
      return spellMgmt.spellSlots.max;
    }
    return getDefaultSlotsForLevel(characterLevel);
  };

  const effectiveMaxSlots = getEffectiveMaxSlots();

  // Update spell management in character data
  const updateSpellManagement = (updates: Partial<SpellManagement>) => {
    const currentSheet = characterData.characterSheet || {
      gender: '',
      race: '',
      characterClass: '',
      level: 1,
      abilityScores: {
        strength: { base: 10, modifier: 0 },
        dexterity: { base: 10, modifier: 0 },
        constitution: { base: 10, modifier: 0 },
        intelligence: { base: 10, modifier: 0 },
        wisdom: { base: 10, modifier: 0 },
        charisma: { base: 10, modifier: 0 },
      },
      skills: {
        athletics: { proficient: false, bonus: 0 },
        acrobatics: { proficient: false, bonus: 0 },
        sleightOfHand: { proficient: false, bonus: 0 },
        stealth: { proficient: false, bonus: 0 },
        arcana: { proficient: false, bonus: 0 },
        history: { proficient: false, bonus: 0 },
        investigation: { proficient: false, bonus: 0 },
        nature: { proficient: false, bonus: 0 },
        religion: { proficient: false, bonus: 0 },
        animalHandling: { proficient: false, bonus: 0 },
        insight: { proficient: false, bonus: 0 },
        medicine: { proficient: false, bonus: 0 },
        perception: { proficient: false, bonus: 0 },
        survival: { proficient: false, bonus: 0 },
        deception: { proficient: false, bonus: 0 },
        intimidation: { proficient: false, bonus: 0 },
        performance: { proficient: false, bonus: 0 },
        persuasion: { proficient: false, bonus: 0 },
      },
      hitPoints: { current: 10, max: 10, temp: 0 },
      armorClass: 10,
      initiative: 0,
      proficiencyBonus: 2,
      speed: 30,
      passivePerception: 10,
      passiveInvestigation: 10,
      passiveInsight: 10,
      heroicInspiration: false,
      defenses: '',
      conditions: '',
      languages: '',
    };

    updateData({
      characterSheet: {
        ...currentSheet,
        spellManagement: {
          ...spellMgmt,
          ...updates,
        },
      },
    });
  };

  // Toggle a spell slot used/available
  const toggleSlotUsed = (level: keyof SpellSlotLevels, slotIndex: number) => {
    if (!canEdit) return;
    const currentUsed = spellMgmt.spellSlots.used[level];
    const maxSlots = effectiveMaxSlots[level];
    
    // If clicking on a used slot (slotIndex < currentUsed), restore it
    // If clicking on an available slot, use it
    let newUsed: number;
    if (slotIndex < currentUsed) {
      // Restore this slot (set used to slotIndex)
      newUsed = slotIndex;
    } else {
      // Use this slot (set used to slotIndex + 1)
      newUsed = Math.min(slotIndex + 1, maxSlots);
    }

    updateSpellManagement({
      spellSlots: {
        ...spellMgmt.spellSlots,
        used: {
          ...spellMgmt.spellSlots.used,
          [level]: newUsed,
        },
      },
    });
  };

  // Update custom max slot value
  const updateMaxSlot = (level: keyof SpellSlotLevels, value: number) => {
    if (!canEdit) return;
    updateSpellManagement({
      spellSlots: {
        ...spellMgmt.spellSlots,
        max: {
          ...spellMgmt.spellSlots.max,
          [level]: Math.max(0, Math.min(9, value)),
        },
        // Also ensure used doesn't exceed new max
        used: {
          ...spellMgmt.spellSlots.used,
          [level]: Math.min(spellMgmt.spellSlots.used[level], Math.max(0, value)),
        },
      },
    });
  };

  // Toggle custom slots mode
  const toggleCustomSlots = () => {
    if (!canEdit) return;
    updateSpellManagement({
      spellSlots: {
        ...spellMgmt.spellSlots,
        useCustomSlots: !spellMgmt.spellSlots.useCustomSlots,
        // If switching to custom, copy current effective max to custom
        max: !spellMgmt.spellSlots.useCustomSlots ? effectiveMaxSlots : spellMgmt.spellSlots.max,
      },
    });
  };

  // Reset all spell slots
  const resetAllSlots = () => {
    if (!canEdit) return;
    updateSpellManagement({
      spellSlots: {
        ...spellMgmt.spellSlots,
        used: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      },
    });
  };

  // Add a new spell
  const handleAddSpell = () => {
    if (!newSpell.name?.trim()) return;
    
    const spell: Spell = {
      id: uuidv4(),
      name: newSpell.name.trim(),
      level: newSpell.level || 0,
      description: newSpell.description || '',
    };

    updateSpellManagement({
      knownSpells: [...spellMgmt.knownSpells, spell],
    });

    setNewSpell({ name: '', level: 0, description: '' });
    setShowAddSpell(false);
  };

  // Update an existing spell
  const handleUpdateSpell = (spellId: string, updates: Partial<Spell>) => {
    if (!canEdit) return;
    updateSpellManagement({
      knownSpells: spellMgmt.knownSpells.map(s =>
        s.id === spellId ? { ...s, ...updates } : s
      ),
    });
  };

  // Delete a spell
  const handleDeleteSpell = (spellId: string) => {
    if (!canEdit) return;
    if (!window.confirm('Delete this spell from your spellbook?')) return;
    
    updateSpellManagement({
      knownSpells: spellMgmt.knownSpells.filter(s => s.id !== spellId),
      preparedSpellIds: spellMgmt.preparedSpellIds.filter(id => id !== spellId),
    });
  };

  // Toggle spell prepared status
  const toggleSpellPrepared = (spellId: string) => {
    if (!canEdit) return;
    const isPrepared = spellMgmt.preparedSpellIds.includes(spellId);
    
    updateSpellManagement({
      preparedSpellIds: isPrepared
        ? spellMgmt.preparedSpellIds.filter(id => id !== spellId)
        : [...spellMgmt.preparedSpellIds, spellId],
    });
  };

  // Group spells by level
  const spellsByLevel: Record<number, Spell[]> = {};
  for (let i = 0; i <= 9; i++) {
    spellsByLevel[i] = spellMgmt.knownSpells.filter(s => s.level === i);
  }

  // Render spell slot circles for a level
  const renderSlotCircles = (level: keyof SpellSlotLevels) => {
    const maxSlots = effectiveMaxSlots[level];
    const usedSlots = spellMgmt.spellSlots.used[level];
    
    if (maxSlots === 0) return null;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: 'var(--accent-gold)',
          minWidth: '80px'
        }}>
          {getSpellLevelLabel(level)}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const isUsed = idx < usedSlots;
            return (
              <button
                key={idx}
                onClick={() => toggleSlotUsed(level, idx)}
                disabled={!canEdit}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent-gold)',
                  background: isUsed ? 'var(--accent-gold)' : 'transparent',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  opacity: canEdit ? 1 : 0.6,
                }}
                title={isUsed ? 'Click to restore slot' : 'Click to use slot'}
              />
            );
          })}
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {maxSlots - usedSlots}/{maxSlots}
        </span>
        {spellMgmt.spellSlots.useCustomSlots && canEdit && (
          <input
            type="number"
            min="0"
            max="9"
            value={spellMgmt.spellSlots.max[level]}
            onChange={(e) => updateMaxSlot(level, parseInt(e.target.value) || 0)}
            style={{
              width: '40px',
              padding: '2px 4px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              color: 'white',
              fontSize: '11px',
              textAlign: 'center',
            }}
            title="Max slots"
          />
        )}
      </div>
    );
  };

  return (
    <div className="section">
      <h2>🔮 Spells</h2>

      {/* Spell Slots Section */}
      <CollapsibleSection title="Spell Slots" defaultExpanded={true}>
        <div style={{ marginBottom: '12px' }}>
          {/* Custom Slots Toggle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border)'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: canEdit ? 'pointer' : 'default',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <input
                type="checkbox"
                checked={spellMgmt.spellSlots.useCustomSlots}
                onChange={toggleCustomSlots}
                disabled={!canEdit}
              />
              Use Custom Slot Counts
            </label>
            <button
              onClick={resetAllSlots}
              disabled={!canEdit}
              style={{
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '10px',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.5,
              }}
            >
              Reset All
            </button>
          </div>

          {/* Spell Slot Circles */}
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map(level => renderSlotCircles(level))}
          
          {effectiveMaxSlots[1] === 0 && effectiveMaxSlots[2] === 0 && (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontStyle: 'italic',
            }}>
              No spell slots available at level {characterLevel}.
              {canEdit && ' Enable "Use Custom Slot Counts" to override.'}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Prepared Spells Section */}
      <CollapsibleSection title="Prepared Spells" defaultExpanded={true}>
        <div style={{ marginBottom: '12px' }}>
          {spellMgmt.preparedSpellIds.length === 0 ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontStyle: 'italic',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '4px',
              border: '1px dashed var(--border)'
            }}>
              No spells prepared. Add spells to your spellbook and mark them as prepared.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {spellMgmt.preparedSpellIds.map(spellId => {
                const spell = spellMgmt.knownSpells.find(s => s.id === spellId);
                if (!spell) return null;
                return (
                  <div
                    key={spellId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: 'rgba(147, 112, 219, 0.1)',
                      border: '1px solid rgba(147, 112, 219, 0.3)',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{
                      fontSize: '10px',
                      color: '#9370db',
                      fontWeight: 'bold',
                      minWidth: '50px'
                    }}>
                      {spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`}
                    </span>
                    <span style={{ flex: 1, fontWeight: 'bold', color: 'var(--text-main)' }}>
                      {spell.name}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => toggleSpellPrepared(spellId)}
                        style={{
                          padding: '2px 8px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid var(--border)',
                          borderRadius: '3px',
                          color: 'var(--text-muted)',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Unprepare
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Spellbook Section */}
      <CollapsibleSection title="Spellbook" defaultExpanded={true}>
        <div>
          {/* Add Spell Button */}
          {canEdit && !showAddSpell && (
            <button
              onClick={() => setShowAddSpell(true)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '12px',
                background: 'rgba(147, 112, 219, 0.1)',
                border: '1px solid rgba(147, 112, 219, 0.4)',
                borderRadius: '4px',
                color: '#9370db',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              + Add Spell
            </button>
          )}

          {/* Add Spell Form */}
          {showAddSpell && canEdit && (
            <div style={{
              padding: '12px',
              marginBottom: '12px',
              background: 'rgba(147, 112, 219, 0.05)',
              border: '1px solid rgba(147, 112, 219, 0.3)',
              borderRadius: '4px',
            }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Spell Name
                </label>
                <input
                  type="text"
                  value={newSpell.name || ''}
                  onChange={(e) => setNewSpell({ ...newSpell, name: e.target.value })}
                  placeholder="e.g. Fireball"
                  className="search-input"
                  style={{ marginTop: 0 }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Spell Level
                </label>
                <select
                  value={newSpell.level || 0}
                  onChange={(e) => setNewSpell({ ...newSpell, level: parseInt(e.target.value) })}
                  className="search-input"
                  style={{ marginTop: 0 }}
                >
                  <option value={0}>Cantrip</option>
                  <option value={1}>1st Level</option>
                  <option value={2}>2nd Level</option>
                  <option value={3}>3rd Level</option>
                  <option value={4}>4th Level</option>
                  <option value={5}>5th Level</option>
                  <option value={6}>6th Level</option>
                  <option value={7}>7th Level</option>
                  <option value={8}>8th Level</option>
                  <option value={9}>9th Level</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={newSpell.description || ''}
                  onChange={(e) => setNewSpell({ ...newSpell, description: e.target.value })}
                  placeholder="Range, components, effects..."
                  className="search-input"
                  rows={3}
                  style={{ marginTop: 0, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddSpell}
                  disabled={!newSpell.name?.trim()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: newSpell.name?.trim() ? '#9370db' : 'rgba(147, 112, 219, 0.3)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: newSpell.name?.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  Add Spell
                </button>
                <button
                  onClick={() => {
                    setShowAddSpell(false);
                    setNewSpell({ name: '', level: 0, description: '' });
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Spells List by Level */}
          {spellMgmt.knownSpells.length === 0 && !showAddSpell ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontStyle: 'italic',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '4px',
              border: '1px dashed var(--border)'
            }}>
              Your spellbook is empty. {canEdit && 'Click "Add Spell" to add your first spell.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                const spells = spellsByLevel[level];
                if (spells.length === 0) return null;
                
                return (
                  <div key={level}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#9370db',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '8px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(147, 112, 219, 0.3)'
                    }}>
                      {getSpellLevelLabel(level)} ({spells.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {spells.map(spell => {
                        const isPrepared = spellMgmt.preparedSpellIds.includes(spell.id);
                        const isEditing = editingSpellId === spell.id;
                        
                        return (
                          <div
                            key={spell.id}
                            style={{
                              padding: '10px',
                              background: isPrepared 
                                ? 'rgba(147, 112, 219, 0.1)' 
                                : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isPrepared ? 'rgba(147, 112, 219, 0.4)' : 'var(--border)'}`,
                              borderRadius: '4px',
                            }}
                          >
                            {isEditing && canEdit ? (
                              // Edit mode
                              <div>
                                <input
                                  type="text"
                                  value={spell.name}
                                  onChange={(e) => handleUpdateSpell(spell.id, { name: e.target.value })}
                                  className="search-input"
                                  style={{ marginTop: 0, marginBottom: '8px' }}
                                />
                                <textarea
                                  value={spell.description}
                                  onChange={(e) => handleUpdateSpell(spell.id, { description: e.target.value })}
                                  className="search-input"
                                  rows={3}
                                  style={{ marginTop: 0, marginBottom: '8px', resize: 'vertical' }}
                                />
                                <button
                                  onClick={() => setEditingSpellId(null)}
                                  style={{
                                    padding: '4px 12px',
                                    background: 'var(--accent-gold)',
                                    border: 'none',
                                    borderRadius: '3px',
                                    color: 'black',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              // View mode
                              <div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'flex-start',
                                  marginBottom: spell.description ? '6px' : 0
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <span style={{ 
                                      fontWeight: 'bold', 
                                      color: 'var(--text-main)',
                                      fontSize: '13px'
                                    }}>
                                      {spell.name}
                                    </span>
                                    {isPrepared && (
                                      <span style={{
                                        marginLeft: '8px',
                                        fontSize: '9px',
                                        color: '#9370db',
                                        fontWeight: 'bold',
                                      }}>
                                        ✓ PREPARED
                                      </span>
                                    )}
                                  </div>
                                  {canEdit && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button
                                        onClick={() => toggleSpellPrepared(spell.id)}
                                        style={{
                                          padding: '2px 6px',
                                          background: isPrepared 
                                            ? 'rgba(147, 112, 219, 0.3)'
                                            : 'rgba(255,255,255,0.1)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '3px',
                                          color: isPrepared ? '#9370db' : 'var(--text-muted)',
                                          cursor: 'pointer',
                                          fontSize: '9px',
                                        }}
                                        title={isPrepared ? 'Unprepare' : 'Prepare'}
                                      >
                                        {isPrepared ? '★' : '☆'}
                                      </button>
                                      <button
                                        onClick={() => setEditingSpellId(spell.id)}
                                        style={{
                                          padding: '2px 6px',
                                          background: 'rgba(255,255,255,0.1)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '3px',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer',
                                          fontSize: '9px',
                                        }}
                                        title="Edit"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSpell(spell.id)}
                                        style={{
                                          padding: '2px 6px',
                                          background: 'rgba(255,0,0,0.1)',
                                          border: '1px solid rgba(255,0,0,0.3)',
                                          borderRadius: '3px',
                                          color: 'var(--danger)',
                                          cursor: 'pointer',
                                          fontSize: '9px',
                                        }}
                                        title="Delete"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {spell.description && (
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    lineHeight: '1.4',
                                  }}>
                                    {spell.description}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
