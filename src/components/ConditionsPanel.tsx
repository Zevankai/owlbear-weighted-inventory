import React, { useState } from 'react';
import type { CharacterConditions, ConditionType } from '../types';
import { CONDITIONS, getActiveConditions } from '../data/conditions';

interface ConditionsPanelProps {
  conditions: CharacterConditions;
  onConditionChange: (conditionType: ConditionType, value: boolean) => void;
  canEdit: boolean;
  compact?: boolean; // When true, shows only active conditions with toggle icons
}

export const ConditionsPanel: React.FC<ConditionsPanelProps> = ({
  conditions,
  onConditionChange,
  canEdit,
  compact = false,
}) => {
  const [expandedCondition, setExpandedCondition] = useState<ConditionType | null>(null);
  const activeConditions = getActiveConditions(conditions);
  const activeCount = activeConditions.length;

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
        {activeConditions.map(condition => (
          <div
            key={condition.id}
            title={`${condition.name}: ${condition.description}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: 'rgba(255, 100, 100, 0.2)',
              border: '1px solid rgba(255, 100, 100, 0.4)',
              borderRadius: '12px',
              fontSize: '10px',
              color: '#ff6b6b',
              cursor: canEdit ? 'pointer' : 'default',
            }}
            onClick={() => canEdit && onConditionChange(condition.id, false)}
          >
            <span>{condition.icon}</span>
            <span>{condition.name}</span>
            {canEdit && <span style={{ opacity: 0.6 }}>✕</span>}
          </div>
        ))}
      </div>
    );
  }

  // Full panel mode
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid var(--glass-border)',
    }}>
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

      {/* Conditions grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px',
      }}>
        {CONDITIONS.map(condition => {
          const isActive = conditions[condition.id];
          const isExpanded = expandedCondition === condition.id;
          
          return (
            <div key={condition.id}>
              {/* Condition row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  background: isActive ? 'rgba(255, 100, 100, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: isExpanded ? '4px 4px 0 0' : '4px',
                  border: `1px solid ${isActive ? 'rgba(255, 100, 100, 0.3)' : 'transparent'}`,
                  cursor: canEdit ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Toggle switch */}
                <div
                  onClick={() => canEdit && onConditionChange(condition.id, !isActive)}
                  style={{
                    width: '28px',
                    height: '16px',
                    borderRadius: '8px',
                    background: isActive ? '#ff6b6b' : '#444',
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
                
                {/* Name */}
                <span style={{
                  flex: 1,
                  fontSize: '10px',
                  color: isActive ? '#ff6b6b' : 'var(--text-main)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {condition.name}
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
                </div>
              )}
            </div>
          );
        })}
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
