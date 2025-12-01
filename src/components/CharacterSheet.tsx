import React, { useState } from 'react';
import type { CharacterSheet, CharacterData, AbilityScores, Skills, HitPoints } from '../types';
import { DebouncedInput, DebouncedTextarea } from './DebouncedInput';
import { createDefaultCharacterSheet, calculateModifier, DND_CONDITIONS } from '../utils/characterSheet';
import { CollapsibleSection } from './CollapsibleSection';

// Format modifier as "+X" or "-X"
const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : `${mod}`);

// Skill definitions with their associated abilities
const SKILL_DEFINITIONS: Array<{
  key: keyof Skills;
  name: string;
  ability: keyof AbilityScores;
}> = [
  // Strength
  { key: 'athletics', name: 'Athletics', ability: 'strength' },
  // Dexterity
  { key: 'acrobatics', name: 'Acrobatics', ability: 'dexterity' },
  { key: 'sleightOfHand', name: 'Sleight of Hand', ability: 'dexterity' },
  { key: 'stealth', name: 'Stealth', ability: 'dexterity' },
  // Intelligence
  { key: 'arcana', name: 'Arcana', ability: 'intelligence' },
  { key: 'history', name: 'History', ability: 'intelligence' },
  { key: 'investigation', name: 'Investigation', ability: 'intelligence' },
  { key: 'nature', name: 'Nature', ability: 'intelligence' },
  { key: 'religion', name: 'Religion', ability: 'intelligence' },
  // Wisdom
  { key: 'animalHandling', name: 'Animal Handling', ability: 'wisdom' },
  { key: 'insight', name: 'Insight', ability: 'wisdom' },
  { key: 'medicine', name: 'Medicine', ability: 'wisdom' },
  { key: 'perception', name: 'Perception', ability: 'wisdom' },
  { key: 'survival', name: 'Survival', ability: 'wisdom' },
  // Charisma
  { key: 'deception', name: 'Deception', ability: 'charisma' },
  { key: 'intimidation', name: 'Intimidation', ability: 'charisma' },
  { key: 'performance', name: 'Performance', ability: 'charisma' },
  { key: 'persuasion', name: 'Persuasion', ability: 'charisma' },
];

// Ability abbreviations
const ABILITY_ABBREV: Record<keyof AbilityScores, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

interface CharacterSheetSectionProps {
  characterData: CharacterData;
  canEdit: boolean;
  updateData: (updates: Partial<CharacterData>) => void;
}

export const CharacterSheetSection: React.FC<CharacterSheetSectionProps> = ({
  characterData,
  canEdit,
  updateData,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const sheet = characterData.characterSheet || createDefaultCharacterSheet();

  const updateSheet = (updates: Partial<CharacterSheet>) => {
    updateData({
      characterSheet: {
        ...sheet,
        ...updates,
      },
    });
  };

  const updateAbilityScore = (ability: keyof AbilityScores, base: number) => {
    const clampedBase = Math.max(1, Math.min(30, base));
    const modifier = calculateModifier(clampedBase);
    updateSheet({
      abilityScores: {
        ...sheet.abilityScores,
        [ability]: { base: clampedBase, modifier },
      },
    });
  };

  const updateSkill = (skill: keyof Skills, updates: Partial<{ proficient: boolean; bonus: number }>) => {
    updateSheet({
      skills: {
        ...sheet.skills,
        [skill]: { ...sheet.skills[skill], ...updates },
      },
    });
  };

  const updateHitPoints = (updates: Partial<HitPoints>) => {
    updateSheet({
      hitPoints: {
        ...sheet.hitPoints,
        ...updates,
      },
    });
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Collapsible Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px 12px',
          background: 'rgba(240, 225, 48, 0.08)',
          borderRadius: '6px',
          border: '1px solid var(--border-bright)',
          marginBottom: isExpanded ? '12px' : '0',
        }}
      >
        <span style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'var(--accent-gold)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          📜 Character Sheet
        </span>
        <span style={{ color: 'var(--accent-gold)', fontSize: '14px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Character Info Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Character Info
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}>
              <div>
                <label style={labelStyle}>Gender</label>
                <DebouncedInput
                  value={sheet.gender}
                  onChange={(val) => canEdit && updateSheet({ gender: val })}
                  className="search-input"
                  disabled={!canEdit}
                  placeholder="Gender..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Race</label>
                <DebouncedInput
                  value={sheet.race}
                  onChange={(val) => canEdit && updateSheet({ race: val })}
                  className="search-input"
                  disabled={!canEdit}
                  placeholder="Race..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Class</label>
                <DebouncedInput
                  value={sheet.characterClass}
                  onChange={(val) => canEdit && updateSheet({ characterClass: val })}
                  className="search-input"
                  disabled={!canEdit}
                  placeholder="Class..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Level</label>
                <input
                  type="number"
                  value={sheet.level}
                  onChange={(e) => canEdit && updateSheet({ level: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="search-input"
                  disabled={!canEdit}
                  min={1}
                  max={20}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Ability Scores Section - Collapsible */}
          <CollapsibleSection title="Ability Scores" defaultExpanded={false}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}>
                {(Object.keys(sheet.abilityScores) as Array<keyof AbilityScores>).map((ability) => (
                  <div
                    key={ability}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}>
                      {ABILITY_ABBREV[ability]}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'var(--accent-gold)',
                      marginBottom: '2px',
                    }}>
                      {formatModifier(sheet.abilityScores[ability].modifier)}
                    </div>
                    <input
                      type="number"
                      value={sheet.abilityScores[ability].base}
                      onChange={(e) => canEdit && updateAbilityScore(ability, parseInt(e.target.value) || 10)}
                      className="search-input"
                      disabled={!canEdit}
                      min={1}
                      max={30}
                      style={{
                        ...inputStyle,
                        textAlign: 'center',
                        fontSize: '12px',
                        padding: '4px',
                        width: '50px',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Combat Stats Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Combat Stats
            </h3>
            
            {/* Hit Points */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Hit Points</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: '8px' }}>Current</label>
                  <input
                    type="number"
                    value={sheet.hitPoints.current}
                    onChange={(e) => canEdit && updateHitPoints({ current: parseInt(e.target.value) || 0 })}
                    className="search-input"
                    disabled={!canEdit}
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
                <span style={{ color: 'var(--text-muted)', marginTop: '14px' }}>/</span>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: '8px' }}>Max</label>
                  <input
                    type="number"
                    value={sheet.hitPoints.max}
                    onChange={(e) => canEdit && updateHitPoints({ max: parseInt(e.target.value) || 0 })}
                    className="search-input"
                    disabled={!canEdit}
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
                <span style={{ color: 'var(--text-muted)', marginTop: '14px' }}>+</span>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: '8px' }}>Temp</label>
                  <input
                    type="number"
                    value={sheet.hitPoints.temp}
                    onChange={(e) => canEdit && updateHitPoints({ temp: parseInt(e.target.value) || 0 })}
                    className="search-input"
                    disabled={!canEdit}
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>

            {/* Other Combat Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}>
              <div>
                <label style={labelStyle}>AC</label>
                <input
                  type="number"
                  value={sheet.armorClass}
                  onChange={(e) => canEdit && updateSheet({ armorClass: parseInt(e.target.value) || 10 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Initiative</label>
                <input
                  type="number"
                  value={sheet.initiative}
                  onChange={(e) => canEdit && updateSheet({ initiative: parseInt(e.target.value) || 0 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Prof. Bonus</label>
                <input
                  type="number"
                  value={sheet.proficiencyBonus}
                  onChange={(e) => canEdit && updateSheet({ proficiencyBonus: parseInt(e.target.value) || 2 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Speed (ft)</label>
                <input
                  type="number"
                  value={sheet.speed}
                  onChange={(e) => canEdit && updateSheet({ speed: parseInt(e.target.value) || 30 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          {/* Passive Scores Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Passive Scores
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}>
              <div>
                <label style={labelStyle}>Perception</label>
                <input
                  type="number"
                  value={sheet.passivePerception}
                  onChange={(e) => canEdit && updateSheet({ passivePerception: parseInt(e.target.value) || 10 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Investigation</label>
                <input
                  type="number"
                  value={sheet.passiveInvestigation}
                  onChange={(e) => canEdit && updateSheet({ passiveInvestigation: parseInt(e.target.value) || 10 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Insight</label>
                <input
                  type="number"
                  value={sheet.passiveInsight}
                  onChange={(e) => canEdit && updateSheet({ passiveInsight: parseInt(e.target.value) || 10 })}
                  className="search-input"
                  disabled={!canEdit}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          {/* Heroic Inspiration */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: canEdit ? 'pointer' : 'default',
              }}
              onClick={() => canEdit && updateSheet({ heroicInspiration: !sheet.heroicInspiration })}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${sheet.heroicInspiration ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                  background: sheet.heroicInspiration ? 'var(--accent-gold)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                {sheet.heroicInspiration && (
                  <span style={{ color: '#000', fontSize: '14px' }}>✓</span>
                )}
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: sheet.heroicInspiration ? 'var(--accent-gold)' : 'var(--text-main)',
              }}>
                Heroic Inspiration
              </span>
            </label>
          </div>

          {/* Skills Section - Collapsible */}
          <CollapsibleSection title="Skills & Proficiencies" defaultExpanded={false}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
              }}>
                {SKILL_DEFINITIONS.map(({ key, name, ability }) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 6px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                    }}
                  >
                    {/* Proficiency Circle */}
                    <div
                      onClick={() => canEdit && updateSkill(key, { proficient: !sheet.skills[key].proficient })}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: `2px solid ${sheet.skills[key].proficient ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                        background: sheet.skills[key].proficient ? 'var(--accent-gold)' : 'transparent',
                        cursor: canEdit ? 'pointer' : 'default',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    />
                    {/* Bonus Input */}
                    <input
                      type="number"
                      value={sheet.skills[key].bonus}
                      onChange={(e) => canEdit && updateSkill(key, { bonus: parseInt(e.target.value) || 0 })}
                      className="search-input"
                      disabled={!canEdit}
                      style={{
                        width: '40px',
                        textAlign: 'center',
                        fontSize: '10px',
                        padding: '2px 4px',
                        margin: 0,
                      }}
                    />
                    {/* Skill Name & Ability */}
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-main)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {name} <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>({ABILITY_ABBREV[ability]})</span>
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}>
                Note: Intimidation can use STR or CHA (listed under CHA) - adjust bonus manually if using STR
              </div>
            </div>
          </CollapsibleSection>

          {/* Defenses Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Defenses & Immunities
            </h3>
            <DebouncedTextarea
              value={sheet.defenses}
              onChange={(val) => canEdit && updateSheet({ defenses: val })}
              className="search-input"
              disabled={!canEdit}
              placeholder="e.g., Immunity to Magical Sleep, Resistance to Poison..."
              rows={2}
              style={{
                width: '100%',
                resize: 'vertical',
                fontSize: '11px',
              }}
            />
          </div>

          {/* Conditions Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Active Conditions
            </h3>
            <DebouncedTextarea
              value={sheet.conditions}
              onChange={(val) => canEdit && updateSheet({ conditions: val })}
              className="search-input"
              disabled={!canEdit}
              placeholder="e.g., Poisoned, Exhaustion (1), Frightened..."
              rows={2}
              style={{
                width: '100%',
                resize: 'vertical',
                fontSize: '11px',
              }}
            />
            <div style={{
              marginTop: '6px',
              fontSize: '9px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              Common: {DND_CONDITIONS.join(', ')}
            </div>
          </div>

          {/* Languages Section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Known Languages
            </h3>
            <DebouncedTextarea
              value={sheet.languages}
              onChange={(val) => canEdit && updateSheet({ languages: val })}
              className="search-input"
              disabled={!canEdit}
              placeholder="e.g., Common, Elvish, Dwarvish..."
              rows={2}
              style={{
                width: '100%',
                resize: 'vertical',
                fontSize: '11px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Shared styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '9px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  marginBottom: '2px',
};

const inputStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '6px 8px',
  width: '100%',
};
