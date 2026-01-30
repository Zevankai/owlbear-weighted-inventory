import type { PackType, ItemCategory, CharacterData, StorageType, Tab, TokenType } from './types';

export const BASE_SLOTS = {
  weapon: 4,
  armor: 4,
  clothing: 4,
  jewelry: 4,
};

interface PackStats {
  capacity: number;
  utilitySlots: number;
  slotModifiers: Partial<typeof BASE_SLOTS>;
  rules: string[];
}

export const PACK_DEFINITIONS: Record<PackType, PackStats> = {
  NPC: { capacity: 100, utilitySlots: 0, slotModifiers: {}, rules: [] },
  Simple: { capacity: 25, utilitySlots: 3, slotModifiers: {}, rules: [] },
  Standard: { 
    capacity: 55, 
    utilitySlots: 4, 
    slotModifiers: { armor: -1 },
    rules: [] 
  },
  Warrior: { 
    capacity: 30, 
    utilitySlots: 6, 
    slotModifiers: { weapon: 1, armor: 1 }, 
    rules: ['1H Weapon in Utility'] 
  },
  Explorer: { 
    capacity: 30, 
    utilitySlots: 6, 
    slotModifiers: { clothing: 1 }, 
    rules: ['Tool/Kit in Utility'] 
  },
  Tinkerer: { 
    capacity: 20, 
    utilitySlots: 10, 
    slotModifiers: {}, 
    rules: ['Tool/Kit in Utility'] 
  },
  Travel: { 
    capacity: 55, 
    utilitySlots: 8, 
    slotModifiers: { weapon: -2 }, 
    rules: ['Camp Items in Utility'] 
  },
  Shadow: { 
    capacity: 15, 
    utilitySlots: 10, 
    slotModifiers: { armor: -2 }, 
    rules: ['Tool/Kit in Utility', '1H Weapon in Utility'] 
  },
  Mule: { 
    capacity: 150, 
    utilitySlots: 1, 
    slotModifiers: { weapon: -3, armor: -3 }, 
    rules: [] 
  },
  Utility: { 
    capacity: 10, 
    utilitySlots: 14, 
    slotModifiers: {}, 
    rules: ['Items < 2u in Utility'] 
  },
};

// --- STORAGE DEFINITIONS ---
interface StorageStats {
    capacity: number;
    slots: {
        weapon: number;
        armor: number;
    };
    coinCap: number | 'unlimited';
}

export const STORAGE_DEFINITIONS: Record<StorageType, StorageStats> = {
    'Small Pet':     { capacity: 20,   slots: { weapon: 2, armor: 2 }, coinCap: 20 },
    'Large Pet':     { capacity: 100,  slots: { weapon: 2, armor: 4 }, coinCap: 100 },
    'Standard Mount':{ capacity: 150,  slots: { weapon: 0, armor: 2 }, coinCap: 200 },
    'Large Mount':   { capacity: 250,  slots: { weapon: 0, armor: 4 }, coinCap: 500 },
    'Small Cart':    { capacity: 300,  slots: { weapon: 0, armor: 0 }, coinCap: 1000 },
    'Large Cart':    { capacity: 500,  slots: { weapon: 0, armor: 0 }, coinCap: 2000 },
    'Boat':          { capacity: 500,  slots: { weapon: 0, armor: 0 }, coinCap: 2000 },
    'Ship':          { capacity: 2000, slots: { weapon: 0, armor: 0 }, coinCap: 'unlimited' },
    'House':         { capacity: 1000, slots: { weapon: 0, armor: 0 }, coinCap: 'unlimited' },
    'Warehouse':     { capacity: 2000, slots: { weapon: 0, armor: 0 }, coinCap: 'unlimited' },
    'Chest':         { capacity: 100,  slots: { weapon: 0, armor: 0 }, coinCap: 100 },
    'Barrel':        { capacity: 150,  slots: { weapon: 0, armor: 0 }, coinCap: 100 },
};

export const DEFAULT_CATEGORY_WEIGHTS: Record<ItemCategory, number> = {
  'Other': 1,
  'Large': 10,
  'Massive': 50,
  'Tool/Kit': 2,
  'Light Armor': 5,
  'Medium Armor': 8,
  'Heavy Armor': 12,
  'Consumable': 1,
  'Instrument': 2,
  'One-Handed Weapon': 2,
  'Two-Handed Weapon': 4,
  'Clothing': 3,
  'Light Ammo': 1, 
  'Ammo': 1,       
  'Jewelry': 1,
  'Shield': 3,
  'Magic Item': 2,
  'Literature': 1,
  'Camp': 3
};

export const ITEM_CATEGORIES: ItemCategory[] = [
  'One-Handed Weapon',
  'Two-Handed Weapon',
  'Light Armor',
  'Medium Armor',
  'Heavy Armor',
  'Shield',
  'Clothing',
  'Jewelry',
  'Consumable',
  'Tool/Kit',
  'Light Ammo',
  'Ammo',
  'Magic Item',
  'Literature',
  'Camp',
  'Instrument',
  'Other',
  'Large',
  'Massive'
];

export const DEFAULT_CHARACTER_DATA: CharacterData = {
  tokenType: 'player',
  packType: 'Standard',
  inventory: [],
  currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
  vaults: [],
  externalStorages: [],
  favorites: [],
  condition: '',
  claimedBy: undefined,
  claimingEnabled: false,
};

// Room metadata keys for trading
export const ACTIVE_TRADE_KEY = 'com.weighted-inventory/active-trade';

// Popover IDs
export const MAIN_POPOVER_ID = 'com.weighted-inventory.popover';
export const TRADE_POPOVER_ID = 'com.weighted-inventory.trade-window';
export const EXPANDED_POPOVER_ID = 'com.weighted-inventory.expanded-window';

// Default UI dimensions
export const DEFAULT_POPOVER_WIDTH = 800
export const WIDE_POPOVER_WIDTH = 1250;

// Storage types that support equipment slots (weapons, body, quick)
export const STORAGE_TYPES_WITH_EQUIPMENT: StorageType[] = ['Small Pet', 'Large Pet', 'Standard Mount', 'Large Mount'];

// Tab IDs that require equipment slot functionality
export const EQUIPMENT_TAB_IDS: Tab[] = ['Weapons', 'Body', 'Quick'];

// Token type group labels for favorites display
export const TOKEN_TYPE_LABELS: Record<TokenType, string> = {
  player: 'Player Tokens',
  npc: 'NPC Tokens',
  party: 'Party Tokens',
  lore: 'Lore Tokens'
};

// Token type display order for favorites grouping
export const TOKEN_TYPE_ORDER: TokenType[] = ['player', 'npc', 'party', 'lore'];
