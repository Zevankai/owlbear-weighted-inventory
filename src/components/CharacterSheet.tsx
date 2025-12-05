import React from 'react';
import type { CharacterSheet, CharacterData, AbilityScores, Skills, SkillProficiency } from '../types';
import { DebouncedTextarea } from './DebouncedInput';
import { createDefaultCharacterSheet, calculateModifier, migrateSkillProficiency, getProficiencyContribution, calculateProficiencyBonus, SKILL_DEFINITIONS, ABILITY_ABBREV } from '../utils/characterSheet';
import { CollapsibleSection } from './CollapsibleSection';
import { SkillProficiencyIndicator } from './SkillProficiencyIndicator';

// Format modifier as "+X" or "-X"
const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : `${mod}`);

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

  const updateSkill = (skill: keyof Skills, updates: Partial<SkillProficiency>) => {
    const currentSkill = migrateSkillProficiency(sheet.skills[skill]);
    updateSheet({
      skills: {
        ...sheet.skills,
        [skill]: { ...currentSkill, ...updates },
      },
    });
  };

  // Pin/unpin skill handling
  const togglePinSkill = (skillKey: keyof Skills) => {
    const pinnedSkills = sheet.pinnedSkills || [];
    const isPinned = pinnedSkills.includes(skillKey);
    
    if (isPinned) {
      // Unpin
      updateSheet({
        pinnedSkills: pinnedSkills.filter(k => k !== skillKey),
      });
    } else {
      // Check if max pinned
      if (pinnedSkills.length >= 5) {
        alert('Maximum 5 skills can be pinned. Unpin a skill first.');
        return;
      }
      // Pin
      updateSheet({
        pinnedSkills: [...pinnedSkills, skillKey],
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                {SKILL_DEFINITIONS.map(({ key, name, ability }) => {
                  const skill = migrateSkillProficiency(sheet.skills[key]);
                  const isPinned = (sheet.pinnedSkills || []).includes(key);
                  const profBonus = sheet.proficiencyBonus || calculateProficiencyBonus(sheet.level || 1);
                  const abilityMod = calculateModifier(sheet.abilityScores[ability].base);
                  const profContribution = getProficiencyContribution(skill.proficiencyLevel, profBonus);
                  const totalBonus = abilityMod + profContribution + (skill.bonus || 0);
                  
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 6px',
                        background: isPinned ? 'rgba(240, 225, 48, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '4px',
                        border: isPinned ? '1px solid var(--border-bright)' : '1px solid transparent',
                      }}
                    >
                      {/* Pin Button */}
                      {canEdit && (
                        <button
                          onClick={() => togglePinSkill(key)}
                          title={isPinned ? 'Unpin skill' : 'Pin skill'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isPinned ? 'var(--accent-gold)' : '#555',
                            cursor: 'pointer',
                            fontSize: '10px',
                            padding: '0 2px',
                            flexShrink: 0,
                          }}
                        >
                          {isPinned ? '📌' : '📍'}
                        </button>
                      )}
                      {/* Proficiency Indicator */}
                      <SkillProficiencyIndicator
                        level={skill.proficiencyLevel}
                        onChange={(newLevel) => updateSkill(key, { proficiencyLevel: newLevel })}
                        canEdit={canEdit}
                        size={14}
                      />
                      {/* Bonus Input */}
                      <input
                        type="number"
                        value={skill.bonus}
                        onChange={(e) => canEdit && updateSkill(key, { bonus: parseInt(e.target.value) || 0 })}
                        className="search-input"
                        disabled={!canEdit}
                        title="Additional bonus (on top of ability + proficiency)"
                        style={{
                          width: '36px',
                          textAlign: 'center',
                          fontSize: '10px',
                          padding: '2px 2px',
                          margin: 0,
                        }}
                      />
                      {/* Total Bonus Display */}
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'var(--accent-gold)',
                        minWidth: '24px',
                        textAlign: 'center',
                      }}>
                        {totalBonus >= 0 ? `+${totalBonus}` : totalBonus}
                      </span>
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
                  );
                })}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}>
                ○ = None, ◐ = Half, ● = Proficient, ★ = Expertise/Mastery | 📌 = Pinned
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
        </div>
      );
    };

// Shared styles
const inputStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '6px 8px',
  width: '100%',
};
