export type Currency = {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
};

export type TokenType = 'player' | 'npc' | 'party' | 'lore';

export interface Theme {
  accent: string;
  background: string;
}

export type Tab = 'Home' | 'Pack' | 'Weapons' | 'Body' | 'Quick' | 'Coin' | 'Create' | 'External' | 'Search' | 'Transfer' | 'GM' | 'Reputation' | 'LoreSettings' | 'Spells';

// Lore system types
export type LoreTabId = 
  | 'overview' | 'history' | 'rumors' | 'quests' | 'people' 
  | 'government' | 'geography' | 'economy' | 'culture' | 'dangers'
  | 'menu' | 'secrets' | 'properties' | 'legends'
  | 'members' | 'goals' | 'resources' | 'images' | 'notes';

export type LoreType = 'town' | 'dungeon' | 'tavern' | 'shop' | 'item' | 'faction' | 'region' | 'custom';

// Extended LoreEntry with optional specialized fields for different tab types
export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  visibleToPlayers: boolean;
  createdAt: string;
  order: number;
  
  // Rumors tab fields
  heardFrom?: string;           // Attribution source for rumors
  
  // Quests tab fields
  isCompleted?: boolean;        // Quest completion status
  reward?: string;              // Quest reward
  difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  
  // People tab fields
  portraitUrl?: string;         // Avatar/portrait image URL
  role?: string;                // Role/title of the person
  relationship?: 'ally' | 'neutral' | 'enemy' | 'unknown';
  
  // History tab fields
  date?: string;                // Date/era for timeline
  
  // Dangers tab fields
  threatLevel?: 'low' | 'moderate' | 'high' | 'extreme';
  
  // Services/Menu tab fields
  price?: string;               // Price for services/menu items
  availability?: 'available' | 'limited' | 'unavailable';
  quantity?: string;            // Stock/quantity indicator
  
  // Secrets tab fields
  isRevealed?: boolean;         // Whether secret has been revealed to players
  
  // Members tab fields
  rank?: string;                // Rank within organization
  
  // Goals tab fields
  progress?: number;            // Progress percentage (0-100)
  priority?: 'low' | 'medium' | 'high';
  
  // Images tab fields
  imageUrl?: string;            // URL to an image for the images gallery
  caption?: string;             // Caption for the image
}

export interface LoreTabConfig {
  tabId: LoreTabId;
  enabled: boolean;
  visibleToPlayers: boolean;
  order: number;
  entries: LoreEntry[];
}

export interface LoreSettings {
  loreType: LoreType;
  tabs: LoreTabConfig[];
  allowPlayerEditing?: boolean;  // When true, players can add/edit entries in visible tabs (default: false)
}

export type PackType =
  | 'NPC' | 'Simple' | 'Standard' | 'Warrior' | 'Explorer'
  | 'Tinkerer' | 'Travel' | 'Shadow' | 'Mule' | 'Utility';

export type StorageType = 
  | 'Small Pet' | 'Large Pet' | 'Standard Mount' | 'Large Mount' 
  | 'Small Cart' | 'Large Cart' | 'Boat' | 'Ship' | 'House' | 'Warehouse'
  | 'Chest' | 'Barrel';

export type ItemCategory = 
  | 'Other' | 'Large' | 'Massive' | 'Tool/Kit' | 'Light Armor' 
  | 'Medium Armor' | 'Heavy Armor' | 'Consumable' | 'Instrument' 
  | 'One-Handed Weapon' | 'Two-Handed Weapon' | 'Clothing' 
  | 'Light Ammo' | 'Ammo' | 'Jewelry' | 'Shield' | 'Magic Item' 
  | 'Literature' | 'Camp';

export interface Item {
  id: string;
  name: string;
  value: string;
  category: ItemCategory;
  type: string;
  weight: number;
  qty: number;
  ac?: number;
  damage?: string;
  damageModifier?: string;
  hitModifier?: string;
  properties?: string;
  requiresAttunement: boolean;
  isAttuned: boolean;
  notes?: string;
  equippedSlot?: 'weapon' | 'armor' | 'clothing' | 'jewelry' | 'utility' | null;
  charges?: number;
  maxCharges?: number;
}

export interface Vault {
  id: string;
  name: string;
  currency: Currency; // Updated from 'amount: number'
  isNearby: boolean; 
}

export interface ExternalStorage {
  id: string;
  name: string;
  description: string;
  notes: string; // Added notes field
  type: StorageType;
  inventory: Item[];
  currency: Currency;
  isNearby: boolean;
}

export interface ActiveTrade {
  id: string;
  status: 'pending-acceptance' | 'active' | 'completed' | 'cancelled';
  player1TokenId: string;
  player1Id: string;
  player1Name: string;
  player2TokenId: string;
  player2Id: string;
  player2Name: string;
  player1OfferedItems: Item[];
  player1OfferedCoins: Currency;
  player2OfferedItems: Item[];
  player2OfferedCoins: Currency;
  player1Confirmed: boolean;
  player2Confirmed: boolean;
  timestamp: number;
}

export interface ReputationEntry {
  id: string;              // UUID for React keys
  label: string;           // Player/character name
  value: number;           // 0-100
  visibleToPlayer: boolean; // GM controls per-entry visibility
}

export interface Reputation {
  entries: ReputationEntry[];
  showPartyAverage: boolean; // GM controls if average slider is visible to players
}

// D&D 5e Character Sheet Types
export interface AbilityScore {
  base: number;      // 1-30
  modifier: number;  // Auto-calculated: floor((base - 10) / 2)
}

export interface AbilityScores {
  strength: AbilityScore;
  dexterity: AbilityScore;
  constitution: AbilityScore;
  intelligence: AbilityScore;
  wisdom: AbilityScore;
  charisma: AbilityScore;
}

// Skill proficiency levels: none, half, proficient, mastery (expertise)
export type SkillProficiencyLevel = 'none' | 'half' | 'proficient' | 'mastery';

export interface SkillProficiency {
  proficiencyLevel: SkillProficiencyLevel;
  bonus: number;
  // Legacy support - keep proficient for backwards compatibility
  proficient?: boolean;
}

export interface Skills {
  // Strength
  athletics: SkillProficiency;
  // Dexterity
  acrobatics: SkillProficiency;
  sleightOfHand: SkillProficiency;
  stealth: SkillProficiency;
  // Intelligence
  arcana: SkillProficiency;
  history: SkillProficiency;
  investigation: SkillProficiency;
  nature: SkillProficiency;
  religion: SkillProficiency;
  // Wisdom
  animalHandling: SkillProficiency;
  insight: SkillProficiency;
  medicine: SkillProficiency;
  perception: SkillProficiency;
  survival: SkillProficiency;
  // Charisma
  deception: SkillProficiency;
  intimidation: SkillProficiency;
  performance: SkillProficiency;
  persuasion: SkillProficiency;
}

export interface HitPoints {
  current: number;
  max: number;
  temp: number;
}

// Spell types for spell management
export interface Spell {
  id: string;
  name: string;
  level: number;       // 0 for cantrips, 1-9 for spell levels
  description: string;
  prepared?: boolean;  // Is this spell currently prepared/equipped?
}

export interface SpellSlots {
  max: number;
  used: number;
}

export interface SpellManagement {
  knownSpells: Spell[];
  spellSlots: Record<number, SpellSlots>;  // Key is spell level (1-9), value is slots info
  useCustomSlots: boolean;  // If true, use custom slot values instead of auto-calculated
}

export interface CharacterSheet {
  // Character Info
  gender: string;
  race: string;
  characterClass: string;  // 'class' is reserved
  level: number;
  
  // Ability Scores
  abilityScores: AbilityScores;
  
  // Skills
  skills: Skills;
  pinnedSkills: string[];  // Array of skill keys (max 5) for quick reference
  
  // Combat Stats
  hitPoints: HitPoints;
  armorClass: number;
  initiative: number;
  proficiencyBonus: number;
  speed: number;
  
  // Passive Scores
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  
  // Misc
  heroicInspiration: boolean;
  defenses: string;      // Text field for immunities/resistances
  conditions: string;    // Text field for active conditions
  languages: string;     // Text field for known languages
  
  // Spells
  spellManagement?: SpellManagement;
}

export interface CharacterData {
  tokenType: TokenType;  // Type of token: player (default), npc, party, or lore
  packType: PackType;
  inventory: Item[];
  currency: Currency;
  vaults: Vault[];
  externalStorages: ExternalStorage[];
  favorites: string[];
  condition: string;
  claimedBy?: string;    // Player ID who claimed this token
  claimingEnabled?: boolean;  // GM controls if token can be claimed
  reputation?: Reputation;  // NPC reputation tracking (only for packType === 'NPC')
  theme?: Theme;  // Per-token theme colors (everyone sees the same theme for this token)
  coverPhotoUrl?: string;  // URL to an externally hosted cover/banner image
  loreContent?: string;   // Main lore text for lore tokens
  gmNotes?: string;       // GM-only notes (hidden from players)
  loreSettings?: LoreSettings;  // Lore system settings (only for tokenType === 'lore')
  name?: string;  // Custom display name (overrides token name, GM-editable for lore tokens)
  characterSheet?: CharacterSheet;  // D&D 5e character sheet (optional for backwards compatibility)
}
