import React, { useState, useMemo } from 'react';
import type { RestType, RestOption, RestHistory, CharacterRace, CharacterClass } from '../types';
import { getAvailableRestOptions } from '../data/restOptions';

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

  // Get available options based on character's race/class and rest type
  const availableOptions = useMemo(() => {
    const defaultOptions = getAvailableRestOptions(
      selectedRestType,
      race,
      characterClass,
      secondaryRace,
      secondaryClass
    );
    
    // Add custom GM options that match the rest type
    const customMatchingOptions = customRestOptions.filter(
      opt => opt.restType === selectedRestType
    );
    
    // Combine and filter out disabled options
    const allOptions = [...defaultOptions, ...customMatchingOptions];
    return allOptions.filter(opt => !disabledRestOptionIds.includes(opt.id));
  }, [selectedRestType, race, characterClass, secondaryRace, secondaryClass, customRestOptions, disabledRestOptionIds]);

  // Group options by category
  const groupedOptions = useMemo(() => {
    const groups: Record<string, RestOption[]> = {
      standard: [],
      race: [],
      class: [],
    };
    
    availableOptions.forEach(option => {
      groups[option.category].push(option);
    });
    
    return groups;
  }, [availableOptions]);

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
      newSet.add(optionId);
    }
    setSelectedOptionIds(newSet);
  };

  // Handle rest completion
  const handleRest = () => {
    onRest(selectedRestType, Array.from(selectedOptionIds));
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
        width: 'min(500px, 90vw)',
        maxHeight: 'min(700px, 85vh)',
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
              1+ hours • Spend Hit Dice
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
              8+ hours • Full recovery
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
            />
          )}

          {availableOptions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}>
              No specific options available for this rest type.
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
            {selectedOptionIds.size} option{selectedOptionIds.size !== 1 ? 's' : ''} selected
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

// Option Section Component
interface OptionSectionProps {
  title: string;
  options: RestOption[];
  selectedIds: Set<string>;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onExpand: (id: string | null) => void;
  color: string;
}

const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  options,
  selectedIds,
  expandedId,
  onToggle,
  onExpand,
  color,
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
                cursor: 'pointer',
              }}
              onClick={() => onToggle(option.id)}
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

/**
 * Create default rest history
 */
export function createDefaultRestHistory(): RestHistory {
  return {
    lastShortRest: null,
    lastLongRest: null,
    heroicInspirationGainedToday: false,
  };
}
