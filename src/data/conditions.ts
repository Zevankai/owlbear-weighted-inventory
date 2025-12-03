// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        D&D 5e CONDITIONS DATA                                ║
// ║                                                                              ║
// ║  This file contains all 14 standard D&D 5e conditions with descriptions.    ║
// ║  These conditions can be toggled on/off for character tokens.               ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import type { ConditionType, CharacterConditions } from '../types';

/**
 * Condition definition with full description
 */
export interface ConditionDefinition {
  id: ConditionType;
  name: string;
  description: string;
  icon: string; // Emoji icon for visual representation
}

/**
 * All 14 standard D&D 5e conditions
 */
export const CONDITIONS: ConditionDefinition[] = [
  {
    id: 'blinded',
    name: 'Blinded',
    description: 'You automatically fail any ability check that requires sight. ATK against you have ADV; yours have DIS.',
    icon: '👁️',
  },
  {
    id: 'charmed',
    name: 'Charmed',
    description: "You can't harm the charmer, and the charmer has ADV on ability checks with you.",
    icon: '💕',
  },
  {
    id: 'deafened',
    name: 'Deafened',
    description: 'You automatically fail any ability check that requires hearing.',
    icon: '🔇',
  },
  {
    id: 'frightened',
    name: 'Frightened',
    description: 'When the source can be seen, you have DIS on all checks & ATK.',
    icon: '😨',
  },
  {
    id: 'grappled',
    name: 'Grappled',
    description: 'Your speed is 0, and you have DIS on attack rolls against all but the grappler. The grappler can drag/carry you with half movement unless you are tiny or 2+ sizes smaller.',
    icon: '🤝',
  },
  {
    id: 'incapacitated',
    name: 'Incapacitated',
    description: 'You are inactive. You have no concentration. DIS on initiative.',
    icon: '💫',
  },
  {
    id: 'invisible',
    name: 'Invisible',
    description: 'ADV on initiative. ATK rolls have ADV. ATKs against you have DIS, unless the attacker can somehow see you.',
    icon: '👻',
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    description: 'Your speed is 0. You fail all STR & DEX saves. ATKS against you have ADV and are CRIT if the attacker is within 5 feet of you.',
    icon: '⚡',
  },
  {
    id: 'petrified',
    name: 'Petrified',
    description: 'You and all of your current belongings become a solid inanimate substance. Your weight increases 10x, and you cease aging.',
    icon: '🗿',
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    description: 'You have DIS on ATK and ability checks.',
    icon: '🤢',
  },
  {
    id: 'prone',
    name: 'Prone',
    description: 'You may crawl (half speed) or stand for half total speed. If your speed is 0, you cannot right yourself. You have DIS on ATK, and ATK against you has ADV if within 5 feet of you. Otherwise, that ATK has DIS.',
    icon: '🛏️',
  },
  {
    id: 'restrained',
    name: 'Restrained',
    description: 'Speed is 0. ATK against you have ADV, your ATK have DIS. DIS on DEX saves.',
    icon: '⛓️',
  },
  {
    id: 'stunned',
    name: 'Stunned',
    description: 'You are incapacitated and fail STR & DEX saves. ATK against you have ADV.',
    icon: '💥',
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    description: 'You drop everything and go prone. ATK against you have ADV. If within 5 feet, ATK against you are CRIT. You fail STR & DEX saves.',
    icon: '😴',
  },
];

/**
 * Create default (all false) character conditions
 */
export function createDefaultConditions(): CharacterConditions {
  return {
    blinded: false,
    charmed: false,
    deafened: false,
    frightened: false,
    grappled: false,
    incapacitated: false,
    invisible: false,
    paralyzed: false,
    petrified: false,
    poisoned: false,
    prone: false,
    restrained: false,
    stunned: false,
    unconscious: false,
  };
}

/**
 * Get condition definition by ID
 */
export function getConditionById(id: ConditionType): ConditionDefinition | undefined {
  return CONDITIONS.find(c => c.id === id);
}

/**
 * Get all active conditions from a CharacterConditions object
 */
export function getActiveConditions(conditions: CharacterConditions): ConditionDefinition[] {
  return CONDITIONS.filter(c => conditions[c.id]);
}

/**
 * Count number of active conditions
 */
export function countActiveConditions(conditions: CharacterConditions): number {
  return Object.values(conditions).filter(Boolean).length;
}

/**
 * Condition type array for iteration
 */
export const CONDITION_TYPES: ConditionType[] = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
];
