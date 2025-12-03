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
  
  // Always show the bar if there are pinned skills or to show passive scores
  // Show passive scores when there are no pinned skills as well
  const hasPinnedSkills = pinnedSkills.length > 0;

  // Calculate proficiency bonus
  const profBonus = sheet.proficiencyBonus || calculateProficiencyBonus(sheet.level || 1);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '6px',
      marginBottom: '8px',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* Pinned Skills */}
      {hasPinnedSkills && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📌</span>
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
                <span className="pinned-skill-bonus">{bonusDisplay}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Passive Scores */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        color: 'var(--text-muted)',
        fontSize: '10px',
        marginLeft: hasPinnedSkills ? 'auto' : '0'
      }}>
        <span style={{ opacity: 0.7 }}>👁</span>
        <span title="Passive Perception">Per <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{sheet.passivePerception}</span></span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span title="Passive Investigation">Inv <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{sheet.passiveInvestigation}</span></span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span title="Passive Insight">Ins <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{sheet.passiveInsight}</span></span>
      </div>
    </div>
  );
};
