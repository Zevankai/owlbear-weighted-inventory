import React from 'react';
import type { CharacterData } from '../types';
import { createDefaultCharacterSheet } from '../utils/characterSheet';

interface MonsterPlayerViewProps {
  tokenImage: string | null;
  tokenName: string | null;
  characterData: CharacterData;
}

export const MonsterPlayerView: React.FC<MonsterPlayerViewProps> = ({
  tokenImage,
  tokenName,
  characterData,
}) => {
  const sheet = characterData.characterSheet || createDefaultCharacterSheet();
  const currentHP = sheet.hitPoints.current;
  const maxHP = sheet.hitPoints.max;
  const isDead = currentHP <= 0;
  const isBloodied = currentHP > 0 && currentHP <= maxHP / 2;
  
  return (
    <div className="section" style={{ textAlign: 'center', padding: '24px' }}>
      {/* Circular Token Image */}
      {tokenImage && (
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #e53935',
          margin: '0 auto 16px auto'
        }}>
          <img 
            src={tokenImage} 
            alt={tokenName || 'Monster'} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
      )}
      
      {/* Monster Name */}
      <h2 style={{ color: '#e53935', margin: '0 0 12px 0' }}>
        {characterData.name || tokenName || 'Unknown Creature'}
      </h2>
      
      {/* Monster Type Label */}
      <div style={{ 
        fontSize: '10px', 
        color: '#e53935', 
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '16px'
      }}>
        Monster
      </div>
      
      {/* Bloodied Status */}
      {isBloodied && (
        <div style={{ 
          color: '#ff5722', 
          background: 'rgba(255, 87, 34, 0.2)',
          border: '1px solid rgba(255, 87, 34, 0.4)',
          padding: '10px 20px',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          🩸 BLOODIED
        </div>
      )}
      
      {/* Dead Status */}
      {isDead && (
        <div style={{ 
          color: '#888', 
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 20px',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          💀 DEAD
        </div>
      )}
      
      {/* Info message about Pack tab */}
      <div style={{
        marginTop: '24px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: '12px'
      }}>
        {characterData.monsterSettings?.inventoryVisibleToPlayers 
          ? 'Switch to the Pack tab to view and loot items'
          : 'Inventory is not visible'}
      </div>
    </div>
  );
};
