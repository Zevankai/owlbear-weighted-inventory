// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                           REST OPTIONS DATA                                  ║
// ║                                                                              ║
// ║  This file contains all default rest options for the rest system.           ║
// ║  To add/edit options, find the appropriate section below.                   ║
// ║                                                                              ║
// ║  SECTIONS:                                                                   ║
// ║  1. SHORT REST - Standard Options (auto-applied)                            ║
// ║  2. SHORT REST - Race-Specific Options (1 additional choice)                ║
// ║  3. SHORT REST - Class-Specific Options                                     ║
// ║  4. LONG REST - Standard Options (auto-applied)                             ║
// ║  5. LONG REST - Race-Specific Options (2 additional choices)                ║
// ║  6. LONG REST - Class-Specific Options                                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import type { RestOption } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SHORT REST - Standard Options (Auto-applied - not selectable)
// ═══════════════════════════════════════════════════════════════════════════════
// These options are automatically applied to all characters during a short rest.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORT_REST_STANDARD_OPTIONS: RestOption[] = [
  {
    id: 'short-standard-project',
    name: 'Work on Project',
    description: 'Progress a project by 1 mark.',
    category: 'standard',
    restType: 'short',
  },
  {
    id: 'short-standard-maintain-gear',
    name: 'Maintain Gear',
    description: 'Roll a DC 10 tool check. On success: One weapon gains +5 damage on its next attack, OR one piece of armor negates 5 damage on the next attack against you. (Brief roleplay required.)',
    category: 'standard',
    restType: 'short',
  },
  {
    id: 'short-standard-bond-companion',
    name: 'Bond with Companion',
    description: 'Two players must choose this. You both auto-succeed your next Saving Throw. Your next attack crits on a roll of 18+.',
    category: 'standard',
    restType: 'short',
  },
  {
    id: 'short-standard-snack',
    name: 'Prepare a Snack',
    description: 'Costs 1 ration per member; cooking tools required. The party gains +10 temporary HP.',
    category: 'standard',
    restType: 'short',
    effect: { type: 'tempHp', value: 10, requiresRations: 1 },
  },
  {
    id: 'short-standard-patch-wounds',
    name: 'Patch Wounds',
    description: 'DC 10 Medicine Check: Remove 1 level of injury.',
    category: 'standard',
    restType: 'short',
    effect: { type: 'healInjury' },
  },
  {
    id: 'short-standard-quick-practice',
    name: 'Quick Practice',
    description: 'Choose 1 skill you have not used since your last rest. Your next roll with that skill is made with Advantage. (Roleplay how you practice.)',
    category: 'standard',
    restType: 'short',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SHORT REST - Race-Specific Options (2 per race)
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified race.
// Player can select 1 additional option from race or class during short rest.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORT_REST_RACE_OPTIONS: RestOption[] = [
  // Dwarf options
  {
    id: 'short-race-dwarf-stonebound',
    name: 'Stonebound Focus',
    description: 'Advantage on your next Saving Throw.',
    category: 'race',
    raceRestriction: 'Dwarf',
    restType: 'short',
  },
  {
    id: 'short-race-dwarf-ale',
    name: 'Ale & Ember',
    description: 'Restore 8 HP.',
    category: 'race',
    raceRestriction: 'Dwarf',
    restType: 'short',
  },
  // Elf options
  {
    id: 'short-race-elf-tranceflash',
    name: 'Tranceflash',
    description: 'Advantage on your next Initiative roll.',
    category: 'race',
    raceRestriction: 'Elf',
    restType: 'short',
  },
  {
    id: 'short-race-elf-precision',
    name: 'Refined Precision',
    description: '+2 to your next Dexterity check.',
    category: 'race',
    raceRestriction: 'Elf',
    restType: 'short',
  },
  // Human options
  {
    id: 'short-race-human-adaptive',
    name: 'Adaptive Burst',
    description: 'Choose any one skill; its next effect is increased by +1 until your next rest.',
    category: 'race',
    raceRestriction: 'Human',
    restType: 'short',
  },
  {
    id: 'short-race-human-tenacity',
    name: 'Tenacity',
    description: 'Gain 5 temporary HP.',
    category: 'race',
    raceRestriction: 'Human',
    restType: 'short',
    effect: { type: 'tempHp', value: 5 },
  },
  // Orc options
  {
    id: 'short-race-orc-battle-rush',
    name: 'Battle Rush',
    description: '+4 to your next Attack roll.',
    category: 'race',
    raceRestriction: 'Orc',
    restType: 'short',
  },
  {
    id: 'short-race-orc-relentless-grip',
    name: 'Relentless Grip',
    description: 'You cannot be disarmed during the next combat encounter unless a limb is severed.',
    category: 'race',
    raceRestriction: 'Orc',
    restType: 'short',
  },
  // Halfling options
  {
    id: 'short-race-halfling-lucky-pause',
    name: 'Lucky Pause',
    description: 'You may reroll one roll during your next social interaction.',
    category: 'race',
    raceRestriction: 'Halfling',
    restType: 'short',
  },
  {
    id: 'short-race-halfling-comforts',
    name: 'Small Comforts',
    description: 'Restore 8 HP.',
    category: 'race',
    raceRestriction: 'Halfling',
    restType: 'short',
  },
  // Gnome options
  {
    id: 'short-race-gnome-ingenuity',
    name: 'Spark of Ingenuity',
    description: 'ADV on your next crafting, tinkering, or manipulation check.',
    category: 'race',
    raceRestriction: 'Gnome',
    restType: 'short',
  },
  {
    id: 'short-race-gnome-blink',
    name: 'Quick Blink',
    description: '+3 to your next Dexterity check or Saving Throw.',
    category: 'race',
    raceRestriction: 'Gnome',
    restType: 'short',
  },
  // Dragonborn options
  {
    id: 'short-race-dragonborn-prayer',
    name: 'Ancestral Prayer',
    description: 'Roleplay a prayer to your ancestors. Gain Heroic Inspiration. If unused before your next rest: all saves until the next rest are at DIS.',
    category: 'race',
    raceRestriction: 'Dragonborn',
    restType: 'short',
    effect: { type: 'heroicInspiration' },
  },
  {
    id: 'short-race-dragonborn-presence',
    name: 'Draconic Presence',
    description: '+2 to your next Intimidation roll.',
    category: 'race',
    raceRestriction: 'Dragonborn',
    restType: 'short',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: SHORT REST - Class-Specific Options (2 per class)
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified class.
// ═══════════════════════════════════════════════════════════════════════════════

export const SHORT_REST_CLASS_OPTIONS: RestOption[] = [
  // Fighter options
  {
    id: 'short-class-fighter-edge',
    name: 'Edge Maintenance',
    description: 'Your next weapon attack gains +2 damage.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'short',
  },
  {
    id: 'short-class-fighter-shield',
    name: 'Shield Settle',
    description: 'Your next block/guard reduces damage by +2.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'short',
  },
  // Rogue options
  {
    id: 'short-class-rogue-silent',
    name: 'Silent Reset',
    description: 'ADV on your next Stealth attempt.',
    category: 'class',
    classRestriction: 'Rogue',
    restType: 'short',
  },
  {
    id: 'short-class-rogue-hands',
    name: 'Light Hands',
    description: '+2 to your next Dex check.',
    category: 'class',
    classRestriction: 'Rogue',
    restType: 'short',
  },
  // Cleric options
  {
    id: 'short-class-cleric-breath',
    name: 'Reverent Breath',
    description: 'Restore 10 HP to an ally within reach as an action, once.',
    category: 'class',
    classRestriction: 'Cleric',
    restType: 'short',
  },
  {
    id: 'short-class-cleric-insight',
    name: 'Sacred Insight',
    description: '+1 to your next Wisdom or Intelligence roll.',
    category: 'class',
    classRestriction: 'Cleric',
    restType: 'short',
  },
  // Wizard options
  {
    id: 'short-class-wizard-arcane',
    name: 'Arcane Moment',
    description: 'Restore 1 spell slot of level 3 or lower.',
    category: 'class',
    classRestriction: 'Wizard',
    restType: 'short',
  },
  {
    id: 'short-class-wizard-geometry',
    name: 'Spell Geometry',
    description: '+1 to your next spell attack roll.',
    category: 'class',
    classRestriction: 'Wizard',
    restType: 'short',
  },
  // Ranger options
  {
    id: 'short-class-ranger-nose',
    name: "Hunter's Nose",
    description: 'ADV on your next Animal Handling or Survival check.',
    category: 'class',
    classRestriction: 'Ranger',
    restType: 'short',
  },
  {
    id: 'short-class-ranger-stalker',
    name: "Stalker's Readiness",
    description: '+1 to your next ranged attack roll.',
    category: 'class',
    classRestriction: 'Ranger',
    restType: 'short',
  },
  // Bard options
  {
    id: 'short-class-bard-tuneup',
    name: 'Tune-Up',
    description: 'ADV on your next Performance or Persuasion roll.',
    category: 'class',
    classRestriction: 'Bard',
    restType: 'short',
  },
  {
    id: 'short-class-bard-whisper',
    name: 'Whispered Motif',
    description: 'Give an ally +5 to their next roll of any kind; you must name them immediately.',
    category: 'class',
    classRestriction: 'Bard',
    restType: 'short',
  },
  // Warlock options
  {
    id: 'short-class-warlock-deity',
    name: 'Blessed Deity',
    description: 'Commune with your deity. Gain +5 to your next roll of any kind.',
    category: 'class',
    classRestriction: 'Warlock',
    restType: 'short',
  },
  {
    id: 'short-class-warlock-selfless',
    name: 'Selfless Act',
    description: 'At the cost of 1d20 HP, grant Heroic Inspiration to a party member. (HP cannot drop below 1.)',
    category: 'class',
    classRestriction: 'Warlock',
    restType: 'short',
  },
  // Barbarian options
  {
    id: 'short-class-barbarian-headbang',
    name: 'Head Bang',
    description: 'Your next unarmed melee attack has +3 to hit and deals +1d12 damage. Roleplay the attack.',
    category: 'class',
    classRestriction: 'Barbarian',
    restType: 'short',
  },
  {
    id: 'short-class-barbarian-berserker',
    name: "Berserker's Rest",
    description: 'Choose two short-rest options to use at the cost of 1 exhaustion and DIS on your next attack roll or saving throw.',
    category: 'class',
    classRestriction: 'Barbarian',
    restType: 'short',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: LONG REST - Standard Options (Auto-applied - not selectable)
// ═══════════════════════════════════════════════════════════════════════════════
// These options are automatically applied to all characters during a long rest.
// ═══════════════════════════════════════════════════════════════════════════════

export const LONG_REST_STANDARD_OPTIONS: RestOption[] = [
  {
    id: 'long-standard-project',
    name: 'Work on Project',
    description: 'Progress a project by 2 marks. If race = Elf → progress 3 marks.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-maintain-gear',
    name: 'Maintain Gear',
    description: 'Roll a DC 5 tool check. On success: One weapon gains +5 damage on its next attack, OR one armor piece negates 5 damage on the next attack against you.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-bond-companion',
    name: 'Bond with Companion',
    description: 'Two players must choose this. You both auto-succeed your next Saving Throw. Your next attack crits on a natural 15+.',
    category: 'standard',
    restType: 'long',
  },
  {
    id: 'long-standard-meal',
    name: 'Prepare a Meal',
    description: 'Costs 1 ration per member; cooking tools required. Party gains +15 temporary HP.',
    category: 'standard',
    restType: 'long',
    effect: { type: 'tempHp', value: 15, requiresRations: 1 },
  },
  {
    id: 'long-standard-patch-wounds',
    name: 'Patch Wounds',
    description: 'DC 10 Medicine Check: Remove 2 levels of injury.',
    category: 'standard',
    restType: 'long',
    effect: { type: 'healInjury' },
  },
  {
    id: 'long-standard-quick-practice',
    name: 'Quick Practice',
    description: 'Choose one skill you have not used since your last rest. Your next two rolls with that skill are made with ADV.',
    category: 'standard',
    restType: 'long',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: LONG REST - Race-Specific Options (2 per race)
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified race.
// Player can select 2 additional options from race or class during long rest.
// ═══════════════════════════════════════════════════════════════════════════════

export const LONG_REST_RACE_OPTIONS: RestOption[] = [
  // Dwarf options
  {
    id: 'long-race-dwarf-stonebed',
    name: 'Stonebed Restoration',
    description: 'Negate all damage from the next hit against you.',
    category: 'race',
    raceRestriction: 'Dwarf',
    restType: 'long',
  },
  {
    id: 'long-race-dwarf-ancestral',
    name: 'Ancestral Dream',
    description: '+4 to your next crafting-related check.',
    category: 'race',
    raceRestriction: 'Dwarf',
    restType: 'long',
  },
  // Elf options
  {
    id: 'long-race-elf-moonlit',
    name: 'Moonlit Trance',
    description: 'Automatically clear all ongoing effects except curses or narrative-designed effects.',
    category: 'race',
    raceRestriction: 'Elf',
    restType: 'long',
  },
  {
    id: 'long-race-elf-song',
    name: 'Song of the Boughs',
    description: '+3 to passive Perception.',
    category: 'race',
    raceRestriction: 'Elf',
    restType: 'long',
  },
  // Human options
  {
    id: 'long-race-human-versatile',
    name: 'Versatile Renewal',
    description: 'Choose any non-project Standard Long-Rest option; double its numeric effect. (Cannot choose this or the doubled option during the next rest.)',
    category: 'race',
    raceRestriction: 'Human',
    restType: 'long',
  },
  {
    id: 'long-race-human-resolve',
    name: 'Resolve Surge',
    description: '+3 to passive Investigation.',
    category: 'race',
    raceRestriction: 'Human',
    restType: 'long',
  },
  // Orc options
  {
    id: 'long-race-orc-bloodfire',
    name: 'Bloodfire Dream',
    description: 'Your first melee attack roll is an automatic critical hit.',
    category: 'race',
    raceRestriction: 'Orc',
    restType: 'long',
  },
  {
    id: 'long-race-orc-warlust',
    name: 'Warlust Renewal',
    description: 'If you drop an enemy to 0 HP, restore 3 HP.',
    category: 'race',
    raceRestriction: 'Orc',
    restType: 'long',
  },
  // Halfling options
  {
    id: 'long-race-halfling-hearthsleep',
    name: 'Hearthsleep',
    description: 'Begin the day with Heroic Inspiration.',
    category: 'race',
    raceRestriction: 'Halfling',
    restType: 'long',
    effect: { type: 'heroicInspiration' },
  },
  {
    id: 'long-race-halfling-comfort',
    name: 'Comfort Feast',
    description: 'At the cost of 2 exhaustion, grant the rest of the party Heroic Inspiration.',
    category: 'race',
    raceRestriction: 'Halfling',
    restType: 'long',
  },
  // Gnome options
  {
    id: 'long-race-gnome-tinker',
    name: "Tinker's Twilight",
    description: 'Homebrew a small craft/item from available materials (DM discretion).',
    category: 'race',
    raceRestriction: 'Gnome',
    restType: 'long',
  },
  {
    id: 'long-race-gnome-glintdream',
    name: 'Glintdream',
    description: 'The next attack roll against you has disadvantage.',
    category: 'race',
    raceRestriction: 'Gnome',
    restType: 'long',
  },
  // Dragonborn options
  {
    id: 'long-race-dragonborn-dreamfire',
    name: 'Draconic Dreamfire',
    description: 'Your next elemental-type damage roll (breath or spell) gains +3.',
    category: 'race',
    raceRestriction: 'Dragonborn',
    restType: 'long',
  },
  {
    id: 'long-race-dragonborn-scaled',
    name: 'Scaled Presence',
    description: 'Your next Intimidation or Insight check gains +2.',
    category: 'race',
    raceRestriction: 'Dragonborn',
    restType: 'long',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: LONG REST - Class-Specific Options (2 per class)
// ═══════════════════════════════════════════════════════════════════════════════
// These options are only available to characters of the specified class.
// ═══════════════════════════════════════════════════════════════════════════════

export const LONG_REST_CLASS_OPTIONS: RestOption[] = [
  // Fighter options
  {
    id: 'long-class-fighter-iron',
    name: 'Iron Dawn',
    description: 'The first attack against you automatically fails.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'long',
  },
  {
    id: 'long-class-fighter-battle',
    name: 'Battle Mindset',
    description: '+5 to your next melee attack roll.',
    category: 'class',
    classRestriction: 'Fighter',
    restType: 'long',
  },
  // Rogue options
  {
    id: 'long-class-rogue-night',
    name: 'Night Patterns',
    description: 'ADV on your next Charisma check.',
    category: 'class',
    classRestriction: 'Rogue',
    restType: 'long',
  },
  {
    id: 'long-class-rogue-silent',
    name: 'Silent Preparation',
    description: '+1 to your next Dexterity check or save.',
    category: 'class',
    classRestriction: 'Rogue',
    restType: 'long',
  },
  // Cleric options
  {
    id: 'long-class-cleric-sacred',
    name: 'Sacred Renewal',
    description: 'The party gains 1d20 temporary HP.',
    category: 'class',
    classRestriction: 'Cleric',
    restType: 'long',
  },
  {
    id: 'long-class-cleric-dawn',
    name: "Dawn's Blessing",
    description: 'The next healing you perform also grants the target ADV on their next roll.',
    category: 'class',
    classRestriction: 'Cleric',
    restType: 'long',
  },
  // Wizard options
  {
    id: 'long-class-wizard-meditation',
    name: 'Arcane Meditation',
    description: 'Restore one spell slot / major spell use.',
    category: 'class',
    classRestriction: 'Wizard',
    restType: 'long',
  },
  {
    id: 'long-class-wizard-runic',
    name: 'Runic Prep',
    description: 'Your first spell attack or spellcraft check gains +2.',
    category: 'class',
    classRestriction: 'Wizard',
    restType: 'long',
  },
  // Ranger options
  {
    id: 'long-class-ranger-vigil',
    name: 'Wild Vigil',
    description: 'Your first Survival or Tracking check gains +2.',
    category: 'class',
    classRestriction: 'Ranger',
    restType: 'long',
  },
  {
    id: 'long-class-ranger-resolve',
    name: "Hunter's Resolve",
    description: '+5 to your next ranged attack roll.',
    category: 'class',
    classRestriction: 'Ranger',
    restType: 'long',
  },
  // Bard options
  {
    id: 'long-class-bard-encore',
    name: 'Encore Dream',
    description: 'Your first Charisma roll gains ADV.',
    category: 'class',
    classRestriction: 'Bard',
    restType: 'long',
  },
  {
    id: 'long-class-bard-melodic',
    name: 'Melodic Shield',
    description: '+5 to passive Insight.',
    category: 'class',
    classRestriction: 'Bard',
    restType: 'long',
  },
  // Warlock options
  {
    id: 'long-class-warlock-deity',
    name: 'Blessed Deity',
    description: 'Commune with your deity. Gain +6 to your next roll of any kind.',
    category: 'class',
    classRestriction: 'Warlock',
    restType: 'long',
  },
  {
    id: 'long-class-warlock-selfless',
    name: 'Selfless Act',
    description: 'At the cost of 1d20 HP, grant Heroic Inspiration to yourself and one party member. (HP cannot drop below 1.)',
    category: 'class',
    classRestriction: 'Warlock',
    restType: 'long',
  },
  // Barbarian options
  {
    id: 'long-class-barbarian-headbang',
    name: 'Head Bang',
    description: 'Your next unarmed melee attack has +3 to hit and deals +1d20 damage. Roleplay the attack.',
    category: 'class',
    classRestriction: 'Barbarian',
    restType: 'long',
  },
  {
    id: 'long-class-barbarian-berserker',
    name: "Berserker's Rest",
    description: 'Choose three long-rest options to use at the cost of 2 exhaustion and DIS on your next attack roll or saving throw.',
    category: 'class',
    classRestriction: 'Barbarian',
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

/**
 * Get only standard options (for auto-apply display)
 */
export function getStandardRestOptions(restType: 'short' | 'long'): RestOption[] {
  return restType === 'short' ? SHORT_REST_STANDARD_OPTIONS : LONG_REST_STANDARD_OPTIONS;
}

/**
 * Get non-standard options available for selection
 */
export function getNonStandardRestOptions(
  restType: 'short' | 'long',
  race?: string,
  characterClass?: string,
  secondaryRace?: string,
  secondaryClass?: string
): RestOption[] {
  const allAvailable = getAvailableRestOptions(restType, race, characterClass, secondaryRace, secondaryClass);
  return allAvailable.filter(opt => opt.category !== 'standard');
}

/**
 * Get max additional options allowed for rest type
 * Short rest: 1 additional option
 * Long rest: 2 additional options
 */
export function getMaxAdditionalOptions(restType: 'short' | 'long'): number {
  return restType === 'short' ? 1 : 2;
}
