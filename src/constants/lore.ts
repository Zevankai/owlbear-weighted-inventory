import type { LoreTabId, LoreType, LoreTabConfig } from '../types';

// All available lore tab definitions
export const LORE_TAB_DEFINITIONS: Record<LoreTabId, { label: string; description: string }> = {
  overview: { label: 'Overview', description: 'Main description (ALWAYS ON, is the Home tab)' },
  history: { label: 'History', description: 'Timeline, past events, founding' },
  rumors: { label: 'Rumors', description: 'Hearsay, gossip, unverified info' },
  quests: { label: 'Quests', description: 'Available quests, objectives, rewards' },
  people: { label: 'People', description: 'Notable NPCs, contacts, figures' },
  government: { label: 'Government', description: 'Political structure, laws, leaders' },
  geography: { label: 'Geography', description: 'Maps, terrain, climate, landmarks' },
  economy: { label: 'Economy', description: 'Trade goods, currency, merchants' },
  culture: { label: 'Culture', description: 'Customs, religions, festivals' },
  dangers: { label: 'Dangers', description: 'Monsters, hazards, hostile factions' },
  menu: { label: 'Menu', description: 'What they sell/offer (shops, taverns)' },
  secrets: { label: 'Secrets', description: 'Hidden info (often GM-only)' },
  properties: { label: 'Properties', description: 'Stats, abilities (for items)' },
  legends: { label: 'Legends', description: 'Myths, stories surrounding it' },
  members: { label: 'Members', description: 'Key figures, ranks (factions)' },
  goals: { label: 'Goals', description: 'Objectives, motivations' },
  resources: { label: 'Resources', description: 'What they control' },
  images: { label: 'Images', description: 'Gallery of image links' },
  notes: { label: 'Notes', description: 'General notes' },
};

// All lore tab IDs in order
export const ALL_LORE_TAB_IDS: LoreTabId[] = [
  'overview', 'history', 'rumors', 'quests', 'people',
  'government', 'geography', 'economy', 'culture', 'dangers',
  'menu', 'secrets', 'properties', 'legends',
  'members', 'goals', 'resources', 'images', 'notes'
];

// Presets for quick setup
export const LORE_PRESETS: Record<LoreType, LoreTabId[]> = {
  town: ['overview', 'history', 'people', 'government', 'rumors', 'quests', 'economy'],
  dungeon: ['overview', 'history', 'dangers', 'secrets', 'rumors', 'legends'],
  tavern: ['overview', 'people', 'rumors', 'menu', 'secrets'],
  item: ['overview', 'history', 'properties', 'legends', 'secrets'],
  faction: ['overview', 'history', 'members', 'goals', 'resources'],
  region: ['overview', 'history', 'geography', 'culture', 'government', 'economy', 'dangers'],
  custom: ['overview'],
};

// Lore type labels for display
export const LORE_TYPE_LABELS: Record<LoreType, string> = {
  town: 'Town',
  dungeon: 'Dungeon',
  tavern: 'Tavern',
  item: 'Item',
  faction: 'Faction',
  region: 'Region',
  custom: 'Custom',
};

// Helper to generate default lore settings with all tabs defined but only specified ones enabled
export function generateDefaultLoreSettings(enabledTabs: LoreTabId[] = ['overview']): LoreTabConfig[] {
  return ALL_LORE_TAB_IDS.map((tabId, index) => ({
    tabId,
    enabled: enabledTabs.includes(tabId),
    visibleToPlayers: true,
    order: index,
    entries: [],
  }));
}

// Helper to generate lore settings from a preset
export function generateLoreSettingsFromPreset(loreType: LoreType): LoreTabConfig[] {
  const enabledTabs = LORE_PRESETS[loreType];
  return ALL_LORE_TAB_IDS.map((tabId, index) => ({
    tabId,
    enabled: enabledTabs.includes(tabId),
    visibleToPlayers: true,
    order: enabledTabs.includes(tabId) ? enabledTabs.indexOf(tabId) : index + 100,
    entries: [],
  }));
}
