// Inventory Utility Functions
import type { Item } from '../types';

/**
 * Find ration items in an inventory
 * Matches items with "ration" or "food" in the name (case-insensitive)
 */
export const findRationsInInventory = (inventory: Item[]): { item: Item; index: number }[] => {
  return inventory
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => 
      item.name.toLowerCase().includes('ration') ||
      item.name.toLowerCase().includes('food')
    );
};

/**
 * Calculate total ration count in an inventory
 */
export const getTotalRations = (inventory: Item[]): number => {
  const rationItems = findRationsInInventory(inventory);
  return rationItems.reduce((total, { item }) => total + item.qty, 0);
};

/**
 * Deduct rations from inventory, returning the updated inventory
 * Deducts from ration items in order, removing items with 0 quantity
 */
export const deductRationsFromInventory = (inventory: Item[], amount: number): Item[] => {
  let rationsToDeduct = amount;
  const updatedInventory = [...inventory];
  
  for (let i = 0; i < updatedInventory.length && rationsToDeduct > 0; i++) {
    const item = updatedInventory[i];
    if (item.name.toLowerCase().includes('ration') || item.name.toLowerCase().includes('food')) {
      const deductAmount = Math.min(item.qty, rationsToDeduct);
      updatedInventory[i] = { ...item, qty: item.qty - deductAmount };
      rationsToDeduct -= deductAmount;
      
      // Remove item if quantity reaches 0
      if (updatedInventory[i].qty <= 0) {
        updatedInventory.splice(i, 1);
        i--; // Adjust index after removal
      }
    }
  }
  
  return updatedInventory;
};
