import { useMemo } from 'react';
import type { CharacterData } from '../types';
import { PACK_DEFINITIONS, BASE_SLOTS } from '../constants';

export function usePackLogic(data: CharacterData | null) {
  return useMemo(() => {
    if (!data) return null;

    const { packType, inventory, currency } = data;
    
    // Default to Standard pack if packType is missing or invalid
    const packStats = PACK_DEFINITIONS[packType] || PACK_DEFINITIONS['Standard'];

    // --- 1. Calculate Max Slots ---
    const maxSlots = {
      weapon: BASE_SLOTS.weapon + (packStats.slotModifiers.weapon || 0),
      armor: BASE_SLOTS.armor + (packStats.slotModifiers.armor || 0),
      clothing: BASE_SLOTS.clothing + (packStats.slotModifiers.clothing || 0),
      jewelry: BASE_SLOTS.jewelry + (packStats.slotModifiers.jewelry || 0),
      utility: packStats.utilitySlots,
    };

    // --- 2. Calculate Used Slots ---
    const usedSlots = {
      weapon: 0,
      armor: 0,
      clothing: 0,
      jewelry: 0,
      utility: 0,
    };

    let inventoryWeight = 0;

    inventory.forEach((item) => {
      // Only sum weight if the item is NOT equipped
      if (!item.equippedSlot) {
        inventoryWeight += (item.weight * item.qty);
      }

      // Count Slots if equipped
      if (item.equippedSlot && item.equippedSlot in usedSlots) {
        let cost = 1;
        if (item.equippedSlot === 'weapon' && item.category === 'Two-Handed Weapon') cost = 2;
        if (item.equippedSlot === 'armor') {
          if (item.category === 'Medium Armor') cost = 2;
          if (item.category === 'Heavy Armor') cost = 3;
        }
        usedSlots[item.equippedSlot as keyof typeof usedSlots] += cost;
      }
    });

    // --- 3. Calculate Coin Weight ---
    // Rule: Free up to 30 for PLAYERS. 0 Free for STORAGE (NPC pack).
    const totalCoins = currency.cp + currency.sp + currency.gp + currency.pp;
    const freeCoinLimit = packType === 'NPC' ? 0 : 30;
    
    let coinWeight = 0;

    if (totalCoins > freeCoinLimit) {
      const overage = totalCoins - freeCoinLimit;
      coinWeight = Math.ceil(overage / 10);
    }

    // --- 4. Totals ---
    const totalWeight = inventoryWeight + coinWeight;
    const maxCapacity = packStats.capacity;
    const isOverburdened = totalWeight > maxCapacity;

    return {
      maxSlots,
      usedSlots,
      totalWeight,
      inventoryWeight,
      coinWeight,
      totalCoins,
      maxCapacity,
      isOverburdened
    };
  }, [data]);
}