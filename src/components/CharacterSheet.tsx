import React from 'react';
import type { CharacterSheet, CharacterData, Skills, SkillProficiency } from '../types';
import { DebouncedTextarea } from './DebouncedInput';
import { createDefaultCharacterSheet, calculateModifier, migrateSkillProficiency, getProficiencyContribution, calculateProficiencyBonus, SKILL_DEFINITIONS, ABILITY_ABBREV } from '../utils/characterSheet';
import { SkillProficiencyIndicator } from './SkillProficiencyIndicator';

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
          {/* Skills Section - with single column layout for better fit */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
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
                      padding: '3px 6px',
                      background: isPinned ? 'rgba(240, 225, 48, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      border: isPinned ? '1px solid var(--border-bright)' : '1px solid transparent',
                      minWidth: 0,
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
                        flexShrink: 0,
                      }}
                    />
                    {/* Total Bonus Display */}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: 'var(--accent-gold)',
                      minWidth: '24px',
                      textAlign: 'center',
                      flexShrink: 0,
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
                      minWidth: 0,
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
