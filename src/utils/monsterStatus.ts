/**
 * Utility functions for determining monster status based on HP
 */

export type MonsterStatus = 'healthy' | 'bloodied' | 'dead';

/**
 * Get the current status of a monster based on HP
 */
export const getMonsterStatus = (currentHP: number, maxHP: number): MonsterStatus => {
  if (currentHP <= 0) return 'dead';
  if (currentHP <= maxHP / 2) return 'bloodied';
  return 'healthy';
};

/**
 * Check if a monster is dead
 */
export const isMonsterDead = (currentHP: number): boolean => currentHP <= 0;

/**
 * Check if a monster is bloodied (HP <= 50% of max but not dead)
 */
export const isMonsterBloodied = (currentHP: number, maxHP: number): boolean => 
  currentHP > 0 && currentHP <= maxHP / 2;
