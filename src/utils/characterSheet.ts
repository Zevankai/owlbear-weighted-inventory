import type { CharacterSheet, SkillProficiency, SkillProficiencyLevel, SpellManagement, SpellSlots } from '../types';

// Default skill proficiency
const createDefaultSkillProficiency = (): SkillProficiency => ({
  proficiencyLevel: 'none',
  bonus: 0,
});

// Default character sheet values
export const createDefaultCharacterSheet = (): CharacterSheet => ({
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
    athletics: createDefaultSkillProficiency(),
    acrobatics: createDefaultSkillProficiency(),
    sleightOfHand: createDefaultSkillProficiency(),
    stealth: createDefaultSkillProficiency(),
    arcana: createDefaultSkillProficiency(),
    history: createDefaultSkillProficiency(),
    investigation: createDefaultSkillProficiency(),
    nature: createDefaultSkillProficiency(),
    religion: createDefaultSkillProficiency(),
    animalHandling: createDefaultSkillProficiency(),
    insight: createDefaultSkillProficiency(),
    medicine: createDefaultSkillProficiency(),
    perception: createDefaultSkillProficiency(),
    survival: createDefaultSkillProficiency(),
    deception: createDefaultSkillProficiency(),
    intimidation: createDefaultSkillProficiency(),
    performance: createDefaultSkillProficiency(),
    persuasion: createDefaultSkillProficiency(),
  },
  pinnedSkills: [],
  hitPoints: { current: 0, max: 0, temp: 0 },
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
});

// Calculate ability modifier using D&D formula
export const calculateModifier = (score: number): number => Math.floor((score - 10) / 2);

// Calculate proficiency bonus based on level
export const calculateProficiencyBonus = (level: number): number => Math.floor((level - 1) / 4) + 2;

// Calculate proficiency contribution based on level
export const getProficiencyContribution = (
  proficiencyLevel: SkillProficiencyLevel,
  proficiencyBonus: number
): number => {
  switch (proficiencyLevel) {
    case 'none':
      return 0;
    case 'half':
      return Math.floor(proficiencyBonus / 2);
    case 'proficient':
      return proficiencyBonus;
    case 'mastery':
      return proficiencyBonus * 2;
    default:
      return 0;
  }
};

// Migrate old skill format (proficient: boolean) to new format (proficiencyLevel)
export const migrateSkillProficiency = (skill: SkillProficiency): SkillProficiency => {
  // If proficiencyLevel already exists, return as is
  if (skill.proficiencyLevel) {
    return skill;
  }
  // Migrate from old format: proficient boolean to proficiencyLevel
  const legacyProficient = (skill as { proficient?: boolean }).proficient;
  return {
    proficiencyLevel: legacyProficient ? 'proficient' : 'none',
    bonus: skill.bonus || 0,
  };
};

// Default spell slots by caster level (full caster)
export const DEFAULT_SPELL_SLOTS: Record<number, Record<number, number>> = {
  // Level: { SpellLevel: MaxSlots }
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

// Get default spell slots for a given character level
export const getDefaultSpellSlots = (level: number): Record<number, SpellSlots> => {
  const clampedLevel = Math.max(1, Math.min(20, level));
  const levelSlots = DEFAULT_SPELL_SLOTS[clampedLevel] || {};
  const result: Record<number, SpellSlots> = {};
  
  for (let spellLevel = 1; spellLevel <= 9; spellLevel++) {
    const max = levelSlots[spellLevel] || 0;
    result[spellLevel] = { max, used: 0 };
  }
  
  return result;
};

// Create default spell management
export const createDefaultSpellManagement = (level: number = 1): SpellManagement => ({
  knownSpells: [],
  spellSlots: getDefaultSpellSlots(level),
  useCustomSlots: false,
});

// Common D&D 5e conditions for reference
export const DND_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion (1-6)',
] as const;
