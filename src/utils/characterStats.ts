// Character Stats Utilities
// Helper functions for creating default character stats values

import type { ExhaustionState, RestHistory, CharacterStats } from '../types';
import { createDefaultConditions } from '../data/conditions';

/**
 * Create default exhaustion state
 */
export function createDefaultExhaustionState(): ExhaustionState {
  return {
    currentLevel: 0,
    maxLevels: 6,
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
  };
}
