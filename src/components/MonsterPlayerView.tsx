import React from 'react';
import type { CharacterData, MonsterSettings } from '../types';
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
  
  const monsterSettings: MonsterSettings = characterData.monsterSettings || {
    lootEntries: [],
    actionEntries: [],
    lootVisibleToPlayers: false,
    actionsVisibleToPlayers: false,
  };
  
  // Show loot if monster is dead OR GM enabled visibility
  const showLoot = isDead || monsterSettings.lootVisibleToPlayers;
  
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
      
      {/* Loot Section - only if visible */}
      {showLoot && monsterSettings.lootEntries.length > 0 && (
        <div style={{
          marginTop: '24px',
          textAlign: 'left',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{ 
            color: 'var(--accent-gold)', 
            fontSize: '12px', 
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            💰 Loot
          </h3>
          {monsterSettings.lootEntries.map(entry => (
            <div key={entry.id} style={{
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              {entry.content}
            </div>
          ))}
        </div>
      )}
      
      {/* Empty loot message when dead but no loot */}
      {showLoot && monsterSettings.lootEntries.length === 0 && isDead && (
        <div style={{
          marginTop: '24px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          fontSize: '12px'
        }}>
          No loot found
        </div>
      )}
    </div>
  );
};
