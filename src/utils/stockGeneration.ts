/**
 * Stock Generation Utilities
 * 
 * Functions for generating merchant inventory from shop presets with randomization.
 */

import type { ShopPreset, Item } from '../types';
import type { RepoItem } from '../data/repository';

/**
 * Generate stock items from a shop preset with randomization
 * @param preset The shop preset to generate from
 * @param itemRepository Full item repository to resolve item references
 * @returns Array of items to add to merchant inventory
 */
export function generateStockFromPreset(
  preset: ShopPreset,
  itemRepository: RepoItem[]
): Item[] {
  const generatedItems: Item[] = [];
  
  // Process each item in the preset
  for (const presetItem of preset.items) {
    // Check if item should appear based on stock randomization
    const stockRandomization = preset.stockRandomization ?? 100;
    const shouldAppear = Math.random() * 100 < stockRandomization;
    
    if (!shouldAppear) {
      continue;
    }
    
    // Calculate quantity with variance
    const variance = presetItem.qtyVariance ?? 0;
    const randomOffset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
    const quantity = Math.max(1, presetItem.defaultQty + randomOffset);
    
    // Resolve the item
    let item: Item | null = null;
    
    if (presetItem.repositoryItemId) {
      // Find item in repository by name (RepoItem uses name as unique identifier)
      const repoItem = itemRepository.find(
        (i) => i.name === presetItem.repositoryItemId
      );
      
      if (repoItem) {
        // Convert RepoItem to Item format
        item = {
          id: crypto.randomUUID(),
          name: repoItem.name,
          qty: quantity,
          weight: repoItem.weight,
          value: repoItem.value,
          category: repoItem.category,
          type: repoItem.type,
          requiresAttunement: repoItem.requiresAttunement ?? false,
          isAttuned: false,
          ...(repoItem.damage && { damage: repoItem.damage }),
          ...(repoItem.ac && { ac: repoItem.ac }),
          ...(repoItem.properties && { properties: repoItem.properties }),
        };
      }
    } else if (presetItem.customItem) {
      // Use custom item
      item = {
        id: crypto.randomUUID(),
        name: presetItem.customItem.name ?? 'Unknown Item',
        qty: quantity,
        weight: presetItem.customItem.weight ?? 0,
        value: presetItem.customItem.value ?? '0 gp',
        category: presetItem.customItem.category ?? 'Other',
        type: presetItem.customItem.type ?? 'Misc',
        requiresAttunement: presetItem.customItem.requiresAttunement ?? false,
        isAttuned: presetItem.customItem.isAttuned ?? false,
        ...(presetItem.customItem.damage && { damage: presetItem.customItem.damage }),
        ...(presetItem.customItem.ac && { ac: presetItem.customItem.ac }),
        ...(presetItem.customItem.properties && { properties: presetItem.customItem.properties }),
        ...(presetItem.customItem.charges && { charges: presetItem.customItem.charges }),
        ...(presetItem.customItem.maxCharges && { maxCharges: presetItem.customItem.maxCharges }),
        ...(presetItem.customItem.notes && { notes: presetItem.customItem.notes }),
      };
    }
    
    if (item) {
      generatedItems.push(item);
    }
  }
  
  return generatedItems;
}
