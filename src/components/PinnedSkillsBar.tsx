import type { CharacterSheet, SkillProficiencyLevel } from '../types';
import { calculateModifier, getProficiencyContribution, migrateSkillProficiency, calculateProficiencyBonus, SKILL_DEFINITIONS, ABILITY_ABBREV } from '../utils/characterSheet';

// Maximum number of pinned skills to display in a single line
const MAX_PINNED_SKILLS = 5;

interface PinnedSkillsBarProps {
  sheet: CharacterSheet;
  onSkillClick?: () => void;
  enlarged?: boolean;
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
  enlarged = false,
}: PinnedSkillsBarProps) => {
  const pinnedSkills = sheet.pinnedSkills || [];
  
  // Only show if there are pinned skills
  const hasPinnedSkills = pinnedSkills.length > 0;
  
  // Don't render if no pinned skills
  if (!hasPinnedSkills) return null;

  // Calculate proficiency bonus
  const profBonus = sheet.proficiencyBonus || calculateProficiencyBonus(sheet.level || 1);

  // Size scaling based on enlarged prop - reduced sizes for narrower appearance
  const iconSize = enlarged ? '10px' : '8px';
  const abbrevSize = enlarged ? '9px' : '8px';
  const bonusSize = enlarged ? '11px' : '9px';
  const padding = enlarged ? '4px 6px' : '4px 8px';
  const itemPadding = enlarged ? '3px 5px' : '2px 4px';
  const gap = enlarged ? '4px' : '4px';
  const itemGap = enlarged ? '3px' : '2px';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: padding,
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '6px',
      marginBottom: '8px',
      gap: gap,
      overflow: 'hidden',
      flexWrap: 'nowrap',
    }}>
      {/* Pinned Skills - single line, no wrapping */}
      {pinnedSkills.slice(0, MAX_PINNED_SKILLS).map((skillKey) => {
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
              gap: itemGap,
              padding: itemPadding,
              background: 'rgba(240, 225, 48, 0.08)',
              border: '1px solid rgba(240, 225, 48, 0.25)',
              borderRadius: enlarged ? '4px' : '3px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: iconSize, color: 'var(--accent-gold)' }}>
              {getProficiencyIcon(migratedSkill.proficiencyLevel)}
            </span>
            <span style={{ fontSize: abbrevSize, fontWeight: 'bold', color: 'var(--text-main)' }}>
              {skillDef.abbrev}
            </span>
            <span style={{ fontSize: bonusSize, fontWeight: 'bold', color: 'var(--accent-gold)' }}>
              {bonusDisplay}
            </span>
          </div>
        );
      })}
    </div>
  );
};
