import React, { useState } from 'react';
import type { InjuryLocation, ConditionType } from '../types';

// Location descriptions for injury effects
const INJURY_LOCATION_EFFECTS: Record<InjuryLocation, string> = {
  limb: 'Disadvantage on STR & DEX rolls',
  torso: 'Disadvantage on STR & CON rolls',
  head: 'Disadvantage on CON, WIS & INT rolls',
};

// Injury type descriptions
const MINOR_INJURY_DESCRIPTION = 'A Minor Injury is temporary cosmetic damage with no mechanical penalty. The wound is superficial but may leave a small mark.';

const SERIOUS_INJURY_DESCRIPTION = 'A Serious Injury leaves a permanent scar with mechanical effects based on the body location affected.';

const CRITICAL_INJURY_DESCRIPTION = 'A Critical Injury leaves a large permanent scar with severe mechanical effects: disadvantage on ALL attack rolls, disadvantage on Death Saves, and HP maximum reduced by 25%.';

// Infection warning that appears on all injury prompts
const INFECTION_WARNING = '⚠️ Injuries should be treated during rests to avoid infection. If an injury goes 3+ days without rest treatment, add the Infection condition.';

interface InjuryPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  damageAmount: number;
  onApplyInjury: (injuryType: ConditionType, location?: InjuryLocation) => void;
}

type ModalStep = 'initial' | 'selectInjuryType' | 'selectLocation';

export const InjuryPromptModal: React.FC<InjuryPromptModalProps> = ({
  isOpen,
  onClose,
  damageAmount,
  onApplyInjury,
}) => {
  const [step, setStep] = useState<ModalStep>('initial');
  const [selectedInjuryType, setSelectedInjuryType] = useState<'seriousInjury' | 'criticalInjury' | null>(null);
  
  if (!isOpen) return null;
  
  const isLargeDamage = damageAmount >= 20;
  const isModerateDamage = damageAmount >= 10 && damageAmount < 20;
  
  const handleClose = () => {
    setStep('initial');
    setSelectedInjuryType(null);
    onClose();
  };
  
  const handleMinorInjuryAcknowledge = () => {
    onApplyInjury('minorInjury');
    handleClose();
  };
  
  const handleSelectInjuryType = (type: 'seriousInjury' | 'criticalInjury') => {
    setSelectedInjuryType(type);
    setStep('selectLocation');
  };
  
  const handleSelectLocation = (location: InjuryLocation) => {
    if (selectedInjuryType) {
      onApplyInjury(selectedInjuryType, location);
    }
    handleClose();
  };
  
  // Render moderate damage (10-19 HP) - Minor Injury notification
  if (isModerateDamage) {
    return (
      <>
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
          }}
        />
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(40, 40, 60, 0.98))',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #ff9632',
          zIndex: 1001,
          minWidth: '320px',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(255, 150, 50, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>🩹</span>
            <h3 style={{ 
              margin: 0, 
              color: '#ff9632', 
              fontSize: '16px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Minor Injury Received
            </h3>
          </div>
          
          <div style={{ 
            background: 'rgba(255, 150, 50, 0.1)', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 150, 50, 0.2)',
          }}>
            <div style={{ fontSize: '14px', color: '#ffb74d', fontWeight: 'bold', marginBottom: '4px' }}>
              {damageAmount} HP damage taken in one hit!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {MINOR_INJURY_DESCRIPTION}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 87, 34, 0.15)',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 87, 34, 0.3)',
          }}>
            <div style={{ fontSize: '11px', color: '#ff8a65', lineHeight: '1.4' }}>
              {INFECTION_WARNING}
            </div>
          </div>
          
          <button
            onClick={handleMinorInjuryAcknowledge}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #ff9632, #ff7043)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Apply Minor Injury
          </button>
        </div>
      </>
    );
  }
  
  // Render large damage (20+ HP) - needs d6 roll
  if (isLargeDamage) {
    // Initial step - prompt for d6 roll
    if (step === 'initial') {
      return (
        <>
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, rgba(40, 20, 20, 0.98), rgba(60, 30, 30, 0.98))',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #e53935',
            zIndex: 1001,
            minWidth: '340px',
            maxWidth: '450px',
            boxShadow: '0 8px 32px rgba(229, 57, 53, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
              <h3 style={{ 
                margin: 0, 
                color: '#e53935', 
                fontSize: '16px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Massive Damage!
              </h3>
            </div>
            
            <div style={{ 
              background: 'rgba(229, 57, 53, 0.15)', 
              padding: '14px', 
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid rgba(229, 57, 53, 0.3)',
            }}>
              <div style={{ fontSize: '14px', color: '#ef5350', fontWeight: 'bold', marginBottom: '8px' }}>
                {damageAmount} HP damage taken in one hit!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '12px' }}>
                Roll a <strong style={{ color: '#ffd54f' }}>d6</strong> to determine the injury severity:
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '10px',
                borderRadius: '6px',
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#ff9800', fontWeight: 'bold' }}>0-3:</span> Minor Injury (cosmetic damage)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#ff9800', fontWeight: 'bold' }}>4-5:</span> Serious Injury (permanent scar + location effects)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#e53935', fontWeight: 'bold' }}>6:</span> Critical Injury (severe penalties + 25% HP max reduction)
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>
              Select the injury type based on your d6 roll:
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleMinorInjuryAcknowledge}
                style={{
                  padding: '10px',
                  background: 'rgba(255, 152, 0, 0.2)',
                  color: '#ff9800',
                  border: '1px solid rgba(255, 152, 0, 0.4)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                🩹 Rolled 0-3: Minor Injury
              </button>
              <button
                onClick={() => handleSelectInjuryType('seriousInjury')}
                style={{
                  padding: '10px',
                  background: 'rgba(255, 152, 0, 0.2)',
                  color: '#ff9800',
                  border: '1px solid rgba(255, 152, 0, 0.4)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                🩸 Rolled 4-5: Serious Injury
              </button>
              <button
                onClick={() => handleSelectInjuryType('criticalInjury')}
                style={{
                  padding: '10px',
                  background: 'rgba(229, 57, 53, 0.2)',
                  color: '#e53935',
                  border: '1px solid rgba(229, 57, 53, 0.4)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                💀 Rolled 6: Critical Injury
              </button>
            </div>
          </div>
        </>
      );
    }
    
    // Select location step
    if (step === 'selectLocation' && selectedInjuryType) {
      const isCritical = selectedInjuryType === 'criticalInjury';
      const injuryColor = isCritical ? '#e53935' : '#ff9800';
      const injuryName = isCritical ? 'Critical Injury' : 'Serious Injury';
      const injuryDescription = isCritical ? CRITICAL_INJURY_DESCRIPTION : SERIOUS_INJURY_DESCRIPTION;
      
      return (
        <>
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(40, 40, 60, 0.98))',
            padding: '20px',
            borderRadius: '12px',
            border: `2px solid ${injuryColor}`,
            zIndex: 1001,
            minWidth: '320px',
            maxWidth: '420px',
            boxShadow: `0 8px 32px ${injuryColor}40`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>{isCritical ? '💀' : '🩸'}</span>
              <h3 style={{ 
                margin: 0, 
                color: injuryColor, 
                fontSize: '16px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {injuryName}
              </h3>
            </div>
            
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              lineHeight: '1.5',
              marginBottom: '16px',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
            }}>
              {injuryDescription}
            </div>
            
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: injuryColor, 
              fontSize: '12px',
              textTransform: 'uppercase',
            }}>
              Choose Injury Location
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {(['limb', 'torso', 'head'] as InjuryLocation[]).map(loc => (
                <button
                  key={loc}
                  onClick={() => handleSelectLocation(loc)}
                  style={{
                    padding: '12px',
                    background: `${injuryColor}15`,
                    border: `1px solid ${injuryColor}40`,
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '4px' }}>
                    {loc}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {INJURY_LOCATION_EFFECTS[loc]}
                  </div>
                </button>
              ))}
            </div>
            
            <div style={{
              background: 'rgba(255, 87, 34, 0.15)',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 87, 34, 0.3)',
            }}>
              <div style={{ fontSize: '11px', color: '#ff8a65', lineHeight: '1.4' }}>
                {INFECTION_WARNING}
              </div>
            </div>
            
            <button
              onClick={() => setStep('initial')}
              style={{
                width: '100%',
                padding: '8px',
                background: '#333',
                color: '#888',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              ← Back
            </button>
          </div>
        </>
      );
    }
  }
  
  return null;
};
