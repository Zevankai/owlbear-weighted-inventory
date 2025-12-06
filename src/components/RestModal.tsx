import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { RestType, RestOption, RestHistory, CharacterRace, CharacterClass, Item, RestOptionEffect, RestLocationType, SettlementRoomType, HitDice, SuperiorityDice, Currency } from '../types';
import { getStandardRestOptions, getNonStandardRestOptions, getRestOptionById } from '../data/restOptions';
import { getTotalRations } from '../utils/inventory';
import { getTotalCopperPieces } from '../utils/currency';

// LocalStorage keys for persisting last rest choices
const LAST_SHORT_REST_CHOICES_KEY = 'owlbear-weighted-inventory-last-short-rest-choices';
const LAST_LONG_REST_CHOICES_KEY = 'owlbear-weighted-inventory-last-long-rest-choices';

// Maximum benefit selections for each rest type
// Short rest: 1 benefit total
// Long rest: 2 benefits total
const getMaxBenefitSelections = (restType: RestType): number => {
  return restType === 'short' ? 1 : 2;
};

// Settlement room costs in GP and exhaustion reduction
// Progression: More expensive rooms provide greater exhaustion recovery
// Free: Basic shelter, 1 level recovery
// Basic (1 GP): Simple inn room, 2 levels
// Quality (3 GP): Comfortable lodging, 3 levels
// Luxury (6 GP): Premium accommodations, 5 levels (skips 4 as a significant upgrade)
const SETTLEMENT_ROOMS: Record<SettlementRoomType, { name: string; costGp: number; exhaustionReduction: number; description: string }> = {
  free: { name: 'Free Room', costGp: 0, exhaustionReduction: 1, description: 'Basic accommodations, removes 1 level of exhaustion' },
  basic: { name: 'Basic Room', costGp: 1, exhaustionReduction: 2, description: 'Simple room with bed, removes 2 levels of exhaustion' },
  quality: { name: 'Quality Room', costGp: 3, exhaustionReduction: 3, description: 'Comfortable room with amenities, removes 3 levels of exhaustion' },
  luxury: { name: 'Luxury Suite', costGp: 6, exhaustionReduction: 5, description: 'Lavish accommodations, removes 5 levels of exhaustion' },
};

// Rest result effects to apply
export interface RestEffectsToApply {
  tempHp?: number;
  heroicInspiration?: boolean;
  healInjuryLevels?: number;
  reduceExhaustion?: number;
  rationsToDeduct?: number;
  restLocation?: RestLocationType;
  roomType?: SettlementRoomType;
  gpCost?: number;
  hitDiceRecovered?: number;
  recoverSuperiorityDice?: boolean;
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
  hitDice?: HitDice; // Current hit dice state
  superiorityDice?: SuperiorityDice; // Current superiority dice state
  currency?: Currency; // Current currency for settlement costs
  onSpendHitDie?: (hpRecovered: number) => void; // Callback when spending hit dice
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
  hitDice,
  superiorityDice,
  currency,
  onSpendHitDie,
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
  
  // Ration input prompt for "Prepare a Meal" / "Prepare a Snack" options
  const [rationInputPrompt, setRationInputPrompt] = useState<{
    isOpen: boolean;
    optionId: string;
    rationCount: string;
    tempHpPerRation: number;
  } | null>(null);
  
  // Track custom ration counts for options that require input
  const [customRationCounts, setCustomRationCounts] = useState<Record<string, number>>({});
  
  // Long rest location state
  const [restLocation, setRestLocation] = useState<RestLocationType | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<SettlementRoomType | null>(null);
  
  // Hit dice spending state
  const [hitDieSpendPrompt, setHitDieSpendPrompt] = useState<{ isOpen: boolean; hpRecovered: string }>({ isOpen: false, hpRecovered: '' });

  // Build localStorage keys per token
  const shortRestStorageKey = `${LAST_SHORT_REST_CHOICES_KEY}-${tokenId}`;
  const longRestStorageKey = `${LAST_LONG_REST_CHOICES_KEY}-${tokenId}`;
  
  // Calculate available GP for settlement costs
  const availableGp = useMemo(() => {
    if (!currency) return 0;
    const totalCp = getTotalCopperPieces(currency);
    return Math.floor(totalCp / 100); // Convert to GP
  }, [currency]);

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
  
  // Get previous selected benefits for current rest type (to prevent same benefit twice in a row)
  const previousSelectedBenefits = useMemo(() => {
    if (selectedRestType === 'short') {
      return lastShortRest?.selectedBenefits || lastShortRest?.chosenOptionIds || [];
    } else {
      return lastLongRest?.selectedBenefits || lastLongRest?.chosenOptionIds || [];
    }
  }, [selectedRestType, lastShortRest, lastLongRest]);

  // Check if an option requires rations and if we have enough
  const checkRationRequirement = useCallback((option: RestOption): { required: number; hasEnough: boolean; requiresPrompt: boolean } => {
    // Check if this option requires a ration prompt (variable ration input)
    if (option.effect?.requiresRationPrompt) {
      // For ration prompt options, we need at least 1 ration
      return { required: 1, hasEnough: availableRations >= 1, requiresPrompt: true };
    }
    if (!option.effect?.requiresRations) {
      return { required: 0, hasEnough: true, requiresPrompt: false };
    }
    const required = option.effect.requiresRations;
    return { required, hasEnough: availableRations >= required, requiresPrompt: false };
  }, [availableRations]);

  // Toggle option selection
  const toggleOption = (optionId: string) => {
    const option = allAvailableOptions.find(opt => opt.id === optionId);
    if (!option) return;

    const newSet = new Set(selectedOptionIds);
    
    if (newSet.has(optionId)) {
      // Deselecting - also clear custom ration count if any
      newSet.delete(optionId);
      if (customRationCounts[optionId]) {
        const newCounts = { ...customRationCounts };
        delete newCounts[optionId];
        setCustomRationCounts(newCounts);
      }
      setError(null);
    } else {
      // Only add if not at max
      if (newSet.size >= maxSelections) {
        return;
      }
      
      // Check ration requirement
      const { required, hasEnough, requiresPrompt } = checkRationRequirement(option);
      
      // If option requires ration prompt, show the ration input modal
      if (requiresPrompt) {
        if (availableRations < 1) {
          setError(`Not enough rations! "${option.name}" requires at least 1 ration but you have none.`);
          return;
        }
        // Show ration input prompt
        setRationInputPrompt({
          isOpen: true,
          optionId: optionId,
          rationCount: '1',
          tempHpPerRation: option.effect?.value || 5,
        });
        return;
      }
      
      if (required > 0 && !hasEnough) {
        setError(`Not enough rations! "${option.name}" requires ${required} ration(s) but you only have ${availableRations}. Choose a different benefit.`);
        return;
      }
      
      newSet.add(optionId);
      setError(null);
    }
    
    setSelectedOptionIds(newSet);
  };
  
  // Handle ration input confirmation
  const handleRationInputConfirm = () => {
    if (!rationInputPrompt) return;
    
    const rationCount = parseInt(rationInputPrompt.rationCount, 10);
    if (isNaN(rationCount) || rationCount < 1) {
      setError('Please enter a valid number of rations (at least 1)');
      return;
    }
    if (rationCount > availableRations) {
      setError(`Not enough rations! You have ${availableRations} but entered ${rationCount}.`);
      return;
    }
    
    // Add the option and store the custom ration count
    const newSet = new Set(selectedOptionIds);
    newSet.add(rationInputPrompt.optionId);
    setSelectedOptionIds(newSet);
    setCustomRationCounts({
      ...customRationCounts,
      [rationInputPrompt.optionId]: rationCount,
    });
    setRationInputPrompt(null);
    setError(null);
  };

  // Calculate effects to apply from selected options
  const calculateEffects = useCallback((): RestEffectsToApply => {
    const effects: RestEffectsToApply = {};
    
    // Short rest and long rest both recover superiority dice
    effects.recoverSuperiorityDice = true;
    
    // Long rest specific effects
    if (selectedRestType === 'long') {
      // Location-based exhaustion reduction
      if (restLocation === 'wilderness') {
        // Check if wilderness exhaustion is blocked
        if (!restHistory.wildernessExhaustionBlocked) {
          effects.reduceExhaustion = 1;
        }
        effects.restLocation = 'wilderness';
      } else if (restLocation === 'settlement' && selectedRoomType) {
        // Settlement room reduces exhaustion based on room type
        const room = SETTLEMENT_ROOMS[selectedRoomType];
        effects.reduceExhaustion = room.exhaustionReduction;
        effects.gpCost = room.costGp;
        effects.restLocation = 'settlement';
        effects.roomType = selectedRoomType;
      } else {
        // Default to 1 exhaustion reduction if no location selected yet
        effects.reduceExhaustion = 1;
      }
      
      // Calculate hit dice recovery on long rest
      // Recover half of used hit dice, rounded up
      if (hitDice) {
        const usedHitDice = hitDice.max - hitDice.current;
        if (usedHitDice > 0) {
          effects.hitDiceRecovered = Math.ceil(usedHitDice / 2);
        }
      }
    }
    
    // Calculate effects from selected options
    selectedOptionIds.forEach(optionId => {
      const option = getRestOptionById(optionId) || allAvailableOptions.find(opt => opt.id === optionId);
      if (!option?.effect) return;
      
      const effect: RestOptionEffect = option.effect;
      
      switch (effect.type) {
        case 'tempHp':
          // Check if this option uses custom ration count (for Prepare a Meal/Snack)
          if (effect.requiresRationPrompt && customRationCounts[optionId]) {
            // Scale temp HP based on rations used
            const rationCount = customRationCounts[optionId];
            effects.tempHp = (effects.tempHp || 0) + (effect.value || 0) * rationCount;
            effects.rationsToDeduct = (effects.rationsToDeduct || 0) + rationCount;
          } else {
            effects.tempHp = (effects.tempHp || 0) + (effect.value || 0);
          }
          break;
        case 'heroicInspiration':
          effects.heroicInspiration = true;
          break;
        case 'healInjury':
          // Use value if specified (e.g., long rest heals 2), default to 1
          effects.healInjuryLevels = (effects.healInjuryLevels || 0) + (effect.value || 1);
          break;
      }
      
      // Track rations to deduct (for non-prompt options)
      if (effect.requiresRations && !effect.requiresRationPrompt) {
        effects.rationsToDeduct = (effects.rationsToDeduct || 0) + effect.requiresRations;
      }
    });
    
    return effects;
  }, [selectedOptionIds, selectedRestType, allAvailableOptions, restLocation, selectedRoomType, hitDice, restHistory.wildernessExhaustionBlocked, customRationCounts]);

  // Handle rest completion
  const handleRest = () => {
    // For long rest, validate that location is selected
    if (selectedRestType === 'long' && !restLocation) {
      setError('Please select a rest location (Wilderness or Settlement)');
      return;
    }
    
    // For settlement, validate room selection
    if (selectedRestType === 'long' && restLocation === 'settlement' && !selectedRoomType) {
      setError('Please select a room type');
      return;
    }
    
    // Calculate effects
    const effects = calculateEffects();
    
    // Validate rations if any are required
    if (effects.rationsToDeduct && effects.rationsToDeduct > availableRations) {
      setError(`Not enough rations! You need ${effects.rationsToDeduct} but only have ${availableRations}.`);
      return;
    }
    
    // Validate GP for settlement room
    if (effects.gpCost && effects.gpCost > availableGp) {
      setError(`Not enough gold! Room costs ${effects.gpCost} GP but you only have ${availableGp} GP.`);
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
    setRestLocation(null);
    setSelectedRoomType(null);
    setError(null);
    onClose();
  };

  // Handle rest type change
  const handleRestTypeChange = (newType: RestType) => {
    setSelectedRestType(newType);
    setRestLocation(null);
    setSelectedRoomType(null);
    setError(null);
    // Selection restoration happens in useEffect
  };
  
  // Handle spending a hit die
  const handleSpendHitDie = () => {
    if (!hitDice || hitDice.current <= 0 || !onSpendHitDie) return;
    const hpRecovered = parseInt(hitDieSpendPrompt.hpRecovered, 10);
    if (isNaN(hpRecovered) || hpRecovered < 0) {
      setError('Please enter a valid HP amount');
      return;
    }
    onSpendHitDie(hpRecovered);
    setHitDieSpendPrompt({ isOpen: false, hpRecovered: '' });
    setError(null);
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

          {/* Long Rest Location Selection */}
          {selectedRestType === 'long' && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(192, 132, 252, 0.1)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              borderRadius: '8px',
            }}>
              <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: 'bold', marginBottom: '10px' }}>
                🏕️ Rest Location
              </div>
              
              {/* Wilderness warning if blocked */}
              {restHistory.wildernessExhaustionBlocked && (
                <div style={{
                  padding: '8px',
                  background: 'rgba(255, 107, 107, 0.15)',
                  border: '1px solid rgba(255, 107, 107, 0.4)',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '10px',
                  color: '#ff6b6b',
                }}>
                  ⚠️ You've had 7+ consecutive wilderness rests. Exhaustion won't reduce until you rest in a settlement!
                </div>
              )}
              
              {/* Wilderness count warning */}
              {restHistory.consecutiveWildernessRests >= 5 && restHistory.consecutiveWildernessRests < 7 && (
                <div style={{
                  padding: '8px',
                  background: 'rgba(255, 152, 0, 0.15)',
                  border: '1px solid rgba(255, 152, 0, 0.4)',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '10px',
                  color: '#ff9800',
                }}>
                  ⚠️ {7 - restHistory.consecutiveWildernessRests} more wilderness rest{7 - restHistory.consecutiveWildernessRests !== 1 ? 's' : ''} before exhaustion penalty!
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  onClick={() => { setRestLocation('wilderness'); setSelectedRoomType(null); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: restLocation === 'wilderness' ? 'rgba(81, 207, 102, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    border: `2px solid ${restLocation === 'wilderness' ? '#51cf66' : '#444'}`,
                    borderRadius: '6px',
                    color: restLocation === 'wilderness' ? '#51cf66' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: restLocation === 'wilderness' ? 'bold' : 'normal',
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>🌲</div>
                  Wilderness
                  <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.8 }}>Free, standard benefits</div>
                </button>
                <button
                  onClick={() => setRestLocation('settlement')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: restLocation === 'settlement' ? 'rgba(252, 196, 25, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    border: `2px solid ${restLocation === 'settlement' ? '#fcc419' : '#444'}`,
                    borderRadius: '6px',
                    color: restLocation === 'settlement' ? '#fcc419' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: restLocation === 'settlement' ? 'bold' : 'normal',
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>🏨</div>
                  Settlement
                  <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.8 }}>Pay GP for better recovery</div>
                </button>
              </div>
              
              {/* Settlement Room Options */}
              {restLocation === 'settlement' && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    💰 Available: <strong style={{ color: '#fcc419' }}>{availableGp} GP</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(Object.entries(SETTLEMENT_ROOMS) as [SettlementRoomType, typeof SETTLEMENT_ROOMS[SettlementRoomType]][]).map(([roomType, room]) => {
                      const canAfford = availableGp >= room.costGp;
                      const isSelected = selectedRoomType === roomType;
                      
                      return (
                        <button
                          key={roomType}
                          onClick={() => canAfford && setSelectedRoomType(roomType)}
                          disabled={!canAfford}
                          style={{
                            padding: '8px 12px',
                            background: isSelected 
                              ? 'rgba(81, 207, 102, 0.2)' 
                              : !canAfford 
                                ? 'rgba(128, 128, 128, 0.1)' 
                                : 'rgba(0, 0, 0, 0.2)',
                            border: `1px solid ${isSelected ? '#51cf66' : !canAfford ? '#555' : '#666'}`,
                            borderRadius: '6px',
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: canAfford ? 1 : 0.5,
                          }}
                        >
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ 
                              fontSize: '11px', 
                              fontWeight: isSelected ? 'bold' : 'normal',
                              color: isSelected ? '#51cf66' : 'var(--text-main)',
                            }}>
                              {room.name} {room.costGp > 0 && `(${room.costGp} GP)`}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                              {room.description}
                            </div>
                          </div>
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#51cf66',
                            fontWeight: 'bold',
                          }}>
                            -{room.exhaustionReduction} Exh
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Exhaustion reduction summary */}
              {restLocation && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                }}>
                  💤 <strong>Exhaustion Recovery:</strong>{' '}
                  {restLocation === 'wilderness' ? (
                    restHistory.wildernessExhaustionBlocked ? (
                      <span style={{ color: '#ff6b6b' }}>Blocked (need settlement rest)</span>
                    ) : (
                      <span style={{ color: '#51cf66' }}>-1 level</span>
                    )
                  ) : selectedRoomType ? (
                    <span style={{ color: '#51cf66' }}>-{SETTLEMENT_ROOMS[selectedRoomType].exhaustionReduction} levels</span>
                  ) : (
                    <span>Select a room</span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Hit Dice Section */}
          {hitDice && hitDice.max > 0 && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(77, 171, 247, 0.1)',
              border: '1px solid rgba(77, 171, 247, 0.3)',
              borderRadius: '8px',
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '11px', color: '#4dabf7', fontWeight: 'bold' }}>
                  🎲 Hit Dice ({hitDice.dieType})
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: hitDice.current > 0 ? '#4dabf7' : '#ff6b6b',
                }}>
                  {hitDice.current}/{hitDice.max}
                </div>
              </div>
              
              {/* Spend hit die button */}
              {onSpendHitDie && hitDice.current > 0 && (
                <button
                  onClick={() => setHitDieSpendPrompt({ isOpen: true, hpRecovered: '' })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(77, 171, 247, 0.2)',
                    border: '1px solid #4dabf7',
                    borderRadius: '6px',
                    color: '#4dabf7',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  🎲 Spend a Hit Die to Heal
                </button>
              )}
              
              {hitDice.current === 0 && (
                <div style={{ fontSize: '10px', color: '#ff6b6b', fontStyle: 'italic' }}>
                  No hit dice remaining
                </div>
              )}
              
              {/* Long rest hit dice recovery info */}
              {selectedRestType === 'long' && hitDice.current < hitDice.max && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '10px', 
                  color: 'var(--text-muted)',
                }}>
                  💤 Long rest will recover <strong style={{ color: '#51cf66' }}>
                    {Math.ceil((hitDice.max - hitDice.current) / 2)}
                  </strong> hit dice
                </div>
              )}
            </div>
          )}
          
          {/* Superiority Dice Recovery Info */}
          {superiorityDice && superiorityDice.max > 0 && superiorityDice.current < superiorityDice.max && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '11px',
              color: '#ff9800',
            }}>
              ⚔️ <strong>Superiority Dice:</strong> Will fully recover ({superiorityDice.current} → {superiorityDice.max})
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
              customRationCounts={customRationCounts}
              previousSelectedBenefits={previousSelectedBenefits}
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
              customRationCounts={customRationCounts}
              previousSelectedBenefits={previousSelectedBenefits}
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
              customRationCounts={customRationCounts}
              previousSelectedBenefits={previousSelectedBenefits}
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
              customRationCounts={customRationCounts}
              previousSelectedBenefits={previousSelectedBenefits}
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
            {selectedRestType === 'long' && restLocation === 'wilderness' && !restHistory.wildernessExhaustionBlocked && ' • -1 exhaustion'}
            {selectedRestType === 'long' && restLocation === 'settlement' && selectedRoomType && ` • -${SETTLEMENT_ROOMS[selectedRoomType].exhaustionReduction} exhaustion`}
            {selectedRestType === 'long' && restLocation === 'settlement' && selectedRoomType && SETTLEMENT_ROOMS[selectedRoomType].costGp > 0 && ` • ${SETTLEMENT_ROOMS[selectedRoomType].costGp} GP`}
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

      {/* Hit Die Spend Prompt Modal */}
      {hitDieSpendPrompt.isOpen && (
        <>
          <div
            onClick={() => setHitDieSpendPrompt({ isOpen: false, hpRecovered: '' })}
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
            minWidth: '300px',
          }}>
            <h4 style={{ margin: '0 0 12px', color: '#4dabf7' }}>🎲 Spend Hit Die</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Roll your hit die ({hitDice?.dieType}) + CON modifier, then enter the HP recovered below.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Hit Dice Remaining: <strong style={{ color: '#4dabf7' }}>{hitDice?.current}/{hitDice?.max}</strong>
            </p>
            <input
              type="number"
              min="0"
              value={hitDieSpendPrompt.hpRecovered}
              onChange={(e) => setHitDieSpendPrompt({ ...hitDieSpendPrompt, hpRecovered: e.target.value })}
              placeholder="Enter HP recovered..."
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #4dabf7',
                borderRadius: '6px',
                color: 'var(--text-main)',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setHitDieSpendPrompt({ isOpen: false, hpRecovered: '' })}
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
                onClick={handleSpendHitDie}
                style={{
                  padding: '8px 16px',
                  background: '#4dabf7',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Spend & Heal
              </button>
            </div>
          </div>
        </>
      )}

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

      {/* Ration Input Prompt Modal (for Prepare a Meal / Prepare a Snack) */}
      {rationInputPrompt && rationInputPrompt.isOpen && (
        <>
          <div
            onClick={() => setRationInputPrompt(null)}
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
            minWidth: '300px',
          }}>
            <h4 style={{ margin: '0 0 12px', color: '#fcc419' }}>🍖 How Many Rations?</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Enter how many rations you want to use. Each ration provides <strong style={{ color: '#4dabf7' }}>+{rationInputPrompt.tempHpPerRation} temp HP</strong>.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '12px' }}>
              Available rations: <strong style={{ color: '#fcc419' }}>{availableRations}</strong>
            </p>
            <input
              type="number"
              min="1"
              max={availableRations}
              value={rationInputPrompt.rationCount}
              onChange={(e) => setRationInputPrompt({ ...rationInputPrompt, rationCount: e.target.value })}
              placeholder="Enter ration count..."
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #fcc419',
                borderRadius: '6px',
                color: 'var(--text-main)',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <p style={{ fontSize: '11px', color: '#51cf66', marginBottom: '12px' }}>
              Total temp HP: <strong>+{(parseInt(rationInputPrompt.rationCount, 10) || 0) * rationInputPrompt.tempHpPerRation}</strong>
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRationInputPrompt(null)}
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
                onClick={handleRationInputConfirm}
                style={{
                  padding: '8px 16px',
                  background: '#51cf66',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Use Rations
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
  checkRationRequirement: (option: RestOption) => { required: number; hasEnough: boolean; requiresPrompt: boolean };
  customRationCounts?: Record<string, number>;
  previousSelectedBenefits?: string[];
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
  customRationCounts = {},
  previousSelectedBenefits = [],
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
        const wasPreviouslySelected = previousSelectedBenefits.includes(option.id);
        const isOptionUnavailable = isDisabled || hasRationIssue || (wasPreviouslySelected && !isSelected);
        
        return (
          <div key={option.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: isSelected ? `${color}15` : wasPreviouslySelected ? 'rgba(128, 128, 128, 0.15)' : hasRationIssue ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${isSelected ? color : wasPreviouslySelected ? 'rgba(128, 128, 128, 0.3)' : hasRationIssue ? 'rgba(255, 107, 107, 0.3)' : 'transparent'}`,
                borderRadius: isExpanded ? '6px 6px 0 0' : '6px',
                cursor: isOptionUnavailable ? 'not-allowed' : 'pointer',
                opacity: isOptionUnavailable ? 0.6 : 1,
              }}
              onClick={() => !isOptionUnavailable && onToggle(option.id)}
              title={wasPreviouslySelected && !isSelected ? 'You selected this benefit in your last rest' : undefined}
            >
              {/* Checkbox */}
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${isSelected ? color : wasPreviouslySelected ? '#888' : hasRationIssue ? '#ff6b6b' : '#555'}`,
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
                color: isSelected ? color : wasPreviouslySelected ? '#888' : hasRationIssue ? '#ff6b6b' : 'var(--text-main)',
                fontWeight: isSelected ? 'bold' : 'normal',
              }}>
                {option.name}
                {wasPreviouslySelected && !isSelected && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#888',
                    fontStyle: 'italic',
                  }}>
                    (used last rest)
                  </span>
                )}
                {/* Show ration info - either custom count (for prompt options) or fixed requirement */}
                {option.effect?.requiresRationPrompt && isSelected && customRationCounts[option.id] ? (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#fcc419',
                    fontWeight: 'normal',
                  }}>
                    🍖 ×{customRationCounts[option.id]}
                  </span>
                ) : option.effect?.requiresRationPrompt && !isSelected ? (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: hasEnoughRations ? '#fcc419' : '#ff6b6b',
                    fontWeight: 'normal',
                  }}>
                    🍖 (choose count)
                  </span>
                ) : rationRequired > 0 && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: hasEnoughRations ? '#fcc419' : '#ff6b6b',
                    fontWeight: 'normal',
                  }}>
                    🍖 {rationRequired}
                  </span>
                )}
                {/* Show temp HP - scaled if using custom ration count */}
                {option.effect?.type === 'tempHp' && option.effect.value && (
                  <span style={{ 
                    marginLeft: '6px', 
                    fontSize: '9px', 
                    color: '#4dabf7',
                    fontWeight: 'normal',
                  }}>
                    💚 +{option.effect.requiresRationPrompt && customRationCounts[option.id] 
                      ? option.effect.value * customRationCounts[option.id] 
                      : option.effect.value} temp HP
                    {option.effect.requiresRationPrompt && !isSelected && '/ration'}
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
