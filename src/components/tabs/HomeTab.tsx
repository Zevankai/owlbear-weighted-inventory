import { useState, useMemo } from 'react';
import type { CharacterData, PackType, ActiveTrade, CharacterStats, ConditionType, RestType, GMCustomizations } from '../../types';
import { ReputationDisplay } from '../ReputationDisplay';
import { DebouncedInput, DebouncedTextarea } from '../DebouncedInput';
import { CharacterSheetSection } from '../CharacterSheet';
import { CollapsibleSection } from '../CollapsibleSection';
import { PinnedSkillsBar } from '../PinnedSkillsBar';
import { ConditionsPanel } from '../ConditionsPanel';
import { ExhaustionMeter } from '../ExhaustionMeter';
import { RestModal } from '../RestModal';
import { createDefaultCharacterSheet } from '../../utils/characterSheet';
import { createDefaultExhaustionState, createDefaultRestHistory, createDefaultCharacterStats } from '../../utils/characterStats';
import { createDefaultConditions } from '../../data/conditions';

// Token image sizing constants
const TOKEN_SIZE_EDITABLE = '160px';
const TOKEN_SIZE_READONLY = '160px';

// Description box width constants
const DESCRIPTION_WIDTH_EDITABLE = '100%';

// Markdown formatting hint component
const MarkdownHint = () => (
  <span style={{fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic'}}>
    Supports: **bold**, *italic*, __underline__, ~~strikethrough~~, [links](url)
  </span>
);

// Helper function to get HP color class based on current/max ratio
const getHpColorClass = (current: number, max: number): string => {
  if (max <= 0) return '';
  const ratio = current / max;
  if (ratio > 0.5) return 'hp-healthy';
  if (ratio > 0.25) return 'hp-wounded';
  return 'hp-critical';
};

// Combat Stats Header Component - Always visible quick reference
interface CombatStatsHeaderProps {
  hp: { current: number; max: number; temp: number };
  ac: number;
  initiative: number;
  level: number;
  canEdit: boolean;
  onLevelChange: (level: number) => void;
}

const CombatStatsHeader = ({ hp, ac, initiative, level, canEdit, onLevelChange }: CombatStatsHeaderProps) => {
  const hpColorClass = getHpColorClass(hp.current, hp.max);
  // Ensure level defaults to 1 if undefined or 0
  const displayLevel = level || 1;
  
  return (
    <div className="combat-stats-header">
      {/* Level Display - Prominent badge */}
      <div className="combat-stat-box level-badge">
        <span className="combat-stat-label">Level</span>
        {canEdit ? (
          <input
            type="number"
            value={displayLevel}
            onChange={(e) => {
              const newLevel = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
              onLevelChange(newLevel);
            }}
            className="level-input"
            min={1}
            max={20}
          />
        ) : (
          <span className="combat-stat-value level-value">{displayLevel}</span>
        )}
      </div>
      
      {/* HP Display */}
      <div className="combat-stat-box">
        <span className="combat-stat-label">HP</span>
        <span className={`combat-stat-value ${hpColorClass}`}>
          {hp.current}/{hp.max}
        </span>
        {hp.temp > 0 && (
          <span className="combat-stat-secondary">+{hp.temp} temp</span>
        )}
      </div>
      
      {/* AC Display */}
      <div className="combat-stat-box">
        <span className="combat-stat-label">AC</span>
        <span className="combat-stat-value">{ac}</span>
      </div>
      
      {/* Initiative Display */}
      <div className="combat-stat-box">
        <span className="combat-stat-label">Initiative</span>
        <span className="combat-stat-value">
          {initiative >= 0 ? `+${initiative}` : initiative}
        </span>
      </div>
    </div>
  );
};

interface Stats {
  totalWeight: number;
  maxCapacity: number;
  coinWeight: number;
  totalCoins: number;
  usedSlots: {
    weapon: number;
    armor: number;
    clothing: number;
    jewelry: number;
    utility: number;
  };
  maxSlots: {
    weapon: number;
    armor: number;
    clothing: number;
    jewelry: number;
    utility: number;
  };
}

interface StorageDef {
  capacity: number;
}

interface HomeTabProps {
  stats: Stats;
  viewingStorageId: string | null;
  setShowSettings: (show: boolean) => void;
  loadDebugInfo: () => void;
  characterData: CharacterData;
  playerRole: string;
  playerId: string | null;
  tokenImage: string | null;
  tokenName: string | null;
  toggleFavorite: () => void;
  isFavorited: boolean;
  favorites: Array<{ id: string; name: string }>;
  setViewingFavorites: (viewing: boolean) => void;
  activeTrade: ActiveTrade | null;
  tokenId: string | null;
  canEditToken: () => boolean;
  claimToken: () => Promise<boolean | undefined>;
  unclaimToken: () => void;
  handleUpdateData: (updates: Partial<CharacterData>) => void;
  onOpenTradePartnerModal?: () => void;
  updateData: (updates: Partial<CharacterData>) => void;
  PACK_DEFINITIONS: Record<string, { capacity: number; utilitySlots: number }>;
  currentDisplayData: CharacterData;
  activeStorageDef: StorageDef | null;
  hasClaimedToken?: boolean;
  showCoverPhoto?: boolean;
  showTokenProfile?: boolean;
  gmCustomizations?: GMCustomizations;
}

export function HomeTab({
  stats,
  viewingStorageId,
  setShowSettings,
  loadDebugInfo,
  characterData,
  playerRole,
  playerId,
  tokenImage,
  tokenName,
  toggleFavorite,
  isFavorited,
  favorites,
  setViewingFavorites,
  activeTrade,
  tokenId,
  canEditToken,
  claimToken,
  unclaimToken,
  handleUpdateData,
  onOpenTradePartnerModal,
  updateData,
  PACK_DEFINITIONS,
  currentDisplayData,
  activeStorageDef,
  hasClaimedToken,
  showCoverPhoto = true,
  showTokenProfile = true,
  gmCustomizations
}: HomeTabProps) {
  // State for Rest Modal
  const [showRestModal, setShowRestModal] = useState(false);
  
  // Helper to check if user can edit this token (GM, owner, or party token)
  const canUserEdit = playerRole === 'GM' || characterData.claimedBy === playerId || characterData.tokenType === 'party';
  
  // Get character stats with defaults - memoize to avoid recreating on every render
  const characterStats = characterData.characterStats;
  const defaultStats = useMemo(() => createDefaultCharacterStats(), []);
  
  // Helper to update character stats
  const updateCharacterStats = (updates: Partial<CharacterStats>) => {
    const currentStats = characterStats || defaultStats;
    updateData({
      characterStats: {
        ...currentStats,
        ...updates,
      }
    });
  };
  
  // Toggle heroic inspiration
  const toggleHeroicInspiration = () => {
    if (!canUserEdit) return;
    const currentStats = characterStats || defaultStats;
    updateCharacterStats({ heroicInspiration: !currentStats.heroicInspiration });
  };
  
  // Update condition
  const updateCondition = (conditionType: ConditionType, value: boolean) => {
    const currentStats = characterStats || defaultStats;
    updateCharacterStats({
      conditions: {
        ...currentStats.conditions,
        [conditionType]: value,
      }
    });
  };
  
  // Update exhaustion level
  const updateExhaustionLevel = (level: number) => {
    const currentStats = characterStats || defaultStats;
    updateCharacterStats({
      exhaustion: {
        ...currentStats.exhaustion,
        currentLevel: level,
      }
    });
  };
  
  // Handle rest completion
  const handleRest = (restType: RestType, selectedOptionIds: string[]) => {
    const currentStats = characterStats || defaultStats;
    const now = Date.now();
    
    if (restType === 'short') {
      updateCharacterStats({
        restHistory: {
          ...currentStats.restHistory,
          lastShortRest: {
            timestamp: now,
            chosenOptionIds: selectedOptionIds,
          }
        }
      });
    } else {
      // Long rest: also potentially grant heroic inspiration
      updateCharacterStats({
        heroicInspiration: true,
        restHistory: {
          ...currentStats.restHistory,
          lastLongRest: {
            timestamp: now,
            chosenOptionIds: selectedOptionIds,
          },
          heroicInspirationGainedToday: true,
        }
      });
    }
  };
  
  // Check if character is overencumbered
  const isOverencumbered = stats.totalWeight > stats.maxCapacity;
  const overencumberedAmount = isOverencumbered ? stats.totalWeight - stats.maxCapacity : 0;
  const overencumberedText = gmCustomizations?.overencumberedText || '-3 to all DEX & STR rolls, -10 movement per 10 units over';
  
  // Helper to check if trade button should be shown
  const showTradeButton = !activeTrade && tokenId && 
    (characterData.claimedBy || characterData.tokenType === 'party') && 
    onOpenTradePartnerModal;

  return (
    <div className="section" style={{flex: 1, display: 'flex', flexDirection: 'column', width: '100%', paddingRight: '8px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h2>{viewingStorageId ? 'Storage Stats' : 'Dashboard'}</h2>
        {/* Action buttons - star, list, and debug icons */}
        <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
          {!viewingStorageId && (
            <>
              {/* Favorite star button */}
              <button
                onClick={toggleFavorite}
                style={{
                  background: 'transparent',
                  color: isFavorited ? 'var(--accent-gold)' : '#666',
                  border: '1px solid #333',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorited ? '⭐' : '☆'}
              </button>
              {/* View favorites list button */}
              {(favorites.length > 0 || hasClaimedToken) && (
                <button
                  onClick={() => setViewingFavorites(true)}
                  style={{
                    background: 'transparent',
                    color: 'var(--accent-gold)',
                    border: '1px solid #333',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'normal'
                  }}
                  title="View all favorite tokens"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              )}
            </>
          )}
          {/* Settings button - only show for users who can edit the token */}
          {canEditToken() && (
            <button
              onClick={() => { setShowSettings(true); loadDebugInfo(); }}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #333',
                padding: '2px 6px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '9px',
                fontWeight: 'normal'
              }}
              title="Settings"
            >
              ⚙
            </button>
          )}
        </div>
      </div>

      {/* --- TOKEN PROFILE WITH COVER PHOTO --- */}
      {!viewingStorageId && showTokenProfile && (
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          marginBottom: '12px',
          minHeight: '280px',
          paddingBottom: '24px'
        }}>
          {/* Cover photo as background */}
          {showCoverPhoto && characterData.coverPhotoUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${characterData.coverPhotoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.7,
            }} />
          )}
          {/* Gradient overlay for readability */}
          {showCoverPhoto && characterData.coverPhotoUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
            }} />
          )}
          {/* Token image and info on top */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: showCoverPhoto && characterData.coverPhotoUrl ? '20px 16px 16px 16px' : '8px 0',
            minHeight: showCoverPhoto && characterData.coverPhotoUrl ? '200px' : undefined
          }}>
            {/* Token Image with Heroic Inspiration border */}
            {tokenImage && (
              <div 
                onClick={canUserEdit && characterData.tokenType !== 'lore' ? toggleHeroicInspiration : undefined}
                style={{
                  position: 'relative',
                  width: canEditToken() ? TOKEN_SIZE_EDITABLE : TOKEN_SIZE_READONLY,
                  height: canEditToken() ? TOKEN_SIZE_EDITABLE : TOKEN_SIZE_READONLY,
                  cursor: canUserEdit && characterData.tokenType !== 'lore' ? 'pointer' : 'default',
                }}
                title={canUserEdit && characterData.tokenType !== 'lore' ? 
                  (characterStats?.heroicInspiration ? 'Click to remove Heroic Inspiration' : 'Click to grant Heroic Inspiration') : undefined}
              >
                {/* Gold glow for Heroic Inspiration */}
                {characterStats?.heroicInspiration && characterData.tokenType !== 'lore' && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0) 70%)',
                    animation: 'pulse 2s infinite',
                  }} />
                )}
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: characterStats?.heroicInspiration && characterData.tokenType !== 'lore'
                    ? '4px solid gold'
                    : '3px solid var(--accent-gold)',
                  background: 'transparent',
                  boxShadow: characterStats?.heroicInspiration && characterData.tokenType !== 'lore'
                    ? '0 0 20px rgba(255, 215, 0, 0.6), 0 4px 12px rgba(0,0,0,0.5)'
                    : (showCoverPhoto && characterData.coverPhotoUrl ? '0 4px 12px rgba(0,0,0,0.5)' : undefined),
                  transition: 'all 0.3s ease',
                }}>
                  <img
                    src={tokenImage}
                    alt="Token"
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </div>
                {/* Heroic Inspiration indicator */}
                {characterStats?.heroicInspiration && characterData.tokenType !== 'lore' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    background: 'gold',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}>
                    ✨
                  </div>
                )}
              </div>
            )}
            
            {/* Token Name - GM can edit for lore tokens */}
            {playerRole === 'GM' && characterData.tokenType === 'lore' ? (
              <DebouncedInput
                value={characterData.name || tokenName || ''}
                onChange={(val) => updateData({ name: val })}
                className="search-input"
                placeholder="Enter token name..."
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  textShadow: showCoverPhoto && characterData.coverPhotoUrl ? '0 2px 4px rgba(0,0,0,0.8)' : undefined,
                  background: 'transparent',
                  border: '1px dashed var(--accent-gold)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  width: '80%',
                  maxWidth: '300px',
                  marginTop: '8px',
                }}
              />
            ) : (
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--text-main)',
                textAlign: 'center',
                textShadow: showCoverPhoto && characterData.coverPhotoUrl ? '0 2px 4px rgba(0,0,0,0.8)' : undefined,
                paddingBottom: '4px',
                marginTop: '8px',
              }}>
                {characterData.name || tokenName || 'Unknown Character'}
              </div>
            )}

            {/* Race, Class, Level display - only for non-lore tokens */}
            {characterData.tokenType !== 'lore' && characterStats && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                textShadow: showCoverPhoto && characterData.coverPhotoUrl ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                marginTop: '4px',
              }}>
                <span>{characterStats.race}</span>
                <span>•</span>
                <span>{characterStats.characterClass}</span>
                <span>•</span>
                <span>Level {characterStats.level || 1}</span>
              </div>
            )}

            {/* Token Type Badge - only show for non-player tokens */}
            {characterData.tokenType && characterData.tokenType !== 'player' && (
              <div style={{
                fontSize: '9px',
                color: characterData.tokenType === 'npc' ? '#ff9800' : 
                       characterData.tokenType === 'party' ? '#4caf50' : 
                       '#9c27b0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textAlign: 'center',
                textShadow: showCoverPhoto && characterData.coverPhotoUrl ? '0 1px 2px rgba(0,0,0,0.8)' : undefined,
                marginTop: '4px',
              }}>
                {characterData.tokenType} Token
              </div>
            )}

          </div>
        </div>
      )}

      {/* Start P2P Trade Button - MOVED OUTSIDE/below cover photo */}
      {!viewingStorageId && showTokenProfile && characterData && showTradeButton && (
        <div style={{marginBottom: '12px', textAlign: 'center'}}>
          <button
            onClick={onOpenTradePartnerModal}
            style={{
              background: '#4a9eff',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            TRADE
          </button>
        </div>
      )}

      {/* === COMBAT STATS HEADER - Always visible for player/party tokens and NPC tokens (GM only) === */}
      {(() => {
        // Show for player tokens, party tokens, or NPC tokens when user is GM
        const showCharacterSheet = characterData.tokenType !== 'lore' && 
          (characterData.tokenType !== 'npc' || playerRole === 'GM');
        const shouldShowCombatStats = !viewingStorageId && showCharacterSheet;
        
        if (!shouldShowCombatStats) return null;
        
        const sheet = characterData.characterSheet || createDefaultCharacterSheet();
        
        const handleLevelChange = (newLevel: number) => {
          updateData({
            characterSheet: {
              ...sheet,
              level: newLevel,
            },
          });
        };

        // Handler for pinned skill click - scrolls to skills section
        const handlePinnedSkillClick = () => {
          // Placeholder: In the future this could scroll to the skill in the skills section
          // For now it just provides visual feedback
        };
        
        return (
          <>
            <CombatStatsHeader
              hp={sheet.hitPoints}
              ac={sheet.armorClass}
              initiative={sheet.initiative}
              level={sheet.level}
              canEdit={canUserEdit}
              onLevelChange={handleLevelChange}
            />
            {/* Pinned Skills Bar - shown below combat stats */}
            <PinnedSkillsBar
              sheet={sheet}
              onSkillClick={handlePinnedSkillClick}
            />
          </>
        );
      })()}

      {/* === HP SECTION - Editable HP display for non-lore tokens === */}
      {!viewingStorageId && characterData.tokenType !== 'lore' && (characterData.tokenType !== 'npc' || playerRole === 'GM') && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--glass-border)',
          marginBottom: '12px',
        }}>
          <h3 style={{
            margin: '0 0 10px 0',
            fontSize: '11px',
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            ❤️ Hit Points
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Current</label>
              <input
                type="number"
                value={characterStats?.currentHp ?? characterData.characterSheet?.hitPoints?.current ?? 0}
                onChange={(e) => {
                  if (canUserEdit) {
                    updateCharacterStats({ currentHp: parseInt(e.target.value) || 0 });
                  }
                }}
                className="search-input"
                disabled={!canUserEdit}
                style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', marginTop: '14px', fontSize: '16px' }}>/</span>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Max</label>
              <input
                type="number"
                value={characterStats?.maxHp ?? characterData.characterSheet?.hitPoints?.max ?? 0}
                onChange={(e) => {
                  if (canUserEdit) {
                    updateCharacterStats({ maxHp: parseInt(e.target.value) || 0 });
                  }
                }}
                className="search-input"
                disabled={!canUserEdit}
                style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', marginTop: '14px', fontSize: '16px' }}>+</span>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Temp</label>
              <input
                type="number"
                value={characterStats?.tempHp ?? characterData.characterSheet?.hitPoints?.temp ?? 0}
                onChange={(e) => {
                  if (canUserEdit) {
                    updateCharacterStats({ tempHp: parseInt(e.target.value) || 0 });
                  }
                }}
                className="search-input"
                disabled={!canUserEdit}
                style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#4dabf7' }}
              />
            </div>
          </div>
          
          {/* Armor Class */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 0 }}>
              <label style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>AC</label>
              <input
                type="number"
                value={characterStats?.armorClass ?? characterData.characterSheet?.armorClass ?? 10}
                onChange={(e) => {
                  if (canUserEdit) {
                    updateCharacterStats({ armorClass: parseInt(e.target.value) || 10 });
                  }
                }}
                className="search-input"
                disabled={!canUserEdit}
                style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', width: '60px' }}
              />
            </div>
            
            {/* Rest Button */}
            <button
              onClick={() => setShowRestModal(true)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 87, 34, 0.2))',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                color: '#ff9800',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              🏕️ Take a Rest
            </button>
          </div>
        </div>
      )}

      {/* === OVERENCUMBERED WARNING === */}
      {!viewingStorageId && isOverencumbered && characterData.tokenType !== 'lore' && (
        <div style={{
          background: 'rgba(255, 87, 34, 0.15)',
          borderRadius: '8px',
          padding: '10px 12px',
          border: '1px solid rgba(255, 87, 34, 0.4)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff5722' }}>
              OVERENCUMBERED (+{overencumberedAmount} units)
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {overencumberedText}
            </div>
          </div>
        </div>
      )}

      {/* === CONDITIONS PANEL (Compact) - Show active conditions === */}
      {!viewingStorageId && characterData.tokenType !== 'lore' && characterStats && (characterData.tokenType !== 'npc' || playerRole === 'GM') && (
        <ConditionsPanel
          conditions={characterStats.conditions}
          onConditionChange={updateCondition}
          canEdit={canUserEdit}
          compact={true}
        />
      )}

      {/* === CONDITIONS & EXHAUSTION - Collapsible section === */}
      {!viewingStorageId && characterData.tokenType !== 'lore' && (characterData.tokenType !== 'npc' || playerRole === 'GM') && (
        <CollapsibleSection title="Conditions & Exhaustion" defaultExpanded={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Full Conditions Panel */}
            <ConditionsPanel
              conditions={characterStats?.conditions || createDefaultConditions()}
              onConditionChange={updateCondition}
              canEdit={canUserEdit}
            />
            
            {/* Exhaustion Meter */}
            <ExhaustionMeter
              exhaustion={characterStats?.exhaustion || createDefaultExhaustionState()}
              onExhaustionChange={updateExhaustionLevel}
              canEdit={canUserEdit}
              customEffects={gmCustomizations?.exhaustionEffects}
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Rest Modal */}
      <RestModal
        isOpen={showRestModal}
        onClose={() => setShowRestModal(false)}
        race={characterStats?.race}
        characterClass={characterStats?.characterClass}
        secondaryRace={characterStats?.secondaryRace}
        secondaryClass={characterStats?.secondaryClass}
        level={characterStats?.level || 1}
        restHistory={characterStats?.restHistory || createDefaultRestHistory()}
        onRest={handleRest}
        gmRestRulesMessage={gmCustomizations?.restRulesMessage}
        customRestOptions={gmCustomizations?.customRestOptions}
        disabledRestOptionIds={gmCustomizations?.disabledRestOptions}
      />

      {/* === LORE TOKEN SPECIFIC UI === */}
      {!viewingStorageId && characterData.tokenType === 'lore' && (
        <>
          {/* Main Lore Content - large text area */}
          <div style={{marginTop: '12px', width: DESCRIPTION_WIDTH_EDITABLE, alignSelf: 'stretch'}}>
            <label style={{display:'block', fontSize:'10px', color:'#9c27b0', textTransform:'uppercase', fontWeight: 'bold', marginBottom: '6px'}}>
              📜 Lore Content
            </label>
            {/* Uses condition as fallback for backward compatibility with existing lore tokens that may have content stored in condition field */}
            <DebouncedTextarea
              value={characterData.loreContent || characterData.condition || ''}
              onChange={(val) => {
                if (playerRole === 'GM') {
                  updateData({ loreContent: val });
                }
              }}
              className="search-input"
              rows={8}
              disabled={playerRole !== 'GM'}
              placeholder="Enter lore, history, or information here..."
              style={{
                width: '100%',
                minHeight: '200px',
                resize: 'vertical',
                boxSizing: 'border-box',
                opacity: 1,
                cursor: playerRole === 'GM' ? 'text' : 'default',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            />
            {playerRole === 'GM' && <MarkdownHint />}
          </div>

          {/* GM-only Notes Section */}
          {playerRole === 'GM' && (
            <div style={{marginTop: '16px', width: DESCRIPTION_WIDTH_EDITABLE, alignSelf: 'stretch'}}>
              <label style={{display:'block', fontSize:'10px', color:'var(--accent-gold)', textTransform:'uppercase', fontWeight: 'bold', marginBottom: '6px'}}>
                🔒 GM Notes (hidden from players)
              </label>
              <DebouncedTextarea
                value={characterData.gmNotes || ''}
                onChange={(val) => updateData({ gmNotes: val })}
                className="search-input"
                rows={4}
                placeholder="Private notes for GM only..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontSize: '12px',
                  background: 'rgba(240, 225, 48, 0.05)',
                  borderColor: 'rgba(240, 225, 48, 0.3)'
                }}
              />
              <MarkdownHint />
            </div>
          )}

          {/* Lore Token Footer */}
          <div style={{marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center'}}>
            {/* Lore Token - View only for players */}
            {playerRole !== 'GM' && (
              <div style={{fontSize: '10px', color: '#9c27b0', fontStyle: 'italic'}}>
                📜 Lore Token (view only)
              </div>
            )}

            {/* Lore Token - GM message */}
            {playerRole === 'GM' && (
              <div style={{fontSize: '10px', color: '#9c27b0', fontStyle: 'italic'}}>
                📜 Lore Token (You control this)
              </div>
            )}
          </div>
        </>
      )}

      {/* === STANDARD TOKEN UI (non-lore tokens) === */}
      {characterData.tokenType !== 'lore' && (
        <>
          {!viewingStorageId ? (
        <>
          {/* Only show edit controls if player is GM, owns this token, or it's a party token */}
          {canUserEdit && (
            <>
              <div style={{marginBottom: '12px'}}>
                <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>Current Pack</label>
                <select value={characterData.packType} onChange={(e) => updateData({ packType: e.target.value as PackType })} className="search-input" style={{marginTop: '4px', fontWeight: 'bold', color: 'var(--accent-gold)'}}>
                  {Object.keys(PACK_DEFINITIONS).map(pack => <option key={pack} value={pack}>{pack} Pack</option>)}
                </select>
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{marginBottom: '12px'}}>
          <div style={{color: '#888', fontSize: '12px'}}>Type: {characterData.externalStorages.find(s => s.id === viewingStorageId)?.type}</div>
          <div style={{marginTop:'8px'}}>
            <label style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px'}}>
              <input type="checkbox" checked={characterData.externalStorages.find(s => s.id === viewingStorageId)?.isNearby} onChange={(e) => {
                const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? {...s, isNearby: e.target.checked} : s);
                updateData({ externalStorages: newStorages });
              }} /> Is Nearby?
            </label>
          </div>
        </div>
      )}

      {/* Show stats - only show to GM, token owner, or for party tokens */}
      {(viewingStorageId || canUserEdit) && (
        <>
          <div className="totals-grid">
            <div className="stat-box"><div className="stat-label">TOTAL WEIGHT</div><div className={`stat-value ${stats.totalWeight > (activeStorageDef?.capacity || stats.maxCapacity) ? 'danger' : ''}`}>{stats.totalWeight} <span style={{fontSize:'10px', color:'#666'}}>/ {activeStorageDef ? activeStorageDef.capacity : stats.maxCapacity}</span></div></div>
            <div className="stat-box"><div className="stat-label">COIN WEIGHT</div><div className={`stat-value ${stats.coinWeight > 0 ? 'danger' : ''}`}>{stats.coinWeight}u</div></div>
            <div className="stat-box"><div className="stat-label">ITEMS</div><div className="stat-value">{currentDisplayData.inventory.length}</div></div>
          </div>

          {!viewingStorageId && (
            <CollapsibleSection title="Slot Usage" defaultExpanded={false}>
              <div className="totals-grid">
                <div className="stat-box" style={{borderColor: stats.usedSlots.weapon > stats.maxSlots.weapon ? 'var(--danger)' : 'transparent', borderStyle:'solid', borderWidth:'1px'}}>
                  <div className="stat-label">WEAPONS</div>
                  <div className={`stat-value ${stats.usedSlots.weapon > stats.maxSlots.weapon ? 'danger' : ''}`}>{stats.usedSlots.weapon} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.weapon}</span></div>
                </div>
                <div className="stat-box" style={{borderColor: stats.usedSlots.armor > stats.maxSlots.armor ? 'var(--danger)' : 'transparent', borderStyle:'solid', borderWidth:'1px'}}>
                  <div className="stat-label">ARMOR</div>
                  <div className={`stat-value ${stats.usedSlots.armor > stats.maxSlots.armor ? 'danger' : ''}`}>{stats.usedSlots.armor} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.armor}</span></div>
                </div>
                <div className="stat-box"><div className="stat-label">CLOTHING</div><div className="stat-value">{stats.usedSlots.clothing} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.clothing}</span></div></div>
                <div className="stat-box"><div className="stat-label">JEWELRY</div><div className="stat-value">{stats.usedSlots.jewelry} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.jewelry}</span></div></div>
                <div className="stat-box" style={{gridColumn: 'span 2', background: 'rgba(240, 225, 48, 0.05)'}}><div className="stat-label" style={{color: 'var(--accent-gold)'}}>UTILITY / QUICK</div><div className="stat-value">{stats.usedSlots.utility} <span style={{fontSize:'10px', color:'#666'}}>/ {stats.maxSlots.utility}</span></div></div>
              </div>
            </CollapsibleSection>
          )}
        </>
      )}

      {/* Show description - editable only if GM, owner, or party token */}
      <div style={{marginTop: '12px', width: DESCRIPTION_WIDTH_EDITABLE, alignSelf: 'stretch'}}>
        <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>
          Description
        </label>
        <DebouncedTextarea
          value={currentDisplayData.condition}
          onChange={(val) => canUserEdit && handleUpdateData({ condition: val })}
          className="search-input"
          rows={2}
          disabled={!canUserEdit}
          style={{
            width: '100%',
            minHeight: '50px',
            resize: 'vertical',
            boxSizing: 'border-box',
            opacity: 1,
            cursor: canUserEdit ? 'text' : 'default',
            fontSize: '13px'
          }}
        />
        {canUserEdit && <MarkdownHint />}
      </div>

      {/* Character Sheet - show for player/party tokens, and NPC tokens when user is GM */}
      {!viewingStorageId && 
       (characterData.tokenType !== 'npc' || playerRole === 'GM') && (
        <CharacterSheetSection
          characterData={characterData}
          canEdit={canUserEdit}
          updateData={updateData}
        />
      )}

      {/* Storage Notes - only show when viewing storage and can edit */}
      {viewingStorageId && canEditToken() && (
        <div style={{marginTop: '8px', width: '100%', alignSelf: 'stretch'}}>
          <label style={{display:'block', fontSize:'10px', color:'var(--text-muted)', textTransform:'uppercase'}}>Notes</label>
          <DebouncedTextarea value={characterData.externalStorages.find(s => s.id === viewingStorageId)?.notes || ''} onChange={(val) => {
            const newStorages = characterData.externalStorages.map(s => s.id === viewingStorageId ? {...s, notes: val} : s);
            updateData({ externalStorages: newStorages });
          }} className="search-input" rows={3} />
          <MarkdownHint />
        </div>
      )}

      {/* Reputation Display - show for NPC tokens with reputation data */}
      {!viewingStorageId &&
       characterData?.packType === 'NPC' &&
       characterData?.reputation &&
       (characterData.reputation.showPartyAverage || characterData.reputation.entries.some(e => e.visibleToPlayer)) && (
        <ReputationDisplay reputation={characterData.reputation} />
      )}

      {/* Token Claiming - at the bottom of the dashboard */}
      {!viewingStorageId && characterData && (
        <div style={{marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center'}}>
          
          {/* NPC Token - GM controlled */}
          {characterData.tokenType === 'npc' && (
            <div style={{fontSize: '10px', color: '#ff9800', fontStyle: 'italic'}}>
              🎭 NPC Token {playerRole === 'GM' ? '(You control this)' : '(GM controlled)'}
            </div>
          )}

          {/* Party Token - Shared access */}
          {characterData.tokenType === 'party' && (
            <div style={{fontSize: '10px', color: '#4caf50', fontStyle: 'italic'}}>
              👥 Party Token (shared by all players)
            </div>
          )}

          {/* Standard player token claiming - only show for player-type tokens */}
          {(characterData.tokenType === 'player' || !characterData.tokenType) && (
            <>
              {characterData.claimedBy && (
                <div style={{fontSize: '10px', color: '#aaa'}}>
                  {characterData.claimedBy === playerId ? 'You claimed this token' : 'Claimed by another player'}
                </div>
              )}
              {!characterData.claimedBy && (
                <>
                  {/* Show claiming status */}
                  {!characterData.claimingEnabled && playerRole !== 'GM' && (
                    <div style={{fontSize: '10px', color: '#888', fontStyle: 'italic'}}>
                      🔒 Claiming disabled (GM must enable)
                    </div>
                  )}
                  {/* Claim button */}
                  {canEditToken() && (
                    <button
                      onClick={async () => {
                        const success = await claimToken();
                        if (success === false) {
                          alert('Claiming is not enabled for this token. Ask the GM to enable claiming first.');
                        }
                      }}
                      style={{
                        background: characterData.claimingEnabled ? 'rgba(0,255,0,0.1)' : 'rgba(128,128,128,0.1)',
                        border: '1px solid ' + (characterData.claimingEnabled ? '#0f0' : '#888'),
                        color: characterData.claimingEnabled ? '#0f0' : '#888',
                        padding: '6px 16px',
                        borderRadius: '4px',
                        cursor: characterData.claimingEnabled ? 'pointer' : 'not-allowed',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        opacity: characterData.claimingEnabled ? 1 : 0.5
                      }}
                    >
                      CLAIM TOKEN
                    </button>
                  )}
                </>
              )}
              {characterData.claimedBy === playerId && (
                <button
                  onClick={unclaimToken}
                  style={{
                    background: 'rgba(255,0,0,0.1)',
                    border: '1px solid #f00',
                    color: '#f00',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  UNCLAIM TOKEN
                </button>
              )}

              {/* GM Token Controls - only for player type tokens */}
              {playerRole === 'GM' && (
                <button
                  onClick={() => handleUpdateData({ claimingEnabled: !characterData.claimingEnabled })}
                  style={{
                    background: characterData.claimingEnabled ? 'rgba(0,255,0,0.2)' : 'rgba(128,128,128,0.2)',
                    border: '1px solid ' + (characterData.claimingEnabled ? '#0f0' : '#888'),
                    color: characterData.claimingEnabled ? '#0f0' : '#888',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    width: '220px'
                  }}
                >
                  {characterData.claimingEnabled ? '🔓 CLAIMING ENABLED' : '🔒 CLAIMING DISABLED'}
                </button>
              )}
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
