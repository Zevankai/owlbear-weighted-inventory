import React, { useState, useMemo } from 'react';
import type { RestType, RestOption, RestHistory, CharacterRace, CharacterClass } from '../types';
import { getStandardRestOptions, getNonStandardRestOptions, getMaxAdditionalOptions } from '../data/restOptions';

interface RestModalProps {
  isOpen: boolean;
  onClose: () => void;
  race?: CharacterRace;
  characterClass?: CharacterClass;
  secondaryRace?: CharacterRace;
  secondaryClass?: CharacterClass;
  level?: number;
  restHistory: RestHistory;
  onRest: (restType: RestType, selectedOptionIds: string[]) => void;
  gmRestRulesMessage?: string;
  customRestOptions?: RestOption[];
  disabledRestOptionIds?: string[];
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
}) => {
  const [selectedRestType, setSelectedRestType] = useState<RestType>('short');
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  // Get standard options (auto-applied, not selectable)
  const standardOptions = useMemo(() => {
    return getStandardRestOptions(selectedRestType).filter(
      opt => !disabledRestOptionIds.includes(opt.id)
    );
  }, [selectedRestType, disabledRestOptionIds]);

  // Get non-standard options (selectable - race and class options)
  const selectableOptions = useMemo(() => {
    const defaultNonStandard = getNonStandardRestOptions(
      selectedRestType,
      race,
      characterClass,
      secondaryRace,
      secondaryClass
    );
    
    // Add custom GM options that match the rest type (treat as selectable)
    const customMatchingOptions = customRestOptions.filter(
      opt => opt.restType === selectedRestType
    );
    
    // Combine and filter out disabled options
    const allOptions = [...defaultNonStandard, ...customMatchingOptions];
    return allOptions.filter(opt => !disabledRestOptionIds.includes(opt.id));
  }, [selectedRestType, race, characterClass, secondaryRace, secondaryClass, customRestOptions, disabledRestOptionIds]);

  // Group selectable options by category
  const groupedSelectableOptions = useMemo(() => {
    const groups: Record<string, RestOption[]> = {
      race: [],
      class: [],
      custom: [],
    };
    
    selectableOptions.forEach(option => {
      if (option.category === 'race') {
        groups.race.push(option);
      } else if (option.category === 'class') {
        groups.class.push(option);
      } else {
        groups.custom.push(option);
      }
    });
    
    return groups;
  }, [selectableOptions]);

  // Get max allowed additional selections
  const maxAdditional = getMaxAdditionalOptions(selectedRestType);

  // Check if at max selections
  const isAtMaxSelections = selectedOptionIds.size >= maxAdditional;

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

  // Toggle option selection
  const toggleOption = (optionId: string) => {
    const newSet = new Set(selectedOptionIds);
    if (newSet.has(optionId)) {
      newSet.delete(optionId);
    } else {
      // Only add if not at max
      if (newSet.size < maxAdditional) {
        newSet.add(optionId);
      }
    }
    setSelectedOptionIds(newSet);
  };

  // Handle rest completion
  const handleRest = () => {
    // Include all standard option IDs + selected additional options
    const allSelectedIds = [
      ...standardOptions.map(opt => opt.id),
      ...Array.from(selectedOptionIds),
    ];
    onRest(selectedRestType, allSelectedIds);
    setSelectedOptionIds(new Set());
    onClose();
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
            onClick={() => {
              setSelectedRestType('short');
              setSelectedOptionIds(new Set());
            }}
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
              1+ hours • 1 additional option
            </div>
          </button>
          <button
            onClick={() => {
              setSelectedRestType('long');
              setSelectedOptionIds(new Set());
            }}
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
              8+ hours • 2 additional options
            </div>
          </button>
        </div>

        {/* Last Rest Info */}
        <div style={{
          display: 'flex',
          gap: '20px',
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.2)',
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          <div>
            <strong>Last Short Rest:</strong> {formatLastRest(lastShortRest?.timestamp || null)}
          </div>
          <div>
            <strong>Last Long Rest:</strong> {formatLastRest(lastLongRest?.timestamp || null)}
          </div>
        </div>

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

          {/* Standard Benefits (Auto-applied - shown as info) */}
          {standardOptions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '10px',
                color: '#51cf66',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
                borderBottom: '1px solid rgba(81, 207, 102, 0.3)',
                paddingBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                ✓ Standard Benefits (Auto-Applied)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {standardOptions.map(option => (
                  <StandardOptionDisplay 
                    key={option.id} 
                    option={option} 
                    expandedId={expandedOptionId}
                    onExpand={setExpandedOptionId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selection Info Banner */}
          <div style={{
            padding: '10px 12px',
            background: isAtMaxSelections 
              ? 'rgba(255, 107, 107, 0.1)' 
              : 'rgba(77, 171, 247, 0.1)',
            border: `1px solid ${isAtMaxSelections ? 'rgba(255, 107, 107, 0.3)' : 'rgba(77, 171, 247, 0.3)'}`,
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '11px',
            color: isAtMaxSelections ? '#ff6b6b' : '#4dabf7',
          }}>
            {isAtMaxSelections ? (
              <span>⚠️ Maximum selections reached ({maxAdditional}). Deselect an option to choose a different one.</span>
            ) : (
              <span>📋 Select {maxAdditional - selectedOptionIds.size} more additional option{maxAdditional - selectedOptionIds.size !== 1 ? 's' : ''} (max {maxAdditional} for {selectedRestType} rest)</span>
            )}
          </div>

          {/* Race Options */}
          {groupedSelectableOptions.race.length > 0 && (
            <SelectableOptionSection
              title={`${race || 'Race'} Options`}
              options={groupedSelectableOptions.race}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#fcc419"
              isAtMax={isAtMaxSelections}
            />
          )}

          {/* Class Options */}
          {groupedSelectableOptions.class.length > 0 && (
            <SelectableOptionSection
              title={`${characterClass || 'Class'} Options`}
              options={groupedSelectableOptions.class}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#4dabf7"
              isAtMax={isAtMaxSelections}
            />
          )}

          {/* Custom GM Options */}
          {groupedSelectableOptions.custom.length > 0 && (
            <SelectableOptionSection
              title="Custom Options"
              options={groupedSelectableOptions.custom}
              selectedIds={selectedOptionIds}
              expandedId={expandedOptionId}
              onToggle={toggleOption}
              onExpand={setExpandedOptionId}
              color="#c084fc"
              isAtMax={isAtMaxSelections}
            />
          )}

          {selectableOptions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}>
              No additional options available for your race/class.
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
            {standardOptions.length} standard + {selectedOptionIds.size}/{maxAdditional} additional selected
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
    </>
  );
};

// Standard Option Display (auto-applied, not selectable)
interface StandardOptionDisplayProps {
  option: RestOption;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
}

const StandardOptionDisplay: React.FC<StandardOptionDisplayProps> = ({
  option,
  expandedId,
  onExpand,
}) => {
  const isExpanded = expandedId === option.id;
  
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          background: 'rgba(81, 207, 102, 0.1)',
          border: '1px solid rgba(81, 207, 102, 0.2)',
          borderRadius: isExpanded ? '6px 6px 0 0' : '6px',
        }}
      >
        {/* Checkmark icon (always checked) */}
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          background: '#51cf66',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
        </div>
        
        {/* Option name */}
        <span style={{
          flex: 1,
          fontSize: '11px',
          color: '#51cf66',
          fontWeight: 'bold',
        }}>
          {option.name}
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
        </div>
      )}
    </div>
  );
};

// Selectable Option Section Component
interface SelectableOptionSectionProps {
  title: string;
  options: RestOption[];
  selectedIds: Set<string>;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onExpand: (id: string | null) => void;
  color: string;
  isAtMax: boolean;
}

const SelectableOptionSection: React.FC<SelectableOptionSectionProps> = ({
  title,
  options,
  selectedIds,
  expandedId,
  onToggle,
  onExpand,
  color,
  isAtMax,
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
        
        return (
          <div key={option.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: isSelected ? `${color}15` : 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${isSelected ? color : 'transparent'}`,
                borderRadius: isExpanded ? '6px 6px 0 0' : '6px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
              onClick={() => !isDisabled && onToggle(option.id)}
            >
              {/* Checkbox */}
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${isSelected ? color : '#555'}`,
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
                color: isSelected ? color : 'var(--text-main)',
                fontWeight: isSelected ? 'bold' : 'normal',
              }}>
                {option.name}
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
