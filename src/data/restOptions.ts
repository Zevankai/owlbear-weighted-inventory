// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                           REST OPTIONS DATA                                  ║
// ║                                                                              ║
// ║  This file contains all default rest options for the rest system.           ║
// ║  To add/edit options, find the appropriate section below.                   ║
// ║                                                                              ║
// ║  SECTIONS:                                                                   ║
// ║  1. SHORT REST - Standard Options                                           ║
// ║  2. SHORT REST - Race-Specific Options                                      ║
// ║  3. SHORT REST - Class-Specific Options                                     ║
// ║  4. LONG REST - Standard Options                                            ║
// ║  5. LONG REST - Race-Specific Options                                       ║
// ║  6. LONG REST - Class-Specific Options                                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import type { RestOption } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SHORT REST - Standard Options
// ═══════════════════════════════════════════════════════════════════════════════
// These options are available to all characters during a short rest.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORT_REST_STANDARD_OPTIONS: RestOption[] = [
  {
    id: 'short-standard-hit-dice',
    name: 'Spend Hit Dice',
    description: 'You can spend one or more Hit Dice to heal. Roll each die and add your Constitution modifier to regain hit points.',
    category: 'standard',
    restType: 'short',
  },
  {
    id: 'short-standard-recharge-abilities',
    name: 'Recharge Abilities',
    description: 'Some class features and abilities recharge after a short rest. Check your class features for specifics.',
    category: 'standard',
    restType: 'short',
  },
  {
    id: 'short-standard-attune-item',
    name: 'Attune to Magic Item',
    description: 'You can spend the short rest attuning to a magic item, focusing on it while maintaining physical contact.',
    category: 'standard',
    restType: 'short',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SHORT REST - Race-Specific Options
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified race.
// Note: Tiefling, Goblin, and Fairy are intentionally left blank for GM customization.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORT_REST_RACE_OPTIONS: RestOption[] = [
  // Human options
  {
    id: 'short-race-human-versatile',
    name: 'Human Versatility',
    description: 'Humans can spend a short rest practicing a skill, gaining advantage on the next check with that skill within 1 hour.',
    category: 'race',
    raceRestriction: 'Human',
    restType: 'short',
  },
  // Elf options
  {
    id: 'short-race-elf-trance',
    name: 'Elven Trance',
    description: 'Elves only need 4 hours to complete a short rest, meditating in a trance-like state while remaining aware of surroundings.',
    category: 'race',
    raceRestriction: 'Elf',
    restType: 'short',
  },
  // Dragonborn options
  {
    id: 'short-race-dragonborn-breath-recovery',
    name: 'Draconic Recovery',
    description: 'Dragonborn can meditate on their draconic heritage to regain their breath weapon if expended.',
    category: 'race',
    raceRestriction: 'Dragonborn',
    restType: 'short',
  },
  // Orc options
  {
    id: 'short-race-orc-aggressive-rest',
    name: 'Aggressive Recovery',
    description: 'Orcs can channel their aggressive nature during rest. Gain temporary HP equal to your Constitution modifier until your next rest.',
    category: 'race',
    raceRestriction: 'Orc',
    restType: 'short',
  },
  // Halfling options
  {
    id: 'short-race-halfling-second-breakfast',
    name: 'Second Breakfast',
    description: 'Halflings who eat a proper meal during a short rest regain an additional 1d4 HP when spending Hit Dice.',
    category: 'race',
    raceRestriction: 'Halfling',
    restType: 'short',
  },
  // Dwarf options
  {
    id: 'short-race-dwarf-stonecunning-rest',
    name: 'Dwarven Resilience',
    description: 'Dwarves can spend the short rest tending to their equipment. Gain +1 AC against the next attack before your next rest.',
    category: 'race',
    raceRestriction: 'Dwarf',
    restType: 'short',
  },
  // Mixed race options
  {
    id: 'short-race-mixed-adaptable',
    name: 'Adaptable Heritage',
    description: 'Mixed-race characters can choose one short rest benefit from either of their parent races.',
    category: 'race',
    raceRestriction: 'Mixed',
    restType: 'short',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: SHORT REST - Class-Specific Options
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified class.
// Note: Druid, Paladin, and Monk are intentionally left blank for GM customization.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORT_REST_CLASS_OPTIONS: RestOption[] = [
  // Fighter options
  {
    id: 'short-class-fighter-second-wind',
    name: 'Second Wind',
    description: 'Fighters regain Second Wind usage after a short rest. Use a bonus action to regain 1d10 + fighter level HP.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'short',
  },
  {
    id: 'short-class-fighter-action-surge',
    name: 'Action Surge Recovery',
    description: 'Fighters regain their Action Surge usage after a short rest.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'short',
  },
  // Ranger options
  {
    id: 'short-class-ranger-natural-recovery',
    name: 'Natural Recovery',
    description: 'Rangers can attune to their surroundings, gaining advantage on the next Survival or Nature check within 1 hour.',
    category: 'class',
    classRestriction: 'Ranger',
    restType: 'short',
  },
  // Bard options
  {
    id: 'short-class-bard-song-of-rest',
    name: 'Song of Rest',
    description: 'Bards can use soothing music during a short rest. Allies who spend Hit Dice regain extra HP: 1d6 (level 2+), 1d8 (level 9+), 1d10 (level 13+), 1d12 (level 17+).',
    category: 'class',
    classRestriction: 'Bard',
    restType: 'short',
  },
  // Wizard options
  {
    id: 'short-class-wizard-arcane-recovery',
    name: 'Arcane Recovery',
    description: 'Wizards can recover spell slots during a short rest. Recover slots with combined level equal to half wizard level (rounded up). Once per long rest.',
    category: 'class',
    classRestriction: 'Wizard',
    restType: 'short',
  },
  // Warlock options
  {
    id: 'short-class-warlock-pact-magic',
    name: 'Pact Magic Recovery',
    description: 'Warlocks regain all expended spell slots after a short rest.',
    category: 'class',
    classRestriction: 'Warlock',
    restType: 'short',
  },
  // Rogue options
  {
    id: 'short-class-rogue-cunning-action-prep',
    name: 'Cunning Preparation',
    description: 'Rogues can spend a short rest studying their environment. Gain advantage on the next Stealth or Sleight of Hand check within 1 hour.',
    category: 'class',
    classRestriction: 'Rogue',
    restType: 'short',
  },
  // Barbarian options
  {
    id: 'short-class-barbarian-rage-recovery',
    name: 'Primal Recovery',
    description: 'Barbarians can meditate on their rage. If you have no rages remaining, regain one use of Rage after this short rest (once per long rest).',
    category: 'class',
    classRestriction: 'Barbarian',
    restType: 'short',
  },
  // Cleric options
  {
    id: 'short-class-cleric-channel-divinity',
    name: 'Channel Divinity Recovery',
    description: 'Clerics can pray during a short rest to regain one use of Channel Divinity.',
    category: 'class',
    classRestriction: 'Cleric',
    restType: 'short',
  },
  // Multiclass options
  {
    id: 'short-class-multiclass-versatile',
    name: 'Multiclass Versatility',
    description: 'Multiclass characters can choose short rest benefits from any of their classes.',
    category: 'class',
    classRestriction: 'Multiclass',
    restType: 'short',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: LONG REST - Standard Options
// ═══════════════════════════════════════════════════════════════════════════════
// These options are available to all characters during a long rest.
// ═══════════════════════════════════════════════════════════════════════════════

export const LONG_REST_STANDARD_OPTIONS: RestOption[] = [
  {
    id: 'long-standard-full-hp',
    name: 'Full HP Recovery',
    description: 'You regain all lost hit points at the end of a long rest.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-hit-dice-recovery',
    name: 'Hit Dice Recovery',
    description: 'You regain spent Hit Dice up to half your total number of them (minimum 1).',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-spell-slots',
    name: 'Spell Slot Recovery',
    description: 'Spellcasters regain all expended spell slots at the end of a long rest.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-class-features',
    name: 'Class Feature Recovery',
    description: 'Most class features that have limited uses are restored after a long rest.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-exhaustion',
    name: 'Reduce Exhaustion',
    description: 'If you have food and drink, reduce your exhaustion level by 1.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-heroic-inspiration',
    name: 'Heroic Inspiration',
    description: 'At the end of a long rest, if you do not have Heroic Inspiration, you gain it.',
    category: 'standard',
    restType: 'long',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: LONG REST - Race-Specific Options
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified race.
// Note: Tiefling, Goblin, and Fairy are intentionally left blank for GM customization.
// ═══════════════════════════════════════════════════════════════════════════════

export const LONG_REST_RACE_OPTIONS: RestOption[] = [
  // Human options
  {
    id: 'long-race-human-determined',
    name: 'Human Determination',
    description: 'Humans gain an extra Hit Die worth of temporary HP after a long rest that lasts until the next long rest.',
    category: 'race',
    raceRestriction: 'Human',
    restType: 'long',
  },
  // Elf options
  {
    id: 'long-race-elf-trance',
    name: 'Elven Trance (Long)',
    description: 'Elves only need 4 hours to gain the benefits of a long rest, remaining semiconscious during this time.',
    category: 'race',
    raceRestriction: 'Elf',
    restType: 'long',
  },
  // Dragonborn options
  {
    id: 'long-race-dragonborn-draconic-might',
    name: 'Draconic Might',
    description: 'Dragonborn can channel their draconic ancestry. After a long rest, your breath weapon deals an extra die of damage on its next use.',
    category: 'race',
    raceRestriction: 'Dragonborn',
    restType: 'long',
  },
  // Orc options
  {
    id: 'long-race-orc-relentless',
    name: 'Relentless Endurance Refresh',
    description: 'Orcs regain use of Relentless Endurance after a long rest, allowing them to drop to 1 HP instead of 0 once.',
    category: 'race',
    raceRestriction: 'Orc',
    restType: 'long',
  },
  // Halfling options
  {
    id: 'long-race-halfling-lucky-rest',
    name: 'Halfling Luck Refresh',
    description: 'Halflings feel particularly lucky after a good rest. Your Lucky trait allows you to reroll two 1s on your next ability check.',
    category: 'race',
    raceRestriction: 'Halfling',
    restType: 'long',
  },
  // Dwarf options
  {
    id: 'long-race-dwarf-stout-constitution',
    name: 'Dwarven Fortitude',
    description: 'Dwarves recover particularly well. Regain all Hit Dice instead of half after a long rest.',
    category: 'race',
    raceRestriction: 'Dwarf',
    restType: 'long',
  },
  // Mixed race options
  {
    id: 'long-race-mixed-dual-heritage',
    name: 'Dual Heritage',
    description: 'Mixed-race characters can choose one long rest benefit from either of their parent races.',
    category: 'race',
    raceRestriction: 'Mixed',
    restType: 'long',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: LONG REST - Class-Specific Options
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified class.
// Note: Druid, Paladin, and Monk are intentionally left blank for GM customization.
// ═══════════════════════════════════════════════════════════════════════════════

export const LONG_REST_CLASS_OPTIONS: RestOption[] = [
  // Fighter options
  {
    id: 'long-class-fighter-indomitable',
    name: 'Indomitable Recovery',
    description: 'Fighters regain all uses of Indomitable after a long rest.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'long',
  },
  // Ranger options
  {
    id: 'long-class-ranger-prepared',
    name: 'Ranger Preparation',
    description: 'Rangers can spend part of the long rest preparing new spells. Choose your prepared spells from the ranger spell list.',
    category: 'class',
    classRestriction: 'Ranger',
    restType: 'long',
  },
  // Bard options
  {
    id: 'long-class-bard-inspiration',
    name: 'Bardic Inspiration Recovery',
    description: 'Bards regain all expended uses of Bardic Inspiration after a long rest.',
    category: 'class',
    classRestriction: 'Bard',
    restType: 'long',
  },
  // Wizard options
  {
    id: 'long-class-wizard-spell-preparation',
    name: 'Spell Preparation',
    description: 'Wizards can prepare a new set of spells during a long rest. Choose from your spellbook.',
    category: 'class',
    classRestriction: 'Wizard',
    restType: 'long',
  },
  // Warlock options
  {
    id: 'long-class-warlock-mystic-arcanum',
    name: 'Mystic Arcanum Recovery',
    description: 'Warlocks regain uses of Mystic Arcanum spells after a long rest.',
    category: 'class',
    classRestriction: 'Warlock',
    restType: 'long',
  },
  // Rogue options
  {
    id: 'long-class-rogue-stroke-of-luck',
    name: 'Stroke of Luck Recovery',
    description: 'Rogues (level 20) regain use of Stroke of Luck after a long rest.',
    category: 'class',
    classRestriction: 'Rogue',
    restType: 'long',
  },
  // Barbarian options
  {
    id: 'long-class-barbarian-rage-full',
    name: 'Full Rage Recovery',
    description: 'Barbarians regain all expended uses of Rage after a long rest.',
    category: 'class',
    classRestriction: 'Barbarian',
    restType: 'long',
  },
  // Cleric options
  {
    id: 'long-class-cleric-divine-intervention',
    name: 'Divine Intervention Recovery',
    description: 'Clerics regain use of Divine Intervention after a long rest (if successful on previous use, must wait 7 days).',
    category: 'class',
    classRestriction: 'Cleric',
    restType: 'long',
  },
  // Multiclass options
  {
    id: 'long-class-multiclass-combined',
    name: 'Multiclass Recovery',
    description: 'Multiclass characters regain all class-specific resources from each of their classes after a long rest.',
    category: 'class',
    classRestriction: 'Multiclass',
    restType: 'long',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// All short rest options combined
export const ALL_SHORT_REST_OPTIONS: RestOption[] = [
  ...SHORT_REST_STANDARD_OPTIONS,
  ...SHORT_REST_RACE_OPTIONS,
  ...SHORT_REST_CLASS_OPTIONS,
];

// All long rest options combined
export const ALL_LONG_REST_OPTIONS: RestOption[] = [
  ...LONG_REST_STANDARD_OPTIONS,
  ...LONG_REST_RACE_OPTIONS,
  ...LONG_REST_CLASS_OPTIONS,
];

// All rest options combined
export const ALL_REST_OPTIONS: RestOption[] = [
  ...ALL_SHORT_REST_OPTIONS,
  ...ALL_LONG_REST_OPTIONS,
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get rest options available for a character based on their race and class
 */
export function getAvailableRestOptions(
  restType: 'short' | 'long',
  race?: string,
  characterClass?: string,
  secondaryRace?: string,
  secondaryClass?: string
): RestOption[] {
  const options = restType === 'short' ? ALL_SHORT_REST_OPTIONS : ALL_LONG_REST_OPTIONS;
  
  return options.filter(option => {
    // Standard options are always available
    if (option.category === 'standard') {
      return true;
    }
    
    // Race-specific options
    if (option.category === 'race' && option.raceRestriction) {
      // Check primary race
      if (race && option.raceRestriction === race) {
        return true;
      }
      // Check secondary race (for Mixed)
      if (secondaryRace && option.raceRestriction === secondaryRace) {
        return true;
      }
      // Mixed race gets access to Mixed-specific options
      if (race === 'Mixed' && option.raceRestriction === 'Mixed') {
        return true;
      }
      return false;
    }
    
    // Class-specific options
    if (option.category === 'class' && option.classRestriction) {
      // Check primary class
      if (characterClass && option.classRestriction === characterClass) {
        return true;
      }
      // Check secondary class (for Multiclass)
      if (secondaryClass && option.classRestriction === secondaryClass) {
        return true;
      }
      // Multiclass gets access to Multiclass-specific options
      if (characterClass === 'Multiclass' && option.classRestriction === 'Multiclass') {
        return true;
      }
      return false;
    }
    
    return false;
  });
}

/**
 * Get a rest option by ID
 */
export function getRestOptionById(id: string): RestOption | undefined {
  return ALL_REST_OPTIONS.find(option => option.id === id);
}
