import type { CharacterSheet } from '../types';

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
    athletics: { proficient: false, bonus: 0 },
    acrobatics: { proficient: false, bonus: 0 },
    sleightOfHand: { proficient: false, bonus: 0 },
    stealth: { proficient: false, bonus: 0 },
    arcana: { proficient: false, bonus: 0 },
    history: { proficient: false, bonus: 0 },
    investigation: { proficient: false, bonus: 0 },
    nature: { proficient: false, bonus: 0 },
    religion: { proficient: false, bonus: 0 },
    animalHandling: { proficient: false, bonus: 0 },
    insight: { proficient: false, bonus: 0 },
    medicine: { proficient: false, bonus: 0 },
    perception: { proficient: false, bonus: 0 },
    survival: { proficient: false, bonus: 0 },
    deception: { proficient: false, bonus: 0 },
    intimidation: { proficient: false, bonus: 0 },
    performance: { proficient: false, bonus: 0 },
    persuasion: { proficient: false, bonus: 0 },
  },
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
