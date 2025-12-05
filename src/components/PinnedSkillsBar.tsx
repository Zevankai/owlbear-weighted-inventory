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

export const PinnedSkillsBar = ({
  sheet,
  onSkillClick,
}: PinnedSkillsBarProps) => {
  const pinnedSkills = sheet.pinnedSkills || [];
  
  // Only show if there are pinned skills
  const hasPinnedSkills = pinnedSkills.length > 0;
  
  // Don't render if no pinned skills
  if (!hasPinnedSkills) return null;

  // Calculate proficiency bonus
  const profBonus = sheet.proficiencyBonus || calculateProficiencyBonus(sheet.level || 1);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: '4px 8px',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '6px',
      marginBottom: '8px',
      gap: '4px',
      overflow: 'hidden',
      flexWrap: 'nowrap',
    }}>
      {/* Pinned Skills - single line, no wrapping */}
      <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>📌</span>
      {pinnedSkills.slice(0, 5).map((skillKey) => {
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
            onClick={() => onSkillClick?.()}
            title={`${skillDef.name} (${ABILITY_ABBREV[skillDef.ability]}): ${bonusDisplay}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 4px',
              background: 'rgba(240, 225, 48, 0.08)',
              border: '1px solid rgba(240, 225, 48, 0.25)',
              borderRadius: '3px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '8px', color: 'var(--accent-gold)' }}>
              {getProficiencyIcon(migratedSkill.proficiencyLevel)}
            </span>
            <span style={{ fontSize: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>
              {skillDef.abbrev}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
              {bonusDisplay}
            </span>
          </div>
        );
      })}
    </div>
  );
};
