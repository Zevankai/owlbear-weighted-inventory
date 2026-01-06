// src/data/spellRepository.ts
import type { RepositorySpell, SpellSchool, SpellCasterClass } from '../types';

/**
 * Complete D&D 5e Spell Repository
 * This is a sample implementation with representative spells from all levels and schools.
 * The full 319-spell repository should replace this data when available.
 */
export const SPELL_REPOSITORY: RepositorySpell[] = [
  // --- CANTRIPS (Level 0) ---
  {
    name: "Acid Splash",
    level: 0,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "60 feet",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "You create an acidic bubble at a point within range, where it explodes in a 5-foot radius. Each creature in that area must succeed on a Dexterity saving throw or take 1d6 acid damage.",
    cantripUpgrade: "The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6)."
  },
  {
    name: "Fire Bolt",
    level: 0,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "120 feet",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried.",
    cantripUpgrade: "This spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10)."
  },
  {
    name: "Mage Hand",
    level: 0,
    school: "conjuration",
    classes: ["bard", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "30 feet",
    components: ["v", "s"],
    duration: "1 minute",
    description: "A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. You can use your action to control the hand. You can use the hand to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour the contents out of a vial."
  },
  {
    name: "Light",
    level: 0,
    school: "evocation",
    classes: ["bard", "cleric", "sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Touch",
    components: ["v", "m"],
    material: "a firefly or phosphorescent moss",
    duration: "1 hour",
    description: "You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action."
  },
  {
    name: "Prestidigitation",
    level: 0,
    school: "transmutation",
    classes: ["bard", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "10 feet",
    components: ["v", "s"],
    duration: "Up to 1 hour",
    description: "This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within range: an instantaneous, harmless sensory effect, light or snuff out a small flame, clean or soil an object, chill/warm/flavor nonliving material, make a small mark appear, or create a trinket or illusory image that fits in your hand."
  },
  {
    name: "Sacred Flame",
    level: 0,
    school: "evocation",
    classes: ["cleric"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "60 feet",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.",
    cantripUpgrade: "The spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8)."
  },
  {
    name: "Eldritch Blast",
    level: 0,
    school: "evocation",
    classes: ["warlock"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "120 feet",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage.",
    cantripUpgrade: "The spell creates more than one beam when you reach higher levels: two beams at 5th level, three beams at 11th level, and four beams at 17th level. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam."
  },
  {
    name: "Guidance",
    level: 0,
    school: "divination",
    classes: ["cleric", "druid"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "Touch",
    components: ["v", "s"],
    duration: "Concentration, up to 1 minute",
    description: "You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check. The spell then ends."
  },
  
  // --- 1ST LEVEL SPELLS ---
  {
    name: "Magic Missile",
    level: 1,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "120 feet",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
    higherLevelSlot: "When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st."
  },
  {
    name: "Shield",
    level: 1,
    school: "abjuration",
    classes: ["sorcerer", "wizard"],
    actionType: "reaction",
    castingTrigger: "which you take when you are hit by an attack or targeted by the magic missile spell",
    concentration: false,
    ritual: false,
    range: "Self",
    components: ["v", "s"],
    duration: "1 round",
    description: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile."
  },
  {
    name: "Cure Wounds",
    level: 1,
    school: "evocation",
    classes: ["bard", "cleric", "druid", "paladin", "ranger"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Touch",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
    higherLevelSlot: "When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st."
  },
  {
    name: "Detect Magic",
    level: 1,
    school: "divination",
    classes: ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: true,
    range: "Self",
    components: ["v", "s"],
    duration: "Concentration, up to 10 minutes",
    description: "For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any."
  },
  {
    name: "Thunderwave",
    level: 1,
    school: "evocation",
    classes: ["bard", "druid", "sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Self (15-foot cube)",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d8 thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn't pushed.",
    higherLevelSlot: "When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st."
  },
  {
    name: "Charm Person",
    level: 1,
    school: "enchantment",
    classes: ["bard", "druid", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "30 feet",
    components: ["v", "s"],
    duration: "1 hour",
    description: "You attempt to charm a humanoid you can see within range. It must make a Wisdom saving throw, and does so with advantage if you or your companions are fighting it. If it fails the saving throw, it is charmed by you until the spell ends or until you or your companions do anything harmful to it. The charmed creature regards you as a friendly acquaintance. When the spell ends, the creature knows it was charmed by you.",
    higherLevelSlot: "When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st. The creatures must be within 30 feet of each other when you target them."
  },

  // --- 2ND LEVEL SPELLS ---
  {
    name: "Fireball",
    level: 3,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "150 feet",
    components: ["v", "s", "m"],
    material: "a tiny ball of bat guano and sulfur",
    duration: "Instantaneous",
    description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren't being worn or carried.",
    higherLevelSlot: "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd."
  },
  {
    name: "Invisibility",
    level: 2,
    school: "illusion",
    classes: ["bard", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "Touch",
    components: ["v", "s", "m"],
    material: "an eyelash encased in gum arabic",
    duration: "Concentration, up to 1 hour",
    description: "A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target's person. The spell ends for a target that attacks or casts a spell.",
    higherLevelSlot: "When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd."
  },
  {
    name: "Hold Person",
    level: 2,
    school: "enchantment",
    classes: ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "60 feet",
    components: ["v", "s", "m"],
    material: "a small, straight piece of iron",
    duration: "Concentration, up to 1 minute",
    description: "Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration. At the end of each of its turns, the target can make another Wisdom saving throw. On a success, the spell ends on the target.",
    higherLevelSlot: "When you cast this spell using a spell slot of 3rd level or higher, you can target one additional humanoid for each slot level above 2nd. The humanoids must be within 30 feet of each other when you target them."
  },
  {
    name: "Misty Step",
    level: 2,
    school: "conjuration",
    classes: ["sorcerer", "warlock", "wizard"],
    actionType: "bonusAction",
    concentration: false,
    ritual: false,
    range: "Self",
    components: ["v"],
    duration: "Instantaneous",
    description: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see."
  },

  // --- 3RD LEVEL SPELLS ---
  {
    name: "Counterspell",
    level: 3,
    school: "abjuration",
    classes: ["sorcerer", "warlock", "wizard"],
    actionType: "reaction",
    castingTrigger: "which you take when you see a creature within 60 feet of you casting a spell",
    concentration: false,
    ritual: false,
    range: "60 feet",
    components: ["s"],
    duration: "Instantaneous",
    description: "You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell's level. On a success, the creature's spell fails and has no effect.",
    higherLevelSlot: "When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used."
  },
  {
    name: "Dispel Magic",
    level: 3,
    school: "abjuration",
    classes: ["bard", "cleric", "druid", "paladin", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "120 feet",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "Choose one creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends. For each spell of 4th level or higher on the target, make an ability check using your spellcasting ability. The DC equals 10 + the spell's level. On a successful check, the spell ends.",
    higherLevelSlot: "When you cast this spell using a spell slot of 4th level or higher, you automatically end the effects of a spell on the target if the spell's level is equal to or less than the level of the spell slot you used."
  },
  {
    name: "Fly",
    level: 3,
    school: "transmutation",
    classes: ["sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "Touch",
    components: ["v", "s", "m"],
    material: "a wing feather from any bird",
    duration: "Concentration, up to 10 minutes",
    description: "You touch a willing creature. The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.",
    higherLevelSlot: "When you cast this spell using a spell slot of 4th level or higher, you can target one additional creature for each slot level above 3rd."
  },

  // --- 4TH LEVEL SPELLS ---
  {
    name: "Polymorph",
    level: 4,
    school: "transmutation",
    classes: ["bard", "druid", "sorcerer", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "60 feet",
    components: ["v", "s", "m"],
    material: "a caterpillar cocoon",
    duration: "Concentration, up to 1 hour",
    description: "This spell transforms a creature that you can see within range into a new form. An unwilling creature must make a Wisdom saving throw to avoid the effect. The spell has no effect on a shapechanger or a creature with 0 hit points. The transformation lasts for the duration, or until the target drops to 0 hit points or dies. The new form can be any beast whose challenge rating is equal to or less than the target's (or the target's level, if it doesn't have a challenge rating)."
  },
  {
    name: "Greater Invisibility",
    level: 4,
    school: "illusion",
    classes: ["bard", "sorcerer", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "Touch",
    components: ["v", "s"],
    duration: "Concentration, up to 1 minute",
    description: "You or a creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target's person."
  },

  // --- 5TH LEVEL SPELLS ---
  {
    name: "Cone of Cold",
    level: 5,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Self (60-foot cone)",
    components: ["v", "s", "m"],
    material: "a small crystal or glass cone",
    duration: "Instantaneous",
    description: "A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw. A creature takes 8d8 cold damage on a failed save, or half as much damage on a successful one. A creature killed by this spell becomes a frozen statue until it thaws.",
    higherLevelSlot: "When you cast this spell using a spell slot of 6th level or higher, the damage increases by 1d8 for each slot level above 5th."
  },
  {
    name: "Wall of Force",
    level: 5,
    school: "evocation",
    classes: ["wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "120 feet",
    components: ["v", "s", "m"],
    material: "a pinch of powder made by crushing a clear gemstone",
    duration: "Concentration, up to 10 minutes",
    description: "An invisible wall of force springs into existence at a point you choose within range. The wall appears in any orientation you choose, as a horizontal or vertical barrier or at an angle. It can be free floating or resting on a solid surface. You can form it into a hemispherical dome or a sphere with a radius of up to 10 feet, or you can shape a flat surface made up of ten 10-foot-by-10-foot panels. Nothing can physically pass through the wall. It is immune to all damage and can't be dispelled by dispel magic."
  },

  // --- 6TH LEVEL SPELLS ---
  {
    name: "Chain Lightning",
    level: 6,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "150 feet",
    components: ["v", "s", "m"],
    material: "a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins",
    duration: "Instantaneous",
    description: "You create a bolt of lightning that arcs toward a target of your choice that you can see within range. Three bolts then leap from that target to as many as three other targets, each of which must be within 30 feet of the first target. A target can be a creature or an object and can be targeted by only one of the bolts. A target must make a Dexterity saving throw. The target takes 10d8 lightning damage on a failed save, or half as much damage on a successful one.",
    higherLevelSlot: "When you cast this spell using a spell slot of 7th level or higher, one additional bolt leaps from the first target to another target for each slot level above 6th."
  },
  {
    name: "Disintegrate",
    level: 6,
    school: "transmutation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "60 feet",
    components: ["v", "s", "m"],
    material: "a lodestone and a pinch of dust",
    duration: "Instantaneous",
    description: "A thin green ray springs from your pointing finger to a target that you can see within range. The target can be a creature, an object, or a creation of magical force, such as the wall created by wall of force. A creature targeted by this spell must make a Dexterity saving throw. On a failed save, the target takes 10d6 + 40 force damage. If this damage reduces the target to 0 hit points, it is disintegrated.",
    higherLevelSlot: "When you cast this spell using a spell slot of 7th level or higher, the damage increases by 3d6 for each slot level above 6th."
  },

  // --- 7TH LEVEL SPELLS ---
  {
    name: "Plane Shift",
    level: 7,
    school: "conjuration",
    classes: ["cleric", "druid", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Touch",
    components: ["v", "s", "m"],
    material: "a forked, metal rod worth at least 250 gp, attuned to a particular plane of existence",
    duration: "Instantaneous",
    description: "You and up to eight willing creatures who link hands in a circle are transported to a different plane of existence. You can specify a target destination in general terms, such as the City of Brass on the Elemental Plane of Fire or the palace of Dispater on the second level of the Nine Hells, and you appear in or near that destination."
  },
  {
    name: "Teleport",
    level: 7,
    school: "conjuration",
    classes: ["bard", "sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "10 feet",
    components: ["v"],
    duration: "Instantaneous",
    description: "This spell instantly transports you and up to eight willing creatures of your choice that you can see within range, or a single object that you can see within range, to a destination you select. If you target an object, it must be able to fit entirely inside a 10-foot cube, and it can't be held or carried by an unwilling creature."
  },

  // --- 8TH LEVEL SPELLS ---
  {
    name: "Dominate Monster",
    level: 8,
    school: "enchantment",
    classes: ["bard", "sorcerer", "warlock", "wizard"],
    actionType: "action",
    concentration: true,
    ritual: false,
    range: "60 feet",
    components: ["v", "s"],
    duration: "Concentration, up to 1 hour",
    description: "You attempt to beguile a creature that you can see within range. It must succeed on a Wisdom saving throw or be charmed by you for the duration. If you or creatures that are friendly to you are fighting it, it has advantage on the saving throw. While the creature is charmed, you have a telepathic link with it as long as the two of you are on the same plane of existence. You can use this telepathic link to issue commands to the creature while you are conscious (no action required), which it does its best to obey.",
    higherLevelSlot: "When you cast this spell with a 9th-level spell slot, the duration is concentration, up to 8 hours."
  },

  // --- 9TH LEVEL SPELLS ---
  {
    name: "Wish",
    level: 9,
    school: "conjuration",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Self",
    components: ["v"],
    duration: "Instantaneous",
    description: "Wish is the mightiest spell a mortal creature can cast. By simply speaking aloud, you can alter the very foundations of reality in accord with your desires. The basic use of this spell is to duplicate any other spell of 8th level or lower. You don't need to meet any requirements in that spell, including costly components. The spell simply takes effect. Alternatively, you can create one of several other effects."
  },
  {
    name: "Meteor Swarm",
    level: 9,
    school: "evocation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "1 mile",
    components: ["v", "s"],
    duration: "Instantaneous",
    description: "Blazing orbs of fire plummet to the ground at four different points you can see within range. Each creature in a 40-foot-radius sphere centered on each point you choose must make a Dexterity saving throw. The sphere spreads around corners. A creature takes 20d6 fire damage and 20d6 bludgeoning damage on a failed save, or half as much damage on a successful one. A creature in the area of more than one fiery burst is affected only once."
  },
  {
    name: "Time Stop",
    level: 9,
    school: "transmutation",
    classes: ["sorcerer", "wizard"],
    actionType: "action",
    concentration: false,
    ritual: false,
    range: "Self",
    components: ["v"],
    duration: "Instantaneous",
    description: "You briefly stop the flow of time for everyone but yourself. No time passes for other creatures, while you take 1d4 + 1 turns in a row, during which you can use actions and move as normal. This spell ends if one of the actions you use during this period, or any effects that you create during this period, affects a creature other than you or an object being worn or carried by someone other than you."
  },
];

/**
 * Search and filter spells based on criteria
 */
export interface SpellFilters {
  query?: string;
  level?: number | null;
  school?: SpellSchool | null;
  class?: SpellCasterClass | null;
  concentration?: boolean;
  ritual?: boolean;
}

export function searchSpells(filters: SpellFilters): RepositorySpell[] {
  let results = [...SPELL_REPOSITORY];

  // Text search (name or description)
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim();
    results = results.filter(spell => 
      spell.name.toLowerCase().includes(query) || 
      spell.description.toLowerCase().includes(query)
    );
  }

  // Level filter
  if (filters.level !== undefined && filters.level !== null) {
    results = results.filter(spell => spell.level === filters.level);
  }

  // School filter
  if (filters.school) {
    results = results.filter(spell => spell.school === filters.school);
  }

  // Class filter
  if (filters.class) {
    results = results.filter(spell => spell.classes.includes(filters.class!));
  }

  // Concentration filter
  if (filters.concentration) {
    results = results.filter(spell => spell.concentration === true);
  }

  // Ritual filter
  if (filters.ritual) {
    results = results.filter(spell => spell.ritual === true);
  }

  return results;
}

/**
 * Get list of unique spell schools
 */
export function getSpellSchools(): SpellSchool[] {
  return ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'];
}

/**
 * Get list of unique caster classes
 */
export function getSpellClasses(): SpellCasterClass[] {
  return ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
}

/**
 * Get display name for spell level
 */
export function getSpellLevelName(level: number): string {
  const names: Record<number, string> = {
    0: 'Cantrip',
    1: '1st Level',
    2: '2nd Level',
    3: '3rd Level',
    4: '4th Level',
    5: '5th Level',
    6: '6th Level',
    7: '7th Level',
    8: '8th Level',
    9: '9th Level',
  };
  return names[level] || `${level}th Level`;
}

/**
 * Get color for spell school (for visual indicators)
 */
export function getSpellSchoolColor(school: SpellSchool): string {
  const colors: Record<SpellSchool, string> = {
    abjuration: '#4A90E2',      // Blue
    conjuration: '#9B59B6',     // Purple
    divination: '#F39C12',      // Orange
    enchantment: '#E91E63',     // Pink
    evocation: '#E74C3C',       // Red
    illusion: '#3498DB',        // Light Blue
    necromancy: '#2C3E50',      // Dark Gray
    transmutation: '#27AE60',   // Green
  };
  return colors[school];
}
