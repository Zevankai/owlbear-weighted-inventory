import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { RestType, RestOption, RestHistory, CharacterRace, CharacterClass, Item, RestOptionEffect } from '../types';
import { getStandardRestOptions, getNonStandardRestOptions, getRestOptionById } from '../data/restOptions';
import { getTotalRations } from '../utils/inventory';

// LocalStorage keys for persisting last rest choices
const LAST_SHORT_REST_CHOICES_KEY = 'owlbear-weighted-inventory-last-short-rest-choices';
const LAST_LONG_REST_CHOICES_KEY = 'owlbear-weighted-inventory-last-long-rest-choices';

// Maximum benefit selections for each rest type
// Short rest: 1 benefit total
// Long rest: 2 benefits total
const getMaxBenefitSelections = (restType: RestType): number => {
  return restType === 'short' ? 1 : 2;
};

// Rest result effects to apply
export interface RestEffectsToApply {
  tempHp?: number;
  heroicInspiration?: boolean;
  healInjuryLevels?: number;
  reduceExhaustion?: number;
  rationsToDeduct?: number;
}

interface RestModalProps {
  isOpen: boolean;
  onClose: () => void;
  race?: CharacterRace;
  characterClass?: CharacterClass;
  secondaryRace?: CharacterRace;
  secondaryClass?: CharacterClass;
  level?: number;
  restHistory: RestHistory;
  onRest: (restType: RestType, selectedOptionIds: string[], effects: RestEffectsToApply) => void;
  gmRestRulesMessage?: string;
  customRestOptions?: RestOption[];
  disabledRestOptionIds?: string[];
  inventory?: Item[];
  tokenId?: string; // Used for per-token localStorage key
}

export const RestModal: React.FC<RestModalProps> = ({
  isOpen,
  onClose,
  race,
  characterClass,
  secondaryRace,
  secondaryClass,
  level = 1,
  restHistory,
  onRest,
  gmRestRulesMessage,
  customRestOptions = [],
  disabledRestOptionIds = [],
  inventory = [],
  tokenId = 'default',
}) => {
  const [selectedRestType, setSelectedRestType] = useState<RestType>('short');
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [rationPrompt, setRationPrompt] = useState<{
    show: boolean;
    optionId: string;
    requiredPerMember: number;
    currentRationCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build localStorage keys per token
  const shortRestStorageKey = `${LAST_SHORT_REST_CHOICES_KEY}-${tokenId}`;
  const longRestStorageKey = `${LAST_LONG_REST_CHOICES_KEY}-${tokenId}`;

  // Get all available options (standard + race/class + custom)
  const allAvailableOptions = useMemo(() => {
    const standard = getStandardRestOptions(selectedRestType).filter(
      opt => !disabledRestOptionIds.includes(opt.id)
    );
    
    const nonStandard = getNonStandardRestOptions(
      selectedRestType,
      race,
      characterClass,
      secondaryRace,
      secondaryClass
    ).filter(opt => !disabledRestOptionIds.includes(opt.id));
    
    // Add custom GM options that match the rest type
    const customMatchingOptions = customRestOptions.filter(
      opt => opt.restType === selectedRestType && !disabledRestOptionIds.includes(opt.id)
    );
    
    return [...standard, ...nonStandard, ...customMatchingOptions];
  }, [selectedRestType, race, characterClass, secondaryRace, secondaryClass, customRestOptions, disabledRestOptionIds]);

  // Group options by category for display
  const groupedOptions = useMemo(() => {
    const groups: Record<string, RestOption[]> = {
      standard: [],
      race: [],
      class: [],
      custom: [],
    };
    
    allAvailableOptions.forEach(option => {
      if (option.category === 'standard') {
        groups.standard.push(option);
      } else if (option.category === 'race') {
        groups.race.push(option);
      } else if (option.category === 'class') {
        groups.class.push(option);
      } else {
        groups.custom.push(option);
      }
    });
    
    return groups;
  }, [allAvailableOptions]);

  // Get max allowed selections for current rest type
  const maxSelections = getMaxBenefitSelections(selectedRestType);

  // Check if at max selections
  const isAtMaxSelections = selectedOptionIds.size >= maxSelections;

  // Available rations in inventory
  const availableRations = useMemo(() => getTotalRations(inventory), [inventory]);

  // Load last choices from localStorage when rest type changes
  useEffect(() => {
    if (!isOpen) return;
    
    const storageKey = selectedRestType === 'short' ? shortRestStorageKey : longRestStorageKey;
    try {
      const savedChoices = localStorage.getItem(storageKey);
      if (savedChoices) {
        const parsedChoices = JSON.parse(savedChoices) as string[];
        // Only restore choices that are still available
        const validChoices = parsedChoices.filter(id => 
          allAvailableOptions.some(opt => opt.id === id)
        );
        // Respect max selections
        const limitedChoices = validChoices.slice(0, maxSelections);
        setSelectedOptionIds(new Set(limitedChoices));
      } else {
        setSelectedOptionIds(new Set());
      }
    } catch {
      setSelectedOptionIds(new Set());
    }
    setError(null);
  }, [selectedRestType, isOpen, allAvailableOptions, maxSelections, shortRestStorageKey, longRestStorageKey]);

  // Format timestamp for display
  const formatLastRest = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Get last rest info
  const lastShortRest = restHistory.lastShortRest;
  const lastLongRest = restHistory.lastLongRest;

  // Check if an option requires rations and if we have enough
  const checkRationRequirement = useCallback((option: RestOption): { required: number; hasEnough: boolean } => {
    if (!option.effect?.requiresRations) {
      return { required: 0, hasEnough: true };
    }
    const required = option.effect.requiresRations;
    return { required, hasEnough: availableRations >= required };
  }, [availableRations]);

  // Toggle option selection
  const toggleOption = (optionId: string) => {
    const option = allAvailableOptions.find(opt => opt.id === optionId);
    if (!option) return;

    const newSet = new Set(selectedOptionIds);
    
    if (newSet.has(optionId)) {
      // Deselecting
      newSet.delete(optionId);
      setError(null);
    } else {
      // Only add if not at max
      if (newSet.size >= maxSelections) {
        return;
      }
      
      // Check ration requirement
      const { required, hasEnough } = checkRationRequirement(option);
      if (required > 0 && !hasEnough) {
        setError(`Not enough rations! "${option.name}" requires ${required} ration(s) but you only have ${availableRations}. Choose a different benefit.`);
        return;
      }
      
      newSet.add(optionId);
      setError(null);
    }
    
    setSelectedOptionIds(newSet);
  };

  // Calculate effects to apply from selected options
  const calculateEffects = useCallback((): RestEffectsToApply => {
    const effects: RestEffectsToApply = {};
    
    // Long rest automatically reduces exhaustion by 1
    if (selectedRestType === 'long') {
      effects.reduceExhaustion = 1;
    }
    
    // Calculate effects from selected options
    selectedOptionIds.forEach(optionId => {
      const option = getRestOptionById(optionId) || allAvailableOptions.find(opt => opt.id === optionId);
      if (!option?.effect) return;
      
      const effect: RestOptionEffect = option.effect;
      
      switch (effect.type) {
        case 'tempHp':
          effects.tempHp = (effects.tempHp || 0) + (effect.value || 0);
          break;
        case 'heroicInspiration':
          effects.heroicInspiration = true;
          break;
        case 'healInjury':
          // Use value if specified (e.g., long rest heals 2), default to 1
          effects.healInjuryLevels = (effects.healInjuryLevels || 0) + (effect.value || 1);
          break;
      }
      
      // Track rations to deduct
      if (effect.requiresRations) {
        effects.rationsToDeduct = (effects.rationsToDeduct || 0) + effect.requiresRations;
      }
    });
    
    return effects;
  }, [selectedOptionIds, selectedRestType, allAvailableOptions]);

  // Handle rest completion
  const handleRest = () => {
    // Calculate effects
    const effects = calculateEffects();
    
    // Validate rations if any are required
    if (effects.rationsToDeduct && effects.rationsToDeduct > availableRations) {
      setError(`Not enough rations! You need ${effects.rationsToDeduct} but only have ${availableRations}.`);
      return;
    }
    
    // Save choices to localStorage
    const storageKey = selectedRestType === 'short' ? shortRestStorageKey : longRestStorageKey;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(selectedOptionIds)));
    } catch {
      // Silently fail localStorage - not critical
    }
    
    // Call onRest with selected options and effects
    onRest(selectedRestType, Array.from(selectedOptionIds), effects);
    
    // Reset state
    setSelectedOptionIds(new Set());
    setError(null);
    onClose();
  };

  // Handle rest type change
  const handleRestTypeChange = (newType: RestType) => {
    setSelectedRestType(newType);
    setError(null);
    // Selection restoration happens in useEffect
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: 'rgba(15, 15, 30, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        width: 'min(550px, 90vw)',
        maxHeight: 'min(750px, 85vh)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(240, 225, 48, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🏕️</span>
            <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'var(--accent-gold)',
            }}>
              Take a Rest
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        {/* GM Rules Message */}
        {gmRestRulesMessage && (
          <div style={{
            margin: '12px 20px 0',
            padding: '10px 12px',
            background: 'rgba(240, 225, 48, 0.1)',
            border: '1px solid rgba(240, 225, 48, 0.3)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--accent-gold)',
          }}>
            <strong>📜 House Rules:</strong> {gmRestRulesMessage}
          </div>
        )}

        {/* Rest Type Selection */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <button
            onClick={() => handleRestTypeChange('short')}
            style={{
              flex: 1,
              padding: '12px',
              background: selectedRestType === 'short' 
                ? 'rgba(77, 171, 247, 0.2)' 
                : 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${selectedRestType === 'short' ? '#4dabf7' : '#444'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: selectedRestType === 'short' ? '#4dabf7' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>☀️</div>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Short Rest</div>
            <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
              1+ hours • Choose 1 benefit
            </div>
          </button>
          <button
            onClick={() => handleRestTypeChange('long')}
            style={{
              flex: 1,
              padding: '12px',
              background: selectedRestType === 'long' 
                ? 'rgba(192, 132, 252, 0.2)' 
                : 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${selectedRestType === 'long' ? '#c084fc' : '#444'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: selectedRestType === 'long' ? '#c084fc' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌙</div>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Long Rest</div>
            <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
              8+ hours • Choose 2 benefits
            </div>
          </button>
        </div>

        {/* Last Rest Info + Ration Count */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.2)',
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <strong>Last Short Rest:</strong> {formatLastRest(lastShortRest?.timestamp || null)}
            </div>
            <div>
              <strong>Last Long Rest:</strong> {formatLastRest(lastLongRest?.timestamp || null)}
            </div>
          </div>
          <div style={{ 
            color: availableRations > 0 ? '#fcc419' : '#ff6b6b',
            fontWeight: 'bold',
          }}>
            🍖 Rations: {availableRations}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '12px 20px 0',
            padding: '10px 12px',
            background: 'rgba(255, 107, 107, 0.15)',
            border: '1px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#ff6b6b',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Options List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}>
          {/* Character Info */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {race && <span>Race: <strong style={{ color: 'var(--text-main)' }}>{race}</strong></span>}
            {characterClass && <span>Class: <strong style={{ color: 'var(--text-main)' }}>{characterClass}</strong></span>}
            {level && <span>Level: <strong style={{ color: 'var(--text-main)' }}>{level}</strong></span>}
          </div>

          {/* Selection Info Banner */}
          <div style={{
            padding: '10px 12px',
            background: isAtMaxSelections 
              ? 'rgba(81, 207, 102, 0.15)' 
              : 'rgba(77, 171, 247, 0.1)',
            border: `1px solid ${isAtMaxSelections ? 'rgba(81, 207, 102, 0.4)' : 'rgba(77, 171, 247, 0.3)'}`,
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '11px',
            color: isAtMaxSelections ? '#51cf66' : '#4dabf7',
          }}>
            {isAtMaxSelections ? (
              <span>✓ You've selected {selectedOptionIds.size} benefit{selectedOptionIds.size !== 1 ? 's' : ''} (maximum for {selectedRestType} rest). You can deselect to choose different ones.</span>
            ) : (
              <span>📋 Choose {maxSelections - selectedOptionIds.size} more benefit{maxSelections - selectedOptionIds.size !== 1 ? 's' : ''} ({selectedOptionIds.size}/{maxSelections} selected for {selectedRestType} rest)</span>
            )}
          </div>

          {/* Long Rest Exhaustion Recovery Notice */}
          {selectedRestType === 'long' && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(192, 132, 252, 0.1)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '11px',
              color: '#c084fc',
            }}>
              💤 <strong>Exhaustion Recovery:</strong> Long rest automatically reduces your exhaustion level by 1
            </div>
          )}

          {/* Standard Options */}
          {groupedOptions.standard.length > 0 && (
            <OptionSection
              title="Standard Benefits"
              options={groupedOptions.standard}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#51cf66"
              isAtMax={isAtMaxSelections}
              checkRationRequirement={checkRationRequirement}
            />
          )}

          {/* Race Options */}
          {groupedOptions.race.length > 0 && (
            <OptionSection
              title={`${race || 'Race'} Benefits`}
              options={groupedOptions.race}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#fcc419"
              isAtMax={isAtMaxSelections}
              checkRationRequirement={checkRationRequirement}
            />
          )}

          {/* Class Options */}
          {groupedOptions.class.length > 0 && (
            <OptionSection
              title={`${characterClass || 'Class'} Benefits`}
              options={groupedOptions.class}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#4dabf7"
              isAtMax={isAtMaxSelections}
              checkRationRequirement={checkRationRequirement}
            />
          )}

          {/* Custom GM Options */}
          {groupedOptions.custom.length > 0 && (
            <OptionSection
              title="Custom Benefits"
              options={groupedOptions.custom}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#c084fc"
              isAtMax={isAtMaxSelections}
              checkRationRequirement={checkRationRequirement}
            />
          )}

          {allAvailableOptions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}>
              No benefits available.
            </div>
          )}
        </div>

        {/* Footer with Rest Button */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}>
          <div style={{
            flex: 1,
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {selectedOptionIds.size}/{maxSelections} benefits selected
            {selectedRestType === 'long' && ' • -1 exhaustion'}
          </div>
          <button
            onClick={handleRest}
            style={{
              padding: '10px 24px',
              background: selectedRestType === 'short' 
                ? 'linear-gradient(135deg, #4dabf7, #228be6)'
                : 'linear-gradient(135deg, #c084fc, #9333ea)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            Complete {selectedRestType === 'short' ? 'Short' : 'Long'} Rest
          </button>
        </div>
      </div>

      {/* Ration Prompt Modal */}
      {rationPrompt && (
        <>
          <div
            onClick={() => setRationPrompt(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 10000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10001,
            background: 'rgba(30, 30, 50, 0.98)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '280px',
          }}>
            <h4 style={{ margin: '0 0 12px', color: '#fcc419' }}>🍖 Rations Required</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              This benefit requires {rationPrompt.requiredPerMember} ration(s).
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-main)' }}>
              You have <strong>{rationPrompt.currentRationCount}</strong> rations available.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRationPrompt(null)}
                style={{
                  padding: '8px 16px',
                  background: '#444',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleOption(rationPrompt.optionId);
                  setRationPrompt(null);
                }}
                disabled={rationPrompt.currentRationCount < rationPrompt.requiredPerMember}
                style={{
                  padding: '8px 16px',
                  background: rationPrompt.currentRationCount >= rationPrompt.requiredPerMember 
                    ? '#51cf66' 
                    : '#666',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: rationPrompt.currentRationCount >= rationPrompt.requiredPerMember 
                    ? 'pointer' 
                    : 'not-allowed',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Option Section Component
interface OptionSectionProps {
  title: string;
  options: RestOption[];
  selectedIds: Set<string>;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onExpand: (id: string | null) => void;
  color: string;
  isAtMax: boolean;
  checkRationRequirement: (option: RestOption) => { required: number; hasEnough: boolean };
}

const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  options,
  selectedIds,
  expandedId,
  onToggle,
  onExpand,
  color,
  isAtMax,
  checkRationRequirement,
}) => (
  <div style={{ marginBottom: '16px' }}>
    <h4 style={{
      fontSize: '10px',
      color,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '8px',
      borderBottom: `1px solid ${color}33`,
      paddingBottom: '4px',
    }}>
      {title}
    </h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {options.map(option => {
        const isSelected = selectedIds.has(option.id);
        const isExpanded = expandedId === option.id;
        const isDisabled = isAtMax && !isSelected;
        const { required: rationRequired, hasEnough: hasEnoughRations } = checkRationRequirement(option);
        const hasRationIssue = rationRequired > 0 && !hasEnoughRations && !isSelected;
        const isOptionUnavailable = isDisabled || hasRationIssue;
        
        return (
          <div key={option.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: isSelected ? `${color}15` : hasRationIssue ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${isSelected ? color : hasRationIssue ? 'rgba(255, 107, 107, 0.3)' : 'transparent'}`,
                borderRadius: isExpanded ? '6px 6px 0 0' : '6px',
                cursor: isOptionUnavailable ? 'not-allowed' : 'pointer',
                opacity: isOptionUnavailable ? 0.6 : 1,
              }}
              onClick={() => !isOptionUnavailable && onToggle(option.id)}
            >
              {/* Checkbox */}
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${isSelected ? color : hasRationIssue ? '#ff6b6b' : '#555'}`,
                background: isSelected ? color : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}>
                {isSelected && (
                  <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              
              {/* Option name */}
              <span style={{
                flex: 1,
                fontSize: '11px',
                color: isSelected ? color : hasRationIssue ? '#ff6b6b' : 'var(--text-main)',
                fontWeight: isSelected ? 'bold' : 'normal',
              }}>
                {option.name}
                {rationRequired > 0 && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: hasEnoughRations ? '#fcc419' : '#ff6b6b',
                    fontWeight: 'normal',
                  }}>
                    🍖 {rationRequired}
                  </span>
                )}
                {option.effect?.type === 'tempHp' && option.effect.value && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#4dabf7',
                    fontWeight: 'normal',
                  }}>
                    💚 +{option.effect.value} temp HP
                  </span>
                )}
                {option.effect?.type === 'heroicInspiration' && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#ffd700',
                    fontWeight: 'normal',
                  }}>
                    ✨ Inspiration
                  </span>
                )}
                {option.effect?.type === 'healInjury' && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#ff9800',
                    fontWeight: 'normal',
                  }}>
                    🩹 Heal Injury
                  </span>
                )}
              </span>
              
              {/* Expand button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(isExpanded ? null : option.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: '10px',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                ▼
              </button>
            </div>
            
            {/* Description */}
            {isExpanded && (
              <div style={{
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0 0 6px 6px',
                border: '1px solid var(--glass-border)',
                borderTop: 'none',
                fontSize: '10px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}>
                {option.description}
                {hasRationIssue && (
                  <div style={{ 
                    marginTop: '8px', 
                    color: '#ff6b6b', 
                    fontWeight: 'bold',
                    fontSize: '10px',
                  }}>
                    ⚠️ Not enough rations available
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
