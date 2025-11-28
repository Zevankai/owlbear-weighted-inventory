export type Currency = {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
};

export interface Theme {
  accent: string;
  background: string;
}

export type Tab = 'Home' | 'Pack' | 'Weapons' | 'Body' | 'Quick' | 'Coin' | 'Create' | 'External' | 'Search' | 'Transfer' | 'GM' | 'Reputation';

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

export interface CharacterData {
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
}
