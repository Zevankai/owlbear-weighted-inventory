import React from 'react';
import type { SkillProficiencyLevel } from '../types';

interface SkillProficiencyIndicatorProps {
  level: SkillProficiencyLevel;
  onChange: (newLevel: SkillProficiencyLevel) => void;
  canEdit: boolean;
  size?: number;
}

// Order of proficiency levels for cycling
const PROFICIENCY_ORDER: SkillProficiencyLevel[] = ['none', 'half', 'proficient', 'mastery'];

export const SkillProficiencyIndicator: React.FC<SkillProficiencyIndicatorProps> = ({
  level,
  onChange,
  canEdit,
  size = 14,
}) => {
  const handleClick = () => {
    if (!canEdit) return;
    const currentIndex = PROFICIENCY_ORDER.indexOf(level);
    const nextIndex = (currentIndex + 1) % PROFICIENCY_ORDER.length;
    onChange(PROFICIENCY_ORDER[nextIndex]);
  };

  // Get visual representation based on level
  const getIndicatorContent = () => {
    switch (level) {
      case 'none':
        // Hollow circle
        return (
          <div
            className="proficiency-indicator proficiency-none"
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              border: '2px solid var(--glass-border)',
              background: 'transparent',
            }}
          />
        );
      case 'half':
        // Half-filled circle
        return (
          <div
            className="proficiency-indicator proficiency-half"
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              border: '2px solid var(--accent-gold)',
              background: `linear-gradient(to right, var(--accent-gold) 50%, transparent 50%)`,
            }}
          />
        );
      case 'proficient':
        // Filled circle
        return (
          <div
            className="proficiency-indicator proficiency-full"
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              border: '2px solid var(--accent-gold)',
              background: 'var(--accent-gold)',
            }}
          />
        );
      case 'mastery':
        // Star shape (expertise)
        return (
          <div
            className="proficiency-indicator proficiency-mastery"
            style={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size,
              color: 'var(--accent-gold)',
              textShadow: '0 0 4px var(--accent-gold)',
            }}
          >
            ★
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    const labels: Record<SkillProficiencyLevel, string> = {
      none: 'No proficiency (click to cycle)',
      half: 'Half proficiency (click to cycle)',
      proficient: 'Proficient (click to cycle)',
      mastery: 'Expertise/Mastery (click to cycle)',
    };
    return labels[level];
  };

  return (
    <div
      onClick={handleClick}
      title={canEdit ? getTitle() : level}
      style={{
        cursor: canEdit ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (canEdit) {
          e.currentTarget.style.transform = 'scale(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {getIndicatorContent()}
    </div>
  );
};
