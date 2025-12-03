import React, { useState } from 'react';
import type { CharacterConditions, ConditionType, InjuryLocation, CharacterInjuryData } from '../types';
import { CONDITIONS, getActiveConditions, STANDARD_CONDITION_TYPES, INJURY_CONDITION_TYPES } from '../data/conditions';

interface ConditionsPanelProps {
  conditions: CharacterConditions;
  onConditionChange: (conditionType: ConditionType, value: boolean, location?: InjuryLocation) => void;
  canEdit: boolean;
  compact?: boolean; // When true, shows only active conditions with toggle icons
  injuryData?: CharacterInjuryData;
  onInjuryDataChange?: (conditionType: ConditionType, data: Partial<CharacterInjuryData[keyof CharacterInjuryData]>) => void;
}

// Location descriptions for injury effects
const INJURY_LOCATION_EFFECTS: Record<InjuryLocation, string> = {
  limb: 'Disadvantage on STR & DEX rolls',
  torso: 'Disadvantage on STR & CON rolls',
  head: 'Disadvantage on CON, WIS & INT rolls',
};

export const ConditionsPanel: React.FC<ConditionsPanelProps> = ({
  conditions,
  onConditionChange,
  canEdit,
  compact = false,
  injuryData,
  onInjuryDataChange,
}) => {
  const [expandedCondition, setExpandedCondition] = useState<ConditionType | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState<ConditionType | null>(null);
  const activeConditions = getActiveConditions(conditions);
  const activeCount = activeConditions.length;

  // Separate standard and injury conditions
  const standardConditions = CONDITIONS.filter(c => STANDARD_CONDITION_TYPES.includes(c.id));
  const injuryConditions = CONDITIONS.filter(c => INJURY_CONDITION_TYPES.includes(c.id));

  // Handle injury condition toggle - shows location picker for serious/critical
  const handleInjuryToggle = (conditionId: ConditionType, newValue: boolean) => {
    if (newValue && (conditionId === 'seriousInjury' || conditionId === 'criticalInjury')) {
      // Show location picker before enabling
      setShowLocationPicker(conditionId);
    } else {
      onConditionChange(conditionId, newValue);
    }
  };

  // Handle location selection for injury
  const handleLocationSelect = (location: InjuryLocation) => {
    if (showLocationPicker) {
      onConditionChange(showLocationPicker, true, location);
      if (onInjuryDataChange) {
        onInjuryDataChange(showLocationPicker, { injuryLocation: location });
      }
      setShowLocationPicker(null);
    }
  };

  // Compact mode: show only active conditions as badges
  if (compact) {
    if (activeCount === 0) return null;
    
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: '8px',
      }}>
        {activeConditions.map(condition => {
          const isInjury = condition.isInjury;
          const location = injuryData?.[condition.id as keyof CharacterInjuryData]?.injuryLocation;
          
          return (
            <div
              key={condition.id}
              title={`${condition.name}${location ? ` (${location})` : ''}: ${condition.description}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                background: isInjury ? 'rgba(255, 150, 50, 0.2)' : 'rgba(255, 100, 100, 0.2)',
                border: `1px solid ${isInjury ? 'rgba(255, 150, 50, 0.4)' : 'rgba(255, 100, 100, 0.4)'}`,
                borderRadius: '12px',
                fontSize: '10px',
                color: isInjury ? '#ff9632' : '#ff6b6b',
                cursor: canEdit ? 'pointer' : 'default',
              }}
              onClick={() => canEdit && onConditionChange(condition.id, false)}
            >
              <span>{condition.icon}</span>
              <span>{condition.name}{location ? ` (${location})` : ''}</span>
              {canEdit && <span style={{ opacity: 0.6 }}>✕</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // Render a single condition row
  const renderConditionRow = (condition: typeof CONDITIONS[0]) => {
    const isActive = conditions[condition.id];
    const isExpanded = expandedCondition === condition.id;
    const isInjury = condition.isInjury;
    const location = injuryData?.[condition.id as keyof CharacterInjuryData]?.injuryLocation;
    
    const activeColor = isInjury ? '#ff9632' : '#ff6b6b';
    const activeBg = isInjury ? 'rgba(255, 150, 50, 0.15)' : 'rgba(255, 100, 100, 0.15)';
    const activeBorder = isInjury ? 'rgba(255, 150, 50, 0.3)' : 'rgba(255, 100, 100, 0.3)';
    
    return (
      <div key={condition.id}>
        {/* Condition row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            background: isActive ? activeBg : 'rgba(0, 0, 0, 0.2)',
            borderRadius: isExpanded ? '4px 4px 0 0' : '4px',
            border: `1px solid ${isActive ? activeBorder : 'transparent'}`,
            cursor: canEdit ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Toggle switch */}
          <div
            onClick={() => {
              if (!canEdit) return;
              if (isInjury) {
                handleInjuryToggle(condition.id, !isActive);
              } else {
                onConditionChange(condition.id, !isActive);
              }
            }}
            style={{
              width: '28px',
              height: '16px',
              borderRadius: '8px',
              background: isActive ? activeColor : '#444',
              position: 'relative',
              cursor: canEdit ? 'pointer' : 'not-allowed',
              opacity: canEdit ? 1 : 0.6,
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: isActive ? '14px' : '2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s ease',
            }} />
          </div>
          
          {/* Icon */}
          <span style={{ fontSize: '12px', flexShrink: 0 }}>{condition.icon}</span>
          
          {/* Name and location */}
          <span style={{
            flex: 1,
            fontSize: '10px',
            color: isActive ? activeColor : 'var(--text-main)',
            fontWeight: isActive ? 'bold' : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {condition.name}
            {isActive && location && (
              <span style={{ 
                fontSize: '9px', 
                marginLeft: '4px',
                color: 'var(--text-muted)',
                textTransform: 'capitalize'
              }}>
                ({location})
              </span>
            )}
          </span>
          
          {/* Expand arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedCondition(isExpanded ? null : condition.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0',
              fontSize: '10px',
              flexShrink: 0,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▼
          </button>
        </div>
        
        {/* Expanded description */}
        {isExpanded && (
          <div style={{
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0 0 4px 4px',
            border: '1px solid var(--glass-border)',
            borderTop: 'none',
            fontSize: '9px',
            color: 'var(--text-muted)',
            lineHeight: '1.4',
          }}>
            {condition.description}
            {isActive && location && (
              <div style={{ marginTop: '4px', color: activeColor, fontWeight: 'bold' }}>
                Location: {location.charAt(0).toUpperCase() + location.slice(1)} - {INJURY_LOCATION_EFFECTS[location]}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Full panel mode
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid var(--glass-border)',
    }}>
      {/* Location Picker Modal */}
      {showLocationPicker && (
        <>
          <div
            onClick={() => setShowLocationPicker(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 20, 40, 0.98)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ff9632',
            zIndex: 1001,
            minWidth: '280px',
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#ff9632', fontSize: '12px' }}>
              Choose Injury Location
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['limb', 'torso', 'head'] as InjuryLocation[]).map(loc => (
                <button
                  key={loc}
                  onClick={() => handleLocationSelect(loc)}
                  style={{
                    padding: '10px',
                    background: 'rgba(255, 150, 50, 0.1)',
                    border: '1px solid rgba(255, 150, 50, 0.3)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{loc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {INJURY_LOCATION_EFFECTS[loc]}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLocationPicker(null)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '6px',
                background: '#333',
                border: 'none',
                borderRadius: '4px',
                color: '#888',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Header with active count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '11px',
          color: 'var(--accent-gold)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Conditions
        </h3>
        {activeCount > 0 && (
          <span style={{
            fontSize: '10px',
            color: '#ff6b6b',
            background: 'rgba(255, 100, 100, 0.2)',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            {activeCount} Active
          </span>
        )}
      </div>

      {/* Standard Conditions grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px',
        marginBottom: '12px',
      }}>
        {standardConditions.map(condition => renderConditionRow(condition))}
      </div>

      {/* Injury Conditions Section */}
      <div style={{
        borderTop: '1px solid rgba(255, 150, 50, 0.3)',
        paddingTop: '10px',
        marginTop: '8px',
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '10px',
          color: '#ff9632',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          🩹 Injuries & Infections
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '4px',
        }}>
          {injuryConditions.map(condition => renderConditionRow(condition))}
        </div>
      </div>

      {/* Help text */}
      <div style={{
        marginTop: '8px',
        fontSize: '9px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
      }}>
        Click ▼ to see condition effects
      </div>
    </div>
  );
};
