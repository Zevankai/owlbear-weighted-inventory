// Character Stats Utilities
// Helper functions for creating default character stats values

import type { ExhaustionState, RestHistory, CharacterStats, DeathSaves, HitDice, SuperiorityDice, CharacterClass } from '../types';
import { createDefaultConditions } from '../data/conditions';

/**
 * Create default exhaustion state
 */
export function createDefaultExhaustionState(): ExhaustionState {
  return {
    currentLevel: 0,
    maxLevels: 10,
    customEffects: [],
  };
}

/**
 * Create default rest history
 */
export function createDefaultRestHistory(): RestHistory {
  return {
    lastShortRest: null,
    lastLongRest: null,
    heroicInspirationGainedToday: false,
    consecutiveWildernessRests: 0,
    wildernessExhaustionBlocked: false,
  };
}

/**
 * Create default death saves state
 */
export function createDefaultDeathSaves(): DeathSaves {
  return {
    successes: 0,
    failures: 0,
  };
}

/**
 * Get hit die type based on character class
 */
export function getHitDieType(characterClass: CharacterClass): string {
  const hitDice: Record<string, string> = {
    'Barbarian': 'd12',
    'Fighter': 'd10',
    'Paladin': 'd10',
    'Ranger': 'd10',
    'Bard': 'd8',
    'Cleric': 'd8',
    'Druid': 'd8',
    'Monk': 'd8',
    'Rogue': 'd8',
    'Warlock': 'd8',
    'Wizard': 'd6',
    'Sorcerer': 'd6',
  };
  return hitDice[characterClass] || 'd8';
}

/**
 * Create default hit dice state
 */
export function createDefaultHitDice(level: number = 1, characterClass: CharacterClass = 'Fighter'): HitDice {
  return {
    current: level,
    max: level,
    dieType: getHitDieType(characterClass),
  };
}

/**
 * Create default superiority dice state
 */
export function createDefaultSuperiorityDice(): SuperiorityDice {
  return {
    current: 4,
    max: 4,
  };
}

/**
 * Create default character stats with all default values
 */
export function createDefaultCharacterStats(): CharacterStats {
  return {
    race: 'Human',
    characterClass: 'Fighter',
    level: 1,
    currentHp: 0,
    maxHp: 0,
    tempHp: 0,
    armorClass: 10,
    heroicInspiration: false,
    conditions: createDefaultConditions(),
    exhaustion: createDefaultExhaustionState(),
    restHistory: createDefaultRestHistory(),
    deathSaves: createDefaultDeathSaves(),
  };
}
