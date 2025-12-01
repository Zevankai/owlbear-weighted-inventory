import React from 'react';
import type { CharacterSheet, SkillProficiencyLevel } from '../types';
import { calculateModifier, getProficiencyContribution, migrateSkillProficiency, calculateProficiencyBonus, SKILL_DEFINITIONS, ABILITY_ABBREV } from '../utils/characterSheet';

interface PinnedSkillsBarProps {
  sheet: CharacterSheet;
  onSkillClick?: () => void;
}

// Get proficiency icon
const getProficiencyIcon = (level: SkillProficiencyLevel): string => {
  switch (level) {
    case 'none': return '○';
    case 'half': return '◐';
    case 'proficient': return '●';
    case 'mastery': return '★';
    default: return '○';
  }
};

export const PinnedSkillsBar: React.FC<PinnedSkillsBarProps> = ({
  sheet,
  onSkillClick,
}) => {
  const pinnedSkills = sheet.pinnedSkills || [];
  
  if (pinnedSkills.length === 0) {
    return null;
  }

  // Calculate proficiency bonus
  const profBonus = sheet.proficiencyBonus || calculateProficiencyBonus(sheet.level || 1);

  return (
    <div className="pinned-skills-bar">
      {pinnedSkills.map((skillKey) => {
        const skillDef = SKILL_DEFINITIONS.find(s => s.key === skillKey);
        if (!skillDef) return null;

        const skill = sheet.skills[skillDef.key];
        if (!skill) return null;

        // Migrate old skill format if needed
        const migratedSkill = migrateSkillProficiency(skill);
        
        // Get ability score and calculate modifier
        const abilityScore = sheet.abilityScores[skillDef.ability];
        const abilityMod = abilityScore ? calculateModifier(abilityScore.base) : 0;
        
        // Calculate total bonus
        const profContribution = getProficiencyContribution(migratedSkill.proficiencyLevel, profBonus);
        const totalBonus = abilityMod + profContribution + (migratedSkill.bonus || 0);
        const bonusDisplay = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;

        return (
          <div
            key={skillKey}
            className="pinned-skill-item"
            onClick={() => onSkillClick?.()}
            title={`${skillDef.name} (${ABILITY_ABBREV[skillDef.ability]}): ${bonusDisplay}`}
          >
            <span className="pinned-skill-icon">
              {getProficiencyIcon(migratedSkill.proficiencyLevel)}
            </span>
            <span className="pinned-skill-name">{skillDef.abbrev}</span>
            <span className="pinned-skill-ability">{ABILITY_ABBREV[skillDef.ability]}</span>
            <span className="pinned-skill-bonus">{bonusDisplay}</span>
          </div>
        );
      })}
    </div>
  );
};
