export type Currency = {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
};

export type Tab = 'Home' | 'Pack' | 'Weapons' | 'Body' | 'Quick' | 'Coin' | 'Create' | 'External' | 'Search' | 'Transfer' | 'Merchant' | 'Trade' | 'GM';

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

export interface MerchantItem extends Item {
  sellPrice?: string;  // Price merchant sells for (GM can override)
  buyPrice?: string;   // Price merchant buys for (calculated at 80%)
}

export interface MerchantShop {
  isActive: boolean;
  buybackRate: number; // 0.8 = 80% buyback
  inventory: MerchantItem[];
}

export type TradeItemSource = 'merchant' | 'player1' | 'player2';

export interface TradeItem {
  item: Item;
  source: TradeItemSource;
  destination: TradeItemSource;
}

export interface ActiveTrade {
  id: string;
  type: 'merchant' | 'player-to-player';
  merchantTokenId?: string;     // For merchant trades
  player1TokenId: string;
  player1Id: string;
  player1Name: string;
  player2TokenId?: string;       // For P2P trades
  player2Id?: string;
  player2Name?: string;
  itemsToTrade: TradeItem[];
  netCost: {
    amount: number;
    currency: 'cp' | 'sp' | 'gp' | 'pp';
    owedTo: 'merchant' | 'player1' | 'player2' | 'even';
  };
  status: 'proposing' | 'pending' | 'approved' | 'rejected';
  player1Approved?: boolean;
  player2Approved?: boolean;
  timestamp: number;
}

export interface TradeQueue {
  merchantTokenId: string;
  current?: string;      // Player ID currently trading
  queue: string[];       // Waiting player IDs
}

export interface CharacterData {
  packType: PackType;
  inventory: Item[];
  currency: Currency;
  vaults: Vault[];
  externalStorages: ExternalStorage[];
  favorites: string[];
  gmNotes: string;
  condition: string;
  claimedBy?: string;    // Player ID who claimed this token
  claimingEnabled?: boolean;  // GM controls if token can be claimed
  merchantShop?: MerchantShop;
}