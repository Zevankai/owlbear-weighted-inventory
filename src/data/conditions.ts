// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        D&D 5e CONDITIONS DATA                                ║
// ║                                                                              ║
// ║  This file contains all 14 standard D&D 5e conditions with descriptions.    ║
// ║  These conditions can be toggled on/off for character tokens.               ║
// ║  Also includes custom injury/infection conditions.                          ║
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
  isInjury?: boolean; // True for injury conditions that require location selection
}

/**
 * All 14 standard D&D 5e conditions + custom injury conditions
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
  // === INJURY CONDITIONS ===
  {
    id: 'minorInjury',
    name: 'Minor Injury',
    description: 'Temporary cosmetic damage only (no mechanical penalty). Triggered when HP decreases by 10+ in one hit.',
    icon: '🩹',
    isInjury: true,
  },
  {
    id: 'seriousInjury',
    name: 'Serious Injury',
    description: 'Leaves a permanent scar. Effects vary by location: Limb (DIS on STR & DEX rolls), Torso (DIS on STR & CON rolls), Head (DIS on CON, WIS & INT rolls). Triggered by rolling 4-5 on d6 when taking 20+ damage.',
    icon: '🩸',
    isInjury: true,
  },
  {
    id: 'criticalInjury',
    name: 'Critical Injury',
    description: 'Large permanent scar with location effects (same as Serious Injury). Additionally: DIS on ALL attack rolls, DIS on Death Saves, HP maximum cut by 25%. Triggered by rolling 6 on d6 when taking 20+ damage.',
    icon: '💀',
    isInjury: true,
  },
  {
    id: 'infection',
    name: 'Infection',
    description: 'If any injury goes 3 days without rest treatment, add this condition. Each long rest with the injury, roll a Death Save. 3 failed saves = death. DC 15 Medicine check can override a failed save. Infections are cured via any of the following: 3 DC 15 Medicine checks, 3 passed death Saves, or professional medical treatment',
    icon: '🦠',
    isInjury: true,
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
    // Injury conditions
    minorInjury: false,
    seriousInjury: false,
    criticalInjury: false,
    infection: false,
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
 * Standard condition types (non-injury)
 */
export const STANDARD_CONDITION_TYPES: ConditionType[] = [
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

/**
 * Injury condition types
 */
export const INJURY_CONDITION_TYPES: ConditionType[] = [
  'minorInjury',
  'seriousInjury',
  'criticalInjury',
  'infection',
];

/**
 * Condition type array for iteration (all conditions)
 */
export const CONDITION_TYPES: ConditionType[] = [
  ...STANDARD_CONDITION_TYPES,
  ...INJURY_CONDITION_TYPES,
];

/**
 * Map of condition IDs to display labels
 */
export const CONDITION_LABELS: Record<ConditionType, string> = {
  blinded: 'Blinded',
  charmed: 'Charmed',
  deafened: 'Deafened',
  frightened: 'Frightened',
  grappled: 'Grappled',
  incapacitated: 'Incapacitated',
  invisible: 'Invisible',
  paralyzed: 'Paralyzed',
  petrified: 'Petrified',
  poisoned: 'Poisoned',
  prone: 'Prone',
  restrained: 'Restrained',
  stunned: 'Stunned',
  unconscious: 'Unconscious',
  // Injury conditions
  minorInjury: 'Minor Injury',
  seriousInjury: 'Serious Injury',
  criticalInjury: 'Critical Injury',
  infection: 'Infection',
};
