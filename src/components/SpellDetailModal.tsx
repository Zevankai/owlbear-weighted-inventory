// src/components/SpellDetailModal.tsx
import React from 'react';
import type { Spell, RepositorySpell, SpellCasterClass } from '../types';
import { getSpellSchoolColor, getSpellLevelName } from '../data/spellRepository';
import { DebouncedTextarea } from './DebouncedInput';

interface SpellDetailModalProps {
  spell: Spell | RepositorySpell;
  isFromRepository: boolean;
  onClose: () => void;
  onAddToSpellbook?: () => void;
  onUpdateNotes?: (notes: string) => void;
  canEdit: boolean;
  isAlreadyKnown?: boolean;
}

export const SpellDetailModal: React.FC<SpellDetailModalProps> = ({
  spell,
  isFromRepository,
  onClose,
  onAddToSpellbook,
  onUpdateNotes,
  canEdit,
  isAlreadyKnown = false,
}) => {
  const schoolColor = spell.school ? getSpellSchoolColor(spell.school) : '#666';
  
  // Format components display
  const formatComponents = () => {
    if (!spell.components || spell.components.length === 0) return 'None';
    
    const componentLabels = spell.components.map(c => c.toUpperCase()).join(', ');
    if (spell.material && spell.components.includes('m')) {
      return `${componentLabels} (${spell.material})`;
    }
    return componentLabels;
  };

  // Format casting time
  const formatCastingTime = () => {
    const actionTypeLabels: Record<string, string> = {
      action: '1 action',
      bonusAction: '1 bonus action',
      reaction: '1 reaction',
    };
    
    if (spell.castingTime) return spell.castingTime;
    if (spell.actionType) return actionTypeLabels[spell.actionType] || spell.actionType;
    return 'Unknown';
  };

  // Format classes list
  const formatClasses = () => {
    if (!spell.classes || spell.classes.length === 0) return 'None';
    return spell.classes
      .map((c: SpellCasterClass) => c.charAt(0).toUpperCase() + c.slice(1))
      .join(', ');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content spell-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="spell-detail-title-row">
            <h2 className="spell-detail-name">{spell.name}</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="spell-detail-subtitle">
            <span 
              className="spell-school-badge"
              style={{ backgroundColor: schoolColor }}
            >
              {spell.school ? spell.school.charAt(0).toUpperCase() + spell.school.slice(1) : 'Unknown'}
            </span>
            <span className="spell-level-text">{getSpellLevelName(spell.level)}</span>
            {spell.concentration && <span className="spell-tag concentration-tag">C</span>}
            {spell.ritual && <span className="spell-tag ritual-tag">R</span>}
          </div>
        </div>

        <div className="modal-body spell-detail-body">
          {/* Spell Properties */}
          <div className="spell-properties">
            <div className="spell-property">
              <strong>Casting Time:</strong> {formatCastingTime()}
              {spell.castingTrigger && (
                <div className="spell-trigger">{spell.castingTrigger}</div>
              )}
            </div>
            
            {spell.range && (
              <div className="spell-property">
                <strong>Range:</strong> {spell.range}
              </div>
            )}

            <div className="spell-property">
              <strong>Components:</strong> {formatComponents()}
            </div>

            {spell.duration && (
              <div className="spell-property">
                <strong>Duration:</strong> {spell.duration}
              </div>
            )}

            {spell.classes && spell.classes.length > 0 && (
              <div className="spell-property">
                <strong>Classes:</strong> {formatClasses()}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="spell-description-section">
            <h3>Description</h3>
            <p className="spell-description">{spell.description}</p>
          </div>

          {/* Cantrip Upgrade */}
          {spell.cantripUpgrade && (
            <div className="spell-upgrade-section">
              <h4>Cantrip Upgrade</h4>
              <p className="spell-upgrade-text">{spell.cantripUpgrade}</p>
            </div>
          )}

          {/* Higher Level Casting */}
          {spell.higherLevelSlot && (
            <div className="spell-upgrade-section">
              <h4>At Higher Levels</h4>
              <p className="spell-upgrade-text">{spell.higherLevelSlot}</p>
            </div>
          )}

          {/* Notes Section (only for spells in spellbook) */}
          {!isFromRepository && 'notes' in spell && (
            <div className="spell-notes-section">
              <h4>Player Notes</h4>
              {canEdit ? (
                <DebouncedTextarea
                  value={spell.notes || ''}
                  onChange={(value) => onUpdateNotes?.(value)}
                  className="spell-notes-input"
                  placeholder="Add your notes about this spell..."
                  rows={3}
                />
              ) : (
                <p className="spell-notes-display">
                  {spell.notes || <em>No notes</em>}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-footer">
          {isFromRepository && onAddToSpellbook && (
            <button
              className={`spell-action-btn ${isAlreadyKnown ? 'disabled' : 'add-to-spellbook'}`}
              onClick={() => !isAlreadyKnown && onAddToSpellbook()}
              disabled={isAlreadyKnown}
            >
              {isAlreadyKnown ? 'Already Known' : 'Add to Spellbook'}
            </button>
          )}
          <button className="spell-action-btn cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
