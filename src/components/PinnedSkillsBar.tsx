import React from 'react';
import type { CharacterSheet, AbilityScores, Skills, SkillProficiencyLevel } from '../types';
import { calculateModifier, getProficiencyContribution, migrateSkillProficiency, calculateProficiencyBonus } from '../utils/characterSheet';

// Skill definitions with their associated abilities
const SKILL_DEFINITIONS: Array<{
  key: keyof Skills;
  name: string;
  abbrev: string;
  ability: keyof AbilityScores;
}> = [
  { key: 'athletics', name: 'Athletics', abbrev: 'ATH', ability: 'strength' },
  { key: 'acrobatics', name: 'Acrobatics', abbrev: 'ACR', ability: 'dexterity' },
  { key: 'sleightOfHand', name: 'Sleight of Hand', abbrev: 'SoH', ability: 'dexterity' },
  { key: 'stealth', name: 'Stealth', abbrev: 'STL', ability: 'dexterity' },
  { key: 'arcana', name: 'Arcana', abbrev: 'ARC', ability: 'intelligence' },
  { key: 'history', name: 'History', abbrev: 'HIS', ability: 'intelligence' },
  { key: 'investigation', name: 'Investigation', abbrev: 'INV', ability: 'intelligence' },
  { key: 'nature', name: 'Nature', abbrev: 'NAT', ability: 'intelligence' },
  { key: 'religion', name: 'Religion', abbrev: 'REL', ability: 'intelligence' },
  { key: 'animalHandling', name: 'Animal Handling', abbrev: 'ANH', ability: 'wisdom' },
  { key: 'insight', name: 'Insight', abbrev: 'INS', ability: 'wisdom' },
  { key: 'medicine', name: 'Medicine', abbrev: 'MED', ability: 'wisdom' },
  { key: 'perception', name: 'Perception', abbrev: 'PER', ability: 'wisdom' },
  { key: 'survival', name: 'Survival', abbrev: 'SUR', ability: 'wisdom' },
  { key: 'deception', name: 'Deception', abbrev: 'DEC', ability: 'charisma' },
  { key: 'intimidation', name: 'Intimidation', abbrev: 'INT', ability: 'charisma' },
  { key: 'performance', name: 'Performance', abbrev: 'PRF', ability: 'charisma' },
  { key: 'persuasion', name: 'Persuasion', abbrev: 'PRS', ability: 'charisma' },
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
